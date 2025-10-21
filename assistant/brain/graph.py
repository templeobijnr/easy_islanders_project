"""
LangGraph-compatible stateful agent scaffold for Easy Islanders.

Notes:
- This runs alongside the existing agent (assistant/brain/agent.py).
- It can operate without the langgraph package installed by using a sequential
  orchestrator. When LangGraph is installed, you can replace the orchestrator
  with a compiled graph without changing the public API.

Public API:
- run_message(conversation_id: str, text: str) -> dict
- run_event(conversation_id: str, event_name: str, **payload) -> dict

Both return a response dict compatible with the existing chat endpoint:
{"message": str, "language": str, "recommendations": list}
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import json
import logging

from django.core.cache import cache
from django.utils import timezone

from .config import ENABLE_LANGGRAPH, ENABLE_KNOWLEDGE_NODE, ENABLE_SERVICE_NODE
from .chains import intent_chain, requirements_chain, fallback_chain, language_chain, run_chain
from .schemas import Requirements
from .memory import generate_history_summary as mem_generate_history_summary, save_assistant_turn as mem_save_assistant_turn, extract_pending_actions as mem_extract_pending_actions
from .heuristics import (
    looks_like_property_search,
    looks_like_agent_outreach,
    looks_like_status_update,
    user_asked_for_photos,
    looks_like_show_options_followup,
)
from .agent_utils import (
    resolve_listing_reference,
    get_last_contacted_listing,
    build_recommendation_card,
    parse_and_correct_intent,
)
from ..tools import (
    search_internal_listings,
    initiate_contact_with_seller,
    search_services,
    get_knowledge,
    check_for_new_images,
)

logger = logging.getLogger(__name__)

# Try to import LangGraph; if not available, we'll use the sequential orchestrator
try:
    from langgraph.graph import StateGraph, END
    _HAS_LANGGRAPH = True
except Exception:
    _HAS_LANGGRAPH = False


STATE_CACHE_KEY = "graph:conv:{conv_id}"
_LOCAL_STATE_CACHE: Dict[str, Any] = {}


def _load_state(conversation_id: str) -> Dict[str, Any]:
    try:
        raw = cache.get(STATE_CACHE_KEY.format(conv_id=conversation_id))
    except Exception:
        raw = _LOCAL_STATE_CACHE.get(conversation_id)
    if not raw:
        return {
            "conversation_id": conversation_id,
            "language": "en",
            "last_intent": None,
            "last_intent_confidence": None,
            "last_recommendations": [],
            "pending_actions": [],
            "listing_ctx": {"last_listing_id": None, "image_count": 0, "verified_with_photos": False},
            "errors": [],
        }
    try:
        return json.loads(raw)
    except Exception:
        return raw if isinstance(raw, dict) else {}


def _save_state(conversation_id: str, state: Dict[str, Any]) -> None:
    try:
        cache.set(STATE_CACHE_KEY.format(conv_id=conversation_id), json.dumps(state), timeout=24 * 3600)
    except Exception:
        # Fallback to local in-process cache to avoid 500s
        _LOCAL_STATE_CACHE[conversation_id] = state


def _parse_intent(user_text: str, conversation_id: str, language: str, pending_actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Wrapper that calls the robust, centralized intent parser."""
    return parse_and_correct_intent(user_text, conversation_id, language, pending_actions)


def _check_pending(conversation_id: str, state: Dict[str, Any]) -> Dict[str, Any]:
    pending = mem_extract_pending_actions(conversation_id)
    state["pending_actions"] = pending or []
    return state


