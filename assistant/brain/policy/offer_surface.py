"""
STEP 7.2: Offer Surface Orchestrator

Coordinates availability summary, zero-result relaxation, and dialogue policy.
"""

from typing import Dict, Any, Optional
import logging
from assistant.domain.real_estate_service import availability_summary
from assistant.brain.policy.real_estate_policy import (
    POLICY_CONFIG,
    _missing_slots,
    next_question,
    criteria_text,
    build_offer_lines,
    relax_filters,
)

logger = logging.getLogger(__name__)


def real_estate_offer_surface(
    state: Dict[str, Any],
    slots: Dict[str, Any],
    cfg: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate offer surface summary with zero-result relaxation.

    STEP 7.2: Main orchestrator for "what do you have?" queries.

    Flow:
        1. Try filtered availability_summary
        2. If results → format + ask next missing slot
        3. If zero results → relax filters and retry
        4. If still zero → polite fallback

    Args:
        state: SupervisorState dict
        slots: Extracted slot dict
        cfg: Optional dialogue policy config (uses POLICY_CONFIG if None)

    Returns:
        Formatted reply string

    Example:
        slots = {"location": "Kyrenia", "budget": 800}
        reply = real_estate_offer_surface(state, slots)
        # "Here's what we currently have in Kyrenia:\n- Kyrenia: 18 listings..."
    """
    if cfg is None:
        cfg = POLICY_CONFIG

    thread_id = state.get("thread_id", "unknown")

    # 1) Try filtered snapshot
    filters = {
        "location": slots.get("location"),
        "rental_type": slots.get("rental_type"),
        "budget_max": slots.get("budget"),
        "bedrooms": slots.get("bedrooms"),
    }

    logger.info(f"[{thread_id}] RE Offer Surface: filters={filters}")

    data = availability_summary(filters)
    items = data["items"]

    if items:
        lines = build_offer_lines(items, cfg)
        missing, complete = _missing_slots(slots)
        ask = next_question(missing) if missing else ""

        scope = "" if not slots.get("location") else f" in {slots['location']}"

        reply_parts = [
            f"Here's what we currently have{scope}:",
            "\n".join(lines)
        ]

        if ask:
            reply_parts.append(f"\nTo narrow this down, {ask}")

        reply = "\n".join(reply_parts)

        logger.info(f"[{thread_id}] RE Offer Surface: SUCCESS items={len(items)}")
        return reply

    # 2) Zero results → relax filters
    logger.info(f"[{thread_id}] RE Offer Surface: zero-results, relaxing...")

    relaxed_slots, widened = relax_filters(slots, cfg)

    relaxed_filters = {
        "location": relaxed_slots.get("location"),
        "rental_type": relaxed_slots.get("rental_type"),
        "budget_max": relaxed_slots.get("budget"),
        "bedrooms": relaxed_slots.get("bedrooms"),
    }

    data2 = availability_summary(relaxed_filters)
    items2 = data2["items"]

    if items2:
        lines = build_offer_lines(items2, cfg)
        reasons = ", ".join(widened)

        reply_parts = [
            f"I couldn't find exact matches for {criteria_text(slots)}.",
            f"I relaxed {reasons} and found options:",
            "\n".join(lines)
        ]

        missing, complete = _missing_slots(slots)
        ask = next_question(missing) if missing else ""
        if ask:
            reply_parts.append(f"\nTo proceed, {ask}")

        reply = "\n".join(reply_parts)

        logger.info(f"[{thread_id}] RE Offer Surface: RELAXED items={len(items2)} widened={widened}")
        return reply

    # 3) Still zero → polite fallback
    logger.warning(f"[{thread_id}] RE Offer Surface: zero results even after relaxation")

    return (
        "I couldn't find matches right now. "
        "We can try a nearby area or adjust budget. "
        "Do you want me to expand the search radius?"
    )
