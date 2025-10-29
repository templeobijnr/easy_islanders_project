#!/usr/bin/env python3
from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path
from time import perf_counter

# Ensure repo root on sys.path
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
try:
    import django  # type: ignore
    django.setup()
except Exception:
    pass

from router_service.graph import run_router  # type: ignore
from router_service.embedding import get_centroids, set_centroids, embed_text  # type: ignore


def seed_centroids_if_missing() -> None:
    if get_centroids():
        return
    seeds = {
        'real_estate': ['apartment for rent', 'villa in kyrenia', 'property listing'],
        'marketplace': ['used car for sale', 'buy electronics', 'second-hand phone'],
        'local_info': ['pharmacy near me', 'hospital in nicosia', 'doctor appointment'],
        'general_conversation': ['hello', 'hi there', 'good morning'],
    }
    centroids = {}
    for domain, phrases in seeds.items():
        vecs = [embed_text(p) for p in phrases]
        dim = max(len(v) for v in vecs)
        acc = [0.0] * dim
        for v in vecs:
            for i, val in enumerate(v):
                acc[i] += float(val)
        n = float(len(vecs) or 1.0)
        centroids[domain] = [x / n for x in acc]
    set_centroids(centroids, timeout=3600)


def p95(values: list[float]) -> float:
    if not values:
        return 0.0
    return statistics.quantiles(values, n=100)[94]


def main(argv: list[str]) -> int:
    corpus_path = None
    if len(argv) >= 2 and argv[1] in ("-c", "--corpus"):
        corpus_path = Path(argv[2])
    if corpus_path is None:
        corpus_path = REPO_ROOT / "scripts" / "router_eval_corpus.json"
    data = json.loads(Path(corpus_path).read_text(encoding="utf-8"))

    seed_centroids_if_missing()

    results = []
    latencies = []
    ece_values = []
    uncertain_count = 0

    for row in data:
        utt = row["utterance"]
        expected = row["expected_domain"]
        t0 = perf_counter()
        d = run_router(utt, thread_id="eval")
        elapsed = perf_counter() - t0
        latencies.append(elapsed)

        domain_choice = d.get("domain_choice") or {}
        pred = domain_choice.get("domain")
        confidence = domain_choice.get("confidence", 0.0)
        calibrated = domain_choice.get("calibrated", confidence)
        action = d.get("action", "dispatch")

        # Track accuracy
        correct = pred == expected
        results.append(correct)

        # Track calibration error (simplified)
        ece_values.append(abs(calibrated - (1.0 if correct else 0.0)))

        # Track uncertainty
        if action == "clarify":
            uncertain_count += 1

        # Emit metrics if available
        try:
            from assistant.monitoring.metrics import (
                observe_router_confidence,
                inc_router_accuracy,
                observe_router_latency
            )
            observe_router_confidence(pred or "unknown", calibrated)
            inc_router_accuracy(pred or "unknown", correct)
            observe_router_latency(pred or "unknown", elapsed)
        except ImportError:
            pass

    accuracy = sum(1 for r in results if r) / float(len(results) or 1)
    p95_latency = p95(latencies)
    avg_ece = sum(ece_values) / len(ece_values) if ece_values else 0.0
    uncertain_ratio = uncertain_count / float(len(results) or 1)

    print(f"router-eval: accuracy={accuracy:.3f} p95={p95_latency*1000:.1f}ms ECE={avg_ece:.3f} uncertain={uncertain_ratio:.3f}")

    # Updated thresholds for Sprint 5
    acc_ok = accuracy >= 0.92
    p95_ok = p95_latency <= 0.12  # 120ms
    ece_ok = avg_ece <= 0.05

    success = acc_ok and p95_ok and ece_ok
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

