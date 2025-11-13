"""
Easy Islanders Booking System - URL Configuration

REST API endpoints for booking system.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookingTypeViewSet,
    BookingViewSet,
    BookingAvailabilityViewSet,
    BookingReviewViewSet,
)

app_name = 'bookings'

# Create router for viewsets
router = DefaultRouter()
router.register(r'types', BookingTypeViewSet, basename='booking-type')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'availability', BookingAvailabilityViewSet, basename='availability')
router.register(r'reviews', BookingReviewViewSet, basename='review')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]
