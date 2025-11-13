from rest_framework import serializers
from .models import Listing, SellerProfile, Category, SubCategory, ListingImage, CarListing, ServiceListing, EventListing, ProductListing
from bookings.models import Booking
from datetime import date


# ============================================================================
# CATEGORY & SUBCATEGORY SERIALIZERS
# ============================================================================


class SubCategorySerializer(serializers.ModelSerializer):
    """Serializer for subcategories"""

    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'description']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories with subcategories and schema"""

    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'icon', 'color', 'description',
            'schema', 'is_bookable', 'is_active', 'subcategories',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============================================================================
# DOMAIN SERIALIZER (maps Category → Domain for API ergonomics)
# ============================================================================


class DomainSerializer(serializers.ModelSerializer):
    """Expose top-level categories as 'domains' for the public API."""

    key = serializers.SlugField(source='slug', read_only=True)
    count_subcategories = serializers.IntegerField(source='subcategories.count', read_only=True)

    class Meta:
        model = Category
        fields = [
            'id',
            'key',
            'name',
            'description',
            'icon',
            'color',
            'is_active',
            'is_bookable',
            'is_featured_category',
            'count_subcategories',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


# ============================================================================
# LISTING IMAGE SERIALIZER
# ============================================================================


class ListingImageSerializer(serializers.ModelSerializer):
    """Serializer for listing images"""

    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


# ============================================================================
# DOMAIN DETAIL SERIALIZERS
# ============================================================================


class CarListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarListing
        fields = [
            'vehicle_type', 'make', 'model', 'year', 'mileage_km',
            'transmission', 'fuel_type', 'is_for_sale', 'is_for_rent',
            'sale_price', 'rental_price_per_day', 'rental_price_per_month',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ServiceListingSerializer(serializers.ModelSerializer):
    service_subcategory_slug = serializers.SlugRelatedField(
        source='service_subcategory', slug_field='slug', read_only=True
    )

    class Meta:
        model = ServiceListing
        fields = [
            'service_subcategory', 'service_subcategory_slug',
            'pricing_model', 'base_price', 'supports_online', 'supports_on_site', 'max_group_size',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class EventListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventListing
        fields = [
            'start_datetime', 'end_datetime', 'venue_name', 'max_capacity',
            'has_tickets', 'base_ticket_price', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProductListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductListing
        fields = [
            'brand', 'sku', 'stock_quantity', 'is_new', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ============================================================================
# LISTING SERIALIZERS
# ============================================================================


class ListingDetailSerializer(serializers.ModelSerializer):
    """Detailed listing serializer with full category info and images"""

    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_is_bookable = serializers.BooleanField(source='category.is_bookable', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, allow_null=True)
    subcategory_slug = serializers.CharField(source='subcategory.slug', read_only=True, allow_null=True)
    images = ListingImageSerializer(many=True, read_only=True)
    # Domain detail (read-only nested)
    car = CarListingSerializer(read_only=True)
    service = ServiceListingSerializer(read_only=True)
    event = EventListingSerializer(read_only=True)
    product = ProductListingSerializer(read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    real_estate_property_id = serializers.UUIDField(source='real_estate_property.id', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_username', 'category', 'category_name', 'category_slug',
            'category_is_bookable', 'subcategory', 'subcategory_name', 'subcategory_slug',
            'title', 'description', 'price', 'currency', 'location', 'latitude', 'longitude',
            'domain', 'listing_kind', 'transaction_type',
            'dynamic_fields', 'status', 'is_featured', 'views', 'images',
            'car', 'service', 'event', 'product',
            'real_estate_property_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'views', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate dynamic_fields against category schema"""
        category = data.get('category')
        dynamic_fields = data.get('dynamic_fields', {})

        if category and dynamic_fields:
            schema = category.schema
            if schema and 'fields' in schema:
                # Basic validation: check that all required fields are present
                required_fields = [
                    f['name'] for f in schema['fields']
                    if f.get('required') and 'required_if' not in f
                ]
                for field_name in required_fields:
                    if field_name not in dynamic_fields:
                        raise serializers.ValidationError(
                            f"Required field '{field_name}' is missing."
                        )

        return data


class BookingSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'listing',
            'listing_title',
            'booking_type',
            'check_in',
            'check_out',
            'total_price',
            'currency',
            'status',
            'notes',
            'duration_days',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'listing_title', 'duration_days']

    def validate(self, data):
        """
        Validate booking dates and availability
        """
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        booking_type = data.get('booking_type')

        # Validate dates exist for short-term bookings
        if booking_type == 'short_term':
            if not check_in or not check_out:
                raise serializers.ValidationError(
                    "Short-term bookings require both check-in and check-out dates."
                )

        # Validate date logic
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError(
                    "Check-out date must be after check-in date."
                )

            if check_in < date.today():
                raise serializers.ValidationError(
                    "Check-in date cannot be in the past."
                )

        return data


class ListingSerializer(serializers.ModelSerializer):
    """Basic listing serializer for API list responses"""

    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, allow_null=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    image_urls = serializers.SerializerMethodField()
    # Optional nested domain detail (write-through)
    car = CarListingSerializer(required=False)
    service = ServiceListingSerializer(required=False)
    event = EventListingSerializer(required=False)
    product = ProductListingSerializer(required=False)

    class Meta:
        model = Listing
        fields = [
            'id',
            'owner_username',
            'title',
            'description',
            'category',
            'category_name',
            'category_slug',
            'subcategory',
            'subcategory_name',
            'price',
            'currency',
            'location',
            'domain', 'listing_kind', 'transaction_type',
            'status',
            'is_featured',
            'views',
            'dynamic_fields',
            'image_urls',
            'car', 'service', 'event', 'product',
            'created_at',
        ]
        read_only_fields = ['id', 'owner_username', 'views', 'created_at']

    def validate(self, attrs):
        # Enforce domain ↔ detail model alignment when nested payload provided
        request_data = getattr(self, 'initial_data', {}) or {}
        has_car = 'car' in request_data
        has_service = 'service' in request_data
        has_event = 'event' in request_data
        has_product = 'product' in request_data

        category = attrs.get('category') or getattr(self.instance, 'category', None)
        domain_slug = attrs.get('domain') or (category.slug if category else None)

        def bad(msg):
            from rest_framework import serializers as _s
            raise _s.ValidationError(msg)

        if has_car and domain_slug not in {'vehicles', 'cars'}:
            bad("'car' details require domain/category slug 'vehicles'.")
        if has_service and domain_slug not in {'services'}:
            bad("'service' details require domain/category slug 'services'.")
        if has_event and domain_slug not in {'events', 'activities'}:
            bad("'event' details require domain/category slug 'events' or 'activities'.")
        if has_product and domain_slug not in {'products', 'p2p', 'marketplace', 'electronics'}:
            bad("'product' details require a products-like domain (products, p2p, marketplace, electronics).")

        return attrs

    def get_image_urls(self, obj):
        """Get first image URL for listing preview"""
        request = self.context.get('request')
        images = obj.images.all()

        if request and images:
            return [request.build_absolute_uri(images[0].image.url)]
        return []

    def create(self, validated_data):
        car_data = validated_data.pop('car', None)
        service_data = validated_data.pop('service', None)
        event_data = validated_data.pop('event', None)
        product_data = validated_data.pop('product', None)

        listing = super().create(validated_data)

        # Create domain detail if provided
        if car_data:
            CarListing.objects.update_or_create(listing=listing, defaults=car_data)
        if service_data:
            ServiceListing.objects.update_or_create(listing=listing, defaults=service_data)
        if event_data:
            EventListing.objects.update_or_create(listing=listing, defaults=event_data)
        if product_data:
            ProductListing.objects.update_or_create(listing=listing, defaults=product_data)

        return listing

    def update(self, instance, validated_data):
        car_data = validated_data.pop('car', None)
        service_data = validated_data.pop('service', None)
        event_data = validated_data.pop('event', None)
        product_data = validated_data.pop('product', None)

        listing = super().update(instance, validated_data)

        # Upsert domain detail if provided
        if car_data is not None:
            CarListing.objects.update_or_create(listing=listing, defaults=car_data)
        if service_data is not None:
            ServiceListing.objects.update_or_create(listing=listing, defaults=service_data)
        if event_data is not None:
            EventListing.objects.update_or_create(listing=listing, defaults=event_data)
        if product_data is not None:
            ProductListing.objects.update_or_create(listing=listing, defaults=product_data)

        return listing


