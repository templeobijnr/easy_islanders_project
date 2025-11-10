"""
Availability Check API Endpoint

Handles checking property availability via WhatsApp agent communication.
"""
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from real_estate.models import Listing
from assistant.integrations.twilio_utils import send_whatsapp_message, format_availability_check_message

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_availability(request):
    """
    Check property availability by sending WhatsApp message to agent.

    Request body:
        {
            "listing_id": "uuid-or-int"
        }

    Returns:
        {
            "ok": true,
            "message": "Availability check request sent to agent",
            "listing_id": "...",
            "twilio_sid": "..."
        }

    Status codes:
        202: Request accepted, message sent to agent
        400: Bad request (missing listing_id)
        404: Listing not found
        503: Twilio service unavailable
    """
    user = request.user
    listing_id = request.data.get("listing_id")

    if not listing_id:
        return Response(
            {"ok": False, "error": "listing_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get listing
    try:
        listing = get_object_or_404(Listing, id=listing_id)
    except Exception as e:
        logger.error(f"Failed to fetch listing {listing_id}: {e}")
        return Response(
            {"ok": False, "error": "Listing not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get agent's phone number
    # Assuming listing has an owner/agent with phone number
    # Adjust this based on your actual Listing model structure
    agent_phone = None
    if hasattr(listing, 'owner') and listing.owner:
        agent_phone = getattr(listing.owner, 'phone_number', None) or getattr(listing.owner, 'phone', None)

    if not agent_phone:
        # Fallback: use a default agent phone from settings
        import os
        agent_phone = os.getenv("DEFAULT_AGENT_PHONE")

    if not agent_phone:
        logger.error(f"No agent phone number found for listing {listing_id}")
        return Response(
            {"ok": False, "error": "Agent contact information not available"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Format and send WhatsApp message
    message_text = format_availability_check_message(
        listing_title=listing.title if hasattr(listing, 'title') else listing.name,
        user_name=user.get_full_name() or user.username,
        listing_id=str(listing_id)
    )

    twilio_sid = send_whatsapp_message(
        to_phone=agent_phone,
        message=message_text,
        listing_id=str(listing_id)
    )

    if not twilio_sid:
        logger.error(f"Failed to send WhatsApp message for listing {listing_id}")
        return Response(
            {"ok": False, "error": "Failed to send availability check request"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Store agent_phone -> thread_id mapping in cache for webhook lookup
    # This allows the webhook to find the conversation when agent responds
    from django.core.cache import cache
    from assistant.models import ConversationThread

    # Get the user's active thread
    thread, _ = ConversationThread.get_or_create_active(user)
    thread_id = str(thread.thread_id)

    # Store mapping with 24-hour expiration (agent should respond within a day)
    cache_key = f"availability_check:{agent_phone}"
    cache.set(cache_key, thread_id, timeout=86400)  # 24 hours

    logger.info(
        f"Availability check initiated: user={user.username}, listing={listing_id}, "
        f"agent_phone={agent_phone}, twilio_sid={twilio_sid}, thread_id={thread_id}"
    )

    return Response(
        {
            "ok": True,
            "message": "Availability check request sent to agent",
            "listing_id": str(listing_id),
            "thread_id": thread_id,
            "twilio_sid": twilio_sid
        },
        status=status.HTTP_202_ACCEPTED
    )
