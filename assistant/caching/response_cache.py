from __future__ import annotations

import hashlib
from typing import Optional

try:
    from django.core.cache import cache  # type: ignore
    _CACHE_AVAILABLE = True
except Exception:  # pragma: no cover
    cache = None
    _CACHE_AVAILABLE = False

_FALLBACK_TTL = 900  # 15 minutes


def _key(prompt_hash: str) -> str:
    return f"cache:fallback:{prompt_hash}"


def prompt_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def set_fallback_response(prompt_hash: str, response: str, ttl: int = _FALLBACK_TTL) -> None:
    if not _CACHE_AVAILABLE:
        return
    try:
        cache.set(_key(prompt_hash), response, timeout=ttl)
    except Exception:
        pass


def get_fallback_response(prompt_hash: str) -> Optional[str]:
    if not _CACHE_AVAILABLE:
        return None
    try:
        return cache.get(_key(prompt_hash))
    except Exception:
        return None

