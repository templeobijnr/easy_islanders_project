"""
Easy Islanders Booking System - Django Signals

Handles booking lifecycle events:
- Booking creation
- Status changes
- Cancellations
- Payment updates
- Availability management
- Notifications
"""
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import (
    Booking,
    BookingAvailability,
    BookingHistory,
    ApartmentRentalBooking,
    AppointmentBooking,
)


# =============================================================================
# BOOKING LIFECYCLE SIGNALS
# =============================================================================

@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    """
    Handle actions when a new booking is created.

    Actions:
    - Create booking history record
    - Send confirmation email to customer
    - Notify seller/service provider
    - Update availability
    - Log analytics event
    """
    if created:
        # Log booking creation to history
        BookingHistory.objects.create(
            booking=instance,
            changed_by=instance.user,
            change_type='created',
            new_values={
                'booking_type': instance.booking_type.name,
                'start_date': str(instance.start_date),
                'end_date': str(instance.end_date) if instance.end_date else None,
                'total_price': str(instance.total_price),
                'status': instance.status,
            },
            notes=f'Booking {instance.reference_number} created'
        )

        # Update availability if listing exists
        if instance.listing:
            _update_availability_on_booking(instance, action='book')

        # TODO: Send confirmation email (via Celery task)
        # from .tasks import send_booking_confirmation_email
        # send_booking_confirmation_email.delay(instance.id)

        # TODO: Notify seller/provider (via Celery task)
        # from .tasks import notify_seller_new_booking
        # notify_seller_new_booking.delay(instance.id)

        print(f"[Booking Signal] Created: {instance.reference_number}")


@receiver(pre_save, sender=Booking)
def on_booking_status_change(sender, instance, **kwargs):
    """
    Handle booking status changes.

    Tracks:
    - Status transitions
    - Confirmation timestamp
    - Completion timestamp
    - Cancellation details
    """
    if instance.pk:  # Only for existing bookings
        try:
            old_instance = Booking.objects.get(pk=instance.pk)

            # Check for status change
            if old_instance.status != instance.status:
                # Log status change to history
                BookingHistory.objects.create(
                    booking=instance,
                    changed_by=instance.cancelled_by if instance.status == 'cancelled' else instance.user,
                    change_type=_get_change_type_from_status(instance.status),
                    old_values={'status': old_instance.status},
                    new_values={'status': instance.status},
                    notes=f'Status changed from {old_instance.status} to {instance.status}'
                )

                # Set timestamps based on status
                if instance.status == 'confirmed' and not instance.confirmed_at:
                    instance.confirmed_at = timezone.now()

                if instance.status == 'completed' and not instance.completed_at:
                    instance.completed_at = timezone.now()

                # Update availability on cancellation
                if instance.status == 'cancelled':
                    _update_availability_on_booking(instance, action='free')

                # TODO: Send status change notification
                # from .tasks import send_booking_status_notification
                # send_booking_status_notification.delay(instance.id, old_instance.status, instance.status)

                print(f"[Booking Signal] Status changed: {instance.reference_number} ({old_instance.status} → {instance.status})")

        except Booking.DoesNotExist:
            pass


@receiver(post_delete, sender=Booking)
def on_booking_deleted(sender, instance, **kwargs):
    """
    Handle booking deletion (cleanup).

    Actions:
    - Free up availability
    - Archive booking data
    - Notify relevant parties
    """
    # Free up availability
    if instance.listing:
        _update_availability_on_booking(instance, action='free')

    print(f"[Booking Signal] Deleted: {instance.reference_number}")


# =============================================================================
# TYPE-SPECIFIC SIGNALS
# =============================================================================

@receiver(post_save, sender=ApartmentRentalBooking)
def on_apartment_rental_created(sender, instance, created, **kwargs):
    """Handle apartment rental specific setup"""
    if created:
        # TODO: Send check-in instructions via email
        # TODO: Generate access codes if smart lock enabled
        print(f"[Apartment Rental] Created for booking: {instance.booking.reference_number}")


@receiver(post_save, sender=AppointmentBooking)
def on_appointment_created(sender, instance, created, **kwargs):
    """Handle appointment specific setup"""
    if created:
        # TODO: Schedule reminder notification
        # TODO: Add to service provider calendar
        # TODO: Send appointment confirmation
        print(f"[Appointment] Created for booking: {instance.booking.reference_number}")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _get_change_type_from_status(status):
    """Map booking status to history change type"""
    status_map = {
        'confirmed': 'confirmed',
        'cancelled': 'cancelled',
        'completed': 'completed',
    }
    return status_map.get(status, 'updated')


def _update_availability_on_booking(booking, action='book'):
    """
    Update availability records when booking is created/cancelled.

    Args:
        booking: Booking instance
        action: 'book' to decrement availability, 'free' to increment
    """
    if not booking.listing:
        return

    # For date-range bookings
    if booking.end_date:
        current_date = booking.start_date.date()
        end_date = booking.end_date.date()

        while current_date <= end_date:
            availability, created = BookingAvailability.objects.get_or_create(
                listing=booking.listing,
                date=current_date,
                defaults={
                    'is_available': True,
                    'max_bookings': 1,
                    'current_bookings': 0,
                }
            )

            if action == 'book':
                availability.current_bookings += 1
                if availability.current_bookings >= availability.max_bookings:
                    availability.is_available = False
            elif action == 'free':
                availability.current_bookings = max(0, availability.current_bookings - 1)
                if availability.current_bookings < availability.max_bookings:
                    availability.is_available = True

            availability.save()
            current_date += timezone.timedelta(days=1)

    # For single-date bookings (appointments, viewings)
    else:
        availability, created = BookingAvailability.objects.get_or_create(
            listing=booking.listing,
            date=booking.start_date.date(),
            defaults={
                'is_available': True,
                'max_bookings': 10,  # Multiple appointments possible per day
                'current_bookings': 0,
            }
        )

        if action == 'book':
            availability.current_bookings += 1
            if availability.current_bookings >= availability.max_bookings:
                availability.is_available = False
        elif action == 'free':
            availability.current_bookings = max(0, availability.current_bookings - 1)
            if availability.current_bookings < availability.max_bookings:
                availability.is_available = True

        availability.save()


# =============================================================================
# PAYMENT SIGNALS (Future Enhancement)
# =============================================================================

# @receiver(post_save, sender=Booking)
# def on_payment_received(sender, instance, **kwargs):
#     """Handle payment received event"""
#     if instance.pk:
#         old_instance = Booking.objects.get(pk=instance.pk)
#         if old_instance.payment_status != instance.payment_status:
#             if instance.payment_status == 'paid':
#                 # Log payment
#                 BookingHistory.objects.create(
#                     booking=instance,
#                     changed_by=instance.user,
#                     change_type='payment_received',
#                     new_values={'payment_status': 'paid', 'paid_amount': str(instance.paid_amount)},
#                     notes=f'Payment received: {instance.paid_amount} {instance.currency}'
#                 )
#                 # TODO: Send payment receipt
#                 # TODO: Notify seller


# =============================================================================
# REVIEW SIGNALS (Future Enhancement)
# =============================================================================

# from .models import BookingReview
#
# @receiver(post_save, sender=BookingReview)
# def on_review_created(sender, instance, created, **kwargs):
#     """Handle new review creation"""
#     if created:
#         # TODO: Notify listing owner
#         # TODO: Update listing rating
#         # TODO: Award review points to user
#         pass
