"""Embedding and upload helpers for the RAG ingestion pipeline."""

from __future__ import annotations

import logging
import os
import time
from typing import Iterable, Dict, Any

import requests
from openai import OpenAI  # type: ignore

from .metrics import observe_embedding_latency, record_docs

logger = logging.getLogger(__name__)

DEFAULT_MARKET_ID = "CY-NC"
DEFAULT_LANGUAGE = "en"


def _openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)


def embed_and_upload(
    docs: Iterable[Dict[str, Any]],
    *,
    market_id: str = DEFAULT_MARKET_ID,
    language: str = DEFAULT_LANGUAGE,
) -> int:
    """Embed documents and upsert them into the registry API."""

    doc_list = list(docs)
    if not doc_list:
        logger.info("No documents to ingest")
        return 0

    record_docs("pipeline", len(doc_list))

    client = _openai_client()
    texts = [str(doc["text"]) for doc in doc_list]

    # Limit batch size to prevent hanging
    BATCH_SIZE = 128
    all_vectors = []
    
    logger.info("Embedding %d documents using model=%s", len(texts), os.getenv('EMBEDDING_MODEL', 'text-embedding-3-large'))
    
    # Process in batches to prevent hanging
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        logger.info(f"Processing batch {i//BATCH_SIZE + 1}/{(len(texts) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} docs)")
        
        # Retry logic with timeout
        embeddings_response = None
        for attempt in range(3):
            try:
                logger.info(f"Embedding attempt {attempt+1}/3 for batch {i//BATCH_SIZE + 1}")
                start = time.perf_counter()
                embeddings_response = client.embeddings.create(
                    model="text-embedding-3-large",
                    input=batch,
                    timeout=30,
                )
                latency_ms = (time.perf_counter() - start) * 1000
                observe_embedding_latency(latency_ms)
                logger.info(f"Batch {i//BATCH_SIZE + 1} embedded successfully in {latency_ms:.1f}ms")
                break
            except Exception as e:
                logger.warning(f"Embedding attempt {attempt+1} failed for batch {i//BATCH_SIZE + 1}: {e}")
                if attempt < 2:  # Don't sleep on last attempt
                    time.sleep(5 * (2 ** attempt))  # Exponential backoff
                else:
                    raise
        
        if embeddings_response is None:
            raise RuntimeError(f"Failed to embed batch {i//BATCH_SIZE + 1} after 3 attempts")
        
        batch_vectors = [item.embedding for item in embeddings_response.data]
        all_vectors.extend(batch_vectors)

    vectors = all_vectors

    registry_url = os.getenv("REGISTRY_URL", "http://localhost:8081")
    api_key = os.getenv("REGISTRY_API_KEY")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    successes = 0
    for doc, embedding in zip(doc_list, vectors):
        metadata = dict(doc.get("metadata", {}))
        base_term = metadata.get("base_term", metadata.get("type", "faq"))
        localized_term = metadata.get("localized_term", doc["text"][:200])
        payload = {
            "market_id": metadata.get("market_id", market_id),
            "domain": metadata.get("domain", "gov_services"),
            "base_term": base_term,
            "language": metadata.get("language", language),
            "localized_term": localized_term,
            "metadata": metadata,
            "embedding": embedding,
        }

        try:
            response = requests.post(
                f"{registry_url}/v1/terms/upsert",
                json=payload,
                headers=headers,
                timeout=15,
            )
            response.raise_for_status()
            successes += 1
        except requests.RequestException as exc:  # pragma: no cover - network failure
            logger.error("Failed to upsert document from %s: %s", metadata.get("source"), exc)

    logger.info("Successfully ingested %d/%d documents", successes, len(doc_list))
    return successes
