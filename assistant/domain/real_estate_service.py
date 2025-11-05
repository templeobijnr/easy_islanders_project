"""
STEP 7.2: Real Estate Domain Service

Provides availability snapshot queries with Redis caching.
Used for offer surface summaries in dialogue.

STEP 7.1: Slot extraction, commit, and search flow.
Prevents re-ask loops by immediately committing filled slots.
"""

from typing import Dict, Any, Optional, List, Tuple
from django.db import connection
from django.core.cache import cache
from assistant.brain.config import load_re_slots_config
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)


# =====================================================================
# STEP 7.1: Slot Extraction & Commit (No Re-Ask Loop)
# =====================================================================

def extract_slots(user_input: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extract real estate slots from user input using pattern matching.

    Args:
        user_input: Raw user message
        config: Optional RE slots config (loaded from YAML if not provided)

    Returns:
        Dict of extracted slots: {rental_type, location, budget, bedrooms, check_in, check_out}

    Example:
        >>> extract_slots("I need an apartment in Kyrenia for 500 pounds monthly")
        {"location": "Kyrenia", "budget": 500, "rental_type": "long_term"}
    """
    if config is None:
        config = load_re_slots_config()

    slots = {}
    text_lower = user_input.lower()
    patterns = config.get("patterns", {})

    # Extract rental_type
    rental_patterns = patterns.get("rental_type", {})
    st_keywords = rental_patterns.get("short_term_keywords", [])
    lt_keywords = rental_patterns.get("long_term_keywords", [])

    if any(kw in text_lower for kw in st_keywords):
        slots["rental_type"] = "short_term"
    elif any(kw in text_lower for kw in lt_keywords):
        slots["rental_type"] = "long_term"

    # Extract location (known cities)
    location_patterns = patterns.get("location", {})
    known_cities = location_patterns.get("known_cities", [])
    for city in known_cities:
        if city.lower() in text_lower:
            slots["location"] = city
            break

    # Extract budget (numbers with currency)
    budget_match = re.search(r'(\d+)\s*(pounds?|gbp|euros?|eur|€|£)', text_lower)
    if budget_match:
        slots["budget"] = int(budget_match.group(1))
        # Normalize currency
        currency_str = budget_match.group(2)
        if any(c in currency_str for c in ["pound", "gbp", "£"]):
            slots["currency"] = "GBP"
        elif any(c in currency_str for c in ["euro", "eur", "€"]):
            slots["currency"] = "EUR"

    # Extract bedrooms
    bedroom_match = re.search(r'(\d+)\s*(bedroom|bed|br)', text_lower)
    if bedroom_match:
        slots["bedrooms"] = int(bedroom_match.group(1))

    # Extract dates (check-in/check-out) - simplified pattern
    # Format: YYYY-MM-DD or DD/MM/YYYY
    date_pattern = r'\b(\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4})\b'
    dates = re.findall(date_pattern, user_input)
    if len(dates) >= 2:
        slots["check_in"] = dates[0]
        slots["check_out"] = dates[1]
    elif len(dates) == 1:
        slots["check_in"] = dates[0]

    logger.info(
        "[RE Slots] Extracted from '%s': %s",
        user_input[:50],
        slots
    )

    return slots


def merge_and_commit_slots(
    filled_slots: Dict[str, Any],
    new_slots: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Merge newly extracted slots with existing filled slots.

    Args:
        filled_slots: Previously filled slots
        new_slots: Newly extracted slots from current turn

    Returns:
        Updated filled_slots dict

    Note:
        New slots overwrite existing slots (allows refinement).
    """
    updated = {**filled_slots, **new_slots}

    logger.info(
        "[RE Slots] Merged: filled=%s + new=%s → updated=%s",
        filled_slots,
        new_slots,
        updated
    )

    return updated


def get_missing_slots(
    filled_slots: Dict[str, Any],
    required_slots: Optional[List[str]] = None
) -> List[str]:
    """
    Get list of required slots that are still missing.

    Args:
        filled_slots: Current filled slots
        required_slots: List of required slot names (default: rental_type, location, budget)

    Returns:
        List of missing slot names (in order)
    """
    if required_slots is None:
        config = load_re_slots_config()
        required_slots = config.get("required_slots", ["rental_type", "location", "budget"])

    missing = [slot for slot in required_slots if slot not in filled_slots or filled_slots[slot] is None]

    logger.debug(
        "[RE Slots] Missing check: required=%s, filled=%s, missing=%s",
        required_slots,
        list(filled_slots.keys()),
        missing
    )

    return missing


def should_execute_search(filled_slots: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Determine if we have enough slots to execute search.

    Args:
        filled_slots: Current filled slots

    Returns:
        (should_search: bool, missing_slot: Optional[str])
        - If should_search=True, all required slots are filled
        - If should_search=False, missing_slot indicates next slot to ask for
    """
    missing = get_missing_slots(filled_slots)

    if not missing:
        logger.info("[RE Slots] All required slots filled → execute search")
        return True, None

    next_slot = missing[0]
    logger.info("[RE Slots] Missing slots: %s → ask for '%s'", missing, next_slot)
    return False, next_slot


# =====================================================================
# STEP 7.2: Availability Summary (Offer Surfaces)
# =====================================================================

def _cache_key(prefix: str, filters: Dict[str, Any]) -> str:
    """
    Build normalized cache key from filters.

    Args:
        prefix: Cache key prefix (e.g., "re:availability_summary")
        filters: Filter dict with optional keys

    Returns:
        Normalized cache key string
    """
    items = [
        f"{k}:{filters.get(k)}"
        for k in sorted(filters.keys())
        if filters.get(k) not in (None, "")
    ]
    return f"{prefix}|" + "|".join(items)


def availability_summary(filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get availability summary grouped by city with min/max prices.

    STEP 7.2: Redis-cached availability snapshot for offer surfaces.

    Args:
        filters: Optional filters:
            - location: str (city name)
            - rental_type: str (short_term | long_term)
            - budget_max: int (maximum price)
            - bedrooms: int (number of bedrooms)

    Returns:
        Dict with:
            - items: List of {city, count, min, max, currency}
            - scope: {filters: {...}}

    Example:
        >>> availability_summary({"location": "Kyrenia", "budget_max": 800})
        {
            "items": [
                {"city": "Kyrenia", "count": 18, "min": 500, "max": 1200, "currency": "GBP"}
            ],
            "scope": {"filters": {"location": "Kyrenia", "budget_max": 800}}
        }
    """
    # Check cache first
    key = _cache_key("re:availability_summary", filters)
    cached = cache.get(key)
    if cached:
        logger.debug(f"[RE Offer] Cache HIT: {key}")
        return cached

    logger.debug(f"[RE Offer] Cache MISS: {key}, querying DB...")

    # Build SQL query with optional filters
    # NOTE: This assumes a 'properties' table with these columns.
    # Adjust table/column names to match your schema.
    sql = """
    SELECT city,
           COUNT(*) as count,
           MIN(price) as min_price,
           MAX(price) as max_price,
           currency
    FROM properties
    WHERE (%(location)s IS NULL OR city = %(location)s)
      AND (%(rental_type)s IS NULL OR rental_type = %(rental_type)s)
      AND (%(budget_max)s IS NULL OR price <= %(budget_max)s)
      AND (%(bedrooms)s IS NULL OR bedrooms = %(bedrooms)s)
    GROUP BY city, currency
    ORDER BY COUNT(*) DESC
    LIMIT 10;
    """

    try:
        with connection.cursor() as cur:
            cur.execute(sql, {
                "location": filters.get("location"),
                "rental_type": filters.get("rental_type"),
                "budget_max": int(filters["budget_max"]) if filters.get("budget_max") else None,
                "bedrooms": int(filters["bedrooms"]) if filters.get("bedrooms") else None,
            })
            rows = cur.fetchall()

        items = [
            {
                "city": r[0],
                "count": r[1],
                "min": r[2],
                "max": r[3],
                "currency": r[4]
            }
            for r in rows
        ]

        payload = {
            "items": items,
            "scope": {"filters": filters}
        }

        # Cache for 60 seconds (TTL from config/dialogue/real_estate.yaml)
        cache.set(key, payload, timeout=60)
        logger.info(f"[RE Offer] filters={filters} items={len(items)}")

        return payload

    except Exception as e:
        logger.error(f"[RE Offer] DB query failed: {e}", exc_info=True)
        # Return empty result on error
        return {
            "items": [],
            "scope": {"filters": filters, "error": str(e)}
        }
