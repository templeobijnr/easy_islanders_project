"""
Real Estate Agent Tools - Deterministic, bounded, audited functions.

All tools have:
- Hard caps on results/execution time
- Prometheus metrics
- No external API calls (fixtures for S2, DB for S3)
- Pure functions where possible
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from assistant.agents.real_estate.schema import (
    SearchParams,
    PropertyCard,
    QAAnswer,
    Budget,
    DateRange,
)

# Configuration
FIXTURES_PATH = Path(__file__).parent / "fixtures" / "listings.json"
MAX_RESULTS = 25
PRICE_MARGIN_PERCENT = 10  # 10% margin on max budget
BEDROOM_FLEXIBILITY = 1  # Show +1 bedroom options

# Location aliases for fuzzy matching
LOCATION_ALIASES = {
    "kyrenia": ["kyrenia", "girne", "keryneia"],
    "famagusta": ["famagusta", "magusa", "gazimagusa"],
    "nicosia": ["nicosia", "lefkosa", "lefkosia"],
}


def load_fixtures() -> list[dict[str, Any]]:
    """
    Load property listings from fixtures JSON.

    S2: Read from static JSON file
    S3: Replace with DB query (real_estate.models.Listing.objects.all())

    Returns:
        List of property dictionaries

    Metrics:
        - agent_re_fixtures_load_count (counter)
        - agent_re_fixtures_load_duration_seconds (histogram)
    """
    # TODO: Add Prometheus metrics
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        listings = json.load(f)
    return listings


def normalize_location(location: str) -> list[str]:
    """
    Normalize location to canonical form + aliases.

    Args:
        location: User-provided location (e.g., "Kyrenia", "Girne")

    Returns:
        List of equivalent location strings to search

    Examples:
        >>> normalize_location("Kyrenia")
        ["kyrenia", "girne", "keryneia"]
        >>> normalize_location("Catalkoy")
        ["catalkoy"]
    """
    location_lower = location.lower().strip()

    # Check if it's a known canonical location
    for canonical, aliases in LOCATION_ALIASES.items():
        if location_lower in aliases:
            return aliases

    # Return as-is for districts/unknown locations
    return [location_lower]


def normalize_budget(text: str) -> Budget | None:
    """
    Extract budget from natural language.

    Args:
        text: Natural language budget (e.g., "500-600 pounds", "under £800")

    Returns:
        Budget dict or None if no budget found

    Examples:
        >>> normalize_budget("500-600 pounds")
        {"min": 500, "max": 600, "currency": "GBP"}
        >>> normalize_budget("under 800 gbp")
        {"min": 0, "max": 800, "currency": "GBP"}
        >>> normalize_budget("around £150")
        {"min": 135, "max": 165, "currency": "GBP"}

    Metrics:
        - agent_re_budget_parse_total (counter, labels: success/failure)
    """
    text_lower = text.lower()

    # Currency detection
    currency = "GBP"
    if "€" in text or "eur" in text_lower:
        currency = "EUR"
    elif "$" in text or "usd" in text_lower or "dollar" in text_lower:
        currency = "USD"
    elif "₺" in text or "tl" in text_lower or "lira" in text_lower:
        currency = "TRY"

    # Look for numbers near currency symbols or budget keywords
    # Pattern: "£200", "200 pounds", "200gbp", "under 200", "200 per night"
    budget_patterns = [
        r"[£$€₺]\s*(\d+(?:,\d+)*)",  # £200, $200, etc
        r"(\d+(?:,\d+)*)\s*(?:pound|gbp|euro|eur|dollar|usd|lira|tl)",  # 200 pounds, 200gbp, etc
        r"(?:under|max|below|up to)\s+[£$€₺]?\s*(\d+(?:,\d+)*)",  # under £200, max 200
        r"(\d+(?:,\d+)*)\s+(?:per night|pn|/night)",  # 200 per night
    ]

    budget_nums = []
    for pattern in budget_patterns:
        matches = re.findall(pattern, text.lower())
        budget_nums.extend([int(m.replace(",", "")) for m in matches])

    # If we found budget-specific numbers, use those
    if budget_nums:
        nums = budget_nums
    else:
        # Fallback: extract all numbers
        text_clean = text.replace("£", " ").replace("€", " ").replace("$", " ").replace("₺", " ")
        numbers = re.findall(r"\d+(?:,\d+)*", text_clean)
        if not numbers:
            return None
        nums = [int(n.replace(",", "")) for n in numbers]

    # Range pattern: "500-600", "500 to 600"
    if len(nums) >= 2 and ("-" in text or " to " in text_lower):
        return Budget(min=nums[0], max=nums[1], currency=currency)

    # Under pattern: "under 800", "max 800"
    if "under" in text_lower or "max" in text_lower or "below" in text_lower:
        return Budget(min=0, max=nums[0], currency=currency)

    # Around pattern: "around 150", "about 150" (±10%)
    if "around" in text_lower or "about" in text_lower:
        base = nums[0]
        return Budget(
            min=int(base * 0.9),
            max=int(base * 1.1),
            currency=currency
        )

    # Single number: assume max
    return Budget(min=0, max=nums[0], currency=currency)


def parse_date_range(text: str) -> DateRange | None:
    """
    Parse date range from natural language.

    S2: Stub implementation (always returns None)
    S3: Implement with proper date parsing

    Args:
        text: Natural language date (e.g., "next week", "Jan 15-20")

    Returns:
        DateRange or None

    Examples (S3):
        >>> parse_date_range("Jan 15 to Jan 20")
        {"start": "2025-01-15", "end": "2025-01-20"}
        >>> parse_date_range("next weekend")
        {"start": "2025-11-08", "end": "2025-11-10"}
    """
    # S2: Stub - no date filtering yet
    # S3: Implement with dateutil.parser or custom logic
    return None


def check_availability(
    listing: dict[str, Any],
    date_range: DateRange | None
) -> bool:
    """
    Check if listing is available for given date range.

    S2: Stub (always returns True)
    S3: Check against listing["availability"] windows

    Args:
        listing: Property dict with "availability" field
        date_range: Requested date range or None

    Returns:
        True if available (or date_range is None)
    """
    # S2: No date filtering
    if date_range is None:
        return True

    # S3: Check if requested range overlaps with any availability window
    # availability: [{"start": "2025-01-01", "end": "2025-03-31"}, ...]
    # TODO: Implement overlap check
    return True


def search_listings(params: SearchParams) -> list[PropertyCard]:
    """
    Search property listings with intelligent filtering.

    Intelligent margins:
    - Price: +10% on max budget (500-600 → search up to 660)
    - Bedrooms: +1 bedroom (user wants 2 → show 2 or 3)
    - Location: Fuzzy match ("Kyrenia" = "Girne")

    Hard bounds:
    - Max 25 results (cap via params.max_results)
    - No external API calls
    - Deterministic ordering (price ascending)

    Args:
        params: SearchParams with optional filters

    Returns:
        List of PropertyCard dicts (max 25)

    Metrics:
        - agent_re_search_total (counter)
        - agent_re_search_results_count (histogram)
        - agent_re_search_duration_seconds (histogram)
    """
    # TODO: Add Prometheus metrics

    listings = load_fixtures()
    max_results = min(params.get("max_results", MAX_RESULTS), MAX_RESULTS)

    # Apply filters
    filtered = listings

    # Location filter (with fuzzy matching)
    if "location" in params and params["location"]:
        location_variants = normalize_location(params["location"])
        filtered = [
            lst for lst in filtered
            if lst["location"].lower() in location_variants
            or lst.get("district", "").lower() in location_variants
        ]

    # Budget filter (with 10% margin)
    if "budget" in params and params["budget"]:
        budget = params["budget"]
        max_price = budget["max"] * (1 + PRICE_MARGIN_PERCENT / 100)

        # Convert listing price if needed (S3: currency conversion)
        filtered = [
            lst for lst in filtered
            if budget["min"] <= lst["price_per_night"] <= max_price
        ]

    # Bedrooms filter (with +1 flexibility)
    if "bedrooms" in params and params["bedrooms"] is not None:
        requested_bedrooms = params["bedrooms"]
        max_bedrooms = requested_bedrooms + BEDROOM_FLEXIBILITY

        filtered = [
            lst for lst in filtered
            if requested_bedrooms <= lst["bedrooms"] <= max_bedrooms
        ]

    # Property type filter
    if "property_type" in params and params["property_type"]:
        filtered = [
            lst for lst in filtered
            if lst["property_type"] == params["property_type"]
        ]

    # Amenities filter (must have ALL requested amenities)
    if "amenities" in params and params["amenities"]:
        requested_amenities = set(params["amenities"])
        filtered = [
            lst for lst in filtered
            if requested_amenities.issubset(set(lst.get("amenities", [])))
        ]

    # Date range filter (S2: stub)
    if "date_range" in params and params["date_range"]:
        filtered = [
            lst for lst in filtered
            if check_availability(lst, params["date_range"])
        ]

    # Sort by price ascending (deterministic)
    filtered.sort(key=lambda x: x["price_per_night"])

    # Limit results
    filtered = filtered[:max_results]

    # Convert to PropertyCard format
    results = []
    for lst in filtered:
        # Format price with currency symbol
        currency_symbols = {"GBP": "£", "EUR": "€", "USD": "$", "TRY": "₺"}
        symbol = currency_symbols.get(lst["currency"], lst["currency"])
        price_str = f"{symbol}{lst['price_per_night']:.0f}"

        # Limit amenities to top 5
        amenities = lst.get("amenities", [])[:5]

        card = PropertyCard(
            id=lst["id"],
            title=lst["title"],
            location=lst["location"],
            bedrooms=lst["bedrooms"],
            bathrooms=lst["bathrooms"],
            sleeps=lst["sleeps"],
            price_per_night=price_str,
            amenities=amenities,
            photos=lst.get("photos", []),
            available=True,  # S2: always True, S3: check real availability
        )
        results.append(card)

    return results


def answer_property_qa(listing_id: str, question: str) -> QAAnswer | None:
    """
    Answer question about a specific property.

    Strategy:
    1. Load listing by ID
    2. Check if question maps to known fields (amenities, bedrooms, etc.)
    3. Return field-based answer
    4. S3: Fallback to LLM for complex questions

    Args:
        listing_id: Property ID (e.g., "prop-001")
        question: User question (e.g., "does it have a pool?")

    Returns:
        QAAnswer or None if listing not found

    Examples:
        >>> answer_property_qa("prop-002", "does it have a pool?")
        {
            "listing_id": "prop-002",
            "question": "does it have a pool?",
            "answer": "Yes, this property has a private pool.",
            "sources": ["amenities"]
        }

    Metrics:
        - agent_re_qa_total (counter, labels: success/failure)
        - agent_re_qa_field_match_total (counter, labels: field_name)
    """
    # TODO: Add Prometheus metrics

    listings = load_fixtures()

    # Find listing
    listing = next((lst for lst in listings if lst["id"] == listing_id), None)
    if not listing:
        return None

    question_lower = question.lower()

    # Known question patterns → field mapping

    # Pool question
    if "pool" in question_lower:
        has_pool = "pool" in listing.get("amenities", []) or "private_pool" in listing.get("amenities", [])
        answer = "Yes, this property has a private pool." if has_pool else "No, this property does not have a pool."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["amenities"]
        )

    # Parking question
    if "parking" in question_lower or "park" in question_lower:
        has_parking = "parking" in listing.get("amenities", [])
        answer = "Yes, parking is available." if has_parking else "No, parking is not included."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["amenities"]
        )

    # WiFi question
    if "wifi" in question_lower or "internet" in question_lower:
        has_wifi = "wifi" in listing.get("amenities", [])
        answer = "Yes, WiFi is available." if has_wifi else "No, WiFi is not included."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["amenities"]
        )

    # Air conditioning question
    if "air" in question_lower or "ac" in question_lower or "conditioning" in question_lower:
        has_ac = "air_conditioning" in listing.get("amenities", [])
        answer = "Yes, air conditioning is available." if has_ac else "No, air conditioning is not available."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["amenities"]
        )

    # Beach question
    if "beach" in question_lower:
        has_beach = "beach_access" in listing.get("amenities", []) or "sea_view" in listing.get("amenities", [])
        answer = "Yes, this property has beach access." if has_beach else "This property does not have direct beach access."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["amenities"]
        )

    # Bedroom/sleeps question
    if "bedroom" in question_lower or "sleep" in question_lower or "guest" in question_lower:
        bedrooms = listing["bedrooms"]
        sleeps = listing["sleeps"]
        answer = f"This property has {bedrooms} bedroom{'s' if bedrooms != 1 else ''} and can accommodate {sleeps} guests."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["bedrooms", "sleeps"]
        )

    # Price question
    if "price" in question_lower or "cost" in question_lower or "much" in question_lower:
        price = listing["price_per_night"]
        currency = listing["currency"]
        currency_symbols = {"GBP": "£", "EUR": "€", "USD": "$", "TRY": "₺"}
        symbol = currency_symbols.get(currency, currency)
        answer = f"This property costs {symbol}{price:.0f} per night."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["price_per_night", "currency"]
        )

    # Location question
    if "where" in question_lower or "location" in question_lower:
        location = listing["location"]
        district = listing.get("district", "")
        answer = f"This property is located in {district}, {location}." if district else f"This property is located in {location}."
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["location", "district"]
        )

    # Fallback: Use description field
    description = listing.get("description", "")
    if description:
        # S2: Simple substring check
        # S3: Use LLM to extract answer from description
        answer = f"Here's what I know: {description}"
        return QAAnswer(
            listing_id=listing_id,
            question=question,
            answer=answer,
            sources=["description"]
        )

    # No answer found
    return None


def extract_amenities(text: str) -> list[str]:
    """
    Extract amenity requirements from natural language.

    Args:
        text: Natural language amenities (e.g., "with pool and parking")

    Returns:
        List of amenity strings matching fixture format

    Examples:
        >>> extract_amenities("with pool and wifi")
        ["pool", "wifi"]
        >>> extract_amenities("needs parking and air conditioning")
        ["parking", "air_conditioning"]
    """
    text_lower = text.lower()

    # Known amenity patterns
    amenity_map = {
        "pool": ["pool", "swimming"],
        "private_pool": ["private pool"],
        "wifi": ["wifi", "internet", "wi-fi"],
        "air_conditioning": ["air conditioning", "ac", "a/c", "aircon"],
        "parking": ["parking", "garage"],
        "sea_view": ["sea view", "ocean view", "water view"],
        "beach_access": ["beach access", "beach"],
        "balcony": ["balcony", "terrace"],
        "garden": ["garden", "yard"],
        "bbq": ["bbq", "barbecue", "grill"],
        "gym": ["gym", "fitness"],
        "washing_machine": ["washing machine", "washer", "laundry"],
        "kitchenette": ["kitchenette", "kitchen"],
    }

    found_amenities = []
    for amenity, patterns in amenity_map.items():
        if any(pattern in text_lower for pattern in patterns):
            found_amenities.append(amenity)

    return found_amenities


def extract_bedrooms(text: str) -> int | None:
    """
    Extract bedroom count from natural language.

    Args:
        text: Natural language (e.g., "2 bedroom apartment", "3BR villa")

    Returns:
        Bedroom count or None

    Examples:
        >>> extract_bedrooms("2 bedroom apartment")
        2
        >>> extract_bedrooms("studio")
        0
        >>> extract_bedrooms("3BR villa")
        3
    """
    text_lower = text.lower()

    # Studio = 0 bedrooms
    if "studio" in text_lower:
        return 0

    # Pattern: "2 bedroom", "2BR", "2-bedroom", "2 bed"
    match = re.search(r"(\d+)\s*(?:bedroom|bed|br)", text_lower)
    if match:
        return int(match.group(1))

    return None


def extract_property_type(text: str) -> str | None:
    """
    Extract property type from natural language.

    Args:
        text: Natural language (e.g., "apartment in Kyrenia", "villa with pool")

    Returns:
        Property type or None (values: "apartment", "villa", "house", "studio")

    Examples:
        >>> extract_property_type("2 bedroom apartment")
        "apartment"
        >>> extract_property_type("luxury villa")
        "villa"
    """
    text_lower = text.lower()

    # Direct matches
    if "studio" in text_lower:
        return "studio"
    if "villa" in text_lower:
        return "villa"
    if "house" in text_lower:
        return "house"
    if "apartment" in text_lower or "flat" in text_lower:
        return "apartment"

    return None
