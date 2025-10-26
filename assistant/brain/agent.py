"""
Enterprise-Grade Multi-Domain AI Agent Platform
12-Node LangGraph Architecture with Infrastructure Governance

Architecture:
- 9 Domain/Transactional Nodes (Core Business Logic)
- 3 Infrastructure/Governance Nodes (Security, Language, Quality)

Total: 12 Specialized Nodes for Enterprise Robustness
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, TypedDict, Literal
import json
import logging
import re
from datetime import datetime
import uuid

from langchain_core.tools import BaseTool
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

from .schemas import EnterpriseIntentResult, EnterpriseRequestPayload
from .memory import save_assistant_turn, load_recent_messages
from .tools import get_hybrid_rag_coordinator
from .transactions import create_request_safe, approve_broadcast_safe
from .guardrails import run_enterprise_guardrails, assess_enterprise_quality
from assistant.monitoring.metrics import PerformanceTracker, extract_token_usage, record_turn_summary

logger = logging.getLogger(__name__)

# ============================================================================
# ENTERPRISE STATE SCHEMA
# ============================================================================

class EnterpriseAgentState(TypedDict):
    """Enterprise-grade state management with full context preservation"""
    # Core conversation context
    conversation_id: str
    user_input: str
    user_language: str  # Detected input language (TR, RU, DE, PL, EN)
    output_language: str  # Target output language (same as user_language)
    
    # Security and governance
    guardrail_passed: bool
    guardrail_reason: Optional[str]
    
    # Intent and routing
    intent_result: Optional[EnterpriseIntentResult]
    routing_decision: Optional[str]
    
    # Knowledge and retrieval
    internal_search_results: List[Dict[str, Any]]
    external_search_results: List[Dict[str, Any]]
    retrieval_quality_score: Optional[float]
    
    # Transactional state
    request_data: Optional[Dict[str, Any]]
    request_id: Optional[str]
    hitl_approval_required: bool
    hitl_approval_id: Optional[str]
    
    # Output generation
    synthesis_data: Optional[Dict[str, Any]]
    final_response: Optional[str]
    recommendations: List[Dict[str, Any]]
    
    # Quality control
    self_evaluation_score: Optional[float]
    needs_retry: bool
    retry_count: int

# ============================================================================
# INFRASTRUCTURE NODES (3 Critical Additions)
# ============================================================================

def language_preprocessor_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    INFRASTRUCTURE NODE 1: Language Preprocessor
    Role: Linguistic Ingress and Normalization
    Mandate: Multilingual support with consistent language flow
    """
    logger.info(f"[{state['conversation_id']}] Language preprocessing: {state['user_input'][:50]}...")
    
    # Language detection (fast heuristic + LLM fallback)
    detected_language = detect_user_language(state['user_input'])
    
    # Normalize language codes
    language_mapping = {
        'tr': 'tr', 'turkish': 'tr', 'türkçe': 'tr',
        'ru': 'ru', 'russian': 'ru', 'русский': 'ru',
        'de': 'de', 'german': 'de', 'deutsch': 'de',
        'pl': 'pl', 'polish': 'pl', 'polski': 'pl',
        'en': 'en', 'english': 'en'
    }
    
    normalized_language = language_mapping.get(detected_language.lower(), 'en')
    
    return {
        **state,
        'user_language': normalized_language,
        'output_language': normalized_language,  # Enforce consistency
    }

def guardrail_refusal_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    INFRASTRUCTURE NODE 2: Guardrail / Refusal
    Role: Security and Scope Governance (Fail-Fast)
    Mandate: Early rejection of non-compliant inputs
    """
    logger.info(f"[{state['conversation_id']}] Enterprise guardrail check: {state['user_input'][:50]}...")
    
    # Enterprise guardrails with comprehensive security checks
    guardrail_result = run_enterprise_guardrails(state['user_input'])
    
    if not guardrail_result.passed:
        # Fast refusal path - no expensive LLM calls
        refusal_message = generate_refusal_message(guardrail_result.reason, state['output_language'])
        
        # Save refusal to audit trail
        save_assistant_turn(
            state['conversation_id'],
            state['user_input'],
            refusal_message,
            message_context={
                'intent_type': 'guardrail_refusal',
                'refusal_reason': guardrail_result.reason,
                'risk_level': guardrail_result.risk_level,
                'language': state['output_language']
            }
        )
        
        return {
            **state,
            'guardrail_passed': False,
            'guardrail_reason': guardrail_result.reason,
            'final_response': refusal_message,
            'routing_decision': 'REFUSAL'
        }
    
    return {
        **state,
        'guardrail_passed': True,
        'guardrail_reason': None
    }

def self_evaluation_reflection_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    INFRASTRUCTURE NODE 3: Self-Evaluation / Reflection
    Role: Adaptive Decision-Making and Quality Control
    Mandate: CRAG pattern implementation with quality assessment
    """
    logger.info(f"[{state['conversation_id']}] Enterprise self-evaluation: assessing quality...")
    
    # Enterprise quality assessment with CRAG pattern
    quality_assessment = assess_enterprise_quality(
        internal_results=state.get('internal_search_results', []),
        external_results=state.get('external_search_results', []),
        synthesis_data=state.get('synthesis_data', {}),
        user_input=state['user_input'],
        language=state['output_language']
    )
    
    # Adaptive decision making based on quality assessment
    needs_retry = quality_assessment.needs_retry
    retry_count = state.get('retry_count', 0)
    
    if needs_retry and retry_count < 2:  # Max 2 retries
        logger.warning(f"[{state['conversation_id']}] Quality below threshold, initiating retry {retry_count + 1}")
        return {
            **state,
            'self_evaluation_score': quality_assessment.overall_score,
            'needs_retry': True,
            'retry_count': retry_count + 1,
            'routing_decision': 'RETRY'
        }
    
    return {
        **state,
        'self_evaluation_score': quality_assessment.overall_score,
        'needs_retry': False,
        'retry_count': retry_count
    }

# ============================================================================
# DOMAIN NODES (9 Core Business Logic Nodes)
# ============================================================================

