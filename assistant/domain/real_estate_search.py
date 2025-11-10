"""
Real Estate Search Adapter

Provides typed interface to the /api/v1/real_estate/search backend.
Maps slot values to API query parameters and returns normalized results.

STEP 7.3: Hardened with timeout, circuit breaker, and caching.
"""

from typing import Dict, Any, List, Optional
import requests
import logging
import os
import time
import hashlib
import json
from django.conf import settings
from django.core.cache import cache
from assistant.brain.circuit_breaker import get_backend_search_breaker, CircuitBreakerOpen, CircuitBreakerConfig
from assistant.brain.metrics import record_search_duration, record_error, set_circuit_breaker_state

logger = logging.getLogger(__name__)

# Default to localhost for development
DEFAULT_API_BASE = "http://127.0.0.1:8000"

# Timeout from env (default 800ms)
SEARCH_TIMEOUT_MS = int(os.getenv("RE_SEARCH_TIMEOUT_MS", "800"))
SEARCH_TIMEOUT_SECONDS = SEARCH_TIMEOUT_MS / 1000.0

# Circuit breaker config from env
CIRCUIT_BREAKER_THRESHOLD = int(os.getenv("RE_SEARCH_CIRCUIT_BREAKER_OPEN_AFTER", "5"))
CIRCUIT_BREAKER_COOLDOWN = 60.0  # seconds

# Cache TTL (30 seconds for identical filter tuples)
SEARCH_CACHE_TTL = 30


def _build_cache_key(params: Dict[str, Any]) -> str:
    """Build deterministic cache key from filter tuple."""
    # Sort keys for deterministic hash
    sorted_params = sorted(params.items())
    key_string = json.dumps(sorted_params, sort_keys=True)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    return f"re:search:{key_hash}"


