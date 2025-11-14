"""
DRF serializers for Real Estate API - v1.
"""
from rest_framework import serializers
from .models import Listing


# Legacy serializer - disabled during v1 migration
# class ListingSerializer(serializers.ModelSerializer):
#     """Serializer for Listing model - matches frontend CardItem schema."""
#
#     class Meta:
#         model = Listing
#         fields = (
#             "id",
#             "title",
#             "description",
#             "city",
#             "district",
#             "lat",
#             "lng",
#             "bedrooms",
#             "bathrooms",
#             "property_type",
#             "rent_type",
#             "currency",
#             "monthly_price",
#             "nightly_price",
#             "available_from",
#             "min_term_months",
#             "min_nights",
#             "deposit",
#             "amenities",
#             "images",
#             "agency_name",
#             "rating",
#         )


# Placeholder for v1 serializers - will be implemented with Portfolio API
class ListingSerializer(serializers.ModelSerializer):
    """Placeholder serializer for v1 Listing model."""

    class Meta:
        model = Listing
        fields = '__all__'
