from __future__ import annotations

from typing import Any, List

from pydantic import BaseModel, Field, model_validator


class HealthResponse(BaseModel):
    status: str = "ok"


class TermUpsertRequest(BaseModel):
    market_id: str = Field(..., examples=["CY-NC"])
    domain: str = Field(..., examples=["local_info"])
    base_term: str = Field(..., examples=["customs"])
    language: str = Field(..., min_length=2, max_length=5, examples=["en"])
    localized_term: str = Field(..., examples=["customs office"])
    route_target: str | None = Field(None, examples=["gov_services_agent"])
    entity_id: int | None = Field(None, examples=[123])
    monetization: dict[str, Any] | None = Field(default=None)
    metadata: dict[str, Any] | None = Field(default=None)
    embedding: List[float] | None = Field(default=None, description="Optional embedding vector override")


class TermResponse(BaseModel):
    id: int
    market_id: str
    domain: str
    base_term: str
    language: str
    localized_term: str
    route_target: str | None = None
    entity_id: int | None = None
    metadata: dict[str, Any]
    score: float | None = None


class SearchRequest(BaseModel):
    text: str = Field(..., examples=["Where is the customs office?"])
    market_id: str = Field(..., examples=["CY-NC"])
    language: str = Field(..., min_length=2, max_length=5, examples=["en"])
    domain: str | None = Field(None, examples=["local_info"])
    k: int = Field(8, ge=1, le=25)


class EmbeddingBatchRequest(BaseModel):
    ids: List[int] | None = Field(default=None, description="Existing service_term IDs to re-embed")
    texts: List[str] | None = Field(default=None, description="Ad-hoc texts to embed")

    @model_validator(mode="after")
    def _ensure_payload(self):
        ids = self.ids or []
        texts = [text for text in (self.texts or []) if text and text.strip()]
        if not ids and not texts:
            raise ValueError("either ids or texts must be provided")
        self.ids = ids or None
        self.texts = texts or None
        return self


class EmbeddingBatchItem(BaseModel):
    id: int | None = None
    status: str
    message: str | None = None


class EmbeddingBatchResponse(BaseModel):
    items: List[EmbeddingBatchItem]
    prompt_tokens: int = 0
    total_tokens: int = 0
