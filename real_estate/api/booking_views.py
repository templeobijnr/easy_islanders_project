"""
Booking and Availability API views for Real Estate v1.

Provides endpoints for:
1. Availability checking (with optional date range for daily rentals)
2. Booking creation
"""
from datetime import datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import logging

from real_estate.models import Listing, Tenancy
from assistant.brain.metrics import record_availability_check, record_booking_request

logger = logging.getLogger(__name__)


class AvailabilityCheckView(APIView):
    """
    Check availability for a listing.

    POST /api/v1/real_estate/availability/check/

    Request Body:
        {
            "listing_id": "123",
            "check_in": "2025-08-01",  # Optional for daily rentals
            "check_out": "2025-08-07"   # Optional for daily rentals
        }

    Response:
        {
            "available": true,
            "message": "Property is available for selected dates"
        }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        listing_id = request.data.get('listing_id')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')

        logger.info(
            f"[AvailabilityCheck] Request: listing_id={listing_id}, "
            f"check_in={check_in_str}, check_out={check_out_str}"
        )

        # Validate listing_id
        if not listing_id:
            record_availability_check(result='error')
            logger.warning("[AvailabilityCheck] Missing listing_id")
            return Response(
                {'error': 'listing_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get listing
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            record_availability_check(result='error')
            logger.error(f"[AvailabilityCheck] Listing not found: listing_id={listing_id}")
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check basic availability based on status
        if listing.status not in ['ACTIVE', 'DRAFT']:
            record_availability_check(result='unavailable')
            logger.info(
                f"[AvailabilityCheck] Unavailable due to status: listing_id={listing_id}, "
                f"status={listing.status}"
            )
            return Response({
                'available': False,
                'message': f'Property is not available (status: {listing.status})'
            })

        # If dates provided, check for conflicts
        if check_in_str and check_out_str:
            try:
                check_in = datetime.fromisoformat(check_in_str).date()
                check_out = datetime.fromisoformat(check_out_str).date()
            except ValueError:
                record_availability_check(result='error')
                logger.warning(
                    f"[AvailabilityCheck] Invalid date format: check_in={check_in_str}, "
                    f"check_out={check_out_str}"
                )
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for overlapping tenancies
            # A tenancy overlaps if: tenancy.start_date <= check_out AND tenancy.end_date >= check_in
            overlapping = Tenancy.objects.filter(
                listing=listing,
                start_date__lte=check_out,
                end_date__gte=check_in,
                status__in=['PENDING', 'ACTIVE']  # Only consider active/pending bookings
            ).exists()

            if overlapping:
                record_availability_check(result='unavailable')
                logger.info(
                    f"[AvailabilityCheck] Unavailable due to overlap: listing_id={listing_id}, "
                    f"check_in={check_in}, check_out={check_out}"
                )
                return Response({
                    'available': False,
                    'message': 'Property is not available for selected dates'
                })

            # Check listing's available_from/available_to dates
            if listing.available_from and check_in < listing.available_from:
                record_availability_check(result='unavailable')
                logger.info(
                    f"[AvailabilityCheck] Unavailable before available_from: listing_id={listing_id}, "
                    f"check_in={check_in}, available_from={listing.available_from}"
                )
                return Response({
                    'available': False,
                    'message': f'Property is only available from {listing.available_from}'
                })

            if listing.available_to and check_out > listing.available_to:
                record_availability_check(result='unavailable')
                logger.info(
                    f"[AvailabilityCheck] Unavailable after available_to: listing_id={listing_id}, "
                    f"check_out={check_out}, available_to={listing.available_to}"
                )
                return Response({
                    'available': False,
                    'message': f'Property is only available until {listing.available_to}'
                })

        # Property is available
        record_availability_check(result='available')
        logger.info(
            f"[AvailabilityCheck] Available: listing_id={listing_id}, "
            f"dates={'with_dates' if check_in_str else 'no_dates'}"
        )
        return Response({
            'available': True,
            'message': 'Property is available' + (' for selected dates' if check_in_str else '')
        })


class BookingCreateView(APIView):
    """
    Create a booking/tenancy for a listing.

    POST /api/v1/real_estate/bookings/

    Request Body:
        {
            "listing_id": "123",
            "check_in": "2025-08-01",
            "check_out": "2025-08-07"
        }

    Response:
        {
            "id": 456,
            "status": "PENDING",
            "listing_id": "123",
            "check_in": "2025-08-01",
            "check_out": "2025-08-07",
            "message": "Booking created successfully. Awaiting confirmation."
        }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        listing_id = request.data.get('listing_id')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')

        logger.info(
            f"[BookingCreate] Request: listing_id={listing_id}, "
            f"check_in={check_in_str}, check_out={check_out_str}, user={request.user}"
        )

        # Validate required fields
        if not listing_id:
            logger.warning("[BookingCreate] Missing listing_id")
            return Response(
                {'error': 'listing_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not check_in_str or not check_out_str:
            logger.warning("[BookingCreate] Missing check_in or check_out")
            return Response(
                {'error': 'check_in and check_out dates are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse dates
        try:
            check_in = datetime.fromisoformat(check_in_str).date()
            check_out = datetime.fromisoformat(check_out_str).date()
        except ValueError:
            logger.warning(
                f"[BookingCreate] Invalid date format: check_in={check_in_str}, "
                f"check_out={check_out_str}"
            )
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate date range
        if check_out <= check_in:
            logger.warning(
                f"[BookingCreate] Invalid date range: check_in={check_in}, check_out={check_out}"
            )
            return Response(
                {'error': 'check_out must be after check_in'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get listing
        try:
            listing = Listing.objects.select_related('property').get(id=listing_id)
        except Listing.DoesNotExist:
            logger.error(f"[BookingCreate] Listing not found: listing_id={listing_id}")
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Determine tenancy kind for metrics
        tenancy_kind = 'daily' if listing.listing_type.code == 'DAILY_RENTAL' else 'long_term'

        # Check if listing is bookable
        if listing.status not in ['ACTIVE']:
            record_booking_request(result='error', rent_type=tenancy_kind)
            logger.warning(
                f"[BookingCreate] Listing not bookable: listing_id={listing_id}, "
                f"status={listing.status}"
            )
            return Response(
                {'error': f'Listing is not available for booking (status: {listing.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create tenancy atomically
        with transaction.atomic():
            # Double-check availability within transaction
            overlapping = Tenancy.objects.filter(
                listing=listing,
                start_date__lte=check_out,
                end_date__gte=check_in,
                status__in=['PENDING', 'ACTIVE']
            ).exists()

            if overlapping:
                record_booking_request(result='conflict', rent_type=tenancy_kind)
                logger.warning(
                    f"[BookingCreate] Double booking conflict: listing_id={listing_id}, "
                    f"check_in={check_in}, check_out={check_out}"
                )
                return Response(
                    {'error': 'Property is no longer available for selected dates'},
                    status=status.HTTP_409_CONFLICT
                )

            # Determine tenancy kind based on listing type
            tenancy_kind_db = 'DAILY' if listing.listing_type.code == 'DAILY_RENTAL' else 'LONG_TERM'

            # Calculate nights/months
            nights = (check_out - check_in).days
            
            # Generate unique booking reference
            import random
            booking_reference = f"BK-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            
            # Get guest information from request
            guest_name = request.data.get('guest_name', '')
            guest_email = request.data.get('guest_email', '')
            guest_phone = request.data.get('guest_phone', '')
            guest_count = request.data.get('guest_count', 1)
            special_requests = request.data.get('special_requests', '')

            # Create tenancy
            tenancy = Tenancy.objects.create(
                property=listing.property,
                listing=listing,
                tenant=request.user,  # Assuming user is authenticated
                tenancy_kind=tenancy_kind_db,
                start_date=check_in,
                end_date=check_out,
                rent_amount=listing.base_price,
                rent_currency=listing.currency,
                status='PENDING',
                booking_reference=booking_reference,
                guest_name=guest_name,
                guest_email=guest_email,
                guest_phone=guest_phone,
                guest_count=guest_count,
                special_requests=special_requests,
                payment_status='PENDING'
            )
            
            # TODO: Send notification to owner
            # send_booking_notification(listing.created_by, tenancy)
            
            # TODO: Send confirmation email to guest
            # send_booking_confirmation_email(tenancy)

            # Record success metrics
            record_booking_request(result='success', rent_type=tenancy_kind)
            logger.info(
                f"[BookingCreate] Booking created successfully: tenancy_id={tenancy.id}, "
                f"booking_ref={booking_reference}, listing_id={listing_id}, "
                f"rent_type={tenancy_kind}, nights={nights}, guest={guest_name}, user={request.user}"
            )

        return Response({
            'id': tenancy.id,
            'booking_reference': booking_reference,
            'status': tenancy.status,
            'payment_status': tenancy.payment_status,
            'listing_id': str(listing.id),
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'nights': nights,
            'rent_amount': str(tenancy.rent_amount),
            'currency': tenancy.rent_currency,
            'guest_name': guest_name,
            'guest_count': guest_count,
            'message': f'Booking created successfully! Your reference is {booking_reference}. Awaiting confirmation.'
        }, status=status.HTTP_201_CREATED)


class BlockedDatesView(APIView):
    """
    Get blocked dates for a listing (dates with existing bookings).
    
    GET /api/v1/real_estate/listings/{listing_id}/blocked-dates/
    
    Response:
        {
            "listing_id": "123",
            "blocked_dates": ["2025-08-01", "2025-08-02", "2025-08-03", ...]
        }
    """
    
    permission_classes = []  # Public endpoint - anyone can check availability
    
    def get(self, request, listing_id):
        from datetime import timedelta
        
        logger.info(f"[BlockedDates] Request for listing_id={listing_id}")
        
        # Verify listing exists
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            logger.error(f"[BlockedDates] Listing not found: listing_id={listing_id}")
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all active/pending bookings for this listing
        bookings = Tenancy.objects.filter(
            listing_id=listing_id,
            status__in=['PENDING', 'ACTIVE']
        ).values('start_date', 'end_date')
        
        # Generate list of all blocked dates
        blocked_dates = []
        for booking in bookings:
            current = booking['start_date']
            # Include all dates from start to end (inclusive)
            while current <= booking['end_date']:
                blocked_dates.append(current.isoformat())
                current += timedelta(days=1)
        
        # Remove duplicates and sort
        blocked_dates = sorted(list(set(blocked_dates)))
        
        logger.info(
            f"[BlockedDates] Found {len(blocked_dates)} blocked dates for listing_id={listing_id}"
        )
        
        return Response({
            'listing_id': str(listing_id),
            'blocked_dates': blocked_dates,
            'total_blocked': len(blocked_dates)
        })
