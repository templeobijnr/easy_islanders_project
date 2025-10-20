from __future__ import annotations

from typing import Any, Dict, List, Optional, Callable
import json
import uuid
import logging
import re

from django.db.models import Q
from django.utils import timezone

from ..models import Message
from .config import ENABLE_LANGCHAIN
from .chains import language_chain, intent_chain, requirements_chain, run_chain, fallback_chain
from .geo import normalize_location, regional_fallback
from .memory import load_recent_messages, save_assistant_turn
from .schemas import IntentResult, Requirements
from ..tools import initiate_contact_with_seller, search_internal_listings, get_knowledge, check_for_new_images, has_contact_info
from dateutil.parser import parse as parse_datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants & configuration
# ---------------------------------------------------------------------------
CONTEXT_MODE: bool = True  # or: bool(ENABLE_LANGCHAIN)
GREETING_KEYWORDS = {"hello", "hi", "hey"}

PHOTO_KEYWORDS = [
    "photo", "photos", "picture", "pictures", "pics", "images",
    "resim", "foto", "fotoğraf", "fotograf",  # Turkish, with/without diacritics
    "фото", "фотографии",  # Russian
    "zdjecia", "zdjęcia",  # Polish
    "can you show", "i want pictures", "i want photos",
    "show pictures", "show photos", "see pictures", "see photos",
    "more pictures", "more photos", "additional photos", "additional pictures",
]

PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental", "property",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms",
    "girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta",
    "catalkoy", "çatalköy", "karakum", "lapta", "alsancak", "bellapais", "esentepe", "karsiyaka", "karşıyaka",
    "long term", "short term", "daily", "night", "/month", "per month", "€", "£", "euro", "pounds",
}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def _is_greeting(text: str) -> bool:
    t = (text or "").strip().lower()
    return t in GREETING_KEYWORDS

