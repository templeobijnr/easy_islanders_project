from uuid import uuid4

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

from assistant.memory.flags import MemoryMode
from assistant.memory.zep_client import ZepRequestError
from assistant.memory import service as memory_service
import assistant.tasks as tasks
from assistant.models import ConversationThread, Message


POSTGRES_ENABLED = "postgres" in settings.DATABASES["default"]["ENGINE"] or "postgresql" in settings.DATABASES["default"]["ENGINE"]


class StubZepClient:
    def __init__(self):
        self.calls = []

    def ensure_user(self, user_id: str, **_: object) -> dict:
        self.calls.append(("ensure_user", user_id))
        return {}

    def ensure_thread(self, thread_id: str, user_id: str) -> dict:
        self.calls.append(("ensure_thread", thread_id, user_id))
        return {}

    def add_messages(self, thread_id: str, messages):
        self.calls.append(("add_messages", thread_id, messages))
        return {}


@pytest.mark.django_db
@pytest.mark.skipif(not POSTGRES_ENABLED, reason="requires PostgreSQL backend (ArrayField in real_estate app)")
def test_process_chat_message_mirrors_turn_to_zep(monkeypatch):
    stub = StubZepClient()

    monkeypatch.setattr(tasks, "write_enabled", lambda: True)
    monkeypatch.setattr(tasks, "read_enabled", lambda: False)
    monkeypatch.setattr(tasks, "current_mode", lambda: MemoryMode.WRITE_ONLY)
    monkeypatch.setattr(tasks, "get_client", lambda require_write=False, **__: stub)
    monkeypatch.setattr(tasks, "call_zep", lambda op, func, observe_retry=False: (True, func()))
    monkeypatch.setattr(tasks, "run_supervisor_agent", lambda text, tid, **_: {"message": "hi there"})

    captured_calls = []

    class DummyLayer:
        def group_send(self, group, event):
            captured_calls.append((group, event))

    monkeypatch.setattr(tasks, "get_channel_layer", lambda: DummyLayer())
    monkeypatch.setattr(tasks, "async_to_sync", lambda func: func)

    User = get_user_model()
    user = User.objects.create_user(username="zep-writer", email="zw@example.com", password="pass123")
    thread_uuid = uuid4()
    thread = ConversationThread.objects.create(user=user, thread_id=str(thread_uuid))
    client_uuid = uuid4()

    msg = Message.objects.create(
        type="user",
        conversation_id=thread.thread_id,
        content="hello from user",
        sender=user,
        client_msg_id=client_uuid,
    )

    tasks.process_chat_message.run(message_id=str(msg.id), thread_id=str(thread.thread_id), client_msg_id=str(client_uuid))

    ops = [entry[0] for entry in stub.calls]
    assert ops.count("add_messages") == 2, f"Unexpected Zep calls: {stub.calls}"
    assert ("ensure_user", str(user.id)) in stub.calls
    add_payloads = [entry for entry in stub.calls if entry[0] == "add_messages"]
    assert add_payloads[0][2][0]["role"] == "user"
    assert add_payloads[1][2][0]["role"] == "assistant"

    ws_events = [event for _, event in captured_calls if event.get("type") == "chat.message"]
    assert ws_events, "Expected WebSocket assistant event"
    memory_trace = ws_events[0]["data"]["meta"]["traces"]["memory"]
    assert memory_trace["used"] is True
    assert memory_trace["mode"] == MemoryMode.WRITE_ONLY.value
    assert memory_trace["source"] == "zep"


def test_call_zep_records_retry_after_and_failure(monkeypatch):
    recorded = {"requests": [], "failures": [], "skipped": [], "retry": [], "latency": []}

    monkeypatch.setattr(memory_service, "inc_zep_write_request", lambda op: recorded["requests"].append(op))
    monkeypatch.setattr(memory_service, "inc_zep_write_failure", lambda op, reason: recorded["failures"].append((op, reason)))
    monkeypatch.setattr(memory_service, "inc_zep_write_skipped", lambda op, reason: recorded["skipped"].append((op, reason)))
    monkeypatch.setattr(memory_service, "observe_zep_retry_after", lambda op, seconds: recorded["retry"].append((op, seconds)))
    monkeypatch.setattr(memory_service, "observe_zep_write_latency", lambda op, seconds: recorded["latency"].append((op, seconds)))

    def _raise():
        raise ZepRequestError("throttled", status_code=429, retry_after=2.5)

    ok, _ = memory_service.call_zep("user_message", _raise, observe_retry=True)

    assert ok is False
    assert recorded["requests"] == ["user_message"]
    assert recorded["failures"] == [("user_message", "http_429")]
    assert recorded["skipped"] == []
    assert recorded["retry"] == [("user_message", 2.5)]
    assert recorded["latency"] == []


def test_fetch_thread_context_handles_disabled(monkeypatch):
    monkeypatch.setattr(memory_service, "get_client", lambda **__: None)
    meta_records = {"requests": []}
    monkeypatch.setattr(memory_service, "inc_zep_read_request", lambda op: meta_records["requests"].append(op))
    monkeypatch.setattr(memory_service, "inc_zep_read_failure", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "inc_zep_read_skipped", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "observe_zep_read_latency", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "current_mode", lambda: MemoryMode.OFF)

    context, meta = memory_service.fetch_thread_context("thread-123")

    assert context is None
    assert meta["used"] is False
    assert meta.get("reason") == "disabled"


def test_fetch_thread_context_success(monkeypatch):
    class ReadStub:
        def __init__(self, data):
            self.data = data

        def get_user_context(self, thread_id: str, mode: str = "summary"):
            return self.data

    data = {
        "context": "User prefers Kyrenia apartments",
        "facts": [{"city": "Kyrenia"}],
        "recent": [{"role": "assistant", "content": "Shared 3 listings"}],
    }
    stub = ReadStub(data)

    monkeypatch.setattr(memory_service, "get_client", lambda **__: stub)
    monkeypatch.setattr(memory_service, "inc_zep_read_request", lambda op: None)
    monkeypatch.setattr(memory_service, "inc_zep_read_failure", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "inc_zep_read_skipped", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "observe_zep_read_latency", lambda *_, **__: None)
    monkeypatch.setattr(memory_service, "current_mode", lambda: MemoryMode.READ_ONLY)

    context, meta = memory_service.fetch_thread_context("thread-123")

    assert context == data
    assert meta["used"] is True
    assert meta["mode"] == MemoryMode.READ_ONLY.value
    assert meta["facts_count"] == 1
    assert meta["recent_count"] == 1
