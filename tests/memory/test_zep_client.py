import json
from typing import Any, Dict, List, Optional

import pytest
import requests

from assistant.memory.zep_client import (
    ZepCircuitOpenError,
    ZepClient,
    ZepRequestError,
)


class DummyResponse:
    def __init__(self, status_code: int = 200, json_data: Optional[Any] = None, text: str = ""):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text or (json.dumps(json_data) if json_data is not None else "")

    def json(self):
        if isinstance(self._json_data, Exception):
            raise self._json_data
        if self._json_data is None:
            raise ValueError("no json")
        return self._json_data


class DummySession:
    def __init__(self, responses: List[Any]):
        self._responses = responses
        self.calls: List[Dict[str, Any]] = []

    def request(self, method, url, headers=None, json=None, params=None, timeout=None):
        self.calls.append(
            {
                "method": method,
                "url": url,
                "headers": headers,
                "json": json,
                "params": params,
                "timeout": timeout,
            }
        )
        if not self._responses:
            raise AssertionError("No more responses configured")
        next_item = self._responses.pop(0)
        if isinstance(next_item, Exception):
            raise next_item
        return next_item


def test_ensure_user_posts_payload_and_returns_data():
    responses = [DummyResponse(200, {"id": "user-123"})]
    session = DummySession(responses)
    client = ZepClient(
        "https://zep.local",
        api_key="secret",
        session=session,
        max_retries=0,
    )

    result = client.ensure_user("user-123", email="user@example.com", first_name="Ada")

    assert session.calls, "Expected at least one HTTP call"
    call = session.calls[0]
    assert call["url"] == "https://zep.local/api/v2/users"
    assert call["json"]["userId"] == "user-123"
    assert call["json"]["email"] == "user@example.com"
    assert result == {"id": "user-123"}


def test_get_user_context_normalises_missing_fields():
    responses = [DummyResponse(200, {"context": "last asked for 2BR"})]
    session = DummySession(responses)
    client = ZepClient("https://zep.local", session=session, max_retries=0)

    result = client.get_user_context("thread-1", mode="summary")

    assert result == {"context": "last asked for 2BR", "facts": [], "recent": []}
    call = session.calls[0]
    assert call["params"] == {"mode": "summary"}


def test_circuit_breaker_opens_after_transient_failures():
    responses = [
        requests.Timeout("timeout-1"),
        requests.Timeout("timeout-2"),
        requests.Timeout("timeout-3"),
    ]
    session = DummySession(responses.copy())
    client = ZepClient(
        "https://zep.local",
        session=session,
        max_retries=0,
        failure_threshold=3,
        cooldown_seconds=60,
    )

    for _ in range(3):
        with pytest.raises(ZepRequestError):
            client.ensure_user("user-456")

    with pytest.raises(ZepCircuitOpenError):
        client.ensure_user("user-456")
