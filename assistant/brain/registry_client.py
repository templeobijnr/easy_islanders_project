from __future__ import annotations

"""
Lightweight client for the registry microservice.

The registry holds multilingual domain terms (cities, entities, services) that the
agents need to normalize user queries.  This client keeps a tight HTTP surface,
adds local LRU caches to reduce round-trips, and falls back to a bundled seed
dataset when the service is offline.
"""

import json
import logging
import os
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any, Iterable

import requests

logger = logging.getLogger(__name__)


class LRUCache:
    """Simple in-memory LRU cache with optional TTL."""

    def __init__(self, maxsize: int = 256, ttl_seconds: float | None = 3600):
        self._store: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._maxsize = maxsize
        self._ttl = ttl_seconds

    def get(self, key: str) -> Any | None:
        record = self._store.get(key)
        if not record:
            return None
        ts, value = record
        if self._ttl is not None and (time.time() - ts) > self._ttl:
            self._store.pop(key, None)
            return None
        self._store.move_to_end(key)
        return value

    def set(self, key: str, value: Any) -> None:
        if key in self._store:
            self._store.pop(key, None)
        elif len(self._store) >= self._maxsize:
            self._store.popitem(last=False)
        self._store[key] = (time.time(), value)

    def clear(self) -> None:
        self._store.clear()


def _hash_key(*parts: str | None) -> str:
    """Create a stable cache key from optional string parts."""
    return "::".join(part or "*" for part in parts)


