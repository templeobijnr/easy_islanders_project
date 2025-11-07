"""Centralised OpenAI chat-completion helper for agent flows."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


_DEFAULT_MODEL = (
    os.getenv("OPENAI_CHAT_COMPLETION_MODEL")
    or os.getenv("OPENAI_CHAT_MODEL")
    or os.getenv("OPENAI_DEFAULT_MODEL")
    or "gpt-4o-mini"
)


class OpenAIUnavailableError(RuntimeError):
    """Raised when OpenAI credentials are missing or the SDK is unavailable."""


def _require_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise OpenAIUnavailableError("OPENAI_API_KEY is not configured")
    return api_key


def generate_chat_completion(
    messages: List[Dict[str, Any]],
    *,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    timeout: float = 30.0,
    **kwargs: Any,
) -> str:
    """Execute a chat completion request and return the assistant text."""

    api_key = _require_api_key()
    try:
        from openai import OpenAI
    except Exception as exc:  # noqa: BLE001
        raise OpenAIUnavailableError(f"openai SDK import failed: {exc}") from exc

    client = OpenAI(api_key=api_key, timeout=timeout)
    request_payload: Dict[str, Any] = {
        "model": model or _DEFAULT_MODEL,
        "messages": messages,
    }
    if temperature is not None:
        request_payload["temperature"] = temperature
    if max_tokens is not None:
        request_payload["max_tokens"] = max_tokens
    request_payload.update(kwargs)

    response = client.chat.completions.create(**request_payload)
    choice = response.choices[0] if response.choices else None
    content = choice.message.content if choice and choice.message else ""
    if not content:
        logger.warning("OpenAI chat completion returned empty content")
    return content or ""


__all__ = ["generate_chat_completion", "OpenAIUnavailableError"]
