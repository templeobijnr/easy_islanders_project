from uuid import uuid4

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

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
def test_write_path_redacts_pii(monkeypatch):
    stub = StubZepClient()

    monkeypatch.setattr(tasks, "write_enabled", lambda: True)
    monkeypatch.setattr(tasks, "read_enabled", lambda: False)
    monkeypatch.setattr(tasks, "get_client", lambda require_write=False, **__: stub)
    monkeypatch.setattr(tasks, "call_zep", lambda op, func, observe_retry=False: (True, func()))
    monkeypatch.setattr(tasks, "run_supervisor_agent", lambda text, tid, **_: {"message": "Assistant reply with phone +90 533 123 4567 and email me@site.com"})

    captured_calls = []

    class DummyLayer:
        def group_send(self, group, event):
            captured_calls.append((group, event))

    monkeypatch.setattr(tasks, "get_channel_layer", lambda: DummyLayer())
    monkeypatch.setattr(tasks, "async_to_sync", lambda func: func)

    User = get_user_model()
    user = User.objects.create_user(username="pii-writer", email="user@example.com", password="pass123")
    thread_uuid = uuid4()
    thread = ConversationThread.objects.create(user=user, thread_id=str(thread_uuid))
    client_uuid = uuid4()

    user_text = "Contact me at me@example.com or call +90 533 123 4567"
    msg = Message.objects.create(
        type="user",
        conversation_id=thread.thread_id,
        content=user_text,
        sender=user,
        client_msg_id=client_uuid,
    )

    tasks.process_chat_message.run(message_id=str(msg.id), thread_id=str(thread.thread_id), client_msg_id=str(client_uuid))

    add_calls = [entry for entry in stub.calls if entry[0] == "add_messages"]
    assert len(add_calls) == 2

    # User message redacted
    user_payload = add_calls[0][2][0]
    assert "[EMAIL]" in user_payload["content"]
    assert "[PHONE]" in user_payload["content"]
    assert user_payload["metadata"].get("pii_redactions")

    # Assistant message redacted
    assistant_payload = add_calls[1][2][0]
    assert "[EMAIL]" in assistant_payload["content"]
    assert "[PHONE]" in assistant_payload["content"]
    assert assistant_payload["metadata"].get("pii_redactions")

