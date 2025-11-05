from uuid import uuid4

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError

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
def test_assistant_idempotency_skips_duplicate_mirror(monkeypatch):
    stub = StubZepClient()

    monkeypatch.setattr(tasks, "write_enabled", lambda: True)
    monkeypatch.setattr(tasks, "read_enabled", lambda: False)
    monkeypatch.setattr(tasks, "get_client", lambda require_write=False, **__: stub)
    monkeypatch.setattr(tasks, "call_zep", lambda op, func, observe_retry=False: (True, func()))
    # Supervisor returns a simple reply
    monkeypatch.setattr(tasks, "run_supervisor_agent", lambda text, tid, **_: {"message": "ok"})

    # Intercept Message.objects.create to raise IntegrityError for assistant creation
    original_create = Message.objects.create

    def fake_create(*args, **kwargs):
        if kwargs.get("type") == "assistant":
            raise IntegrityError("duplicate assistant")
        return original_create(*args, **kwargs)

    monkeypatch.setattr(Message.objects, "create", fake_create)

    # And return an existing assistant message on .get
    existing = Message.objects.create(
        type="assistant",
        conversation_id="thread-id",
        content="ok",
    )

    def fake_get(**kwargs):
        return existing

    monkeypatch.setattr(Message.objects, "get", lambda **kwargs: fake_get(**kwargs))

    # Set up thread and user message
    User = get_user_model()
    user = User.objects.create_user(username="idem-user", email="idem@example.com", password="pass123")
    thread_uuid = uuid4()
    thread = ConversationThread.objects.create(user=user, thread_id=str(thread_uuid))
    client_uuid = uuid4()

    msg = Message.objects.create(
        type="user",
        conversation_id=thread.thread_id,
        content="hello",
        sender=user,
        client_msg_id=client_uuid,
    )

    tasks.process_chat_message.run(message_id=str(msg.id), thread_id=str(thread.thread_id), client_msg_id=str(client_uuid))

    # We should see only one add_messages for user; assistant mirror is skipped due to duplicate
    user_calls = [c for c in stub.calls if c[0] == "add_messages" and c[2][0]["role"] == "user"]
    assistant_calls = [c for c in stub.calls if c[0] == "add_messages" and c[2][0]["role"] == "assistant"]
    assert len(user_calls) == 1
    assert len(assistant_calls) == 0

