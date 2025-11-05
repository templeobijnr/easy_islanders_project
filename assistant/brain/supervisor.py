import logging
from django.conf import settings

from .supervisor_schemas import SupervisorState, SupervisorRoutingDecision
from . import intent_parser
from .registry import get_registry_client

try:  # Backwards-compatible import so tests can patch ChatOpenAI
    from langchain_openai import ChatOpenAI  # noqa: F401
except Exception:  # noqa: BLE001
    ChatOpenAI = None  # type: ignore[misc]


logger = logging.getLogger(__name__)


class CentralSupervisor:
    """
    Central Supervisor Agent - Root Orchestrator for hierarchical multi-agent system
    
    Uses Phase B.1 Structured Intent Parsing to classify user input into 12 intent types,
    mapped directly to:
    - 4 Core Flows (F1-F4)
    - 12 Node LangGraph Architecture
    - Multi-domain marketplace (Property, Vehicle, Product, Service)
    
    Benefits:
    - 100% schema compliance (no JSON parsing failures)
    - Explicit flow/node routing (reduced latency)
    - Audit trail of all routing decisions
    - Graceful fallback with confidence scoring
    """

    def __init__(self):
        """Initialize supervisor with settings."""
        self.model_name = getattr(settings, "SUPERVISOR_ROUTER_MODEL", "gpt-4o-mini")
        # Intent parser is initialized lazily on first use (singleton)
        intent_parser.reset_intent_parser()

    def route_request(self, state: SupervisorState) -> SupervisorState:
        """
        Route incoming user input to appropriate worker agent.
        
        Process:
        1. Parse intent with structured output (Phase B.1)
        2. Extract attributes specific to domain
        3. Determine target agent based on intent + flow
        4. Map to specialized worker node
        5. Preserve routing metadata in state for audit trail
        
        Args:
            state: SupervisorState with user_input, thread_id, etc.
        
        Returns:
            Updated state with routing_decision, target_agent, triggered_flow, primary_node
        """
        user_input = state.get("user_input", "")
        thread_id = state.get("thread_id", "unknown")
        language = state.get("user_language", "en")
        location = state.get("location", "")
        
        logger.info(f"[CSA:{thread_id}] Routing: {user_input[:120]}")

        try:
            # Phase B.1: Parse intent with structured output
            # STEP 6: Router Memory Fusion - Build context-primed input
            from .supervisor_graph import _build_router_context

            # Build router context that includes active domain, entities, and recent turns
            router_context = _build_router_context(state, user_input)

            # Use router context for intent classification
            context = {
                "language": language,
                "location": location,
                "last_action": state.get("current_node", "conversation_start"),
                "history_summary": router_context,  # STEP 6: Use context-primed router input
                "active_domain": state.get("active_domain"),  # STEP 3: Include active domain
            }

            intent_result = intent_parser.parse_intent_robust(user_input, context, thread_id)

            # Backwards compatibility: accept legacy SupervisorRoutingDecision outputs
            if isinstance(intent_result, SupervisorRoutingDecision) or hasattr(intent_result, "primary_domain"):
                decision = intent_result
                if not isinstance(decision, SupervisorRoutingDecision):
                    try:
                        decision = SupervisorRoutingDecision(
                            primary_domain=getattr(intent_result, "primary_domain"),
                            secondary_domain=getattr(intent_result, "secondary_domain", None),
                            confidence_score=float(getattr(intent_result, "confidence_score", 0.0)),
                            extracted_entities=getattr(intent_result, "extracted_entities", {}) or {},
                            reasoning=getattr(intent_result, "reasoning", ""),
                            requires_clarification=bool(getattr(intent_result, "requires_clarification", False)),
                        )
                    except Exception:  # noqa: BLE001
                        decision = SupervisorRoutingDecision(
                            primary_domain=getattr(intent_result, "primary_domain", "GENERAL_CONVERSATION"),
                            secondary_domain=None,
                            confidence_score=0.0,
                            extracted_entities={},
                            reasoning=str(getattr(intent_result, "reasoning", "")),
                            requires_clarification=False,
                        )

                decision_dict = decision.model_dump()
                target_agent = self._map_domain_to_agent(decision.primary_domain)
                logger.debug(
                    "[CSA:%s] Legacy routing decision detected: domain=%s -> agent=%s",
                    thread_id,
                    decision.primary_domain,
                    target_agent,
                )
                logger.debug("[CSA:%s] Normalized legacy decision: %s", thread_id, decision_dict)
                return {
                    **state,
                    "routing_decision": decision_dict,
                    "routing_decision_normalized": decision_dict,
                    "routing_decision_raw": decision,
                    "target_agent": target_agent,
                    "current_node": "supervisor",
                    "intent_confidence": decision.confidence_score,
                    "intent_reasoning": decision.reasoning,
                    "requires_hitl": decision.requires_clarification,
                    "extracted_criteria": decision.extracted_entities,
                    "active_domain": target_agent,  # STEP 3: Track domain for continuity
                }
            
            registry_hits = []
            normalized_query = None
            try:
                registry_client = get_registry_client()
                search_domain = "local_info" if intent_result.intent_type in {"local_lookup", "knowledge_query", "general_chat"} else None
                if search_domain and user_input:
                    registry_hits = registry_client.search(user_input, domain=search_domain, k=8)
                    if registry_hits:
                        normalized_query = registry_hits[0].get("base_term") or registry_hits[0].get("localized_term")
            except Exception as registry_error:  # noqa: BLE001
                logger.warning("[CSA:%s] Registry lookup failed: %s", thread_id, registry_error)

            intent_label = getattr(intent_result, "intent_type", None) or getattr(intent_result, "primary_domain", "unknown")
            confidence_val = getattr(intent_result, "confidence", None)
            if confidence_val is None:
                confidence_val = getattr(intent_result, "confidence_score", None)
            try:
                confidence_display = f"{float(confidence_val):.2f}"
            except Exception:
                confidence_display = "n/a"
            flow_label = getattr(intent_result, "triggered_flow", "legacy")
            node_label = getattr(intent_result, "primary_node", "n/a")

            logger.info(
                f"[CSA:{thread_id}] Intent: {intent_label} "
                f"(conf={confidence_display}, flow={flow_label}, node={node_label})"
            )

            # Determine target agent based on intent type
            target_agent = self._map_intent_to_agent(intent_result.intent_type, intent_result.category)

            # STEP 3: Apply continuity guard to prevent unintentional domain drift
            # CRITICAL FIX: Pass intent confidence to allow high-confidence switches
            from .supervisor_graph import _check_continuity_guard
            active_domain = state.get("active_domain")
            intent_confidence = getattr(intent_result, "confidence", 0.0)
            should_maintain, continuity_reason = _check_continuity_guard(
                state, target_agent, intent_confidence
            )

            if should_maintain and active_domain:
                logger.info(
                    "[CSA:%s] Continuity guard active: maintaining domain %s (reason: %s)",
                    thread_id,
                    active_domain,
                    continuity_reason
                )
                target_agent = active_domain  # Keep existing agent
                # Mark in normalized decision for observability
                normalized_decision_extra = {
                    "continuity_maintained": True,
                    "continuity_reason": continuity_reason,
                    "original_target": self._map_intent_to_agent(intent_result.intent_type, intent_result.category)
                }
            else:
                normalized_decision_extra = {
                    "continuity_maintained": False
                }
                if continuity_reason:
                    normalized_decision_extra["continuity_reason"] = continuity_reason

            normalized_decision = {
                "intent_type": intent_result.intent_type,
                "category": intent_result.category,
                "confidence": getattr(intent_result, "confidence", None),
                "triggered_flow": intent_result.triggered_flow,
                "primary_node": intent_result.primary_node,
                "attributes": intent_result.attributes,
                "requires_hitl": intent_result.requires_hitl,
                **normalized_decision_extra,  # STEP 3: Include continuity guard info
            }

            # Update state with structured routing decision
            return {
                **state,
                "routing_decision": normalized_decision,
                "routing_decision_normalized": normalized_decision,
                "routing_decision_raw": None,
                "target_agent": target_agent,
                "current_node": "supervisor",
                "triggered_flow": intent_result.triggered_flow,
                "primary_node": intent_result.primary_node,
                "intent_confidence": intent_result.confidence,
                "intent_reasoning": intent_result.reasoning,
                "requires_hitl": intent_result.requires_hitl,
                "extracted_criteria": intent_result.attributes,
                "normalized_query": normalized_query,
                "registry_hits": registry_hits,
                "active_domain": target_agent,  # STEP 3: Update active domain for next turn
            }
        
        except Exception as e:
            logger.error(f"[CSA:{thread_id}] Routing error: {e}", exc_info=True)
            # Graceful fallback to general conversation
            return {
                **state,
                "target_agent": "general_conversation_agent",
                "error_message": str(e),
                "current_node": "supervisor",
                "routing_decision": "general_chat",
                 "routing_decision_normalized": None,
                 "routing_decision_raw": None,
                "intent_confidence": 0.0,
            }

    @staticmethod
    def _map_intent_to_agent(intent_type: str, category: str) -> str:
        """
        Map intent type to target worker agent.
        
        Maps all 12 intents to specialized agents:
        - real_estate_agent: property_search, booking_request, lead_capture (for properties)
        - marketplace_agent: vehicle_search, product_search, service_search, lead_capture (non-RE)
        - general_conversation_agent: knowledge_query, general_chat, greeting, status_update
        - safety_agent: out_of_scope (for harmful/invalid input)
        """
        # Domain search intents -> domain-specific agents
        if intent_type == "property_search":
            return "real_estate_agent"
        elif intent_type in ("vehicle_search", "product_search", "service_search"):
            return "marketplace_agent"
        
        # Transactional intents -> route by category
        elif intent_type == "booking_request":
            return "real_estate_agent" if category == "PROPERTY" else "marketplace_agent"
        
        elif intent_type == "lead_capture":
            # Could be property or marketplace
            return "real_estate_agent" if category == "PROPERTY" else "marketplace_agent"
        
        elif intent_type == "agent_outreach":
            # Route to relevant agent based on context
            return "marketplace_agent"  # Default; could be contextual
        
        # Knowledge/Conversation -> general agent
        elif intent_type in ("knowledge_query", "general_chat", "greeting", "status_update"):
            return "general_conversation_agent"
        elif intent_type == "local_lookup":
            return "local_info_agent"
        
        # Safety/Governance -> block
        elif intent_type == "out_of_scope":
            return "safety_agent"  # Could be a dedicated safety agent
        
        # Default fallback
        else:
            logger.warning(f"Unknown intent type: {intent_type} - routing to general_conversation_agent")
            return "general_conversation_agent"

    @staticmethod
    def _map_domain_to_agent(domain: str) -> str:
        """Legacy domain-to-agent mapping used by SupervisorRoutingDecision."""
        mapping = {
            "REAL_ESTATE": "real_estate_agent",
            "NON_RE_MARKETPLACE": "marketplace_agent",
            "GENERAL_CONVERSATION": "general_conversation_agent",
        }
        return mapping.get(domain, "general_conversation_agent")


