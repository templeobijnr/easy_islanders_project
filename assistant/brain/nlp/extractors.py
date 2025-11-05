"""
STEP 7.1: Coherent Slot-Filling NLP Extractors

Deterministic, config-driven extraction functions for real-estate domain.
All business logic (locale synonyms, currencies, regex patterns) lives in config/nlp.yaml.

Functions:
    - parse_bedrooms(text) -> Optional[int]
    - parse_budget(text) -> Tuple[Optional[int], Optional[str]]
    - parse_location(text) -> Optional[str]
    - parse_anywhere(text) -> bool
    - parse_rental_type(text) -> Optional[str]
    - extract_all(text) -> Dict[str, Any]
"""

from __future__ import annotations
import re
import yaml
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Load config
_config_path = Path(__file__).parent.parent.parent.parent / "config" / "nlp.yaml"
CFG = yaml.safe_load(open(_config_path).read())


def _lc(s: str) -> str:
    """Lowercase helper."""
    return s.lower()


def _norm_currency(tok: str | None) -> Optional[str]:
    """
    Normalize currency token to standard code (GBP, EUR, USD, TRY).

    Args:
        tok: Currency token (e.g., "pounds", "£", "gbp")

    Returns:
        Standard currency code or None
    """
    if not tok:
        return None
    t = _lc(tok)
    for code, syns in CFG["currencies"].items():
        if t in syns:
            return code
    return None


def parse_bedrooms(text: str) -> Optional[int]:
    """
    Extract bedroom count from text.

    Examples:
        "2 bed" -> 2
        "3 bedroom" -> 3
        "1BR" -> 1

    Args:
        text: User input text

    Returns:
        Number of bedrooms or None
    """
    t = _lc(text)
    for pat in CFG["regex"]["bedrooms"]:
        m = re.search(pat, t, re.I)
        if m:
            try:
                return int(m.group(1))
            except:
                return None
    return None


def parse_budget(text: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Extract budget amount and currency from text.

    Examples:
        "600 pounds" -> (600, "GBP")
        "under 1000 lira" -> (1000, "TRY")
        "500 €" -> (500, "EUR")

    Args:
        text: User input text

    Returns:
        Tuple of (amount, currency_code) or (None, None)
    """
    t = _lc(text)

    # Try "under X" pattern first
    for pat in CFG["regex"]["budget_under"]:
        m = re.search(pat, t, re.I)
        if m:
            currency_token = m.group(2) if m.lastindex >= 2 else None
            currency = _norm_currency(currency_token)
            # Only return if we have a valid currency or the pattern includes "under"
            if currency or "under" in t:
                return int(m.group(1)), currency
            # If no currency found and no "under", continue to next pattern
            continue

    # Try inline pattern - find ALL matches and return first with valid currency
    for pat in CFG["regex"]["budget_inline"]:
        matches = re.finditer(pat, t, re.I)
        for m in matches:
            currency_token = m.group(2) if m.lastindex >= 2 else None
            currency = _norm_currency(currency_token)
            # Only return if we have a valid currency
            if currency:
                return int(m.group(1)), currency

    return None, None


def parse_anywhere(text: str) -> bool:
    """
    Check if user is open to any location.

    Examples:
        "anywhere" -> True
        "no preference" -> True
        "kyrenia" -> False

    Args:
        text: User input text

    Returns:
        True if user wants any location
    """
    t = _lc(text)
    return any(tok in t for tok in CFG["rules"]["anywhere_tokens"])


def parse_rental_type(text: str) -> Optional[str]:
    """
    Extract rental type from text.

    Examples:
        "long term" -> "long_term"
        "monthly" -> "long_term"
        "nightly" -> "short_term"
        "airbnb" -> "short_term"

    Args:
        text: User input text

    Returns:
        "short_term" | "long_term" | None
    """
    t = _lc(text)
    if any(tok in t for tok in CFG["rules"]["short_term_tokens"]):
        return "short_term"
    if any(tok in t for tok in CFG["rules"]["long_term_tokens"]):
        return "long_term"
    return None


def parse_location(text: str) -> Optional[str]:
    """
    Extract location from text using canonical locale mapping.

    Examples:
        "girne" -> "Kyrenia"
        "in kyrenia" -> "Kyrenia"
        "lefkoşa" -> "Nicosia"
        "in morphou" -> "Morphou"

    Args:
        text: User input text

    Returns:
        Canonical location name or None
    """
    t = _lc(text)

    # Check against canonical locale mappings
    for canon, syns in CFG["locales"].items():
        for s in syns:
            if re.search(rf"\b{s}\b", t):
                return canon

    # Try to extract location after "in"
    m = re.search(r"in\s+([a-zğüşöçıİI]+(?:\s+[a-zğüşöçıİI]+)*)", t, re.I)
    if m:
        token = m.group(1).strip()
        # Check if it matches a known locale
        for canon, syns in CFG["locales"].items():
            if token in syns:
                return canon
        # Return titlecased unknown location
        return token.title()

    return None


def extract_all(text: str) -> Dict[str, Any]:
    """
    Extract all slots from text in one pass.

    Examples:
        "kyrenia 600 pounds" -> {"location": "Kyrenia", "budget": 600, "budget_currency": "GBP"}
        "need 2 bed in girne" -> {"location": "Kyrenia", "bedrooms": 2}
        "long term anywhere under 1000 lira" -> {
            "rental_type": "long_term",
            "anywhere": True,
            "budget": 1000,
            "budget_currency": "TRY"
        }

    Args:
        text: User input text

    Returns:
        Dict with extracted slots (only non-None values)
    """
    loc = parse_location(text)
    beds = parse_bedrooms(text)
    amt, cur = parse_budget(text)
    anywhere = parse_anywhere(text)
    rent_type = parse_rental_type(text)

    out: Dict[str, Any] = {}
    if loc:
        out["location"] = loc
    if beds is not None:
        out["bedrooms"] = beds
    if amt is not None:
        out["budget"] = amt
    if cur:
        out["budget_currency"] = cur
    if anywhere:
        out["anywhere"] = True
    if rent_type:
        out["rental_type"] = rent_type

    return out
