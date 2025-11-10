from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShortTermBookingView,
    LongTermBookingView,
    check_availability,
    booking_status_webhook,
    user_bookings,
    SellerProfileViewSet,
)

app_name = 'listings'

# Router for ViewSets
router = DefaultRouter()
router.register(r'sellers', SellerProfileViewSet, basename='seller')

urlpatterns = [
    # Short-term booking endpoints
    path('shortterm/bookings/', ShortTermBookingView.as_view(), name='shortterm-booking'),
    path('shortterm/check-availability/', check_availability, name='check-availability'),

    # Long-term booking endpoints
    path('longterm/bookings/', LongTermBookingView.as_view(), name='longterm-booking'),

    # User bookings
    path('bookings/my-bookings/', user_bookings, name='user-bookings'),

    # Webhook for status updates
    path('bookings/status-webhook/', booking_status_webhook, name='booking-status-webhook'),

    # Seller endpoints (router)
    path('', include(router.urls)),
]
