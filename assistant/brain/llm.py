from typing import Any, Dict
import os

from django.conf import settings
from .config import OPENAI_CHAT_MODEL, DEFAULT_REQUEST_TIMEOUT_SECONDS, DEFAULT_MAX_RETRIES


def get_chat_model() -> Any:
    """Create a LangChain ChatOpenAI model lazily.

    Returns Any to avoid hard dependency at import time if not installed.
    """
    try:
        from langchain_openai import ChatOpenAI
    except Exception as e:
        raise RuntimeError("langchain-openai is not installed") from e

    # Try Django settings first, then fall back to environment variable
    api_key = getattr(settings, 'OPENAI_API_KEY', None) or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    return ChatOpenAI(
        api_key=api_key,
        model=OPENAI_CHAT_MODEL,
        temperature=0.2,
        timeout=DEFAULT_REQUEST_TIMEOUT_SECONDS,
        max_retries=DEFAULT_MAX_RETRIES,
    )


def with_json_mode(model: Any) -> Any:
    """Return a clone configured to prefer JSON outputs where supported.

    Attempts to bind response_format={"type": "json_object"}. Falls back to the
    original model if unsupported.
    """
    try:
        return model.bind(response_format={"type": "json_object"})
    except Exception:
        return model

