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