def _do_property_search(user_text: str, language: str, conversation_id: str, intent_action: Optional[str] = None) -> Dict[str, Any]:
    # Extract requirements
    req_json = run_chain(requirements_chain(), message=user_text, language=language)
    try:
        req_data = json.loads(req_json) if isinstance(req_json, str) else req_json
    except Exception:
        req_data = {}
    try:
        req = Requirements(**{**(req_data or {}), "raw_query": user_text})
    except Exception:
        req = Requirements(raw_query=user_text)

    attrs: Dict[str, Any] = {}
    # If we didn't extract any useful requirements, reuse last_requirements from cached state
    def _has_constraints(r: Requirements) -> bool:
        return any([
            r.bedrooms not in (None, "any"),
            r.min_price is not None,
            r.max_price is not None,
            bool(r.location),
            bool(r.features),
            r.furnished is not None,
            r.pets_allowed is not None,
        ])

    if req and not _has_constraints(req):
        try:
            st = _load_state(conversation_id)
            lr = st.get("last_requirements")
            if isinstance(lr, dict) and lr:
                # Merge previous constraints into attrs
                if lr.get("bedrooms") not in (None, "any"):
                    attrs["beds"] = lr.get("bedrooms")
                if lr.get("max_price") is not None:
                    attrs["max_price"] = lr.get("max_price")
                if lr.get("min_price") is not None:
                    attrs["min_price"] = lr.get("min_price")
                if lr.get("features"):
                    attrs["features"] = lr.get("features")
                if lr.get("furnished") is not None:
                    attrs["furnished"] = lr.get("furnished")
                if lr.get("pets_allowed") is not None:
                    attrs["pets_allowed"] = lr.get("pets_allowed")
                if lr.get("duration"):
                    attrs["duration"] = lr.get("duration")
                # Prefer prev location if user didn't provide a new one
                if not req.location and lr.get("location"):
                    req.location = lr.get("location")
        except Exception:
            pass

    if req:
        if req.bedrooms not in (None, "any"):
            attrs["beds"] = req.bedrooms
        if req.max_price is not None:
            attrs["max_price"] = req.max_price
        if req.min_price is not None:
            attrs["min_price"] = req.min_price

    location = req.location
    search_result = search_internal_listings(
        listing_type="property_rent",
        location=location,
        attributes=attrs,
        language=language,
    )
    cards = search_result.get("data", []) if isinstance(search_result, dict) else []
    if cards:
        msg = f"I found {len(cards)} properties for you."
    else:
        msg = "I couldn't find any properties matching your request right now. Would you like me to broaden the search?"

    # If user explicitly asked for photos (intent_action == request_photos),
    # proactively contact agent for the first listing that has no photos yet.
    pending_actions_ctx: List[Dict[str, Any]] = []
    if intent_action == "request_photos" and cards:
        try:
            target = None
            for c in cards:
                imgs = c.get("images") or []
                if not imgs:
                    target = c
                    break
            if target is None:
                # If all have images, pick the first for safety (no outreach needed)
                target = None
            if target is not None and target.get("id") is not None:
                tid = int(target.get("id"))
                tool_res = initiate_contact_with_seller(listing_id=tid, language=language, conversation_id=conversation_id)
                if isinstance(tool_res, dict) and tool_res.get("ok"):
                    ts = timezone.now().isoformat()
                    pending_actions_ctx.append({
                        "type": "outreach_pictures",
                        "listing_id": tid,
                        "status": "waiting",
                        "timestamp": ts,
                    })
                    title = target.get("title") or f"listing {tid}"
                    msg = f"I found {len(cards)} properties for you. No photos available yet for {title}. I've contacted the agent to request them and will update you when they arrive."
        except Exception:
            pass

    rec_ids = [int(c.get("id")) for c in cards if c.get("id") is not None]
    # Persist turn via memory utils with last_recommendations for downstream ordinal resolution
    mem_save_assistant_turn(
        conversation_id,
        user_text,
        msg,
        message_context={
            "intent_type": "property_search",
            "last_recommendations": rec_ids,
            **({"pending_actions": pending_actions_ctx} if pending_actions_ctx else {}),
        },
    )
    # Save last_requirements to state cache for future follow-ups
    try:
        st = _load_state(conversation_id)
        st["last_requirements"] = {
            "property_type": req.property_type,
            "purpose": req.purpose,
            "location": req.location,
            "bedrooms": req.bedrooms,
            "bathrooms": req.bathrooms,
            "min_price": req.min_price,
            "max_price": req.max_price,
            "currency": req.currency,
            "furnished": req.furnished,
            "pets_allowed": req.pets_allowed,
            "duration": req.duration,
            "features": req.features,
        }
        _save_state(conversation_id, st)
    except Exception:
        pass
    return {"message": msg, "language": language, "recommendations": cards, "last_recommendations": rec_ids}


