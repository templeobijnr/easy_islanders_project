"""
Easy Islanders Booking System - API Views

DRF ViewSets for booking API endpoints with comprehensive CRUD operations.
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta

from .models import (
    BookingType,
    Booking,
    BookingAvailability,
    BookingHistory,
    BookingReview,
)
from .serializers import (
    BookingTypeSerializer,
    BookingTypeListSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    BookingAvailabilitySerializer,
    BookingHistorySerializer,
    BookingReviewSerializer,
    BookingReviewResponseSerializer,
    BookingConfirmSerializer,
    BookingCancelSerializer,
    BookingCompleteSerializer,
    AvailabilityCheckSerializer,
)
from .permissions import (
    IsBookingOwner,
    IsSellerOrOwner,
    CanConfirmBooking,
    CanCancelBooking,
    CanReviewBooking,
)


# =============================================================================
# BOOKING TYPE VIEWSET
# =============================================================================

class BookingTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for booking types (read-only for users).

    list: Get all active booking types
    retrieve: Get specific booking type details
    """
    queryset = BookingType.objects.filter(is_active=True)
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingTypeListSerializer
        return BookingTypeSerializer


# =============================================================================
# BOOKING VIEWSET
# =============================================================================

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for bookings with comprehensive CRUD operations.

    list: Get user's bookings
    retrieve: Get booking details
    create: Create new booking
    update/partial_update: Update booking
    destroy: Cancel booking

    Custom actions:
    - confirm: Confirm a booking (seller/provider)
    - cancel: Cancel a booking with reason
    - complete: Mark booking as completed
    - history: Get booking history
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'booking_type', 'start_date']
    search_fields = ['reference_number', 'contact_name', 'contact_email']
    ordering_fields = ['created_at', 'start_date', 'total_price']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter bookings based on user role.
        - Regular users: only their own bookings
        - Sellers: bookings for their listings
        - Staff: all bookings
        """
        user = self.request.user

        if user.is_staff:
            return Booking.objects.all()

        # User's own bookings
        user_bookings = Q(user=user)

        # Bookings for user's listings
        seller_bookings = Q(listing__owner=user)

        # Bookings where user is the seller
        if hasattr(user, 'seller_profile'):
            seller_bookings |= Q(listing__seller__user=user)

        # Service bookings where user is provider
        if hasattr(user, 'business_profile'):
            seller_bookings |= Q(service__service_provider__user=user)
            seller_bookings |= Q(appointment__service_provider__user=user)

        return Booking.objects.filter(user_bookings | seller_bookings).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        elif self.action == 'create':
            return BookingCreateSerializer
        elif self.action in ['confirm', 'cancel', 'complete']:
            action_serializers = {
                'confirm': BookingConfirmSerializer,
                'cancel': BookingCancelSerializer,
                'complete': BookingCompleteSerializer,
            }
            return action_serializers[self.action]
        return BookingDetailSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsBookingOwner()]
        elif self.action == 'confirm':
            return [permissions.IsAuthenticated(), CanConfirmBooking()]
        elif self.action == 'cancel':
            return [permissions.IsAuthenticated(), CanCancelBooking()]
        elif self.action in ['retrieve', 'history']:
            return [permissions.IsAuthenticated(), IsSellerOrOwner()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        """Get current user's bookings"""
        bookings = self.get_queryset().filter(user=request.user)
        serializer = BookingListSerializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming bookings"""
        now = timezone.now()
        bookings = self.get_queryset().filter(
            start_date__gte=now,
            status__in=['confirmed', 'pending']
        ).order_by('start_date')
        serializer = BookingListSerializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def past(self, request):
        """Get past bookings"""
        now = timezone.now()
        bookings = self.get_queryset().filter(
            Q(end_date__lt=now) | Q(status='completed')
        ).order_by('-start_date')
        serializer = BookingListSerializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm a booking (seller/provider only).

        Only sellers/providers can confirm bookings for their listings/services.
        """
        booking = self.get_object()

        if booking.status != 'pending':
            return Response(
                {'error': f'Cannot confirm booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a booking with reason.

        Users can cancel their own bookings if policy allows.
        Sellers can cancel bookings for their listings.
        """
        booking = self.get_object()

        serializer = self.get_serializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark booking as completed.

        Typically called by seller/provider after service is delivered.
        """
        booking = self.get_object()

        if booking.status != 'in_progress':
            return Response(
                {'error': f'Cannot complete booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(booking, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            BookingDetailSerializer(booking).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get booking history/audit trail"""
        booking = self.get_object()
        history = booking.history.all()
        serializer = BookingHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get booking statistics for current user"""
        user = request.user
        bookings = self.get_queryset().filter(user=user)

        stats = {
            'total_bookings': bookings.count(),
            'pending': bookings.filter(status='pending').count(),
            'confirmed': bookings.filter(status='confirmed').count(),
            'completed': bookings.filter(status='completed').count(),
            'cancelled': bookings.filter(status='cancelled').count(),
            'total_spent': sum(
                b.total_price for b in bookings.filter(payment_status='paid')
            ),
            'upcoming_count': bookings.filter(
                start_date__gte=timezone.now(),
                status__in=['confirmed', 'pending']
            ).count(),
        }

        return Response(stats)


# =============================================================================
# AVAILABILITY VIEWSET
# =============================================================================

class BookingAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for booking availability management.

    list: Get availability records
    retrieve: Get specific availability
    create: Create availability record (staff/seller)
    update: Update availability
    destroy: Delete availability

    Custom actions:
    - check: Check if dates are available
    - calendar: Get calendar view
    - block: Block specific dates
    - unblock: Unblock specific dates
    """
    queryset = BookingAvailability.objects.all()
    serializer_class = BookingAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['listing', 'service_provider', 'date', 'is_available']
    ordering = ['date', 'start_time']

    @action(detail=False, methods=['post'])
    def check(self, request):
        """
        Check availability for specific dates.

        POST /api/v1/bookings/availability/check/
        {
            "listing_id": "uuid",
            "start_date": "2024-06-01",
            "end_date": "2024-06-07"
        }
        """
        serializer = AvailabilityCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        start_date = data['start_date']
        end_date = data.get('end_date', start_date)

        # Build query
        query = Q(date__gte=start_date, date__lte=end_date)

        if data.get('listing_id'):
            from listings.models import Listing
            listing = Listing.objects.get(id=data['listing_id'])
            query &= Q(listing=listing)

        if data.get('service_provider_id'):
            from users.models import BusinessProfile
            provider = BusinessProfile.objects.get(id=data['service_provider_id'])
            query &= Q(service_provider=provider)

        # Check availability
        availabilities = BookingAvailability.objects.filter(query)

        # Get unavailable dates
        unavailable_dates = [
            av.date for av in availabilities if not av.is_available
        ]

        # Check if fully available
        current_date = start_date
        all_dates = []
        while current_date <= end_date:
            all_dates.append(current_date)
            current_date += timedelta(days=1)

        is_available = len(unavailable_dates) == 0

        return Response({
            'is_available': is_available,
            'unavailable_dates': unavailable_dates,
            'checked_dates': all_dates,
            'message': 'All dates available' if is_available else f'{len(unavailable_dates)} date(s) unavailable'
        })

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """
        Get calendar view of availability.

        GET /api/v1/bookings/availability/calendar/?listing_id=uuid&month=2024-06
        """
        listing_id = request.query_params.get('listing_id')
        provider_id = request.query_params.get('service_provider_id')
        month_str = request.query_params.get('month')  # Format: YYYY-MM

        if not listing_id and not provider_id:
            return Response(
                {'error': 'listing_id or service_provider_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse month
        if month_str:
            year, month = map(int, month_str.split('-'))
            start_date = datetime(year, month, 1).date()
            if month == 12:
                end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
        else:
            # Default to current month
            now = timezone.now()
            start_date = datetime(now.year, now.month, 1).date()
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end_date = datetime(now.year, now.month + 1, 1).date() - timedelta(days=1)

        # Build query
        query = Q(date__gte=start_date, date__lte=end_date)

        if listing_id:
            query &= Q(listing_id=listing_id)
        if provider_id:
            query &= Q(service_provider_id=provider_id)

        availabilities = BookingAvailability.objects.filter(query)
        serializer = self.get_serializer(availabilities, many=True)

        return Response({
            'month': month_str or f'{start_date.year}-{start_date.month:02d}',
            'start_date': start_date,
            'end_date': end_date,
            'availabilities': serializer.data
        })

    @action(detail=False, methods=['post'])
    def block(self, request):
        """
        Block specific dates (staff/seller only).

        POST /api/v1/bookings/availability/block/
        {
            "listing_id": "uuid",
            "start_date": "2024-06-01",
            "end_date": "2024-06-07",
            "reason": "Maintenance"
        }
        """
        # TODO: Add permission check (staff or listing owner)

        listing_id = request.data.get('listing_id')
        start_date = datetime.strptime(request.data.get('start_date'), '%Y-%m-%d').date()
        end_date = datetime.strptime(request.data.get('end_date'), '%Y-%m-%d').date()
        reason = request.data.get('reason', 'Blocked by owner')

        blocked_count = 0
        current_date = start_date

        while current_date <= end_date:
            availability, created = BookingAvailability.objects.update_or_create(
                listing_id=listing_id,
                date=current_date,
                defaults={
                    'is_available': False,
                    'blocked_reason': reason
                }
            )
            blocked_count += 1
            current_date += timedelta(days=1)

        return Response({
            'success': True,
            'blocked_dates': blocked_count,
            'message': f'Blocked {blocked_count} dates'
        })


# =============================================================================
# REVIEW VIEWSET
# =============================================================================

class BookingReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for booking reviews.

    list: Get reviews (filtered by booking/user)
    retrieve: Get specific review
    create: Create review (booking owner after completion)
    update: Update review
    destroy: Delete review

    Custom actions:
    - respond: Add seller response to review
    """
    queryset = BookingReview.objects.all()
    serializer_class = BookingReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['booking', 'reviewer', 'rating', 'is_verified']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter reviews based on user"""
        user = self.request.user
        if user.is_staff:
            return BookingReview.objects.all()

        # User's own reviews + reviews for their listings
        return BookingReview.objects.filter(
            Q(reviewer=user) |
            Q(booking__listing__owner=user) |
            Q(booking__listing__seller__user=user)
        ).distinct()

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            return [permissions.IsAuthenticated(), CanReviewBooking()]
        elif self.action == 'respond':
            return [permissions.IsAuthenticated(), IsSellerOrOwner()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """
        Add seller response to review.

        Only listing owner/seller can respond.
        """
        review = self.get_object()

        # Check if already responded
        if review.response:
            return Response(
                {'error': 'Review already has a response'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = BookingReviewResponseSerializer(review, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            BookingReviewSerializer(review).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews"""
        reviews = self.get_queryset().filter(reviewer=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