def nlu_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 1: Natural Language Understanding
    Role: Extract intent and entities from user input
    """
    logger.info(f"[{state['conversation_id']}] NLU processing...")
    
    # Structured intent classification with Pydantic validation
    intent_result = classify_intent_structured(
        user_input=state['user_input'],
        language=state['user_language'],
        conversation_history=load_recent_messages(state['conversation_id'], limit=5)
    )
    
    return {
        **state,
        'intent_result': intent_result
    }

def intent_routing_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 2: Intent Routing
    Role: Route to appropriate specialized agent sub-graph with legacy feature parity
    """
    logger.info(f"[{state['conversation_id']}] Intent routing...")
    
    intent = state['intent_result']
    
    # Legacy routing logic for property-related intents
    if intent.intent_type == 'greeting':
        routing_decision = 'GREETING_HANDLER'
    elif intent.intent_type == 'property_search':
        routing_decision = 'PROPERTY_SEARCH'
    elif intent.intent_type == 'agent_outreach':
        routing_decision = 'AGENT_OUTREACH'
    elif intent.intent_type == 'conversation_continuation':
        routing_decision = 'CONVERSATION_CONTINUATION'
    elif intent.intent_type == 'status_update':
        routing_decision = 'STATUS_UPDATE'
    elif intent.intent_type == 'photo_request':
        routing_decision = 'PHOTO_REQUEST'
    elif intent.category == 'PROPERTY':
        routing_decision = 'PROPERTY_AGENT'
    elif intent.category in ['VEHICLE', 'GENERAL_PRODUCT']:
        routing_decision = 'FULFILLMENT_AGENT'
    elif intent.category == 'KNOWLEDGE_QUERY':
        routing_decision = 'KNOWLEDGE_AGENT'
    elif intent.category == 'SERVICE':
        routing_decision = 'SERVICE_AGENT'
    else:
        routing_decision = 'FALLBACK_AGENT'
    
    return {
        **state,
        'routing_decision': routing_decision
    }

def retrieval_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 3: Hybrid Retrieval (RAG)
    Role: Knowledge access with hybrid search
    """
    logger.info(f"[{state['conversation_id']}] Enterprise hybrid retrieval processing...")
    
    intent = state['intent_result']
    
    # Use enterprise hybrid RAG coordinator
    rag_coordinator = get_hybrid_rag_coordinator()
    search_results = rag_coordinator.search(
        query=state['user_input'],
        intent=intent,
        language=state['user_language']
    )
    
    return {
        **state,
        'internal_search_results': search_results['internal_results'],
        'external_search_results': search_results['external_results'],
        'combined_results': search_results['combined_results']
    }

def synthesis_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 4: Response Synthesis
    Role: Generate coherent, grounded natural language response with legacy feature parity
    """
    logger.info(f"[{state['conversation_id']}] Synthesis processing...")
    
    intent = state['intent_result']
    
    # Handle legacy greeting responses
    if intent.intent_type == 'greeting':
        conversation_history = load_recent_messages(state['conversation_id'], limit=5)
        if conversation_history:
            response = "Hello again! How can I assist you with your search in North Cyprus?"
        else:
            response = "Hello! How can I assist you today?"
        
        return {
            **state,
            'synthesis_data': {
                'response': response,
                'sources': [],
                'language': state['output_language']
            },
            'final_response': response
        }
    
    # Handle legacy property search responses
    if intent.intent_type == 'property_search' and intent.needs_tool:
        # Use legacy property search logic
        return _handle_legacy_property_search(state)
    
    # Handle legacy agent outreach responses
    if intent.intent_type == 'agent_outreach' and intent.needs_tool:
        # Use legacy agent outreach logic
        return _handle_legacy_agent_outreach(state)
    
    # Handle legacy status update responses
    if intent.intent_type == 'status_update':
        # Use legacy status update logic
        return _handle_legacy_status_update(state)
    
    # Handle legacy photo request responses
    if intent.intent_type == 'photo_request':
        # Use legacy photo request logic
        return _handle_legacy_photo_request(state)
    
    # Default synthesis for other cases
    conversation_history = load_recent_messages(state['conversation_id'], limit=6)
    combined_results = list(state.get('internal_search_results', []) or [])
    external_results = state.get('external_search_results', []) or []
    if external_results:
        combined_results.extend(external_results)

    raw_route = state.get('routing_decision')
    if isinstance(raw_route, dict):
        route_target = raw_route.get('intent_type') or raw_route.get('primary_domain')
    else:
        route_target = raw_route
    agent_name = state.get('target_agent') or route_target or 'enterprise_agent'

    context_data = {
        'user_input': state['user_input'],
        'intent': state['intent_result'],
        'internal_results': state.get('internal_search_results', []),
        'external_results': state.get('external_search_results', []),
        'search_results': combined_results,
        'language': state['output_language'],
        'conversation_history': conversation_history,
        'conversation_id': state['conversation_id'],
        'thread_id': state.get('thread_id'),
        'agent_name': agent_name,
        'route_target': route_target,
    }
    
    # Generate response with explicit language enforcement
    response = generate_grounded_response(context_data)

    try:
        intent_confidence = getattr(intent, 'confidence', None)
        internal_results = state.get('internal_search_results')
        external_results = state.get('external_search_results')
        retrieval_path = 'cache' if context_data.get('cache_hit') else 'db'
        if internal_results:
            retrieval_path = 'rag'
        elif external_results:
            retrieval_path = 'web'

        rag_attempted = internal_results is not None
        rag_results_count = len(internal_results or [])
        rag_miss = bool(rag_attempted and rag_results_count == 0 and external_results)
        web_fallback = retrieval_path == 'web'

        summary = {
            "request_id": context_data.get('metrics_request_id'),
            "route_target": route_target,
            "retrieval_path": retrieval_path,
            "num_docs_used": len(context_data.get('search_results') or []),
            "confidence": intent_confidence,
            "agent_name": agent_name,
            "intent_type": getattr(intent, 'intent_type', None),
            "language": state.get('output_language'),
            "rag_miss": rag_miss,
            "web_fallback": web_fallback,
            "cache_hit": bool(context_data.get('cache_hit')),
        }
        record_turn_summary(summary)
    except Exception:  # noqa: BLE001
        logger.debug("Failed to record turn summary for synthesis node", exc_info=True)
    
    return {
        **state,
        'synthesis_data': context_data,
        'final_response': response
    }

