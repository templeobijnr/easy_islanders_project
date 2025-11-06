"""
Unit Tests for Adaptive Slot-Filling System (v2.0)

Tests SlotPolicy and InferenceEngine components.
"""

import pytest
from assistant.brain.slot_policy import SlotPolicy, get_slot_policy
from assistant.brain.inference_engine import (
    infer_slots_heuristic,
    _infer_budget_heuristic,
    _infer_location_heuristic,
    _infer_bedrooms_heuristic,
    _infer_furnishing_heuristic
)


class TestSlotPolicy:
    """Test SlotPolicy class functionality."""

    def test_analyze_slots_all_filled(self):
        """Test slot analysis when all slots are filled."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "rental_type": "short_term",
            "location": "Kyrenia",
            "budget": 500,
            "bedrooms": 2
        }

        analysis = policy.analyze_slots(filled_slots, intent="short_term_rent")

        assert "location" in analysis["filled"]
        assert "rental_type" in analysis["filled"]
        assert len(analysis["missing"]["critical"]) == 0
        assert analysis["completeness"] == 1.0

    def test_analyze_slots_missing_critical(self):
        """Test slot analysis with missing critical slots."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "budget": 500,
            "bedrooms": 2
        }

        analysis = policy.analyze_slots(filled_slots, intent="short_term_rent")

        assert "rental_type" in analysis["missing"]["critical"]
        assert "location" in analysis["missing"]["critical"]
        assert analysis["completeness"] < 1.0

    def test_next_action_ask_critical(self):
        """Test next_action returns 'ask' for missing critical slot."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "budget": 500
        }

        action, slot = policy.next_action(filled_slots, intent="short_term_rent")

        assert action == "ask"
        assert slot in ["rental_type", "location"]  # One of the critical slots

    def test_next_action_skip_after_max_attempts(self):
        """Test next_action returns 'skip' after max attempts."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {}
        slot_prompt_attempts = {
            "rental_type": 3,  # Asked 3 times (max)
            "location": 0
        }

        action, slot = policy.next_action(
            filled_slots,
            intent="short_term_rent",
            slot_prompt_attempts=slot_prompt_attempts
        )

        # Should skip rental_type and try to ask location
        if slot == "rental_type":
            assert action == "skip"
        else:
            assert action == "ask"
            assert slot == "location"

    def test_next_action_soft_ask_contextual(self):
        """Test next_action returns 'soft_ask' for contextual slots when critical filled."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "rental_type": "short_term",
            "location": "Kyrenia"
        }

        action, slot = policy.next_action(filled_slots, intent="short_term_rent")

        # All critical filled, should soft ask contextual
        assert action == "soft_ask"
        assert slot in ["budget", "bedrooms"]

    def test_next_action_search_when_complete(self):
        """Test next_action returns 'search' when critical + contextual filled."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "rental_type": "short_term",
            "location": "Kyrenia",
            "budget": 500,
            "bedrooms": 2
        }

        action, slot = policy.next_action(filled_slots, intent="short_term_rent")

        assert action == "search"
        assert slot is None

    def test_can_proceed_true(self):
        """Test can_proceed returns True when all critical slots filled."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "rental_type": "short_term",
            "location": "Kyrenia"
        }

        assert policy.can_proceed(filled_slots, intent="short_term_rent") is True

    def test_can_proceed_false(self):
        """Test can_proceed returns False when critical slots missing."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {
            "budget": 500
        }

        assert policy.can_proceed(filled_slots, intent="short_term_rent") is False

    def test_get_empathy_response(self):
        """Test empathy response retrieval."""
        policy = SlotPolicy(domain="real_estate")

        response = policy.get_empathy_response("skip_slot_graceful")

        assert isinstance(response, str)
        assert len(response) > 0

    def test_merge_intent_schemas(self):
        """Test intent schema merging when user switches intent."""
        policy = SlotPolicy(domain="real_estate")

        existing_slots = {
            "location": "Kyrenia",
            "rental_type": "short_term",
            "budget": 500
        }

        merged = policy.merge_intent_schemas(
            old_intent="short_term_rent",
            new_intent="buy_property",
            existing_slots=existing_slots
        )

        # rental_type should be dropped (not valid for buy_property)
        assert "location" in merged
        assert "budget" in merged
        assert "rental_type" not in merged