def _looks_like_property_search(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    if any(k in t for k in PROPERTY_KEYWORDS):
        return True
    if re.search(r"\b(\d+)\s*(bed|bedroom|bedrooms)\b", t):
        return True
    if re.search(r"\b\d\s*\+\s*1\b", t):
        return True
    return False

def _looks_like_agent_outreach(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    contact_keywords = [
        "contact agent", "contact the agent", "call agent", "call the agent",
        "reach out", "get photos", "get pictures", "more photos", "more pictures",
        "agent photos", "agent pictures", "contact for photos", "contact for pictures",
        "can you contact", "please contact", "contact them", "contact him", "contact her",
        "contact the first", "contact the second", "contact the third", "contact listing",
        "contact this", "contact that", "contact it", "contact one", "contact two", "contact three",
    ]
    return any(k in t for k in contact_keywords)

def _looks_like_conversation_continuation(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    continuation_keywords = [
        "what did we talk about", "what did we discuss", "what were we talking about",
        "remember", "you said", "we were talking", "previous conversation", "earlier",
        "what did i ask", "what did i say", "what was our conversation", "recall",
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
        "show pictures", "show photos", "show me the photos", "have pictures", "have photos",
    ]
    return any(k in t for k in status_keywords)

def _user_asked_for_photos(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in PHOTO_KEYWORDS)

def _parse_json(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        return {}

# ---------------------------------------------------------------------------
# History & pending actions helpers
# ---------------------------------------------------------------------------
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
                    if listing_id:
                        # Use the imported function from tools
                        result = check_for_new_images(listing_id, outreach_timestamp=action.get("timestamp"))
                        if result.get("has_new_images") or result.get("has_new_since"):
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

# ---------------------------------------------------------------------------
# Listing / media helpers
# ---------------------------------------------------------------------------
def _get_last_recommendations(conversation_id: Optional[str]) -> List[int]:
    if not conversation_id:
        return []
    try:
        messages = (
            Message.objects
            .filter(conversation__conversation_id=conversation_id, role="assistant")
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
    if not conversation_id:
        return None
    try:
        messages = (
            Message.objects
            .filter(conversation__conversation_id=conversation_id, role="assistant")
            .order_by("-created_at")
        )
        for msg in messages:
            if (
                msg.message_context
                and msg.message_context.get("intent_type") == "agent_outreach"
                and msg.message_context.get("contacted_listing")
            ):
                return {
                    "listing_id": msg.message_context.get("contacted_listing"),
                    "outreach_ok": msg.message_context.get("outreach_ok", False),
                    "contacted_at": msg.created_at.isoformat(),
                    "message": msg.content,
                }
    except Exception:
        return None
    return None

# Removed duplicate _check_for_new_images function - using imported version from tools

def _resolve_listing_reference(text: str, conversation_id: Optional[str]) -> Optional[int]:
    """Resolve which listing the user means; prefers last recommendations with contact info."""
    t = (text or "").lower()
    from ..models import Listing

    # 1) Direct "listing 3"
    m = re.search(r"\blisting\s*(\d+)\b", t)
    if m:
        try:
            listing_id = int(m.group(1))
            listing = Listing.objects.filter(id=listing_id, is_active=True).first()
            if listing and has_contact_info(listing):
                return listing_id
            return None
        except Exception:
            pass

    # 2) Recent recommendations + ordinal index
    recs = _get_last_recommendations(conversation_id)
    if recs:
        # "first/second/third" or explicit number
        m2 = re.search(r"\b(\d+)\b", t)
        if m2:
            idx = int(m2.group(1)) - 1
            ordered = [rid for rid in recs]
            if 0 <= idx < len(ordered):
                # ensure chosen has contact info; otherwise pick next that does
                for j in range(idx, len(ordered)):
                    cand = Listing.objects.filter(id=ordered[j], is_active=True).first()
                    if cand and has_contact_info(cand):
                        return int(cand.id)
                return None

        # "2+1" preference within recs
        m3 = re.search(r"(\d+)\s*\+\s*1", t)
        if m3:
            try:
                beds = int(m3.group(1))
                cand = (
                    Listing.objects.filter(id__in=recs, is_active=True)
                    .filter(Q(structured_data__bedrooms=beds) | Q(raw_text__icontains=f"{beds}+1"))
                    .first()
                )
                if cand and has_contact_info(cand):
                    return int(cand.id)
            except Exception:
                pass

        # Fallback: first contactable rec
        for rid in recs:
            cand = Listing.objects.filter(id=rid, is_active=True).first()
            if cand and has_contact_info(cand):
                return int(cand.id)

    # 3) Heuristic DB search by pattern (beds + location) limited to contactable
    bedroom_match = re.search(r'(\d+)\s*\+\s*1', t)
    location_keywords = ['girne', 'kyrenia', 'lefkoşa', 'nicosia', 'magosa', 'famagusta', 'esentepe', 'lapta', 'alsancak']
    bedrooms = int(bedroom_match.group(1)) if bedroom_match else None
    location = next((kw for kw in location_keywords if kw in t), None)

    query = Q(is_active=True)
    if bedrooms is not None:
        query &= (Q(structured_data__bedrooms=bedrooms) | Q(raw_text__icontains=f"{bedrooms}+1"))
    if location:
        query &= (Q(location__icontains=location) | Q(structured_data__location__icontains=location))

    matching = Listing.objects.filter(query).order_by('-last_seen_at')[:10]
    for listing in matching:
        if has_contact_info(listing):
            return int(listing.id)

    return None

def _build_recommendation_card(listing_id: int) -> List[Dict]:
    try:
        from ..models import Listing
        from ..utils.url_utils import normalize_image_list
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        # Use the imported function from tools
        image_status = check_for_new_images(listing_id)
        images = normalize_image_list(image_status.get("image_urls", []))[:5]
        return [{
            "id": listing.id,
            "title": sd.get("title", f"Property {listing_id}"),
            "price": sd.get("price", listing.price or "Price on request"),
            "location": sd.get("location", listing.location or "North Cyprus"),
            "images": images,
            "description": sd.get("description", "Property details"),
            "features": sd.get("features", []),
            "verified_with_photos": image_status.get("verified_with_photos") or bool(images),
            "auto_display": True,
        }]
    except Exception as e:
        logger.error(f"Error building card for {listing_id}: {e}")
        return []

def _looks_like_general_knowledge(text: str) -> bool:
    t = (text or "").lower()
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

# ---------------------------------------------------------------------------
# Primary entrypoint
# ---------------------------------------------------------------------------
def process_turn(user_text: str, conversation_id: Optional[str]) -> Dict[str, Any]:
    """Primary entrypoint for the LangChain agent. Returns a dict with: message, language, recommendations?, pending_status?"""
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    logger.info(f"[{request_id}] LC agent processing: {user_text[:120]}")

    # 1) Load context & language
    history = load_recent_messages(conversation_id, limit=10)
    history_summary = generate_history_summary(conversation_id)
    pending_actions = extract_pending_actions(conversation_id)

    try:
        language = run_chain(language_chain(), message=user_text) or "en"
    except Exception:
        language = "en"

    # 2) Greeting guards
    if history and _is_greeting(user_text):
        msg = "Hello again! How can I assist you with your search in North Cyprus?"
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "greeting_follow_up"})
        return {"message": msg, "language": language}
    if not history and _is_greeting(user_text):
        msg = "Hello! How can I assist you today?"
        save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "greeting"})
        return {"message": msg, "language": language}

    # 3) Detect intent (LLM → normalize → heuristic corrections)
    pending_actions_json = json.dumps(pending_actions)
    intent_raw = run_chain(
        intent_chain(),
        message=user_text,
        history_json=history_summary,
        language=language,
        pending_actions_json=pending_actions_json,
    )
    if isinstance(intent_raw, str):
        try:
            intent_raw = json.loads(intent_raw)
        except Exception:
            intent_raw = {}

    if not isinstance(intent_raw, dict) or not intent_raw.get('intent_type'):
        if _user_asked_for_photos(user_text) or _looks_like_status_update(user_text):
            intent_raw = {"intent_type": "status_update", "confidence": 0.9, "needs_tool": False, "language": language}
        elif _looks_like_property_search(user_text):
            intent_raw = {"intent_type": "property_search", "confidence": 0.9, "needs_tool": True, "tool_name": "search_internal_listings", "language": language}
        else:
            intent_raw = {"intent_type": "general_chat", "confidence": 0.4, "needs_tool": False, "language": language}

    if 'intent_type' in intent_raw:
        intent_raw['intent_type'] = str(intent_raw['intent_type']).lower()
    if 'action' in intent_raw and not intent_raw.get('action'):
        intent_raw['action'] = None

    try:
        intent = IntentResult(**intent_raw)
    except Exception as e:
        logger.warning(f"Intent validation failed: {e} - Raw: {intent_raw}")
        intent = IntentResult(intent_type="general_chat", confidence=0.5, needs_tool=False, language=language)

    lt = user_text.lower()
    if _looks_like_property_search(lt) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="property_search", confidence=0.9, needs_tool=True, tool_name="search_internal_listings", language=language)
    elif _looks_like_agent_outreach(lt) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="agent_outreach", confidence=0.9, needs_tool=True, tool_name="initiate_contact_with_seller", language=language)
    elif _looks_like_status_update(lt) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="status_update", confidence=0.9, needs_tool=False, language=language)
    elif _looks_like_general_knowledge(lt) and intent.confidence < 0.8:
        intent = IntentResult(intent_type="knowledge_query", confidence=0.9, needs_tool=True, tool_name="get_knowledge", language=language)

    # Greeting fallback with correct precedence
    if intent.confidence < 0.6 and ("hi" in lt or "hello" in lt):
        intent = IntentResult(intent_type="general_chat", confidence=1.0, needs_tool=False, language=language)

    # 4) Status update handling (single place)
    if intent.intent_type == "status_update":
        if pending_actions:
            for action in pending_actions:
                if action.get('type') != 'outreach_pictures':
                    continue
                listing_id = action['listing_id']
                status = action.get('status', 'waiting')

                # Check new images since outreach timestamp
                img = check_for_new_images(listing_id, outreach_timestamp=action.get('timestamp'))
                if status == 'completed' or img.get("has_new_images"):
                    response_msg = f"I've received new photos for listing {listing_id}. Here they are:"
                    recommendations = _build_recommendation_card(listing_id)
                    message_context = {"intent_type": "status_update_completed_repeat", "pending_actions": pending_actions}
                    save_assistant_turn(conversation_id, user_text, response_msg, message_context)
                    return {
                        "message": response_msg,
                        "language": language,
                        "recommendations": recommendations,
                        "pending_status": "completed",
                    }
                else:
                    # Still waiting
                    try:
                        contacted_at = parse_datetime(action['timestamp'])
                        if timezone.is_naive(contacted_at):
                            contacted_at = timezone.make_aware(contacted_at, timezone.utc)
                        elapsed_min = int((timezone.now() - contacted_at).total_seconds() / 60)
                    except Exception:
                        elapsed_min = None
                    waited = f"{elapsed_min} minutes" if elapsed_min is not None else "a short while"
                    response_msg = (
                        f"I'm still waiting for the agent's response on listing {listing_id}. "
                        f"It's been {waited}. Would you like me to follow up or show other properties?"
                    )
                    message_context = {"intent_type": "status_update_waiting", "pending_actions": pending_actions}
                    save_assistant_turn(conversation_id, user_text, response_msg, message_context)
                    return {"message": response_msg, "language": language, "pending_status": "waiting"}
        else:
            response_msg = "I'm not currently waiting on any agent. Is there a specific property you'd like me to get details for?"
            save_assistant_turn(conversation_id, user_text, response_msg, {"intent_type": "status_update_no_pending"})
            return {"message": response_msg, "language": language, "recommendations": []}

    # 5) Tool routing
    if intent.needs_tool and intent.tool_name:
        if intent.tool_name == "search_internal_listings":
            # Extract requirements (LLM is optional; fallback to raw)
            req_data: Dict[str, Any] = {}
            try:
                req_json = run_chain(requirements_chain(), message=user_text, language=language)
                req_data = _parse_json(req_json)
            except Exception:
                req_data = {}

            try:
                req = Requirements(**{**req_data, "raw_query": user_text})
            except Exception:
                req = Requirements(raw_query=user_text)

            attrs: Dict[str, Any] = {}
            if req:
                if req.bedrooms not in (None, "any"): attrs["beds"] = req.bedrooms
                if req.max_price is not None: attrs["max_price"] = req.max_price
                if req.min_price is not None: attrs["min_price"] = req.min_price
                if req.currency: attrs["currency"] = req.currency
                if req.duration: attrs["duration"] = req.duration
                if req.features: attrs["features"] = req.features
                if req.furnished is not None: attrs["furnished"] = req.furnished
                if req.pets_allowed is not None: attrs["pets_allowed"] = req.pets_allowed

            location = normalize_location(req.location if req else None)

            search_result = search_internal_listings(
                listing_type="property_rent",
                location=location,
                attributes=attrs,
                language=language,
            )
            cards: List[Dict[str, Any]] = search_result.get("data", []) if isinstance(search_result, dict) else []

            if not cards and location:
                region = regional_fallback(location)
                if region:
                    search_result = search_internal_listings(
                        listing_type="property_rent",
                        location=region,
                        attributes=attrs,
                        language=language,
                    )
                    cards = search_result.get("data", []) if isinstance(search_result, dict) else []

            if cards:
                rec_ids: List[int] = []
                for c in cards:
                    try:
                        rec_ids.append(int(c.get("id")))
                    except Exception:
                        continue
                msg = f"I found {len(cards)} properties for you."
                save_assistant_turn(
                    conversation_id,
                    user_text,
                    msg,
                    message_context={"intent_type": "property_search", "tool_used": "search_internal_listings", "last_recommendations": rec_ids},
                )
                return {"message": msg, "language": language, "recommendations": cards}

            # No results
            msg = (
                "I couldn't find properties matching your request right now. "
                "Would you like me to broaden the search or take your phone number to notify you when a match appears?"
            )
            save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "property_search", "last_recommendations": []})
            return {"message": msg, "language": language, "recommendations": []}

        elif intent.tool_name == "initiate_contact_with_seller":
            listing_id = _resolve_listing_reference(user_text, conversation_id)
            if not listing_id:
                response_msg = (
                    "I couldn't determine which listing to contact. "
                    "Please specify the listing number (e.g., 'listing 1') or say 'contact the first/second one'."
                )
                save_assistant_turn(conversation_id, user_text, response_msg, {"intent_type": "agent_outreach_unresolved"})
                return {"message": response_msg, "language": language, "recommendations": []}

            tool_result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                language=language,
                conversation_id=conversation_id,
            )

            response_msg = tool_result.get("data", "Action completed.")
            ok = bool(isinstance(tool_result, dict) and tool_result.get("ok"))
            reason = (tool_result.get("reason") if isinstance(tool_result, dict) else None) or "unknown"

            if ok:
                timestamp_str = timezone.now().isoformat()
                pending_action = {"type": "outreach_pictures", "listing_id": int(listing_id), "status": "waiting", "timestamp": timestamp_str}
                updated_pending = pending_actions + [pending_action] if CONTEXT_MODE else pending_actions
                response_msg = f"OK, I've contacted the agent for listing {listing_id}. I'll update you when they reply."
                message_context = {
                    "intent_type": "agent_outreach",
                    "tool_used": intent.tool_name,
                    "contacted_listing": int(listing_id),
                    "outreach_ok": True,
                    "pending_actions": updated_pending,
                }
            else:
                if reason == "no_contact":
                    response_msg = (
                        f"I don't have contact information for listing {listing_id}. "
                        "Would you like me to show similar properties I can contact?"
                    )
                elif reason == "not_found":
                    response_msg = (
                        f"I couldn't find listing {listing_id}. It may have been removed. "
                        "Would you like to see current available properties?"
                    )
                else:
                    response_msg = (
                        f"I ran into an issue contacting the agent for listing {listing_id}. "
                        "Would you like me to try another property?"
                    )
                message_context = {
                    "intent_type": "agent_outreach",
                    "tool_used": intent.tool_name,
                    "contacted_listing": int(listing_id),
                    "outreach_ok": False,
                    "outreach_reason": reason,
                }

            save_assistant_turn(conversation_id, user_text, response_msg, message_context)
            return {"message": response_msg, "language": language, "recommendations": []}

        elif intent.tool_name == "get_knowledge":
            # Implement your knowledge tool behavior as needed
            result = get_knowledge(query=user_text, language=language)
            msg = result.get("data", "Here's what I found.") if isinstance(result, dict) else "Here's what I found."
            save_assistant_turn(conversation_id, user_text, msg, {"intent_type": "knowledge_query"})
            return {"message": msg, "language": language, "recommendations": []}

    # 6) Conversation continuation
    if intent.intent_type == "conversation_continuation":
        recent_messages = load_recent_messages(conversation_id)
        if recent_messages:
            response_msg = (
                "We were discussing property rentals in North Cyprus. "
                "Would you like me to show more properties, or contact an agent for one you liked?"
            )
        else:
            response_msg = "I don't see our previous history. How can I help you with properties in North Cyprus today?"
        save_assistant_turn(conversation_id, user_text, response_msg, {"intent_type": "conversation_continuation"})
        return {"message": response_msg, "language": language}

    # 7) Photo-request safety net (no pending actions yet)
    if _user_asked_for_photos(user_text):
        recs = _get_last_recommendations(conversation_id)
        if recs:
            listing_id = recs[0]
            tool_result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                language=language,
                conversation_id=conversation_id,
            )
            ok = bool(isinstance(tool_result, dict) and tool_result.get("ok"))
            if ok:
                msg = (
                    f"Got it. I've contacted the agent for listing {listing_id} to request photos and confirm availability. "
                    f"I'll update you as soon as they reply."
                )
            elif isinstance(tool_result, dict) and tool_result.get("reason") == "no_contact":
                msg = f"I don't have contact details for listing {listing_id}. Shall I show similar options I can contact?"
            else:
                msg = f"I tried to contact the agent for listing {listing_id}, but hit an issue."
            ctx = {
                "intent_type": "agent_outreach",
                "contacted_listing": int(listing_id),
                "outreach_ok": ok,
            }
            if ok and CONTEXT_MODE:
                ctx["pending_actions"] = pending_actions + [{
                    "type": "outreach_pictures",
                    "listing_id": int(listing_id),
                    "status": "waiting",
                    "timestamp": timezone.now().isoformat(),
                }]
            save_assistant_turn(conversation_id, user_text, msg, ctx)
            return {"message": msg, "language": language}

    # 8) Fallback chat (single place)
    response_msg = run_chain(fallback_chain(), message=user_text, history_json=history_summary)
    save_assistant_turn(conversation_id, user_text, response_msg, {"intent_type": "general_chat_fallback"})
    return {"message": response_msg, "language": language, "recommendations": []}
