"""
Auto-response functionality for proactive agent behavior
"""

import logging
from typing import Dict, Any
from django.conf import settings
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def trigger_auto_response(self, listing_id: int, conversation_id: str, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main auto-response function that calls the agent with proper context.
    
    This function:
    1. Classifies the response type (photos/text/mixed)
    2. Crafts intelligent fake user input
    3. Calls the main agent flow
    4. Saves and notifies the result
    """
    try:
        # Check feature flag
        if not getattr(settings, 'ENABLE_AUTO_RESPONSE', False):
            logger.info("Auto-response disabled by feature flag")
            return {"success": False, "reason": "feature_disabled"}
        
        logger.info(f"Auto-response trigger for conversation {conversation_id}, listing {listing_id}")
        
        # Classify response type
        media_urls = []
        for i in range(10):
            media_url = webhook_data.get(f'MediaUrl{i}')
            if media_url:
                media_urls.append(media_url)
        
        text = webhook_data.get('text', '').strip()
        is_media = bool(media_urls)
        is_text = bool(text)
        
        # Determine event type
        if is_media and is_text:
            event_type = "mixed_response"
        elif is_media:
            event_type = "photos_received"
        elif is_text:
            event_type = "text_reply"
        else:
            logger.warning(f"No content found in webhook data for conversation {conversation_id}")
            return {"success": False, "reason": "no_content"}
        
        # Craft intelligent fake user input
        if event_type == "photos_received":
            fake_input = f"internal_update: Agent sent {len(media_urls)} photos for listing {listing_id}. Analyze and respond."
        elif event_type == "text_reply":
            fake_input = f"internal_update: Agent replied '{text}' for listing {listing_id}. Analyze and respond."
        elif event_type == "mixed_response":
            fake_input = f"internal_update: Agent replied '{text}' and sent {len(media_urls)} photos for listing {listing_id}. Analyze and respond."
        else:
            fake_input = f"internal_update: Agent responded for listing {listing_id}. Analyze and respond."
        
        logger.info(f"Crafted fake input: {fake_input}")
        
        # Import agent function
        from .brain.agent import process_turn
        from .brain.memory import save_assistant_turn
        from .utils.notifications import put_notification
        
        # Call the main agent flow
        logger.info(f"Calling process_turn for conversation {conversation_id}")
        result = process_turn(fake_input, conversation_id)
        
        if not result.get("success", False):
            logger.error(f"Agent processing failed: {result.get('error', 'Unknown error')}")
            return {"success": False, "reason": "agent_failed", "error": result.get("error")}
        
        # Save as proactive message
        message_context = {
            "proactive": True,
            "event_type": event_type,
            "listing_id": listing_id,
            "auto_response": True,
            "webhook_data": {
                "media_count": len(media_urls),
                "has_text": is_text,
                "text_preview": text[:100] if text else None
            }
        }
        
        save_assistant_turn(
            conversation_id,
            "",  # No user input for proactive response
            result["message"],
            message_context
        )
        
        # Notify frontend
        notification = {
            "type": "auto_update",
            "data": {
                "message": result["message"],
                "recommendations": result.get("recommendations", []),
                "proactive": True,
                "event_type": event_type,
                "listing_id": listing_id
            }
        }
        
        put_notification(conversation_id, notification)
        
        logger.info(f"Auto-response success: {result['message'][:50]}...")
        return {
            "success": True,
            "message": result["message"],
            "event_type": event_type,
            "conversation_id": conversation_id,
            "listing_id": listing_id
        }
        
    except Exception as e:
        logger.error(f"Auto-response failed for conversation {conversation_id}: {e}")
        return {
            "success": False,
            "reason": "exception",
            "error": str(e)
        }
