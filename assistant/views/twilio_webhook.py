"""
Twilio Webhook Endpoint

Handles incoming WhatsApp messages from agents responding to availability checks.
"""
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from assistant.integrations.twilio_utils import parse_agent_response
from assistant.tasks import inject_system_message_to_chat

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])  # Twilio webhook doesn't send auth headers
@csrf_exempt
def twilio_whatsapp_webhook(request):
    """
    Handle incoming WhatsApp messages from Twilio.

    Expected POST data from Twilio:
        From: whatsapp:+1234567890
        To: whatsapp:+0987654321
        Body: "Yes, the property is available"
        MessageSid: SM...
        AccountSid: AC...

    Flow:
        1. Parse agent's response (available/unavailable/unclear)
        2. Look up the conversation thread associated with this agent
        3. Inject a system message into the chat thread
        4. User sees automated response in chat

    Returns:
        200: Message processed
        400: Invalid request
        500: Processing error
    """
    try:
        # Extract Twilio webhook data
        from_number = request.data.get("From", "")
        to_number = request.data.get("To", "")
        message_body = request.data.get("Body", "").strip()
        message_sid = request.data.get("MessageSid", "")

        logger.info(
            f"[Twilio Webhook] Received WhatsApp message: "
            f"from={from_number}, to={to_number}, sid={message_sid}, body={message_body[:100]}"
        )

        # Parse agent response
        is_available = parse_agent_response(message_body)

        if is_available is None:
            # Unclear response - log but don't inject message
            logger.warning(
                f"[Twilio Webhook] Unclear agent response: from={from_number}, body={message_body}"
            )
            return Response(
                {"status": "ignored", "reason": "unclear_response"},
                status=status.HTTP_200_OK
            )

        # Generate chat message based on availability
        if is_available:
            chat_message = (
                "✅ Great news! The agent confirmed this property is available. "
                "Would you like to proceed with a reservation?"
            )
        else:
            chat_message = (
                "❌ Unfortunately, the agent confirmed this property is currently unavailable. "
                "Would you like me to show you similar options?"
            )

        # Find the conversation thread for this agent
        # Option 1: Look up by agent phone number (requires tracking agent->thread mapping)
        # Option 2: Use listing_id from webhook data (if we can extract it)
        # Option 3: Store pending availability checks in database/cache

        # For now, we'll use a simple approach: extract from agent's phone
        thread_id = find_thread_by_agent_phone(from_number)

        if not thread_id:
            logger.error(
                f"[Twilio Webhook] Could not find conversation thread for agent {from_number}"
            )
            return Response(
                {"status": "error", "reason": "thread_not_found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Inject system message into chat (via Celery task)
        inject_system_message_to_chat.delay(
            thread_id=thread_id,
            message=chat_message,
            metadata={
                "source": "twilio_webhook",
                "agent_phone": from_number,
                "message_sid": message_sid,
                "availability": is_available
            }
        )

        logger.info(
            f"[Twilio Webhook] Injected system message to thread {thread_id}: available={is_available}"
        )

        return Response(
            {"status": "ok", "thread_id": thread_id, "availability": is_available},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"[Twilio Webhook] Error processing webhook: {e}", exc_info=True)
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def find_thread_by_agent_phone(agent_phone: str) -> str | None:
    """
    Find the conversation thread associated with an agent's phone number.

    This is a placeholder implementation. You'll need to implement proper tracking:
    - Option 1: Store agent_phone -> thread_id mapping in Redis/cache when sending availability check
    - Option 2: Store in database (AvailabilityCheckRequest model)
    - Option 3: Parse listing_id from agent's response and look up recent conversation

    Args:
        agent_phone: Agent's phone number (whatsapp:+1234567890 format)

    Returns:
        Thread ID or None if not found
    """
    # Placeholder: In production, implement proper mapping
    # For now, return None to indicate this needs implementation
    logger.warning(f"find_thread_by_agent_phone not fully implemented for {agent_phone}")

    # Example implementation using cache:
    from django.core.cache import cache
    cache_key = f"availability_check:{agent_phone}"
    thread_id = cache.get(cache_key)

    if thread_id:
        # Clear the cache entry after retrieval (one-time use)
        cache.delete(cache_key)
        return thread_id

    return None
