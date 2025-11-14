"""
Real Estate Agent - Structured types and schemas.

Frozen for S2 - any changes require version bump.
Version: 1.0.0
"""

from typing import TypedDict, Literal, NotRequired
from datetime import date
from decimal import Decimal


class DateRange(TypedDict):
    """Date range for availability checks."""
    check_in: date
    check_out: date
    nights: int


class Budget(TypedDict):
    """Budget constraints."""
    min_price: Decimal | None
    max_price: Decimal | None
    currency: Literal['EUR', 'GBP', 'USD']


class SearchParams(TypedDict, total=False):
    """
    Parameters for property search.

    All fields optional - policy fills missing with defaults.
    """
    tenure: Literal['short_term', 'long_term']
    location: str  # "Kyrenia", "Girne", "Catalkoy"
    date_range: DateRange
    bedrooms: int
    budget: Budget
    property_type: Literal['apartment', 'villa', 'house', 'studio'] | None
    amenities: list[str]  # ['pool', 'wifi', 'parking']
    max_results: int


class PropertyCard(TypedDict):
    """
    Property card for frontend display.

    This is the schema validated before WS emit.
    """
    id: str  # listing UUID
    title: str
    location: str
    bedrooms: int
    bathrooms: int
    sleeps: int
    price_per_night: str  # e.g., "£150"
    amenities: list[str]  # max 5 key amenities
    photos: list[str]  # URLs
    available: bool  # for given date_range


class QAAnswer(TypedDict):
    """Property Q&A answer."""
    listing_id: str
    question: str
    answer: str
    sources: list[str]  # field names or 'description'


class Clarification(TypedDict):
    """Missing information for slot-filling."""
    missing: list[Literal['location', 'check_in', 'check_out', 'budget', 'bedrooms']]
    prompt: str  # e.g., "Where would you like to stay?"


# Action payload types (for AgentAction.params)

class ShowListingsParams(TypedDict):
    """Params for show_listings action."""
    properties: list[PropertyCard]
    search_summary: str  # e.g., "3 properties in Kyrenia, £100-200/night"


class AskClarificationParams(TypedDict):
    """Params for ask_clarification action."""
    clarification: Clarification


class AnswerQAParams(TypedDict):
    """Params for answer_qa action."""
    qa_answer: QAAnswer


class ErrorParams(TypedDict):
    """Params for error action."""
    error_code: str
    error_message: str


# =============================================================================
# RecItem - Canonical Recommendation Card Schema (v1)
# =============================================================================
# ⚠️ RecItem v1 — DO NOT RENAME/REMOVE FIELDS WITHOUT A VERSION BUMP
# Synced with frontend/src/types/recItem.ts
# See docs/RECITEM_CONTRACT.md for versioning policy
# =============================================================================

class RecItemMetadata(TypedDict, total=False):
    """
    Extended metadata for RecItem.
    Used in info modals and detailed views.
    """
    bedrooms: int
    bathrooms: int
    amenities: list[str]  # Full amenities/features list
    sqm: int  # Total area in square meters
    description: str  # Full property description
    rent_type: Literal['daily', 'long_term', 'sale', 'project']
    contactInfo: dict  # {phone?: str, email?: str, website?: str}
    location: str  # Additional location info


class RecItem(TypedDict, total=False):
    """
    Canonical recommendation card item schema.

    This is the single source of truth for all real estate recommendation cards
    from the AI agent. Every property search result (daily rental, long-term,
    sale, project) must be serialized as a RecItem.

    Wire format: WebSocket message.recommendations = List[RecItem]

    Components consuming this:
    - RecommendationCard (generic card)
    - ShortTermRecommendationCard (enhanced card for daily rentals)
    """
    id: str  # Required: Listing ID (maps to Listing.id)
    title: str  # Required: Main title (e.g., "2+1 Sea View Apartment")
    subtitle: str  # Optional subtitle (e.g., "Near Long Beach · İskele")
    reason: str  # Legacy reason field (backwards compatibility)
    price: str  # Formatted price string (e.g., "£750 / month", "€120 / night")
    rating: float  # Rating out of 5 (e.g., 4.5)
    distanceMins: int  # Distance in minutes (e.g., 12)
    badges: list[str]  # Short curated badges (3-6 items, e.g., ["WiFi", "Pool", "Sea View"])
    imageUrl: str  # Hero image URL
    area: str  # Short area label (e.g., "Kyrenia · Catalkoy")
    galleryImages: list[str]  # Gallery image URLs for photo viewer
    metadata: RecItemMetadata  # Extended metadata for detailed views
