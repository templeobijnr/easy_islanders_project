from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import Select, select, or_
from sqlalchemy.orm import Session

from ..cache import LRUCache, hash_semantic_key
from ..config import RegistrySettings, get_settings
from ..database import get_session
from ..embeddings import EmbeddingClient
from ..models import HAS_PGVECTOR, ServiceTerm
from ..schemas import (
    EmbeddingBatchItem,
    EmbeddingBatchRequest,
    EmbeddingBatchResponse,
    HealthResponse,
    SearchRequest,
    TermResponse,
    TermUpsertRequest,
)


router = APIRouter(prefix="/v1")
logger = logging.getLogger(__name__)

try:  # noqa: WPS434 - optional dependency
    from langsmith import traceable
except Exception:  # pragma: no cover - optional dependency
    def traceable(*_args, **_kwargs):  # type: ignore
        def decorator(func):
            return func

        return decorator

try:  # noqa: WPS434 - optional dependency
    from prometheus_client import Counter, Histogram
except Exception:  # pragma: no cover - optional dependency
    Counter = Histogram = None  # type: ignore

SEARCH_LATENCY = (
    Histogram(
        "registry_terms_search_latency_seconds",
        "Histogram of /v1/terms/search latency",
        buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.0),
    )
    if Histogram
    else None
)
EMBED_REQUESTS = (
    Counter(
        "registry_embeddings_requests_total",
        "Count of embedding invocations",
        labelnames=("endpoint", "status"),
    )
    if Counter
    else None
)
FALLBACK_TEXT_COUNTER = (
    Counter(
        "registry_text_fallback_total",
        "Number of times text search fallback was used",
    )
    if Counter
    else None
)


def get_db_session():
    with get_session() as session:
        yield session


@lru_cache
def get_embedding_client() -> EmbeddingClient:
    return EmbeddingClient()


@lru_cache
def get_caches() -> tuple[LRUCache, LRUCache]:
    settings = get_settings()
    ttl = settings.cache_ttl_seconds
    return (
        LRUCache(settings.exact_cache_size, ttl_seconds=ttl),
        LRUCache(settings.semantic_cache_size, ttl_seconds=ttl),
    )


def _allowed_tokens(settings: RegistrySettings) -> set[str]:
    tokens = set(settings.api_keys)
    env_token = os.getenv("REGISTRY_API_KEY")
    if env_token:
        tokens.add(env_token)
    if not tokens:
        tokens.add("dev-key")
    return tokens


def _verify_api_key(settings: RegistrySettings, header: str | None) -> None:
    if not header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization header")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid authorization header")
    token = header.split(" ", 1)[1]
    if token not in _allowed_tokens(settings):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid API key")


