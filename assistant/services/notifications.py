"""
Booking Notification Service
Handles sending notifications for booking events via WhatsApp, Email, SMS
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


# ==================== WHATSAPP NOTIFICATIONS ====================

def send_whatsapp_message(phone_number, message_text, booking=None):
    """
    Send WhatsApp message to user
    
    Args:
        phone_number: Recipient phone number (e.g., '+1234567890')
        message_text: Message content
        booking: Booking object (for context)
    
    Returns:
        dict: {'success': bool, 'message_id': str or None}
    """
    try:
        if not phone_number:
            logger.warning("No phone number provided for WhatsApp notification")
            return {'success': False, 'error': 'No phone number'}
        
        # Check if Twilio is configured
        if not hasattr(settings, 'TWILIO_ACCOUNT_SID'):
            logger.info("Twilio not configured, skipping WhatsApp notification")
            return {'success': False, 'error': 'Twilio not configured'}
        
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Send message via Twilio WhatsApp
            message = client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                to=f"whatsapp:{phone_number}",
                body=message_text
            )
            
            logger.info(f"WhatsApp message sent to {phone_number}: {message.sid}")
            return {'success': True, 'message_id': message.sid}
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return {'success': False, 'error': str(e)}
    
    except Exception as e:
        logger.error(f"Unexpected error in send_whatsapp_message: {e}")
        return {'success': False, 'error': str(e)}


# ==================== EMAIL NOTIFICATIONS ====================

def send_email(recipient_email, subject, template_name=None, context=None, booking=None):
    """
    Send email notification
    
    Args:
        recipient_email: Email address
        subject: Email subject
        template_name: Django template name (optional)
        context: Template context dict (optional)
        booking: Booking object (for context)
    
    Returns:
        dict: {'success': bool, 'error': str or None}
    """
    try:
        if not recipient_email:
            logger.warning("No email address provided")
            return {'success': False, 'error': 'No email address'}
        
        if not template_name:
            # Simple text email if no template
            message = context.get('message', '') if context else ''
            html_message = None
        else:
            try:
                html_message = render_to_string(
                    f'notifications/{template_name}',
                    context or {}
                )
            except:
                html_message = None
                message = context.get('message', '') if context else ''
        
        # Send email
        result = send_mail(
            subject=subject,
            message=context.get('message', '') if context else '',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False
        )
        
        if result > 0:
            logger.info(f"Email sent to {recipient_email}: {subject}")
            return {'success': True}
        else:
            return {'success': False, 'error': 'Send returned 0'}
    
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return {'success': False, 'error': str(e)}


# ==================== SMS NOTIFICATIONS ====================

def send_sms(phone_number, message_text, booking=None):
    """
    Send SMS notification
    
    Args:
        phone_number: Recipient phone number
        message_text: Message content
        booking: Booking object (for context)
    
    Returns:
        dict: {'success': bool, 'message_id': str or None}
    """
    try:
        if not phone_number:
            logger.warning("No phone number provided for SMS")
            return {'success': False, 'error': 'No phone number'}
        
        # Check if Twilio is configured
        if not hasattr(settings, 'TWILIO_ACCOUNT_SID'):
            logger.info("Twilio not configured, skipping SMS notification")
            return {'success': False, 'error': 'Twilio not configured'}
        
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            message = client.messages.create(
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number,
                body=message_text
            )
            
            logger.info(f"SMS sent to {phone_number}: {message.sid}")
            return {'success': True, 'message_id': message.sid}
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {'success': False, 'error': str(e)}
    
    except Exception as e:
        logger.error(f"Unexpected error in send_sms: {e}")
        return {'success': False, 'error': str(e)}


# ==================== REMINDER SCHEDULING ====================

def schedule_booking_reminder(booking, hours_before=24):
    """
    Schedule a reminder notification for a booking
    
    In production, this would use Celery to schedule the reminder
    For now, just log that it's been scheduled
    
    Args:
        booking: Booking object
        hours_before: How many hours before to send reminder (default 24)
    
    Returns:
        dict: {'success': bool}
    """
    try:
        reminder_time = booking.preferred_date - timedelta(hours=hours_before)
        
        # In production with Celery:
        # from assistant.tasks import send_booking_reminder
        # send_booking_reminder.apply_async(
        #     args=[booking.id],
        #     eta=reminder_time
        # )
        
        logger.info(f"Booking reminder scheduled for {booking.id} at {reminder_time}")
        return {'success': True}
    
    except Exception as e:
        logger.error(f"Failed to schedule reminder: {e}")
        return {'success': False, 'error': str(e)}


# ==================== NOTIFICATION PREFERENCES ====================

def should_send_notification(user, notification_type='booking'):
    """
    Check if user has enabled notifications of this type
    
    Args:
        user: User object
        notification_type: Type of notification ('booking', 'confirmation', 'reminder')
    
    Returns:
        bool: True if notification should be sent
    """
    try:
        # Check user preferences
        if not user:
            return False
        
        # By default, allow notifications (can be overridden with UserProfile preferences)
        return True
    
    except Exception as e:
        logger.error(f"Error checking notification preferences: {e}")
        return True  # Send by default if there's an error


# ==================== BOOKING NOTIFICATIONS ====================

def notify_seller_of_new_booking(booking):
    """
    Send notification to seller when customer creates booking
    
    Args:
        booking: Booking object
    
    Returns:
        dict: {'success': bool}
    """
    try:
        seller = booking.listing.owner
        
        # Check preferences
        if not should_send_notification(seller, 'booking'):
            return {'success': True, 'skipped': 'User disabled notifications'}
        
        # Prepare message
        message = f"""
