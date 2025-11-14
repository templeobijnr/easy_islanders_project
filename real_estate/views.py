"""
DRF views for Real Estate Search API.
"""
from datetime import date
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, OuterRef, Exists
from .models import Listing
# from .serializers import ListingSerializer  # Temporarily disabled during v1 migration


def normalize_turkish_chars(text: str) -> str:
    """
    Normalize Turkish characters to ASCII equivalents.

    Handles bidirectional mapping:
    - İ/i (Turkish) ↔ I/i (English)
    - Ş/ş ↔ S/s
    - Ğ/ğ ↔ G/g
    - Ü/ü ↔ U/u
    - Ö/ö ↔ O/o
    - Ç/ç ↔ C/c

    Examples:
        >>> normalize_turkish_chars("İskele")
        'Iskele'
        >>> normalize_turkish_chars("Lefkoşa")
        'Lefkosa'
    """
    replacements = {
        'İ': 'I', 'ı': 'i',
        'Ş': 'S', 'ş': 's',
        'Ğ': 'G', 'ğ': 'g',
        'Ü': 'U', 'ü': 'u',
        'Ö': 'O', 'ö': 'o',
        'Ç': 'C', 'ç': 'c'
    }
    for turkish_char, ascii_char in replacements.items():
        text = text.replace(turkish_char, ascii_char)
    return text


def get_city_search_variants(city_name: str) -> list:
    """
    Generate city name variants for Turkish character-aware search.

    Returns list of possible city name spellings to check against database.

    Examples:
        >>> get_city_search_variants("Iskele")
        ["Iskele", "İskele"]
        >>> get_city_search_variants("İskele")
        ["İskele", "Iskele"]
        >>> get_city_search_variants("Lefkosa")
        ["Lefkosa", "Lefkoşa"]
    """
    variants = [city_name]

    # Map of cities with known Turkish/ASCII variants
    city_variants = {
        'iskele': 'İskele',
        'lefkosa': 'Lefkoşa',
        'gazimagusa': 'Gazimağusa',
        'girne': 'Girne',  # No Turkish chars, but include for completeness
    }

    city_lower = city_name.lower()

    # If input is ASCII, add Turkish version
    if city_lower in city_variants:
        turkish_version = city_variants[city_lower]
        if turkish_version not in variants:
            variants.append(turkish_version)

    # If input has Turkish chars, add ASCII version
    ascii_version = normalize_turkish_chars(city_name)
    if ascii_version != city_name and ascii_version not in variants:
        variants.append(ascii_version)

    return variants


class ListingSearchViewSet(viewsets.ViewSet):
    """
    Search API for real estate listings with filtering.

    GET /api/v1/real_estate/search?city=Girne&bedrooms=2&rent_type=long_term
                                  &price_min=500&price_max=1200
                                  &check_in=2025-11-20&check_out=2025-11-25

    Query Parameters:
        - city (str): Filter by city name (case-insensitive)
        - bedrooms (int): Minimum number of bedrooms
        - rent_type (str): "short_term" or "long_term"
        - price_min (int): Minimum price (monthly or nightly based on rent_type)
        - price_max (int): Maximum price
        - check_in (date): Check-in date for short-term (ISO 8601)
        - check_out (date): Check-out date for short-term (ISO 8601)

    Response:
        {
            "count": int,
            "results": [Listing, ...]
        }
    """
    # Allow unauthenticated access for internal Celery worker calls
    permission_classes = [AllowAny]

    def list(self, request):
        """Handle GET /api/v1/real_estate/search"""
        qs = Listing.objects.all()

        # Extract query parameters
        city = request.query_params.get("city")
        bedrooms = request.query_params.get("bedrooms")
        rent_type = request.query_params.get("rent_type")  # "short_term" | "long_term"
        price_min = request.query_params.get("price_min")
        price_max = request.query_params.get("price_max")
        check_in = request.query_params.get("check_in")
        check_out = request.query_params.get("check_out")

        # Filter by city (case-insensitive, Turkish character-aware)
        if city:
            # Get all possible spelling variants (handles "Iskele" ↔ "İskele", etc.)
            city_variants = get_city_search_variants(city)

            if len(city_variants) == 1:
                # Only one variant, use simple filter
                qs = qs.filter(city__iexact=city_variants[0])
            else:
                # Multiple variants, search for ANY match
                city_q = Q()
                for variant in city_variants:
                    city_q |= Q(city__iexact=variant)
                qs = qs.filter(city_q)

        # Filter by bedrooms (gte: at least N bedrooms)
        if bedrooms:
            try:
                qs = qs.filter(bedrooms__gte=int(bedrooms))
            except ValueError:
                pass

        # Filter by rent_type (matches exact or "both")
        if rent_type and rent_type in ("short_term", "long_term"):
            qs = qs.filter(Q(rent_type=rent_type) | Q(rent_type="both"))

        # Filter by price range (select appropriate price field)
        if price_min or price_max:
            price_field = "nightly_price" if rent_type == "short_term" else "monthly_price"

            if price_min:
                try:
                    qs = qs.filter(**{f"{price_field}__gte": int(price_min)})
                except ValueError:
                    pass

            if price_max:
                try:
                    qs = qs.filter(**{f"{price_field}__lte": int(price_max)})
                except ValueError:
                    pass

        # Short-term availability filter (exclude listings with overlapping blocks)
        # TODO: Re-implement with v1 data model
        # if rent_type == "short_term" and check_in and check_out:
        #     try:
        #         ci = date.fromisoformat(check_in)
        #         co = date.fromisoformat(check_out)
        #
        #         # Exclude listings that have blocks overlapping the requested range
        #         # A block overlaps if: block.start_date <= check_out AND block.end_date >= check_in
        #         blocked = ShortTermBlock.objects.filter(
        #             listing=OuterRef("pk"),
        #             start_date__lte=co,
        #             end_date__gte=ci
        #         )
        #
        #         qs = qs.exclude(Exists(blocked))
        #
        #     except ValueError:
        #         # Invalid date format, skip availability filter
        #         pass

        # Order by price (ascending for clarity)
        if rent_type == "short_term":
            qs = qs.order_by("nightly_price", "bedrooms")
        elif rent_type == "long_term":
            qs = qs.order_by("monthly_price", "bedrooms")
        else:
            # Default ordering
            qs = qs.order_by("city", "bedrooms")

        # Limit to first 20 results
        qs = qs[:20]

        # Serialize and return
        # TODO: Re-implement serializer for v1 data model
        # serializer = ListingSerializer(qs, many=True)
        # data = serializer.data
        # return Response({"count": len(data), "results": data})

        return Response({"count": qs.count(), "results": [], "message": "Legacy API - being migrated to v1"})
