"""
API views for marketplace endpoints.
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import SellerProfile, GenericListing, ListingImage
from .serializers import (
    SellerProfileSerializer,
    SellerProfileCreateSerializer,
    GenericListingSerializer,
    GenericListingCreateSerializer,
    GenericListingListSerializer,
    ListingImageSerializer,
)


class SellerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for seller profiles.

    Endpoints:
    - GET /api/v1/marketplace/sellers/ - List all sellers
    - POST /api/v1/marketplace/sellers/ - Create seller profile
    - GET /api/v1/marketplace/sellers/{id}/ - Get seller details
    - PATCH /api/v1/marketplace/sellers/{id}/ - Update seller profile
    - DELETE /api/v1/marketplace/sellers/{id}/ - Delete seller profile
    - GET /api/v1/marketplace/sellers/me/ - Get current user's seller profile
    """

    queryset = SellerProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['business_name', 'description']
    ordering_fields = ['rating', 'created_at', 'total_listings']
    filterset_fields = ['verified', 'categories']

    def get_serializer_class(self):
        if self.action == 'create':
            return SellerProfileCreateSerializer
        return SellerProfileSerializer

    def get_queryset(self):
        """Filter queryset based on permissions"""
        queryset = super().get_queryset()

        # Regular users can only see verified sellers
        if not self.request.user.is_staff:
            queryset = queryset.filter(verified=True)

        return queryset

    def perform_create(self, serializer):
        """Create seller profile for current user"""
        # Check if user already has a seller profile
        if SellerProfile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError("User already has a seller profile")

        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only allow users to update their own profile"""
        if serializer.instance.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only update your own seller profile")
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's seller profile"""
        try:
            seller = SellerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(seller)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response(
                {"detail": "You do not have a seller profile"},
                status=status.HTTP_404_NOT_FOUND
            )


class GenericListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for generic marketplace listings.

    Endpoints:
    - GET /api/v1/marketplace/listings/ - List all listings
    - POST /api/v1/marketplace/listings/ - Create listing
    - GET /api/v1/marketplace/listings/{id}/ - Get listing details
    - PATCH /api/v1/marketplace/listings/{id}/ - Update listing
    - DELETE /api/v1/marketplace/listings/{id}/ - Delete listing
    - GET /api/v1/marketplace/listings/my-listings/ - Get current seller's listings
    - POST /api/v1/marketplace/listings/{id}/increment-views/ - Increment view count
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['price', 'created_at', 'views_count']
    filterset_fields = ['category', 'status', 'is_featured', 'seller']

    def get_serializer_class(self):
        if self.action == 'create':
            return GenericListingCreateSerializer
        elif self.action == 'list':
            return GenericListingListSerializer
        return GenericListingSerializer

    def get_queryset(self):
        """
        Filter listings based on query parameters.
        Supports:
        - ?category=vehicles
        - ?location=Cyprus
        - ?min_price=100&max_price=1000
        - ?seller_verified=true
        """
        queryset = GenericListing.objects.select_related('seller').prefetch_related('images')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by location (case-insensitive contains)
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by verified sellers only
        seller_verified = self.request.query_params.get('seller_verified')
        if seller_verified and seller_verified.lower() == 'true':
            queryset = queryset.filter(seller__verified=True)

        # Only show active listings to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='active')

        return queryset

    def perform_create(self, serializer):
        """Create listing for current user's seller profile"""
        try:
            seller = SellerProfile.objects.get(user=self.request.user)
        except SellerProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must create a seller profile before creating listings")

        serializer.save(seller=seller)

    def perform_update(self, serializer):
        """Only allow seller to update their own listings"""
        if serializer.instance.seller.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only update your own listings")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow seller to delete their own listings"""
        if instance.seller.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only delete your own listings")
        instance.delete()

    @action(detail=False, methods=['get'])
    def my_listings(self, request):
        """Get current seller's listings"""
        try:
            seller = SellerProfile.objects.get(user=request.user)
            listings = self.get_queryset().filter(seller=seller)

            page = self.paginate_queryset(listings)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(listings, many=True)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response(
                {"detail": "You do not have a seller profile"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Increment view count for a listing"""
        listing = self.get_object()
        listing.increment_views()
        return Response({
            "views_count": listing.views_count
        })


class ListingImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing images.

    Endpoints:
    - GET /api/v1/marketplace/images/ - List all images
    - POST /api/v1/marketplace/images/ - Create image
    - DELETE /api/v1/marketplace/images/{id}/ - Delete image
    """

    queryset = ListingImage.objects.all()
    serializer_class = ListingImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['listing']

    def perform_create(self, serializer):
        """Ensure user owns the listing before adding images"""
        listing = serializer.validated_data['listing']
        if listing.seller.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only add images to your own listings")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow seller to delete their own listing images"""
        if instance.listing.seller.user != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("You can only delete images from your own listings")
        instance.delete()
