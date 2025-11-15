"""
DRF serializers for Portfolio API v1.

These serializers match the TypeScript interfaces defined in:
frontend/src/features/seller-dashboard/domains/real-estate/portfolio/types.ts
"""
from rest_framework import serializers
from real_estate.models import Listing, ListingType, Property, PropertyFeature, Feature


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
