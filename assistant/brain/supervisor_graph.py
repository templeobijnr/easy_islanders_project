"""
LangGraph supervisor topology and worker handlers.

This module wires the CentralSupervisor into a LangGraph `StateGraph`, registers
worker nodes for each domain agent, and documents the routing rules used by the
hierarchical multi-agent system.  Handlers focus on fast acknowledgement of the
user request—heavy lifting is delegated to downstream tools or flows.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from django.conf import settings
import logging
import os
import time
from typing import Dict, Any, List

from assistant.memory import read_enabled
from assistant.brain.config import PREFS_APPLY_ENABLED
from assistant.services.preferences import PreferenceService
from assistant.memory.service import fetch_thread_context
from django.core.cache import cache

from .supervisor import CentralSupervisor
from .supervisor_schemas import SupervisorState
from .tools_local import (
    get_on_duty_pharmacies,
    find_places,
    web_search,
    normalize_city,
    geocode,
    overpass_pharmacies_near_city,
)
from .observability import traced_supervisor_node, traced_worker_agent
from .registry import get_registry_client
from .zep_client import ZepClient

logger = logging.getLogger(__name__)

_SUPERVISOR_MEMORY = MemorySaver()
_COMPILED_SUPERVISOR_GRAPH = None

try:
    _ZEP_CLIENT = ZepClient(base_url=os.getenv("ZEP_URL"), api_key=os.getenv("ZEP_API_KEY"))
    logger.info("[ZEP] Client initialized (base=%s)", _ZEP_CLIENT.base_url)
except Exception as _zep_init_error:  # noqa: BLE001
    logger.warning("[ZEP] Client initialization failed: %s", _zep_init_error)
    _ZEP_CLIENT = None

STICKY_TTL_SECONDS = 180  # seconds
FOLLOWUP_PREFIXES = ("show me", "show us", "show the", "details", "detail")
FOLLOWUP_EXACT = {
    "show",
    "show me",
    "more",
    "next",
    "next please",
    "another",
    "show more",
    "more please",
    "show more options",
}


def _is_followup_utterance(text: str) -> bool:
    """Lightweight detection for deictic follow-ups like 'show me' or 'more'."""
    if not text:
        return False
    normalized = text.strip().lower()
    if normalized in FOLLOWUP_EXACT:
        return True
    return any(normalized.startswith(prefix) for prefix in FOLLOWUP_PREFIXES)


def _extract_assistant_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        for key in ("message", "text", "content"):
            value = content.get(key)
            if value:
                return str(value)
        return str(content)
    return str(content)


def _zep_store_memory(thread_id: str | None, role: str, content: str) -> None:
    if not thread_id or not content or _ZEP_CLIENT is None:
        return
    try:
        _ZEP_CLIENT.add_memory(thread_id, role, content)
    except Exception as exc:  # noqa: BLE001
        logger.debug("[ZEP] add_memory raised: %s", exc)


def _inject_zep_context(state: SupervisorState) -> SupervisorState:
    if _ZEP_CLIENT is None:
        return state
    thread_id = state.get("thread_id")
    user_text = state.get("user_input")
    if not thread_id or not user_text:
        return state
    try:
        snippets = _ZEP_CLIENT.query_memory(thread_id, user_text)
    except Exception as exc:  # noqa: BLE001
        logger.debug("[ZEP] query_memory raised: %s", exc)
        return state
    if not snippets:
        return {**state, "retrieved_context": ""}
    joined = "\n".join(snippets)
    logger.info("[ZEP] Retrieved %d memories for %s", len(snippets), thread_id)
    return {**state, "retrieved_context": joined}


def _append_turn_history(state: SupervisorState, assistant_output: Any) -> SupervisorState:
    history: List[Dict[str, str]] = list(state.get("history") or [])
    user_text = state.get("user_input")
    appended_user = False
    if user_text:
        if not history or history[-1].get("role") != "user" or history[-1].get("content") != user_text:
            history.append({"role": "user", "content": str(user_text)})
            appended_user = True

    assistant_text = _extract_assistant_text(assistant_output).strip()
    appended_assistant = False
    if assistant_text:
        if not history or history[-1].get("role") != "assistant" or history[-1].get("content") != assistant_text:
            history.append({"role": "assistant", "content": assistant_text})
            appended_assistant = True

    if history == state.get("history"):
        return state

    updated_state = {**state, "history": history}
    thread = state.get("thread_id")
    if thread:
        try:
            logger.info("[%s] Stored turn: user='%s' | assistant='%s'", thread, (user_text or "")[:40], assistant_text[:40])
        except Exception:
            pass
        if appended_user and user_text:
            _zep_store_memory(thread, "user", str(user_text))
        if appended_assistant and assistant_text:
            _zep_store_memory(thread, "assistant", assistant_text)
    return updated_state


def _with_history(state: SupervisorState, updates: Dict[str, Any], assistant_output: Any) -> SupervisorState:
    merged = {**state, **updates}
    return _append_turn_history(merged, assistant_output)


def _maybe_route_sticky(state: SupervisorState) -> tuple[str | None, Dict[str, Any] | None]:
    """
    Determine whether the current turn should sticky-route to the previous agent.

    Returns (agent_key, updated_conversation_ctx) or (None, None)
    """
    from django.core.cache import cache
    conversation_ctx: Dict[str, Any] = dict(state.get("conversation_ctx") or {})
    last_agent = conversation_ctx.get("last_agent")
    awaiting_followup = conversation_ctx.get("awaiting_followup", False)
    last_ts = conversation_ctx.get("last_agent_ts")

    # Fallback to cache if context not present (e.g., new worker process)
    if not last_agent or last_ts is None:
        thread_id = state.get("thread_id")
        if thread_id:
            cached = cache.get(f"followup:{thread_id}") or {}
            if isinstance(cached, dict):
                last_agent = last_agent or cached.get("last_agent")
                if not awaiting_followup:
                    awaiting_followup = bool(cached.get("awaiting_followup", False))
                last_ts = last_ts or cached.get("last_agent_ts")
                # Merge into conversation_ctx so downstream sees it
                if last_agent:
                    conversation_ctx["last_agent"] = last_agent
                if last_ts is not None:
                    conversation_ctx["last_agent_ts"] = last_ts
                conversation_ctx["awaiting_followup"] = bool(awaiting_followup)

    if not (last_agent and awaiting_followup and last_ts):
        return None, None

    if time.time() - float(last_ts) > STICKY_TTL_SECONDS:
        return None, None

    if not _is_followup_utterance(state.get("user_input", "")):
        return None, None

    # Mark follow-up as handled; agent will re-arm if more follow-ups expected.
    conversation_ctx["awaiting_followup"] = False
    conversation_ctx["last_agent_ts"] = time.time()
    # Persist sticky resolution in cache
    try:
        thread_id = state.get("thread_id")
        if thread_id:
            cache.set(
                f"followup:{thread_id}",
                {
                    "last_agent": last_agent,
                    "last_agent_ts": conversation_ctx["last_agent_ts"],
                    "awaiting_followup": False,
                },
                timeout=STICKY_TTL_SECONDS,
            )
    except Exception:
        pass
    return last_agent, conversation_ctx


def _apply_memory_context(state: SupervisorState) -> SupervisorState:
    """
    Fetch conversational memory from Zep and attach to supervisor state.
    """
    if not read_enabled():
        # Even if read path is disabled, hydrate lightweight convctx from cache if present
        thread_id = state.get("thread_id")
        if thread_id:
            try:
                cached_ctx = cache.get(f"convctx:{thread_id}")
                if isinstance(cached_ctx, dict) and cached_ctx:
                    merged = {**(state.get("conversation_ctx") or {}), **cached_ctx}
                    state = {**state, "conversation_ctx": merged}
            except Exception:
                pass
        return state

    thread_id = state.get("thread_id")
    if not thread_id:
        return state

    context, meta = fetch_thread_context(thread_id, mode="summary")
    conversation_ctx: Dict[str, Any] = dict(state.get("conversation_ctx") or {})
    # Hydrate previously persisted convctx snapshot from cache (fast path)
    try:
        cached_ctx = cache.get(f"convctx:{thread_id}")
        if isinstance(cached_ctx, dict) and cached_ctx:
            conversation_ctx.update(cached_ctx)
    except Exception:
        pass

    if context:
        summary = context.get("context") or ""
        facts = context.get("facts") or []
        recent = context.get("recent") or []
        memory_block = {
            "summary": summary,
            "facts": facts,
            "recent": recent,
        }
        conversation_ctx.setdefault("memory", {})
        conversation_ctx["memory"] = memory_block
        state = {
            **state,
            "memory_context_summary": summary,
            "memory_context_facts": facts,
            "memory_context_recent": recent,
        }
        if isinstance(meta, dict):
            meta["context_chars"] = len(summary)
    else:
        meta.setdefault("used", False)

    state = {
        **state,
        "memory_trace": meta,
        "conversation_ctx": conversation_ctx,
    }

    # Inject user preferences when enabled and not paused for this thread
    if PREFS_APPLY_ENABLED:
        try:
            # Resolve user_id via conversation thread if available
            from assistant.models import Conversation
            from django.core.cache import cache
            conv = Conversation.objects.filter(id=thread_id).first()
            if conv and conv.user_id:
                ctx_pause = (state.get("conversation_ctx") or {}).get("personalization_paused")
                paused_by_cache = cache.get(f"thread:{thread_id}:personalization_paused", False)
                if not bool(ctx_pause) and not bool(paused_by_cache):
                    prefs = PreferenceService.get_active_preferences(conv.user_id, min_confidence=0.5)
                    if prefs:
                        ctx = dict(state.get("conversation_ctx") or {})
                        ctx["preferences"] = prefs
                        state = {**state, "conversation_ctx": ctx}
                        # Mark in trace for ops visibility
                        memt = dict(state.get("memory_trace") or {})
                        memt["preferences_used"] = True
                        state["memory_trace"] = memt
        except Exception:
            pass
    return state


def build_supervisor_graph():
    """
    Build and compile the hierarchical LangGraph with CentralSupervisor routing.

    The graph entry node is the supervisor router; conditional edges forward
    requests to domain-specific worker nodes.  Each worker is wrapped with
    LangSmith tracing decorators for observability.
    """
    global _COMPILED_SUPERVISOR_GRAPH
    if _COMPILED_SUPERVISOR_GRAPH is not None and hasattr(_COMPILED_SUPERVISOR_GRAPH, "invoke"):
        return _COMPILED_SUPERVISOR_GRAPH
    try:
        supervisor = CentralSupervisor()
        graph = StateGraph(SupervisorState)

        @traced_supervisor_node
        def supervisor_node(state: SupervisorState) -> SupervisorState:
            state = _apply_memory_context(state)
            state = _inject_zep_context(state)
            sticky_agent, updated_ctx = _maybe_route_sticky(state)
            if sticky_agent:
                logger.info(
                    "[%s] Sticky follow-up → %s",
                    state.get("thread_id"),
                    sticky_agent,
                )
                followup_decision = {
                    "intent_type": "followup",
                    "category": "followup",
                    "confidence": 1.0,
                    "triggered_flow": "sticky_followup",
                    "primary_node": sticky_agent,
                    "attributes": {"reason": "sticky_followup"},
                    "requires_hitl": False,
                }
                next_state = {
                    **state,
                    "target_agent": sticky_agent,
                    "routing_decision": followup_decision,
                    "routing_decision_normalized": followup_decision,
                    "routing_decision_raw": None,
                    "current_node": "supervisor",
                    "intent_confidence": 1.0,
                    "intent_reasoning": "sticky_followup",
                    "triggered_flow": "sticky_followup",
                    "primary_node": sticky_agent,
                    "conversation_ctx": updated_ctx,
                    "memory_trace": state.get("memory_trace"),
                }
                return next_state

            if updated_ctx is not None:
                # Updated context (e.g., TTL refresh) even when not sticky
                state = {**state, "conversation_ctx": updated_ctx}

            return supervisor.route_request(state)

        def route_to_agent(state: SupervisorState) -> str:
            target = state.get("target_agent", "general_conversation_agent")
            valid_targets = {
                "real_estate_agent",
                "marketplace_agent",
                "general_conversation_agent",
                "local_info_agent",
            }
            # Normalize unexpected targets (e.g., 'safety_agent') to a safe default
            return target if target in valid_targets else "general_conversation_agent"

        @traced_worker_agent("general_conversation")
        def general_conversation_handler(state: SupervisorState) -> SupervisorState:
            """
            General Conversation Agent: Handle greetings, general info, platform questions.
            Leverages contextually appropriate responses.
            """
            try:
                logger.info(f"[{state.get('thread_id')}] General Conversation Agent: processing '{state['user_input'][:50]}'...")

                # For general conversation, provide contextually appropriate response
                user_input = state['user_input'].lower().strip()

                # Detect greeting patterns
                greeting_keywords = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
                if any(keyword in user_input for keyword in greeting_keywords):
                    response = "Welcome to Easy Islanders! I am your personal assistant for anything you need in North Cyprus. How can I help you today?"
                else:
                    # For other general questions, use a default helpful response
                    response = "I'm here to help! You can ask me about properties to rent or buy, search for vehicles, find services, or any general questions about North Cyprus."

                logger.info(f"[{state.get('thread_id')}] General Conversation Agent: returning response")
                return _with_history(
                    state,
                    {
                        'final_response': response,
                        'current_node': 'general_conversation_agent',
                        'is_complete': True,
                    },
                    response,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] General Conversation Agent failed: {e}")
                fallback = 'I encountered an issue processing your request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'general_conversation_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    fallback,
                )

        @traced_worker_agent("real_estate")
        def real_estate_handler(state: SupervisorState) -> SupervisorState:
            """
            Real Estate Agent: Delegates to production RE agent with frozen contracts.

            Integration Pattern (Contract-First):
            1. Map SupervisorState → AgentRequest (frozen schema)
            2. Call handle_real_estate_request() from production agent
            3. Map AgentResponse → SupervisorState
            4. Extract show_listings actions → recommendations format

            Observability: Full trace data preserved in state.agent_traces
            """
            from assistant.agents.real_estate import handle_real_estate_request
            from assistant.agents.contracts import AgentRequest, AgentContext
            from datetime import datetime
            import uuid

            thread_id = state.get('thread_id', 'unknown')
            # Base capsule for RE agent (persisted between turns)
            conversation_ctx = (state.get('conversation_ctx') or {})
            re_capsule = conversation_ctx.get('real_estate', {})
            # Pass through user preferences when available so the agent can pre-filter
            try:
                prefs = conversation_ctx.get('preferences')
                if isinstance(prefs, dict) and prefs:
                    # Attach under a dedicated key; agent will read from here
                    if isinstance(re_capsule, dict):
                        re_capsule = dict(re_capsule)
                        re_capsule['preferences'] = prefs
                    else:
                        re_capsule = {'preferences': prefs}
            except Exception:
                # Never break routing due to preferences capsule issues
                pass
            memory_capsule = {
                "summary": state.get("memory_context_summary"),
                "facts": state.get("memory_context_facts") or [],
                "recent": state.get("memory_context_recent") or [],
            }

            try:
                logger.info(f"[{thread_id}] RE Agent: delegating to production agent...")

                # Map SupervisorState → AgentRequest (frozen contract)
                routing = state.get('routing_decision') or {}
                intent_type = routing.get('intent_type', 'property_search')

                # Map supervisor intent → agent intent enum
                intent_map = {
                    'property_search': 'property_search',
                    'booking_request': 'property_search',  # S2: Treat as search
                    'lead_capture': 'property_search',
                }
                intent = intent_map.get(intent_type, 'property_search')

                # Build AgentRequest
                agent_request = AgentRequest(
                    thread_id=thread_id,
                    client_msg_id=state.get('client_msg_id') or f"sup-{uuid.uuid4()}",
                    intent=intent,
                    input=state['user_input'],
                    ctx=AgentContext(
                        user_id=state.get('user_id'),
                        locale=state.get('user_language', 'en'),
                        time=datetime.utcnow().isoformat() + 'Z',
                    ),
                )
                if re_capsule:
                    agent_request["ctx"]["conversation_capsule"] = re_capsule
                if any([
                    memory_capsule.get("summary"),
                    memory_capsule.get("facts"),
                    memory_capsule.get("recent"),
                ]):
                    agent_request["ctx"]["memory"] = memory_capsule

                # Call production agent
                agent_response = handle_real_estate_request(agent_request)

                # Extract data from AgentResponse
                reply = agent_response.get('reply', 'I found some properties for you.')
                actions = agent_response.get('actions', [])
                traces = agent_response.get('traces', {})

                # Map show_listings action → recommendations format
                recommendations = []
                page = 1
                page_size = len(agent_response.get('actions', [{}])[0].get('params', {}).get('listings', [])) or 0
                has_more = False
                total_available = None
                search_params_payload: Dict[str, Any] = dict(traces.get("extracted_params", {}) or {}) if isinstance(traces, dict) else {}
                for action in actions:
                    if action['type'] == 'show_listings':
                        action_params = action.get('params', {}) or {}
                        listings = action_params.get('listings', [])
                        page = action_params.get('page', page)
                        page_size = action_params.get('page_size', page_size or len(listings) or 10)
                        has_more = action_params.get('has_more', has_more)
                        total_available = action_params.get('total', total_available)
                        if action_params.get('search_params'):
                            search_params_payload = action_params['search_params']
                        # Convert PropertyCard → supervisor recommendation format
                        recommendations = [
                            {
                                'id': lst['id'],
                                'title': lst['title'],
                                'location': lst['location'],
                                'bedrooms': lst['bedrooms'],
                                'price': lst['price_per_night'],
                                'amenities': lst['amenities'],
                                'photos': lst['photos'],
                                'type': 'property',
                                'agent': 'real_estate',  # Tag with agent name
                            }
                            for lst in listings
                        ]
                        break

                if total_available is not None and not has_more:
                    has_more = total_available > (page * (page_size or 1))

                conversation_ctx = dict(state.get('conversation_ctx') or {})
                has_any_results = bool(recommendations)
                if has_any_results:
                    conversation_ctx.update({
                        "last_agent": "real_estate_agent",
                        "last_agent_ts": time.time(),
                        "awaiting_followup": has_any_results and bool(has_more),
                        "real_estate": {
                            "search_params": search_params_payload,
                            "tenure": traces.get("tenure") if isinstance(traces, dict) else None,
                            "page": page,
                            "page_size": page_size or 10,
                            "total": total_available,
                            "last_results_ref": [rec['id'] for rec in recommendations if rec.get('id')],
                            "has_more": has_more,
                            "max_results": search_params_payload.get("max_results") or total_available,
                        },
                    })
                    # Persist sticky-followup hints in cache for process resilience
                    try:
                        cache.set(
                            f"followup:{thread_id}",
                            {
                                "last_agent": "real_estate_agent",
                                "last_agent_ts": conversation_ctx["last_agent_ts"],
                                "awaiting_followup": bool(has_more),
                            },
                            timeout=STICKY_TTL_SECONDS,
                        )
                        # Persist full conversation_ctx snapshot as well
                        cache.set(f"convctx:{thread_id}", dict(conversation_ctx), timeout=86400)
                    except Exception:
                        pass
                elif any(action.get("type") == "ask_clarification" for action in actions):
                    capsule_payload = dict(re_capsule) if isinstance(re_capsule, dict) else {}
                    capsule_payload.setdefault("search_params", capsule_payload.get("search_params", {}))
                    capsule_payload["has_more"] = False
                    capsule_payload["awaiting_clarification_reason"] = traces.get("clarify_reason") if isinstance(traces, dict) else None
                    conversation_ctx.update({
                        "last_agent": "real_estate_agent",
                        "last_agent_ts": time.time(),
                        "awaiting_followup": True,
                        "real_estate": capsule_payload,
                    })
                    try:
                        cache.set(f"followup:{thread_id}", {
                            "last_agent": "real_estate_agent",
                            "last_agent_ts": conversation_ctx["last_agent_ts"],
                            "awaiting_followup": True,
                        }, timeout=STICKY_TTL_SECONDS)
                        cache.set(f"convctx:{thread_id}", dict(conversation_ctx), timeout=86400)
                    except Exception:
                        pass

                logger.info(f"[{thread_id}] RE Agent: completed, {len(recommendations)} cards, reply_len={len(reply)}")

                return _with_history(
                    state,
                    {
                        'final_response': reply,
                        'recommendations': recommendations,
                        'current_node': 'real_estate_agent',
                        'is_complete': True,
                        'agent_response': agent_response,  # Full response for debugging
                        'agent_traces': traces,  # Observability data
                        'agent_name': 'real_estate',  # For WS frame tagging
                        'conversation_ctx': conversation_ctx,
                        'memory_trace': state.get('memory_trace'),
                    },
                    reply,
                )

            except Exception as e:
                logger.error(f"[{thread_id}] RE Agent failed: {e}", exc_info=True)
                fallback = 'I had trouble processing your property request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'real_estate_agent',
                        'is_complete': True,
                        'error_message': str(e),
                        'agent_name': 'real_estate',
                    },
                    fallback,
                )

        @traced_worker_agent("marketplace")
        def marketplace_handler(state: SupervisorState) -> SupervisorState:
            """
            Marketplace Agent: Handle non-real-estate product/service searches and broadcast requests.
            Extracts: product_type, budget, etc.
            """
            try:
                logger.info(f"[{state.get('thread_id')}] Marketplace Agent: processing '{state['user_input'][:50]}'...")

                # Extract entities from routing decision
                routing_decision = state.get('routing_decision')
                entities = {}
                if routing_decision is not None:
                    if hasattr(routing_decision, 'extracted_entities'):
                        entities = getattr(routing_decision, 'extracted_entities') or {}
                    elif isinstance(routing_decision, dict):
                        entities = routing_decision.get('extracted_entities', {}) or {}
                product_type = entities.get('product_type', 'products')

                # Build contextual response
                response = f"I can help you find {product_type}. Let me search for the best deals and connect you with sellers."

                logger.info(f"[{state.get('thread_id')}] Marketplace Agent: returning response")
                return _with_history(
                    state,
                    {
                        'final_response': response,
                        'current_node': 'marketplace_agent',
                        'is_complete': True,
                        'extracted_criteria': entities,
                    },
                    response,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] Marketplace Agent failed: {e}")
                fallback = 'I had trouble processing your request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'marketplace_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    fallback,
                )

        @traced_worker_agent("local_info")
        def local_info_handler(state: SupervisorState) -> SupervisorState:
            """
            Local Info Agent: Handle live local lookups (pharmacy on duty, hospitals, activities).
            Uses Tavily for web search + Nominatim for geocoding.
            Always ask for a city if not explicitly provided; never default.
            """
            try:
                logger.info(f"[{state.get('thread_id')}] Local Info Agent: processing '{(state.get('user_input') or '')[:50]}'...")
                user_input = state.get('user_input') or ''
                q = user_input.lower()

                # Normalization first: use registry hits determined by the supervisor,
                # otherwise perform a local lookup.  This keeps entity matching consistent
                # across the routing layer and worker logic.
                registry_hits = state.get('registry_hits') or []
                normalized_base = (state.get('normalized_query') or '') if state.get('normalized_query') else None
                if not registry_hits:
                    try:
                        registry_hits = get_registry_client().search(user_input, domain="local_info", k=8)
                    except Exception as registry_error:  # noqa: BLE001
                        logger.warning(f"[{state.get('thread_id')}] Registry lookup failed in local_info: {registry_error}")
                        registry_hits = []
                if not normalized_base and registry_hits:
                    normalized_base = registry_hits[0].get("base_term") or registry_hits[0].get("localized_term")

                normalized_terms = {
                    term.lower()
                    for hit in registry_hits
                    for term in [hit.get("base_term"), hit.get("localized_term")]
                    if term
                }

                def _matches(term: str) -> bool:
                    """Check if the user request semantically aligns with the supplied term."""
                    candidate = term.lower()
                    if normalized_base and normalized_base.lower() == candidate:
                        return True
                    return candidate in normalized_terms or candidate in q

                # Extract explicit city from structured criteria (set by supervisor intent)
                attrs = state.get('extracted_criteria') or {}
                raw_city = attrs.get('city') or state.get('location')

                # Guard: city required
                if not raw_city:
                    ask = (
                        "Which city should I search? (Kyrenia/Girne, Nicosia/Lefkoşa, "
                        "Famagusta/Gazimağusa, Güzelyurt/Morphou, İskele/Trikomo)"
                    )
                    logger.info(f"[{state.get('thread_id')}] LOCAL_LOOKUP missing city → prompt user")
                    response_payload = {"type": "text", "message": ask}
                    return _with_history(
                        state,
                        {
                            'final_response': response_payload,
                            'current_node': 'local_info_agent',
                            'is_complete': False,
                        },
                        response_payload,
                    )

                city = normalize_city(raw_city)
                if not city:
                    ask = (
                        "I couldn't recognize the city name. Which city should I search? "
                        "(Kyrenia/Girne, Nicosia/Lefkoşa, Famagusta/Gazimağusa, Güzelyurt/Morphou, İskele/Trikomo)"
                    )
                    logger.info(f"[{state.get('thread_id')}] LOCAL_LOOKUP unrecognized city → prompt user")
                    response_payload = {"type": "text", "message": ask}
                    return _with_history(
                        state,
                        {
                            'final_response': response_payload,
                            'current_node': 'local_info_agent',
                            'is_complete': False,
                        },
                        response_payload,
                    )

                # Handle pharmacy queries with Tavily + geocoding
                if _matches('pharmacy') or _matches('doctor') or _matches('medical'):
                    try:
                        from . import tavily
                        import time

                        # Build Tavily search query (Two-Step: Search → Extract)
                        search_query = f"open on-duty pharmacy schedule {city}"
                        logger.info(f"[{state.get('thread_id')}] Tavily search: {search_query}")

                        # Search for pharmacies (scoped to kteb.org, advanced depth, few results)
                        search_result = tavily.search(
                            search_query,
                            search_depth="advanced",
                            time_range="d",
                            max_results=2,
                            include_domains=["kteb.org"],
                        )
                        hits = (search_result.get("results") or [])[:2]
                        urls = [h.get("url") for h in hits if h.get("url")][:5]
                        # Try to enrich URL list via site_map to skip non-extractable roots
                        try:
                            sm = tavily.site_map("kteb.org")
                            site_urls = [u for u in (sm.get("urls") or []) if isinstance(u, str)]
                            # Prefer likely detail pages
                            detail_like = [u for u in site_urls if all(seg not in u.lower() for seg in ["/dp/", "/lists/", "/?lang="])]
                            urls.extend(detail_like[:5])
                        except Exception:
                            pass

                        recs = []

                        def _with_retries(call, attempts: int = 3, delay: float = 0.6):
                            last_err = None
                            for i in range(attempts):
                                try:
                                    return call()
                                except Exception as e:
                                    last_err = e
                                    time.sleep(delay * (2 ** i))
                            if last_err:
                                raise last_err
                            return None
                        for idx, url in enumerate(urls):
                            try:
                                # Prefer using search hit metadata first
                                hit = hits[idx] if idx < len(hits) else {}
                                hit_title = (hit.get("title") or "").strip()
                                hit_content = (hit.get("content") or hit.get("snippet") or "").strip()

                                def _append_if_geocoded(title_val: str, address_val: str):
                                    if not title_val and not address_val:
                                        return False
                                    coords_local = geocode(f"{title_val} {city}") if title_val else None
                                    if not coords_local and address_val:
                                        coords_local = geocode(f"{address_val} {city}")
                                    if coords_local:
                                        lat, lng = coords_local
                                        recs.append({
                                            "type": "geo_location",
                                            "latitude": lat,
                                            "longitude": lng,
                                            "display_name": title_val or address_val or "Pharmacy",
                                            "entity_type": "pharmacy",
                                            "metadata": {"address": address_val or None, "url": url}
                                        })
                                        return True
                                    return False

                                # If the URL looks like an index/root page, skip extract and try geocoding from hit title/content
                                if any(seg in url.lower() for seg in ["/dp/", "/news", "/?lang="]):
                                    if _append_if_geocoded(hit_title, hit_content):
                                        continue

                                # Otherwise attempt structured extract with advanced depth; on 4xx/422 fall back to hit metadata
                                try:
                                    extract_result = _with_retries(
                                        lambda: tavily.extract(url, extract_depth="advanced", format="text")
                                    )
                                    items = (extract_result.get("results") or [])[:6]
                                    # If Tavily returns a flat text content without granular items
                                    if not items and isinstance(extract_result, dict):
                                        text_blob = (extract_result.get("content") or "").strip()
                                        if text_blob and (hit_title or hit_content):
                                            _append_if_geocoded(hit_title, text_blob[:200])
                                    if not items and (hit_title or hit_content):
                                        _append_if_geocoded(hit_title, hit_content)
                                    for item in items:
                                        title = (item.get("title") or hit_title or "Pharmacy").strip()
                                        address = (item.get("meta") or item.get("address") or item.get("content") or hit_content or "").strip()
                                        if _append_if_geocoded(title, address):
                                            # Mark as duty today since coming from KTEB context
                                            if recs:
                                                recs[-1].setdefault("metadata", {})["duty_today"] = True
                                            continue
                                except Exception as ex:
                                    logger.warning(f"[{state.get('thread_id')}] Extract failed for {url}: {ex}")
                                    # Fallback: geocode using hit metadata
                                    if _append_if_geocoded(hit_title, hit_content) and recs:
                                        recs[-1].setdefault("metadata", {})["duty_today"] = True
                            except Exception as e:
                                logger.warning(f"[{state.get('thread_id')}] Failed to extract {url}: {e}")

                        # If still empty, use Overpass fallback (duty unconfirmed)
                        if not recs:
                            try:
                                pois = overpass_pharmacies_near_city(city)
                                for p in pois:
                                    lat = p.get("lat"); lon = p.get("lon")
                                    if lat is None or lon is None:
                                        continue
                                    recs.append({
                                        "type": "geo_location",
                                        "latitude": lat,
                                        "longitude": lon,
                                        "display_name": p.get("name") or "Pharmacy",
                                        "entity_type": "pharmacy",
                                        "metadata": {"source": "overpass", "duty_today": False}
                                    })
                            except Exception:
                                pass

                        msg = (
                            f"Found {len(recs)} pharmacies in {city}."
                            if recs else f"Couldn't confirm duty pharmacies for {city}."
                        )
                        logger.info(f"[{state.get('thread_id')}] Local Info: {len(recs)} pharmacies found")

                        response_payload = {"type": "text", "message": msg}
                        return _with_history(
                            state,
                            {
                                'final_response': response_payload,
                                'recommendations': recs,
                                'current_node': 'local_info_agent',
                                'is_complete': True,
                            },
                            response_payload,
                        )
                    except Exception as e:
                        logger.warning(f"[{state.get('thread_id')}] Tavily search failed: {e}; falling back")
                        response = f"I couldn't fetch on-duty pharmacies for {city} right now. Try checking the municipality health page."
                        response_payload = {"type": "text", "message": response}
                        return _with_history(
                            state,
                            {
                                'final_response': response_payload,
                                'current_node': 'local_info_agent',
                                'is_complete': True,
                            },
                            response_payload,
                        )

                elif any(_matches(k) for k in ['hospital', 'clinic', 'emergency']):
                    places = find_places('hospital', near=city)
                    if places:
                        response = f"Nearby hospitals in {city}:\n" + "\n".join(f"- {p.get('display_name')}" for p in places[:5])
                    else:
                        response = f"I couldn't find nearby hospitals in {city} right now."
                elif any(_matches(k) for k in ['things to do', 'activities', 'what to do']):
                    hits = web_search(f"things to do in {city} today")
                    heading = hits.get('Heading') or 'Top guides online'
                    response = f"Popular activities in {city}:\n- {heading}"
                else:
                    response = "I can look up duty pharmacies, hospitals, directions, and local activities. What exactly do you need?"

                response_payload = {"type": "text", "message": response}
                return _with_history(
                    state,
                    {
                        'final_response': response_payload,
                        'current_node': 'local_info_agent',
                        'is_complete': True,
                        'recommendations': [],
                    },
                    response_payload,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] Local Info Agent failed: {e}", exc_info=True)
                response_payload = {"type": "text", "message": 'I had trouble fetching local info.'}
                return _with_history(
                    state,
                    {
                        'final_response': response_payload,
                        'current_node': 'local_info_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    response_payload,
                )

        # =========================================================================
        # GRAPH CONSTRUCTION
        # =========================================================================

        graph.add_node("supervisor", supervisor_node)
        graph.add_node("real_estate_agent", real_estate_handler)
        graph.add_node("marketplace_agent", marketplace_handler)
        graph.add_node("general_conversation_agent", general_conversation_handler)
        graph.add_node("local_info_agent", local_info_handler)

        graph.set_entry_point("supervisor")

        graph.add_conditional_edges(
            "supervisor",
            route_to_agent,
            {
                "real_estate_agent": "real_estate_agent",
                "marketplace_agent": "marketplace_agent",
                "general_conversation_agent": "general_conversation_agent",
                "local_info_agent": "local_info_agent",
            },
        )

        graph.add_edge("real_estate_agent", END)
        graph.add_edge("marketplace_agent", END)
        graph.add_edge("general_conversation_agent", END)
        graph.add_edge("local_info_agent", END)

        # Compile graph with in-memory session checkpointer
        compiled = None
        try:
            compiled = graph.compile(checkpointer=_SUPERVISOR_MEMORY)
            logger.info("Supervisor graph compiled successfully")
        except Exception as e:
            logger.error("Supervisor graph compile failed: %s", e, exc_info=True)
            compiled = None

        # Fallback: if compile() returned a non-invokable object (or None) due to
        # environment/version differences, provide a minimal wrapper that mimics
        # the compiled graph's .invoke() by calling the supervisor_node and then
        # dispatching to the routed agent handler directly.
        if compiled is None or not hasattr(compiled, "invoke"):
            logger.warning("Using fallback supervisor graph wrapper (no compiled invoke)")

            class _FallbackSupervisor:
                def invoke(self_inner, state: SupervisorState, config: Dict[str, Any] | None = None) -> SupervisorState:
                    try:
                        st = supervisor_node(state)
                        target = route_to_agent(st)
                        if target == "real_estate_agent":
                            return real_estate_handler(st)
                        if target == "marketplace_agent":
                            return marketplace_handler(st)
                        if target == "local_info_agent":
                            return local_info_handler(st)
                        # Default to general conversation
                        return general_conversation_handler(st)
                    except Exception:
                        logger.error("Fallback supervisor invoke failed", exc_info=True)
                        # Return a safe error response
                        return {
                            **state,
                            'final_response': 'I had trouble processing your request. Please try again.',
                            'current_node': 'supervisor',
                            'is_complete': True,
                            'error_message': 'fallback_invoke_failed',
                        }

            instance = _FallbackSupervisor()
            _COMPILED_SUPERVISOR_GRAPH = instance
            return instance

        _COMPILED_SUPERVISOR_GRAPH = compiled
        return compiled
    except Exception as e:
        logger.error(f"Failed to initialize supervisor graph: {e}")
        return None
