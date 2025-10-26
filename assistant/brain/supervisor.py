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
            context = {
                "language": language,
                "location": location,
                "last_action": state.get("current_node", "conversation_start"),
                "history_summary": "",  # Could be enriched from message history
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

            normalized_decision = {
                "intent_type": intent_result.intent_type,
                "category": intent_result.category,
                "confidence": getattr(intent_result, "confidence", None),
                "triggered_flow": intent_result.triggered_flow,
                "primary_node": intent_result.primary_node,
                "attributes": intent_result.attributes,
                "requires_hitl": intent_result.requires_hitl,
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