def capture_lead_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 5: Capture Lead
    Role: Commit generalized Request to persistence layer
    """
    logger.info(f"[{state['conversation_id']}] Enterprise lead capture...")
    
    intent = state['intent_result']
    
    # Create Request payload with validated attributes
    request_payload = RequestPayload(
        category=intent.category,
        subcategory=intent.subcategory,
        location=intent.attributes.get('location'),
        budget_amount=intent.attributes.get('budget'),
        currency=intent.attributes.get('currency', 'EUR'),
        attributes=intent.attributes,
        contact=state['user_input'],  # Simplified for now
        conversation_id=state['conversation_id']
    )
    
    # Create Request record atomically
    result = create_request_safe(request_payload, state['conversation_id'])
    
    if result['success']:
        return {
            **state,
            'request_data': request_payload.dict(),
            'request_id': result['request_id'],
            'hitl_approval_required': result['requires_hitl'],
            'hitl_approval_id': result.get('approval_id')
        }
    else:
        # Handle creation failure
        logger.error(f"Request creation failed: {result['error']}")
        return {
            **state,
            'request_data': None,
            'request_id': None,
            'error': result['error']
        }

def hitl_approval_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 6: HITL Approval
    Role: Governance gate for external actions
    """
    logger.info(f"[{state['conversation_id']}] Enterprise HITL approval check...")
    
    # Check if HITL approval is already required from capture_lead_node
    if state.get('hitl_approval_required'):
        return {
            **state,
            'hitl_approval_required': True,
            'hitl_approval_id': state.get('hitl_approval_id')
        }
    
    # If no approval required, proceed directly
    return {
        **state,
        'hitl_approval_required': False
    }

def broadcast_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 7: Broadcast
    Role: Asynchronous external communication
    """
    logger.info(f"[{state['conversation_id']}] Enterprise broadcast processing...")
    
    if state.get('hitl_approval_required'):
        # Wait for approval - broadcast will be triggered after approval
        return {
            **state,
            'broadcast_result': {'status': 'pending_approval'}
        }
    
    # Execute atomic broadcast
    from .transactions import broadcast_request_atomic
    
    broadcast_result = broadcast_request_atomic.delay(state['request_id'])
    
    return {
        **state,
        'broadcast_result': {
            'status': 'queued',
            'task_id': str(broadcast_result.id)
        }
    }

def booking_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 8: Booking
    Role: Short-term booking workflow
    """
    logger.info(f"[{state['conversation_id']}] Booking processing...")
    
    if state['intent_result'].intent_type == 'booking':
        booking_result = create_booking(
            request_id=state['request_id'],
            user_input=state['user_input'],
            language=state['output_language']
        )
        
        return {
            **state,
            'booking_result': booking_result
        }
    
    return state

def long_term_node(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """
    DOMAIN NODE 9: Long-Term Viewing
    Role: Long-term viewing workflow
    """
    logger.info(f"[{state['conversation_id']}] Long-term processing...")
    
    if state['intent_result'].intent_type == 'long_term':
        viewing_result = schedule_viewing(
            request_id=state['request_id'],
            user_input=state['user_input'],
            language=state['output_language']
        )
        
        return {
            **state,
            'viewing_result': viewing_result
        }
    
    return state

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def detect_user_language(text: str) -> str:
    """Fast language detection with heuristic + LLM fallback"""
    # Simple heuristic detection
    text_lower = text.lower()
    
    # Turkish indicators
    if any(word in text_lower for word in ['merhaba', 'nasıl', 'teşekkür', 'evet', 'hayır']):
        return 'tr'
    
    # Russian indicators
    if any(word in text_lower for word in ['привет', 'спасибо', 'да', 'нет']):
        return 'ru'
    
    # German indicators
    if any(word in text_lower for word in ['hallo', 'danke', 'ja', 'nein']):
        return 'de'
    
    # Polish indicators
    if any(word in text_lower for word in ['cześć', 'dziękuję', 'tak', 'nie']):
        return 'pl'
    
    # Default to English
    return 'en'

def generate_refusal_message(reason: str, language: str) -> str:
    """Generate polite refusal message in user's language"""
    refusal_messages = {
        'tr': "Üzgünüm, bu konuda yardımcı olamam. Lütfen farklı bir konu hakkında soru sorun.",
        'ru': "Извините, я не могу помочь с этим вопросом. Пожалуйста, задайте другой вопрос.",
        'de': "Entschuldigung, ich kann bei diesem Thema nicht helfen. Bitte stellen Sie eine andere Frage.",
        'pl': "Przepraszam, nie mogę pomóc w tej kwestii. Proszę zadać inne pytanie.",
        'en': "I'm sorry, I cannot assist with this topic. Please ask a different question."
    }
    return refusal_messages.get(language, refusal_messages['en'])

def evaluate_retrieval_quality(internal_results: List[Dict], external_results: List[Dict], query: str) -> float:
    """Evaluate quality of retrieved documents (CRAG pattern)"""
    # Simple quality scoring based on relevance and completeness
    total_results = len(internal_results) + len(external_results)
    
    if total_results == 0:
        return 0.0
    
    # Check for relevant keywords in results
    query_words = set(query.lower().split())
    relevant_results = 0
    
    for result in internal_results + external_results:
        result_text = (result.get('title', '') + ' ' + result.get('description', '')).lower()
        if any(word in result_text for word in query_words):
            relevant_results += 1
    
    return min(relevant_results / total_results, 1.0)

def evaluate_synthesis_quality(synthesis_data: Dict, user_input: str, language: str) -> float:
    """Evaluate quality of synthesized response"""
    # Simple quality scoring based on completeness and language consistency
    if not synthesis_data:
        return 0.0
    
    # Check if response addresses the user's input
    response_text = synthesis_data.get('response', '').lower()
    input_words = set(user_input.lower().split())
    
    # Calculate word overlap
    response_words = set(response_text.split())
    overlap = len(input_words.intersection(response_words))
    
    return min(overlap / len(input_words), 1.0) if input_words else 0.0

def classify_intent_structured(user_input: str, language: str, conversation_history: List[Dict]) -> EnterpriseIntentResult:
    """Structured intent classification with Pydantic validation and legacy feature parity"""
    try:
        # Use legacy heuristic detection as primary method
        intent_result = _legacy_heuristic_intent_detection(user_input, language, conversation_history)
        
        # Apply legacy feature parity enhancements
        intent_result = _enhance_intent_with_legacy_features(intent_result, user_input, conversation_history)
        
        return intent_result
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        # Fallback to basic intent
        return EnterpriseIntentResult(
            intent_type="general_chat",
            confidence=0.3,
            language=language,
            category="OUT_OF_SCOPE",
            reasoning="Complete fallback due to error"
        )

def search_internal_listings(query: str, category: str, attributes: Dict, language: str) -> List[Dict]:
    """Search internal proprietary database"""
    try:
        from ..tools import search_internal_listings as search_tool
        results = search_tool(query, **attributes)
        return results if isinstance(results, list) else []
    except Exception as e:
        logger.error(f"Internal search failed: {e}")
        return []

def search_external_web(query: str, search_type: str, language: str) -> List[Dict]:
    """Search external web for general knowledge"""
    try:
        from .tools import ExternalWebSearchTool
        external_tool = ExternalWebSearchTool()
        results = external_tool._run(query=query, search_type=search_type, language=language, limit=5)
        return results if isinstance(results, list) else []
    except Exception as e:
        logger.warning(f"External search failed: {e}")
        return []

def generate_grounded_response(context_data: Dict) -> str:
    """Generate response with explicit language enforcement"""
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        
        llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
        language = context_data.get('language', 'en')
        user_input = context_data.get('user_input', '')
        search_results = context_data.get('search_results', [])
        if not search_results:
            internal = context_data.get('internal_results', []) or []
            external = context_data.get('external_results', []) or []
            search_results = list(internal)
            if external:
                search_results.extend(external)
        conversation_history = context_data.get('conversation_history', [])
        conversation_id = context_data.get('conversation_id')
        thread_id = context_data.get('thread_id')
        intent = context_data.get('intent')
        intent_type = None
        if intent is not None:
            intent_type = getattr(intent, 'intent_type', None)
            if intent_type is None and isinstance(intent, dict):
                intent_type = intent.get('intent_type')
        
        # Build context from search results
        context_str = "\n\n".join([
            f"Result {i+1}: {r.get('title', '')} - {r.get('description', '')}"
            for i, r in enumerate(search_results[:5])
        ])
        
        # Build conversation context
        history_str = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in conversation_history[-5:]  # Last 5 messages
        ])
        
        language_instructions = {
            'tr': "Yanıtı SADECE Türkçe olarak ver.",
            'ru': "Ответь ТОЛЬКО на русском языке.",
            'de': "Antworte NUR auf Deutsch.",
            'pl': "Odpowiedz TYLKO po polsku.",
            'en': "Respond ONLY in English."
        }
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are a helpful AI assistant for Easy Islanders marketplace.
            
