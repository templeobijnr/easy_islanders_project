from __future__ import annotations

from typing import Any, Dict, List, Optional, Callable
import json
import uuid
import logging

from django.db.models import Q
from django.utils import timezone

from ..models import Message
from .config import ENABLE_LANGCHAIN
from .chains import language_chain, intent_chain, requirements_chain, run_chain, fallback_chain
from .geo import normalize_location, regional_fallback
from .memory import load_recent_messages, save_assistant_turn
from .schemas import IntentResult, Requirements
from ..tools import initiate_contact_with_seller, search_internal_listings, get_knowledge
from dateutil.parser import parse as parse_datetime


logger = logging.getLogger(__name__)


PHOTO_KEYWORDS = [
    "photo", "photos", "picture", "pictures", "pics", "images",
    "resim", "foto", "fotograf", "фото", "zdjecia", "zdjęcia",
    "can you show", "i want pictures", "i want photos", 
    "show pictures", "show photos", "see pictures", "see photos", 
    "more pictures", "more photos", "additional photos", "additional pictures",
]


# Fast-path intent heuristics to avoid falling back to generic responses when
# the LLM misclassifies obviously structured queries (e.g., "need a 2 bedroom in girne").
PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental", "property",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms", "girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta", "iskele", "catalkoy", "karakum", "lapta", "alsancak", "bellapais", "esentepe", "karsiyaka",
}