def _do_outreach(user_text: str, language: str, conversation_id: str) -> Dict[str, Any]:
    listing_id = resolve_listing_reference(user_text, conversation_id)
    if not listing_id:
        msg = "I couldn't resolve which listing to contact. Please specify the listing number or say 'contact the first/second one'."
        mem_save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "agent_outreach_unresolved"})
        return {"message": msg, "language": language, "recommendations": []}

    tool_result = initiate_contact_with_seller(
        listing_id=int(listing_id),
        language=language,
        conversation_id=conversation_id,
    )
    response_msg = tool_result.get("data", "Action completed.")
    if tool_result.get("ok"):
        # Capture baseline image count to avoid false "new photos" later
        baseline_status = check_for_new_images(int(listing_id))
        baseline_count = int(baseline_status.get("image_count") or 0)
        timestamp_str = timezone.now().isoformat()
        pending_action = {"type": "outreach_pictures", "listing_id": int(listing_id), "status": "waiting", "timestamp": timestamp_str, "context": {"baseline_image_count": baseline_count}}
        pending_availability = {"type": "outreach_availability", "listing_id": int(listing_id), "status": "waiting", "timestamp": timestamp_str}
        message_context = {
            "intent_type": "agent_outreach",
            "tool_used": "initiate_contact_with_seller",
            "pending_actions": [pending_action, pending_availability],
            "contacted_listing": int(listing_id),
            "outreach_ok": True,
        }
        response_msg = f"OK, I've contacted the agent for listing {listing_id}. I'll let you know when they reply."
    else:
        message_context = {
            "intent_type": "agent_outreach",
            "tool_used": "initiate_contact_with_seller",
            "contacted_listing": int(listing_id),
            "outreach_ok": False,
            "outreach_reason": tool_result.get("reason"),
        }

    mem_save_assistant_turn(conversation_id, user_text, response_msg, message_context)
    return {"message": response_msg, "language": language, "recommendations": []}


def _do_status_update(user_text: str, language: str, conversation_id: str) -> Dict[str, Any]:
    last_contact = get_last_contacted_listing(conversation_id)
    logger.critical(f"DEBUG _do_status_update: last_contact={last_contact}")
    if last_contact:
        listing_id = last_contact["listing_id"]
        outreach_ts = last_contact.get("contacted_at")
        logger.critical(f"DEBUG _do_status_update: Using listing_id={listing_id}, outreach_ts={outreach_ts}")
        if not outreach_ts:
            try:
                state = _load_state(conversation_id)
                pacts = state.get("pending_actions", [])
                for a in pacts:
                    if a.get("listing_id") == listing_id and a.get("timestamp"):
                        outreach_ts = a.get("timestamp")
                        break
            except Exception:
                pass
        logger.debug(f"status_update {conversation_id}: listing={listing_id}, outreach_ts={outreach_ts}")

        # Ensure outreach_ts is not None before calling the tool
        if not outreach_ts:
            response_msg = "I'm having trouble recalling when we contacted the agent. Could you please try asking to contact them again?"
            mem_save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "status_update", "error": "missing_timestamp"})
            return {"message": response_msg, "language": language, "recommendations": []}

        image_status = check_for_new_images(listing_id, outreach_timestamp=outreach_ts)
        logger.debug(f"status_update {conversation_id}: image_status={image_status}")

        # Check for success in the tool result
        if not image_status.get("success"):
            response_msg = "I'm having a bit of trouble checking for updates right now, but I'll keep monitoring the situation."
            mem_save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "status_update", "error": "tool_failure"})
            return {"message": response_msg, "language": language, "recommendations": []}

        current_count = int(image_status.get("image_count") or 0)
        # Try to get baseline from last outreach message context
        try:
            from .agent_utils import get_last_contacted_listing as _get_last_ctx
            last_ctx = _get_last_ctx(conversation_id)
            baseline = 0
            if last_ctx and last_ctx.get("baseline_image_count") is not None:
                baseline = int(last_ctx.get("baseline_image_count") or 0)
        except Exception:
            baseline = 0
        logger.info(f"Status update check for {conversation_id}: listing={listing_id}, baseline={baseline}, current_count={current_count}, image_status={image_status}, last_ctx={last_ctx}")

        has_new_images = image_status.get("has_new_images", False)

        if has_new_images:
            # Build normalized recommendation card
            recs = build_recommendation_card(listing_id)
            delta = current_count - baseline
            response_msg = f"Great news! The agent for listing {listing_id} has sent {delta} new photo(s)."
            mem_save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "status_update", "images_received": True, "listing_id": listing_id})
            return {"message": response_msg, "language": language, "recommendations": recs}
        else:
            response_msg = f"I haven't received a response yet, but I'll keep an eye out and let you know as soon as I hear back!"
            mem_save_assistant_turn(conversation_id, user_text, response_msg, message_context={"intent_type": "status_update", "images_received": False, "listing_id": listing_id})
            return {"message": response_msg, "language": language, "recommendations": []}
    else:
        msg = "I don't see any recent agent contacts. Would you like me to contact an agent for a property you're interested in?"
        mem_save_assistant_turn(conversation_id, user_text, msg, message_context={"intent_type": "status_update_no_pending"})
        return {"message": msg, "language": language, "recommendations": []}


