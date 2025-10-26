"""Resilient crawler for Cyprus FAQ resources used in RAG bootstrap."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Dict
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup  # type: ignore
import xml.etree.ElementTree as ET
import time

from .resilient_network import (
    safe_fetch_with_cache, 
    crawl_urls_resilient, 
    load_progress, 
    save_progress
)

logger = logging.getLogger(__name__)

BASE_URL = "https://www.cyprus-faq.com"
REQUEST_TIMEOUT = 10
HEADERS = {"User-Agent": "EasyIslanders-RAG-Bot/1.0"}
ALLOWED_PREFIXES = ("/en/north/", "/en/south/")
SITEMAP_NAMESPACE = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
SITEMAP_TIMEOUT = 30
FALLBACK_MAX_PAGES = 150
EXCLUDED_ROOTS = {"news", "events", "adverts", "real-estate-market"}
MAX_REQUESTS = 2000
REQUEST_DELAY_SECONDS = 0.5
SKIPPED_LOG_PATH = Path(__file__).resolve().parent / "skipped.log"


@dataclass
class CrawlState:
    requests_made: int = 0

    def can_request(self) -> bool:
        return self.requests_made < MAX_REQUESTS

    def record_request(self) -> None:
        self.requests_made += 1


def _log_skip(url: str, reason: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        with SKIPPED_LOG_PATH.open("a", encoding="utf-8") as fh:
            fh.write(f"{timestamp}\t{reason}\t{url}\n")
    except OSError:
        logger.debug("Failed to log skip for %s", url)


def _normalize_href(href: str | None) -> str | None:
    if not href:
        return None
    href = href.strip()
    if not href or href.startswith(("#", "mailto:", "tel:")):
        return None
    parsed = urlparse(href)
    if parsed.scheme and parsed.netloc and parsed.netloc != urlparse(BASE_URL).netloc:
        return None
    path = parsed.path or "/"
    if not path.startswith(ALLOWED_PREFIXES):
        return None
    if not path.endswith("/"):
        path = f"{path}/"
    return path


def _paths_to_urls(paths: Iterable[str]) -> List[str]:
    base = BASE_URL.rstrip("/")
    return [f"{base}{path}" for path in sorted(paths)]


def _is_article_path(path: str) -> bool:
    segments = [segment for segment in path.split("/") if segment]
    if len(segments) < 4:
        return False
    slug = segments[-1]
    if slug[0].isdigit():
        return False
    if segments[2] in EXCLUDED_ROOTS:
        return False
    return "-" in slug


def _fallback_crawl_resilient() -> List[str]:
    """Resilient backup crawler when the sitemap is unavailable."""
    from collections import deque

    to_visit = deque(ALLOWED_PREFIXES)
    visited: set[str] = set()
    articles: set[str] = set()
    done_urls = load_progress()

    logger.info(f"Starting resilient fallback crawl with {len(done_urls)} already completed URLs")

    while to_visit and len(visited) < FALLBACK_MAX_PAGES:
        path = to_visit.popleft()
        if path in visited:
            continue
        visited.add(path)

        url = f"{BASE_URL}{path}"
        
        # Skip if already processed
        if url in done_urls:
            continue

        # Use resilient fetch with cache fallback
        html = safe_fetch_with_cache(url, timeout=REQUEST_TIMEOUT)
        if not html:
            logger.warning(f"Failed to fetch {url}, skipping")
            continue

        time.sleep(REQUEST_DELAY_SECONDS)

        try:
            soup = BeautifulSoup(html, "html.parser")

            for anchor in soup.select("a[href]"):
                raw_href = anchor.get("href")
                normalized = _normalize_href(raw_href)
                if not normalized:
                    if raw_href:
                        _log_skip(raw_href, "filtered_href")
                    continue
                if _is_article_path(normalized):
                    articles.add(normalized)
                    continue
                segments = [segment for segment in normalized.split("/") if segment]
                if len(segments) >= 3 and segments[2] in EXCLUDED_ROOTS:
                    _log_skip(normalized, "excluded_root")
                    continue
                if normalized not in visited and normalized not in articles:
                    to_visit.append(normalized)
        except Exception as e:
            logger.error(f"Failed to parse HTML for {url}: {e}")
            continue

    logger.info("Resilient fallback crawl discovered %d FAQ links after visiting %d pages", len(articles), len(visited))
    return _paths_to_urls(articles)


def _fetch_sitemap(url: str, session: requests.Session, state: CrawlState, depth: int = 0) -> Iterable[str]:
    if depth > 3:  # Prevent cyclical sitemap inclusion
        return []
    try:
        timeout = SITEMAP_TIMEOUT if depth == 0 else REQUEST_TIMEOUT
        if not state.can_request():
            logger.warning("Request cap reached while fetching sitemap")
            return []
        response = session.get(url, timeout=timeout)
        state.record_request()
        response.raise_for_status()
    except requests.RequestException as exc:  # pragma: no cover - network failure
        logger.error("Failed to fetch sitemap %s: %s", url, exc)
        return []
    finally:
        time.sleep(REQUEST_DELAY_SECONDS)

    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as exc:  # pragma: no cover - malformed XML
        logger.error("Failed to parse sitemap %s: %s", url, exc)
        return []

    tag = root.tag.split("}")[-1]
    if tag == "urlset":
        for loc in root.findall("sm:url/sm:loc", SITEMAP_NAMESPACE):
            if loc.text:
                yield loc.text.strip()
    elif tag == "sitemapindex":
        for child in root.findall("sm:sitemap/sm:loc", SITEMAP_NAMESPACE):
            if child.text:
                yield from _fetch_sitemap(child.text.strip(), session, state, depth + 1)


def fetch_faq_links() -> List[str]:
    """Collect FAQ article links using resilient crawling with checkpointing."""
    
    logger.info("Starting resilient FAQ link collection")
    
    # Try sitemap first (simplified version)
    sitemap_url = f"{BASE_URL}/sitemap.xml"
    html = safe_fetch_with_cache(sitemap_url, timeout=SITEMAP_TIMEOUT)
    
    if html:
        try:
            sitemap_urls = list(_parse_sitemap_xml(html))
            if sitemap_urls:
                logger.info(f"Found {len(sitemap_urls)} URLs in sitemap")
                filtered = _filter_sitemap_urls(sitemap_urls)
                if filtered:
                    logger.info(f"Filtered to {len(filtered)} FAQ URLs from sitemap")
                    return _paths_to_urls(filtered)
        except Exception as e:
            logger.warning(f"Failed to parse sitemap: {e}")
    
    # Fall back to resilient crawling
    logger.warning("Sitemap unavailable or empty; using resilient fallback crawl")
    return _fallback_crawl_resilient()


def _parse_sitemap_xml(html: str) -> Iterable[str]:
    """Parse sitemap XML and extract URLs."""
    try:
        root = ET.fromstring(html)
        for url_elem in root.findall(".//sm:url", SITEMAP_NAMESPACE):
            loc_elem = url_elem.find("sm:loc", SITEMAP_NAMESPACE)
            if loc_elem is not None and loc_elem.text:
                yield loc_elem.text
    except ET.ParseError as e:
        logger.error(f"Failed to parse sitemap XML: {e}")
        return


def _filter_sitemap_urls(urls: Iterable[str]) -> set[str]:
    """Filter sitemap URLs to only include FAQ articles."""
    filtered = set()
    base_netloc = urlparse(BASE_URL).netloc
    
    for url in urls:
        parsed = urlparse(url)
        if parsed.netloc and parsed.netloc != base_netloc:
            continue
        path = parsed.path or "/"
        if not path.startswith(ALLOWED_PREFIXES):
            continue
        segments = [segment for segment in path.split("/") if segment]
        if len(segments) < 4:  # e.g., /en/north/<category>/<question-slug>/
            continue
        if not path.endswith("/"):
            path = f"{path}/"
        filtered.add(path)
    
    return filtered


def extract_qa(link: str) -> Dict[str, str]:
    """Extract a (question, answer) pair from the given FAQ link using resilient fetching."""
    url = link if link.startswith("http") else f"{BASE_URL}{link}"
    
    # Use resilient fetch with cache fallback
    html = safe_fetch_with_cache(url, timeout=REQUEST_TIMEOUT)
    if not html:
        logger.warning(f"Failed to fetch FAQ page {url}")
        return {"question": "", "answer": "", "source": url}
    
    time.sleep(REQUEST_DELAY_SECONDS)

    try:
        soup = BeautifulSoup(html, "html.parser")
        question_tag = soup.select_one("h1")
        question = question_tag.get_text(strip=True) if question_tag else ""

        answer_text = ""
        article_tag = soup.select_one("article")
        if article_tag:
            answer_text = article_tag.get_text(" ", strip=True)
        else:
            for selector in (".answer", ".layout-text", ".content", "[itemprop='articleBody']"):
                node = soup.select_one(selector)
                if node:
                    answer_text = node.get_text(" ", strip=True)
                    break

        if question and answer_text.startswith(question):
            answer_text = answer_text[len(question):].strip()

        answer = answer_text

        if not question or not answer:
            logger.debug("FAQ page %s missing expected content", url)

        return {
            "question": question,
            "answer": answer,
            "source": url,
        }
    except Exception as e:
        logger.error(f"Failed to parse FAQ page {url}: {e}")
        return {"question": "", "answer": "", "source": url}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    urls = fetch_faq_links()
    print(f"Discovered {len(urls)} FAQ URLs")
    for preview in urls[:10]:
        print(preview)
