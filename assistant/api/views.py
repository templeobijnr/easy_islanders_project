"""
STEP 7.2: Real Estate API Views

Provides REST API endpoints for real estate offer surfaces.
"""

from django.views.decorators.http import require_GET
from django.http import JsonResponse
from assistant.domain.real_estate_service import availability_summary


@require_GET
def availability_summary_view(request):
    """
    GET /api/real_estate/availability_summary

    Query params (optional):
        - location: str (city name, e.g., "Kyrenia")
        - rental_type: str (short_term | long_term)
        - budget_max: int (maximum price)
        - bedrooms: int (number of bedrooms)

    Returns:
        JSON: {
            "ok": true,
            "items": [
                {"city": "Kyrenia", "count": 42, "min": 450, "max": 2200, "currency": "GBP"},
                ...
            ],
            "scope": {"filters": {...}}
        }

    Example:
        GET /api/real_estate/availability_summary?location=Kyrenia&budget_max=800
    """
    qp = {
        "location": request.GET.get("location"),
        "rental_type": request.GET.get("rental_type"),
        "budget_max": request.GET.get("budget_max"),
        "bedrooms": request.GET.get("bedrooms"),
    }

    data = availability_summary(qp)

    return JsonResponse({"ok": True, **data})
