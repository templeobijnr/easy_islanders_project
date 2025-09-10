from __future__ import annotations

"""
Utilities used by the LangGraph agent for listing/context resolution.

Pulled from legacy agent to avoid importing the sequential orchestrator.
"""

from typing import Any, Dict, List, Optional
import logging
import json

from django.db.models import Q

logger = logging.getLogger(__name__)


def get_last_recommendations(conversation_id: Optional[str]) -> List[int]:
    if not conversation_id:
        return []
    try:
        from assistant.models import Message
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


def get_last_contacted_listing(conversation_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not conversation_id:
        return None
    try:
        from assistant.models import Message
        messages = (
            Message.objects.filter(conversation__conversation_id=conversation_id, role="assistant")
            .order_by("-created_at")
        )
        for msg in messages:
            if (
                msg.message_context
                and msg.message_context.get("intent_type") == "agent_outreach"
                and msg.message_context.get("contacted_listing")
            ):
                out = {
                    "listing_id": msg.message_context.get("contacted_listing"),
                    "outreach_ok": msg.message_context.get("outreach_ok", False),
                    "contacted_at": msg.created_at.isoformat(),
                    "message": msg.content,
                }
                try:
                    pacts = msg.message_context.get("pending_actions") or []
                    for a in pacts:
                        if a.get("type") == "outreach_pictures":
                            ctx = a.get("context") or {}
                            if ctx.get("baseline_image_count") is not None:
                                out["baseline_image_count"] = int(ctx.get("baseline_image_count") or 0)
                                break
                except Exception:
                    pass
                return out
    except Exception:
        return None
    return None


def check_for_new_images(listing_id: int, outreach_timestamp: Optional[str] = None) -> Dict[str, Any]:
    try:
        from assistant.models import Listing
        from django.utils import timezone
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        current_images = sd.get("image_urls", [])
        current_count = len(current_images)
        last_update_str = sd.get("last_photo_update")
        last_update = None
        try:
            last_update = timezone.datetime.fromisoformat(last_update_str) if last_update_str else None
            logger.debug(f"check_images {listing_id}: last_update={last_update}")
        except Exception as e:
            logger.warning(f"Invalid last_photo_update for {listing_id}: {e}")
            last_update = None
        
        has_new = current_count > 0
        if outreach_timestamp:
            try:
                outreach_dt = timezone.datetime.fromisoformat(outreach_timestamp) if outreach_timestamp else timezone.now()
                logger.debug(f"check_images {listing_id}: outreach_dt={outreach_dt}")
                if last_update is None or last_update <= outreach_dt:
                    has_new = False
                    logger.debug(f"check_images {listing_id}: no new images (last_update <= outreach_dt or missing)")
                else:
                    logger.debug(f"check_images {listing_id}: new images detected")
            except Exception as e:
                logger.warning(f"Invalid outreach_timestamp for {listing_id}: {e}")
                has_new = False
        
        media_entries = sd.get("media", [])
        recent_media = [entry for entry in media_entries if entry.get("type") == "photo" and entry.get("added_at")]
        return {
            "has_new_images": has_new,
            "image_count": current_count,
            "image_urls": current_images,
            "recent_media": recent_media,
            "last_photo_update": last_update_str,
            "verified_with_photos": sd.get("verified_with_photos", False),
        }
    except Exception as e:
        logger.exception(f"Failed to check images for listing {listing_id}")
        return {"has_new_images": False, "image_count": 0, "image_urls": [], "error": str(e)}


def resolve_listing_reference(text: str, conversation_id: Optional[str]) -> Optional[int]:
    import re
    t = (text or "").lower()

    # Direct pattern: "listing <id>"
    m = re.search(r"\blisting\s*(\d+)\b", t)
    if m:
        try:
            listing_id = int(m.group(1))
            from assistant.models import Listing
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
                from assistant.models import Listing
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

    from assistant.models import Listing
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
        from assistant.models import Listing
        from assistant.utils.url_utils import normalize_image_list
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        image_status = check_for_new_images(listing_id)
        raw_images = image_status.get("image_urls", [])
        # Ensure API prefix for relative paths
        images = []
        for img in raw_images:
            if img.startswith('/listings/'):
                images.append(f'/api{img}')
            else:
                images.append(img)
        images = normalize_image_list(images)
        return [
            {
                "id": listing.id,
                "title": sd.get("title", f"Property {listing_id}"),
                "price": sd.get("price", "Price on request"),
                "location": sd.get("location", listing.location or "North Cyprus"),
                "images": images[:5],
                "description": sd.get("description", "Updated with new photos"),
                "features": sd.get("features", []),
                "verified_with_photos": True,
                "auto_display": True,
            }
        ]
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
                        Message.objects.filter(conversation__conversation_id=conversation_id, role='assistant')
                        .order_by('-created_at')
                        .first()
                    )
                    if last_assistant and last_assistant.message_context and last_assistant.message_context.get('intent_type') == 'property_search':
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
