from __future__ import annotations

"""
Lightweight heuristics used by the LangGraph orchestrator.

Extracted from legacy agent helpers to avoid coupling the graph to
assistant/brain/agent.py's sequential orchestrator.
"""

from typing import Optional


PHOTO_KEYWORDS = [
    "photo", "photos", "picture", "pictures", "pics", "images",
    "resim", "foto", "fotograf", "фото", "zdjecia", "zdjęcia",
    "can you show", "i want pictures", "i want photos",
    "show pictures", "show photos", "see pictures", "see photos",
    "more pictures", "more photos", "additional photos", "additional pictures",
]

PROPERTY_KEYWORDS = {
    "apartment", "flat", "house", "villa", "rent", "rental", "property",
    "studio", "1+1", "2+1", "3+1", "bedroom", "bedrooms", "girne", "kyrenia",
    "lefkoşa", "nicosia", "magosa", "famagusta", "iskele", "catalkoy", "karakum",
    "lapta", "alsancak", "bellapais", "esentepe", "karsiyaka",
}


def looks_like_property_search(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    if any(k in t for k in PROPERTY_KEYWORDS):
        return True
    import re
    if re.search(r"\b(\d+)\s*(bed|bedroom|bedrooms)\b", t):
        return True
    if re.search(r"\b\d\s*\+\s*1\b", t):
        return True
    return False


def looks_like_agent_outreach(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    contact_keywords = [
        "contact agent", "contact the agent", "call agent", "call the agent",
        "reach out", "get photos", "get pictures", "more photos", "more pictures",
        "agent photos", "agent pictures", "contact for photos", "contact for pictures",
        "can you contact", "please contact", "contact them", "contact him", "contact her",
        "contact the first", "contact the second", "contact the third", "contact listing",
        "contact this", "contact that", "contact it", "contact one", "contact two", "contact three",
    ]
    return any(k in t for k in contact_keywords)


def looks_like_conversation_continuation(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    continuation_keywords = [
        "what did we talk about", "what did we discuss", "what were we talking about",
        "remember", "you said", "we were talking", "previous conversation", "earlier",
        "what did i ask", "what did i say", "what was our conversation", "recall",
    ]
    return any(k in t for k in continuation_keywords)


def looks_like_status_update(text: str) -> bool:
    t = (text or "").lower()
    if not t:
        return False
    status_keywords = [
        "any update", "any news", "any response", "any reply", "any pictures", "any photos",
        "update on", "news on", "response on", "reply on", "pictures of", "photos of",
        "still waiting", "waiting for", "heard back", "got response", "got reply",
        "agent replied", "agent responded", "agent sent", "agent shared",
        "did they reply", "did they respond", "did they send", "did they share",
        "when will", "how long", "how much longer", "still no", "no response yet",
        "show pictures", "show photos", "show me the photos", "have pictures", "have photos",
    ]
    return any(k in t for k in status_keywords)


def user_asked_for_photos(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in PHOTO_KEYWORDS)


def looks_like_show_options_followup(text: str) -> bool:
    """Detect generic follow-ups like 'show me options', 'what\'s available'."""
    t = (text or "").lower().strip()
    if not t:
        return False
    phrases = [
        "show me options",
        "show options",
        "options",
        "what's available",
        "whats available",
        "show available",
        "what is available",
        "show me what's available",
        "show me available",
        "show listings",
        "show me listings",
        "show properties",
        "show me properties",
        "just show me",
        "show me",
        "what do you have",
    ]
    return any(p in t for p in phrases)
