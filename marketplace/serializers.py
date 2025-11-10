"""
Serializers for marketplace models.
"""
from rest_framework import serializers
from .models import SellerProfile, GenericListing, ListingImage


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
            'categories',
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
            'categories',
            'phone',
            'email',
            'website',
            'description',
            'logo_url',
        ]

    def create(self, validated_data):
        # User is set in the view
        return super().create(validated_data)


class ListingImageSerializer(serializers.ModelSerializer):
    """Serializer for listing images"""

    class Meta:
        model = ListingImage
        fields = ['id', 'image_url', 'caption', 'display_order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class GenericListingSerializer(serializers.ModelSerializer):
    """Serializer for generic marketplace listings"""

    seller = SellerProfileSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    price_display = serializers.CharField(read_only=True)

    class Meta:
        model = GenericListing
        fields = [
            'id',
            'seller',
            'title',
            'description',
            'category',
            'price',
            'currency',
            'price_display',
            'location',
            'latitude',
            'longitude',
            'image_url',
            'metadata',
            'status',
            'is_featured',
            'views_count',
            'images',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'seller', 'views_count', 'created_at', 'updated_at', 'price_display']

    def validate_metadata(self, value):
        """Validate metadata is a dictionary"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Metadata must be a dictionary")
        return value

    def validate_price(self, value):
        """Validate price is positive"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price must be positive")
        return value


class GenericListingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating marketplace listings"""

    class Meta:
        model = GenericListing
        fields = [
            'title',
            'description',
            'category',
            'price',
            'currency',
            'location',
            'latitude',
            'longitude',
            'image_url',
            'metadata',
            'status',
        ]

    def validate_metadata(self, value):
        """Validate metadata is a dictionary"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Metadata must be a dictionary")
        return value

    def validate_price(self, value):
        """Validate price is positive"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price must be positive")
        return value


class GenericListingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing lists"""

    seller_name = serializers.CharField(source='seller.business_name', read_only=True)
    seller_verified = serializers.BooleanField(source='seller.verified', read_only=True)
    price_display = serializers.CharField(read_only=True)

    class Meta:
        model = GenericListing
        fields = [
            'id',
            'title',
            'category',
            'price',
            'currency',
            'price_display',
            'location',
            'image_url',
            'status',
            'is_featured',
            'seller_name',
            'seller_verified',
            'created_at',
        ]
