#!/usr/bin/env python3
"""
Recompute (or seed) domain centroids and store them in cache.

Uses OpenAI embeddings if configured; otherwise falls back to hashing BOW.
Intended for a nightly cron; logs basic progress for observability.
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Ensure repo root is on sys.path so package imports work when executed from scripts/
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Configure Django settings for standalone execution
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
try:
    import django  # type: ignore
    django.setup()
except Exception:
    # Non-fatal; cache-only path below still works without full Django init
    pass

from router_service.embedding import embed_text, set_centroids


def main():
    print(f"[{datetime.utcnow().isoformat()}] update_centroids: start")
    # Seed terms per domain (extend when exemplars available)
    seeds = {
        'real_estate': ['apartment for rent', 'villa in kyrenia', 'property listing'],
        'marketplace': ['used car for sale', 'buy electronics', 'second-hand phone'],
        'local_info': ['pharmacy near me', 'hospital in nicosia', 'doctor appointment'],
        'general_conversation': ['hello', 'hi there', 'good morning'],
    }
    centroids = {}
    for domain, phrases in seeds.items():
        vecs = [embed_text(p) for p in phrases]
        dim = max(len(v) for v in vecs) if vecs else 128
        acc = [0.0] * dim
        for v in vecs:
            for i, val in enumerate(v):
                acc[i] += float(val)
        n = float(len(vecs) or 1.0)
        centroids[domain] = [x / n for x in acc]
    set_centroids(centroids, timeout=24 * 3600)
    print(f"Seeded centroids for domains: {', '.join(centroids.keys())}")
    print(f"[{datetime.utcnow().isoformat()}] update_centroids: done")


if __name__ == "__main__":
    sys.exit(main())
