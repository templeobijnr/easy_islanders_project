"""
URL configuration for marketplace app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SellerProfileViewSet, GenericListingViewSet, ListingImageViewSet

app_name = 'marketplace'

router = DefaultRouter()
router.register(r'sellers', SellerProfileViewSet, basename='seller')
router.register(r'listings', GenericListingViewSet, basename='listing')
router.register(r'images', ListingImageViewSet, basename='image')

urlpatterns = router.urls
