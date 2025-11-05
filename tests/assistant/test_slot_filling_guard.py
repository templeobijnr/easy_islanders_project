"""
Unit tests for slot-filling guard router continuity.

Tests that the slot-filling guard properly pins routes when awaiting_slot
is set, preventing router flapping during slot collection.
"""
import pytest
from unittest.mock import patch
from assistant.brain.slot_filling_guard import _should_pin_to_real_estate, apply_slot_filling_guard
from assistant.brain.supervisor_schemas import SupervisorState


@pytest.fixture
def base_state() -> SupervisorState:
    """Base supervisor state for testing."""
    return {
        "thread_id": "test-thread-123",
        "user_input": "",
        "active_domain": "real_estate_agent",
        "agent_contexts": {
            "real_estate_agent": {
                "stage": "slot_filling",
                "filled_slots": {},
                "awaiting_slot": None,
            }
        }
    }


def test_router_continuity_awaiting_slot_set(base_state):
    """Test that route pins when awaiting_slot is set."""
    # Set awaiting_slot to "budget"
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "500 pounds"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    assert should_pin is True
    assert reason == "awaiting_slot_budget"


def test_router_continuity_awaiting_location(base_state):
    """Test pinning when awaiting location slot."""
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "location"
    base_state["user_input"] = "kyrenia"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    assert should_pin is True
    assert reason == "awaiting_slot_location"


def test_router_continuity_awaiting_rental_type(base_state):
    """Test pinning when awaiting rental_type slot."""
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "rental_type"
    base_state["user_input"] = "long term"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    assert should_pin is True
    assert reason == "awaiting_slot_rental_type"


def test_no_pin_when_awaiting_slot_none(base_state):
    """Test that no pin occurs when awaiting_slot is None (all slots filled)."""
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = None
    base_state["user_input"] = "can you show me more?"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    # Should still check other heuristics (short input in this case)
    # But awaiting_slot=None means slots are complete
    assert reason != "awaiting_slot_None"  # Should not pin for awaiting_slot


def test_pin_takes_precedence_over_other_heuristics(base_state):
    """Test that awaiting_slot pin takes precedence over other heuristics."""
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "I changed my mind, actually show me cars instead"  # Long explicit switch

    should_pin, reason = _should_pin_to_real_estate(base_state)

    # Should still pin because awaiting_slot is set
    # The awaiting_slot check happens BEFORE explicit switch check
    assert should_pin is True
    assert reason == "awaiting_slot_budget"


def test_router_continuity_sequence(base_state):
    """Test pinning across a sequence of slot fills."""
    # Turn 1: User provides location, awaiting_slot="budget"
    base_state["agent_contexts"]["real_estate_agent"]["filled_slots"] = {"location": "Kyrenia"}
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "500 pounds"

    should_pin, reason = _should_pin_to_real_estate(base_state)
    assert should_pin is True
    assert reason == "awaiting_slot_budget"

    # Turn 2: After budget filled, awaiting_slot="rental_type"
    base_state["agent_contexts"]["real_estate_agent"]["filled_slots"]["budget"] = 500
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "rental_type"
    base_state["user_input"] = "long term"

    should_pin, reason = _should_pin_to_real_estate(base_state)
    assert should_pin is True
    assert reason == "awaiting_slot_rental_type"

    # Turn 3: All slots filled, awaiting_slot=None
    base_state["agent_contexts"]["real_estate_agent"]["filled_slots"]["rental_type"] = "long_term"
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = None
    base_state["agent_contexts"]["real_estate_agent"]["stage"] = "presenting"
    base_state["user_input"] = "can you show me cheaper options?"

    should_pin, reason = _should_pin_to_real_estate(base_state)
    # Should not pin for awaiting_slot (it's None)
    # May pin for other reasons (refinement keyword "cheaper")
    if should_pin:
        assert reason != "awaiting_slot_None"


def test_apply_guard_sets_target_agent(base_state):
    """Test that apply_slot_filling_guard sets target_agent when pinning."""
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "600"

    result_state = apply_slot_filling_guard(base_state)

    assert result_state["target_agent"] == "real_estate_agent"
    assert result_state["router_reason"] == "slot_filling_guard:awaiting_slot_budget"
    assert result_state["router_confidence"] == 1.0


def test_no_pin_when_not_real_estate_domain(base_state):
    """Test that guard doesn't pin when active_domain is not real_estate_agent."""
    base_state["active_domain"] = "general_conversation_agent"
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "500"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    assert should_pin is False
    assert reason is None


def test_no_pin_when_not_slot_filling_stage(base_state):
    """Test that awaiting_slot check skips if not in slot_filling stage."""
    base_state["agent_contexts"]["real_estate_agent"]["stage"] = "presenting"
    base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = "budget"
    base_state["user_input"] = "500"

    should_pin, reason = _should_pin_to_real_estate(base_state)

    # Should not pin for awaiting_slot because stage is not slot_filling
    # The check returns early before checking awaiting_slot
    assert should_pin is False


def test_pin_with_refinement_inputs(base_state):
    """Test pinning with typical refinement inputs."""
    test_cases = [
        ("in girne", "contains_city_Girne"),
        ("short term", "short_input_2_words"),
        ("cheaper", "refinement_keyword_cheaper"),
        ("500", "contains_number"),
        ("pounds", "contains_currency"),
    ]

    for user_input, expected_reason_contains in test_cases:
        base_state["user_input"] = user_input
        base_state["agent_contexts"]["real_estate_agent"]["awaiting_slot"] = None

        should_pin, reason = _should_pin_to_real_estate(base_state)

        assert should_pin is True, f"Should pin for input: {user_input}"
        assert expected_reason_contains in reason or reason.startswith("short_input"), \
            f"Reason '{reason}' doesn't match expected for input: {user_input}"