def api_key_dependency(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> None:
    settings = get_settings()
    _verify_api_key(settings, authorization)


def _serialize_term(term: ServiceTerm, score: float | None) -> TermResponse:
    return TermResponse(
        id=term.id,
        market_id=term.market_id,
        domain=term.domain,
        base_term=term.base_term,
        language=term.language,
        localized_term=term.localized_term,
        route_target=term.route_target,
        entity_id=term.entity_id,
        metadata=term.meta_data or {},
        score=score,
    )


@router.get("/healthz", response_model=HealthResponse, tags=["system"])
def healthcheck() -> HealthResponse:
    return HealthResponse()


@router.post(
    "/terms/upsert",
    response_model=TermResponse,
    dependencies=[Depends(api_key_dependency)],
    tags=["terms"],
)
def upsert_term(payload: TermUpsertRequest, session: Session = Depends(get_db_session)) -> TermResponse:
    if not payload.localized_term.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="localized_term must not be blank")
    vector = payload.embedding
    embedded_at: datetime | None = None
    if vector is None:
        try:
            result = get_embedding_client().embed_texts(
                [f"{payload.market_id} {payload.domain} {payload.language} {payload.localized_term}"]
            )
            vector = result.embeddings[0] if result.embeddings else None
            if vector:
                embedded_at = datetime.now(timezone.utc)
        except RuntimeError as exc:  # pragma: no cover - external call
            logger.warning("Embedding lookup failed during upsert: %s", exc)
            vector = None

    existing: ServiceTerm | None = session.execute(
        select(ServiceTerm).where(
            ServiceTerm.market_id == payload.market_id,
            ServiceTerm.domain == payload.domain,
            ServiceTerm.language == payload.language,
            ServiceTerm.base_term == payload.base_term,
        )
    ).scalar_one_or_none()

    data_metadata = payload.metadata or {}
    data_monetization = payload.monetization or {}

    if existing:
        term = existing
        term.market_id = payload.market_id
        term.domain = payload.domain
        term.base_term = payload.base_term
        term.language = payload.language
        term.localized_term = payload.localized_term
        term.route_target = payload.route_target
        term.entity_id = payload.entity_id
        term.monetization = data_monetization
        term.meta_data = data_metadata
    else:
        term = ServiceTerm(
            market_id=payload.market_id,
            domain=payload.domain,
            base_term=payload.base_term,
            language=payload.language,
            localized_term=payload.localized_term,
            route_target=payload.route_target,
            entity_id=payload.entity_id,
            monetization=data_monetization,
        )
        term.meta_data = data_metadata
        session.add(term)

    if vector is not None:
        term.embedding = vector
        term.last_embedded_at = embedded_at or datetime.now(timezone.utc)

    # Bust caches because data changed
    exact_cache, semantic_cache = get_caches()
    exact_cache.clear()
    semantic_cache.clear()

    session.flush()
    response = _serialize_term(term, score=None)
    if EMBED_REQUESTS:
        EMBED_REQUESTS.labels(endpoint="terms.upsert", status="success").inc()
    return response


@router.post(
    "/terms/search",
    response_model=list[TermResponse],
    dependencies=[Depends(api_key_dependency)],
    tags=["terms"],
)
def search_terms(payload: SearchRequest, session: Session = Depends(get_db_session)) -> list[TermResponse]:
    start_time = time.perf_counter()
    query = payload.text.strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="text must not be blank")

    exact_cache, semantic_cache = get_caches()
    exact_key = f"{payload.market_id}:{payload.language}:{payload.domain or '*'}::{query.lower()}"
    cached_hits = exact_cache.get(exact_key)
    if cached_hits is not None:
        if SEARCH_LATENCY:
            SEARCH_LATENCY.observe(time.perf_counter() - start_time)
        return cached_hits

    # Semantic cache
    semantic_key = hash_semantic_key(
        f"{payload.market_id}:{payload.language}:{query}",
        payload.domain,
        payload.language,
    )
    cached_semantic = semantic_cache.get(semantic_key)
    if cached_semantic is not None:
        exact_cache.set(exact_key, cached_semantic)
        if SEARCH_LATENCY:
            SEARCH_LATENCY.observe(time.perf_counter() - start_time)
        return cached_semantic

    scores: list[TermResponse] = []

    vector = None
    if HAS_PGVECTOR:
        try:
            result = get_embedding_client().embed_texts([f"{payload.market_id} {payload.language} {query}"])
            vector = result.embeddings[0] if result.embeddings else None
        except RuntimeError as exc:  # pragma: no cover - external call
            logger.warning("Embedding lookup failed during search: %s", exc)
            vector = None

    seen_ids: set[int] = set()

           # Vector search disabled due to pgvector installation issues
           # if HAS_PGVECTOR and vector is not None:
           #     stmt: Select = (
           #         select(ServiceTerm, ServiceTerm.embedding.cosine_distance(vector).label("distance"))
           #         .where(
           #             ServiceTerm.market_id == payload.market_id,
           #             ServiceTerm.language == payload.language,
           #             ServiceTerm.embedding.is_not(None),
           #         )
           #     )
           #     if payload.domain:
           #         stmt = stmt.where(ServiceTerm.domain == payload.domain)
           #     stmt = stmt.order_by(ServiceTerm.embedding.cosine_distance(vector)).limit(payload.k)
           #     rows = session.execute(stmt).all()
           #     for term, distance in rows:
           #         if term.id in seen_ids:
           #             continue
           #         score = None
           #         if distance is not None:
           #             score = float(max(0.0, 1 - distance))
           #         scores.append(_serialize_term(term, score))
           #         seen_ids.add(term.id)

    used_vector = bool(scores)

    if not scores:
        stmt: Select = (
            select(ServiceTerm)
            .where(
                ServiceTerm.market_id == payload.market_id,
                ServiceTerm.language == payload.language,
                or_(
                    ServiceTerm.base_term.ilike(f"%{query}%"),
                    ServiceTerm.localized_term.ilike(f"%{query}%"),
                ),
            )
        )
        if payload.domain:
            stmt = stmt.where(ServiceTerm.domain == payload.domain)
        stmt = stmt.limit(payload.k)
        terms = session.scalars(stmt).all()
        for term in terms:
            if term.id in seen_ids:
                continue
            score = 0.8 if query.lower() in term.localized_term.lower() else 0.6
            scores.append(_serialize_term(term, score))
            seen_ids.add(term.id)
        if FALLBACK_TEXT_COUNTER and not used_vector:
            FALLBACK_TEXT_COUNTER.inc()

    semantic_cache.set(semantic_key, scores)
    exact_cache.set(exact_key, scores)

    if SEARCH_LATENCY:
        SEARCH_LATENCY.observe(time.perf_counter() - start_time)
    return scores


