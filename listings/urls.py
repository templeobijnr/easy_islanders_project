from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShortTermBookingView,
    LongTermBookingView,
    check_availability,
    booking_status_webhook,
    user_bookings,
    update_booking,
    SellerProfileViewSet,
    seller_analytics,
    my_listings,
    categories_list,
    subcategories_list,
    CategoryViewSet,
    ListingViewSet,
)

app_name = 'listings'

# Router for ViewSets
router = DefaultRouter()
router.register(r'sellers', SellerProfileViewSet, basename='seller')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'listings', ListingViewSet, basename='listing')

urlpatterns = [
    # Short-term booking endpoints
    path('shortterm/bookings/', ShortTermBookingView.as_view(), name='shortterm-booking'),
    path('shortterm/check-availability/', check_availability, name='check-availability'),

    # Long-term booking endpoints
    path('longterm/bookings/', LongTermBookingView.as_view(), name='longterm-booking'),

    # User bookings
    path('bookings/my-bookings/', user_bookings, name='user-bookings'),
    path('bookings/<uuid:booking_id>/', update_booking, name='update-booking'),

    # Webhook for status updates
    path('bookings/status-webhook/', booking_status_webhook, name='booking-status-webhook'),

    # Seller analytics endpoint
    path('sellers/analytics/', seller_analytics, name='seller-analytics'),

    # My Listings endpoint (seller's listings)
    path('listings/my/', my_listings, name='my-listings'),

    # Categories and subcategories endpoints (legacy)
    path('categories/', categories_list, name='categories-list'),
    path('categories/<slug:category_slug>/subcategories/', subcategories_list, name='subcategories-list'),

    # Seller, buyer requests, and broadcasts endpoints (router)
    path('', include(router.urls)),
]
