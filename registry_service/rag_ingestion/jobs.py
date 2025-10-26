"""Celery orchestration for the RAG bootstrap pipeline."""

from __future__ import annotations

import logging
import time
from typing import List, Dict, Any

from celery import shared_task

from ..database import get_session
from ..models import ServiceTerm, LocalEntity
from .crawl_cyprus_faq import fetch_faq_links, extract_qa
from .preprocess import build_docs, clean_text
from .dedupe import dedupe_docs
from .embed_upload import embed_and_upload
from .metrics import observe_ingestion_duration, record_docs

logger = logging.getLogger(__name__)


def _load_service_terms() -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    with get_session() as session:
        terms = session.query(ServiceTerm).filter(ServiceTerm.market_id == "CY-NC").all()
        for term in terms:
            description = term.meta_data.get("description") if isinstance(term.meta_data, dict) else ""
            text = clean_text(
                f"Service term {term.localized_term}. Base term {term.base_term}. Domain {term.domain}. {description}"
            )
            if not text:
                continue
            docs.append(
                {
                    "text": text,
                    "metadata": {
                        "source": "registry_service_terms",
                        "type": "registry_term",
                        "domain": term.domain,
                        "language": term.language,
                        "market_id": term.market_id,
                        "base_term": term.base_term,
                        "localized_term": term.localized_term,
                    },
                }
            )
    record_docs("service_terms", len(docs))
    return docs


def _load_local_entities() -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    with get_session() as session:
        entities = session.query(LocalEntity).filter(LocalEntity.market_id == "CY-NC").all()
        for entity in entities:
            fields = [
                entity.name,
                entity.category,
                entity.city,
                entity.address or "",
                entity.phone or "",
                entity.website or "",
            ]
            text = clean_text("; ".join(filter(None, fields)))
            if not text:
                continue
            docs.append(
                {
                    "text": text,
                    "metadata": {
                        "source": "registry_local_entities",
                        "type": "entity_profile",
                        "domain": entity.category or "gov_services",
                        "language": "en",
                        "market_id": entity.market_id,
                    },
                }
            )
    record_docs("local_entities", len(docs))
    return docs


def _load_faq_docs() -> List[Dict[str, Any]]:
    links = fetch_faq_links()
    logger.info("Discovered %d FAQ URLs", len(links))
    record_docs("cyprus_faq_urls", len(links))
    raw_qa = [extract_qa(link) for link in links]
    docs = build_docs(
        {
            "question": qa.get("question", ""),
            "answer": qa.get("answer", ""),
            "source": qa.get("source"),
            "type": "faq",
            "domain": "gov_services",
            "language": "en",
        }
        for qa in raw_qa
        if qa.get("question") and qa.get("answer")
    )
    record_docs("cyprus_faq", len(docs))
    return docs


def run_pipeline() -> Dict[str, Any]:
    """Execute the RAG ingestion pipeline synchronously."""
    # Enable debug logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    start_time = time.perf_counter()
    logger.info("Starting RAG ingestion pipeline")

    faq_docs = _load_faq_docs()
    term_docs = _load_service_terms()
    entity_docs = _load_local_entities()

    combined = faq_docs + term_docs + entity_docs
    if not combined:
        logger.warning("No documents collected for ingestion")
        return {"ingested": 0, "deduped": 0, "uploaded": 0}

    record_docs("combined", len(combined))
    deduped = dedupe_docs(combined)
    logger.info("Deduped %d -> %d documents", len(combined), len(deduped))
    record_docs("deduped", len(deduped))

    uploaded = embed_and_upload(deduped)
    record_docs("uploaded", uploaded)
    duration = time.perf_counter() - start_time
    observe_ingestion_duration(duration)
    logger.info("RAG ingestion finished: uploaded %d docs in %.2fs", uploaded, duration)

    return {
        "ingested": len(combined),
        "deduped": len(deduped),
        "uploaded": uploaded,
        "duration_seconds": duration,
    }


@shared_task(name="registry_service.rag_ingestion.jobs.run_rag_ingestion")
def run_rag_ingestion() -> Dict[str, Any]:
    """Celery wrapper that runs the pipeline and returns a summary."""
    try:
        return run_pipeline()
    except Exception as exc:  # pragma: no cover - operational failure
        logger.exception("RAG ingestion failed: %s", exc)
        raise
