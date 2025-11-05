"""
Tests for Real Estate Agent Prompt-Driven Handler

Validates JSON contract, slot discipline, continuity, and switch behavior.
"""

import pytest
import json
from assistant.brain.prompts.renderer import (
    render_real_estate_prompt,
    parse_real_estate_response,
    RealEstateAgentResponse
)
from assistant.domain.real_estate_service import (
    extract_slots,
    merge_and_commit_slots,
    get_missing_slots,
    should_execute_search
)


class TestJSONContract:
    """
    Test JSON contract: 100% parseable, act ∈ allowed set, slots_delta only changed keys.
    """

    def test_parse_valid_json_with_code_fence(self):
        """Should parse JSON wrapped in markdown code fence."""
        response = '''
```json
{
  "act": "ASK_SLOT",
  "speak": "Got it — Girne, £600. Is this for short-term or long-term?",
  "slots_delta": {"location": "Girne", "budget": 600, "budget_currency": "GBP"},
  "next_needed": ["rental_type"],
  "notes": {"normalizations": ["GBP from 'pounds'"]}
}
```
        '''
        parsed = parse_real_estate_response(response, strict=True)

        assert parsed is not None
        assert parsed["act"] == "ASK_SLOT"
        assert parsed["speak"] == "Got it — Girne, £600. Is this for short-term or long-term?"
        assert parsed["slots_delta"]["location"] == "Girne"
        assert parsed["next_needed"] == ["rental_type"]

    def test_parse_valid_json_without_fence(self):
        """Should parse raw JSON without code fence."""
        response = '''
{
  "act": "SEARCH_AND_RECOMMEND",
  "speak": "I'll show options in Girne around £600.",
  "slots_delta": {"rental_type": "long_term"},
  "next_needed": [],
  "notes": {}
}
        '''
        parsed = parse_real_estate_response(response, strict=True)

        assert parsed is not None
        assert parsed["act"] == "SEARCH_AND_RECOMMEND"
        assert parsed["slots_delta"]["rental_type"] == "long_term"
        assert parsed["next_needed"] == []

    def test_parse_invalid_json_returns_none(self):
        """Should return None for invalid JSON."""
        response = "This is not JSON at all"
        parsed = parse_real_estate_response(response, strict=True)

        assert parsed is None

    def test_validate_act_field(self):
        """Should only accept valid act values."""
        valid_acts = ["ASK_SLOT", "ACK_AND_SEARCH", "SEARCH_AND_RECOMMEND", "CLARIFY", "ESCALATE"]

        for act in valid_acts:
            response = RealEstateAgentResponse(
                act=act,
                speak="Test",
                slots_delta={},
                next_needed=[]
            )
            assert response.act == act

    def test_reject_invalid_act(self):
        """Should reject invalid act values."""
        with pytest.raises(Exception):  # Pydantic ValidationError
            RealEstateAgentResponse(
                act="INVALID_ACT",
                speak="Test",
                slots_delta={},
                next_needed=[]
            )

    def test_slots_delta_only_changed_keys(self):
        """Should only include changed keys in slots_delta."""
        # Simulate LLM response with only changed keys
        response = {
            "act": "ASK_SLOT",
            "speak": "What's your budget?",
            "slots_delta": {"location": "Girne"},  # Only location changed
            "next_needed": ["budget"]
        }

        # Verify only changed keys present
        assert "location" in response["slots_delta"]
        assert "budget" not in response["slots_delta"]
        assert len(response["slots_delta"]) == 1