def _do_fallback(user_text: str, conversation_id: str, language: str) -> Dict[str, Any]:
    ut = (user_text or "").lower()
    # Safeguard: if heuristics clearly indicate a property or outreach/status query, redirect instead of generic text
    if looks_like_property_search(ut):
        out = _do_property_search(user_text, language, conversation_id)
        return out
    if looks_like_agent_outreach(ut):
        out = _do_outreach(user_text, language, conversation_id)
        return out
    if looks_like_status_update(ut) or user_asked_for_photos(ut):
        out = _do_status_update(user_text, language, conversation_id)
        return out

    try:
        reply = run_chain(fallback_chain(), message=user_text, history_json=mem_generate_history_summary(conversation_id))
    except Exception:
        reply = "I'm here to help. Could you clarify your request?"
    mem_save_assistant_turn(conversation_id, user_text, reply, message_context={"intent_type": "general_chat_fallback"})
    return {"message": reply, "language": language, "recommendations": []}


def _do_conversation_continuation(user_text: str, conversation_id: str, language: str) -> Dict[str, Any]:
    """Continue the conversation coherently using recent history; no tools."""
    try:
        reply = run_chain(
            fallback_chain(),
            message=user_text,
            history_json=mem_generate_history_summary(conversation_id),
        )
    except Exception:
        reply = "Let's continue. Could you share a bit more so I can help?"
    mem_save_assistant_turn(
        conversation_id,
        user_text,
        reply,
        message_context={"intent_type": "conversation_continuation"},
    )
    return {"message": reply, "language": language, "recommendations": []}


def _do_knowledge_query(user_text: str, conversation_id: str, language: str) -> Dict[str, Any]:
    """Answer curated knowledge questions from internal KB."""
    try:
        result = get_knowledge(topic=user_text, language=language)
        # Compose a concise reply based on KB result
        if isinstance(result, dict) and result.get("success") and result.get("data"):
            items = result.get("data")
            # Pick the first 1-2 items for brevity
            title_parts = []
            for it in items[:2]:
                title = it.get("title") or it.get("name")
                if title:
                    title_parts.append(str(title))
            if title_parts:
                reply = f"Here’s what I found: {', '.join(title_parts)}."
            else:
                reply = "I found some relevant information."
        else:
            reply = "I don't have enough curated information on that yet."
    except Exception:
        result = {"success": False, "data": []}
        reply = "I don't have enough curated information on that yet."

    mem_save_assistant_turn(
        conversation_id,
        user_text,
        reply,
        message_context={"intent_type": "knowledge_query"},
    )
    return {"message": reply, "language": language, "recommendations": []}


def _do_service_search(user_text: str, conversation_id: str, language: str) -> Dict[str, Any]:
    """Search vetted service providers. Category is inferred naively from text for now."""
    # Simple keyword → category mapping (can be expanded later)
    t = (user_text or "").lower()
    if any(k in t for k in ("lawyer", "legal", "attorney")):
        category = "legal"
    elif any(k in t for k in ("doctor", "medical", "clinic", "hospital")):
        category = "medical"
    elif any(k in t for k in ("car", "rental car", "rent a car")):
        category = "car_rental"
    elif any(k in t for k in ("restaurant", "dining", "food")):
        category = "dining"
    else:
        # Default to accommodation-adjacent services
        category = "accommodation"

    try:
        res = search_services(category=category, language=language)
        cards = res.get("data") if isinstance(res, dict) else []
        if cards:
            msg = f"I found {len(cards)} providers."
        else:
            msg = "I couldn't find providers that match right now."
    except Exception:
        cards = []
        msg = "I'm having trouble searching providers at the moment."

    mem_save_assistant_turn(
        conversation_id,
        user_text,
        msg,
        message_context={"intent_type": "service_search", "service_category": category},
    )
    return {"message": msg, "language": language, "recommendations": cards or []}