def _looks_like_property_search(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    # Basic keyword hit
    if any(k in t for k in PROPERTY_KEYWORDS):
        return True
    # Numeric + bedroom pattern
    import re
    if re.search(r"\b(\d+)\s*(bed|bedroom|bedrooms)\b", t):
        return True
    # 2+1 / 3+1 style
    if re.search(r"\b\d\s*\+\s*1\b", t):
        return True
    return False


def _looks_like_agent_outreach(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    # Direct contact agent keywords
    contact_keywords = [
        "contact agent", "contact the agent", "call agent", "call the agent",
        "reach out", "get photos", "get pictures", "more photos", "more pictures",
        "agent photos", "agent pictures", "contact for photos", "contact for pictures",
        "can you contact", "please contact", "contact them", "contact him", "contact her",
        "contact the first", "contact the second", "contact the third", "contact listing",
        "contact this", "contact that", "contact it", "contact one", "contact two", "contact three"
    ]
    return any(k in t for k in contact_keywords)


def _looks_like_conversation_continuation(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    # Conversation continuation keywords
    continuation_keywords = [
        "what did we talk about", "what did we discuss", "what were we talking about",
        "remember", "you said", "we were talking", "previous conversation", "earlier",
        "what did i ask", "what did i say", "what was our conversation", "recall"
    ]
    return any(k in t for k in continuation_keywords)


def _looks_like_status_update(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    status_keywords = [
        "any update", "any news", "any response", "any reply", "any pictures", "any photos",
        "update on", "news on", "response on", "reply on", "pictures of", "photos of",
        "still waiting", "waiting for", "heard back", "got response", "got reply",
        "agent replied", "agent responded", "agent sent", "agent shared",
        "did they reply", "did they respond", "did they send", "did they share",
        "when will", "how long", "how much longer", "still no", "no response yet",
        "show pictures", "show photos", "show me the photos", "have pictures", "have photos"
    ]
    return any(k in t for k in status_keywords)


def _user_asked_for_photos(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in PHOTO_KEYWORDS)


def _get_last_recommendations(conversation_id: Optional[str]) -> List[int]:
    if not conversation_id:
        return []
    try:
        # Look for the most recent assistant message that has recommendations
        messages = (
            Message.objects.filter(conversation__conversation_id=conversation_id, role="assistant")
            .order_by("-created_at")
        )
        for msg in messages:
            if msg.message_context and msg.message_context.get("last_recommendations"):
                recs = msg.message_context.get("last_recommendations") or []
                return [int(x) for x in recs if isinstance(x, (int, str))]
    except Exception:
        return []
    return []


def _get_last_contacted_listing(conversation_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Get the last listing that was contacted for photos."""
    if not conversation_id:
        return None
    try:
        # Look for the most recent assistant message that contacted an agent
        messages = (
            Message.objects.filter(conversation__conversation_id=conversation_id, role="assistant")
            .order_by("-created_at")
        )
        for msg in messages:
            if (msg.message_context and 
                msg.message_context.get("intent_type") == "agent_outreach" and
                msg.message_context.get("contacted_listing")):
                return {
                    "listing_id": msg.message_context.get("contacted_listing"),
                    "outreach_ok": msg.message_context.get("outreach_ok", False),
                    "contacted_at": msg.created_at.isoformat(),
                    "message": msg.content
                }
    except Exception:
        return None
    return None


def _check_for_new_images(listing_id: int) -> Dict[str, Any]:
    """Check if new images have been added to a listing since the last contact."""
    try:
        from ..models import Listing
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        
        # Get current image count
        current_images = sd.get('image_urls', [])
        current_count = len(current_images)
        
        # Get media entries with timestamps
        media_entries = sd.get('media', [])
        recent_media = []
        
        for entry in media_entries:
            if entry.get('type') == 'photo' and entry.get('added_at'):
                recent_media.append(entry)
        
        return {
            "has_new_images": current_count > 0,
            "image_count": current_count,
            "image_urls": current_images,
            "recent_media": recent_media,
            "last_photo_update": sd.get('last_photo_update'),
            "verified_with_photos": sd.get('verified_with_photos', False)
        }
    except Exception as e:
        logger.exception(f"Failed to check images for listing {listing_id}")
        return {"has_new_images": False, "image_count": 0, "image_urls": [], "error": str(e)}


def _resolve_listing_reference(text: str, conversation_id: Optional[str]) -> Optional[int]:
    """Enhanced listing resolution with multiple strategies"""
    import re
    t = (text or "").lower()
    
    # Strategy 1: Direct listing ID reference
    # Support variants like: "listing 3", "listing id 3", "listing #3"
    m = re.search(r"\blisting(?:\s*id|\s*#)?\s*(\d+)\b", t)
    if m:
        try:
            listing_id = int(m.group(1))
            # Verify the listing exists and has contact info
            from ..models import Listing
            from ..tools import has_contact_info
            listing = Listing.objects.filter(id=listing_id, is_active=True).first()
            if listing:
                if has_contact_info(listing):
                    return listing_id
                else:
                    # Listing exists but has no contact info - return None (not found)
                    return None
            else:
                # Listing doesn't exist - return None (not found)
                return None
        except Exception:
            pass
    
    # Strategy 2: Recent recommendations (existing logic)
    recs = _get_last_recommendations(conversation_id)
    if recs:
        # Ordinal/index patterns (e.g., "the first one", "the second one")
        m2 = re.search(r"\b(\d+)\b", t)
        if m2:
            idx = int(m2.group(1)) - 1
            if 0 <= idx < len(recs):
                return recs[idx]
        
        # Match by bedroom pattern within recent recommendations
        m3 = re.search(r"(\d+)\s*\+\s*1", t)
        if m3:
            try:
                beds = int(m3.group(1))
                from ..models import Listing
                cand = Listing.objects.filter(id__in=recs, is_active=True).filter(
                    Q(structured_data__bedrooms=beds) | Q(raw_text__icontains=f"{beds}+1")
                ).first()
                if cand:
                    return int(cand.id)
            except Exception:
                pass
        
        # Fallback: first recommendation
        return recs[0]
    
    # Strategy 3: Direct database search by description (NEW)
    # Extract bedroom pattern and location
    bedroom_match = re.search(r'(\d+)\s*\+\s*1', t)
    location_keywords = ['girne', 'kyrenia', 'lefkoşa', 'nicosia', 'magosa', 'famagusta']
    
    bedrooms = None
    if bedroom_match:
        bedrooms = int(bedroom_match.group(1))
    
    location = None
    for keyword in location_keywords:
        if keyword in t:
            location = keyword
            break
    
    # Search database for matching listings with contact info
    from ..models import Listing
    from ..tools import has_contact_info
    
    query = Q(is_active=True)
    if bedrooms:
        query &= Q(structured_data__bedrooms=bedrooms)
    if location:
        query &= (Q(location__icontains=location) | Q(structured_data__location__icontains=location))
    
    # Get listings that match the criteria
    matching_listings = Listing.objects.filter(query).order_by('-last_seen_at')[:10]
    
    # Filter by contact info and return the first match
    for listing in matching_listings:
        if has_contact_info(listing):
            return listing.id
    
    return None


def _parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        return {}


def _build_recommendation_card(listing_id: int) -> List[Dict]:
    try:
        from ..models import Listing
        from ..utils.url_utils import normalize_image_list
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        image_status = _check_for_new_images(listing_id)
        images = normalize_image_list(image_status["image_urls"])
        return [{
            "id": listing.id,
            "title": sd.get("title", f"Property {listing_id}"),
            "price": sd.get("price", "Price on request"),
            "location": sd.get("location", listing.location or "North Cyprus"),
            "images": images[:5],
            "description": sd.get("description", "Updated with new photos"),
            "features": sd.get("features", []),
            "verified_with_photos": True,
            "auto_display": True
        }]
    except Exception as e:
        logger.error(f"Error building card for {listing_id}: {e}")
        return []


def process_turn(user_text: str, conversation_id: Optional[str]) -> Dict[str, Any]:
    """Primary entrypoint for the LangChain agent.

    Returns a dict with keys: message, language, recommendations (optional).
    This function persists the turn with message_context.
    """
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    logger.info(f"[{request_id}] LC agent processing: {user_text[:120]}")

    # 1) Load context and history (always)
    history = load_recent_messages(conversation_id, limit=10)
    history_summary = generate_history_summary(conversation_id)
    pending_actions = extract_pending_actions(conversation_id)
    # Detect language early for better downstream behavior
    try:
        language = run_chain(language_chain(), message=user_text) or "en"
    except Exception:
        language = "en"

    # Greeting Guard for ongoing conversations
    GREETING_KEYWORDS = ["hello", "hi", "hey"]
    is_short_greeting = user_text.lower().strip() in GREETING_KEYWORDS and len(user_text.split()) <= 2
    if history and is_short_greeting:
        msg = "Hello again! How can I assist you with your search in North Cyprus?"
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "greeting_follow_up"})
        return {"message": msg, "language": language}

    # 2) Greeting for new conversations
    GREETING_KEYWORDS = ["hello", "hi", "hey"]
    is_pure_greeting = user_text.lower().strip() in GREETING_KEYWORDS
    if not history and is_pure_greeting:
        msg = "Hello! How can I assist you today?"
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "greeting"})
        return {"message": msg, "language": language}

    # 3) Detect intent (LLM + heuristics for robustness)
    pending_actions_json = json.dumps(pending_actions)
    intent_raw = run_chain(intent_chain(), message=user_text, history_json=history_summary, language=language, pending_actions_json=pending_actions_json)
    if isinstance(intent_raw, str):
        try:
            intent_raw = json.loads(intent_raw)
        except Exception:
            intent_raw = {}  # Fallback to empty dict

    # Defensive: if the LLM returned an empty object, short-circuit with heuristics
    if not isinstance(intent_raw, dict) or not intent_raw.get('intent_type'):
        if _user_asked_for_photos(user_text) or _looks_like_status_update(user_text):
            intent_raw = {"intent_type": "status_update", "confidence": 0.9, "needs_tool": False, "language": language}
        elif _looks_like_property_search(user_text):
            intent_raw = {"intent_type": "property_search", "confidence": 0.9, "needs_tool": True, "tool_name": "search_internal_listings", "language": language}
        else:
            intent_raw = {"intent_type": "general_chat", "confidence": 0.4, "needs_tool": False, "language": language}

    # NEW: Normalize values to match schema
    if isinstance(intent_raw, dict):
        if 'intent_type' in intent_raw:
            intent_raw['intent_type'] = intent_raw['intent_type'].lower()
        if 'action' in intent_raw and not intent_raw['action']:
            intent_raw['action'] = None  # Default to None if empty

    # NEW: Try to create IntentResult with fallback
    try:
        intent = IntentResult(**intent_raw)
    except Exception as e:
        logger.warning(f"Intent validation failed: {e} - Raw: {intent_raw}")
        intent = IntentResult(intent_type="general_chat", confidence=0.5, needs_tool=False, language="en")
    # Apply heuristics to correct LLM misclassifications
    if _looks_like_property_search(user_text) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="property_search", confidence=0.9, needs_tool=True, tool_name="search_internal_listings")
    elif _looks_like_agent_outreach(user_text) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="agent_outreach", confidence=0.9, needs_tool=True, tool_name="initiate_contact_with_seller")
    elif _looks_like_status_update(user_text) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="status_update", confidence=0.9, needs_tool=False)
    elif _looks_like_general_knowledge(user_text) and intent.confidence < 0.8:
        # Align with schema naming
        intent = IntentResult(intent_type="knowledge_query", confidence=0.9, needs_tool=True, tool_name="get_knowledge")
    elif _looks_like_conversation_continuation(user_text) and intent.confidence < 0.8:
        # Align with schema naming
        intent = IntentResult(intent_type="conversation_continuation", confidence=0.9, needs_tool=False)

    # Strengthen fallback for simple greetings/chit-chat
    if intent.confidence < 0.6 and "hi" in user_text.lower() or "hello" in user_text.lower():
        intent = IntentResult(intent_type="general_chat", confidence=1.0, needs_tool=False)

    # 4) Handle pending actions and status updates
    if intent.intent_type == "status_update":
        if pending_actions:
            for action in pending_actions:
                listing_id = action['listing_id']
                if action['status'] == 'completed':
                    # Action is already completed, inform the user and show the card again
                    response_msg = f"I've already received the photos for listing {listing_id}. Here they are again:"
                    recommendations = _build_recommendation_card(listing_id)
                    message_context = {"intent_type": "status_update_completed_repeat", "pending_actions": pending_actions}
                    save_assistant_turn(conversation_id, user_text, response_msg, message_context)
                    return {"message": response_msg, "language": language, "recommendations": recommendations, "pending_status": "completed"}
                elif action['status'] == 'waiting':
                    # Still waiting
                    contacted_at = parse_datetime(action['timestamp'])
                    elapsed_min = int((timezone.now() - contacted_at).total_seconds() / 60)
                    response_msg = f"I'm still waiting for the agent's response on listing {listing_id}. It's been {elapsed_min} minutes. Would you like me to follow up or show other properties?"
                    message_context = {"intent_type": "status_update_waiting", "pending_actions": pending_actions}
                    save_assistant_turn(conversation_id, user_text, response_msg, message_context)
                    return {"message": response_msg, "language": language, "pending_status": "waiting"}
        else:
            # User is asking for an update, but nothing is pending
            response_msg = "I'm not currently waiting for any information. Is there a specific property you'd like me to get details for?"
            recommendations = []
            message_context={"intent_type": "status_update_no_pending"}
            save_assistant_turn(conversation_id, user_text, response_msg, message_context)
            return {"message": response_msg, "language": language, "recommendations": recommendations}

    # 5) Core intent routing
    if intent.needs_tool and intent.tool_name:
        if intent.tool_name == "search_internal_listings":
            # A) Extract structured requirements from the user's query
            req_json = run_chain(requirements_chain(), message=user_text, language=language)
            req_data = _parse_json(req_json)
            try:
                req = Requirements(**{**req_data, "raw_query": user_text})
            except Exception:
                req = Requirements(raw_query=user_text)

            # B) Build the attributes dictionary for the search tool
            attrs: Dict[str, Any] = {}
            if req:
                if req.bedrooms not in (None, "any"): attrs["beds"] = req.bedrooms
                if req.max_price is not None: attrs["max_price"] = req.max_price
                # Add other attributes from req as needed in the future

            # C) Call the search tool with the structured attributes
            search_result = search_internal_listings(
                listing_type="property_rent",
                location=req.location,
                attributes=attrs,
                language=language
            )
            
            recommendations = search_result.get("data", [])
            if recommendations:
                response_msg = f"I found {len(recommendations)} properties for you."
            else:
                response_msg = "I couldn't find any properties matching your request right now. Would you like me to broaden the search?"
            
            message_context = {"intent_type": "property_search", "tool_used": "search_internal_listings"}
            save_assistant_turn(conversation_id, user_text, response_msg, message_context)
            return {"message": response_msg, "language": language, "recommendations": recommendations}

        elif intent.tool_name == "initiate_contact_with_seller":
            # ... (existing logic for contacting agent)
            # This logic is mostly correct but needs to be integrated here cleanly.
            listing_id = _resolve_listing_reference(user_text, conversation_id)
            if not listing_id:
                response_msg = "I couldn't resolve which listing to contact. Please specify the listing number or say 'contact the first/second one'."
                save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "agent_outreach_unresolved"})
                return {"message": response_msg, "language": language, "recommendations": []}
            tool_args = {"listing_id": int(listing_id), "language": language, "conversation_id": conversation_id}
            tool_result = initiate_contact_with_seller(**tool_args)
            
            response_msg = tool_result.get("data", "Action completed.")
            recommendations = []
            message_context = {"intent_type": intent.intent_type, "tool_used": intent.tool_name}
            if tool_result.get("ok"):
                timestamp_str = timezone.now().isoformat()
                pending_action = {"type": "outreach_pictures", "listing_id": int(listing_id), "status": "waiting", "timestamp": timestamp_str}
                updated_pending = pending_actions + [pending_action]
                message_context["pending_actions"] = updated_pending
                response_msg = f"OK, I've contacted the agent for listing {listing_id}. I'll let you know when they reply."
            
            save_assistant_turn(conversation_id, user_text, response_msg, message_context)
            return {"message": response_msg, "language": language, "recommendations": recommendations}

    # 6) Fallback for low confidence or general chat
    else: # This will catch general_chat, continuation, and low-confidence intents
        logger.debug(f"Using fallback for intent: {intent.intent_type} with confidence {intent.confidence}")
        response_msg = run_chain(fallback_chain(), message=user_text, history_json=history_summary)
        recommendations = []
        message_context = {"intent_type": "general_chat_fallback"}
        save_assistant_turn(conversation_id, user_text, response_msg, message_context)
        return {"message": response_msg, "language": language, "recommendations": recommendations}

    # Language detection (if not set)
    language = run_chain(language_chain(), message=user_text) or "en"

    # 7) Requirements (for property_search)
    req = None
    if intent.intent_type == "property_search":
        req_json = run_chain(requirements_chain(), message=user_text, language=language)
        req_data = _parse_json(req_json)
        try:
            req = Requirements(**{**req_data, "raw_query": user_text})
        except Exception:
            req = Requirements(raw_query=user_text)

    # 8) Tool routing
    if intent.intent_type == "property_search":
        # Prepare search args
        attrs: Dict[str, Any] = {}
        if req:
            if req.bedrooms not in (None, "any"):
                attrs["bedrooms"] = req.bedrooms
            if req.min_price is not None:
                attrs["min_price"] = req.min_price
            if req.max_price is not None:
                attrs["max_price"] = req.max_price
            if req.currency:
                attrs["currency"] = req.currency
            if req.duration:
                attrs["duration"] = req.duration
            if req.features:
                attrs["features"] = req.features
            if req.furnished is not None:
                attrs["furnished"] = req.furnished
            if req.pets_allowed is not None:
                attrs["pets_allowed"] = req.pets_allowed

        location = normalize_location(req.location if req else None)
        search_result = search_internal_listings(
            listing_type="property",
            location=location,
            attributes=attrs,
        )

        cards: List[Dict[str, Any]] = search_result.get("data", []) if isinstance(search_result, dict) else []
        if not cards and location:
            # regional fallback
            region = regional_fallback(location)
            if region:
                search_result = search_internal_listings(
                    listing_type="property",
                    location=region,
                    attributes=attrs,
                )
                cards = search_result.get("data", []) if isinstance(search_result, dict) else []

        if cards:
            rec_ids: List[int] = []
            for c in cards:
                try:
                    rec_ids.append(int(c.get("id")))
                except Exception:
                    continue
            save_assistant_turn(
                conversation_id,
                user_text,
                "Here are options that match your request.",
                message_context={
                    "intent_type": "property_search",
                    "last_recommendations": rec_ids,
                },
            )
            return {"message": "Here are options that match your request.", "language": language, "recommendations": cards}

        # No results
        msg = "I wasn't able to find any active results that match your criteria right now. Please leave your phone number, and our team will contact you as soon as a match becomes available."
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "property_search", "last_recommendations": []})
        return {"message": msg, "language": language}

    # Handle agent outreach (user wants to contact property agents)
    if intent.intent_type == "agent_outreach":
        # Try to resolve which listing to contact agent for
        listing_id = _resolve_listing_reference(user_text, conversation_id)
        if listing_id:
            result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                channel="whatsapp",
                language=language,
                conversation_id=conversation_id,
            )
            
            # Enhanced response logic based on specific failure reasons
            if isinstance(result, dict) and result.get("ok"):
                msg = (
                    f"Perfect! I've contacted the agent for listing {listing_id} to request photos and confirm availability. "
                    f"I'll update you as soon as they reply with the information."
                )
            elif isinstance(result, dict) and result.get("reason") == "no_contact":
                msg = (
                    f"I'm sorry, but I don't have contact information for listing {listing_id}. "
                    f"This listing doesn't have agent contact details available in our system. "
                    f"Would you like me to show you other similar properties that I can contact agents for?"
                )
            elif isinstance(result, dict) and result.get("reason") == "not_found":
                msg = (
                    f"I couldn't find listing {listing_id} in our system. "
                    f"It may have been removed or is no longer available. "
                    f"Would you like me to show you current available properties?"
                )
            elif isinstance(result, dict) and result.get("reason") == "error":
                error_msg = result.get("error", "unknown error")
                msg = (
                    f"I encountered a technical issue while trying to contact the agent for listing {listing_id}. "
                    f"Please try again in a moment, or I can show you other available properties."
                )
            else:
                msg = (
                    f"I tried to contact the agent for listing {listing_id}, but encountered an unexpected issue. "
                    f"Let me show you other available properties that I can contact agents for."
                )
            
            # ENHANCED: Add pending action if context mode enabled and outreach successful
            message_context = {
                "intent_type": "agent_outreach",
                "contacted_listing": listing_id,
                "outreach_ok": bool(isinstance(result, dict) and result.get("ok")),
                "outreach_reason": result.get("reason") if isinstance(result, dict) else "unknown",
            }
            
            # Add pending action for context-aware tracking
            if context_mode and isinstance(result, dict) and result.get("ok"):
                message_context["pending_action"] = {
                    "type": "outreach_pictures",
                    "listing_id": listing_id,
                    "timestamp": timezone.now().isoformat(),
                    "status": "initiated"
                }
                logger.info(f"[{request_id}] Added pending action for listing {listing_id}")
            
            save_assistant_turn(conversation_id, user_text, msg, message_context=message_context)
            
            # Add context fields to return if enhanced mode
            response = {"message": msg, "language": language}
            if context_mode:
                response["context_summary"] = history_summary
                response["pending_action_added"] = bool(isinstance(result, dict) and result.get("ok"))
            
            return response
        else:
            # No specific listing found - provide helpful guidance
            recent_recs = _get_last_recommendations(conversation_id)
            if recent_recs:
                msg = (
                    "I'd be happy to contact an agent for you! I can see you've been looking at some properties. "
                    "Which one would you like me to contact the agent for? You can say 'the first one', 'the second one', "
                    "or refer to it by number like 'listing 1'."
                )
            else:
                msg = (
                    "I'd be happy to contact an agent for you! However, I need to know which property you're interested in. "
                    "Would you like me to show you some available properties first, or can you describe the property "
                    "you'd like me to contact an agent for?"
                )
            save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "agent_outreach", "needs_clarification": True})
            return {"message": msg, "language": language}

    # Handle conversation continuation (user asking about previous conversation)
    if intent.intent_type == "conversation_continuation":
        # Look at recent conversation history to provide context-aware response
        recent_messages = load_recent_messages(conversation_id)
        if recent_messages:
            # Find the last assistant message that had meaningful content
            last_assistant_msg = None
            last_recommendations = []
            for msg in reversed(recent_messages):
                if msg.get("role") == "assistant" and "Here are options" in msg.get("content", ""):
                    last_assistant_msg = msg.get("content")
                    # Try to get recommendations from message context
                    try:
                        last_context = Message.objects.filter(
                            conversation__conversation_id=conversation_id,
                            role="assistant"
                        ).order_by("-created_at").first()
                        if last_context and last_context.message_context:
                            last_recommendations = last_context.message_context.get("last_recommendations", [])
                    except Exception:
                        pass
                    break
            
            if last_assistant_msg and "property" in user_text.lower():
                response_msg = f"You were asking about properties in North Cyprus. I showed you some apartment options. Would you like to see more properties, or would you like me to contact an agent for more details about any of the listings I showed you?"
            else:
                response_msg = f"We were discussing property rentals in North Cyprus. I can help you search for apartments, or if you saw some listings you're interested in, I can contact the agents for more photos and details."
        else:
            response_msg = "I don't see our previous conversation history. How can I help you with properties in North Cyprus today?"
        
        save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "conversation_continuation"})
        return {"message": response_msg, "language": language}

    # Handle status updates (user asking for updates on previous contacts)
    if intent.intent_type == "status_update":
        # Check if we have a previous contact
        last_contact = _get_last_contacted_listing(conversation_id)
        if last_contact:
            listing_id = last_contact["listing_id"]
            contacted_at = last_contact["contacted_at"]
            
            # Check for new images
            image_status = _check_for_new_images(listing_id)
            
            if image_status["has_new_images"] and image_status["image_count"] > 0:
                # Great! We have new images
                response_msg = f"Great news! The agent for listing {listing_id} has sent {image_status['image_count']} photo(s). The images are now available in the property listing. You can view them in the property details."
                
                # If we have specific image URLs, we could include them in recommendations
                recommendations = []
                if image_status["image_urls"]:
                    from ..models import Listing
                    from ..utils.url_utils import normalize_image_list
                    try:
                        listing = Listing.objects.get(id=listing_id)
                        sd = listing.structured_data or {}
                        norm_images = normalize_image_list(image_status["image_urls"])[:5]
                        recommendations.append({
                            "id": listing.id,
                            "title": sd.get("title", f"Property {listing.id}"),
                            "price": sd.get("price", listing.price),
                            "location": sd.get("location", listing.location),
                            "images": norm_images,
                            "description": sd.get("description", "Property details available"),
                            "features": sd.get("features", []),
                        })
                    except Exception:
                        pass
                
                save_assistant_turn(
                    conversation_id, 
                    user_text, 
                    response_msg, 
                    message_context={
                        "intent_type": "status_update",
                        "images_received": True,
                        "listing_id": listing_id,
                        "image_count": image_status["image_count"]
                    }
                )
                return {"message": response_msg, "language": language, "recommendations": recommendations}
            else:
                # Still waiting for images
                response_msg = f"I'm still waiting for the agent's response for listing {listing_id}. I contacted them earlier and haven't received any photos yet. I'll keep checking and update you as soon as they reply with the pictures."
                
                save_assistant_turn(
                    conversation_id, 
                    user_text, 
                    response_msg, 
                    message_context={
                        "intent_type": "status_update",
                        "images_received": False,
                        "listing_id": listing_id,
                        "still_waiting": True
                    }
                )
                return {"message": response_msg, "language": language}
        else:
            # No previous contact found
            response_msg = "I don't see any recent agent contacts in our conversation. Would you like me to contact an agent for any of the properties you're interested in?"
            save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "status_update"})
            return {"message": response_msg, "language": language}

    # Final fallback: check for photo requests that might have been missed
    if _user_asked_for_photos(user_text):
        recs = _get_last_recommendations(conversation_id)
        if recs:
            # Use the first recommendation if no specific listing mentioned
            listing_id = recs[0]
            result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                channel="whatsapp",
                language=language,
                conversation_id=conversation_id,
            )
            if isinstance(result, dict) and result.get("ok"):
                msg = (
                    f"Got it. I've contacted the agent for listing {listing_id} to request photos and confirm availability. "
                    f"I'll update you as soon as they reply."
                )
            elif isinstance(result, dict) and result.get("reason") == "no_contact":
                msg = f"I'm sorry, but I don't have contact information for listing {listing_id}. The agent's contact details are not available in our system."
            else:
                msg = f"I tried to contact the agent for listing {listing_id}, but ran into an issue."
            save_assistant_turn(
                conversation_id,
                user_text,
                msg,
                message_context={
                    "intent_type": "agent_outreach",
                    "contacted_listing": listing_id,
                    "outreach_ok": bool(isinstance(result, dict) and result.get("ok")),
                },
            )
            return {"message": msg, "language": language}

    # Default fallback chat
    # Greeting should appear only for brand-new conversations
    if not history:
        msg = "Hello! How can I assist you today?"
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "greeting"})
        return {"message": msg, "language": language}

    # For ongoing conversations, avoid repeating the greeting
    msg = "I'm here to help. Could you clarify your request (rentals, bookings, services)?"
    save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "general_chat"})
    return {"message": msg, "language": language}


def extract_pending_actions(conversation_id: Optional[str]) -> List[Dict]:
    if not conversation_id:
        return []
    try:
        last_msg = Message.objects.filter(conversation__conversation_id=conversation_id, role="assistant").order_by('-created_at').first()
        if last_msg and last_msg.message_context:
            pending_actions = last_msg.message_context.get("pending_actions", [])
            # Update status based on current DB state
            for action in pending_actions:
                if action.get("type") == "outreach_pictures":
                    listing_id = action.get("listing_id")
                    if listing_id and _check_for_new_images(listing_id)["has_new_images"]:
                        action["status"] = "completed"
            return pending_actions
        return []
    except Exception as e:
        logger.error(f"Error extracting pending: {e}")
        return []

def generate_history_summary(conversation_id: Optional[str]) -> str:
    if not conversation_id:
        return "No prior context."
    history = load_recent_messages(conversation_id, limit=4)
    if not history:
        return "Start of conversation."
    summary_parts = []
    for msg in history:
        role = msg["role"].capitalize()
        content = msg["content"][:50] + "..." if len(msg["content"]) > 50 else msg["content"]
        summary_parts.append(f"{role}: {content}")
    return " | ".join(summary_parts)

def _looks_like_general_knowledge(text: str) -> bool:
    t = text.lower()
    knowledge_keywords = ["what is", "tell me about", "explain", "how does", "why", "when", "where", "who", "weather", "capital", "population", "history", "facts"]
    return any(k in t for k in knowledge_keywords) and not _looks_like_property_search(t) and not _looks_like_agent_outreach(t)


def make_tool(tool_name: str) -> Callable:
    if tool_name == "search_internal_listings":
        return search_internal_listings
    elif tool_name == "initiate_contact_with_seller":
        return initiate_contact_with_seller
    elif tool_name == "get_knowledge":
        return get_knowledge
    raise ValueError(f"Unknown tool: {tool_name}")
