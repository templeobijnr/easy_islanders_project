"""
Booking API Views
TDD Implementation - Simple and careful implementation

Step-by-step implementation of booking endpoints
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging
import uuid
from datetime import datetime

from listings.models import Listing
from assistant.models import Booking
from assistant.services.notifications import notify_seller_of_new_booking, notify_customer_of_confirmation

logger = logging.getLogger(__name__)


# ==================== STEP 1: Create Booking (POST /api/bookings/) ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    """
    Create a new booking request
    
    Expected data:
    {
        'listing_id': uuid,
        'preferred_date': 'YYYY-MM-DD',
        'preferred_time': 'HH:MM',
        'message': 'optional message',
        'contact_phone': 'optional phone',
        'contact_email': 'optional email'
    }
    """
    try:
        data = request.data
        
        # Validate required fields
        listing_id = data.get('listing_id')
        preferred_date = data.get('preferred_date')
        preferred_time = data.get('preferred_time')
        
        if not all([listing_id, preferred_date, preferred_time]):
            return Response(
                {'error': 'listing_id, preferred_date, and preferred_time are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get listing
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid listing ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create booking
        booking = Booking.objects.create(
            listing=listing,
            user=request.user,
            preferred_date=preferred_date,
            preferred_time=preferred_time,
            message=data.get('message', ''),
            contact_phone=data.get('contact_phone', ''),
            contact_email=data.get('contact_email', ''),
            status='pending'
        )
        
        # Notify seller
        notify_seller_of_new_booking(booking)
        
        return Response(
            {
                'success': True,
                'booking_id': str(booking.id),
                'message': 'Booking created successfully'
            },
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        return Response(
            {'error': 'Failed to create booking'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== STEP 2: Get User Bookings (GET /api/bookings/user/) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_bookings(request):
    """
    Get all bookings for the current user
    """
    try:
        bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        
        booking_list = []
        for booking in bookings:
            booking_list.append({
                'id': str(booking.id),
                'listing': {
                    'id': booking.listing.id,
                    'title': booking.listing.title,
                    'location': booking.listing.location,
                    'price': booking.listing.price,
                    'currency': booking.listing.currency,
                },
                'preferred_date': booking.preferred_date.isoformat() if booking.preferred_date else None,
                'preferred_time': booking.preferred_time.strftime('%H:%M') if booking.preferred_time else None,
                'message': booking.message,
                'status': booking.status,
                'agent_response': booking.agent_response,
                'agent_available_times': booking.agent_available_times,
                'agent_notes': booking.agent_notes,
                'created_at': booking.created_at.isoformat(),
                'confirmed_at': booking.confirmed_at.isoformat() if booking.confirmed_at else None,
            })
        
        return Response(
            {'bookings': booking_list},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Error getting user bookings: {e}")
        return Response(
            {'error': 'Failed to get bookings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== STEP 3: Cancel Booking (DELETE /api/bookings/{id}/) ====================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    """
    Cancel a pending booking
    
    Only pending bookings can be cancelled by the owner
    """
    try:
        # Get booking
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid booking ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check ownership
        if booking.user != request.user:
            return Response(
                {'error': 'You can only cancel your own bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check status
        if booking.status != 'pending':
            return Response(
                {'error': 'Only pending bookings can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete
        booking.delete()
        
        return Response(
            {'success': True, 'message': 'Booking cancelled'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Error cancelling booking: {e}")
        return Response(
            {'error': 'Failed to cancel booking'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== STEP 4: Update Booking Status (PUT /api/bookings/{id}/status/) ====================

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    """
    Update booking status (seller only)
    
    Expected data:
    {
        'status': 'confirmed|completed|cancelled',
        'agent_response': 'optional response',
        'agent_available_times': ['optional', 'times'],
        'agent_notes': 'optional notes'
    }
    """
    try:
        # Get booking
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid booking ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is the seller of the listing
        if booking.listing.owner != request.user:
            return Response(
                {'error': 'Only the listing owner can update booking status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get new status
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status
        booking.status = new_status
        
        # Update optional fields
        if 'agent_response' in request.data:
            booking.agent_response = request.data.get('agent_response', '')
        
        if 'agent_available_times' in request.data:
            booking.agent_available_times = request.data.get('agent_available_times', [])
        
        if 'agent_notes' in request.data:
            booking.agent_notes = request.data.get('agent_notes', '')
        
        # Set confirmed_at if confirming
        if new_status == 'confirmed' and not booking.confirmed_at:
            from django.utils import timezone
            booking.confirmed_at = timezone.now()
        
        booking.save()
        
        # Notify customer if status is confirmed
        if new_status == 'confirmed':
            notify_customer_of_confirmation(booking)
        
        return Response(
            {
                'success': True,
                'message': 'Booking status updated',
                'status': booking.status
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Error updating booking status: {e}")
        return Response(
            {'error': 'Failed to update booking status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== STEP 5: Get Booking Availability (GET /api/listings/{id}/availability/) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_listing_availability(request, listing_id):
    """
    Get available dates and times for a listing
    
    Query params:
    - date (optional): Get available times for specific date (YYYY-MM-DD)
    """
    try:
        # Get listing
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response(
                {'error': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid listing ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get query parameters
        date_str = request.query_params.get('date')
        
        if date_str:
            # Get available times for specific date
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get bookings for that date
            bookings_on_date = Booking.objects.filter(
                listing=listing,
                preferred_date=date_obj,
                status__in=['confirmed', 'completed']
            )
            
            # Get booked times
            booked_times = [b.preferred_time.strftime('%H:%M') for b in bookings_on_date if b.preferred_time]
            
            # Generate available times (9 AM to 5 PM, hourly)
            available_times = []
            for hour in range(9, 17):
                time_str = f"{hour:02d}:00"
                if time_str not in booked_times:
                    available_times.append(time_str)
            
            return Response(
                {
                    'date': date_str,
                    'available_times': available_times,
                    'booked_times': booked_times
                },
                status=status.HTTP_200_OK
            )
        
        else:
            # Get available dates (next 30 days)
            from datetime import timedelta
            from django.utils import timezone
            
            today = timezone.now().date()
            available_dates = []
            
            for i in range(1, 31):
                check_date = today + timedelta(days=i)
                
                # Skip past dates
                if check_date < today:
                    continue
                
                # Check if fully booked (simple logic - if 0 slots available)
                bookings_on_date = Booking.objects.filter(
                    listing=listing,
                    preferred_date=check_date,
                    status__in=['confirmed', 'completed']
                ).count()
                
                # If less than 8 bookings (8 hourly slots), date is available
                if bookings_on_date < 8:
                    available_dates.append(check_date.isoformat())
            
            return Response(
                {
                    'listing_id': str(listing.id),
                    'available_dates': available_dates
                },
                status=status.HTTP_200_OK
            )
        
    except Exception as e:
        logger.error(f"Error getting availability: {e}")
        return Response(
            {'error': 'Failed to get availability'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
