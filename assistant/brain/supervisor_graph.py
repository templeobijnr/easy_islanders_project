"""
LangGraph supervisor topology and worker handlers.

This module wires the CentralSupervisor into a LangGraph `StateGraph`, registers
worker nodes for each domain agent, and documents the routing rules used by the
hierarchical multi-agent system.  Handlers focus on fast acknowledgement of the
user request—heavy lifting is delegated to downstream tools or flows.
"""

from langgraph.graph import StateGraph, END
from django.conf import settings
import logging

from .supervisor import CentralSupervisor
from .supervisor_schemas import SupervisorState
from .checkpointing import get_checkpoint_saver
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

logger = logging.getLogger(__name__)


def build_supervisor_graph():
    """
    Build and compile the hierarchical LangGraph with CentralSupervisor routing.

    The graph entry node is the supervisor router; conditional edges forward
    requests to domain-specific worker nodes.  Each worker is wrapped with
    LangSmith tracing decorators for observability.
    """
    supervisor = CentralSupervisor()
    graph = StateGraph(SupervisorState)

    @traced_supervisor_node
    def supervisor_node(state: SupervisorState) -> SupervisorState:
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

    # =========================================================================
    # REAL AGENT HANDLERS (Option B Implementation)
    # =========================================================================

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
            return {
                **state,
                'final_response': response,
                'current_node': 'general_conversation_agent',
                'is_complete': True
            }
        except Exception as e:
            logger.error(f"[{state.get('thread_id')}] General Conversation Agent failed: {e}")
            return {
                **state,
                'final_response': 'I encountered an issue processing your request. Please try again.',
                'current_node': 'general_conversation_agent',
                'is_complete': True,
                'error_message': str(e)
            }

    @traced_worker_agent("real_estate")
    def real_estate_handler(state: SupervisorState) -> SupervisorState:
        """
        Real Estate Agent: Handle property search, booking, and viewing scheduling.
        Extracts: bedrooms, location, budget, duration, etc.
        """
        try:
            logger.info(f"[{state.get('thread_id')}] Real Estate Agent: processing '{state['user_input'][:50]}'...")
            
            # Extract entities from routing decision for context
            routing_decision = state.get('routing_decision')
            entities = {}
            if routing_decision is not None:
                if hasattr(routing_decision, 'extracted_entities'):
                    entities = getattr(routing_decision, 'extracted_entities') or {}
                elif isinstance(routing_decision, dict):
                    entities = routing_decision.get('extracted_entities', {}) or {}
            bedrooms = entities.get('bedrooms')
            location = entities.get('location')
            
            # Build a response that acknowledges the search intent
            if location:
                response = f"I'm searching for properties in {location}"
                if bedrooms:
                    response += f" with {bedrooms} bedroom(s)"
                response += ". Let me find the best options for you."
            else:
                response = "I can help you find properties in North Cyprus. What are you looking for?"
            
            logger.info(f"[{state.get('thread_id')}] Real Estate Agent: returning response")
            return {
                **state,
                'final_response': response,
                'current_node': 'real_estate_agent',
                'is_complete': True,
                'extracted_criteria': entities
            }
        except Exception as e:
            logger.error(f"[{state.get('thread_id')}] Real Estate Agent failed: {e}")
            return {
                **state,
                'final_response': 'I had trouble processing your property request. Please try again.',
                'current_node': 'real_estate_agent',
                'is_complete': True,
                'error_message': str(e)
            }

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
            return {
                **state,
                'final_response': response,
                'current_node': 'marketplace_agent',
                'is_complete': True,
                'extracted_criteria': entities
            }
        except Exception as e:
            logger.error(f"[{state.get('thread_id')}] Marketplace Agent failed: {e}")
            return {
                **state,
                'final_response': 'I had trouble processing your request. Please try again.',
                'current_node': 'marketplace_agent',
                'is_complete': True,
                'error_message': str(e)
            }

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
                return {**state, 'final_response': {"type": "text", "message": ask}, 'current_node': 'local_info_agent', 'is_complete': False}

            city = normalize_city(raw_city)
            if not city:
                ask = (
                    "I couldn't recognize the city name. Which city should I search? "
                    "(Kyrenia/Girne, Nicosia/Lefkoşa, Famagusta/Gazimağusa, Güzelyurt/Morphou, İskele/Trikomo)"
                )
                logger.info(f"[{state.get('thread_id')}] LOCAL_LOOKUP unrecognized city → prompt user")
                return {**state, 'final_response': {"type": "text", "message": ask}, 'current_node': 'local_info_agent', 'is_complete': False}

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
                    
                    return {
                        **state,
                        'final_response': {"type": "text", "message": msg},
                        'recommendations': recs,
                        'current_node': 'local_info_agent',
                        'is_complete': True
                    }
                except Exception as e:
                    logger.warning(f"[{state.get('thread_id')}] Tavily search failed: {e}; falling back")
                    response = f"I couldn't fetch on-duty pharmacies for {city} right now. Try checking the municipality health page."
                    return {**state, 'final_response': {"type": "text", "message": response}, 'current_node': 'local_info_agent', 'is_complete': True}
            
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

            return {**state, 'final_response': {"type": "text", "message": response}, 'current_node': 'local_info_agent', 'is_complete': True, 'recommendations': []}
        except Exception as e:
            logger.error(f"[{state.get('thread_id')}] Local Info Agent failed: {e}", exc_info=True)
            return {**state, 'final_response': {"type": "text", "message": 'I had trouble fetching local info.'}, 'current_node': 'local_info_agent', 'is_complete': True, 'error_message': str(e)}

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

    # Compile with saver (MemorySaver Phase A, Postgres later)
    conn = getattr(settings, "LANGGRAPH_CHECKPOINT_CONNECTION_STRING", "sqlite:///langgraph_checkpoints.db")
    saver = get_checkpoint_saver(conn)
    return graph.compile(checkpointer=saver)
