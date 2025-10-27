# assistant/caching/__init__.py
"""
Caching utilities for agent degraded-mode responses.

Exports simple helpers backed by Django cache. Advanced classes from
earlier iterations (ResponseCache, CacheStrategy, SemanticCache) are not
required for current usage and intentionally omitted to avoid import errors.
"""

from .response_cache import (
    get_fallback_response,
    set_fallback_response,
    prompt_hash,
)

__all__ = [
    "get_fallback_response",
    "set_fallback_response",
    "prompt_hash",
]