def _load_seed_terms() -> list[dict[str, Any]]:
    """
    Load built-in fallback data used when the registry service is unavailable.

    The seed JSON should stay small—just enough to keep the agent functional
    during outages.
    """
    seed_path = Path(__file__).with_name("registry_seed.json")
    if not seed_path.exists():
        return []
    try:
        return json.loads(seed_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        logger.warning("Failed to parse registry seed data; continuing without seed fallback")
        return []


class RegistryClient:
    """Thin HTTP client for the registry service with caching and fallback seed data."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout: float = 3.0,
        exact_cache_size: int = 256,
        semantic_cache_size: int = 128,
        ttl_seconds: int | None = None,
    ) -> None:
        self.base_url = base_url or os.getenv("REGISTRY_BASE_URL")
        self.api_key = api_key or os.getenv("REGISTRY_API_KEY", "dev-key")
        self.timeout = timeout
        self.default_market_id = os.getenv("REGISTRY_DEFAULT_MARKET_ID", "CY-NC")
        self.default_language = os.getenv("REGISTRY_DEFAULT_LANGUAGE", "en")
        ttl = ttl_seconds if ttl_seconds is not None else int(os.getenv("REGISTRY_CLIENT_CACHE_TTL", "3600"))
        self._session = requests.Session()
        self._exact_cache = LRUCache(maxsize=exact_cache_size, ttl_seconds=ttl)
        self._semantic_cache = LRUCache(maxsize=semantic_cache_size, ttl_seconds=ttl)
        self._seed_terms = _load_seed_terms()

    # --------------------------------------------------------------------- #
    # Public API
    # --------------------------------------------------------------------- #
    def search(
        self,
        text: str,
        market_id: str | None = None,
        language: str | None = None,
        domain: str | None = None,
        k: int = 8,
    ) -> list[dict[str, Any]]:
        """
        Retrieve the best matching terms for `text`.

        The call consults exact → semantic → HTTP cache layers before falling back
        to the seed dataset.  Results always look like registry payloads so upstream
        code does not need branches.
        """
        query = text.strip()
        if not query:
            return []

        market = market_id or self.default_market_id
        lang = (language or self.default_language).lower()

        cache_key = _hash_key(market, lang, domain, query.lower())
        cached = self._exact_cache.get(cache_key)
        if cached is not None:
            return cached

        semantic_key = _hash_key(market, lang, domain, query.lower(), "semantic")
        semantic = self._semantic_cache.get(semantic_key)
        if semantic is not None:
            self._exact_cache.set(cache_key, semantic)
            return semantic

        if self.base_url:
            try:
                response = self._session.post(
                    f"{self.base_url.rstrip('/')}/v1/terms/search",
                    json={
                        "text": query,
                        "market_id": market,
                        "language": lang,
                        "domain": domain,
                        "k": k,
                    },
                    timeout=self.timeout,
                    headers=self._headers,
                )
                response.raise_for_status()
                payload = response.json()
                hits = payload.get("hits", payload) if isinstance(payload, dict) else payload
                self._semantic_cache.set(semantic_key, hits)
                self._exact_cache.set(cache_key, hits)
                return hits
            except requests.RequestException as exc:
                logger.warning("Registry search failed, falling back to seed data: %s", exc)

        hits = self._search_seed(query, market, lang, domain, k)
        self._semantic_cache.set(semantic_key, hits)
        self._exact_cache.set(cache_key, hits)
        return hits

    def upsert(
        self,
        market_id: str,
        base_term: str,
        language: str,
        localized_term: str,
        domain: str = "local_info",
        route_target: str | None = None,
        entity_id: int | None = None,
        monetization: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
        embedding: list[float] | None = None,
    ) -> dict[str, Any]:
        """
        Persist a new or updated term to the registry.

        Raises:
            RuntimeError: when the client is operating in seed-only mode.
            requests.HTTPError: if the registry returns a non-success status.
        """
        if not self.base_url:
            raise RuntimeError("Registry base URL not configured; cannot upsert")
        payload = {
            "market_id": market_id,
            "domain": domain,
            "base_term": base_term,
            "language": language,
            "localized_term": localized_term,
            "route_target": route_target,
            "entity_id": entity_id,
            "monetization": monetization or {},
            "metadata": metadata or {},
        }
        if embedding is not None:
            payload["embedding"] = embedding
        response = self._session.post(
            f"{self.base_url.rstrip('/')}/v1/terms/upsert",
            json=payload,
            timeout=self.timeout,
            headers=self._headers,
        )
        response.raise_for_status()
        self._exact_cache.clear()
        self._semantic_cache.clear()
        return response.json()

    def embed_batch(
        self,
        ids: Iterable[int] | None = None,
        texts: Iterable[str] | None = None,
    ) -> dict[str, Any]:
        if not self.base_url:
            raise RuntimeError("Registry base URL not configured; cannot embed batch")
        payload: dict[str, Any] = {}
        if ids:
            payload["ids"] = list(ids)
        if texts:
            payload["texts"] = [text for text in texts if text and text.strip()]
        if not payload:
            raise ValueError("either ids or texts must be provided")
        response = self._session.post(
            f"{self.base_url.rstrip('/')}/v1/embed/batch",
            json=payload,
            timeout=self.timeout,
            headers=self._headers,
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @property
    def _headers(self) -> dict[str, str]:
        """Construct headers for outgoing HTTP requests, adding API key when provided."""
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _search_seed(
        self,
        query: str,
        market_id: str,
        language: str,
        domain: str | None,
        k: int,
    ) -> list[dict[str, Any]]:
        """Approximate vector search on the bundled seed dataset."""
        if not self._seed_terms:
            return []
        hits: list[tuple[float, dict[str, Any]]] = []
        normalized_query = query.lower()
        for entry in self._seed_terms:
            if entry.get("market_id") and entry.get("market_id") != market_id:
                continue
            if entry.get("language") and entry.get("language").lower() != language:
                continue
            if domain and entry.get("domain") != domain:
                continue
            localized = entry.get("localized_term", "")
            base_term = entry.get("base_term", "")
            score = 0.0
            if localized.lower() == normalized_query or base_term.lower() == normalized_query:
                score = 1.0
            elif normalized_query in localized.lower():
                score = 0.8
            elif normalized_query in base_term.lower():
                score = 0.6
            if score > 0:
                hits.append((score, entry))
        hits.sort(key=lambda item: item[0], reverse=True)
        return [self._format_seed(entry, score) for score, entry in hits[:k]]

    @staticmethod
    def _format_seed(entry: dict[str, Any], score: float) -> dict[str, Any]:
        """Normalize seed entries to match registry payload schema."""
        return {
            "id": entry.get("id") or -1,
            "market_id": entry.get("market_id"),
            "domain": entry.get("domain"),
            "base_term": entry.get("base_term"),
            "language": entry.get("language"),
            "localized_term": entry.get("localized_term"),
            "route_target": entry.get("route_target"),
            "entity_id": entry.get("entity_id"),
            "metadata": entry.get("metadata", {}),
            "score": score,
        }
