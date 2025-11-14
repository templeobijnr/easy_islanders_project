"""
Real Estate Search Adapter - V1 Schema

Provides typed interface to /api/v1/real_estate/listings/search/ backend.
Uses the new v1 data model with vw_listings_search database view.

Maps agent search criteria to v1 API query parameters and returns normalized results.
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
    sorted_params = sorted(params.items())
    key_string = json.dumps(sorted_params, sort_keys=True)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    return f"re:v1:search:{key_hash}"


def map_rental_type_to_listing_type(rental_type: str) -> str:
    """
    Map legacy rental_type to v1 listing_type_code.

    Args:
        rental_type: "short_term" | "long_term" | "both"

    Returns:
        listing_type_code: "DAILY_RENTAL" | "LONG_TERM_RENTAL"
    """
    mapping = {
        "short_term": "DAILY_RENTAL",
        "long_term": "LONG_TERM_RENTAL",
        "both": None,  # No filter - show all types
    }
    return mapping.get(rental_type)


def search_listings_v1(
    filled_slots: Dict[str, Any],
    max_results: int = 20,
    api_base: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search real estate listings using v1 schema filled slots.

    Args:
        filled_slots: Dict with keys:
            - listing_type: "DAILY_RENTAL" | "LONG_TERM_RENTAL" | "SALE" | "PROJECT"
            - location: str (city or area)
            - city: str
            - area: str
            - budget_min: int/float
            - budget_max: int/float
            - bedrooms: int
            - bathrooms: int
            - property_type: str (e.g., "APARTMENT", "VILLA")
            - has_wifi: bool
            - has_kitchen: bool
            - has_private_pool: bool
            - has_parking: bool
            - available_from: date
            - available_to: date
        max_results: Maximum number of results to return (default: 20)
        api_base: Optional API base URL (default: from settings or localhost)

    Returns:
        Dict with:
            - count: int (number of results)
            - results: List[Dict] (listing objects from v1 schema)
            - filters_used: Dict (query params sent to API)
            - cached: bool (whether result was from cache)
            - error: Optional[str] (error message if failed)

    Raises:
        CircuitBreakerOpen: If circuit breaker is open
    """
    start_time = time.time()

    if api_base is None:
        api_base = getattr(settings, "INTERNAL_API_BASE", DEFAULT_API_BASE)

    # Map slots to v1 API query params
    params = {}

    # Listing type
    if "listing_type" in filled_slots:
        params["listing_type"] = filled_slots["listing_type"]
    elif "rental_type" in filled_slots:
        # Legacy support: map rental_type to listing_type
        listing_type = map_rental_type_to_listing_type(filled_slots["rental_type"])
        if listing_type:
            params["listing_type"] = listing_type

    # Location filters
    if "city" in filled_slots:
        params["city"] = filled_slots["city"]
    elif "location" in filled_slots:
        # Try to use as city first
        params["city"] = filled_slots["location"]

    if "area" in filled_slots:
        params["area"] = filled_slots["area"]

    # Budget/Price filters
    if "budget_min" in filled_slots or "budget" in filled_slots:
        params["min_price"] = filled_slots.get("budget_min") or filled_slots.get("budget")

    if "budget_max" in filled_slots:
        params["max_price"] = filled_slots["budget_max"]
    elif "budget" in filled_slots and "budget_min" not in filled_slots:
        # If only "budget" provided without min, treat as max
        params["max_price"] = filled_slots["budget"]

    # Room filters
    if "bedrooms" in filled_slots:
        params["min_bedrooms"] = filled_slots["bedrooms"]

    if "bathrooms" in filled_slots:
        params["min_bathrooms"] = filled_slots["bathrooms"]

    # Property type
    if "property_type" in filled_slots:
        params["property_type"] = filled_slots["property_type"]

    # Feature filters
    feature_flags = ["has_wifi", "has_kitchen", "has_private_pool", "has_shared_pool",
                     "has_parking", "has_air_conditioning", "view_sea", "view_mountain"]
    for flag in feature_flags:
        if flag in filled_slots:
            params[flag] = filled_slots[flag]

    # Availability dates
    if "available_from" in filled_slots:
        params["available_from"] = filled_slots["available_from"]
    if "available_to" in filled_slots:
        params["available_to"] = filled_slots["available_to"]

    # Add max results
    params["limit"] = max_results

    # Check cache first (30s TTL)
    cache_key = _build_cache_key(params)
    cached_result = cache.get(cache_key)

    if cached_result:
        logger.info(
            "[RE Search V1] Cache HIT: key=%s, params=%s",
            cache_key,
            params
        )
        cached_result["cached"] = True
        return cached_result

    logger.info(
        "[RE Search V1] Cache MISS: key=%s, params=%s",
        cache_key,
        params
    )

    url = f"{api_base}/api/v1/real_estate/listings/search/"

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
            "[RE Search V1] API returned %d results in %.1fms (params=%s)",
            result_count,
            duration_ms,
            params
        )

        # Progressive fallback: if 0 results, relax filters
        effective_params = dict(params)
        if result_count == 0:
            # 1) Drop price_max if present
            if "max_price" in effective_params:
                relaxed = dict(effective_params)
                relaxed.pop("max_price", None)
                try:
                    logger.info(
                        "[RE Search V1] Fallback: dropping max_price and retrying (params=%s)",
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
            # 2) Drop listing_type restriction
            if "listing_type" in effective_params:
                relaxed2 = dict(effective_params)
                relaxed2.pop("listing_type", None)
                try:
                    logger.info(
                        "[RE Search V1] Fallback: dropping listing_type and retrying (params=%s)",
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
            "[RE Search V1] Timeout after %.1fms (limit=%dms, url=%s, params=%s)",
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
            "[RE Search V1] HTTP error: %s (url=%s, params=%s)",
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
            "[RE Search V1] Unexpected error: %s",
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


def format_v1_listing_for_card(listing: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a v1 listing object into a recommendation card item.

    Args:
        listing: Raw listing dict from v1 API (vw_listings_search view)

    Returns:
        Dict formatted for CardItem schema (camelCase for frontend compatibility)
    """
    # Build subtitle from location
    subtitle_parts = []
    if listing.get("city"):
        subtitle_parts.append(listing["city"])
    if listing.get("area"):
        subtitle_parts.append(listing["area"])
    subtitle = ", ".join(subtitle_parts) if subtitle_parts else ""

    # Format price
    price_str = ""
    base_price = listing.get("base_price")
    currency = listing.get("currency", "EUR")
    price_period = listing.get("price_period", "TOTAL")

    if base_price:
        currency_symbol = {"EUR": "€", "GBP": "£", "USD": "$", "TRY": "₺"}.get(currency, currency)
        period_suffix = {
            "PER_DAY": "/day",
            "PER_MONTH": "/mo",
            "TOTAL": "",
            "STARTING_FROM": "+ (starting from)"
        }.get(price_period, "")
        price_str = f"{currency_symbol}{base_price}{period_suffix}"

    # Generate badges from features
    badges = []
    if listing.get("has_wifi"):
        badges.append("WiFi")
    if listing.get("has_private_pool"):
        badges.append("Private Pool")
    elif listing.get("has_shared_pool"):
        badges.append("Pool")
    if listing.get("view_sea"):
        badges.append("Sea View")
    if listing.get("has_parking"):
        badges.append("Parking")
    badges = badges[:3]  # Limit to 3 badges

    # Build metadata
    metadata = {
        "bedrooms": listing.get("bedrooms"),
        "bathrooms": listing.get("bathrooms"),
        "sqm": listing.get("total_area_sqm") or listing.get("net_area_sqm"),
        "listing_type": listing.get("listing_type_code"),
        "property_type": listing.get("property_type_label"),
        "furnished_status": listing.get("furnished_status"),
        "features": {
            "wifi": listing.get("has_wifi"),
            "kitchen": listing.get("has_kitchen"),
            "private_pool": listing.get("has_private_pool"),
            "shared_pool": listing.get("has_shared_pool"),
            "parking": listing.get("has_parking"),
            "air_conditioning": listing.get("has_air_conditioning"),
            "sea_view": listing.get("view_sea"),
            "mountain_view": listing.get("view_mountain"),
        }
    }

    return {
        "id": str(listing.get("listing_id", "")),
        "title": listing.get("title", ""),
        "subtitle": subtitle,
        "price": price_str,
        "imageUrl": None,  # TODO: Add image handling when implemented
        "rating": None,  # TODO: Add rating when available
        "area": listing.get("area"),
        "badges": badges,
        "metadata": metadata
    }
