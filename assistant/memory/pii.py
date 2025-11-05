"""
PII redaction utilities for Zep memory writes.

Provides helpers to redact sensitive personally identifiable information (emails,
phones, addresses) before mirroring messages to external memory services.
"""
from __future__ import annotations

import re
import logging
from typing import Any, Dict, Optional, Set

from assistant.monitoring.metrics import inc_memory_redaction

logger = logging.getLogger(__name__)

# Email pattern: basic RFC 5322 subset
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    re.IGNORECASE,
)

# Phone pattern: international formats, common variations
# Matches: +90 533 123 4567, 0533-123-4567, (533) 123 4567, etc.
PHONE_PATTERN = re.compile(
    r'''
    (?:
        (?:\+?\d{1,3}[-.\s]?)?          # Optional country code
        (?:\(?\d{3}\)?[-.\s]?)          # Area code with optional parens
        \d{3}[-.\s]?\d{4}               # 7-digit phone number
    )
    |
    (?:
        \+?\d{1,3}[-.\s]?               # Country code
        \d{3}[-.\s]?\d{3}[-.\s]?\d{4}   # 10-digit format
    )
    |
    (?:
        0\d{3}[-.\s]?\d{3}[-.\s]?\d{4}  # Turkish mobile: 0533 123 4567
    )
    ''',
    re.VERBOSE,
)

# Address patterns (basic detection)
# Matches: "123 Main St", "Apt 5B", etc.
ADDRESS_KEYWORDS = {'street', 'st', 'avenue', 'ave', 'road', 'rd', 'blvd', 'apt', 'suite'}


def redact_emails(text: str, replacement: str = "[EMAIL]") -> tuple[str, int]:
    """
    Redact email addresses from text.

    Args:
        text: Input text
        replacement: Replacement string for redacted emails

    Returns:
        Tuple of (redacted_text, count_redacted)
    """
    count = 0

    def replace_fn(match: re.Match) -> str:
        nonlocal count
        count += 1
        inc_memory_redaction("email")
        return replacement

    redacted = EMAIL_PATTERN.sub(replace_fn, text)
    return redacted, count


def redact_phones(text: str, replacement: str = "[PHONE]") -> tuple[str, int]:
    """
    Redact phone numbers from text.

    Args:
        text: Input text
        replacement: Replacement string for redacted phones

    Returns:
        Tuple of (redacted_text, count_redacted)
    """
    count = 0

    def replace_fn(match: re.Match) -> str:
        nonlocal count
        # Skip if it looks like a time (e.g., "555-1234" but surrounded by other digits)
        matched = match.group(0)
        if len(matched.replace('-', '').replace(' ', '').replace('.', '')) < 10:
            return matched  # Too short to be a real phone
        count += 1
        inc_memory_redaction("phone")
        return replacement

    redacted = PHONE_PATTERN.sub(replace_fn, text)
    return redacted, count


def redact_addresses(text: str, replacement: str = "[ADDRESS]") -> tuple[str, int]:
    """
    Redact street addresses from text (basic heuristic).

    Args:
        text: Input text
        replacement: Replacement string for redacted addresses

    Returns:
        Tuple of (redacted_text, count_redacted)

    Note:
        This is a simple keyword-based heuristic. For production, consider:
        - NER-based address detection
        - Geocoding to lat/lon only (already done elsewhere)
    """
    count = 0
    words = text.split()
    redacted_words = []

    for i, word in enumerate(words):
        lower_word = word.lower().strip('.,;!?')
        if lower_word in ADDRESS_KEYWORDS:
            # Redact this word and surrounding context (2 words before, 2 after)
            start = max(0, i - 2)
            end = min(len(words), i + 3)
            if count == 0:  # Only redact once per address chunk
                redacted_words.append(replacement)
                inc_memory_redaction("address")
                count += 1
            # Skip the next few words (part of address)
            for j in range(start, end):
                if j > i:
                    words[j] = ""  # Mark as already processed
        elif word:  # Not already marked as processed
            redacted_words.append(word)

    redacted = " ".join(w for w in redacted_words if w)
    return redacted, count


def redact_pii(
    text: str,
    *,
    redact_email: bool = True,
    redact_phone: bool = True,
    redact_address: bool = False,  # Off by default (addresses are geocoded elsewhere)
) -> Dict[str, Any]:
    """
    Redact all PII from text with configurable policies.

    Args:
        text: Input text
        redact_email: Redact email addresses
        redact_phone: Redact phone numbers
        redact_address: Redact street addresses (basic heuristic)

    Returns:
        Dictionary with:
            - "text": Redacted text
            - "redactions": Dict of {type: count}
            - "original_length": Length before redaction
            - "redacted_length": Length after redaction
    """
    original_length = len(text)
    redacted_text = text
    redactions: Dict[str, int] = {}

    if redact_email:
        redacted_text, email_count = redact_emails(redacted_text)
        if email_count > 0:
            redactions["email"] = email_count

    if redact_phone:
        redacted_text, phone_count = redact_phones(redacted_text)
        if phone_count > 0:
            redactions["phone"] = phone_count

    if redact_address:
        redacted_text, address_count = redact_addresses(redacted_text)
        if address_count > 0:
            redactions["address"] = address_count

    if redactions:
        logger.info(
            "pii_redacted",
            extra={
                "redactions": redactions,
                "original_length": original_length,
                "redacted_length": len(redacted_text),
            },
        )

    return {
        "text": redacted_text,
        "redactions": redactions,
        "original_length": original_length,
        "redacted_length": len(redacted_text),
    }