New Booking Request!

Listing: {booking.listing.title}
Location: {booking.listing.location}
Customer: {booking.user.get_full_name() or booking.user.username}
Date: {booking.preferred_date}
Time: {booking.preferred_time}
Message: {booking.message}

Reply on Easy Islanders to confirm or suggest alternative times.
        """
        
        result = {'success': True}
        
        # Try WhatsApp first
        if hasattr(seller, 'profile') and hasattr(seller.profile, 'phone_number'):
            whatsapp_result = send_whatsapp_message(
                seller.profile.phone_number,
                message,
                booking
            )
            result['whatsapp'] = whatsapp_result
        
        # Also send email
        email_result = send_email(
            seller.email,
            f"New Booking Request - {booking.listing.title}",
            context={'message': message},
            booking=booking
        )
        result['email'] = email_result
        
        return result
    
    except Exception as e:
        logger.error(f"Failed to notify seller of booking {booking.id}: {e}")
        return {'success': False, 'error': str(e)}


def notify_customer_of_confirmation(booking):
    """
    Send notification to customer when seller confirms booking
    
    Args:
        booking: Booking object (should have status='confirmed')
    
    Returns:
        dict: {'success': bool}
    """
    try:
        customer = booking.user
        seller = booking.listing.owner
        
        # Check preferences
        if not should_send_notification(customer, 'confirmation'):
            return {'success': True, 'skipped': 'User disabled notifications'}
        
        # Prepare message
        message = f"""
Booking Confirmed!

Great news! Your booking request has been confirmed.

Listing: {booking.listing.title}
Location: {booking.listing.location}
Date: {booking.preferred_date}
Time: {booking.preferred_time}
Price: {booking.listing.price} {booking.listing.currency}

Seller: {seller.get_full_name() or seller.username}
{f'Notes: {booking.agent_notes}' if booking.agent_notes else ''}

See you soon!
        """
        
        result = {'success': True}
        
        # Send email
        email_result = send_email(
            customer.email,
            f"Booking Confirmed - {booking.listing.title}",
            context={'message': message},
            booking=booking
        )
        result['email'] = email_result
        
        # Try WhatsApp if phone available
        if hasattr(customer, 'profile') and hasattr(customer.profile, 'phone_number'):
            whatsapp_result = send_whatsapp_message(
                customer.profile.phone_number,
                message,
                booking
            )
            result['whatsapp'] = whatsapp_result
        
        return result
    
    except Exception as e:
        logger.error(f"Failed to notify customer of confirmation {booking.id}: {e}")
        return {'success': False, 'error': str(e)}


def send_booking_reminder(booking):
    """
    Send reminder notification before booking
    
    Args:
        booking: Booking object
    
    Returns:
        dict: {'success': bool}
    """
    try:
        customer = booking.user
        
        # Check preferences
        if not should_send_notification(customer, 'reminder'):
            return {'success': True, 'skipped': 'User disabled reminders'}
        
        message = f"""
Reminder: Your booking is tomorrow!

Listing: {booking.listing.title}
Location: {booking.listing.location}
Date: {booking.preferred_date}
Time: {booking.preferred_time}

See you then!
        """
        
        result = {'success': True}
        
        # Send SMS reminder
        if hasattr(customer, 'profile') and hasattr(customer.profile, 'phone_number'):
            sms_result = send_sms(
                customer.profile.phone_number,
                message,
                booking
            )
            result['sms'] = sms_result
        
        return result
    
    except Exception as e:
        logger.error(f"Failed to send reminder for booking {booking.id}: {e}")
        return {'success': False, 'error': str(e)}
