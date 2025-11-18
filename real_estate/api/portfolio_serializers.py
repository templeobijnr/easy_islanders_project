"""
DRF serializers for Portfolio API v1.

These serializers match the TypeScript interfaces defined in:
frontend/src/features/seller-dashboard/domains/real-estate/portfolio/types.ts
"""
import logging

from django.db.utils import ProgrammingError
from rest_framework import serializers

from real_estate.models import (
    Listing,
    ListingType,
    Property,
    PropertyFeature,
    Feature,
    PropertyImage,
    Location,
    Contact,
)


logger = logging.getLogger(__name__)


class PortfolioListingSerializer(serializers.ModelSerializer):
    """Serializer for portfolio listings list view."""

    # Listing type code (e.g., "DAILY_RENTAL")
    listing_type = serializers.CharField(source='listing_type.code', read_only=True)

    # Location fields from related property
    city = serializers.SerializerMethodField()
    area = serializers.SerializerMethodField()

    # Property details from related property
    bedrooms = serializers.SerializerMethodField()
    bathrooms = serializers.SerializerMethodField()
    room_configuration_label = serializers.SerializerMethodField()

    # Availability label (computed)
    availability_label = serializers.SerializerMethodField()

    # Performance metrics (30-day window)
    views_30d = serializers.SerializerMethodField()
    enquiries_30d = serializers.SerializerMethodField()
    bookings_30d = serializers.SerializerMethodField()

    # Feature flags (boolean)
    has_wifi = serializers.SerializerMethodField()
    has_kitchen = serializers.SerializerMethodField()
    has_pool = serializers.SerializerMethodField()
    has_private_pool = serializers.SerializerMethodField()
    has_sea_view = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id',
            'reference_code',
            'listing_type',
            'status',
            'title',
            'city',
            'area',
            'bedrooms',
            'bathrooms',
            'room_configuration_label',
            'base_price',
            'currency',
            'price_period',
            'available_from',
            'available_to',
            'availability_label',
            'views_30d',
            'enquiries_30d',
            'bookings_30d',
            'created_at',
            'updated_at',
            'has_wifi',
            'has_kitchen',
            'has_pool',
            'has_private_pool',
            'has_sea_view',
            'cover_image',
        ]

    def get_city(self, obj):
        """Get city from related property location."""
        if obj.property and obj.property.location:
            return obj.property.location.city
        return None

    def get_area(self, obj):
        """Get area from related property location."""
        if obj.property and obj.property.location:
            return obj.property.location.area
        return None

    def get_bedrooms(self, obj):
        """Get bedrooms from related property."""
        if obj.property:
            return obj.property.bedrooms
        return None

    def get_bathrooms(self, obj):
        """Get bathrooms from related property."""
        if obj.property:
            return obj.property.bathrooms
        return None

    def get_room_configuration_label(self, obj):
        """Get room configuration label from related property."""
        if obj.property:
            return obj.property.room_configuration_label
        return None

    def get_availability_label(self, obj):
        """Compute availability label based on dates and status."""
        if obj.status in ['SOLD', 'RENTED']:
            return 'Not Available'

        if obj.available_from and obj.available_to:
            return f"{obj.available_from.strftime('%b %d')} - {obj.available_to.strftime('%b %d, %Y')}"
        elif obj.available_from:
            return f"From {obj.available_from.strftime('%b %d, %Y')}"
        elif obj.available_to:
            return f"Until {obj.available_to.strftime('%b %d, %Y')}"

        return 'Available'

    def get_views_30d(self, obj):
        """Count VIEW events in last 30 days."""
        from datetime import timedelta
        from django.utils import timezone

        thirty_days_ago = timezone.now() - timedelta(days=30)
        return obj.events.filter(
            event_type='VIEW',
            occurred_at__gte=thirty_days_ago
        ).count()

    def get_enquiries_30d(self, obj):
        """Count ENQUIRY events in last 30 days."""
        from datetime import timedelta
        from django.utils import timezone

        thirty_days_ago = timezone.now() - timedelta(days=30)
        return obj.events.filter(
            event_type='ENQUIRY',
            occurred_at__gte=thirty_days_ago
        ).count()

    def get_bookings_30d(self, obj):
        """Count BOOKING_CONFIRMED events in last 30 days."""
        from datetime import timedelta
        from django.utils import timezone

        thirty_days_ago = timezone.now() - timedelta(days=30)
        return obj.events.filter(
            event_type='BOOKING_CONFIRMED',
            occurred_at__gte=thirty_days_ago
        ).count()

    def get_has_wifi(self, obj):
        """Check if property has WiFi feature."""
        if not obj.property:
            return False

        return obj.property.features.filter(code='WIFI').exists()

    def get_has_kitchen(self, obj):
        """Check if property has Kitchen feature."""
        if not obj.property:
            return False

        return obj.property.features.filter(code='KITCHEN').exists()

    def get_has_pool(self, obj):
        """Check if property has any pool feature."""
        if not obj.property:
            return False

        pool_codes = ['PRIVATE_POOL', 'SHARED_POOL', 'PUBLIC_POOL']
        return obj.property.features.filter(code__in=pool_codes).exists()

    def get_has_private_pool(self, obj):
        """Check if property has private pool feature."""
        if not obj.property:
            return False

        return obj.property.features.filter(code='PRIVATE_POOL').exists()

    def get_has_sea_view(self, obj):
        """Check if property has sea view feature."""
        if not obj.property:
            return False

        return obj.property.features.filter(code='SEA_VIEW').exists()

    def get_cover_image(self, obj):
        """Get the URL of the cover image (first image)."""
        request = self.context.get('request')
        try:
            # Prefer images explicitly linked to this listing
            image = PropertyImage.objects.filter(listing=obj).order_by(
                "display_order", "uploaded_at"
            ).first()

            # Fallback: images linked to the underlying property
            if not image and obj.property_id:
                image = PropertyImage.objects.filter(property=obj.property).order_by(
                    "display_order", "uploaded_at"
                ).first()
        except ProgrammingError:
            return None

        if image and image.image:
            if request:
                return request.build_absolute_uri(image.image.url)
            return image.image.url
        return None


