"""
Snapshot tests for Real Estate Agent contracts (v1.0).

Ensures AgentRequest/AgentResponse schemas don't drift without version bump.
"""
import json
import pytest
from pathlib import Path
from jsonschema import validate


SCHEMA_DIR = Path(__file__).parent.parent.parent / "schema" / "agent" / "real_estate" / "1.0"


def load_json(path: Path) -> dict:
    """Load JSON file."""
    with open(path) as f:
        return json.load(f)


@pytest.fixture
def agent_request_schema():
    """Load AgentRequest schema."""
    return load_json(SCHEMA_DIR / "request.schema.json")


@pytest.fixture
def agent_response_schema():
    """Load AgentResponse schema."""
    return load_json(SCHEMA_DIR / "response.schema.json")


def test_agent_request_schema_immutable(agent_request_schema):
    """
    Snapshot: AgentRequest schema must not change without version bump.

    If this fails, create schema v1.1 and update migration notes.
    """
    # Check version in schema ID
    assert "/1.0/" in agent_request_schema["$id"], "AgentRequest schema version changed!"

    # Check required fields haven't been removed
    required = set(agent_request_schema["required"])
    assert required == {"thread_id", "client_msg_id", "intent", "input", "ctx"}

    # Check intent enum hasn't changed (adding is OK, removing breaks)
    intent_enum = set(agent_request_schema["properties"]["intent"]["enum"])
    assert "property_search" in intent_enum
    assert "property_qa" in intent_enum


def test_agent_response_schema_immutable(agent_response_schema):
    """
    Snapshot: AgentResponse schema must not change without version bump.
    """
    # Check version in schema ID
    assert "/1.0/" in agent_response_schema["$id"], "AgentResponse schema version changed!"

    # Check required fields
    required = set(agent_response_schema["required"])
    assert required == {"reply", "actions"}

    # Check action types enum
    action_items = agent_response_schema["properties"]["actions"]["items"]
    action_types = set(action_items["properties"]["type"]["enum"])
    assert "show_listings" in action_types
    assert "ask_clarification" in action_types


def test_valid_agent_request_example(agent_request_schema):
    """
    Test that a valid AgentRequest validates against schema.
    """
    example_request = {
        "thread_id": "test-001",
        "client_msg_id": "msg-001",
        "intent": "property_search",
        "input": "I'm looking for a 2 bedroom apartment in Kyrenia",
        "ctx": {
            "user_id": "user-123",
            "locale": "en",
            "time": "2025-11-02T12:00:00Z"
        }
    }

    # Should validate without errors
    validate(instance=example_request, schema=agent_request_schema)


def test_valid_agent_response_example(agent_response_schema):
    """
    Test that a valid AgentResponse validates against schema.
    """
    example_response = {
        "reply": "I found 4 properties matching your search:",
        "actions": [
            {
                "type": "show_listings",
                "params": {
                    "listings": [
                        {"id": "prop-001", "title": "Modern 2BR"}
                    ]
                }
            }
        ],
        "traces": {
            "execution_time_seconds": 0.123,
            "state_transitions": ["SLOT_FILL", "SEARCH", "SHOW_LISTINGS"]
        }
    }

    # Should validate without errors
    validate(instance=example_response, schema=agent_response_schema)
