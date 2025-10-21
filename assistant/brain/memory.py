from typing import Any, Dict, List, Optional
import json
import logging
from datetime import timedelta

from django.utils import timezone
from ..models import Conversation, Message

logger = logging.getLogger(__name__)


def load_recent_messages(conversation_id: Optional[str], limit: int = 10) -> List[Dict[str, str]]:
    if not conversation_id:
        return []
    try:
        conv = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        return []
    msgs = conv.messages.order_by("-created_at")[:limit]
    return [{"role": m.role, "content": m.content} for m in reversed(list(msgs))]


def save_assistant_turn(
    conversation_id: Optional[str],
    user_text: str,
    assistant_text: str,
    message_context: Optional[Dict[str, Any]] = None,
) -> None:
    if not conversation_id:
        return
    conv, _ = Conversation.objects.get_or_create(id=conversation_id)
    Message.objects.create(
        conversation=conv,
        role="user",
        content=user_text,
        language="en",  # language detection handled elsewhere; optional refine
        created_at=timezone.now(),
    )
    Message.objects.create(
        conversation=conv,
        role="assistant",
        content=assistant_text,
        language="en",
        created_at=timezone.now(),
        message_context=message_context or {},
    )


# NEW: Enhanced memory functions for context-aware agent (non-breaking additions)
def extract_pending_actions(conversation_id: Optional[str]) -> List[Dict]:
    """Extract pending actions from conversation history."""
    if not conversation_id:
        return []
    
    try:
        conv = Conversation.objects.get(id=conversation_id)
        # Look for the most recent outreach message (regardless of time)
        outreach_msgs = conv.messages.filter(
            role='assistant',
            message_context__intent_type='agent_outreach',
            message_context__outreach_ok=True
        ).order_by('-created_at')[:1]  # Get the most recent one
        
        pending = []
        for msg in outreach_msgs:
            if hasattr(msg, 'message_context') and msg.message_context:
                ctx = msg.message_context
                listing_id = ctx.get('contacted_listing')
                if listing_id:
                    # Pictures pending
                    baseline_count = 0
                    try:
                        for a in ctx.get('pending_actions', []):
                            if a.get('type') == 'outreach_pictures':
                                baseline_count = int((a.get('context') or {}).get('baseline_image_count') or 0)
                                break
                    except Exception:
                        baseline_count = 0
                    is_completed = False
                    try:
                        from ..models import Listing
                        lst = Listing.objects.get(id=listing_id)
                        sd = lst.structured_data or {}
                        cur_count = int(len(sd.get('image_urls', [])))
                        is_completed = cur_count > baseline_count
                    except Exception:
                        is_completed = check_outreach_completed(listing_id)
                    pending.append({
                        'type': 'outreach_pictures',
                        'listing_id': listing_id,
                        'timestamp': msg.created_at.isoformat() if hasattr(msg, 'created_at') else msg.created_at,
                        'status': 'completed' if is_completed else 'waiting',
                        'baseline_image_count': baseline_count,
                    })
                    # Availability pending
                    try:
                        from ..models import Listing
                        lst = Listing.objects.get(id=listing_id)
                        sd = lst.structured_data or {}
                        availability = (sd.get('availability') or 'unknown').lower()
                        is_avl_done = availability in {'available', 'unavailable'}
                        pending.append({
                            'type': 'outreach_availability',
                            'listing_id': listing_id,
                            'timestamp': msg.created_at,
                            'status': 'completed' if is_avl_done else 'waiting',
                            'availability': availability,
                        })
                    except Exception:
                        pending.append({
                            'type': 'outreach_availability',
                            'listing_id': listing_id,
                            'timestamp': msg.created_at,
                            'status': 'waiting'
                        })
        return pending
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
    """Enhanced version that includes message_context (optional for future use)."""
    if not conversation_id:
        return []
    try:
        conv = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        return []
    
    msgs = conv.messages.order_by("-created_at")[:limit]
    return [
        {
            "role": m.role, 
            "content": m.content,
            "context": getattr(m, 'message_context', {}) or {},
            "timestamp": m.created_at
        } 
        for m in reversed(list(msgs))
    ]
