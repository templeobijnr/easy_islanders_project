"""
Twilio WhatsApp Integration Utility

Handles sending and receiving WhatsApp messages via Twilio API.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Check if Twilio is available
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio SDK not installed. WhatsApp features will be disabled.")


def get_twilio_client() -> Optional['Client']:
    """
    Get configured Twilio client instance.

    Returns:
        Twilio Client instance or None if not configured
    """
    if not TWILIO_AVAILABLE:
        logger.error("Twilio SDK not available")
        return None

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")

    if not account_sid or not auth_token:
        logger.error("Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)")
        return None

    try:
        return Client(account_sid, auth_token)
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}")
        return None


def send_whatsapp_message(to_phone: str, message: str, listing_id: Optional[str] = None) -> Optional[str]:
    """
    Send a WhatsApp message via Twilio.

    Args:
        to_phone: Recipient phone number (with country code)
        message: Message text to send
        listing_id: Optional listing ID for tracking

    Returns:
        Message SID if successful, None otherwise
    """
    client = get_twilio_client()
    if not client:
        logger.error("Cannot send WhatsApp message: Twilio client not available")
        return None

    from_whatsapp = os.getenv("TWILIO_WHATSAPP_NUMBER")
    if not from_whatsapp:
        logger.error("TWILIO_WHATSAPP_NUMBER not configured")
        return None

    # Ensure phone numbers are in WhatsApp format
    if not from_whatsapp.startswith("whatsapp:"):
        from_whatsapp = f"whatsapp:{from_whatsapp}"
    if not to_phone.startswith("whatsapp:"):
        to_phone = f"whatsapp:{to_phone}"

    try:
        msg = client.messages.create(
            from_=from_whatsapp,
            to=to_phone,
            body=message
        )

        logger.info(f"WhatsApp message sent: SID={msg.sid}, to={to_phone}, listing_id={listing_id}")
        return msg.sid

    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_phone}: {e}")
        return None


def format_availability_check_message(listing_title: str, user_name: str, listing_id: str) -> str:
    """
    Format an availability check message for the agent.

    Args:
        listing_title: Title of the property listing
        user_name: Name of the user requesting availability
        listing_id: ID of the listing

    Returns:
        Formatted message string
    """
    return (
        f"🏠 Availability Check Request\n\n"
        f"Property: {listing_title}\n"
        f"User: {user_name}\n"
        f"Listing ID: {listing_id}\n\n"
        f"Please reply:\n"
        f"✅ YES if available\n"
        f"❌ NO if unavailable"
    )


def parse_agent_response(message_body: str) -> Optional[bool]:
    """
    Parse agent's WhatsApp response to determine availability.

    Args:
        message_body: The message body from agent

    Returns:
        True if available, False if unavailable, None if unclear
    """
    message_lower = message_body.lower().strip()

    # Positive responses
    if any(word in message_lower for word in ["yes", "available", "free", "ok", "sure", "✅"]):
        return True

    # Negative responses
    if any(word in message_lower for word in ["no", "unavailable", "booked", "taken", "sorry", "❌"]):
        return False

    # Unclear response
    return None
