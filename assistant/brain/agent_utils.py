from __future__ import annotations

"""
Utilities used by the LangGraph agent for listing/context resolution.

Pulled from legacy agent to avoid importing the sequential orchestrator.
"""

from typing import Any, Dict, List, Optional, Tuple
import logging
import json
import re

from django.db.models import Q
from assistant.monitoring.otel_instrumentation import create_tool_span

logger = logging.getLogger(__name__)


def get_last_recommendations(conversation_id: Optional[str]) -> List[int]:
    if not conversation_id:
        return []
    try:
        from assistant.models import Message
        messages = Message.objects.filter(
            conversation_id=conversation_id, type="assistant"
        ).order_by("-created_at")
        for msg in messages:
            # message_context is not persisted in current Message model; be defensive
            ctx = getattr(msg, "message_context", None) or {}
            recs = ctx.get("last_recommendations") if isinstance(ctx, dict) else None
            if recs:
                return [int(x) for x in recs if isinstance(x, (int, str))]
    except Exception:
        return []
    return []


def get_last_contacted_listing(conversation_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not conversation_id:
        return None
    try:
        from assistant.models import Message
        messages = Message.objects.filter(
            conversation_id=conversation_id, type="assistant"
        ).order_by("-created_at")
        
        # DEBUG: Log all messages to see what's in the conversation
        logger.critical(f"DEBUG get_last_contacted_listing for conversation {conversation_id}:")
        logger.critical(f"Found {messages.count()} assistant messages")
        
        outreach_messages = []
        for i, msg in enumerate(messages):
            logger.critical(f"  Message {i+1}: created_at={msg.created_at}, content='{msg.content[:100]}...'")
            if msg.message_context:
                intent_type = msg.message_context.get("intent_type")
                contacted_listing = msg.message_context.get("contacted_listing")
                logger.critical(f"    message_context: intent_type={intent_type}, contacted_listing={contacted_listing}")
                
                if (intent_type == "agent_outreach" and contacted_listing):
                    outreach_messages.append({
                        "message": msg,
                        "listing_id": contacted_listing,
                        "created_at": msg.created_at
                    })
        
        logger.critical(f"Found {len(outreach_messages)} agent_outreach messages")
        for i, om in enumerate(outreach_messages):
            logger.critical(f"  Outreach {i+1}: listing_id={om['listing_id']}, created_at={om['created_at']}")
        
        # Return the most recent outreach message
        for msg in messages:
            ctx = getattr(msg, "message_context", None) or {}
            if (
                isinstance(ctx, dict)
                and ctx.get("intent_type") == "agent_outreach"
                and ctx.get("contacted_listing")
            ):
                out = {
                    "listing_id": ctx.get("contacted_listing"),
                    "outreach_ok": ctx.get("outreach_ok", False),
                    "contacted_at": msg.created_at.isoformat(),
                    "message": msg.content,
                }
                try:
                    pacts = ctx.get("pending_actions") or []
                    for a in pacts:
                        if a.get("type") == "outreach_pictures":
                            ctx = a.get("context") or {}
                            if ctx.get("baseline_image_count") is not None:
                                out["baseline_image_count"] = int(ctx.get("baseline_image_count") or 0)
                                break
                except Exception:
                    pass
                logger.critical(f"SELECTED: listing_id={out['listing_id']}, created_at={out['contacted_at']}")
                return out
    except Exception as e:
        logger.exception(f"Error in get_last_contacted_listing: {e}")
        return None
    return None


def check_for_new_images(listing_id: int) -> Dict:
    try:
        from listings.models import Listing
        with create_tool_span("db_search", "query", request_id=str(conversation_id) if conversation_id else None):
            listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        baseline = sd.get('baseline_image_count', 0)
        current_urls = sd.get('image_urls', [])
        has_new = len(current_urls) > baseline and sd.get('verified_with_photos', False)
        return {"has_new_images": has_new, "current_count": len(current_urls)}
    except:
        return {"has_new_images": False, "current_count": 0}


def resolve_listing_reference(text: str, conversation_id: Optional[str]) -> Optional[int]:
    import re
    t = (text or "").lower()

    # Direct pattern variants: "listing <id>", "listing id <id>", "listing #<id>"
    m = re.search(r"\blisting(?:\s*id|\s*#)?\s*(\d+)\b", t)
    if m:
        try:
            listing_id = int(m.group(1))
            from listings.models import Listing
            from assistant.tools import has_contact_info
            listing = Listing.objects.filter(id=listing_id, is_active=True).first()
            if listing:
                if has_contact_info(listing):
                    return listing_id
                else:
                    return None
            else:
                return None
        except Exception:
            pass

    # Recent recs: allow ordinal selection ("first", "second", or "1")
    recs = get_last_recommendations(conversation_id)
    if recs:
        m2 = re.search(r"\b(\d+)\b", t)
        if m2:
            idx = int(m2.group(1)) - 1
            if 0 <= idx < len(recs):
                return recs[idx]
        m3 = re.search(r"(\d+)\s*\+\s*1", t)
        if m3:
            try:
                beds = int(m3.group(1))
                from listings.models import Listing
                cand = (
                    Listing.objects.filter(id__in=recs, is_active=True)
                    .filter(Q(structured_data__bedrooms=beds) | Q(raw_text__icontains=f"{beds}+1"))
                    .first()
                )
                if cand:
                    return int(cand.id)
            except Exception:
                pass
        return recs[0]

    # Database search fallback by keywords
    bedroom_match = re.search(r"(\d+)\s*\+\s*1", t)
    location_keywords = ["girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta"]
    bedrooms = int(bedroom_match.group(1)) if bedroom_match else None
    location = next((kw for kw in location_keywords if kw in t), None)

    from listings.models import Listing
    from assistant.tools import has_contact_info
    query = Q(is_active=True)
    if bedrooms:
        query &= Q(structured_data__bedrooms=bedrooms)
    if location:
        query &= (Q(location__icontains=location) | Q(structured_data__location__icontains=location))
    matching_listings = Listing.objects.filter(query).order_by("-last_seen_at")[:10]
    for listing in matching_listings:
        if has_contact_info(listing):
            return listing.id
    return None


def build_recommendation_card(listing_id: int) -> List[Dict[str, Any]]:
    try:
        from listings.models import Listing
        from assistant.utils.url_utils import normalize_image_list
        with create_tool_span("db_search", "query", request_id=str(listing_id)):
            listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        
        # Get images directly from structured_data (same as notification system)
        raw_images = sd.get('image_urls', [])
        verified_with_photos = sd.get('verified_with_photos', False)
        
        logger.critical(f"DEBUG build_recommendation_card for listing {listing_id}:")
        logger.critical(f"  structured_data: {sd}")
        logger.critical(f"  raw_images: {raw_images}")
        logger.critical(f"  verified_with_photos: {verified_with_photos}")
        
        # Ensure API prefix for relative paths
        images = []
        for img in raw_images:
            if img.startswith('/listings/'):
                images.append(f'/api{img}')
            else:
                images.append(img)
        images = normalize_image_list(images)
        
        logger.critical(f"  final_images: {images}")
        
        card = [{
            "id": listing.id,
            "title": sd.get("title", f"Property {listing_id}"),
            "price": sd.get("price", "Price on request"),
            "location": sd.get("location", listing.location or "North Cyprus"),
            "images": images[:5],
            "description": sd.get("description", "Updated with new photos"),
            "features": sd.get("features", []),
            "verified_with_photos": verified_with_photos,  # Use actual value from DB
            "auto_display": True,
        }]
        
        logger.critical(f"  final_card: {card}")
        return card
    except Exception as e:
        logger.error(f"Error building card for {listing_id}: {e}")
        return []


def parse_and_correct_intent(
    user_text: str, conversation_id: str, language: str, pending_actions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Robust intent parsing that combines LLM classification with heuristic overrides.
    This is the definitive intent parser for the LangGraph agent.
    """
    from assistant.brain.chains import intent_chain, run_chain
    from assistant.brain.memory import generate_history_summary as mem_generate_history_summary
    from assistant.brain.heuristics import (
        looks_like_property_search,
        looks_like_agent_outreach,
        looks_like_status_update,
        user_asked_for_photos,
        looks_like_show_options_followup,
    )

    # 1. Get initial classification from LLM
    try:
        pending_json = json.dumps(pending_actions, default=str)
        intent_raw = run_chain(
            intent_chain(),
            message=user_text,
            history_json=mem_generate_history_summary(conversation_id),
            language=language,
            pending_actions_json=pending_json,
        )
        intent = json.loads(intent_raw) if isinstance(intent_raw, str) else (intent_raw or {})
    except Exception as e:
        logger.warning(f"intent_chain failed: {e}")
        intent = {}

    # 2. Apply heuristic corrections and overrides
    ut = (user_text or "").lower()
    # Normalize type and confidence
    itype = str(intent.get("intent_type") or "").lower()
    confidence = float(intent.get("confidence") or 0.0)
    # Treat generic/chatty labels as weak: general_chat, conversation_continuation, follow_up
    is_generic_like = itype in {"general_chat", "conversation_continuation", "follow_up"}

    # If confidence is low or intent is generic, heuristics can override.
    if confidence < 0.85 or is_generic_like:
        if looks_like_agent_outreach(ut):
            return {"intent_type": "agent_outreach", "confidence": 0.95, "needs_tool": True, "tool_name": "initiate_contact_with_seller"}
        if looks_like_status_update(ut) or user_asked_for_photos(ut):
            return {"intent_type": "status_update", "confidence": 0.95, "needs_tool": False}
        if looks_like_property_search(ut):
            return {"intent_type": "property_search", "confidence": 0.95, "needs_tool": True, "tool_name": "search_internal_listings"}
        # Check for follow-up after a search (use DB to avoid circular import)
        if looks_like_show_options_followup(ut):
            try:
                if conversation_id:
                    from assistant.models import Message
                    last_assistant = (
                        Message.objects.filter(conversation_id=conversation_id, type='assistant')
                        .order_by('-created_at')
                        .first()
                    )
                    if last_assistant and 'property' in (last_assistant.content or '').lower():
                        return {"intent_type": "property_search", "confidence": 0.9, "needs_tool": True, "tool_name": "search_internal_listings"}
            except Exception:
                # If we can't inspect DB, default to property_search for these phrases
                return {"intent_type": "property_search", "confidence": 0.9, "needs_tool": True, "tool_name": "search_internal_listings"}

    # 2b. Aggressive override for property requests even if LLM is confident
    if looks_like_property_search(ut) and (confidence < 0.95 or is_generic_like):
        logger.info("[intent] override→property_search (strong property heuristic)")
        return {
            "intent_type": "property_search",
            "confidence": 0.95,
            "needs_tool": True,
            "tool_name": "search_internal_listings",
            "reason": "heuristic_property_keywords",
        }

    # Photos within a property request should route to search (then outreach downstream)
    if user_asked_for_photos(ut) and looks_like_property_search(ut):
        logger.info("[intent] override→property_search (photos in property context)")
        return {
            "intent_type": "property_search",
            "confidence": 0.9,
            "needs_tool": True,
            "tool_name": "search_internal_listings",
            "action": "request_photos",
            "reason": "heuristic_photos_in_property",
        }

    # 3. Return the original intent if no heuristic override was triggered
    logger.info(
        f"[intent] final user='{user_text[:60]}', llm='{itype}', conf={confidence:.2f}, returned='{intent.get('intent_type')}'"
    )
    return intent if intent.get("intent_type") else {"intent_type": "general_chat", "confidence": 0.4}


def check_pre_model_guardrails(user_text: str) -> Tuple[bool, str]:
    """
    Fast, low-cost guardrail to block clearly out-of-scope, abusive, or injection attempts
    BEFORE invoking expensive LLM routing. Returns (allowed, reason_if_blocked).
    """
    if not user_text or not user_text.strip():
        return False, "empty_input"

    text = user_text.lower()

    # Basic abuse/toxicity keywords (minimal viable set; expand with a classifier later)
    abusive_keywords = [
        'kill', 'suicide', 'hate speech', 'racial slur', 'terrorism', 'bomb',
    ]
    if any(k in text for k in abusive_keywords):
        return False, "abusive_or_harmful"

    # Dangerous or non-business topics (political persuasion, medical/financial advice)
    disallowed_topics = [
        'vote for', 'election', 'tax evasion', 'insider trading', 'diagnose me',
        'prescribe', 'financial advice', 'investment advice', 'political campaign'
    ]
    if any(k in text for k in disallowed_topics):
        return False, "out_of_scope_topic"

    # Prompt injection heuristics
    injection_patterns = [
        r"ignore (all|previous) instructions",
        r"disregard (all|previous) rules",
        r"act as (.+) and (.+)",
        r"you are now (.+) system",
    ]
    for pat in injection_patterns:
        if re.search(pat, text):
            return False, "prompt_injection_detected"

    # Extremely long inputs (protect cost); threshold can be tuned
    if len(user_text) > 8000:
        return False, "input_too_long"

    return True, "ok"
