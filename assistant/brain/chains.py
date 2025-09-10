from typing import Any, Dict
import json

from .llm import get_chat_model, with_json_mode
from .prompts import LANGUAGE_PROMPT, INTENT_PROMPT, REQUIREMENTS_PROMPT, FALLBACK_PROMPT


def language_chain() -> Any:
    llm = get_chat_model()
    return LANGUAGE_PROMPT | llm


def intent_chain() -> Any:
    llm = with_json_mode(get_chat_model())
    return INTENT_PROMPT | llm


def fallback_chain() -> Any:
    llm = get_chat_model()
    return FALLBACK_PROMPT | llm


def requirements_chain() -> Any:
    llm = with_json_mode(get_chat_model())
    return REQUIREMENTS_PROMPT | llm


def run_chain(chain: Any, **kwargs: Dict[str, Any]) -> str:
    """Run a simple LC chain and return raw text (caller parses JSON if needed)."""
    result = chain.invoke(kwargs)
    # Newer LC returns string; older may return Message
    if hasattr(result, "content"):
        return result.content
    if isinstance(result, str):
        return result
    return json.dumps(result)