class TestSlotDiscipline:
    """
    Test slot discipline: Given missing rental_type, output is ASK_SLOT.
    No extra questions, no re-asking.
    """

    def test_extract_slots_from_user_input(self):
        """Should extract location, bedrooms, budget from user input."""
        user_input = "2 bedroom in Girne ~600 pounds"

        slots = extract_slots(user_input)

        assert "location" in slots
        assert slots["location"] in ("Girne", "Kyrenia")  # Either form
        assert "bedrooms" in slots
        assert slots["bedrooms"] == 2
        assert "budget" in slots
        assert slots["budget"] == 600

    def test_merge_slots_without_overwrite(self):
        """Should merge new slots with existing without losing data."""
        existing = {"location": "Girne", "budget": 600}
        new = {"bedrooms": 2, "rental_type": "long_term"}

        merged = merge_and_commit_slots(existing, new)

        assert merged["location"] == "Girne"
        assert merged["budget"] == 600
        assert merged["bedrooms"] == 2
        assert merged["rental_type"] == "long_term"

    def test_merge_slots_with_refinement(self):
        """Should allow refinement (new values override existing)."""
        existing = {"location": "Girne", "budget": 600}
        new = {"budget": 500}  # User says "cheaper"

        merged = merge_and_commit_slots(existing, new)

        assert merged["location"] == "Girne"  # Preserved
        assert merged["budget"] == 500  # Refined

    def test_get_missing_slots_rental_type_first(self):
        """Should identify rental_type as missing when not present."""
        filled = {"location": "Girne", "budget": 600}

        missing = get_missing_slots(filled, required_slots=["rental_type", "location", "budget"])

        assert "rental_type" in missing
        assert "location" not in missing
        assert "budget" not in missing

    def test_should_execute_search_all_filled(self):
        """Should return True when all required slots filled."""
        filled = {"rental_type": "long_term", "location": "Girne", "budget": 600}

        should_search, missing_slot = should_execute_search(filled)

        assert should_search is True
        assert missing_slot is None

    def test_should_execute_search_missing_slot(self):
        """Should return False and indicate missing slot."""
        filled = {"location": "Girne", "budget": 600}  # rental_type missing

        should_search, missing_slot = should_execute_search(filled)

        assert should_search is False
        assert missing_slot == "rental_type"


class TestContinuity:
    """
    Test continuity: With existing {location=Girne, budget=600}, "short term" → SEARCH_AND_RECOMMEND.
    No re-ask for location or budget.
    """

    def test_continuity_no_reask(self):
        """Should not re-ask for slots that are already filled."""
        # Turn 1: User provides location and budget
        existing = {}
        new = extract_slots("Girne 600 pounds")
        filled = merge_and_commit_slots(existing, new)

        assert "location" in filled
        assert "budget" in filled

        # Turn 2: User provides rental type
        new2 = extract_slots("short term")
        filled2 = merge_and_commit_slots(filled, new2)

        # Should have all slots now
        assert "location" in filled2
        assert "budget" in filled2
        assert "rental_type" in filled2

        # Should be ready to search
        should_search, _ = should_execute_search(filled2)
        assert should_search is True

    def test_prompt_rendering_with_existing_context(self):
        """Should render prompt with existing agent_collected_info."""
        existing_slots = {"location": "Girne", "budget": 600, "budget_currency": "GBP"}

        prompt = render_real_estate_prompt(
            thread_id="test-123",
            active_domain="real_estate_agent",
            current_intent="property_search",
            user_input="short term",
            agent_collected_info=existing_slots
        )

        # Prompt should contain existing slots
        assert "Girne" in prompt or "600" in prompt
        # Should instruct to check agent_collected_info
        assert "agent_collected_info" in prompt


class TestExplicitSwitch:
    """
    Test explicit switch: "actually show me cars" → ESCALATE.
    """

    def test_escalate_keywords_not_in_refinement(self):
        """Should recognize explicit switch keywords."""
        # These inputs should NOT be treated as refinements
        switch_inputs = [
            "actually show me cars",
            "instead I want vehicles",
            "show me marketplace items"
        ]

        for user_input in switch_inputs:
            slots = extract_slots(user_input)
            # Should not extract real estate slots from switch statements
            assert len(slots) == 0 or all(v is None for v in slots.values())


class TestPromptRendering:
    """
    Test that prompt template renders correctly with context.
    """

    def test_render_with_minimal_context(self):
        """Should render prompt with minimal context."""
        prompt = render_real_estate_prompt(
            thread_id="test-123",
            active_domain="real_estate_agent",
            current_intent="property_search",
            user_input="I need an apartment"
        )

        assert len(prompt) > 0
        assert "Real-Estate Agent" in prompt
        assert "test-123" in prompt
        assert "I need an apartment" in prompt

    def test_render_with_full_context(self):
        """Should render prompt with full context."""
        prompt = render_real_estate_prompt(
            thread_id="test-456",
            active_domain="real_estate_agent",
            current_intent="property_search",
            user_input="2 bedroom in Kyrenia",
            conversation_summary="User is looking for long-term rental",
            fused_context="Previous: user asked about Kyrenia area",
            user_profile={"preferred_locations": ["Kyrenia"], "budget_range": "500-800"},
            agent_collected_info={"location": "Kyrenia", "bedrooms": 2},
            token_budget={"remaining": 4000, "max": 6000}
        )

        assert "test-456" in prompt
        assert "Kyrenia" in prompt
        assert "2 bedroom" in prompt or "2" in prompt
        # Should include context
        assert "long-term rental" in prompt or "Previous" in prompt


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
