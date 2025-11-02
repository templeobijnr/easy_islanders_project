"""
Broadcast service for vendor notifications.

Handles:
- Creating requests and queueing broadcasts
- Building recipient lists based on domain and geography
- Backend-only processing (no user-facing WebSocket events)
"""
import logging
from typing import Dict, Any, List
from assistant.tasks import dispatch_broadcast

logger = logging.getLogger(__name__)


def create_and_broadcast(user, subject: str, payload: Dict[str, Any]):
    """
    Create a request and broadcast it to matching vendors.

    This is a backend-only operation. The user only sees:
    "Got it — I'll reach out and get back to you."

    The agent will later summarize responses in the chat thread.

    Args:
        user: The requesting user
        subject: Request subject line
        payload: Request details including domain, area, requirements

    Returns:
        Request: The created request object

    Example payload:
        {
            "domain": "real_estate",
            "area": "Kyrenia",
            "requirements": {
                "budget": 2500,
                "bedrooms": 2,
                "move_in": "2025-02-01"
            }
        }
    """
    from assistant.models import Request

    # Create request
    req = Request.objects.create(
        user=user,
        subject=subject,
        payload=payload,
        status="queued"
    )

    # Build recipient list
    vendor_ids = _build_recipient_list(payload)

    # Queue broadcast task
    dispatch_broadcast.delay(req.id, vendor_ids)

    logger.info(
        f"Broadcast queued: request_id={req.id}, "
        f"domain={payload.get('domain')}, "
        f"recipient_count={len(vendor_ids)}"
    )

    return req


def _build_recipient_list(payload: Dict[str, Any]) -> List[int]:
    """
    Build list of vendor IDs based on payload criteria.

    Filters by:
    - Domain (real_estate, cars, restaurants, etc.)
    - Geographic area
    - Active status
    - Vendor capabilities

    Args:
        payload: Request details

    Returns:
        List of vendor IDs (capped at 200)
    """
    from listings.models import Vendor  # Adjust import based on your models

    domain = payload.get("domain")
    area = payload.get("area")

    # Build queryset with filters
    qs = Vendor.objects.filter(is_active=True)

    if domain:
        qs = qs.filter(domain=domain)

    if area:
        # Use geographic filtering (adjust field names as needed)
        qs = qs.filter(service_areas__icontains=area)

    # Cap at 200 vendors
    vendor_ids = list(qs.values_list("id", flat=True)[:200])

    logger.info(
        f"Built recipient list: domain={domain}, area={area}, "
        f"count={len(vendor_ids)}"
    )

    return vendor_ids
