from typing import Any, Dict, List, Optional
import logging

from ..models import Message

logger = logging.getLogger(__name__)


def load_recent_messages(conversation_id: Optional[str], limit: int = 10) -> List[Dict[str, str]]:
    if not conversation_id:
        return []
    try:
        # Query messages by conversation_id directly (no Conversation FK needed)
        msgs = Message.objects.filter(conversation_id=conversation_id).order_by("-created_at")[:limit]
    except Exception as e:
        logger.error(f"Error loading messages: {e}")
        return []
    return [{"role": m.type, "content": m.content} for m in reversed(list(msgs))]


def save_assistant_turn(
    conversation_id: Optional[str],
    user_text: str,
    assistant_text: str,
    message_context: Optional[Dict[str, Any]] = None,
) -> None:
    if not conversation_id:
        return
    # Create user message
    Message.objects.create(
        conversation_id=conversation_id,
        type="user",
        content=user_text,
    )
    # Create assistant message
    Message.objects.create(
        conversation_id=conversation_id,
        type="assistant",
        content=assistant_text,
    )


# NEW: Enhanced memory functions for context-aware agent (non-breaking additions)
def extract_pending_actions(conversation_id: Optional[str]) -> List[Dict]:
    """Extract pending actions from conversation history."""
    if not conversation_id:
        return []
    
    try:
        # Query messages by conversation_id directly
        msgs = Message.objects.filter(conversation_id=conversation_id).order_by("-created_at")[:5]
        # Filter for broadcast_request and seller_response types
        action_messages = [m for m in msgs if m.type in ['broadcast_request', 'seller_response']]
        return [
            {
                'type': m.type,
                'content': m.content,
                'timestamp': m.created_at.isoformat()
            }
            for m in reversed(list(action_messages))
        ]
    except Exception as e:
        logger.error(f"Error extracting pending actions: {e}")
        return []


def generate_history_summary(conversation_id: Optional[str]) -> str:
    """Generate concise history summary for prompts."""
    if not conversation_id:
        return "No prior context available."
    
    history = load_recent_messages(conversation_id, limit=4)  # Last 2 exchanges
    if len(history) < 2:
        return "Start of conversation."
    
    # Heuristic fallback (can enhance with LLM later)
    summary_parts = []
    for msg in history[-2:]:  # Last 2 exchanges
        role = "User" if msg['role'] == 'user' else "Assistant"
        content = msg['content'][:80] + "..." if len(msg['content']) > 80 else msg['content']
        summary_parts.append(f"{role}: {content}")
    
    return " | ".join(summary_parts)


def check_outreach_completed(listing_id: int) -> bool:
    """Check if agent responded (e.g., new images in DB)."""
    try:
        from ..models import Listing
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        # Perfect tie-in: Webhook sets 'verified_with_photos' in twilio_client.py
        return sd.get('verified_with_photos', False) and len(sd.get('image_urls', [])) > 0
    except Exception:
        return False


def load_recent_messages_with_context(conversation_id: Optional[str], limit: int = 10) -> List[Dict[str, Any]]:
    """Enhanced version that includes message context with timestamps."""
    if not conversation_id:
        return []
    try:
        # Query messages by conversation_id directly
        msgs = Message.objects.filter(conversation_id=conversation_id).order_by("-created_at")[:limit]
    except Exception as e:
        logger.error(f"Error loading messages with context: {e}")
        return []
    
    return [
        {
            "role": m.type, 
            "content": m.content,
            "timestamp": m.created_at.isoformat()
        } 
        for m in reversed(list(msgs))
    ]
