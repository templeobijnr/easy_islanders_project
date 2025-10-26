"""RAG ingestion pipeline bootstrap utilities."""

# Import the Celery task so it is registered on startup
from .jobs import run_rag_ingestion  # noqa: F401

__all__ = ["run_rag_ingestion"]
