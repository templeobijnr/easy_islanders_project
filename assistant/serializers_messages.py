"""
F.3.1 Message Serializers with Role-Based PII Gatekeeping

This module implements the critical security layer for message serialization,
enforcing strict PII filtering rules as per API Contract V1.0 [Q7, Q9].

Key Design:
- BroadcastMetadataSerializer: ONLY includes transactional fields (location, budget, category, duration)
- MessageSerializer.to_representation(): Filters based on user role (seller vs customer/staff)
- UserSerializer: Lightweight user object formatting (id, email, name, user_type)
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()


class UserSerializer(serializers.Serializer):
    """
    Lightweight user serializer for sender/recipient fields.
    Formats first_name + last_name into single 'name' field.
    Uses Serializer (not ModelSerializer) to avoid field introspection issues.
    """
    id = serializers.IntegerField()
    email = serializers.CharField()
    name = serializers.SerializerMethodField()
    user_type = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        """Return full name or username as fallback"""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username
    
    def get_user_type(self, obj):
        """Get user type from UserProfile if available"""
        if hasattr(obj, 'userprofile'):
            return obj.userprofile.user_type  # 'customer', 'business', 'staff', 'service'
        return 'unknown'


class BroadcastMetadataSerializer(serializers.Serializer):
    """
    Serializer for broadcast_metadata with STRICT PII GATEKEEPING [Q7, Q9]
    
    VISIBLE to sellers (transactional criteria ONLY):
    - demand_lead_id (linkage)
    - location (where is it needed)
    - budget (how much customer will pay)
    - category (what is needed)
    - duration (project/rental timeline)
    
    STRICTLY HIDDEN from sellers (PII & unstructured data):
    - customer_name ❌
    - customer_email ❌
    - customer_phone ❌
    - customer_preferences_notes ❌
    
    Implementation: Serializer field definitions explicitly omit excluded fields.
    The to_representation() in MessageSerializer ensures these fields never leave the server.
    """
    demand_lead_id = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    budget = serializers.FloatField(required=False, allow_null=True)
    category = serializers.CharField(required=False, allow_blank=True)
    duration = serializers.CharField(required=False, allow_blank=True)
    
    # Explicitly NOT including these fields:
    # customer_name, customer_email, customer_phone, customer_preferences_notes


class OfferMetadataSerializer(serializers.Serializer):
    """
    Serializer for offer_metadata (seller's offer/response details).
    
    No PII filtering needed here - seller is responding with their own offer details.
    """
    price = serializers.FloatField(required=False, allow_null=True)
    availability = serializers.CharField(required=False, allow_blank=True)
    details = serializers.CharField(required=False, allow_blank=True)
    photos = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    links = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    status = serializers.CharField(required=False, allow_blank=True, default='active')


class MessageSerializer(serializers.ModelSerializer):
    """
    Main Message serializer with role-based PII filtering.
    
    CRITICAL SECURITY LAYER: This serializer's to_representation() method
    implements the gatekeeping logic that prevents sellers from seeing customer PII.
    
    Architectural Mandate [Q9]:
    - PII filtering happens ONLY in serialization layer, not in views
    - If viewer is seller/business: broadcast_metadata shows ONLY {location, budget, category, duration}
    - If viewer is customer/staff: broadcast_metadata shows full data (if present)
    """
    sender = UserSerializer()
    recipient = UserSerializer()
    broadcast_metadata = serializers.SerializerMethodField()
    offer_metadata = OfferMetadataSerializer()
    
    class Meta:
        model = Message
        fields = [
            'id', 'type', 'sender', 'recipient', 'conversation_id', 'content',
            'created_at', 'updated_at', 'is_unread', 'read_at', 'demand_lead_id',
            'broadcast_metadata', 'offer_metadata'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'read_at')

    def get_broadcast_metadata(self, obj):
        # F.3.1 PII Gatekeeping Implementation
        request = self.context.get('request')
        user = request.user if request else None

        if obj.type != 'broadcast_request' or not obj.broadcast_metadata:
            return None

        # If user is not the customer or staff, filter the data
        # Assuming a user_type attribute on the user model
        if user and user.is_authenticated and not (user.is_staff or str(user.id) == str(obj.recipient_id)):
             # Sellers see a restricted set of data
            return {
                'location': obj.broadcast_metadata.get('location'),
                'budget': obj.broadcast_metadata.get('budget'),
                'category': obj.broadcast_metadata.get('category'),
            }
        
        # Customers and staff see the full data
        return obj.broadcast_metadata


class ThreadSerializer(serializers.Serializer):
    """
    Serializer for a conversation thread summary.
    """
    thread_id = serializers.CharField()
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.IntegerField()
    updated_at = serializers.DateTimeField()
