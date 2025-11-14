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
                status='PENDING'
            )

            # Record success metrics
            record_booking_request(result='success', rent_type=tenancy_kind)
            logger.info(
                f"[BookingCreate] Booking created successfully: tenancy_id={tenancy.id}, "
                f"listing_id={listing_id}, rent_type={tenancy_kind}, nights={nights}, "
                f"user={request.user}"
            )

        return Response({
            'id': tenancy.id,
            'status': tenancy.status,
            'listing_id': str(listing.id),
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'nights': nights,
            'rent_amount': str(tenancy.rent_amount),
            'currency': tenancy.rent_currency,
            'message': 'Booking created successfully. Awaiting confirmation.'
        }, status=status.HTTP_201_CREATED)
