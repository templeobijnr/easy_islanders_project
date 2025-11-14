"""
Portfolio API views for Real Estate v1.

Provides endpoints for:
1. Portfolio listings list with filtering and pagination
2. Portfolio summary with aggregated stats per listing type
3. Listing update via PATCH
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from real_estate.models import Listing, ListingType, ListingEvent
from .portfolio_serializers import (
    PortfolioListingSerializer,
    PortfolioSummaryItemSerializer,
    ListingUpdateSerializer,
)


class PortfolioViewSet(viewsets.ViewSet):
    """
    Portfolio API for managing real estate listings.

    Endpoints:
    - GET /api/v1/real_estate/portfolio/listings/ - List listings with filters
    - GET /api/v1/real_estate/portfolio/summary/ - Get summary stats
    - PATCH /api/v1/real_estate/listings/:id/ - Update listing
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='listings')
    def listings(self, request):
        """
        GET /api/v1/real_estate/portfolio/listings/

        Query Parameters:
            - listing_type (str): Filter by listing type code (e.g., "DAILY_RENTAL")
            - status (str): Filter by status (e.g., "ACTIVE")
            - city (str): Filter by city name
            - area (str): Filter by area name
            - search (str): Search in title, reference_code, description
            - page (int): Page number (default: 1)
            - page_size (int): Items per page (default: 20)

        Response:
            {
                "results": [PortfolioListing, ...],
                "page": int,
                "page_size": int,
                "total": int
            }
        """
        # Extract query parameters
        listing_type_code = request.query_params.get('listing_type')
        status_filter = request.query_params.get('status')
        city_filter = request.query_params.get('city')
        area_filter = request.query_params.get('area')
        search_query = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Base queryset
        qs = Listing.objects.select_related(
            'listing_type',
            'property',
            'property__location',
            'property__property_type'
        ).prefetch_related(
            'property__features',
            'events'
        ).all()

        # Apply filters
        if listing_type_code and listing_type_code != 'ALL':
            qs = qs.filter(listing_type__code=listing_type_code)

        if status_filter and status_filter != 'ALL':
            qs = qs.filter(status=status_filter)

        if city_filter:
            qs = qs.filter(property__location__city__iexact=city_filter)

        if area_filter:
            qs = qs.filter(property__location__area__iexact=area_filter)

        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query) |
                Q(reference_code__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Count total before pagination
        total = qs.count()

        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        qs = qs[start:end]

        # Serialize
        serializer = PortfolioListingSerializer(qs, many=True)

        return Response({
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total': total,
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        GET /api/v1/real_estate/portfolio/summary/

        Response:
            [
                {
                    "listing_type": "DAILY_RENTAL",
                    "total_listings": int,
                    "active_listings": int,
                    "views_30d": int,
                    "enquiries_30d": int,
                    "bookings_30d": int
                },
                ...
            ]
        """
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Get all listing types
        listing_types = ListingType.objects.all()

        summary = []
        for lt in listing_types:
            # Count listings
            total = Listing.objects.filter(listing_type=lt).count()
            active = Listing.objects.filter(listing_type=lt, status='ACTIVE').count()

            # Get listing IDs for this type
            listing_ids = Listing.objects.filter(listing_type=lt).values_list('id', flat=True)

            # Count events in last 30 days
            views = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='VIEW',
                occurred_at__gte=thirty_days_ago
            ).count()

            enquiries = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='ENQUIRY',
                occurred_at__gte=thirty_days_ago
            ).count()

            bookings = ListingEvent.objects.filter(
                listing_id__in=listing_ids,
                event_type='BOOKING_CONFIRMED',
                occurred_at__gte=thirty_days_ago
            ).count()

            summary.append({
                'listing_type': lt.code,
                'total_listings': total,
                'active_listings': active,
                'views_30d': views,
                'enquiries_30d': enquiries,
                'bookings_30d': bookings,
            })

        serializer = PortfolioSummaryItemSerializer(summary, many=True)
        return Response(serializer.data)


class ListingViewSet(viewsets.ModelViewSet):
    """
    Listing CRUD API.

    Endpoints:
    - PATCH /api/v1/real_estate/listings/:id/ - Update listing
    """

    permission_classes = [IsAuthenticated]
    queryset = Listing.objects.all()
    serializer_class = ListingUpdateSerializer
    http_method_names = ['get', 'patch']  # Only allow GET and PATCH

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'list' or self.action == 'retrieve':
            return PortfolioListingSerializer
        return ListingUpdateSerializer

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/v1/real_estate/listings/:id/

        Request Body:
            {
                "base_price": "1200.00",
                "currency": "EUR",
                "status": "ACTIVE",
                "available_from": "2025-01-01",
                "available_to": "2025-12-31",
                "title": "Updated Title",
                "description": "Updated description"
            }

        Response:
            {
                "id": int,
                "reference_code": "...",
                ...
            }
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return full listing data
        response_serializer = PortfolioListingSerializer(instance)
        return Response(response_serializer.data)
