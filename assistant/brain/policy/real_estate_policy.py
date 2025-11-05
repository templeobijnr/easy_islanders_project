"""
STEP 7.2: Real Estate Dialogue Policy

Config-driven dialogue management for real estate domain.
Determines missing slots, generates next question, builds criteria text.
"""

from typing import Dict, Any, List, Tuple, Optional
import yaml
from pathlib import Path

# Load dialogue policy config
_config_path = Path(__file__).parent.parent.parent.parent / "config" / "dialogue" / "real_estate.yaml"
POLICY_CONFIG = yaml.safe_load(open(_config_path).read())


def _missing_slots(slots: Dict[str, Any]) -> Tuple[List[str], bool]:
    """
    Determine which required slots are missing.

    Args:
        slots: Current slot dict

    Returns:
        Tuple of (missing_slot_names, all_required_complete)

    Example:
        slots = {"location": "Kyrenia", "budget": 600}
        missing, complete = _missing_slots(slots)
        # missing = ["rental_type"], complete = False
    """
    missing = []

    required = POLICY_CONFIG["required_slots"]
    for req in required:
        if isinstance(req, dict):
            # Handle "one_of" requirement
            one_of_slots = req.get("one_of", [])
            if not any(slots.get(s) for s in one_of_slots):
                missing.append("location_or_anywhere")
        elif isinstance(req, str):
            if not slots.get(req):
                missing.append(req)

    all_complete = len(missing) == 0
    return missing, all_complete


def next_question(missing: List[str]) -> str:
    """
    Get next question to ask based on ask_order.

    Args:
        missing: List of missing slot names

    Returns:
        Question text or empty string

    Example:
        next_question(["rental_type", "location"]) -> "Is this for short-term..."
    """
    if not missing:
        return ""

    ask_order = POLICY_CONFIG["ask_order"]
    questions = POLICY_CONFIG["templates"]["questions"]

    # Find first missing slot in ask_order
    for slot_name in ask_order:
        if slot_name in missing:
            return questions.get(slot_name, "")

    # Fallback: ask first missing
    return questions.get(missing[0], "")


def criteria_text(slots: Dict[str, Any]) -> str:
    """
    Build human-readable criteria text from slots.

    Args:
        slots: Current slot dict

    Returns:
        Criteria string

    Example:
        criteria_text({"location": "Kyrenia", "budget": 600, "budget_currency": "GBP"})
        -> "Kyrenia, ~600 GBP"
    """
    bits = []

    if "location" in slots:
        bits.append(slots["location"])
    elif slots.get("anywhere"):
        bits.append("anywhere")

    if "budget" in slots:
        cur = slots.get("budget_currency", "").strip()
        bits.append(f"~{slots['budget']}{(' ' + cur) if cur else ''}")

    if "bedrooms" in slots:
        bits.append(f"{slots['bedrooms']} BR")

    if "rental_type" in slots:
        rt = slots["rental_type"]
        bits.append(rt.replace("_", "-"))

    return ", ".join(bits) if bits else "your request"


def build_offer_lines(
    items: List[Dict[str, Any]],
    cfg: Optional[Dict[str, Any]] = None
) -> List[str]:
    """
    Format offer items into display lines.

    Args:
        items: List of offer items with {city, count, min, max, currency}
        cfg: Optional config dict (uses POLICY_CONFIG if None)

    Returns:
        List of formatted lines

    Example:
        items = [{"city": "Kyrenia", "count": 42, "min": 450, "max": 2200, "currency": "GBP"}]
        build_offer_lines(items)
        -> ["- Kyrenia: 42 listings (from ~450 to ~2200 GBP)"]
    """
    if cfg is None:
        cfg = POLICY_CONFIG

    tpl_line = cfg["templates"]["summary_line"]
    tpl_hint = cfg["templates"]["range_hint"]

    lines = []
    for it in items:
        hint = ""
        if it.get("min") is not None and it.get("max") is not None and it.get("currency"):
            hint = tpl_hint["budget"].format(
                min=it["min"],
                max=it["max"],
                currency=it["currency"]
            )

        line = tpl_line["by_city"].format(
            city=it["city"],
            count=it["count"],
            range_hint=hint
        )
        lines.append(line)

    return lines


def relax_filters(
    slots: Dict[str, Any],
    cfg: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Relax search filters for zero-results recovery.

    Args:
        slots: Current slot dict
        cfg: Optional config dict (uses POLICY_CONFIG if None)

    Returns:
        Tuple of (relaxed_slots, widened_field_names)

    Example:
        slots = {"location": "Kyrenia", "budget": 500, "bedrooms": 4}
        relaxed, widened = relax_filters(slots)
        # relaxed = {"location": "Kyrenia", "budget": 600, "location_radius_km": 20}
        # widened = ["budget", "bedrooms"]
    """
    if cfg is None:
        cfg = POLICY_CONFIG

    relaxed = dict(slots or {})
    seq = cfg["relaxation"]["sequence"]
    widened = []

    if "location_radius" in seq and "location" in relaxed:
        # Signal to service to widen radius
        relaxed["location_radius_km"] = cfg["relaxation"]["location_radius_km"]
        widened.append("location")

    if "budget_widen" in seq and "budget" in relaxed:
        pct = cfg["relaxation"]["budget_widen_percent"]
        relaxed["budget"] = int(relaxed["budget"] * (1 + pct / 100))
        widened.append("budget")

    if "ignore_bedrooms" in seq and "bedrooms" in relaxed:
        relaxed.pop("bedrooms")
        widened.append("bedrooms")

    return relaxed, widened