def _run_message_sequential(text: str, conversation_id: str) -> Dict[str, Any]:
    """Sequential orchestrator fallback (no graph)."""
    state = _load_state(conversation_id)
    try:
        lang = run_chain(language_chain(), message=text) or state.get("language") or "en"
    except Exception:
        lang = state.get("language") or "en"
    state["language"] = lang
    state = _check_pending(conversation_id, state)
    intent = _parse_intent(text, conversation_id, lang, state.get("pending_actions", []))
    state["last_intent"] = intent.get("intent_type")
    state["last_intent_confidence"] = intent.get("confidence")
    itype = intent.get("intent_type") or "general_chat"
    if itype == "property_search":
        out = _do_property_search(text, lang, conversation_id)
        state["last_recommendations"] = out.get("last_recommendations", [])
    elif itype == "agent_outreach":
        out = _do_outreach(text, lang, conversation_id)
    elif itype == "status_update":
        out = _do_status_update(text, lang, conversation_id)
    elif itype in ("conversation_continuation", "follow_up"):
        out = _do_conversation_continuation(text, conversation_id, lang)
    elif itype == "knowledge_query":
        out = _do_knowledge_query(text, conversation_id, lang)
    elif itype == "service_search":
        out = _do_service_search(text, conversation_id, lang)
    else:
        out = _do_fallback(text, conversation_id, lang)
    _save_state(conversation_id, state)
    return {"message": out.get("message", ""), "language": out.get("language", lang), "recommendations": out.get("recommendations", [])}


def run_message(text: str, conversation_id: str) -> Dict[str, Any]:
    """Entry point for /api/chat when LangGraph is enabled (or as a drop-in orchestrator)."""
    if _HAS_LANGGRAPH:
        return _run_message_with_graph(text, conversation_id)
    # Sequential orchestrator fallback
    return _run_message_sequential(text, conversation_id)


