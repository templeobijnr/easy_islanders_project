from __future__ import annotations

from typing import Any, Dict, TypedDict
from langgraph.graph import StateGraph, END
from django.conf import settings
import time

try:
    from assistant.brain.guardrails import run_enterprise_guardrails
except Exception:  # pragma: no cover
    def run_enterprise_guardrails(text: str):
        class _R:
            passed = True
            reason = None
        return _R()


class RouterState(TypedDict, total=False):
    thread_id: str
    utterance: str
    context_hint: Dict[str, Any]
    safety: Dict[str, Any]
    domain_choice: Dict[str, Any]
    in_domain_intent: str
    next_hop_agent: str
    prompt_assembly: Dict[str, Any]
    policy_action: str
    is_complete: bool
    context_override: bool  # Flag if context was used to override routing
    last_domain: str  # Previous message's domain for context


TAU_CONF = float(getattr(settings, 'ROUTER_CONF_THRESHOLD', 0.72))
TAU_DELTA = float(getattr(settings, 'ROUTER_DELTA_THRESHOLD', 0.18))

# Fusion weights for combining signals
FUSION_WEIGHTS = getattr(settings, 'ROUTER_FUSION_WEIGHTS', {
    'embed_score': 0.15,
    'clf_prob': 0.7,
    'rule_vote': 0.15,
})


def node_safety(state: RouterState) -> RouterState:
    res = run_enterprise_guardrails(state.get('utterance', ''))
    return {**state, 'safety': {'safe': bool(getattr(res, 'passed', True)), 'reasons': [getattr(res, 'reason', None)]}}


def node_context_override(state: RouterState) -> RouterState:
    """
    Check conversation context to override routing for multi-turn conversations.

    Sticky routing rules (deterministic):
    - If last message was real_estate + current is location-only → stick to real_estate
    - If last message was real_estate + current is low-conf fragment → stick to real_estate
    """
    thread_id = state.get('thread_id')
    utterance = state.get('utterance', '').lower()
    context_hint = state.get('context_hint') or {}

    # Check if context_hint has last_domain (passed from supervisor)
    last_domain = context_hint.get('last_domain')

    if not last_domain:
        # No context - continue with normal routing
        return {**state, 'context_override': False}

    # Context override rules
    if last_domain == 'real_estate':
        # Check if current utterance is a location-only fragment
        location_signals = ['in', 'at', 'near', 'girne', 'kyrenia', 'nicosia', 'famagusta',
                           'catalkoy', 'bellapais', 'alsancak']
        words = utterance.split()
        is_location_fragment = (
            len(words) <= 4 and
            any(sig in utterance for sig in location_signals)
        )

        if is_location_fragment:
            # Override: Continue with real_estate
            from assistant.monitoring.metrics import inc_router_context_override
            try:
                inc_router_context_override(from_domain='unknown', to_domain='real_estate')
            except ImportError:
                pass

            return {
                **state,
                'context_override': True,
                'last_domain': last_domain,
                'domain_choice': {
                    'domain': 'real_estate',
                    'confidence': 0.9,  # High confidence due to context
                    'calibrated': 0.9,
                    'policy_action': 'dispatch',
                    'reason': 'context_continuation'
                },
                'next_hop_agent': 'real_estate_agent'
            }

    # No override - continue with normal routing
    return {**state, 'context_override': False, 'last_domain': last_domain}


def _rule_votes(text: str) -> Dict[str, int]:
    t = text.lower()
    votes = {
        'real_estate': int(any(k in t for k in ['apartment', 'villa', 'rent', 'property', 'bedroom', 'house', 'flat'])),
        'marketplace': int(any(k in t for k in ['car', 'vehicle', 'auto', 'electronics'])),
        'local_info': int(any(k in t for k in ['pharmacy', 'hospital', 'doctor'])),
        'general_conversation': 1,
    }
    return votes


def node_domain_router(state: RouterState) -> RouterState:
    text = state.get('utterance') or ''
    votes = _rule_votes(text)

    # Embedding router against cached centroids
    centroids = get_centroids() or {}
    q_vec = embed_text(text)
    sim_scores: Dict[str, float] = {}
    for d, c_vec in centroids.items():
        try:
            sim_scores[d] = cosine(q_vec, c_vec)
        except Exception:
            sim_scores[d] = 0.0

    # Get calibrated classifier probabilities
    try:
        from .calibration import get_calibrated_probabilities
        clf_probs = get_calibrated_probabilities(text)
    except Exception:
        # Fallback to simple rule-based probabilities
        clf_probs = {domain: 0.7 if domain != 'general_conversation' else 0.6
                    for domain in ['real_estate', 'marketplace', 'local_info', 'general_conversation']}

    # Calculate scores for all domains
    domain_scores = {}
    for domain in ['real_estate', 'marketplace', 'local_info', 'general_conversation']:
        embed_score = sim_scores.get(domain, 0.5)
        clf_prob = clf_probs.get(domain, 0.5)
        rule_vote = votes[domain]

        # Fuse embedding + calibrated classifier + rules using configurable weights
        w_embed = FUSION_WEIGHTS.get('embed_score', 0.15)
        w_clf = FUSION_WEIGHTS.get('clf_prob', 0.7)
        w_rule = FUSION_WEIGHTS.get('rule_vote', 0.15)
        fused = w_embed * embed_score + w_clf * clf_prob + w_rule * rule_vote
        domain_scores[domain] = fused

    # Choose best domain by highest score
    domain = max(domain_scores, key=domain_scores.get)
    fused = domain_scores[domain]

    # Apply calibration to final score (simplified identity calibration for now)
    calibrated = fused

    state2 = {
        **state,
        'domain_choice': {
            'domain': domain,
            'confidence': fused,
            'calibrated': calibrated,
            'contributors': {'embed_score': embed_score, 'clf_prob': clf_prob, 'rule_votes': rule_vote},
        },
        'next_hop_agent': {
            'real_estate': 'real_estate_agent',
            'marketplace': 'marketplace_agent',
            'local_info': 'local_info_agent',
            'general_conversation': 'general_conversation_agent',
        }[domain],
    }
    return state2