def search_listings(
    filled_slots: Dict[str, Any],
    max_results: int = 20,
    api_base: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search real estate listings using filled slots.

    STEP 7.3: Hardened with timeout, circuit breaker, and 30s caching.

    Args:
        filled_slots: Dict with keys: rental_type, location, budget, bedrooms, check_in, check_out
        max_results: Maximum number of results to return (default: 20)
        api_base: Optional API base URL (default: from settings or localhost)

    Returns:
        Dict with:
            - count: int (number of results)
            - results: List[Dict] (listing objects)
            - filters_used: Dict (query params sent to API)
            - cached: bool (whether result was from cache)
            - error: Optional[str] (error message if failed)

    Raises:
        CircuitBreakerOpen: If circuit breaker is open
    """
    start_time = time.time()

    if api_base is None:
        api_base = getattr(settings, "INTERNAL_API_BASE", DEFAULT_API_BASE)

    # Map slots to API query params
    params = {}

    # Map location → city
    if "location" in filled_slots:
        params["city"] = filled_slots["location"]

    # Map rental_type → rent_type
    if "rental_type" in filled_slots:
        params["rent_type"] = filled_slots["rental_type"]

    # Map budget → price_max (for filtering)
    if "budget" in filled_slots:
        params["price_max"] = filled_slots["budget"]

    # Map bedrooms
    if "bedrooms" in filled_slots:
        params["bedrooms"] = filled_slots["bedrooms"]

    # Map check_in/check_out (for short-term availability)
    if "check_in" in filled_slots:
        params["check_in"] = filled_slots["check_in"]
    if "check_out" in filled_slots:
        params["check_out"] = filled_slots["check_out"]

    # Add max results
    params["limit"] = max_results

    # Check cache first (30s TTL)
    cache_key = _build_cache_key(params)
    cached_result = cache.get(cache_key)

    if cached_result:
        logger.info(
            "[RE Search] Cache HIT: key=%s, params=%s",
            cache_key,
            params
        )
        cached_result["cached"] = True
        return cached_result

    logger.info(
        "[RE Search] Cache MISS: key=%s, params=%s",
        cache_key,
        params
    )

    url = f"{api_base}/api/v1/real_estate/search"

    # Get circuit breaker
    breaker_config = CircuitBreakerConfig(
        failure_threshold=CIRCUIT_BREAKER_THRESHOLD,
        cooldown_seconds=CIRCUIT_BREAKER_COOLDOWN,
        timeout_ms=SEARCH_TIMEOUT_MS
    )
    breaker = get_backend_search_breaker(breaker_config)

    # Update circuit breaker state metric
    set_circuit_breaker_state("backend_search", breaker.is_open())

    # Check if circuit is open
    if breaker.is_open():
        record_error("circuit_open")
        raise CircuitBreakerOpen(
            f"Backend search circuit breaker is OPEN (cooldown: {CIRCUIT_BREAKER_COOLDOWN}s)"
        )

    # Execute search with circuit breaker protection
    def _do_search(p: Dict[str, Any]):
        response = requests.get(url, params=p, timeout=SEARCH_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()

    try:
        # Primary attempt with exact filters
        data = breaker.call(lambda: _do_search(params))

        result_count = data.get("count", 0)
        results = data.get("results", [])

        # Record success metrics
        duration_ms = (time.time() - start_time) * 1000
        record_search_duration(duration_ms)

        logger.info(
            "[RE Search] API returned %d results in %.1fms (params=%s)",
            result_count,
            duration_ms,
            params
        )

        # Progressive fallback: if 0 results, relax filters
        effective_params = dict(params)
        if result_count == 0:
            # 1) Drop budget cap if present
            if "price_max" in effective_params:
                relaxed = dict(effective_params)
                relaxed.pop("price_max", None)
                try:
                    logger.info(
                        "[RE Search] Fallback: dropping price_max and retrying (params=%s)",
                        relaxed
                    )
                    data_relaxed = breaker.call(lambda: _do_search(relaxed))
                    rc = int(data_relaxed.get("count", 0))
                    if rc > 0:
                        result_count = rc
                        results = data_relaxed.get("results", [])
                        effective_params = relaxed
                except Exception:
                    pass

        if result_count == 0:
            # 2) Drop rent_type restriction to include 'both' and any available
            if "rent_type" in effective_params:
                relaxed2 = dict(effective_params)
                relaxed2.pop("rent_type", None)
                try:
                    logger.info(
                        "[RE Search] Fallback: dropping rent_type and retrying (params=%s)",
                        relaxed2
                    )
                    data_relaxed2 = breaker.call(lambda: _do_search(relaxed2))
                    rc2 = int(data_relaxed2.get("count", 0))
                    if rc2 > 0:
                        result_count = rc2
                        results = data_relaxed2.get("results", [])
                        effective_params = relaxed2
                except Exception:
                    pass

        result = {
            "count": result_count,
            "results": results,
            "filters_used": effective_params,
            "cached": False
        }

        # Cache result for 30s
        cache.set(_build_cache_key(effective_params), result, timeout=SEARCH_CACHE_TTL)

        return result

    except requests.exceptions.Timeout as e:
        duration_ms = (time.time() - start_time) * 1000
        record_search_duration(duration_ms)
        record_error("search_timeout")

        logger.error(
            "[RE Search] Timeout after %.1fms (limit=%dms, url=%s, params=%s)",
            duration_ms,
            SEARCH_TIMEOUT_MS,
            url,
            params
        )

        return {
            "count": 0,
            "results": [],
            "filters_used": params,
            "cached": False,
            "error": f"search_timeout_{SEARCH_TIMEOUT_MS}ms"
        }

    except CircuitBreakerOpen as e:
        # Already logged by breaker, just re-raise
        raise

    except requests.exceptions.RequestException as e:
        duration_ms = (time.time() - start_time) * 1000
        record_search_duration(duration_ms)
        record_error("search_http_error")

        logger.error(
            "[RE Search] HTTP error: %s (url=%s, params=%s)",
            e,
            url,
            params,
            exc_info=True
        )

        return {
            "count": 0,
            "results": [],
            "filters_used": params,
            "cached": False,
            "error": str(e)
        }

    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        record_search_duration(duration_ms)
        record_error("search_unexpected")

        logger.error(
            "[RE Search] Unexpected error: %s",
            e,
            exc_info=True
        )

        return {
            "count": 0,
            "results": [],
            "filters_used": params,
            "cached": False,
            "error": str(e)
        }


def _generate_badges(listing: Dict[str, Any]) -> List[str]:
    """
    Generate badge labels from listing amenities and features.

    Args:
        listing: Raw listing dict from API

    Returns:
        List of badge labels (max 3 for UI)
    """
    badges = []
    amenities = listing.get("amenities", [])

    # Map key amenities to user-friendly badges
    amenity_map = {
        "wifi": "WiFi",
        "ac": "AC",
        "pool": "Pool",
        "parking": "Parking",
        "sea_view": "Sea View",
        "furnished": "Furnished",
        "gym": "Gym",
        "beach_access": "Beach Access"
    }

    for amenity, label in amenity_map.items():
        if amenity in amenities:
            badges.append(label)
            if len(badges) >= 3:  # Limit to 3 badges
                break

    return badges


def format_listing_for_card(listing: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a listing object into a recommendation card item.

    Args:
        listing: Raw listing dict from API

    Returns:
        Dict formatted for CardItem schema (camelCase for frontend compatibility)

    Example:
        >>> format_listing_for_card({
        ...     "id": "uuid...",
        ...     "title": "2BR Apartment",
        ...     "city": "Girne",
        ...     "district": "Karakum",
        ...     "monthly_price": 500,
        ...     "bedrooms": 2,
        ...     "bathrooms": 1.0,
        ...     "rating": 4.5,
        ...     "images": ["https://..."],
        ...     "amenities": ["wifi", "ac"]
        ... })
        {
            "id": "uuid...",
            "title": "2BR Apartment",
            "subtitle": "Girne, Karakum",
            "price": "£500/mo",
            "imageUrl": "https://...",
            "rating": 4.5,
            "area": "Karakum",
            "badges": ["WiFi", "AC"],
            "metadata": {"bedrooms": 2, "bathrooms": 1.0, "amenities": ["wifi", "ac"]}
        }
    """
    # Build subtitle from city and district
    subtitle_parts = []
    if listing.get("city"):
        subtitle_parts.append(listing["city"])
    if listing.get("district"):
        subtitle_parts.append(listing["district"])
    subtitle = ", ".join(subtitle_parts) if subtitle_parts else ""

    # Format price based on rent_type
    price_str = ""
    rent_type = listing.get("rent_type", "long_term")
    if rent_type == "short_term" and listing.get("nightly_price"):
        price_str = f"£{listing['nightly_price']}/night"
    elif rent_type in ("long_term", "both") and listing.get("monthly_price"):
        price_str = f"£{listing['monthly_price']}/mo"

    # Get first image
    images = listing.get("images", [])
    image_url = images[0] if images else None

    # Generate badges from amenities
    badges = _generate_badges(listing)

    # Build metadata
    metadata = {
        "bedrooms": listing.get("bedrooms"),
        "bathrooms": listing.get("bathrooms"),
        "amenities": listing.get("amenities", []),
        "sqm": listing.get("sqm"),
        "rent_type": listing.get("rent_type")
    }

    return {
        "id": str(listing.get("id", "")),
        "title": listing.get("title", ""),
        "subtitle": subtitle,
        "price": price_str,
        "imageUrl": image_url,  # ✅ camelCase for frontend compatibility
        "rating": listing.get("rating"),  # ✅ Add rating field
        "area": listing.get("district"),  # ✅ Map district to area
        "badges": badges,  # ✅ Add badges from amenities
        "metadata": metadata
    }