# =========================================================================
# STEP 7: Context-Primed Router & Sticky-Intent Orchestration
# =========================================================================

def route_with_sticky(state: dict) -> dict:
    """
    STEP 7: Route with sticky-intent orchestration using hysteresis.

    This function implements context-primed routing with hysteresis thresholds
    to prevent intent oscillation ("Girne" drift bug). It uses the fused context
    from STEP 6 to make intelligent routing decisions.

    Process:
    1. Classify intent using context-primed router (user_input + fused_context)
    2. Apply continuity decision (stick/switch/clarify) based on:
       - Confidence thresholds (stick < 0.55, switch > 0.72)
       - Short input detection (≤5 words → stick)
       - Refinement lexicon ("in girne", "cheaper" → stick)
       - Explicit switch markers ("actually show me cars" → switch)
    3. Update state with routing decision and metadata

    Args:
        state: SupervisorState with user_input, fused_context, active_domain

    Returns:
        Updated state with:
        - target_agent: Agent to route to
        - current_intent: Classified intent label
        - router_confidence: Classification confidence (0-1)
        - router_reason: Explanation for routing decision
        - router_evidence: Debug info (logits, probs, tokens)
        - clarify: Flag if user clarification needed
    """
    from . import intent_router

    # Classify intent with context-primed routing
    new_intent, new_agent, confidence, evidence = intent_router.classify(state)

    # Store router metadata
    state["router_confidence"] = confidence
    state["router_evidence"] = evidence
    state["last_intent"] = state.get("current_intent")

    # Apply continuity decision (hysteresis)
    decision = intent_router.continuity_decision(state, new_intent, new_agent, confidence)
    state["router_reason"] = decision["reason"]

    # Determine target agent based on decision
    if decision["decision"] == "stick" and state.get("active_domain"):
        # Stick with current domain
        target_agent = state["active_domain"]
        state["current_intent"] = state.get("current_intent") or new_intent
        logger.info(
            f"[ROUTER] STICK decision: maintaining {target_agent} "
            f"(reason: {decision['reason']})"
        )

    elif decision["decision"] == "clarify":
        # Ask for clarification, don't change domain
        target_agent = state.get("active_domain") or "general_conversation_agent"
        state["clarify"] = True
        state["current_intent"] = new_intent
        logger.info(
            f"[ROUTER] CLARIFY decision: staying in {target_agent} "
            f"(reason: {decision['reason']}, conf={confidence:.3f})"
        )

    else:
        # Switch to new domain
        target_agent = new_agent
        state["current_intent"] = new_intent
        state["active_domain"] = new_agent
        logger.info(
            f"[ROUTER] SWITCH decision: {state.get('active_domain')} → {target_agent} "
            f"(reason: {decision['reason']}, conf={confidence:.3f})"
        )

    state["target_agent"] = target_agent

    return state
