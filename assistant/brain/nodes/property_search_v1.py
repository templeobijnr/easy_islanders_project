from __future__ import annotations
from typing import Any, Dict, List

import logging

from assistant.agents.real_estate.tools_v1 import search_properties_v1
from assistant.agents.real_estate.schema import PropertyCard

logger = logging.getLogger(__name__)


def _extract_property_search_params(state: Dict[str, Any]) -> Dict[str, Any]:
    """Map structured intent attributes + raw user input into search_properties_v1 params."""
    intent = state.get("intent_result") or state.get("intent")
    user_input: str = state.get("user_input") or state.get("final_user_message") or ""

    if intent is None:
        logger.warning("property_search_v1_node: missing intent_result; falling back to text-only search")
        return {"query_text": user_input}

    attributes = getattr(intent, "attributes", None) or getattr(intent, "slots", None) or {}
    if not isinstance(attributes, dict):
        attributes = {}

    params: Dict[str, Any] = {
        "query_text": user_input,
        "location": attributes.get("location"),
        "bedrooms": attributes.get("bedrooms"),
        "budget": attributes.get("budget"),
        "tenure": attributes.get("tenure"),
        "bathrooms": attributes.get("bathrooms"),
        "property_type": attributes.get("property_type"),
    }

    return params


def property_search_v1_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Enterprise agent node for PROPERTY_SEARCH using real-estate v1 stack."""
    intent = state.get("intent_result") or state.get("intent")
    if intent is not None:
        intent_type = getattr(intent, "intent_type", None)
        category = getattr(intent, "category", None)
        if intent_type != "property_search" or category != "PROPERTY":
            logger.warning(
                "property_search_v1_node: unexpected intent",
                intent_type=intent_type,
                category=category,
            )

    params = _extract_property_search_params(state)
    logger.info("property_search_v1_node.search_invocation", params=params)

    try:
        cards: List[PropertyCard] = search_properties_v1(params)
    except Exception as exc:  # noqa: BLE001
        logger.exception("property_search_v1_node.search_failed", error=str(exc))
        state["recommendations"] = []
        state["final_response"] = (
            "I had a problem searching properties just now. "
            "Please try again in a moment or adjust your criteria."
        )
        debug_info = state.setdefault("real_estate_debug", {})
        debug_info["error"] = str(exc)
        return state

    items: List[PropertyCard] = cards or []
    summary = None
    debug_info: Dict[str, Any] = {}

    if not summary:
        count = len(items)
        if count == 0:
            summary = (
                "I couldn't find any properties that match these criteria. "
                "We can widen the area, budget, or number of rooms if you like."
            )
        else:
            summary = f"I found {count} properties that match your criteria."

    state["recommendations"] = items  # RecItem v1 list
    state["final_response"] = summary
    state["real_estate_debug"] = debug_info

    logger.info(
        "property_search_v1_node.search_success",
        results=len(items),
        has_summary=bool(summary),
    )

    return state
