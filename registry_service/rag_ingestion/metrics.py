"""Prometheus metrics for the RAG ingestion pipeline."""

from __future__ import annotations

from prometheus_client import Counter, Histogram  # type: ignore


RAG_INGESTION_DOCS_TOTAL = Counter(
    "rag_ingestion_docs_total",
    "Total number of documents processed by the RAG ingestion pipeline",
    labelnames=("source",),
)

RAG_INGESTION_DURATION_SECONDS = Histogram(
    "rag_ingestion_duration_seconds",
    "Total runtime of the RAG ingestion job",
)

EMBEDDING_LATENCY_MS = Histogram(
    "embedding_latency_ms",
    "Latency of embedding API calls in milliseconds",
    buckets=(25, 50, 100, 200, 400, 800, 1600),
)


def record_docs(source: str, count: int) -> None:
    if count:
        RAG_INGESTION_DOCS_TOTAL.labels(source=source).inc(count)


def observe_ingestion_duration(seconds: float) -> None:
    RAG_INGESTION_DURATION_SECONDS.observe(max(seconds, 0.0))


def observe_embedding_latency(milliseconds: float) -> None:
    EMBEDDING_LATENCY_MS.observe(max(milliseconds, 0.0))
