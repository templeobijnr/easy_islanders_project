from __future__ import annotations

import hashlib
import json
import time
from collections import OrderedDict
from threading import RLock
from typing import Any, Callable, Optional


class LRUCache:
    """Simple thread-safe LRU cache with optional TTL."""

    def __init__(self, maxsize: int = 256, ttl_seconds: float | None = None):
        self.maxsize = maxsize
        self.ttl_seconds = ttl_seconds
        self._store: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._lock = RLock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            record = self._store.get(key)
            if not record:
                return None
            ts, value = record
            if self.ttl_seconds is not None and (time.time() - ts) > self.ttl_seconds:
                # Expired
                self._store.pop(key, None)
                return None
            self._store.move_to_end(key)
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            if key in self._store:
                self._store.pop(key, None)
            elif len(self._store) >= self.maxsize:
                self._store.popitem(last=False)
            self._store[key] = (time.time(), value)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


def hash_semantic_key(text: str, domain: str | None, language: str | None) -> str:
    payload = json.dumps({"text": text, "domain": domain, "language": language}, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def cached_call(cache: LRUCache, key_fn: Callable[[], str], loader: Callable[[], Any]) -> Any:
    key = key_fn()
    cached_value = cache.get(key)
    if cached_value is not None:
        return cached_value
    value = loader()
    cache.set(key, value)
    return value
