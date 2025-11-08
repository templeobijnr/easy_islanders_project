"""
Graph-Aware Slot Pre-filling

Automatically pre-fills missing slots with user's historical preferences from Graph memory.
Transforms UX from "repeat yourself" to "I remember you" experience.

Example:
    Day 1: User: "2BR in Girne for £600"
           → Stores to Graph: location=Girne, bedrooms=2, budget=600

    Day 2: User: "Show me apartments"
           → Pre-fills from Graph: location=Girne, bedrooms=2, budget=600
           → Agent: "I'll show 2BR in Girne around £600..."

Architecture:
    Current slots (this turn) > Session memory > Graph defaults
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^               ^^^^^^^^^^^^^^^^
    Highest priority                           Fallback/defaults

Usage:
    from assistant.brain.graph_slot_prefill import prefill_slots_from_graph

    # Before slot extraction
    prefilled = prefill_slots_from_graph(
        user_id="user_123",
        current_slots={},
        intent="property_search"
    )
    # Returns: {'location': 'Girne', 'bedrooms': 2, 'budget': 600}
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def prefill_slots_from_graph(
    user_id: str,
    current_slots: Dict[str, Any],
    intent: str,
    use_confidence_threshold: bool = True,
    min_confidence: float = 0.7
) -> Dict[str, Any]:
    """
    Pre-fill missing slots from user's Graph preferences.

    Merge strategy (priority order):
    1. Current slots (this turn) - HIGHEST priority
    2. Session memory (existing context)
    3. Graph preferences (historical defaults) - LOWEST priority

    Only pre-fills for relevant intents (property_search, rental_inquiry).
    Skips pre-filling if user already provided the slot in current turn.

    Args:
        user_id: User identifier
        current_slots: Slots already extracted/filled this session
        intent: Current intent classification
        use_confidence_threshold: Only pre-fill high-confidence facts
        min_confidence: Minimum confidence for pre-filling (default: 0.7)

    Returns:
        Updated slots dict with Graph preferences merged in

    Example:
        >>> current = {"rental_type": "long_term"}
        >>> prefilled = prefill_slots_from_graph("user_123", current, "property_search")
        >>> prefilled
        {'location': 'Girne', 'bedrooms': 2, 'budget': 600, 'rental_type': 'long_term'}
        # Note: rental_type preserved from current_slots (higher priority)
    """
    from assistant.memory.graph_manager import get_graph_manager

    # Only pre-fill for property search intents
    if intent not in {"property_search", "rental_inquiry", "real_estate_search"}:
        logger.debug(
            "[GraphPrefill] Intent '%s' not eligible for pre-filling",
            intent
        )
        return current_slots

    # Get GraphManager
    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        logger.debug("[GraphPrefill] GraphManager not available")
        return current_slots

    try:
        # Retrieve user preferences from Graph
        prefs = graph_mgr.get_user_preferences(user_id=user_id)

        if not prefs:
            logger.debug("[GraphPrefill] No preferences found for user %s", user_id)
            return current_slots

        # Parse preferences into slot format
        graph_slots = {}
        for edge in prefs:
            fact = edge.get("fact", "")
            target = edge.get("target", "")
            confidence = edge.get("confidence", 1.0)

            # Skip low-confidence facts if threshold enabled
            if use_confidence_threshold and confidence < min_confidence:
                logger.debug(
                    "[GraphPrefill] Skipping low-confidence fact: %s (%.2f < %.2f)",
                    fact,
                    confidence,
                    min_confidence
                )
                continue

            # Extract slot name from fact: "prefers_location" → "location"
            if fact.startswith("prefers_"):
                slot_name = fact[8:]  # Remove "prefers_" prefix

                # Type conversion for known slots
                if slot_name == "bedrooms":
                    try:
                        target = int(target)
                    except ValueError:
                        pass
                elif slot_name == "budget":
                    try:
                        target = float(target)
                    except ValueError:
                        pass

                graph_slots[slot_name] = target

        # Merge: current slots override Graph defaults
        prefilled = {**graph_slots, **current_slots}

        # Log what was pre-filled (new keys only)
        prefilled_keys = set(graph_slots.keys()) - set(current_slots.keys())
        if prefilled_keys:
            logger.info(
                "[GraphPrefill] Pre-filled %d slots from Graph for user %s: %s",
                len(prefilled_keys),
                user_id,
                prefilled_keys
            )

            # Detailed debug log
            for key in prefilled_keys:
                logger.debug(
                    "[GraphPrefill]   %s = %s (from Graph)",
                    key,
                    prefilled[key]
                )
        else:
            logger.debug(
                "[GraphPrefill] No new slots to pre-fill (all slots already present)"
            )

        return prefilled

    except Exception as e:
        logger.warning("[GraphPrefill] Graph prefill failed: %s", e, exc_info=True)
        return current_slots  # Graceful degradation


def explain_prefill_to_user(
    user_id: str,
    prefilled_slots: Dict[str, Any],
    original_slots: Dict[str, Any]
) -> Optional[str]:
    """
    Generate user-facing message explaining what was remembered.

    Creates a natural language message like:
    "I remember you were looking for 2-bedroom apartments in Girne around £600."

    Args:
        user_id: User identifier
        prefilled_slots: Slots after pre-filling
        original_slots: Slots before pre-filling

    Returns:
        User-facing message, or None if nothing was pre-filled

    Example:
        >>> original = {}
        >>> prefilled = {'location': 'Girne', 'bedrooms': 2, 'budget': 600}
        >>> explain_prefill_to_user("u123", prefilled, original)
        "I remember you prefer 2-bedroom properties in Girne around £600."
    """
    # Find what was pre-filled
    new_keys = set(prefilled_slots.keys()) - set(original_slots.keys())

    if not new_keys:
        return None  # Nothing was pre-filled

    # Build friendly message
    parts = []

    if "location" in new_keys:
        parts.append(f"in {prefilled_slots['location']}")

    if "bedrooms" in new_keys:
        br = prefilled_slots["bedrooms"]
        parts.insert(0, f"{br}-bedroom properties")

    if "budget" in new_keys and "budget_currency" in prefilled_slots:
        budget = prefilled_slots["budget"]
        currency = prefilled_slots.get("budget_currency", "")
        symbol = {"GBP": "£", "EUR": "€", "USD": "$", "TRY": "₺"}.get(currency, currency)
        parts.append(f"around {symbol}{budget}")

    if "property_type" in new_keys:
        ptype = prefilled_slots["property_type"]
        if not parts:
            parts.append(ptype + "s")

    if not parts:
        # Generic message
        return "I remember your previous search preferences."

    # Combine parts
    if len(parts) == 1:
        remembered = parts[0]
    elif len(parts) == 2:
        remembered = " ".join(parts)
    else:
        remembered = ", ".join(parts[:-1]) + " and " + parts[-1]

    return f"I remember you were looking for {remembered}."


def clear_stale_preferences(
    user_id: str,
    max_age_days: int = 180
) -> int:
    """
    Clear preferences older than specified age.

    Useful for privacy and relevance - user preferences from 6+ months ago
    may no longer be accurate.

    Args:
        user_id: User identifier
        max_age_days: Maximum age of preferences to keep (default: 180 days)

    Returns:
        Number of preferences cleared

    Note:
        This requires Zep Graph API support for filtering by timestamp.
        Implementation pending Zep SDK update.
    """
    # TODO: Implement when Zep SDK supports timestamp-based deletion
    logger.warning(
        "[GraphPrefill] Stale preference clearing not yet implemented "
        "(waiting for Zep SDK timestamp filters)"
    )
    return 0


def get_preference_summary(user_id: str) -> Dict[str, Any]:
    """
    Get summary of user's stored preferences for debugging/monitoring.

    Args:
        user_id: User identifier

    Returns:
        Summary dict with preference counts and sample values

    Example:
        >>> summary = get_preference_summary("user_123")
        >>> summary
        {
            'total_preferences': 5,
            'preference_types': ['location', 'bedrooms', 'budget', 'property_type', 'rental_type'],
            'last_updated': '2025-11-08T14:30:00Z',
            'sample': {'location': 'Girne', 'bedrooms': 2}
        }
    """
    from assistant.memory.graph_manager import get_graph_manager

    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        return {"error": "GraphManager not available"}

    try:
        prefs = graph_mgr.get_user_preferences(user_id=user_id)

        # Parse into summary
        pref_types = []
        sample = {}
        timestamps = []

        for edge in prefs:
            fact = edge.get("fact", "")
            target = edge.get("target", "")
            valid_from = edge.get("valid_from")

            if fact.startswith("prefers_"):
                pref_type = fact[8:]
                pref_types.append(pref_type)

                # Add to sample (first occurrence only)
                if pref_type not in sample:
                    sample[pref_type] = target

                # Track timestamps
                if valid_from:
                    timestamps.append(valid_from)

        return {
            "total_preferences": len(prefs),
            "preference_types": pref_types,
            "last_updated": max(timestamps) if timestamps else None,
            "sample": sample
        }

    except Exception as e:
        logger.error("[GraphPrefill] Failed to get preference summary: %s", e)
        return {"error": str(e)}
