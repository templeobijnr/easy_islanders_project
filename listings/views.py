from rest_framework import generics, permissions, status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking, Listing, SellerProfile, BuyerRequest, BroadcastMessage
from .serializers import (
    BookingSerializer,
    ListingSerializer,
    SellerProfileSerializer,
    SellerProfileCreateSerializer,
    BuyerRequestSerializer,
    BuyerRequestCreateSerializer,
    BroadcastMessageSerializer,
    BroadcastMessageCreateSerializer,
    SellerAnalyticsSerializer,
)
from .analytics import compute_dashboard_summary


class ShortTermBookingView(generics.CreateAPIView):
    """
    Create a short-term booking for a listing.

    POST /api/shortterm/bookings/
    Body: {
        "listing_id": "uuid",
        "check_in": "2025-12-01",
        "check_out": "2025-12-10"
    }
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')

        if not listing_id or not check_in_str or not check_out_str:
            return Response(
                {"error": "Missing required fields: listing_id, check_in, check_out"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if listing exists
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse dates
        try:
            check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
            check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for overlapping bookings
        overlaps = Booking.objects.filter(
            listing=listing,
            booking_type='short_term',
            status__in=['pending', 'confirmed'],
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()

        if overlaps:
            return Response(
                {"error": "Selected dates are not available for this listing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create booking
        serializer = self.get_serializer(data={
            'listing': listing.id,
            'check_in': check_in,
            'check_out': check_out,
            'booking_type': 'short_term',
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, listing=listing, status='pending')

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LongTermBookingView(generics.CreateAPIView):
    """
    Create a long-term booking/reservation for a listing.

    POST /api/longterm/bookings/
    Body: {
        "listing_id": "uuid",
        "notes": "Optional notes"
    }
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id')
        notes = request.data.get('notes', '')

        if not listing_id:
            return Response(
                {"error": "Missing required field: listing_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if listing exists
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {"error": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create long-term booking
        serializer = self.get_serializer(data={
            'listing': listing.id,
            'booking_type': 'long_term',
            'notes': notes,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, listing=listing, status='pending')

        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def check_availability(request):
    """
    Check if a listing is available for given dates.

    POST /api/shortterm/check-availability/
    Body: {
        "listing_id": "uuid",
        "check_in": "2025-12-01",
        "check_out": "2025-12-10"
    }

    Returns: { "available": true/false, "conflicts": [] }
    """
    listing_id = request.data.get('listing_id')
    check_in_str = request.data.get('check_in')
    check_out_str = request.data.get('check_out')

    if not listing_id or not check_in_str or not check_out_str:
        return Response(
            {"error": "Missing parameters: listing_id, check_in, check_out"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Parse dates
    try:
        check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {"error": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for overlapping bookings
    overlapping_bookings = Booking.objects.filter(
        listing_id=listing_id,
        booking_type='short_term',
        status__in=['confirmed', 'pending'],
        check_in__lt=check_out,
        check_out__gt=check_in,
    )

    conflicts = [{
        'id': str(booking.id),
        'check_in': booking.check_in.strftime('%Y-%m-%d'),
        'check_out': booking.check_out.strftime('%Y-%m-%d'),
        'status': booking.status
    } for booking in overlapping_bookings]

    return Response({
        "available": not overlapping_bookings.exists(),
        "conflicts": conflicts
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def booking_status_webhook(request):
    """
    Webhook for external systems (Twilio/payment) to update booking status.

    POST /api/bookings/status-webhook/
    Body: {
        "booking_id": "uuid",
        "status": "confirmed" | "cancelled" | "completed"
    }
    """
    booking_id = request.data.get('booking_id')
    new_status = request.data.get('status')

    if not booking_id or not new_status:
        return Response(
            {"error": "Missing parameters: booking_id, status"},
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if new_status not in valid_statuses:
        return Response(
            {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        booking = Booking.objects.get(id=booking_id)
        booking.status = new_status
        booking.save()

        return Response({
            "message": f"Booking {booking_id} updated to {new_status}",
            "booking": BookingSerializer(booking).data
        })
    except Booking.DoesNotExist:
        return Response(
            {"error": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_bookings(request):
    """
    Get all bookings for the authenticated user.

    GET /api/bookings/my-bookings/
    Query params: ?booking_type=short_term|long_term&status=pending|confirmed|cancelled
    """
    bookings = Booking.objects.filter(user=request.user)

    # Filter by booking type
    booking_type = request.query_params.get('booking_type')
    if booking_type:
        bookings = bookings.filter(booking_type=booking_type)

    # Filter by status
    status_filter = request.query_params.get('status')
    if status_filter:
        bookings = bookings.filter(status=status_filter)

    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


class SellerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for seller profiles.

    Endpoints:
    - GET /api/sellers/ - List all sellers
    - POST /api/sellers/ - Create seller profile
    - GET /api/sellers/{id}/ - Get seller details
    - PATCH /api/sellers/{id}/ - Update seller profile
    - DELETE /api/sellers/{id}/ - Delete seller profile
    - GET /api/sellers/me/ - Get current user's seller profile
    """

    queryset = SellerProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['business_name', 'description']
    ordering_fields = ['rating', 'created_at', 'total_listings']
    filterset_fields = ['verified']

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
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User already has a seller profile")

        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only allow users to update their own profile"""
        if serializer.instance.user != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own seller profile")
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


class BuyerRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for buyer requests.

    Endpoints:
    - GET /api/buyer-requests/ - List all buyer requests
    - POST /api/buyer-requests/ - Create a new buyer request
    - GET /api/buyer-requests/{id}/ - Get request details
    - PATCH /api/buyer-requests/{id}/ - Update request (owner only)
    - DELETE /api/buyer-requests/{id}/ - Delete request (owner only)
    - GET /api/buyer-requests/my-requests/ - Get current user's requests
    """

    queryset = BuyerRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['message', 'location']
    ordering_fields = ['created_at', 'budget']
    filterset_fields = ['category', 'is_fulfilled']

    def get_serializer_class(self):
        if self.action == 'create':
            return BuyerRequestCreateSerializer
        return BuyerRequestSerializer

    def get_queryset(self):
        """Show unfulfilled requests to all, but only owner can see their fulfilled requests"""
        queryset = super().get_queryset()

        # If filtering by user's own requests
        if self.action == 'my_requests':
            return queryset.filter(buyer=self.request.user)

        # Show unfulfilled requests to everyone (for sellers to browse)
        # Staff can see all requests
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_fulfilled=False) | Q(buyer=self.request.user)
            )

        return queryset.select_related('buyer', 'category').order_by('-created_at')

    def perform_create(self, serializer):
        """Create buyer request for current user"""
        serializer.save(buyer=self.request.user)

    def perform_update(self, serializer):
        """Only allow users to update their own requests"""
        if serializer.instance.buyer != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own requests")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow users to delete their own requests"""
        if instance.buyer != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own requests")
        instance.delete()

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get current user's buyer requests"""
        requests = self.get_queryset().filter(buyer=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)


class BroadcastMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for broadcast messages.

    Endpoints:
    - GET /api/broadcasts/ - List active broadcasts (public)
    - POST /api/broadcasts/ - Create broadcast (sellers only)
    - GET /api/broadcasts/{id}/ - Get broadcast details
    - PATCH /api/broadcasts/{id}/ - Update broadcast (owner only)
    - DELETE /api/broadcasts/{id}/ - Delete broadcast (owner only)
    - GET /api/broadcasts/my-broadcasts/ - Get current seller's broadcasts
    - POST /api/broadcasts/{id}/publish/ - Publish a draft broadcast
    - POST /api/broadcasts/{id}/increment-view/ - Increment view count
    """

    queryset = BroadcastMessage.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'published_at', 'views_count']
    filterset_fields = ['category', 'status', 'seller']

    def get_serializer_class(self):
        if self.action == 'create':
            return BroadcastMessageCreateSerializer
        return BroadcastMessageSerializer

    def get_queryset(self):
        """Show active broadcasts to all, drafts only to owner"""
        queryset = super().get_queryset()

        # If filtering by user's own broadcasts
        if self.action == 'my_broadcasts':
            try:
                seller = SellerProfile.objects.get(user=self.request.user)
                return queryset.filter(seller=seller)
            except SellerProfile.DoesNotExist:
                return queryset.none()

        # Regular users only see active broadcasts
        # Staff and sellers can see their own drafts
        if not self.request.user.is_staff:
            try:
                seller = SellerProfile.objects.get(user=self.request.user)
                queryset = queryset.filter(
                    Q(status='active') | Q(seller=seller)
                )
            except SellerProfile.DoesNotExist:
                queryset = queryset.filter(status='active')

        return queryset.select_related('seller', 'category').order_by('-published_at', '-created_at')

    def perform_create(self, serializer):
        """Create broadcast for current user's seller profile"""
        try:
            seller = SellerProfile.objects.get(user=self.request.user)
            serializer.save(seller=seller)
        except SellerProfile.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must have a seller profile to create broadcasts")

    def perform_update(self, serializer):
        """Only allow sellers to update their own broadcasts"""
        if serializer.instance.seller.user != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own broadcasts")
        serializer.save()

    def perform_destroy(self, instance):
        """Only allow sellers to delete their own broadcasts"""
        if instance.seller.user != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own broadcasts")
        instance.delete()

    @action(detail=False, methods=['get'])
    def my_broadcasts(self, request):
        """Get current seller's broadcasts"""
        try:
            seller = SellerProfile.objects.get(user=request.user)
            broadcasts = self.get_queryset().filter(seller=seller)
            serializer = self.get_serializer(broadcasts, many=True)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response(
                {"detail": "You do not have a seller profile"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft broadcast"""
        broadcast = self.get_object()

        # Check permissions
        if broadcast.seller.user != request.user and not request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only publish your own broadcasts")

        if broadcast.status != 'draft':
            return Response(
                {"detail": "Only draft broadcasts can be published"},
                status=status.HTTP_400_BAD_REQUEST
            )

        broadcast.publish()
        serializer = self.get_serializer(broadcast)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Increment view count for a broadcast"""
        broadcast = self.get_object()
        broadcast.increment_views()
        return Response({"views_count": broadcast.views_count})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_analytics(request):
    """
    Get comprehensive analytics for the current seller's dashboard.

    GET /api/sellers/analytics/

    Returns:
    {
        "stats": {
            "total_views": 1234,
            "total_listings": 15,
            "active_listings": 12,
            "pending_requests": 8,
            "conversion_rate": 45.5,
            "avg_rating": 4.5,
            ...
        },
        "category_breakdown": {
            "Real Estate": 8,
            "Services": 5,
            ...
        },
        "trends": {
            "period_days": 30,
            "new_listings": 3,
            ...
        },
        "insights": [
            "💡 Tip: Adding more listings increases visibility...",
            ...
        ]
    }
    """
    try:
        seller = SellerProfile.objects.get(user=request.user)
        dashboard_data = compute_dashboard_summary(seller)
        serializer = SellerAnalyticsSerializer(dashboard_data)
        return Response(serializer.data)
    except SellerProfile.DoesNotExist:
        return Response(
            {"detail": "You do not have a seller profile"},
            status=status.HTTP_404_NOT_FOUND
        )