class PortfolioSummaryItemSerializer(serializers.Serializer):
    """Serializer for portfolio summary per listing type."""

    listing_type = serializers.CharField()
    total_listings = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    occupied_units = serializers.IntegerField(required=False, allow_null=True)
    vacant_units = serializers.IntegerField(required=False, allow_null=True)
    avg_price = serializers.CharField(required=False, allow_null=True)
    views_30d = serializers.IntegerField()
    enquiries_30d = serializers.IntegerField()
    bookings_30d = serializers.IntegerField()


class ListingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating listings via PATCH."""

    class Meta:
        model = Listing
        fields = [
            'base_price',
            'currency',
            'status',
            'available_from',
            'available_to',
            'title',
            'description',
        ]


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'url', 'caption', 'display_order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def get_url(self, obj):
        """Get the URL of the image."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None


class LocationSerializer(serializers.ModelSerializer):
    """Nested serializer for property locations."""

    class Meta:
        model = Location
        fields = [
            "id",
            "country",
            "region",
            "city",
            "area",
            "address_line",
            "latitude",
            "longitude",
        ]


class PropertySerializer(serializers.ModelSerializer):
    """Nested serializer for properties used in listing detail."""

    location = LocationSerializer()

    class Meta:
        model = Property
        fields = [
            "id",
            "reference_code",
            "title",
            "description",
            "location",
            "property_type",
            "building_name",
            "flat_number",
            "floor_number",
            "total_area_sqm",
            "net_area_sqm",
            "bedrooms",
            "living_rooms",
            "bathrooms",
            "room_configuration_label",
        ]


class ContactSerializer(serializers.ModelSerializer):
    """Minimal contact serializer used for listing owner."""

    class Meta:
        model = Contact
        fields = ["id", "first_name", "last_name", "phone", "email"]


class ListingTypeSerializer(serializers.ModelSerializer):
    """Serializer for listing type used in detail view."""

    class Meta:
        model = ListingType
        fields = ["id", "code", "label"]


class ListingDetailSerializer(serializers.ModelSerializer):
    """
    Detailed listing serializer used by GET /api/v1/real_estate/listings/{id}/

    This matches the frontend Listing interface in:
    frontend/src/features/seller-dashboard/domains/real-estate/portfolio/types/realEstateModels.ts
    where listing_type, property, owner, and image_urls are all populated.
    """

    listing_type = ListingTypeSerializer()
    property = PropertySerializer()
    owner = ContactSerializer()
    image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "reference_code",
            "listing_type",
            "property",
            "project",
            "owner",
            "title",
            "description",
            "base_price",
            "currency",
            "price_period",
            "available_from",
            "available_to",
            "status",
            "created_by",
            "created_at",
            "updated_at",
            "image_urls",
        ]

    def get_image_urls(self, obj):
        """Return absolute URLs for images attached via PropertyImage.

        In environments where the PropertyImage migration has not yet been
        applied, gracefully degrade by returning an empty list instead of
        raising a 500 error.
        """
        request = self.context.get("request")

        try:
            # Prefer images explicitly linked to this listing
            images_qs = PropertyImage.objects.filter(listing=obj).order_by(
                "display_order", "uploaded_at"
            )

            # Fallback: images linked to the underlying property
            if not images_qs.exists() and obj.property_id:
                images_qs = PropertyImage.objects.filter(property=obj.property).order_by(
                    "display_order", "uploaded_at"
                )
        except ProgrammingError as exc:
            logger.error(
                "PropertyImage table missing when fetching images for listing %s",
                getattr(obj, "id", None),
                exc_info=True,
            )
            return []

        urls = []
        for image in images_qs:
            if not image.image:
                continue
            if request:
                urls.append(request.build_absolute_uri(image.image.url))
            else:
                urls.append(image.image.url)
        return urls
