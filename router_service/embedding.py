from __future__ import annotations

"""
Lightweight embedding + centroid utilities.

Prefers OpenAI embeddings if OPENAI_API_KEY is set; otherwise falls back to a
deterministic hashing bag-of-words embedding. Centroids are stored in Django
cache under a known key and can be recomputed via scripts/update_centroids.py.
"""

import hashlib
import math
import os
from typing import Dict, List

from django.core.cache import cache

DEFAULT_DIM = 128
CENTROIDS_CACHE_KEY = "router:centroids:v1"


def _hash_vec(text: str, dim: int = DEFAULT_DIM) -> List[float]:
    tokens = [t for t in text.lower().split() if t]
    vec = [0.0] * dim
    for tok in tokens:
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed_text(text: str) -> List[float]:
    """
    Generate text embedding using OpenAI API or fallback to hash-based embedding.
    
    ISSUE-009 FIX: Improved error handling with logging and metrics.
    """
    # Optional OpenAI embedding
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:  # defer import
        try:
            from openai import OpenAI  # type: ignore

            client = OpenAI(api_key=api_key)
            model = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
            resp = client.embeddings.create(model=model, input=text or " ")
            return list(resp.data[0].embedding)
        except ImportError as e:
            # OpenAI package not installed
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"OpenAI package not installed: {e}. Falling back to hash embedding.")
        except Exception as e:
            # API error, quota exceeded, network issue, etc.
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"OpenAI embedding failed (falling back to hash): {e}", 
                exc_info=True,
                extra={'error_type': type(e).__name__}
            )
            # TODO: Increment error metric for monitoring
            # from assistant.monitoring.metrics import inc_embedding_error
            # inc_embedding_error(error_type=type(e).__name__)
    return _hash_vec(text)


def cosine(a: List[float], b: List[float]) -> float:
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    dot = sum(a[i] * b[i] for i in range(n))
    na = math.sqrt(sum(x * x for x in a[:n])) or 1.0
    nb = math.sqrt(sum(x * x for x in b[:n])) or 1.0
    return dot / (na * nb)


def get_centroids() -> Dict[str, List[float]]:
    return cache.get(CENTROIDS_CACHE_KEY) or {}


def set_centroids(centroids: Dict[str, List[float]], timeout: int = 3600) -> None:
    cache.set(CENTROIDS_CACHE_KEY, centroids, timeout=timeout)

