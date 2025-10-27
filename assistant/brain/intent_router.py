"""
Intent Router (skeleton) for multi‑stage, calibrated routing.

Stages:
- Stage 1: Safety/Governance filter (stubbed safe=True)
- Stage 2: Domain router fusion (embedding/classifier/rules — stubbed)
- Stage 3: In‑domain fine classifier (stubbed)

Provides a LangGraph graph builder returning a compiled state machine so we can
evolve stages without changing endpoint contracts.
"""

from __future__ import annotations

from typing import Any, Dict, TypedDict, Optional
from langgraph.graph import StateGraph, END
import time


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


def _stage1_safety(state: RouterState) -> RouterState:
    # Placeholder rules; extend with guardrails later
    return {
        **state,
        "safety": {"safe": True, "reasons": []},
    }


def _stage2_domain_router(state: RouterState) -> RouterState:
    text = (state.get("utterance") or "").lower()
    # Extremely simple heuristic placeholder
    if any(k in text for k in ["apartment", "rent", "villa", "property"]):
        domain = "real_estate"
        agent = "real_estate_agent"
    elif any(k in text for k in ["car", "vehicle", "auto", "motor"]):
        domain = "marketplace"
        agent = "marketplace_agent"
    elif any(k in text for k in ["pharmacy", "hospital", "doctor"]):
        domain = "local_info"
        agent = "local_info_agent"
    else:
        domain = "general_conversation"
        agent = "general_conversation_agent"

    domain_choice = {
        "domain": domain,
        "confidence": 0.75,  # placeholder calibrated score
        "contributors": {"embed_score": 0.5, "clf_prob": 0.7, "rule_votes": 1},
        "calibrated": 0.75,
        "policy_action": "dispatch",
    }
    return {
        **state,
        "domain_choice": domain_choice,
        "next_hop_agent": agent,
        "policy_action": domain_choice["policy_action"],
    }


def _stage3_in_domain(state: RouterState) -> RouterState:
    # Stub per‑domain fine classifier
    domain = (state.get("domain_choice") or {}).get("domain") or "general_conversation"
    label = {
        "real_estate": "property_search",
        "marketplace": "product_search",
        "local_info": "local_lookup",
        "general_conversation": "greeting",
    }.get(domain, "conversation")
    return {**state, "in_domain_intent": label}


def _assemble_prompt(state: RouterState) -> RouterState:
    # Stub prompt assembly (few‑shot exemplar IDs empty for now)
    return {
        **state,
        "prompt_assembly": {"exemplar_ids": [], "context_binds": state.get("context_hint") or {}},
        "is_complete": True,
    }


def build_intent_router_graph() -> Any:
    graph = StateGraph(RouterState)

    def node_safety(state: RouterState) -> RouterState:
        return _stage1_safety(state)

    def node_domain(state: RouterState) -> RouterState:
        return _stage2_domain_router(state)

    def node_fine(state: RouterState) -> RouterState:
        return _stage3_in_domain(state)

    def node_prompt(state: RouterState) -> RouterState:
        return _assemble_prompt(state)

    graph.add_node("safety", node_safety)
    graph.add_node("domain_router", node_domain)
    graph.add_node("in_domain_classifier", node_fine)
    graph.add_node("prompt_assembly", node_prompt)

    graph.set_entry_point("safety")
    graph.add_edge("safety", "domain_router")
    graph.add_edge("domain_router", "in_domain_classifier")
    graph.add_edge("in_domain_classifier", "prompt_assembly")
    graph.add_edge("prompt_assembly", END)
    return graph.compile()


def run_router(utterance: str, thread_id: str, context_hint: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Convenience helper to execute the router graph and return a stable contract."""
    start = time.time()
    state: RouterState = {
        "utterance": utterance,
        "thread_id": thread_id,
        "context_hint": context_hint or {},
    }
    graph = build_intent_router_graph()
    out: RouterState = graph.invoke(state)
    latency = int((time.time() - start) * 1000)
    return {
        "stage1": out.get("safety", {"safe": True, "reasons": []}),
        "domain_choice": out.get("domain_choice"),
        "in_domain_intent": out.get("in_domain_intent"),
        "next_hop_agent": out.get("next_hop_agent"),
        "prompt_assembly": out.get("prompt_assembly", {}),
        "latency_ms": latency,
        "action": out.get("policy_action", "dispatch"),
    }

