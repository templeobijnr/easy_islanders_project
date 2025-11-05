"""
Context Summarization Utilities

STEP 6: Context Lifecycle & Summarization Layer

Provides lightweight summarization functions for creating rolling summaries
of conversation history without requiring external LLM calls.

Features:
- PII stripping (email, phone, URLs)
- 500-char max constraint
- Key fact extraction
"""
import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


# PII patterns for redaction
PII_PATTERNS = {
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "phone": re.compile(r"\b(?:\+?(\d{1,3}))?[-.\s]?(\(?\d{3}\)?)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "url": re.compile(r"https?://[^\s]+"),
}


def strip_pii(text: str) -> str:
    """
    Strip PII from text using regex patterns.

    Args:
        text: Raw text potentially containing PII

    Returns:
        Text with PII redacted using [REDACTED] placeholders

    Example:
        >>> strip_pii("Contact me at john@example.com")
        "Contact me at [REDACTED]"
    """
    result = text

    # Redact email addresses
    result = PII_PATTERNS["email"].sub("[REDACTED]", result)

    # Redact phone numbers
    result = PII_PATTERNS["phone"].sub("[REDACTED]", result)

    # Redact URLs
    result = PII_PATTERNS["url"].sub("[REDACTED]", result)

    return result


def summarize_context(history: List[Dict[str, Any]], max_sentences: int = 3, max_chars: int = 500) -> str:
    """
    Create a lightweight running summary of conversation history.

    STEP 6: Main summarization function with PII stripping and char limit.

    This is a simple extractive summarization that takes the first N sentences
    from the conversation. Can later be upgraded to use BART/T5 or LLM-based
    summarization for better quality.

    Args:
        history: List of conversation turns with 'role' and 'content' keys
        max_sentences: Maximum number of sentences to include in summary (default: 3)
        max_chars: Maximum character limit (default: 500)

    Returns:
        Summary string (≤max_chars, PII-stripped, max_sentences sentences)

    Example:
        history = [
            {"role": "user", "content": "I need an apartment in Girne."},
            {"role": "assistant", "content": "I can help you find apartments in Girne. What's your budget?"},
            {"role": "user", "content": "Around 1000 EUR per month."},
        ]
        summary = summarize_context(history, max_sentences=2)
        # Returns: "I need an apartment in Girne. I can help you find apartments in Girne."
    """
    if not history:
        return ""

    try:
        # Extract text from user and assistant turns only (skip system messages)
        text_parts = []
        for turn in history:
            if isinstance(turn, dict):
                role = turn.get("role", "")
                content = turn.get("content", "")
                if role in ("user", "assistant") and isinstance(content, str):
                    text_parts.append(content)

        if not text_parts:
            return ""

        # Join all content
        text = " ".join(text_parts)

        # Strip PII before processing
        text = strip_pii(text)

        # Split into sentences (basic regex-based splitting)
        sentences = re.split(r'(?<=[.!?])\s+', text)

        # Take first max_sentences
        summary_sentences = sentences[:max_sentences]
        summary = " ".join(summary_sentences)

        # Add ellipsis if truncated by sentence count
        if len(sentences) > max_sentences:
            summary += " ..."

        # Enforce character limit
        if len(summary) > max_chars:
            summary = summary[:max_chars - 3] + "..."

        logger.debug(
            "[STEP6] summarize_context",
            extra={
                "input_messages": len(history),
                "summary_length": len(summary),
                "sentence_count": len(summary_sentences),
            }
        )

        return summary.strip()

    except Exception as e:
        logger.error(
            "[STEP6] summarize_context failed",
            extra={"error": str(e)},
            exc_info=True
        )
        # Return safe fallback
        return "Conversation in progress."


def summarize_agent_interactions(history: List[Dict[str, Any]], agent_name: str) -> str:
    """
    Summarize interactions specific to a particular agent.

    Args:
        history: Full conversation history
        agent_name: Name of the agent to filter for

    Returns:
        Summary of interactions with that specific agent
    """
    # Filter turns involving this agent
    agent_turns = []
    for i, turn in enumerate(history):
        if isinstance(turn, dict):
            # Check if this turn was handled by the specified agent
            if turn.get("current_node") == agent_name:
                agent_turns.append(turn)
            # Also include the user message that triggered this agent
            elif i > 0 and history[i - 1].get("current_node") == agent_name:
                agent_turns.append(turn)

    return summarize_context(agent_turns, max_sentences=2)


def extract_key_entities(history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extract key entities mentioned in the conversation.

    This is a simple keyword-based extraction. Can be upgraded to use
    NER (Named Entity Recognition) models later.

    Args:
        history: Conversation history

    Returns:
        Dictionary of extracted entities (location, budget, etc.)

    Example:
        Returns: {
            "locations": ["Girne", "Kyrenia"],
            "budget": "1000 EUR",
            "bedrooms": "2"
        }
    """
    entities = {
        "locations": [],
        "budget": None,
        "bedrooms": None,
    }

    # Common location patterns
    locations = [
        "girne", "kyrenia", "nicosia", "lefkoşa", "lefkosa",
        "famagusta", "gazimağusa", "güzelyurt", "morphou"
    ]

    # Extract from all turns
    for turn in history:
        if isinstance(turn, dict):
            content = turn.get("content", "").lower()

            # Check for locations
            for loc in locations:
                if loc in content and loc.title() not in entities["locations"]:
                    entities["locations"].append(loc.title())

            # Check for budget (simple pattern)
            budget_match = re.search(r'(\d+)\s*(EUR|euro|€|pounds|£)', content, re.IGNORECASE)
            if budget_match and not entities["budget"]:
                entities["budget"] = budget_match.group(0)

            # Check for bedrooms
            bedroom_match = re.search(r'(\d+)\s*(bedroom|br|bed)', content, re.IGNORECASE)
            if bedroom_match and not entities["bedrooms"]:
                entities["bedrooms"] = bedroom_match.group(1)

    return entities
