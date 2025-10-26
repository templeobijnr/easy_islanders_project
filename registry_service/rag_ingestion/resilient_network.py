"""Resilient network layer for RAG ingestion pipeline."""

import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Set

import requests
from requests.adapters import HTTPAdapter, Retry

# Prometheus metrics
try:
    from prometheus_client import Counter
    CRAWL_SUCCESS = Counter("rag_crawl_success_total", "Successful page crawls")
    CRAWL_FAIL = Counter("rag_crawl_fail_total", "Failed page crawls")
    CRAWL_CACHE_HIT = Counter("rag_crawl_cache_hit_total", "Cache hits during crawl")
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    CRAWL_SUCCESS = None
    CRAWL_FAIL = None
    CRAWL_CACHE_HIT = None

logger = logging.getLogger(__name__)

# Global resilient session
session = requests.Session()
retry = Retry(
    total=5,
    backoff_factor=2,
    status_forcelist=[408, 429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST"],
)
session.mount("https://", HTTPAdapter(max_retries=retry))
session.mount("http://", HTTPAdapter(max_retries=retry))

# Checkpoint file for progress persistence
CHECKPOINT_FILE = "registry_service/rag_ingestion/checkpoint.json"
SKIPPED_LOG_FILE = "registry_service/rag_ingestion/skipped.log"


def safe_fetch(url: str, timeout: int = 10) -> Optional[str]:
    """
    Safely fetch a URL with retry logic and error handling.
    
    Args:
        url: URL to fetch
        timeout: Request timeout in seconds
        
    Returns:
        HTML content if successful, None if failed
    """
    try:
        logger.debug(f"Fetching {url}")
        response = session.get(url, timeout=timeout)
        response.raise_for_status()
        
        # Record success metric
        if PROMETHEUS_AVAILABLE and CRAWL_SUCCESS:
            CRAWL_SUCCESS.inc()
        
        return response.text
    except Exception as e:
        error_msg = f"{url}\t{type(e).__name__}\t{str(e)}"
        logger.warning(f"Failed to fetch {url}: {e}")
        
        # Record failure metric
        if PROMETHEUS_AVAILABLE and CRAWL_FAIL:
            CRAWL_FAIL.inc()
        
        # Log to skipped log file
        with open(SKIPPED_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%dT%H:%M:%S.%f%z')}\t{error_msg}\n")
        
        return None


def load_progress() -> Set[str]:
    """Load completed URLs from checkpoint file."""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Failed to load checkpoint: {e}")
    return set()


def save_progress(done_urls: Set[str]) -> None:
    """Save completed URLs to checkpoint file."""
    try:
        os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(list(done_urls), f, indent=2)
        logger.info(f"Saved progress: {len(done_urls)} URLs completed")
    except IOError as e:
        logger.error(f"Failed to save checkpoint: {e}")


def fetch_and_process_url(url: str, processor_func) -> bool:
    """
    Fetch and process a single URL.
    
    Args:
        url: URL to fetch
        processor_func: Function to process the HTML content
        
    Returns:
        True if successful, False if failed
    """
    html = safe_fetch(url)
    if not html:
        return False
    
    try:
        processor_func(html, url)
        return True
    except Exception as e:
        logger.error(f"Failed to process {url}: {e}")
        return False


def crawl_urls_resilient(urls: List[str], processor_func, max_workers: int = 5) -> Dict[str, int]:
    """
    Crawl URLs with fault tolerance, checkpointing, and parallel processing.
    
    Args:
        urls: List of URLs to crawl
        processor_func: Function to process HTML content
        max_workers: Maximum number of parallel workers
        
    Returns:
        Dictionary with success/failure counts
    """
    done_urls = load_progress()
    remaining_urls = [url for url in urls if url not in done_urls]
    
    logger.info(f"Resuming crawl: {len(done_urls)} completed, {len(remaining_urls)} remaining")
    
    success_count = len(done_urls)
    failure_count = 0
    
    # Process remaining URLs in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(fetch_and_process_url, url, processor_func): url 
            for url in remaining_urls
        }
        
        for future in as_completed(futures):
            url = futures[future]
            try:
                success = future.result()
                if success:
                    success_count += 1
                    done_urls.add(url)
                else:
                    failure_count += 1
                
                # Save progress every 20 URLs
                if len(done_urls) % 20 == 0:
                    save_progress(done_urls)
                    
            except Exception as e:
                logger.error(f"Unexpected error processing {url}: {e}")
                failure_count += 1
    
    # Final save
    save_progress(done_urls)
    
    return {
        "success": success_count,
        "failure": failure_count,
        "total": len(urls)
    }


def get_cached_content(url: str, cache_dir: str = "offline_cache") -> Optional[str]:
    """
    Get cached content from local cache directory.
    
    Args:
        url: URL to get cached content for
        cache_dir: Directory containing cached files
        
    Returns:
        Cached HTML content if available, None otherwise
    """
    try:
        # Create a safe filename from URL
        from urllib.parse import urlparse
        parsed = urlparse(url)
        slug = parsed.path.replace("/", "_").replace(":", "_")
        if not slug:
            slug = "index"
        
        cached_path = os.path.join(cache_dir, f"{slug}.html")
        if os.path.exists(cached_path):
            logger.info(f"Using cached content for {url}")
            
            # Record cache hit metric
            if PROMETHEUS_AVAILABLE and CRAWL_CACHE_HIT:
                CRAWL_CACHE_HIT.inc()
            
            with open(cached_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception as e:
        logger.warning(f"Failed to read cached content for {url}: {e}")
    
    return None


def safe_fetch_with_cache(url: str, timeout: int = 10, cache_dir: str = "offline_cache") -> Optional[str]:
    """
    Safely fetch URL with local cache fallback.
    
    Args:
        url: URL to fetch
        timeout: Request timeout
        cache_dir: Local cache directory
        
    Returns:
        HTML content from live fetch or cache
    """
    # Try live fetch first
    html = safe_fetch(url, timeout)
    if html:
        return html
    
    # Fall back to cached content
    logger.info(f"Live fetch failed for {url}, trying cache...")
    cached_html = get_cached_content(url, cache_dir)
    if cached_html:
        return cached_html
    
    logger.warning(f"No content available for {url} (live or cached)")
    return None
