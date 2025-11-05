from uuid import uuid4

import pytest
from pydantic import ValidationError
import asyncio

from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model

from django.conf import settings

POSTGRES_ENABLED = "postgres" in settings.DATABASES["default"]["ENGINE"] or "postgresql" in settings.DATABASES["default"]["ENGINE"]

pytestmark = pytest.mark.skipif(
    not POSTGRES_ENABLED,
    reason="requires PostgreSQL backend (ArrayField in real_estate app)",
)

from assistant.tasks import WsAssistantFrame, process_chat_message
from assistant.models import ConversationThread, Message
from assistant.consumers import ChatConsumer


@pytest.mark.django_db
def test_ws_envelope_has_in_reply_to():
    thread_id = uuid4()
    with pytest.raises(ValidationError):
        WsAssistantFrame(
            type="chat_message",
            event="assistant_message",
            thread_id=thread_id,
            payload={"text": "Hello", "rich": {}},
            meta={},
        )


@pytest.mark.django_db
def test_group_name_and_type_are_correct(monkeypatch):
    User = get_user_model()
    user = User.objects.create_user(username="ws-contract", email="c@example.com", password="pass123")
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

    captured_calls = []

    class DummyLayer:
        def group_send(self, group, event):
            captured_calls.append((group, event))

    monkeypatch.setattr('assistant.tasks.get_channel_layer', lambda: DummyLayer())
    monkeypatch.setattr('assistant.tasks.async_to_sync', lambda func: func)
    monkeypatch.setattr('assistant.tasks.run_supervisor_agent', lambda text, tid, **_: {"message": "hi", "recommendations": []})

    process_chat_message.run(message_id=str(msg.id), thread_id=str(thread.thread_id), client_msg_id=str(client_uuid))

    assistant_events = [call for call in captured_calls if call[1].get('type') == 'chat.message']
    assert assistant_events, "Expected assistant frame to be emitted"

    group_name, payload = assistant_events[0]
    assert group_name == f"thread-{thread.thread_id}"

    frame = payload["data"]
    assert frame["type"] == "chat_message"
    assert frame["event"] == "assistant_message"
    assert frame["meta"]["in_reply_to"] == str(client_uuid)
    assert frame["meta"]["traces"]["memory"] == {"used": False, "mode": "off", "source": "zep"}


@pytest.fixture
def websocket_user(db):
    User = get_user_model()
    return User.objects.create_user(
        username='ws-client',
        email='ws-client@example.com',
        password='pass123',
        is_active=True,
    )


@pytest.mark.django_db
def test_websocket_consumer_delivers_assistant_frame(websocket_user):
    thread_id = str(uuid4())
    ConversationThread.objects.create(user=websocket_user, thread_id=thread_id)

    async def scenario():
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), f"/ws/chat/{thread_id}/")
        communicator.scope.setdefault('headers', [])
        communicator.scope['user'] = websocket_user
        communicator.scope['auth_method'] = 'tests'
        communicator.scope['url_route'] = {'kwargs': {'thread_id': thread_id}}
        communicator.scope['session'] = {}

        connected, _ = await communicator.connect()
        assert connected is True

        channel_layer = get_channel_layer()
        client_msg_id = str(uuid4())
        queued_id = str(uuid4())

        await channel_layer.group_send(
            f"thread-{thread_id}",
            {
                "type": "chat.message",
                "data": {
                    "type": "chat_message",
                    "event": "assistant_message",
                    "thread_id": thread_id,
                    "payload": {"text": "WS hi", "rich": {}},
                    "meta": {
                        "in_reply_to": client_msg_id,
                        "queued_message_id": queued_id,
                        "traces": {"memory": {"used": False, "mode": "off", "source": "zep"}},
                    },
                },
            },
        )

        response = await communicator.receive_json_from()
        assert response["type"] == "chat_message"
        assert response["meta"]["in_reply_to"] == client_msg_id
        assert response["payload"]["text"] == "WS hi"

        await communicator.disconnect()

    asyncio.run(scenario())