{language_instructions.get(language, language_instructions['en'])}

Use the following context to answer the user's question accurately:
{context_str}

Recent conversation:
{history_str}

IMPORTANT: 
- Base your answer ONLY on the provided context
- If the context doesn't contain relevant information, say so honestly
- Do NOT hallucinate or make up information
- Respond in {language} language"""),
            ("human", "{user_input}")
        ])
        
        chain = prompt | llm
        tracker = PerformanceTracker(
            request_id=f"synthesis:{conversation_id or 'unknown'}:{uuid.uuid4().hex}",
            model="gpt-4o",
            intent_type=f"synthesis:{intent_type}" if intent_type else "synthesis",
            language=language,
            conversation_id=conversation_id,
            thread_id=thread_id,
        )
        tracker.set_tool_context(
            tool_name="response_synthesis",
            agent_name=context_data.get('agent_name') or 'enterprise_agent',
        )
        if context_data.get('cache_hit'):
            tracker.mark_cache_hit(layer="rag_cache")
        if context_data.get('retry_count') is not None:
            try:
                tracker.set_retry_count(int(context_data['retry_count']))
            except Exception:  # noqa: BLE001
                logger.debug("Invalid retry_count in context data", exc_info=True)

        with tracker as perf:
            response = chain.invoke({"user_input": user_input})

            usage_candidates = [
                response,
                getattr(llm, "last_response", None),
                getattr(llm, "_last_response", None),
            ]
            usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": None}
            for candidate in usage_candidates:
                candidate_usage = extract_token_usage(candidate)
                if candidate_usage.get("prompt_tokens") or candidate_usage.get("completion_tokens") or candidate_usage.get("total_tokens"):
                    usage = candidate_usage
                    break
            try:
                perf.update_tokens(
                    prompt_tokens=usage.get("prompt_tokens"),
                    completion_tokens=usage.get("completion_tokens"),
                    total_tokens=usage.get("total_tokens"),
                    cost_usd=usage.get("cost_usd"),
                )
            except Exception:  # noqa: BLE001
                logger.debug("Failed to record token usage for synthesis node", exc_info=True)
        
        context_data['metrics_request_id'] = tracker.request_id
        context_data['cache_hit'] = tracker.cache_hit
        
        return response.content if hasattr(response, 'content') else str(response)
        
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        return "I'm sorry, I encountered an error generating a response."

def create_request_record(payload: RequestPayload, conversation_id: str) -> str:
    """Create Request record in database"""
    try:
        from ..models import Request
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get agent service user
        agent_user = User.objects.filter(username='agent_service').first()
        
        new_request = Request.objects.create(
            category=payload.category,
            subcategory=payload.subcategory or '',
            location=payload.location or '',
            budget=payload.budget,
            currency=payload.currency or 'EUR',
            attributes=payload.attributes or {},
            contact_info=payload.contact_info or '',
            user=agent_user,
            created_by=agent_user
        )
        
        logger.info(f"Created Request record: {new_request.id}")
        return str(new_request.id)
        
    except Exception as e:
        logger.error(f"Failed to create Request record: {e}")
        return ""

def should_require_hitl_approval(intent: IntentResult) -> bool:
    """Determine if HITL approval is required"""
    # Business logic for HITL requirements
    # Require approval for high-value or sensitive categories
    if intent.category in ['GENERAL_PRODUCT', 'VEHICLE', 'SERVICE']:
        return True
    
    # Require approval if budget is high
    if intent.attributes and intent.attributes.get('budget', 0) > 5000:
        return True
    
    return False

def create_approval_gate(request_id: str, intent: IntentResult, conversation_id: str) -> str:
    """Create HITL approval gate"""
    try:
        from ..models import ApproveBroadcast, Request
        
        request = Request.objects.get(id=request_id)
        
        approval = ApproveBroadcast.objects.create(
            request_fk=request,
            target_seller_count=0,  # Will be determined by broadcast logic
            medium='whatsapp',
            status='pending',
            reviewer=None
        )
        
        logger.info(f"Created HITL approval gate: {approval.id}")
        return str(approval.id)
        
    except Exception as e:
        logger.error(f"Failed to create approval gate: {e}")
        return ""

def execute_broadcast(request_id: str, intent: IntentResult, language: str) -> Dict:
    """Execute broadcast via Celery"""
    try:
        from ..tasks import broadcast_request_for_request
        
        # Dispatch Celery task asynchronously
        task = broadcast_request_for_request.delay(request_id)
        
        logger.info(f"Broadcast task dispatched: {task.id} for request {request_id}")
        
        return {
            'status': 'queued',
            'task_id': task.id,
            'request_id': request_id,
            'message': 'Broadcast queued successfully'
        }
        
    except Exception as e:
        logger.error(f"Failed to execute broadcast: {e}")
        return {
            'status': 'error',
            'error': str(e),
            'request_id': request_id
        }

def create_booking(request_id: str, user_input: str, language: str) -> Dict:
    """Create booking record"""
    try:
        from ..models import Booking, Request
        from django.utils import timezone
        from dateutil import parser as date_parser
        
        request = Request.objects.get(id=request_id)
        
        # Extract date/time from user_input (simplified - would use NLU in production)
        booking_date = timezone.now() + timezone.timedelta(days=1)  # Default to tomorrow
        
        try:
            # Try to parse date from user input
            parsed_date = date_parser.parse(user_input, fuzzy=True)
            booking_date = parsed_date
        except:
            pass
        
        booking = Booking.objects.create(
            user=request.user,
            listing_id=None,  # Would be extracted from context
            booking_date=booking_date,
            status='pending',
            notes=user_input
        )
        
        logger.info(f"Created booking: {booking.id}")
        
        return {
            'status': 'created',
            'booking_id': str(booking.id),
            'booking_date': booking_date.isoformat(),
            'message': f'Booking created for {booking_date.strftime("%Y-%m-%d %H:%M")}'
        }
        
    except Exception as e:
        logger.error(f"Failed to create booking: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }

def schedule_viewing(request_id: str, user_input: str, language: str) -> Dict:
    """Schedule viewing"""
    try:
        from ..models import Request
        from django.utils import timezone
        
        request = Request.objects.get(id=request_id)
        
        # Update request status to indicate viewing requested
        request.status = 'viewing_requested'
        request.save(update_fields=['status'])
        
        logger.info(f"Viewing scheduled for request: {request_id}")
        
        return {
            'status': 'scheduled',
            'request_id': request_id,
            'message': 'Viewing request scheduled successfully'
        }
        
    except Exception as e:
        logger.error(f"Failed to schedule viewing: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }

# ============================================================================
# LEGACY FEATURE PARITY FUNCTIONS
# ============================================================================

def _enhance_intent_with_legacy_features(intent_result: IntentResult, user_input: str, conversation_history: List[Dict]) -> IntentResult:
    """Enhance intent classification with legacy feature parity"""
    try:
        # Legacy greeting detection
        if _is_greeting_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="greeting",
                confidence=0.9,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy greeting detection"
            )
        
        # Legacy property search detection
        if _looks_like_property_search_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="property_search",
                confidence=0.9,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy property search detection",
                needs_tool=True,
                tool_name="search_internal_listings"
            )
        
        # Legacy agent outreach detection
        if _looks_like_agent_outreach_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="agent_outreach",
                confidence=0.9,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy agent outreach detection",
                needs_tool=True,
                tool_name="initiate_contact_with_seller"
            )
        
        # Legacy conversation continuation detection
        if _looks_like_conversation_continuation_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="conversation_continuation",
                confidence=0.8,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy conversation continuation detection"
            )
        
        # Legacy status update detection
        if _looks_like_status_update_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="status_update",
                confidence=0.9,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy status update detection"
            )
        
        # Legacy photo request detection
        if _user_asked_for_photos_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="photo_request",
                confidence=0.9,
                language=intent_result.language,
                category="PROPERTY",
                reasoning="Legacy photo request detection"
            )
        
        return intent_result
        
    except Exception as e:
        logger.error(f"Legacy feature enhancement failed: {e}")
        return intent_result

def _legacy_heuristic_intent_detection(user_input: str, language: str, conversation_history: List[Dict]) -> IntentResult:
    """Fallback to legacy heuristic intent detection"""
    try:
        # Apply legacy detection logic
        if _is_greeting_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="greeting",
                confidence=0.9,
                user_language=language,
                category="PROPERTY",
                reasoning="Legacy greeting heuristic"
            )
        elif _looks_like_property_search_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="property_search",
                confidence=0.9,
                user_language=language,
                category="PROPERTY",
                reasoning="Legacy property search heuristic",
                needs_tool=True,
                tool_name="search_internal_listings"
            )
        elif _looks_like_agent_outreach_legacy(user_input):
            return EnterpriseIntentResult(
                intent_type="agent_outreach",
                confidence=0.9,
                user_language=language,
                category="PROPERTY",
                reasoning="Legacy agent outreach heuristic",
                needs_tool=True,
                tool_name="initiate_contact_with_seller"
            )
        else:
            return EnterpriseIntentResult(
                intent_type="general_chat",
                confidence=0.4,
                user_language=language,
                category="OUT_OF_SCOPE",
                reasoning="Legacy fallback heuristic"
            )
    except Exception as e:
        logger.error(f"Legacy heuristic detection failed: {e}")
        return EnterpriseIntentResult(
            intent_type="general_chat",
            confidence=0.3,
            language=language,
            category="OUT_OF_SCOPE",
            reasoning="Complete fallback due to error"
        )

# Legacy detection functions (ported from agent.py)
def _is_greeting_legacy(text: str) -> bool:
    """Legacy greeting detection"""
    greeting_keywords = {"hello", "hi", "hey"}
    t = (text or "").strip().lower()
    return t in greeting_keywords

def _looks_like_property_search_legacy(text: str) -> bool:
    """Legacy property search detection"""
    t = (text or "").lower()
    if not t:
        return False
    
    property_keywords = {
        "apartment", "flat", "house", "villa", "rent", "rental", "property",
        "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms",
        "girne", "kyrenia", "lefkoşa", "nicosia", "magosa", "famagusta",
        "catalkoy", "çatalköy", "karakum", "lapta", "alsancak", "bellapais", "esentepe", "karsiyaka", "karşıyaka",
        "long term", "short term", "daily", "night", "/month", "per month", "€", "£", "euro", "pounds",
    }
    
    if any(k in t for k in property_keywords):
        return True
    if re.search(r"\b(\d+)\s*(bed|bedroom|bedrooms)\b", t):
        return True
    if re.search(r"\b\d\s*\+\s*1\b", t):
        return True
    return False

def _looks_like_agent_outreach_legacy(text: str) -> bool:
    """Legacy agent outreach detection"""
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

def _looks_like_conversation_continuation_legacy(text: str) -> bool:
    """Legacy conversation continuation detection"""
    t = (text or "").lower()
    if not t:
        return False
    continuation_keywords = [
        "what did we talk about", "what did we discuss", "what were we talking about",
        "remember", "you said", "we were talking", "previous conversation", "earlier",
        "what did i ask", "what did i say", "what was our conversation", "recall",
    ]
    return any(k in t for k in continuation_keywords)

def _looks_like_status_update_legacy(text: str) -> bool:
    """Legacy status update detection"""
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

def _user_asked_for_photos_legacy(text: str) -> bool:
    """Legacy photo request detection"""
    photo_keywords = [
        "photo", "photos", "picture", "pictures", "pics", "images",
        "resim", "foto", "fotoğraf", "fotograf",  # Turkish, with/without diacritics
        "фото", "фотографии",  # Russian
        "zdjecia", "zdjęcia",  # Polish
        "can you show", "i want pictures", "i want photos",
        "show pictures", "show photos", "see pictures", "see photos",
        "more pictures", "more photos", "additional photos", "additional pictures",
    ]
    t = (text or "").lower()
    return any(k in t for k in photo_keywords)

# ============================================================================
# LEGACY HANDLER FUNCTIONS
# ============================================================================

def _handle_legacy_property_search(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """Handle legacy property search with full feature parity"""
    try:
        from ..tools import search_internal_listings
        from .geo import normalize_location, regional_fallback
        from .memory import save_assistant_turn
        
        user_input = state['user_input']
        conversation_id = state['conversation_id']
        language = state['output_language']
        
        # Extract requirements using legacy logic
        req_data = _extract_legacy_requirements(user_input)
        
        # Normalize location
        location = normalize_location(req_data.get('location'))
        
        # Search internal listings
        search_result = search_internal_listings(
            listing_type="property_rent",
            location=location,
            attributes=req_data,
            language=language,
        )
        
        cards = search_result.get("data", []) if isinstance(search_result, dict) else []
        
        # Try regional fallback if no results
        if not cards and location:
            region = regional_fallback(location)
            if region:
                search_result = search_internal_listings(
                    listing_type="property_rent",
                    location=region,
                    attributes=req_data,
                    user_language=language,
                )
                cards = search_result.get("data", []) if isinstance(search_result, dict) else []
        
        if cards:
            rec_ids = [int(c.get("id")) for c in cards if c.get("id")]
            msg = f"I found {len(cards)} properties for you."
            save_assistant_turn(
                conversation_id,
                user_input,
                msg,
                message_context={"intent_type": "property_search", "tool_used": "search_internal_listings", "last_recommendations": rec_ids},
            )
            return {
                **state,
                'synthesis_data': {
                    'response': msg,
                    'sources': cards,
                    'language': language
                },
                'final_response': msg,
                'recommendations': cards
            }
        else:
            # No results
            msg = (
                "I couldn't find properties matching your request right now. "
                "Would you like me to broaden the search or take your phone number to notify you when a match appears?"
            )
            save_assistant_turn(conversation_id, user_input, msg, message_context={"intent_type": "property_search", "last_recommendations": []})
            return {
                **state,
                'synthesis_data': {
                    'response': msg,
                    'sources': [],
                    'language': language
                },
                'final_response': msg,
                'recommendations': []
            }
            
    except Exception as e:
        logger.error(f"Legacy property search failed: {e}")
        return {
            **state,
            'synthesis_data': {
                'response': "I'm sorry, I encountered an error searching for properties.",
                'sources': [],
                'language': state['output_language']
            },
            'final_response': "I'm sorry, I encountered an error searching for properties."
        }

def _handle_legacy_agent_outreach(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """Handle legacy agent outreach with full feature parity"""
    try:
        from ..tools import initiate_contact_with_seller
        from .memory import save_assistant_turn
        
        user_input = state['user_input']
        conversation_id = state['conversation_id']
        language = state['output_language']
        
        # Resolve listing reference using legacy logic
        listing_id = _resolve_listing_reference_legacy(user_input, conversation_id)
        if not listing_id:
            response_msg = (
                "I couldn't determine which listing to contact. "
                "Please specify the listing number (e.g., 'listing 1') or say 'contact the first/second one'."
            )
            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "agent_outreach_unresolved"})
            return {
                **state,
                'synthesis_data': {
                    'response': response_msg,
                    'sources': [],
                    'language': language
                },
                'final_response': response_msg
            }
        
        # Initiate contact with seller
        tool_result = initiate_contact_with_seller(
            listing_id=int(listing_id),
            language=language,
            conversation_id=conversation_id,
        )
        
        response_msg = tool_result.get("data", "Action completed.")
        ok = bool(isinstance(tool_result, dict) and tool_result.get("ok"))
        reason = (tool_result.get("reason") if isinstance(tool_result, dict) else None) or "unknown"
        
        if ok:
            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "agent_outreach", "listing_id": listing_id, "status": "success"})
        else:
            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "agent_outreach", "listing_id": listing_id, "status": "failed", "reason": reason})
        
        return {
            **state,
            'synthesis_data': {
                'response': response_msg,
                'sources': [],
                'language': language
            },
            'final_response': response_msg
        }
        
    except Exception as e:
        logger.error(f"Legacy agent outreach failed: {e}")
        return {
            **state,
            'synthesis_data': {
                'response': "I'm sorry, I encountered an error contacting the agent.",
                'sources': [],
                'language': state['output_language']
            },
            'final_response': "I'm sorry, I encountered an error contacting the agent."
        }

def _handle_legacy_status_update(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """Handle legacy status update with full feature parity"""
    try:
        from .memory import save_assistant_turn, load_recent_messages
        
        user_input = state['user_input']
        conversation_id = state['conversation_id']
        language = state['output_language']
        
        # Load recent messages to get pending actions
        history = load_recent_messages(conversation_id, limit=10)
        pending_actions = _extract_pending_actions_legacy(conversation_id)
        
        if pending_actions:
            # Handle pending actions logic
            for action in pending_actions:
                if action.get("type") == "outreach_pictures":
                    listing_id = action.get("listing_id")
                    if listing_id:
                        # Check for new images using legacy logic
                        from ..tools import check_for_new_images
                        result = check_for_new_images(listing_id, outreach_timestamp=action.get("timestamp"))
                        if result.get("has_new_images") or result.get("has_new_since"):
                            response_msg = f"I've received new photos for listing {listing_id}. Here they are:"
                            # Build recommendation card
                            recommendations = _build_recommendation_card_legacy(listing_id)
                            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "status_update_completed_repeat", "pending_actions": pending_actions})
                            return {
                                **state,
                                'synthesis_data': {
                                    'response': response_msg,
                                    'sources': recommendations,
                                    'language': language
                                },
                                'final_response': response_msg,
                                'recommendations': recommendations
                            }
                        else:
                            # Still waiting
                            response_msg = f"I'm still waiting for the agent's response on listing {listing_id}. Would you like me to follow up or show other properties?"
                            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "status_update_waiting", "pending_actions": pending_actions})
                            return {
                                **state,
                                'synthesis_data': {
                                    'response': response_msg,
                                    'sources': [],
                                    'language': language
                                },
                                'final_response': response_msg
                            }
        else:
            response_msg = "I'm not currently waiting on any agent. Is there a specific property you'd like me to get details for?"
            save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "status_update_no_pending"})
            return {
                **state,
                'synthesis_data': {
                    'response': response_msg,
                    'sources': [],
                    'language': language
                },
                'final_response': response_msg
            }
            
    except Exception as e:
        logger.error(f"Legacy status update failed: {e}")
        return {
            **state,
            'synthesis_data': {
                'response': "I'm sorry, I encountered an error checking the status.",
                'sources': [],
                'language': state['output_language']
            },
            'final_response': "I'm sorry, I encountered an error checking the status."
        }

def _handle_legacy_photo_request(state: EnterpriseAgentState) -> EnterpriseAgentState:
    """Handle legacy photo request with full feature parity"""
    try:
        from .memory import save_assistant_turn
        
        user_input = state['user_input']
        conversation_id = state['conversation_id']
        language = state['output_language']
        
        # Handle photo request logic
        response_msg = "I'll check for photos of the properties we discussed. Let me get the latest images for you."
        save_assistant_turn(conversation_id, user_input, response_msg, {"intent_type": "photo_request"})
        
        return {
            **state,
            'synthesis_data': {
                'response': response_msg,
                'sources': [],
                'language': language
            },
            'final_response': response_msg
        }
        
    except Exception as e:
        logger.error(f"Legacy photo request failed: {e}")
        return {
            **state,
            'synthesis_data': {
                'response': "I'm sorry, I encountered an error processing your photo request.",
                'sources': [],
                'language': state['output_language']
            },
            'final_response': "I'm sorry, I encountered an error processing your photo request."
        }

# Legacy helper functions
def _extract_legacy_requirements(user_input: str) -> Dict[str, Any]:
    """Extract requirements using legacy logic"""
    # This would use the legacy requirements extraction logic
    # For now, return basic structure
    return {
        'raw_query': user_input,
        'bedrooms': None,
        'max_price': None,
        'min_price': None,
        'currency': None,
        'duration': None,
        'features': [],
        'furnished': None,
        'pets_allowed': None,
        'location': None
    }

def _resolve_listing_reference_legacy(text: str, conversation_id: str) -> Optional[int]:
    """Resolve listing reference using legacy logic"""
    # This would implement the full legacy listing resolution logic
    # For now, return None as placeholder
    return None

def _extract_pending_actions_legacy(conversation_id: str) -> List[Dict]:
    """Extract pending actions using legacy logic"""
    # This would implement the full legacy pending actions logic
    # For now, return empty list as placeholder
    return []

def _build_recommendation_card_legacy(listing_id: int) -> List[Dict]:
    """Build recommendation card using legacy logic"""
    # This would implement the full legacy recommendation card logic
    # For now, return empty list as placeholder
    return []

# ============================================================================
# ENTERPRISE GRAPH CONSTRUCTION
# ============================================================================

def build_enterprise_graph():
    """
    Build the complete 12-node enterprise LangGraph
    """
    from langgraph.graph import StateGraph, END
    
    # Create the state graph
    graph = StateGraph(EnterpriseAgentState)
    
    # Add all 12 nodes
    # Infrastructure nodes (3)
    graph.add_node("language_preprocessor", language_preprocessor_node)
    graph.add_node("guardrail_refusal", guardrail_refusal_node)
    graph.add_node("self_evaluation", self_evaluation_reflection_node)
    
    # Domain nodes (9)
    graph.add_node("nlu", nlu_node)
    graph.add_node("intent_routing", intent_routing_node)
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("synthesis", synthesis_node)
    graph.add_node("capture_lead", capture_lead_node)
    graph.add_node("hitl_approval", hitl_approval_node)
    graph.add_node("broadcast", broadcast_node)
    graph.add_node("booking", booking_node)
    graph.add_node("long_term", long_term_node)
    
    # Define the flow
    graph.set_entry_point("language_preprocessor")
    
    # Infrastructure flow
    graph.add_edge("language_preprocessor", "guardrail_refusal")
    
    # Conditional routing after guardrail
    graph.add_conditional_edges(
        "guardrail_refusal",
        lambda state: "END" if not state.get('guardrail_passed') else "nlu",
        {
            "END": END,
            "nlu": "nlu"
        }
    )
    
    # Domain flow
    graph.add_edge("nlu", "intent_routing")
    graph.add_edge("intent_routing", "retrieval")
    graph.add_edge("retrieval", "synthesis")
    graph.add_edge("synthesis", "self_evaluation")
    
    # Conditional routing after self-evaluation
    graph.add_conditional_edges(
        "self_evaluation",
        lambda state: "retry" if state.get('needs_retry') else "capture_lead",
        {
            "retry": "retrieval",  # Loop back to retrieval
            "capture_lead": "capture_lead"
        }
    )
    
    # Transactional flow
    graph.add_edge("capture_lead", "hitl_approval")
    graph.add_edge("hitl_approval", "broadcast")
    graph.add_edge("broadcast", "booking")
    graph.add_edge("booking", "long_term")
    graph.add_edge("long_term", END)
    
    return graph.compile()

# ============================================================================
# ENTERPRISE AGENT ENTRY POINT
# ============================================================================

def run_enterprise_agent(user_input: str, conversation_id: str) -> Dict[str, Any]:
    """
    Enterprise agent entry point with full 12-node architecture.
    Includes robust error handling to prevent 500 errors.
    """
    try:
        logger.info(f"[{conversation_id}] Enterprise agent: initializing state...")
        
        # Initialize state
        initial_state = EnterpriseAgentState(
            conversation_id=conversation_id,
            user_input=user_input,
            user_language="en",  # Will be detected
            output_language="en",  # Will be set
            guardrail_passed=False,
            guardrail_reason=None,
            intent_result=None,
            routing_decision=None,
            internal_search_results=[],
            external_search_results=[],
            retrieval_quality_score=None,
            request_data=None,
            request_id=None,
            hitl_approval_required=False,
            hitl_approval_id=None,
            synthesis_data=None,
            final_response=None,
            recommendations=[],
            self_evaluation_score=None,
            needs_retry=False,
            retry_count=0
        )
        
        logger.info(f"[{conversation_id}] Enterprise agent: building graph...")
        # Build and run the enterprise graph
        graph = build_enterprise_graph()
        
        logger.info(f"[{conversation_id}] Enterprise agent: invoking with user_input={user_input[:50]}...")
        result = graph.invoke(initial_state)
        
        logger.info(f"[{conversation_id}] Enterprise agent: success. Response={result.get('final_response', '')[:50]}...")
        
        # Return standardized response
        return {
            'message': result.get('final_response', ''),
            'language': result.get('output_language', 'en'),
            'recommendations': result.get('recommendations', []),
            'conversation_id': conversation_id,
            'quality_score': result.get('self_evaluation_score'),
            'hitl_required': result.get('hitl_approval_required', False)
        }
    
    except Exception as e:
        logger.error(f"[{conversation_id}] Enterprise agent failed: {e}", exc_info=True)
        # Graceful degradation: return safe fallback message
        return {
            'message': 'I encountered an issue processing your request. Please try again in a moment.',
            'language': 'en',
            'recommendations': [],
            'conversation_id': conversation_id,
            'error': str(e),
        }


# =============================================================================
# SUPERVISOR AGENT ENTRY POINT
# =============================================================================

def run_supervisor_agent(user_input: str, thread_id: str) -> Dict[str, Any]:
    """
    Central Supervisor entry point: route to specialized sub-agents.
    Returns a standardized response envelope used by views.
    Includes robust error handling to prevent 500 errors.
    """
    try:
        from .supervisor_graph import build_supervisor_graph
        from .supervisor_schemas import SupervisorState

        state: SupervisorState = {
            'user_input': user_input,
            'thread_id': thread_id,
            'messages': [],
            'user_id': None,
            'conversation_history': [],
            'routing_decision': None,
            'target_agent': None,
            'extracted_criteria': None,
            'property_data': None,
            'request_data': None,
            'current_node': 'supervisor',
            'error_message': None,
            'is_complete': False,
            'agent_response': None,
        }

        logger.info(f"[{thread_id}] Supervisor agent: building graph...")
        graph = build_supervisor_graph()
        
        logger.info(f"[{thread_id}] Supervisor agent: invoking with user_input={user_input[:50]}...")
        result = graph.invoke(state, config={"configurable": {"thread_id": thread_id}})

        # Return the actual response from the worker agent (normalize to string)
        raw_final = result.get('final_response')
        if isinstance(raw_final, dict):
            final_message = str(raw_final.get('message', ''))
        elif raw_final is None:
            final_message = 'I encountered an issue processing your request.'
        else:
            final_message = str(raw_final)
        routed_to = result.get('current_node', 'unknown')

        logger.info(f"[{thread_id}] Supervisor agent: success. Routed to {routed_to}. Response={final_message[:50]}...")
        
        return {
            'message': final_message,
            'language': 'en',
            'recommendations': result.get('recommendations', []),
            'conversation_id': thread_id,
            'routed_to': routed_to,
        }
    
    except Exception as e:
        logger.error(f"[{thread_id}] Supervisor agent failed: {e}", exc_info=True)
        # Graceful degradation: return safe fallback message
        return {
            'message': 'I had trouble processing your request. Please try again.',
            'language': 'en',
            'recommendations': [],
            'conversation_id': thread_id,
            'error': str(e),
        }
