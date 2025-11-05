"""
Golden frame tests for WebSocket v1.0 contract.

Ensures real frames match frozen schemas without drift.
"""
import json
import pytest
from pathlib import Path
from jsonschema import validate, ValidationError


SCHEMA_DIR = Path(__file__).parent.parent.parent / "schema" / "ws" / "1.0"
GOLDEN_DIR = Path(__file__).parent.parent / "golden" / "ws" / "v1.0"


def load_json(path: Path) -> dict:
    """Load JSON file."""
    with open(path) as f:
        return json.load(f)


@pytest.fixture
def assistant_message_schema():
    """Load assistant_message schema."""
    return load_json(SCHEMA_DIR / "assistant_message.schema.json")


@pytest.fixture
def envelope_schema():
    """Load envelope schema."""
    return load_json(SCHEMA_DIR / "envelope.schema.json")


def test_golden_assistant_message_show_listings(assistant_message_schema):
    """
    Golden frame: assistant_message with show_listings action.

    This is the most common frame type (property search results).
    """
    golden_frame = load_json(GOLDEN_DIR / "001-assistant_message-show_listings.json")

    # Must validate against schema
    validate(instance=golden_frame, schema=assistant_message_schema)

    # Critical fields must be present
    assert golden_frame["type"] == "chat_message"
    assert golden_frame["event"] == "assistant_message"
    assert golden_frame["thread_id"]
    assert golden_frame["payload"]["text"]
    assert golden_frame["meta"]["in_reply_to"]

    # Agent tagging must work
    assert golden_frame["payload"]["agent"] == "real_estate"

    # Recommendations must have correct shape
    recs = golden_frame["payload"]["rich"]["recommendations"]
    assert len(recs) > 0
    assert all("id" in r and "type" in r and "agent" in r for r in recs)


def test_golden_chat_status_typing(envelope_schema):
    """
    Golden frame: chat_status typing indicator.

    Simple frame with minimal payload.
    """
    golden_frame = load_json(GOLDEN_DIR / "002-chat_status-typing.json")

    # Must validate against envelope schema
    validate(instance=golden_frame, schema=envelope_schema)

    assert golden_frame["type"] == "chat_status"
    assert golden_frame["event"] == "typing"
    assert golden_frame["payload"]["value"] is True


def test_schema_immutability():
    """
    Snapshot test: Schemas must not change without version bump.

    If this fails, you've modified a v1.0 schema. Create v1.1 instead.
    """
    # Load current schemas
    envelope = load_json(SCHEMA_DIR / "envelope.schema.json")
    assistant_msg = load_json(SCHEMA_DIR / "assistant_message.schema.json")

    # Check schema IDs haven't changed (version in URL)
    assert "/1.0/" in envelope["$id"], "Envelope schema version changed!"
    assert "/1.0/" in assistant_msg["$id"], "Assistant message schema version changed!"

    # Check required fields haven't been removed
    assert set(envelope["required"]) == {"type", "event", "thread_id", "payload", "meta"}
    assert set(assistant_msg["properties"]["payload"]["required"]) == {"text"}
