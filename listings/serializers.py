from rest_framework import serializers
from .models import Listing, SellerProfile, Category, SubCategory, ListingImage
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
# LISTING IMAGE SERIALIZER
# ============================================================================


class ListingImageSerializer(serializers.ModelSerializer):
    """Serializer for listing images"""

    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


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
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_username', 'category', 'category_name', 'category_slug',
            'category_is_bookable', 'subcategory', 'subcategory_name', 'subcategory_slug',
            'title', 'description', 'price', 'currency', 'location', 'latitude', 'longitude',
            'dynamic_fields', 'status', 'is_featured', 'views', 'images',
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
            'status',
            'is_featured',
            'views',
            'dynamic_fields',
            'image_urls',
            'created_at',
        ]
        read_only_fields = ['id', 'owner_username', 'views', 'created_at']

    def get_image_urls(self, obj):
        """Get first image URL for listing preview"""
        request = self.context.get('request')
        images = obj.images.all()

        if request and images:
            return [request.build_absolute_uri(images[0].image.url)]
        return []


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
            'verified',
            'rating',
            'total_listings',
            'ai_agent_enabled',
            'phone',
            'email',
            'website',
            'description',
            'logo_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'user_id', 'username', 'verified', 'rating', 'total_listings', 'created_at', 'updated_at']


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
