"""
STEP 7.2: Dialogue Act Classification

Lightweight, deterministic classifier for identifying user intent acts.
Used to determine when to show offer summaries vs. slot-filling dialogue.

Acts:
    - OFFER_SUMMARY: User wants to see available inventory ("what do you have?")
    - NONE: Regular slot-filling turn
"""

import re
from typing import Optional


# Patterns for OFFER_SUMMARY act
WHAT_HAVE_PATTERNS = [
    r"\bwhat (?:do|dya|d'you) (?:u|you) have\b",
    r"\bwhat(?:'s| is) available\b",
    r"\bshow me (?:options|what you have)\b",
    r"\bwhat can i get\b",
    r"\banywhere\?",  # Removed \b after ? since ? is not a word character
    r"\bshow (?:me )?(?:all|everything)\b",
    r"\bwhat(?:'s| is) out there\b",
    r"\bwhat are my options\b",
]


def classify_act(user_text: str, has_any_slot: bool = False) -> str:
    """
    Classify user utterance into dialogue act.

    Args:
        user_text: User input text
        has_any_slot: Whether any slots have been extracted (for context)

    Returns:
        Act label: "OFFER_SUMMARY" | "NONE"

    Examples:
        classify_act("what do you have?") -> "OFFER_SUMMARY"
        classify_act("anywhere?") -> "OFFER_SUMMARY"
        classify_act("kyrenia 600 pounds") -> "NONE"
    """
    t = user_text.lower().strip()

    # Check for OFFER_SUMMARY patterns
    if any(re.search(p, t, re.I) for p in WHAT_HAVE_PATTERNS):
        return "OFFER_SUMMARY"

    return "NONE"
