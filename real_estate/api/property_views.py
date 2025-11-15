"""Property create API for Real Estate v1.

Provides a single endpoint to create a Property together with a linked
Listing, wiring in the new feature taxonomy. This is designed to be
consumed by the seller dashboard real estate property upload modal.

Endpoint:
    POST /api/v1/real_estate/properties/

Request body (simplified):
    {
        "title": str,
        "description": str,
        "location": {
            "city": str,
            "district": str | null,
            "latitude": float | null,
            "longitude": float | null,
        },
        "structure": {
            "property_type_code": str,
            "bedrooms": int,
            "living_rooms": int,
            "bathrooms": int,
            "room_configuration_label": str,
            ...
        },
        "features": {
            "feature_codes": [str, ...],
            "pet_friendly": bool | null,
        },
        "listing": {
            "transaction_type": "rent_long" | "rent_short" | "sale",
            "base_price": number,
            "currency": str,
            "rental_kind": "LONG_TERM" | "DAILY" | null,
            ...
        }
    }

Response body:
    {
        "property_id": int,
        "listing_id": int
    }
"""

from typing import Any, Dict

from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from real_estate.models import (
    Property,
    PropertyType,
    Location,
    Feature,
    Listing,
    ListingType,
)


class PropertyCreateView(APIView):
    """Create a Property + linked Listing.

    This view intentionally keeps validation logic straightforward and
    explicit rather than introducing a new serializer layer, since it is
    currently only used by the internal seller dashboard flow.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):  # type: ignore[override]
        data: Dict[str, Any] = request.data or {}

        # Basic required fields
        title = (data.get("title") or "").strip()
        description = data.get("description") or ""
        location_payload = data.get("location") or {}
        structure_payload = data.get("structure") or {}
        features_payload = data.get("features") or {}
        listing_payload = data.get("listing") or {}

        if not title:
            return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)

        city = (location_payload.get("city") or "").strip()
        if not city:
            return Response({"error": "City is required."}, status=status.HTTP_400_BAD_REQUEST)

        property_type_code = structure_payload.get("property_type_code")
        if not property_type_code:
            return Response({"error": "structure.property_type_code is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve PropertyType and ListingType
        property_type = get_object_or_404(PropertyType, code=property_type_code)

        transaction_type = listing_payload.get("transaction_type") or "rent_long"
        if transaction_type == "sale":
            listing_type_code = "SALE"
        elif transaction_type == "rent_short":
            listing_type_code = "DAILY_RENTAL"
        else:
            listing_type_code = "LONG_TERM_RENTAL"

        listing_type = get_object_or_404(ListingType, code=listing_type_code)

        with transaction.atomic():
            # Location
            district = (location_payload.get("district") or "").strip()
            latitude = location_payload.get("latitude")
            longitude = location_payload.get("longitude")

            location_defaults = {
                "region": "North Cyprus",
                "country": "Cyprus",
                "area": district,
            }
            location, _ = Location.objects.get_or_create(
                city=city,
                area=district,
                defaults=location_defaults,
            )

            if latitude is not None:
                location.latitude = latitude
            if longitude is not None:
                location.longitude = longitude
            if latitude is not None or longitude is not None:
                location.save(update_fields=["latitude", "longitude"])

            # Property core fields
            prop = Property(
                reference_code=data.get("ad_number") or f"AUTO-{timezone.now().timestamp():.0f}",
                title=title,
                description=description,
                location=location,
                property_type=property_type,
            )

            # Structural fields
            prop.bedrooms = int(structure_payload.get("bedrooms") or 0)
            prop.living_rooms = int(structure_payload.get("living_rooms") or 1)
            prop.bathrooms = int(structure_payload.get("bathrooms") or 1)
            prop.room_configuration_label = structure_payload.get("room_configuration_label") or ""

            prop.building_name = structure_payload.get("building_name") or ""
            prop.flat_number = structure_payload.get("flat_number") or ""
            floor_number = structure_payload.get("floor_number")
            if floor_number is not None:
                try:
                    prop.floor_number = int(floor_number)
                except (TypeError, ValueError):
                    prop.floor_number = None

            total_area = structure_payload.get("total_area_sqm")
            net_area = structure_payload.get("net_area_sqm")
            if total_area is not None:
                prop.total_area_sqm = total_area
            if net_area is not None:
                prop.net_area_sqm = net_area

            year_built = structure_payload.get("year_built")
            if year_built:
                try:
                    prop.year_built = int(year_built)
                except (TypeError, ValueError):
                    prop.year_built = None

            prop.is_gated_community = bool(structure_payload.get("is_gated_community") or False)

            furnished_status = structure_payload.get("furnished_status")
            if furnished_status:
                prop.furnished_status = furnished_status

            # Attributes bucket (long tail)
            attributes: Dict[str, Any] = {}
            if structure_payload.get("parking_spaces") is not None:
                attributes["parking_spaces"] = structure_payload.get("parking_spaces")

            pet_friendly = features_payload.get("pet_friendly")
            if pet_friendly is not None:
                attributes["pet_friendly"] = bool(pet_friendly)

            prop.attributes = attributes
            prop.save()

            # Features
            feature_codes = features_payload.get("feature_codes") or []
            if feature_codes:
                features_qs = Feature.objects.filter(code__in=feature_codes)
                prop.features.set(features_qs)

            # Listing
            base_price = listing_payload.get("base_price")
            currency = listing_payload.get("currency") or "EUR"

            listing = Listing.objects.create(
                reference_code=data.get("listing_reference") or f"L-{timezone.now().timestamp():.0f}",
                listing_type=listing_type,
                property=prop,
                title=title,
                description=description,
                base_price=base_price or 0,
                currency=currency,
                price_period="PER_MONTH" if listing_type_code == "LONG_TERM_RENTAL" else "PER_DAY",
                status="ACTIVE",
            )

        return Response(
            {"property_id": prop.id, "listing_id": listing.id},
            status=status.HTTP_201_CREATED,
        )
