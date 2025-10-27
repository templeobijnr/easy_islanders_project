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


TAU_CONF = float(getattr(settings, 'ROUTER_CONF_THRESHOLD', 0.72))
TAU_DELTA = float(getattr(settings, 'ROUTER_DELTA_THRESHOLD', 0.18))


def node_safety(state: RouterState) -> RouterState:
    res = run_enterprise_guardrails(state.get('utterance', ''))
    return {**state, 'safety': {'safe': bool(getattr(res, 'passed', True)), 'reasons': [getattr(res, 'reason', None)]}}


def _rule_votes(text: str) -> Dict[str, int]:
    t = text.lower()
    votes = {
        'real_estate': int(any(k in t for k in ['apartment', 'villa', 'rent', 'property'])),
        'marketplace': int(any(k in t for k in ['car', 'vehicle', 'auto', 'electronics'])),
        'local_info': int(any(k in t for k in ['pharmacy', 'hospital', 'doctor'])),
        'general_conversation': 1,
    }
    return votes


def node_domain_router(state: RouterState) -> RouterState:
    text = state.get('utterance') or ''
    votes = _rule_votes(text)
    # Placeholder fusion with rules only; classifier/embedding can be added later
    domain = max(votes, key=votes.get)
    clf_prob = 0.7 if domain != 'general_conversation' else 0.6
    embed_score = 0.5
    rule_vote = votes[domain]
    fused = 0.15 * embed_score + 0.7 * clf_prob + 0.15 * rule_vote
    action = 'dispatch'
    state2 = {
        **state,
        'domain_choice': {
            'domain': domain,
            'confidence': fused,
            'contributors': {'embed_score': embed_score, 'clf_prob': clf_prob, 'rule_votes': rule_vote},
            'calibrated': fused,
            'policy_action': action,
        },
        'next_hop_agent': {
            'real_estate': 'real_estate_agent',
            'marketplace': 'marketplace_agent',
            'local_info': 'local_info_agent',
            'general_conversation': 'general_conversation_agent',
        }[domain],
        'policy_action': action,
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


def node_assemble(state: RouterState) -> RouterState:
    return {**state, 'prompt_assembly': {'exemplar_ids': [], 'context_binds': state.get('context_hint') or {}}, 'is_complete': True}


def build_router_graph():
    g = StateGraph(RouterState)
    g.add_node('safety_filter', node_safety)
    g.add_node('domain_router', node_domain_router)
    g.add_node('in_domain_classifier', node_in_domain)
    g.add_node('prompt_assembly', node_assemble)
    g.set_entry_point('safety_filter')
    g.add_edge('safety_filter', 'domain_router')
    g.add_edge('domain_router', 'in_domain_classifier')
    g.add_edge('in_domain_classifier', 'prompt_assembly')
    g.add_edge('prompt_assembly', END)
    return g.compile()


def run_router(utterance: str, thread_id: str, context_hint: Dict[str, Any] | None = None) -> Dict[str, Any]:
    start = time.time()
    graph = build_router_graph()
    out = graph.invoke({'utterance': utterance, 'thread_id': thread_id, 'context_hint': context_hint or {}})
    latency = (time.time() - start)
    return {
        'stage1': out.get('safety', {'safe': True, 'reasons': []}),
        'domain_choice': out.get('domain_choice'),
        'in_domain_intent': out.get('in_domain_intent'),
        'next_hop_agent': out.get('next_hop_agent'),
        'prompt_assembly': out.get('prompt_assembly', {}),
        'latency_ms': int(latency * 1000),
        'action': out.get('policy_action', 'dispatch'),
    }

