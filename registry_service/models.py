from datetime import datetime

try:
    from pgvector.sqlalchemy import Vector

    HAS_PGVECTOR = True
except ImportError:  # pragma: no cover - optional dependency
    Vector = None
    HAS_PGVECTOR = False

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    JSON,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

EMBEDDING_DIM = 1536


class LocalEntity(Base):
    """Local entity registry (e.g., service providers, locations)."""

    __tablename__ = "local_entities"
    __table_args__ = (
        Index("le_idx_market_cat_city", "market_id", "category", "city"),
        Index("le_idx_geo", "latitude", "longitude"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    market_id: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    subcategory: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    localized_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    last_verified: Mapped[datetime | None] = mapped_column(nullable=True)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)

    terms: Mapped[list["ServiceTerm"]] = relationship(back_populates="entity")


class ServiceTerm(Base):
    """Persistent registry of localized domain terms and aliases."""

    __tablename__ = "service_terms"
    __table_args__ = (
        UniqueConstraint(
            "market_id",
            "domain",
            "language",
            "base_term",
            name="uq_service_terms_market_base",
        ),
        UniqueConstraint(
            "market_id",
            "domain",
            "language",
            "localized_term",
            name="uq_service_terms_market_localized",
        ),
        Index("st_idx_market_domain_lang", "market_id", "domain", "language"),
        Index("st_idx_base_term", "base_term"),
        Index("st_idx_route_target", "route_target"),
        CheckConstraint("char_length(language) = 2", name="ck_service_terms_language_iso"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    market_id: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(Text, nullable=False)
    base_term: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False)
    localized_term: Mapped[str] = mapped_column(Text, nullable=False)
    route_target: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_id: Mapped[int | None] = mapped_column(
        ForeignKey("local_entities.id", ondelete="SET NULL"),
        nullable=True,
    )
    monetization: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    if HAS_PGVECTOR:
        embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)
    else:  # pragma: no cover - fallback for environments without pgvector
        embedding: Mapped[list[float] | None] = mapped_column(JSON, default=list, nullable=True)
    last_embedded_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)

    entity: Mapped[LocalEntity | None] = relationship(back_populates="terms")

if HAS_PGVECTOR:
    Index(
        "st_idx_embedding",
        ServiceTerm.__table__.c.embedding,
        postgresql_using="ivfflat",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
