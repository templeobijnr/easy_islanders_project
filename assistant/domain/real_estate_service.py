"""
STEP 7.2: Real Estate Domain Service

Provides availability snapshot queries with Redis caching.
Used for offer surface summaries in dialogue.
"""

from typing import Dict, Any, Optional, List
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


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
