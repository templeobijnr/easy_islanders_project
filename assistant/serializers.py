# assistant/serializers.py

from rest_framework import serializers
from .models import UserRequest, ServiceProvider, ServiceFeature, Booking, KnowledgeBase, LinkSource

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

class UserRequestSerializer(serializers.ModelSerializer):
    """Serializer for viewing User Requests."""
    class Meta:
        model = UserRequest
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class UserRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new User Request."""
    class Meta:
        model = UserRequest
        fields = [
            'name', 'phone_number', 'email', 'preferred_language',
            'request_type', 'message', 'original_message',
            'location_preference', 'budget_range', 'dates_needed', 'number_of_people'
        ]

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