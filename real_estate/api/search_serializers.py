"""
DRF serializers for Real Estate Search API (v1 schema).

Uses vw_listings_search database view for optimal performance.
"""
from rest_framework import serializers


class ListingSearchQuerySerializer(serializers.Serializer):
    """Query parameters for listing search."""

    listing_type = serializers.ChoiceField(
        choices=["DAILY_RENTAL", "LONG_TERM_RENTAL", "SALE", "PROJECT"],
        required=False,
        help_text="Type of listing to search for"
    )
    city = serializers.CharField(required=False, max_length=64)
    area = serializers.CharField(required=False, max_length=128)
    min_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    min_bedrooms = serializers.IntegerField(required=False, min_value=0)
    max_bedrooms = serializers.IntegerField(required=False, min_value=0)
    min_bathrooms = serializers.IntegerField(required=False, min_value=0)
    property_type = serializers.CharField(required=False, max_length=50)
    furnished_status = serializers.ChoiceField(
        choices=["UNFURNISHED", "PARTLY_FURNISHED", "FULLY_FURNISHED"],
        required=False
    )

    # Feature flags (allow_null=True to distinguish between not provided and explicitly False)
    has_wifi = serializers.BooleanField(required=False, allow_null=True, default=None)
    has_kitchen = serializers.BooleanField(required=False, allow_null=True, default=None)
    has_private_pool = serializers.BooleanField(required=False, allow_null=True, default=None)
    has_shared_pool = serializers.BooleanField(required=False, allow_null=True, default=None)
    has_parking = serializers.BooleanField(required=False, allow_null=True, default=None)
    has_air_conditioning = serializers.BooleanField(required=False, allow_null=True, default=None)
    view_sea = serializers.BooleanField(required=False, allow_null=True, default=None)
    view_mountain = serializers.BooleanField(required=False, allow_null=True, default=None)

    # Availability dates
    available_from = serializers.DateField(required=False)
    available_to = serializers.DateField(required=False)

    # Pagination
    limit = serializers.IntegerField(required=False, default=50, min_value=1, max_value=200)
    offset = serializers.IntegerField(required=False, default=0, min_value=0)

    # Sorting
    sort_by = serializers.ChoiceField(
        choices=["price_asc", "price_desc", "bedrooms_asc", "bedrooms_desc", "created_at_desc"],
        required=False,
        default="price_asc"
    )


class ListingSearchResultSerializer(serializers.Serializer):
    """Result from vw_listings_search view."""

    listing_id = serializers.IntegerField()
    listing_reference_code = serializers.CharField()
    listing_type_code = serializers.CharField()
    status = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    base_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    price_period = serializers.CharField()
    available_from = serializers.DateField(allow_null=True)
    available_to = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    cover_image = serializers.SerializerMethodField()

    # Property details
    property_id = serializers.IntegerField(allow_null=True)
    property_reference_code = serializers.CharField(allow_null=True)

    # Project details
    project_id = serializers.IntegerField(allow_null=True)
    project_name = serializers.CharField(allow_null=True)

    # Location
    location_id = serializers.IntegerField(allow_null=True)
    country = serializers.CharField(allow_null=True)
    region = serializers.CharField(allow_null=True)
    city = serializers.CharField(allow_null=True)
    area = serializers.CharField(allow_null=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, allow_null=True)

    # Property type
    property_type_code = serializers.CharField(allow_null=True)
    property_type_label = serializers.CharField(allow_null=True)
    property_category = serializers.CharField(allow_null=True)

    # Room configuration
    bedrooms = serializers.IntegerField(allow_null=True)
    living_rooms = serializers.IntegerField(allow_null=True)
    bathrooms = serializers.IntegerField(allow_null=True)
    room_configuration_label = serializers.CharField(allow_null=True, allow_blank=True)

    # Property details
    total_area_sqm = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)
    net_area_sqm = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True)
    furnished_status = serializers.CharField(allow_null=True, allow_blank=True)
    floor_number = serializers.IntegerField(allow_null=True)
    total_floors = serializers.IntegerField(allow_null=True)
    year_built = serializers.IntegerField(allow_null=True)
    is_gated_community = serializers.BooleanField()

    # Feature flags
    has_wifi = serializers.BooleanField()
    has_kitchen = serializers.BooleanField()
    has_private_pool = serializers.BooleanField()
    has_shared_pool = serializers.BooleanField()
    view_sea = serializers.BooleanField()
    view_mountain = serializers.BooleanField()
    has_balcony = serializers.BooleanField()
    has_terrace = serializers.BooleanField()
    has_garden = serializers.BooleanField()
    has_parking = serializers.BooleanField()
    has_air_conditioning = serializers.BooleanField()
    has_central_heating = serializers.BooleanField()

    def get_cover_image(self, obj):
        """Get absolute URL for cover image."""
        image_path = obj.get("cover_image")
        if not image_path:
            return None

        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/media/{image_path}")
        return f"/media/{image_path}"
