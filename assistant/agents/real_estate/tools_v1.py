"""
Real Estate Agent Tools - V1 Schema (DB-backed)

Uses the new v1 data model with vw_listings_search database view.
All tools have:
- Direct DB access via domain layer
- Hard caps on results/execution time
- Prometheus metrics
- Circuit breaker protection
"""

import logging
from typing import Any, Dict, List, Optional
from assistant.domain import search_listings_v1, format_v1_listing_for_card
from assistant.agents.real_estate.schema import SearchParams, PropertyCard

logger = logging.getLogger(__name__)

# Configuration
MAX_RESULTS = 25
PRICE_MARGIN_PERCENT = 10  # 10% margin on max budget


def map_tenure_to_listing_type(tenure: str) -> Optional[str]:
    """
    Map legacy tenure field to v1 listing_type_code.

    Args:
        tenure: "short_term" | "long_term" | "both"

    Returns:
        listing_type_code: "DAILY_RENTAL" | "LONG_TERM_RENTAL" | None
    """
    mapping = {
        "short_term": "DAILY_RENTAL",
        "long_term": "LONG_TERM_RENTAL",
        "both": None,  # No filter - show all types
    }
    return mapping.get(tenure)


def search_properties_v1(params: SearchParams) -> List[PropertyCard]:
    """
    Search property listings using v1 schema with intelligent filtering.

    This function bridges the agent's SearchParams schema to the v1 domain layer.

    Intelligent margins:
    - Price: +10% on max budget (500-600 → search up to 660)
    - Bedrooms: +1 bedroom flexibility handled by min_bedrooms filter

    Args:
        params: SearchParams with optional filters:
            - tenure: "short_term" | "long_term" | "both"
            - location: str (city or area)
            - budget: {"min": int, "max": int, "currency": str}
            - bedrooms: int
            - property_type: str
            - amenities: List[str]
            - dates: DateRange (for availability)
            - max_results: int

    Returns:
        List of PropertyCard dicts (max 25)

    Example:
        >>> search_properties_v1({
        ...     "tenure": "long_term",
        ...     "location": "Kyrenia",
        ...     "budget": {"min": 500, "max": 800, "currency": "GBP"},
        ...     "bedrooms": 2,
        ...     "amenities": ["wifi", "pool"]
        ... })
        [
            {
                "id": "123",
                "title": "2BR Apartment",
                "subtitle": "Kyrenia, Catalkoy",
                "price": "£750/mo",
                ...
            },
            ...
        ]
    """
    # Build filled_slots for domain layer
    filled_slots = {}

    # Map tenure to listing_type
    tenure = params.get("tenure", "long_term")
    listing_type = map_tenure_to_listing_type(tenure)
    if listing_type:
        filled_slots["listing_type"] = listing_type

    # Location
    if "location" in params and params["location"]:
        # v1 schema supports both city and area filters
        # For now, try location as city
        filled_slots["city"] = params["location"]

    # Budget with 10% margin
    if "budget" in params and params["budget"]:
        budget = params["budget"]
        if "min" in budget:
            filled_slots["budget_min"] = budget["min"]
        if "max" in budget:
            # Add 10% margin to max budget
            max_with_margin = int(budget["max"] * (1 + PRICE_MARGIN_PERCENT / 100))
            filled_slots["budget_max"] = max_with_margin

    # Bedrooms (use min_bedrooms for +1 flexibility)
    if "bedrooms" in params and params["bedrooms"] is not None:
        filled_slots["bedrooms"] = params["bedrooms"]

    # Property type
    if "property_type" in params and params["property_type"]:
        # Map legacy property types to v1 codes if needed
        property_type_map = {
            "apartment": "APARTMENT",
            "villa": "VILLA",
            "penthouse": "PENTHOUSE",
            "studio": "STUDIO",
        }
        pt = params["property_type"].lower()
        filled_slots["property_type"] = property_type_map.get(pt, params["property_type"].upper())

    # Amenities → feature flags
    if "amenities" in params and params["amenities"]:
        amenities = params["amenities"]
        # Map common amenities to v1 feature flags
        amenity_map = {
            "wifi": "has_wifi",
            "kitchen": "has_kitchen",
            "pool": "has_private_pool",  # Prefer private pool
            "parking": "has_parking",
            "ac": "has_air_conditioning",
            "air_conditioning": "has_air_conditioning",
            "sea_view": "view_sea",
        }
        for amenity in amenities:
            amenity_lower = amenity.lower().strip()
            if amenity_lower in amenity_map:
                filled_slots[amenity_map[amenity_lower]] = True

    # Dates → availability filters
    if "dates" in params and params["dates"]:
        dates = params["dates"]
        if "start" in dates:
            filled_slots["available_from"] = dates["start"]
        if "end" in dates:
            filled_slots["available_to"] = dates["end"]

    # Max results
    max_results = min(params.get("max_results", MAX_RESULTS), MAX_RESULTS)

    # Call domain layer
    logger.info(
        "[Agent RE Tools V1] Searching with slots: %s, max_results: %d",
        filled_slots,
        max_results
    )

    try:
        result = search_listings_v1(filled_slots, max_results=max_results)

        if result.get("error"):
            logger.error(
                "[Agent RE Tools V1] Search error: %s",
                result["error"]
            )
            return []

        # Format results for PropertyCard schema
        cards = []
        for listing in result.get("results", []):
            card = format_v1_listing_for_card(listing)
            cards.append(card)

        logger.info(
            "[Agent RE Tools V1] Found %d results (cached: %s)",
            len(cards),
            result.get("cached", False)
        )

        return cards[:max_results]  # Ensure hard cap

    except Exception as e:
        logger.error(
            "[Agent RE Tools V1] Unexpected error during search: %s",
            e,
            exc_info=True
        )
        return []


def get_property_details_v1(property_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information for a specific property.

    This is a stub for now - in S3, this would query the full property
    details including images, amenities, availability calendar, etc.

    Args:
        property_id: Listing ID

    Returns:
        Full property details dict or None if not found
    """
    # TODO: Implement with direct DB query to real_estate.models.Listing
    logger.warning(
        "[Agent RE Tools V1] get_property_details_v1 not yet implemented for ID: %s",
        property_id
    )
    return None


def answer_property_question_v1(question: str, context: Dict[str, Any]) -> str:
    """
    Answer a question about property search or specific listing.

    This is a stub for now - in S3, this would use RAG or structured
    data from the DB to answer common questions.

    Args:
        question: Natural language question
        context: Context including current search params, listings, etc.

    Returns:
        Answer string
    """
    # TODO: Implement Q&A logic
    logger.warning(
        "[Agent RE Tools V1] answer_property_question_v1 not yet implemented"
    )
    return "I don't have enough information to answer that question yet."
