"""
Geo helper API views for Real Estate.

Provides lightweight endpoints used by the seller dashboard to make
location entry easier and less error-prone:

1. GET /api/v1/real_estate/geo/autocomplete/
   - Returns suggestions based on existing Location rows plus
     Nominatim-backed search as a fallback.

2. GET /api/v1/real_estate/geo/reverse/
   - Reverse geocodes lat/lng to {city, district, address}.
"""
from typing import Any, Dict, List

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from real_estate.models import Location

try:
    # Reuse existing geo tooling (Nominatim + headers, caching, etc.)
    from assistant.brain.tools_local import find_places, USER_AGENT_HEADERS  # type: ignore[attr-defined]
except Exception:  # pragma: no cover - defensive import
    find_places = None  # type: ignore[assignment]
    USER_AGENT_HEADERS = {"User-Agent": "EasyIslanders/1.0"}  # Fallback


class LocationAutocompleteView(APIView):
    """
    Provide location suggestions for seller dashboard forms.

    GET /api/v1/real_estate/geo/autocomplete/?q=Kyrenia&limit=5

    Response:
        {
          "results": [
            {
              "label": "Street, Area, City",
              "city": "Kyrenia",
              "district": "Alsancak",
              "address": "123 Example Street",
              "latitude": 35.3368,
              "longitude": 33.3173,
              "source": "db" | "osm"
            },
            ...
          ]
        }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs) -> Response:  # type: ignore[override]
        query = (request.query_params.get("q") or "").strip()
        try:
            limit = int(request.query_params.get("limit", "5"))
        except ValueError:
            limit = 5
        limit = max(1, min(limit, 10))

        if len(query) < 2:
            return Response({"results": []})

        suggestions: List[Dict[str, Any]] = []

        # 1) Suggestions from existing Location rows (real data in our DB)
        locations_qs = (
            Location.objects.filter(
                Q(city__icontains=query)
                | Q(area__icontains=query)
                | Q(address_line__icontains=query)
            )
            .order_by("city", "area")[:limit]
        )

        for loc in locations_qs:
            parts = [loc.address_line or "", loc.area or "", loc.city or ""]
            label = ", ".join([p for p in parts if p]).strip() or loc.city

            suggestions.append(
                {
                    "label": label,
                    "city": loc.city,
                    "district": loc.area,
                    "address": loc.address_line or "",
                    "latitude": float(loc.latitude) if loc.latitude is not None else None,
                    "longitude": float(loc.longitude) if loc.longitude is not None else None,
                    "source": "db",
                }
            )

        # 2) Fallback to Nominatim via tools_local.find_places (if available)
        remaining = max(0, limit - len(suggestions))
        if remaining and find_places is not None:
            try:
                # Bias search around North Cyprus to keep suggestions relevant
                results = find_places(query, near="North Cyprus", limit=remaining)  # type: ignore[misc]
            except Exception:
                results = []

            for item in results:
                # Nominatim returns 'display_name', 'lat', 'lon', and sometimes 'address'
                label = item.get("display_name") or ""
                address_meta = item.get("address") or {}
                city = (
                    address_meta.get("city")
                    or address_meta.get("town")
                    or address_meta.get("village")
                    or ""
                )
                district = (
                    address_meta.get("suburb")
                    or address_meta.get("neighbourhood")
                    or ""
                )

                try:
                    lat_val = float(item.get("lat")) if item.get("lat") is not None else None
                    lon_val = float(item.get("lon")) if item.get("lon") is not None else None
                except (TypeError, ValueError):
                    lat_val = None
                    lon_val = None

                suggestions.append(
                    {
                        "label": label or city or query,
                        "city": city,
                        "district": district,
                        "address": label,
                        "latitude": lat_val,
                        "longitude": lon_val,
                        "source": "osm",
                    }
                )

        return Response({"results": suggestions[:limit]})


class ReverseGeocodeView(APIView):
    """
    Reverse geocode lat/lng to city/district/address using Nominatim.

    GET /api/v1/real_estate/geo/reverse/?lat=35.33&lng=33.31

    Response:
        {
          "city": "Kyrenia",
          "district": "Alsancak",
          "address": "Full address string"
        }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs) -> Response:  # type: ignore[override]
        lat_raw = request.query_params.get("lat")
        lng_raw = request.query_params.get("lng")

        if not lat_raw or not lng_raw:
            return Response(
                {"error": "lat and lng query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lat = float(lat_raw)
            lng = float(lng_raw)
        except (TypeError, ValueError):
            return Response(
                {"error": "lat and lng must be valid numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Call Nominatim directly (simple reverse geocoding).
        # We do this here instead of tools_local to keep latency and payload small.
        import requests  # Imported here to avoid global dependency if unused
        import urllib.parse

        try:
            qs = urllib.parse.urlencode(
                {
                    "format": "json",
                    "lat": f"{lat:.6f}",
                    "lon": f"{lng:.6f}",
                    "addressdetails": 1,
                }
            )
            resp = requests.get(
                f"https://nominatim.openstreetmap.org/reverse?{qs}",
                headers=USER_AGENT_HEADERS,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return Response(
                {"error": "Failed to reverse geocode coordinates."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        address = data.get("address") or {}
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or ""
        )
        district = address.get("suburb") or address.get("neighbourhood") or ""
        full_address = data.get("display_name") or ""

        return Response(
            {
                "city": city,
                "district": district,
                "address": full_address,
            }
        )