def _build_langgraph():
    """Compile a minimal LangGraph if the package is installed."""
    if not _HAS_LANGGRAPH:
        return None

    def node_parse_intent(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        prev_intent = state.get("last_intent")
        try:
            lang = run_chain(language_chain(), message=text) or state.get("language") or "en"
        except Exception:
            lang = state.get("language") or "en"
        state["language"] = lang
        # refresh pending first
        state.update(_check_pending(conv, state))
        intent = _parse_intent(text, conv, lang, state.get("pending_actions", []))
        it = intent.get("intent_type")
        # If LLM fell back to general_chat but user is saying 'show options' and prev was property_search, force property_search
        if (not it or it == "general_chat") and looks_like_show_options_followup(text) and (prev_intent == "property_search"):
            it = "property_search"
        state["last_intent"] = it
        state["last_intent_confidence"] = intent.get("confidence")
        state["last_action"] = intent.get("action")
        return state

    def node_property_search(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_property_search(text, lang, conv, intent_action=state.get("last_action"))
        # Persist last requirements in state if we saved any to cache
        try:
            cached = _load_state(conv)
            if cached.get("last_requirements") is not None:
                state["last_requirements"] = cached.get("last_requirements")
        except Exception:
            pass
        state["out"] = out
        state["last_recommendations"] = out.get("last_recommendations", [])
        return state

    def node_outreach(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_outreach(text, lang, conv)
        state["out"] = out
        return state

    def node_status(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_status_update(text, lang, conv)
        state["out"] = out
        return state

    def node_fallback(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_fallback(text, conv, lang)
        state["out"] = out
        return state

    def node_continuation(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_conversation_continuation(text, conv, lang)
        state["out"] = out
        return state

    def node_knowledge(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_knowledge_query(text, conv, lang)
        state["out"] = out
        return state

    def node_service_search(state: Dict[str, Any]) -> Dict[str, Any]:
        text = state.get("user_text") or ""
        conv = state.get("conversation_id")
        lang = state.get("language") or "en"
        out = _do_service_search(text, conv, lang)
        state["out"] = out
        return state

    def route_after_parse(state: Dict[str, Any]) -> str:
        itype = (state.get("last_intent") or "").lower()
        if itype == "property_search":
            return "property_search"
        if itype == "agent_outreach":
            return "outreach"
        if itype == "status_update":
            return "status_update"
        if itype in ("conversation_continuation", "follow_up"):
            return "continuation"
        if itype == "knowledge_query":
            return "knowledge" if ENABLE_KNOWLEDGE_NODE else "fallback"
        if itype == "service_search":
            return "service_search" if ENABLE_SERVICE_NODE else "fallback"
        return "fallback"

    g = StateGraph(dict)
    g.add_node("parse_intent", node_parse_intent)
    g.add_node("property_search", node_property_search)
    g.add_node("outreach", node_outreach)
    g.add_node("status_update", node_status)
    g.add_node("fallback", node_fallback)
    g.add_node("continuation", node_continuation)
    if ENABLE_KNOWLEDGE_NODE:
        g.add_node("knowledge", node_knowledge)
    if ENABLE_SERVICE_NODE:
        g.add_node("service_search", node_service_search)
    g.set_entry_point("parse_intent")
    edge_map = {
        "property_search": "property_search",
        "outreach": "outreach",
        "status_update": "status_update",
        "continuation": "continuation",
        "fallback": "fallback",
    }
    if ENABLE_KNOWLEDGE_NODE:
        edge_map["knowledge"] = "knowledge"
    if ENABLE_SERVICE_NODE:
        edge_map["service_search"] = "service_search"
    g.add_conditional_edges("parse_intent", route_after_parse, edge_map)
    g.add_edge("property_search", END)
    g.add_edge("outreach", END)
    g.add_edge("status_update", END)
    g.add_edge("continuation", END)
    if ENABLE_KNOWLEDGE_NODE:
        g.add_edge("knowledge", END)
    if ENABLE_SERVICE_NODE:
        g.add_edge("service_search", END)
    g.add_edge("fallback", END)
    return g.compile()


_COMPILED_GRAPH = _build_langgraph() if _HAS_LANGGRAPH else None


def _run_message_with_graph(text: str, conversation_id: str) -> Dict[str, Any]:
    state = _load_state(conversation_id)
    state["conversation_id"] = conversation_id
    state["user_text"] = text
    try:
        result = _COMPILED_GRAPH.invoke(state)
    except Exception as e:
        logger.warning(f"LangGraph invoke failed, falling back to sequential: {e}")
        return _run_message_sequential(text, conversation_id)
    _save_state(conversation_id, result)
    out = result.get("out", {})
    lang = result.get("language") or out.get("language") or "en"
    return {"message": out.get("message", ""), "language": lang, "recommendations": out.get("recommendations", [])}


def run_event(conversation_id: str, event_name: str, **payload: Any) -> Dict[str, Any]:
    """Handle external events (e.g., media_received). Minimal state update for now."""
    state = _load_state(conversation_id)
    if event_name == "media_received":
        # Acknowledge in state so next status_update knows images likely exist
        listing_id = payload.get("listing_id")
        if listing_id:
            state.setdefault("listing_ctx", {})
            state["listing_ctx"]["last_listing_id"] = listing_id
            state["listing_ctx"]["image_count"] = int(payload.get("image_count") or 0)
            state["listing_ctx"]["verified_with_photos"] = bool(payload.get("verified_with_photos") or False)
    _save_state(conversation_id, state)
    return {"ok": True}


def _do_proactive_update(listing_id: int, conversation_id: str, image_count: int) -> Dict[str, Any]:
    """
    Generate automatic agent response when images are received.
    This function is called proactively without user input.
    """
    try:
        from .agent_utils import build_recommendation_card
        from .memory import save_assistant_turn as mem_save_assistant_turn
        from listings.models import Listing
        
        logger.info(f"Generating proactive update for listing {listing_id}, conversation {conversation_id}")
        
        # Get listing details for more personalized message
        try:
            listing = Listing.objects.get(id=listing_id)
            location = listing.location or "the property"
        except Listing.DoesNotExist:
            location = "the property"
        
        # Build recommendation card with new images
        recs = build_recommendation_card(listing_id)
        
        # Generate more natural and engaging proactive message
        if image_count == 1:
            response_msg = f"📸 Great news! The agent just sent a new photo for {location}. Check it out!"
        else:
            response_msg = f"📸 Awesome! I've received {image_count} new photos for {location}. Take a look!"
        
        # Add a call to action
        response_msg += " Would you like me to contact them for more details or show you similar properties?"
        
        # Save to conversation with proactive context
        mem_save_assistant_turn(
            conversation_id, 
            "",  # No user input for proactive response
            response_msg, 
            message_context={
                "intent_type": "proactive_update", 
                "listing_id": listing_id,
                "image_count": image_count,
                "proactive": True,
                "location": location
            }
        )
        
        logger.info(f"Proactive update generated for listing {listing_id}: {len(recs)} recommendations")
        
        return {
            "message": response_msg, 
            "language": "en",
            "recommendations": recs,
            "proactive": True
        }
        
    except Exception as e:
        logger.error(f"Error generating proactive update for listing {listing_id}: {e}")
        return {
            "message": f"I've received new photos for listing {listing_id}, but I'm having trouble displaying them right now. Please try asking me about this property again.",
            "language": "en", 
            "recommendations": [],
            "proactive": True,
            "error": str(e)
        }
