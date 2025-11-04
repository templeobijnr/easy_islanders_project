from __future__ import annotations

import logging
from contextvars import ContextVar, Token
from typing import Optional

_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")


def set_correlation_id(value: Optional[str]) -> Token[str]:
    """
    Store correlation id in a context variable for the current execution context.
    Returns a token that should be used to reset the value.
    """
    if value and value.strip():
        return _correlation_id.set(value.strip())
    return _correlation_id.set("-")


def reset_correlation_id(token: Token[str] | None) -> None:
    if token is None:
        return
    try:
        _correlation_id.reset(token)
    except RuntimeError:
        # Context token already consumed (e.g., double-reset in async scopes).
        # Preserve current correlation id instead of crashing the websocket.
        pass


def get_correlation_id() -> str:
    return _correlation_id.get()


class CorrelationIdFilter(logging.Filter):
    """Ensure every log record has a correlation_id attribute."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: D401
        record.correlation_id = get_correlation_id()
        return True