class TestInferenceEngine:
    """Test inference engine heuristics."""

    def test_infer_budget_explicit_amount(self):
        """Test budget inference from explicit amount."""
        user_input = "looking for something around 500 pounds"

        result = _infer_budget_heuristic(
            user_input.lower(),
            patterns={
                "budget": {
                    "low": ["cheap", "budget"],
                    "medium": ["moderate"],
                    "high": ["luxury"]
                }
            }
        )

        assert result is not None
        assert result["value"] == 500
        assert result["confidence"] >= 0.9
        assert result["source"] == "heuristic"

    def test_infer_budget_keyword(self):
        """Test budget inference from keyword."""
        user_input = "I need something cheap"

        result = _infer_budget_heuristic(
            user_input.lower(),
            patterns={
                "budget": {
                    "low": ["cheap", "budget"],
                    "medium": ["moderate"],
                    "high": ["luxury"]
                }
            }
        )

        assert result is not None
        assert result["value"] == "low"
        assert result["confidence"] >= 0.7

    def test_infer_location_known_city(self):
        """Test location inference from known city."""
        user_input = "I want an apartment in Kyrenia"

        result = _infer_location_heuristic(
            user_input.lower(),
            patterns={
                "location": {
                    "known_cities": ["Kyrenia", "Girne", "Nicosia"]
                }
            }
        )

        assert result is not None
        assert result["value"] == "Kyrenia"
        assert result["confidence"] >= 0.95

    def test_infer_bedrooms_explicit(self):
        """Test bedrooms inference from explicit pattern."""
        user_input = "I need a 2 bedroom apartment"

        result = _infer_bedrooms_heuristic(
            user_input.lower(),
            patterns={
                "bedrooms": {
                    "studio": ["studio"],
                    "one_br": ["1 bed", "one bedroom"],
                    "two_br": ["2 bed", "two bedroom"],
                    "three_br": ["3 bed"]
                }
            }
        )

        assert result is not None
        assert result["value"] == 2
        assert result["confidence"] >= 0.85

    def test_infer_bedrooms_keyword(self):
        """Test bedrooms inference from keyword."""
        user_input = "looking for a studio"

        result = _infer_bedrooms_heuristic(
            user_input.lower(),
            patterns={
                "bedrooms": {
                    "studio": ["studio"],
                    "one_br": ["1 bed"],
                    "two_br": ["2 bed"]
                }
            }
        )

        assert result is not None
        assert result["value"] == 0  # Studio = 0 bedrooms
        assert result["confidence"] >= 0.85

    def test_infer_furnishing(self):
        """Test furnishing inference."""
        user_input = "I need a fully furnished apartment"

        result = _infer_furnishing_heuristic(
            user_input.lower(),
            patterns={
                "furnishing": {
                    "furnished": ["furnished", "fully furnished"],
                    "unfurnished": ["unfurnished", "empty"]
                }
            }
        )

        assert result is not None
        assert result["value"] == "furnished"
        assert result["confidence"] >= 0.8

    def test_infer_slots_heuristic_multiple(self):
        """Test inferring multiple slots from one message."""
        user_input = "I need a cheap 2 bedroom apartment in Kyrenia, fully furnished"
        missing_slots = ["budget", "location", "bedrooms", "furnishing"]
        context = {"filled_slots": {}}

        inferred = infer_slots_heuristic(user_input, missing_slots, context)

        # Should infer at least location, bedrooms, furnishing
        assert "location" in inferred
        assert inferred["location"]["value"] == "Kyrenia"

        assert "bedrooms" in inferred
        assert inferred["bedrooms"]["value"] == 2

        assert "furnishing" in inferred
        assert inferred["furnishing"]["value"] == "furnished"

        assert "budget" in inferred
        assert inferred["budget"]["value"] == "low"


class TestSlotPolicyIntegration:
    """Integration tests for slot policy with real scenarios."""

    def test_slot_filling_flow_happy_path(self):
        """Test complete slot-filling flow with all info provided."""
        policy = SlotPolicy(domain="real_estate")

        # Turn 1: User provides location
        filled_slots = {"location": "Kyrenia"}
        action, slot = policy.next_action(filled_slots, "short_term_rent")
        assert action == "ask"
        assert slot == "rental_type"  # Next critical slot

        # Turn 2: User provides rental_type
        filled_slots["rental_type"] = "short_term"
        action, slot = policy.next_action(filled_slots, "short_term_rent")
        # All critical filled, should ask contextual
        assert action == "soft_ask"

        # Turn 3: User provides budget
        filled_slots["budget"] = 500
        action, slot = policy.next_action(filled_slots, "short_term_rent")
        # Can proceed to search
        assert action in ["soft_ask", "search"]

    def test_slot_filling_with_skipping(self):
        """Test slot-filling with user avoiding a slot."""
        policy = SlotPolicy(domain="real_estate")

        filled_slots = {"rental_type": "short_term"}
        attempts = {"location": 3}  # Asked 3 times

        action, slot = policy.next_action(
            filled_slots,
            "short_term_rent",
            slot_prompt_attempts=attempts
        )

        # Should skip location after 3 attempts
        assert action == "skip"
        assert slot == "location"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