class SellerProfileSerializer(serializers.ModelSerializer):
    """Serializer for seller profiles"""

    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = SellerProfile
        fields = [
            'id',
            'user',
            'user_id',
            'username',
            'business_name',
            'slug',
            'verified',
            'rating',
            'total_listings',
            'ai_agent_enabled',
            'phone',
            'email',
            'website',
            'description',
            'logo_url',
            'storefront_published',
            'storefront_config',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'user_id', 'username', 'verified', 'rating', 'total_listings', 'created_at', 'updated_at']


# ============================================================================
# REAL ESTATE DASHBOARD SERIALIZERS
# ============================================================================


class REDashboardOverviewSerializer(serializers.Serializer):
    occupancy_rate = serializers.FloatField()
    units_occupied = serializers.IntegerField()
    total_units = serializers.IntegerField()
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_currency = serializers.CharField()
    summary_period_days = serializers.IntegerField()


class REPortfolioRowSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    property_type = serializers.CharField()
    city = serializers.CharField(allow_blank=True)
    status = serializers.CharField()
    purpose = serializers.CharField()
    nightly_price = serializers.IntegerField(allow_null=True)
    monthly_price = serializers.IntegerField(allow_null=True)
    occupancy_last_30d = serializers.FloatField()


class REPortfolioSerializer(serializers.Serializer):
    summary = serializers.DictField()
    mix = serializers.ListField(child=serializers.DictField())
    items = REPortfolioRowSerializer(many=True)
    underperforming = REPortfolioRowSerializer(many=True)


class RERequestItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    created_at = serializers.DateTimeField()
    status = serializers.CharField()
    customer_name = serializers.CharField(allow_blank=True)
    start_date = serializers.DateTimeField(allow_null=True)
    end_date = serializers.DateTimeField(allow_null=True)
    listing_id = serializers.UUIDField(allow_null=True)
    listing_title = serializers.CharField(allow_blank=True)
    requested_type = serializers.CharField(allow_blank=True)


class RERequestsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    items = RERequestItemSerializer(many=True)


class RECalendarEventSerializer(serializers.Serializer):
    id = serializers.CharField()
    kind = serializers.ChoiceField(choices=['booking', 'block'])
    title = serializers.CharField()
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    listing_id = serializers.UUIDField(allow_null=True)
    listing_title = serializers.CharField(allow_blank=True)


class RECalendarSerializer(serializers.Serializer):
    range_start = serializers.DateTimeField()
    range_end = serializers.DateTimeField()
    events = RECalendarEventSerializer(many=True)


class SellerProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating seller profiles"""

    class Meta:
        model = SellerProfile
        fields = [
            'business_name',
            'phone',
            'email',
            'website',
            'description',
            'logo_url',
        ]

    def create(self, validated_data):
        # User is set in the view
        return super().create(validated_data)




class SellerAnalyticsSerializer(serializers.Serializer):
    """Serializer for seller dashboard analytics"""

    # Stats section
    stats = serializers.DictField(child=serializers.Field())

    # Category breakdown
    category_breakdown = serializers.DictField(child=serializers.IntegerField())

    # Performance trends
    trends = serializers.DictField(child=serializers.Field())

    # AI-powered insights
    insights = serializers.ListField(child=serializers.CharField())
