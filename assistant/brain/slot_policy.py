"""
Adaptive Slot-Filling Policy Engine (v2.0)

Dynamic reasoning over slot completeness, prompting strategy, skipping, and escalation.
Supports hot-reload of configuration, tiered slot priorities, and empathetic fallbacks.
"""

import yaml
import os
import time
import logging
from typing import Dict, List, Tuple, Optional, Any, Literal
from pathlib import Path

logger = logging.getLogger(__name__)

# Action types returned by next_action()
ActionType = Literal["ask", "soft_ask", "search", "clarify", "skip"]


class SlotPolicy:
    """
    Declarative slot policy engine with hot-reload support.

    Responsibilities:
    - Load and reload slot priority configuration
    - Analyze slot completeness by priority tier
    - Determine next conversational action (ask, soft_ask, search, clarify, skip)
    - Support intent-switching with schema merging
    - Provide empathetic fallback responses
    """

    _cache: Optional[Dict[str, Any]] = None
    _last_reload: float = 0
    _cache_ttl: float = 300  # 5 minute reload window

    def __init__(self, domain: str = "real_estate"):
        """
        Initialize SlotPolicy for a specific domain.

        Args:
            domain: Domain name (e.g., "real_estate")
        """
        self.domain = domain
        self.config_path = Path(__file__).parent / "slot_policy_config.yaml"

        if not self.config_path.exists():
            logger.error(f"[SlotPolicy] Config file not found: {self.config_path}")
            raise FileNotFoundError(f"Slot policy config not found: {self.config_path}")

        self.reload(force=True)

    def reload(self, force: bool = False) -> None:
        """
        Reload configuration from YAML file (hot-reload).

        Args:
            force: If True, bypass TTL cache and force reload
        """
        now = time.time()
        if not force and SlotPolicy._cache is not None and (now - SlotPolicy._last_reload) < self._cache_ttl:
            return  # Use cached config

        try:
            with open(self.config_path, 'r') as f:
                SlotPolicy._cache = yaml.safe_load(f)
            SlotPolicy._last_reload = now
            logger.info(f"[SlotPolicy] Config reloaded from {self.config_path}")
        except Exception as e:
            logger.error(f"[SlotPolicy] Failed to reload config: {e}", exc_info=True)
            if SlotPolicy._cache is None:
                # If no cache exists, fail hard
                raise

    def _get_schema(self, intent: str) -> Dict[str, List[str]]:
        """
        Get slot schema for a specific intent.

        Args:
            intent: Intent name (e.g., "short_term_rent", "buy_property")

        Returns:
            Dict with keys: critical, contextual, optional
            Each value is a list of slot names.

        Example:
            {
                "critical": ["location", "rental_type"],
                "contextual": ["budget", "bedrooms"],
                "optional": ["furnishing", "amenities"]
            }
        """
        domain_cfg = SlotPolicy._cache.get(self.domain, {})
        schema = domain_cfg.get(intent)

        if not schema:
            # Fallback: use short_term_rent as default
            logger.warning(f"[SlotPolicy] Intent '{intent}' not found, using 'short_term_rent' fallback")
            schema = domain_cfg.get("short_term_rent", {
                "critical": ["rental_type", "location"],
                "contextual": ["budget"],
                "optional": []
            })

        return schema

    def analyze_slots(
        self,
        filled_slots: Dict[str, Any],
        intent: str
    ) -> Dict[str, Any]:
        """
        Categorize filled and missing slots by priority tier.

        Args:
            filled_slots: Dict of currently filled slot values
            intent: Intent name for schema lookup

        Returns:
            Dict with structure:
            {
                "filled": ["location", "budget"],
                "missing": {
                    "critical": ["rental_type"],
                    "contextual": ["bedrooms"],
                    "optional": ["furnishing", "amenities"]
                },
                "completeness": 0.67  # Fraction of critical+contextual slots filled
            }
        """
        schema = self._get_schema(intent)
        filled = []
        missing = {"critical": [], "contextual": [], "optional": []}

        for level in ["critical", "contextual", "optional"]:
            slot_names = schema.get(level, [])
            for slot_name in slot_names:
                value = filled_slots.get(slot_name)
                if value is not None and value != "":
                    filled.append(slot_name)
                else:
                    missing[level].append(slot_name)

        # Calculate completeness: (critical + contextual filled) / (critical + contextual total)
        critical_count = len(schema.get("critical", []))
        contextual_count = len(schema.get("contextual", []))
        total_important = critical_count + contextual_count

        filled_important = (
            (critical_count - len(missing["critical"])) +
            (contextual_count - len(missing["contextual"]))
        )

        completeness = filled_important / total_important if total_important > 0 else 1.0

        return {
            "filled": filled,
            "missing": missing,
            "completeness": completeness
        }

    def next_action(
        self,
        filled_slots: Dict[str, Any],
        intent: str,
        slot_prompt_attempts: Optional[Dict[str, int]] = None,
        skipped_slots: Optional[Dict[str, str]] = None
    ) -> Tuple[ActionType, Optional[str]]:
        """
        Determine next conversational action based on slot analysis.

        Args:
            filled_slots: Currently filled slots
            intent: Current intent
            slot_prompt_attempts: Dict tracking how many times each slot was asked
            skipped_slots: Dict of slots user has explicitly skipped

        Returns:
            Tuple of (action_type, slot_name)
            - action_type: "ask", "soft_ask", "search", "clarify", or "skip"
            - slot_name: Slot to ask about (None for search/clarify actions)

        Logic:
        1. If critical slots missing → "ask" for first critical
        2. If critical slot asked 3+ times → "skip" and move on
        3. If all critical filled, contextual missing → "soft_ask" for first contextual
        4. If all critical + contextual filled → "search"
        5. If no slots filled at all → "clarify" (confirm intent)
        """
        attempts = slot_prompt_attempts or {}
        skipped = skipped_slots or {}
        max_attempts = SlotPolicy._cache.get("slot_filling_guard", {}).get("max_prompt_attempts", 3)

        analysis = self.analyze_slots(filled_slots, intent)
        missing = analysis["missing"]

        # 1. Check for missing critical slots
        for slot_name in missing["critical"]:
            # Skip if already skipped
            if slot_name in skipped:
                continue

            # Skip if asked too many times
            if attempts.get(slot_name, 0) >= max_attempts:
                logger.info(f"[SlotPolicy] Slot '{slot_name}' asked {attempts[slot_name]} times, skipping")
                return ("skip", slot_name)

            # Ask for critical slot
            return ("ask", slot_name)

        # 2. All critical filled → check contextual
        for slot_name in missing["contextual"]:
            if slot_name in skipped:
                continue

            if attempts.get(slot_name, 0) >= max_attempts:
                logger.info(f"[SlotPolicy] Slot '{slot_name}' asked {attempts[slot_name]} times, skipping")
                return ("skip", slot_name)

            # Soft ask for contextual slot
            return ("soft_ask", slot_name)

        # 3. All critical + contextual filled → proceed to search
        if analysis["filled"]:
            return ("search", None)

        # 4. No slots filled at all → clarify intent
        return ("clarify", "goal")

    def can_proceed(
        self,
        filled_slots: Dict[str, Any],
        intent: str
    ) -> bool:
        """
        Check if all critical slots are filled (can proceed to search).

        Args:
            filled_slots: Currently filled slots
            intent: Current intent

        Returns:
            True if all critical slots filled, False otherwise
        """
        analysis = self.analyze_slots(filled_slots, intent)
        return len(analysis["missing"]["critical"]) == 0

    def get_empathy_response(
        self,
        scenario: Literal["skip_slot_graceful", "frustrated", "zero_results"]
    ) -> str:
        """
        Get empathetic response template for a given scenario.

        Args:
            scenario: Scenario key (skip_slot_graceful, frustrated, zero_results)

        Returns:
            Empathetic response text
        """
        empathy_cfg = SlotPolicy._cache.get("empathy", {})
        templates = empathy_cfg.get(scenario, [])

        if not templates:
            return "I understand. Let me continue with what you've shared."

        # Return first template (could randomize in future)
        return templates[0]

    def get_refinement_keywords(self) -> List[str]:
        """Get list of refinement keywords from config."""
        guard_cfg = SlotPolicy._cache.get("slot_filling_guard", {})
        return guard_cfg.get("refinement_keywords", [])

    def get_switch_keywords(self) -> List[str]:
        """Get list of explicit switch keywords from config."""
        guard_cfg = SlotPolicy._cache.get("slot_filling_guard", {})
        return guard_cfg.get("explicit_switch_keywords", [])

    def merge_intent_schemas(
        self,
        old_intent: str,
        new_intent: str,
        existing_slots: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge slot schemas when user switches intent mid-conversation.

        Preserves overlapping slots (e.g., location, budget common to all intents).

        Args:
            old_intent: Previous intent
            new_intent: New intent
            existing_slots: Slots already collected

        Returns:
            Merged slots dict (preserves compatible values)

        Example:
            old_intent="short_term_rent", new_intent="buy_property"
            existing_slots={"location": "Kyrenia", "rental_type": "short_term", "budget": 500}
            → {"location": "Kyrenia", "budget": 500}  # Drop rental_type
        """
        old_schema = self._get_schema(old_intent)
        new_schema = self._get_schema(new_intent)

        # Get all valid slot names for new intent
        new_valid_slots = (
            new_schema.get("critical", []) +
            new_schema.get("contextual", []) +
            new_schema.get("optional", [])
        )

        # Keep only slots that are valid in new schema
        merged = {k: v for k, v in existing_slots.items() if k in new_valid_slots}

        logger.info(
            f"[SlotPolicy] Intent switch: {old_intent} → {new_intent}, "
            f"slots reduced from {len(existing_slots)} to {len(merged)}"
        )

        return merged


# Singleton instance for global access
_policy_instance: Optional[SlotPolicy] = None


def get_slot_policy(domain: str = "real_estate", force_reload: bool = False) -> SlotPolicy:
    """
    Get or create singleton SlotPolicy instance.

    Args:
        domain: Domain name
        force_reload: Force reload configuration

    Returns:
        SlotPolicy instance
    """
    global _policy_instance

    if _policy_instance is None:
        _policy_instance = SlotPolicy(domain=domain)

    if force_reload:
        _policy_instance.reload(force=True)

    return _policy_instance