@router.post(
    "/embed/batch",
    response_model=EmbeddingBatchResponse,
    dependencies=[Depends(api_key_dependency)],
    tags=["embeddings"],
)
def embed_batch(payload: EmbeddingBatchRequest, session: Session = Depends(get_db_session)) -> EmbeddingBatchResponse:
    client = get_embedding_client()
    items = []
    prompt_tokens = 0
    total_tokens = 0

    if payload.ids:
        terms = (
            session.execute(select(ServiceTerm).where(ServiceTerm.id.in_(payload.ids)))
            .scalars()
            .all()
        )
        for term in terms:
            try:
                result = client.embed_texts([f"{term.market_id} {term.domain} {term.language} {term.localized_term}"])
                vector = result.embeddings[0] if result.embeddings else None
                if vector is None:
                    items.append(EmbeddingBatchItem(id=term.id, status="skipped", message="empty embedding"))
                    continue
                term.embedding = vector
                term.last_embedded_at = datetime.now(timezone.utc)
                items.append(EmbeddingBatchItem(id=term.id, status="updated"))
                prompt_tokens += result.prompt_tokens
                total_tokens += result.total_tokens
            except RuntimeError as exc:  # pragma: no cover - external call
                items.append(EmbeddingBatchItem(id=term.id, status="error", message=str(exc)))
                if EMBED_REQUESTS:
                    EMBED_REQUESTS.labels(endpoint="embed.batch", status="error").inc()

    if payload.texts:
        try:
            result = client.embed_texts(payload.texts)
            prompt_tokens += result.prompt_tokens
            total_tokens += result.total_tokens
            for idx, _vector in enumerate(result.embeddings):
                items.append(EmbeddingBatchItem(id=None, status="embedded", message=f"text_index={idx}"))
        except RuntimeError as exc:  # pragma: no cover - external call
            items.append(EmbeddingBatchItem(id=None, status="error", message=str(exc)))
            if EMBED_REQUESTS:
                EMBED_REQUESTS.labels(endpoint="embed.batch", status="error").inc()

    # Bust caches because embeddings changed
    exact_cache, semantic_cache = get_caches()
    exact_cache.clear()
    semantic_cache.clear()

    session.flush()
    if EMBED_REQUESTS and items:
        EMBED_REQUESTS.labels(endpoint="embed.batch", status="success").inc(len(items))
    return EmbeddingBatchResponse(items=items, prompt_tokens=prompt_tokens, total_tokens=total_tokens)
