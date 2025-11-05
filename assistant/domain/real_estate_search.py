"""
Real Estate Search Adapter

Provides typed interface to the /api/v1/real_estate/search backend.
Maps slot values to API query parameters and returns normalized results.
"""

from typing import Dict, Any, List, Optional
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Default to localhost for development
DEFAULT_API_BASE = "http://127.0.0.1:8000"


def search_listings(
    filled_slots: Dict[str, Any],
    max_results: int = 20,
    api_base: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search real estate listings using filled slots.

    Args:
        filled_slots: Dict with keys: rental_type, location, budget, bedrooms, check_in, check_out
        max_results: Maximum number of results to return (default: 20)
        api_base: Optional API base URL (default: from settings or localhost)

    Returns:
        Dict with:
            - count: int (number of results)
            - results: List[Dict] (listing objects)
            - filters_used: Dict (query params sent to API)

    Example:
        >>> search_listings({"location": "Girne", "budget": 500, "rental_type": "long_term"})
        {
            "count": 12,
            "results": [
                {
                    "id": "uuid...",
                    "title": "2BR Apartment in Girne",
                    "city": "Girne",
                    "monthly_price": 450,
                    ...
                }
            ],
            "filters_used": {"city": "Girne", "price_max": 500, "rent_type": "long_term"}
        }
    """
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

    url = f"{api_base}/api/v1/real_estate/search"

    logger.info(
        "[RE Search] Querying API: url=%s, params=%s",
        url,
        params
    )

    try:
        response = requests.get(url, params=params, timeout=5.0)
        response.raise_for_status()
        data = response.json()

        result_count = data.get("count", 0)
        results = data.get("results", [])

        logger.info(
            "[RE Search] API returned %d results (params=%s)",
            result_count,
            params
        )

        return {
            "count": result_count,
            "results": results,
            "filters_used": params
        }

    except requests.exceptions.RequestException as e:
        logger.error(
            "[RE Search] API request failed: %s (url=%s, params=%s)",
            e,
            url,
            params,
            exc_info=True
        )
        return {
            "count": 0,
            "results": [],
            "filters_used": params,
            "error": str(e)
        }
    except Exception as e:
        logger.error(
            "[RE Search] Unexpected error: %s",
            e,
            exc_info=True
        )
        return {
            "count": 0,
            "results": [],
            "filters_used": params,
            "error": str(e)
        }


def format_listing_for_card(listing: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a listing object into a recommendation card item.

    Args:
        listing: Raw listing dict from API

    Returns:
        Dict formatted for CardItem schema

    Example:
        >>> format_listing_for_card({
        ...     "id": "uuid...",
        ...     "title": "2BR Apartment",
        ...     "city": "Girne",
        ...     "district": "Karakum",
        ...     "monthly_price": 500,
        ...     "bedrooms": 2,
        ...     "bathrooms": 1.0,
        ...     "images": ["https://..."],
        ...     "amenities": ["wifi", "ac"]
        ... })
        {
            "id": "uuid...",
            "title": "2BR Apartment",
            "subtitle": "Girne, Karakum",
            "price": "£500/mo",
            "image_url": "https://...",
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
        "image_url": image_url,
        "metadata": metadata
    }
