from __future__ import annotations

"""
Structured preference extraction via LLM with graceful fallback.

This module provides a single entry: extract_preferences_from_message(text)
which returns a dict with {preferences: [...], overall_reasoning: str} or None
when disabled. It guards on missing OPENAI_API_KEY and catches LLM failures
so callers can safely fallback to rule extraction.
"""

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _llm_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def extract_preferences_from_message(text: str, *, model: Optional[str] = None, timeout: float = 8.0) -> Optional[Dict[str, Any]]:
    """
    Attempt structured extraction via OpenAI with a robust JSON output format.
    Returns None when unavailable or on error; callers should use fallback.
    """
    if not _llm_available():
        return None
    try:
        from openai import OpenAI
        import json

        client = OpenAI()
        model = model or os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
        system = (
            "You extract user preferences for a real estate/services app. "
            "Return strict JSON: {\n  \"preferences\": [ {\n    \"category\": one of [real_estate, services, lifestyle, general],\n    \"preference_type\": string,\n    \"value\": {\"type\": \"range|list|single\", ...},\n    \"confidence\": float 0..1,\n    \"source\": \"explicit|inferred\",\n    \"reasoning\": string\n  } ],\n  \"overall_reasoning\": string\n}\n"
        )
        user = f"Utterance: {text}"
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            timeout=timeout,
        )
        content = resp.choices[0].message.content
        data = json.loads(content or "{}")
        prefs = data.get("preferences")
        if not isinstance(prefs, list):
            return None
        # Confidence threshold
        filtered = [p for p in prefs if float(p.get("confidence", 0)) >= 0.4]
        data["preferences"] = filtered
        return data
    except Exception as e:
        logger.warning(f"LLM preference extraction failed: {e}")
        return None

