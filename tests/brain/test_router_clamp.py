"""
Tests for router hardening: clamping unknown targets.
Ensures unknown agent targets default to general_conversation_agent.
"""

import pytest
from unittest.mock import patch, MagicMock


def test_unknown_target_routes_to_general_conversation():
    """Test that unknown target_agent is clamped to general_conversation_agent."""
    from assistant.brain.supervisor_graph import route_to_agent
    
    # Mock state with unknown target
    state = {
        "routing_decision": "safety_agent",  # Unknown agent
        "thread_id": "test-123"
    }
    
    result = route_to_agent(state)
    
    # Should clamp to known agent
    assert result == "general_conversation_agent"


def test_known_targets_pass_through():
    """Test that known target agents pass through unchanged."""
    from assistant.brain.supervisor_graph import route_to_agent
    
    known_targets = [
        "real_estate_agent",
        "marketplace_agent",
        "general_conversation_agent",
        "local_info_agent"
    ]
    
    for target in known_targets:
        state = {"routing_decision": target, "thread_id": "test-123"}
        result = route_to_agent(state)
        assert result == target, f"Target {target} should pass through"