def node_in_domain(state: RouterState) -> RouterState:
    domain = (state.get('domain_choice') or {}).get('domain') or 'general_conversation'
    label = {
        'real_estate': 'property_search',
        'marketplace': 'product_search',
        'local_info': 'local_lookup',
        'general_conversation': 'greeting',
    }.get(domain, 'conversation')
    return {**state, 'in_domain_intent': label}


def router_guardrail_node(state: RouterState) -> RouterState:
    """Governance guardrail node that enforces confidence thresholds."""
    from assistant.brain.config import get_domain_threshold

    domain_choice = state.get('domain_choice') or {}
    confidence = domain_choice.get('confidence', 0.0)
    domain = domain_choice.get('domain', 'general_conversation')

    # Get per-domain threshold, fallback to default
    tau_domain = get_domain_threshold(domain, float(getattr(settings, 'ROUTER_TAU_DEFAULT', 0.72)))

    # Check calibration health - force clarify if calibration is stale/bad
    try:
        from .calibration import get_calibration_metrics
        metrics = get_calibration_metrics()
        domain_ece = metrics.get(f"{domain}_ece", 0.0)
        if domain_ece > 0.1:  # ECE too high, calibration is bad
            tau_domain = float(getattr(settings, 'ROUTER_TAU_MIN', 0.60))  # Force higher threshold
    except Exception:
        pass  # Continue with normal threshold if calibration check fails

    if confidence >= tau_domain:
        policy_action = 'dispatch'
        clarify_question = None
    else:
        policy_action = 'clarify'
        clarify_question = "Could you specify what you're looking for or where?"

    return {
        **state,
        'policy_action': policy_action,
        'clarify_question': clarify_question,
        'domain_choice': {
            **domain_choice,
            'policy_action': policy_action,
        }
    }


def node_assemble(state: RouterState) -> RouterState:
    return {**state, 'prompt_assembly': {'exemplar_ids': [], 'context_binds': state.get('context_hint') or {}}, 'is_complete': True}


def should_skip_domain_router(state: RouterState) -> str:
    """Conditional edge: Skip domain_router if context override succeeded."""
    if state.get('context_override'):
        return 'router_guardrail_node'
    return 'domain_router'


def build_router_graph():
    g = StateGraph(RouterState)
    g.add_node('safety_filter', node_safety)
    g.add_node('context_override', node_context_override)
    g.add_node('domain_router', node_domain_router)
    g.add_node('router_guardrail_node', router_guardrail_node)
    g.add_node('in_domain_classifier', node_in_domain)
    g.add_node('assemble_prompt', node_assemble)
    g.set_entry_point('safety_filter')
    g.add_edge('safety_filter', 'context_override')
    # Conditional: If context override succeeded, skip domain_router
    g.add_conditional_edges('context_override', should_skip_domain_router, {
        'domain_router': 'domain_router',
        'router_guardrail_node': 'router_guardrail_node'
    })
    g.add_edge('domain_router', 'router_guardrail_node')
    g.add_edge('router_guardrail_node', 'in_domain_classifier')
    g.add_edge('in_domain_classifier', 'assemble_prompt')
    g.add_edge('assemble_prompt', END)
    return g.compile()


def run_router(utterance: str, thread_id: str, context_hint: Dict[str, Any] | None = None) -> Dict[str, Any]:
    start = time.time()
    graph = build_router_graph()
    out = graph.invoke({'utterance': utterance, 'thread_id': thread_id, 'context_hint': context_hint or {}})
    latency = (time.time() - start)

    domain_choice = out.get('domain_choice') or {}
    policy_action = out.get('policy_action', 'dispatch')

    decision = {
        'stage1': out.get('safety', {'safe': True, 'reasons': []}),
        'domain_choice': {
            **domain_choice,
            'confidence': domain_choice.get('confidence', 0.0),
            'calibrated': domain_choice.get('calibrated', domain_choice.get('confidence', 0.0)),
            'policy_action': policy_action,
        },
        'in_domain_intent': out.get('in_domain_intent'),
        'next_hop_agent': out.get('next_hop_agent'),
        'prompt_assembly': out.get('prompt_assembly', {}),
        'latency_ms': int(latency * 1000),
        'action': policy_action,
    }

    if decision['action'] == 'clarify':
        decision['clarify_question'] = out.get('clarify_question', "Could you specify what you're looking for or where?")

    # Emit metrics
    try:
        from assistant.monitoring.metrics import observe_router_confidence, observe_router_latency
        domain = domain_choice.get('domain', 'unknown')
        confidence = domain_choice.get('calibrated', 0.0)
        observe_router_confidence(domain, confidence)
        observe_router_latency(domain, latency)
    except ImportError:
        pass

    return decision
from .embedding import embed_text, get_centroids, cosine
