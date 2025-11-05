"""
Slot-filling continuity guard for real_estate_agent.

This guard prevents router flapping during slot collection by pinning
the route to real_estate_agent when the user provides refinements.
"""
import logging
from typing import Optional, Tuple
from assistant.brain.supervisor_schemas import SupervisorState, RealEstateAgentContext
from assistant.brain.config import load_re_slots_config

logger = logging.getLogger(__name__)


def _should_pin_to_real_estate(state: SupervisorState) -> Tuple[bool, Optional[str]]:
    """
    Determine if route should be pinned to real_estate_agent during slot-filling.

    Returns:
        (should_pin: bool, reason: Optional[str])

    Pinning Rules:
    1. Active domain must be real_estate_agent
    2. Agent must be in slot_filling stage
    3. User input must be a refinement (short, contains slot patterns, or refinement keywords)
    4. UNLESS user explicitly switches ("actually show me cars")
    """
    active_domain = state.get("active_domain")
    if active_domain != "real_estate_agent":
        return False, None

    # Get RE agent context
    agent_contexts = state.get("agent_contexts") or {}
    re_context_dict = agent_contexts.get("real_estate_agent", {})

    # Check if awaiting_slot is set (router continuity pin)
    # If agent is waiting for a specific slot, keep pinned to avoid router flapping
    awaiting_slot = re_context_dict.get("awaiting_slot")
    if awaiting_slot:
        logger.info(
            "[slot_filling_guard] Router continuity: awaiting_slot=%s",
            awaiting_slot,
            extra={"thread_id": state.get("thread_id")}
        )
        return True, f"awaiting_slot_{awaiting_slot}"

    # Check if in slot_filling stage
    stage = re_context_dict.get("stage", "discovery")
    if stage != "slot_filling":
        return False, None

    # Load config
    try:
        cfg = load_re_slots_config()
        guard_cfg = cfg.get("slot_filling_guard", {})
    except Exception:
        guard_cfg = {"enabled": True, "max_input_words": 7}

    if not guard_cfg.get("enabled", True):
        return False, None

    user_input = state.get("user_input", "").strip()
    words = user_input.split()
    num_words = len(words)

    # Check for explicit switch keywords (e.g., "actually show me cars")
    explicit_switch_keywords = guard_cfg.get("explicit_switch_keywords", [])
    user_input_lower = user_input.lower()

    for keyword in explicit_switch_keywords:
        if keyword in user_input_lower:
            logger.info(
                "[slot_filling_guard] Explicit switch detected: '%s'",
                keyword,
                extra={"thread_id": state.get("thread_id")}
            )
            return False, None

    # Pin if input is short (refinement)
    max_words = guard_cfg.get("max_input_words", 7)
    if num_words <= max_words:
        return True, f"short_input_{num_words}_words"

    # Pin if input contains refinement keywords
    refinement_keywords = guard_cfg.get("refinement_keywords", [])
    for keyword in refinement_keywords:
        if keyword in user_input_lower:
            return True, f"refinement_keyword_{keyword}"

    # Pin if input contains slot patterns (amounts, places)
    # Simple heuristics:
    # - Contains numbers (likely budget)
    # - Contains currency symbols
    # - Contains known cities
    if any(char.isdigit() for char in user_input):
        return True, "contains_number"

    currency_symbols = ["£", "€", "$", "₺", "gbp", "eur", "usd", "try", "pound", "euro", "dollar", "lira"]
    if any(symbol in user_input_lower for symbol in currency_symbols):
        return True, "contains_currency"

    known_cities = cfg.get("patterns", {}).get("location", {}).get("known_cities", [])
    for city in known_cities:
        if city.lower() in user_input_lower:
            return True, f"contains_city_{city}"

    return False, None


def apply_slot_filling_guard(state: SupervisorState) -> SupervisorState:
    """
    Apply slot-filling guard before routing.

    If pinning is required, override target_agent and set router_reason.
    """
    should_pin, reason = _should_pin_to_real_estate(state)

    if should_pin:
        logger.info(
            "[slot_filling_guard] Pinning to real_estate_agent: %s",
            reason,
            extra={
                "thread_id": state.get("thread_id"),
                "user_input": state.get("user_input", "")[:50],
                "reason": reason,
            }
        )

        # Override routing decision
        return {
            **state,
            "target_agent": "real_estate_agent",
            "router_reason": f"slot_filling_guard:{reason}",
            "router_confidence": 1.0,  # High confidence for pinned routes
        }

    return state
