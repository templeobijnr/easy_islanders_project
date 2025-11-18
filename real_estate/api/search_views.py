"""
DRF views for Real Estate Search API (v1 schema).

Uses vw_listings_search database view for optimal performance.
"""
import logging
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .search_serializers import ListingSearchQuerySerializer, ListingSearchResultSerializer

logger = logging.getLogger(__name__)


class ListingSearchView(APIView):
    """
    Search real estate listings using optimized database view.

    This endpoint queries vw_listings_search which pre-joins and flattens
    the data for efficient searching by both AI agents and frontend UI.

    GET /api/v1/real_estate/listings/search/
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="Search real estate listings",
        description="Search listings with filters for location, price, features, etc.",
        parameters=[
            OpenApiParameter(name="listing_type", type=str, enum=["DAILY_RENTAL", "LONG_TERM_RENTAL", "SALE", "PROJECT"]),
            OpenApiParameter(name="city", type=str),
            OpenApiParameter(name="area", type=str),
            OpenApiParameter(name="min_price", type=float),
            OpenApiParameter(name="max_price", type=float),
            OpenApiParameter(name="min_bedrooms", type=int),
            OpenApiParameter(name="has_wifi", type=bool),
            OpenApiParameter(name="has_kitchen", type=bool),
            OpenApiParameter(name="has_private_pool", type=bool),
            OpenApiParameter(name="limit", type=int, description="Max 200"),
            OpenApiParameter(name="offset", type=int),
        ],
        responses={200: ListingSearchResultSerializer(many=True)}
    )
    def get(self, request):
        """Handle GET /api/v1/real_estate/listings/search/"""
        # Validate query parameters
        qs = ListingSearchQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)
        params = qs.validated_data

        # Build SQL query
        sql = "SELECT * FROM vw_listings_search WHERE status IN ('ACTIVE', 'UNDER_OFFER')"
        sql_params = {}

        # Listing type filter
        if lt := params.get("listing_type"):
            sql += " AND listing_type_code = %(listing_type)s"
            sql_params["listing_type"] = lt

        # Location filters
        if city := params.get("city"):
            sql += " AND city ILIKE %(city)s"
            sql_params["city"] = f"%{city}%"

        if area := params.get("area"):
            sql += " AND area ILIKE %(area)s"
            sql_params["area"] = f"%{area}%"

        # Price filters
        if min_price := params.get("min_price"):
            sql += " AND base_price >= %(min_price)s"
            sql_params["min_price"] = min_price

        if max_price := params.get("max_price"):
            sql += " AND base_price <= %(max_price)s"
            sql_params["max_price"] = max_price

        # Room filters
        if min_bedrooms := params.get("min_bedrooms"):
            sql += " AND bedrooms >= %(min_bedrooms)s"
            sql_params["min_bedrooms"] = min_bedrooms

        if max_bedrooms := params.get("max_bedrooms"):
            sql += " AND bedrooms <= %(max_bedrooms)s"
            sql_params["max_bedrooms"] = max_bedrooms

        if min_bathrooms := params.get("min_bathrooms"):
            sql += " AND bathrooms >= %(min_bathrooms)s"
            sql_params["min_bathrooms"] = min_bathrooms

        # Property type filter
        if property_type := params.get("property_type"):
            sql += " AND property_type_code = %(property_type)s"
            sql_params["property_type"] = property_type

        # Furnished status filter
        if furnished_status := params.get("furnished_status"):
            sql += " AND furnished_status = %(furnished_status)s"
            sql_params["furnished_status"] = furnished_status

        # Feature flag filters (only apply if explicitly set to True)
        feature_flags = [
            "has_wifi", "has_kitchen", "has_private_pool", "has_shared_pool",
            "has_parking", "has_air_conditioning", "view_sea", "view_mountain"
        ]
        for flag in feature_flags:
            flag_value = params.get(flag)
            if flag_value is True:  # Only filter if explicitly True
                sql += f" AND {flag} = TRUE"

        # Availability filters
        if af := params.get("available_from"):
            sql += " AND (available_from IS NULL OR available_from <= %(available_from)s)"
            sql_params["available_from"] = af

        if at := params.get("available_to"):
            sql += " AND (available_to IS NULL OR available_to >= %(available_to)s)"
            sql_params["available_to"] = at

        # Sorting
        sort_by = params.get("sort_by", "price_asc")
        if sort_by == "price_asc":
            sql += " ORDER BY base_price ASC NULLS LAST"
        elif sort_by == "price_desc":
            sql += " ORDER BY base_price DESC NULLS LAST"
        elif sort_by == "bedrooms_asc":
            sql += " ORDER BY bedrooms ASC NULLS LAST"
        elif sort_by == "bedrooms_desc":
            sql += " ORDER BY bedrooms DESC NULLS LAST"
        elif sort_by == "created_at_desc":
            sql += " ORDER BY created_at DESC"
        else:
            sql += " ORDER BY base_price ASC NULLS LAST"

        # Pagination
        limit = params.get("limit", 50)
        offset = params.get("offset", 0)
        sql += " LIMIT %(limit)s OFFSET %(offset)s"
        sql_params["limit"] = limit
        sql_params["offset"] = offset

        # Execute query
        with connection.cursor() as cursor:
            cursor.execute(sql, sql_params)
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # Serialize and return
        data = ListingSearchResultSerializer(rows, many=True, context={"request": request}).data
        return Response({
            "count": len(data),
            "results": data,
            "limit": limit,
            "offset": offset
        })
