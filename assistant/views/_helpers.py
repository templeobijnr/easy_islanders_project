# assistant/views/_helpers.py

import uuid
import logging
import json
import time
from typing import Optional, List, Dict, Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.response import Response
from listings.models import Listing
from ..models import Conversation, ConversationThread


logger = logging.getLogger(__name__)


def _normalize_chat_result(request, thread_id: str, lc_result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Coerce any agent result or None into a stable response payload.
    """
    if not isinstance(lc_result, dict):
        lc_result = {}
    msg = lc_result.get('message') or lc_result.get('response') or ''
    language = lc_result.get('language') or request.data.get('language') or 'en'
    recs = lc_result.get('recommendations') or []
    return {
        "response": msg,
        "thread_id": thread_id,
        "language": language,
        "recommendations": recs,
        "function_calls": lc_result.get("function_calls", []),
        "requires_phone": lc_result.get("requires_phone", False),
        "conversation_id": thread_id,
    }


def _safe_chat_response(request, thread_id: str, lc_result: Optional[Dict[str, Any]], http_status: int = 200) -> 'Response':
    """
    Always return a DRF Response for chat payloads, even if lc_result is None or malformed.
    """
    from rest_framework.response import Response
    payload = _normalize_chat_result(request, thread_id, lc_result)
    return Response(payload, status=http_status)


def _notify_new_images(listing_id: int, media_urls: List[str]):
    """Notify that new images are available for a listing."""
    try:
        from ..utils.notifications import put_notification
        put_notification(str(listing_id), {
            'type': 'new_images',
            'listing_id': listing_id,
            'media_urls': media_urls,
            'timestamp': timezone.now().isoformat()
        })
        logger.info(f"Notification sent for new images on listing {listing_id}")
    except Exception as e:
        logger.exception(f"Failed to notify new images for listing {listing_id}")


def _auto_trigger_image_display(listing_id: int, stored_urls: List[str], conversation_id: str = None):
    """Automatically trigger image display for new photos."""
    try:
        from ..utils.notifications import put_auto_display
        # Get listing to check image count
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        image_urls = sd.get('image_urls', [])
        image_count = len(image_urls)

        display_data = {
            'image_count': image_count,
            'image_urls': image_urls,
            'message': f"New photos available for listing {listing_id}",
            'verified_with_photos': sd.get('verified_with_photos', False)
        }

        put_auto_display(conversation_id or str(listing_id), display_data)
        logger.info(f"Auto-display triggered for listing {listing_id}")
        return display_data
    except Exception as e:
        logger.exception(f"Failed to auto-trigger image display for listing {listing_id}")
        return None


def _is_https(request) -> bool:
    """Check if request is HTTPS."""
    return request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' or request.is_secure()


def _ensure_conversation(conversation_id: str) -> str:
    """Ensure conversation_id is valid, create if needed."""
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
    return conversation_id


def _resolve_thread_id(user, supplied_thread_id: str = None) -> str:
    """Resolve thread_id using unified resolver."""
    if supplied_thread_id:
        return supplied_thread_id

    # For anonymous users, create a new thread
    if not user or not user.is_authenticated:
        return str(uuid.uuid4())

    # Get or create active thread for authenticated user
    try:
        thread = ConversationThread.objects.filter(
            user=user,
            is_active=True
        ).first()

        if thread:
            return thread.thread_id
        else:
            # Create new active thread
            new_thread_id = str(uuid.uuid4())
            ConversationThread.objects.create(
                user=user,
                thread_id=new_thread_id,
                is_active=True
            )
            return new_thread_id
    except Exception as e:
        logger.exception(f"Error resolving thread_id for user {user}")
        return str(uuid.uuid4())


def _validate_twilio_webhook(request) -> bool:
    """Validate Twilio webhook signature."""
    # Skip validation in DEBUG mode for development
    if settings.DEBUG:
        return True

    # TODO: Implement actual Twilio signature validation
    # For now, just return True
    return True


def _record_outreach_attempt(listing, channel: str, contact_number: str, language: str, result: Dict):
    """Record outreach attempt in listing structured data."""
    try:
        sd = listing.structured_data or {}
        outreach_entry = {
            "timestamp": timezone.now().isoformat(),
            "channel": channel,
            "contact": contact_number,
            "language": language,
            "success": result.get("success", False),
            "at": timezone.now().isoformat(),
            "status": "sent",
            "twilio_message_sid": result.get("message_sid"),
            "outreach_id": f"outreach_{listing.id}_{channel}_{int(timezone.now().timestamp())}"
        }

        existing = sd.get("outreach") or []
        if not isinstance(existing, list):
            existing = [existing]
        existing.append(outreach_entry)
        sd["outreach"] = existing

        listing.structured_data = sd
        listing.save(update_fields=["structured_data"])

    except Exception as e:
        logger.exception(f"Failed to record outreach for listing {listing.id}")