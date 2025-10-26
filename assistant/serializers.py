# assistant/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ServiceProvider, ServiceFeature, Booking, KnowledgeBase, LinkSource, Request
from listings.models import Listing, Image

User = get_user_model()

class ServiceFeatureSerializer(serializers.ModelSerializer):
    """Serializer for Service Features, customized for multilingual support."""
    name = serializers.SerializerMethodField()

    class Meta:
        model = ServiceFeature
        fields = ['name']

    def get_name(self, obj):
        # Get language from the context, default to 'en'
        language = self.context.get('language', 'en')
        return obj.get_name(language)

class ServiceProviderSerializer(serializers.ModelSerializer):
    """Serializer for Service Providers, including features and multilingual fields."""
    features = ServiceFeatureSerializer(many=True, read_only=True)
    description = serializers.SerializerMethodField()

    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'name', 'category', 'location', 'description', 'rating',
            'price_range', 'booking_url', 'image_url', 'features'
        ]

    def get_description(self, obj):
        # Get language from the context, default to 'en'
        language = self.context.get('language', 'en')
        return obj.get_description(language)

class BookingSerializer(serializers.ModelSerializer):
    """Serializer for creating and viewing Bookings."""
    service_provider_name = serializers.CharField(source='service_provider.name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('booking_reference', 'created_at', 'updated_at')

# NOTE: UserRequestSerializer and UserRequestCreateSerializer removed - UserRequest model deprecated

class KnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer for Knowledge Base articles with multilingual support."""
    content = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeBase
        fields = ['id', 'title', 'category', 'content', 'keywords', 'source_link']

    def get_content(self, obj):
        # Get language from the context, default to 'en'
        language = self.context.get('language', 'en')
        return obj.get_content(language)

class LinkSourceSerializer(serializers.ModelSerializer):
    """Serializer for the LinkSource model."""
    class Meta:
        model = LinkSource
        fields = '__all__'

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['image'] # We only need the URL path for the frontend

class ListingSerializer(serializers.ModelSerializer):
    # This field will aggregate all image URLs into a single list.
    images = serializers.SerializerMethodField()
    verified_with_photos = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    card_variant = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id',
            'title',
            'description',
            'price',
            'currency',
            'location',
            'images',
            'verified_with_photos',
            'features',
            'category_slug',
            'card_variant',
        ]

    def get_images(self, obj):
        """
        Fetch all related Image objects and build their full, absolute URLs.
        """
        request = self.context.get('request')
        images = obj.images.all()
        # If there's a request context, build the full URL, otherwise return the relative path.
        return [request.build_absolute_uri(image.image.url) for image in images] if request else [image.image.url for image in images]

    def get_verified_with_photos(self, obj):
        """
        Return True if the listing has at least one image.
        """
        return obj.images.exists()

    def get_features(self, obj):
        """
        Extract features from dynamic_fields JSON (works for all categories).
        """
        df = obj.dynamic_fields or {}
        features = []
        
        # Accommodation features
        features.extend(df.get('indoor_features', []) or [])
        features.extend(df.get('outdoor_features', []) or [])
        
        # Vehicle/Product features
        features.extend(df.get('features', []) or [])
        
        return features

    def get_category_slug(self, obj):
        """
        Return category slug for future conditional rendering.
        """
        return obj.category.slug if obj.category else None

    def get_card_variant(self, obj):
        """
        Hint for frontend to optionally use specialized card layouts per category.
        Real estate: accommodation, property. Product: vehicle, general_product. Service: service.
        """
        if not obj.category:
            return 'product'
        slug = obj.category.slug.lower()
        if slug in ('accommodation', 'property', 'real_estate'):
            return 'real_estate'
        elif slug in ('vehicle', 'car', 'auto'):
            return 'product'
        elif slug in ('service', 'cleaning', 'electrician', 'plumber', 'restaurant'):
            return 'service'
        else:
            return 'product'

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = [
            'id', 'category', 'subcategory', 'location', 'budget_amount', 'budget_currency',
            'attributes', 'contact', 'status', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_by', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        # Redact contact unless staff or owner
        if not (user and user.is_authenticated and (user.is_staff or user == instance.created_by)):
            if 'contact' in data:
                data['contact'] = None
        return data

class RequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = [
            'category', 'subcategory', 'location', 'budget_amount', 'budget_currency',
            'attributes', 'contact'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        return Request.objects.create(created_by=user, **validated_data)