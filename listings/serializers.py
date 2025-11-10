from rest_framework import serializers
from .models import Booking, Listing, SellerProfile, BuyerRequest, BroadcastMessage
from datetime import date


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
    """Basic listing serializer for API responses"""

    category_name = serializers.CharField(source='category.name', read_only=True)
    image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'price',
            'currency',
            'location',
            'status',
            'is_featured',
            'dynamic_fields',
            'image_urls',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_urls(self, obj):
        """Get all image URLs for the listing"""
        request = self.context.get('request')
        images = obj.images.all()

        if request and images:
            return [request.build_absolute_uri(image.image.url) for image in images]
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


class BuyerRequestSerializer(serializers.ModelSerializer):
    """Serializer for buyer requests"""

    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BuyerRequest
        fields = [
            'id',
            'buyer',
            'buyer_username',
            'category',
            'category_name',
            'message',
            'location',
            'budget',
            'currency',
            'is_fulfilled',
            'response_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'buyer', 'buyer_username', 'response_count', 'created_at', 'updated_at']


class BuyerRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating buyer requests"""

    class Meta:
        model = BuyerRequest
        fields = [
            'category',
            'message',
            'location',
            'budget',
            'currency',
        ]

    def validate_message(self, value):
        """Ensure message is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Request message cannot be empty.")
        return value


class BroadcastMessageSerializer(serializers.ModelSerializer):
    """Serializer for broadcast messages"""

    seller_business_name = serializers.CharField(source='seller.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BroadcastMessage
        fields = [
            'id',
            'seller',
            'seller_business_name',
            'title',
            'message',
            'category',
            'category_name',
            'target_audience',
            'status',
            'views_count',
            'response_count',
            'created_at',
            'updated_at',
            'published_at',
        ]
        read_only_fields = [
            'id',
            'seller',
            'seller_business_name',
            'views_count',
            'response_count',
            'created_at',
            'updated_at',
            'published_at',
        ]


class BroadcastMessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating broadcast messages"""

    class Meta:
        model = BroadcastMessage
        fields = [
            'title',
            'message',
            'category',
            'target_audience',
            'status',
        ]

    def validate_title(self, value):
        """Ensure title is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Broadcast title cannot be empty.")
        return value

    def validate_message(self, value):
        """Ensure message is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Broadcast message cannot be empty.")
        return value


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
