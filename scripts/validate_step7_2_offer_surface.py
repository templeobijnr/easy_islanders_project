#!/usr/bin/env python3
"""
STEP 7.2: Offer Surface & Dialogue Policy Validation Tests

Unit tests for offer summaries, zero-result relaxation, and dialogue policy.

Usage:
    python3 scripts/validate_step7_2_offer_surface.py

Expected Results:
    ✅ All assertions pass (act classification, policy, offer formatting, relaxation)
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_act_classification():
    """Test dialogue act classification."""
    print("\n=== Test 1: Act Classification ===")

    from assistant.brain.nlp.acts import classify_act

    # OFFER_SUMMARY tests
    offer_inputs = [
        "what do you have?",
        "what's available",
        "show me options",
        "anywhere?",
        "what can i get",
        "show me everything",
    ]

    for text in offer_inputs:
        act = classify_act(text)
        assert act == "OFFER_SUMMARY", f"Expected OFFER_SUMMARY for '{text}', got {act}"

    # NONE tests
    none_inputs = [
        "kyrenia 600 pounds",
        "long term",
        "2 bedrooms",
        "i need an apartment",
    ]

    for text in none_inputs:
        act = classify_act(text)
        assert act == "NONE", f"Expected NONE for '{text}', got {act}"

    print(f"  ✅ PASS: {len(offer_inputs)} OFFER_SUMMARY + {len(none_inputs)} NONE classified correctly")


def test_missing_slots():
    """Test missing slot detection."""
    print("\n=== Test 2: Missing Slot Detection ===")

    from assistant.brain.policy.real_estate_policy import _missing_slots

    # Test 1: All required present
    slots1 = {"location": "Kyrenia", "rental_type": "long_term", "budget": 600}
    missing1, complete1 = _missing_slots(slots1)
    assert complete1 is True, f"Expected complete=True, got {complete1}"
    assert len(missing1) == 0, f"Expected 0 missing, got {len(missing1)}"

    # Test 2: Missing rental_type
    slots2 = {"location": "Kyrenia", "budget": 600}
    missing2, complete2 = _missing_slots(slots2)
    assert complete2 is False, f"Expected complete=False"
    assert "rental_type" in missing2, f"Expected rental_type in missing, got {missing2}"

    # Test 3: Missing location (but has budget and rental_type)
    slots3 = {"rental_type": "long_term", "budget": 600}
    missing3, complete3 = _missing_slots(slots3)
    assert complete3 is False, f"Expected complete=False"
    assert "location_or_anywhere" in missing3, f"Expected location_or_anywhere in missing, got {missing3}"

    # Test 4: Has anywhere instead of location
    slots4 = {"anywhere": True, "rental_type": "long_term", "budget": 600}
    missing4, complete4 = _missing_slots(slots4)
    assert complete4 is True, f"Expected complete=True with anywhere flag"

    print(f"  ✅ PASS: Missing slot detection works correctly")


def test_next_question():
    """Test next question generation."""
    print("\n=== Test 3: Next Question Generation ===")

    from assistant.brain.policy.real_estate_policy import next_question

    # Test rental_type question (highest priority)
    missing1 = ["rental_type", "location_or_anywhere"]
    q1 = next_question(missing1)
    assert "short-term" in q1 or "long-term" in q1, f"Expected rental_type question, got: {q1}"

    # Test location question
    missing2 = ["location_or_anywhere", "budget"]
    q2 = next_question(missing2)
    assert "area" in q2.lower() or "kyrenia" in q2.lower(), f"Expected location question, got: {q2}"

    # Test no missing
    missing3 = []
    q3 = next_question(missing3)
    assert q3 == "", f"Expected empty string for no missing, got: {q3}"

    print(f"  ✅ PASS: Next question generation works correctly")


def test_criteria_text():
    """Test criteria text formatting."""
    print("\n=== Test 4: Criteria Text Formatting ===")

    from assistant.brain.policy.real_estate_policy import criteria_text

    # Test full criteria
    slots1 = {
        "location": "Kyrenia",
        "budget": 600,
        "budget_currency": "GBP",
        "bedrooms": 2,
        "rental_type": "long_term"
    }
    text1 = criteria_text(slots1)
    assert "Kyrenia" in text1, f"Expected Kyrenia in text: {text1}"
    assert "600" in text1, f"Expected 600 in text: {text1}"
    assert "GBP" in text1, f"Expected GBP in text: {text1}"
    assert "2 BR" in text1, f"Expected 2 BR in text: {text1}"
    assert "long-term" in text1, f"Expected long-term in text: {text1}"

    # Test anywhere
    slots2 = {"anywhere": True, "budget": 500}
    text2 = criteria_text(slots2)
    assert "anywhere" in text2, f"Expected anywhere in text: {text2}"

    # Test empty
    slots3 = {}
    text3 = criteria_text(slots3)
    assert "your request" in text3, f"Expected 'your request' for empty slots: {text3}"

    print(f"  ✅ PASS: Criteria text formatting works correctly")


def test_build_offer_lines():
    """Test offer line formatting."""
    print("\n=== Test 5: Offer Line Formatting ===")

    from assistant.brain.policy.real_estate_policy import build_offer_lines

    items = [
        {"city": "Kyrenia", "count": 42, "min": 450, "max": 2200, "currency": "GBP"},
        {"city": "Nicosia", "count": 31, "min": 400, "max": 1800, "currency": "GBP"},
    ]

    lines = build_offer_lines(items)

    assert len(lines) == 2, f"Expected 2 lines, got {len(lines)}"
    assert "Kyrenia" in lines[0], f"Expected Kyrenia in first line: {lines[0]}"
    assert "42" in lines[0], f"Expected count 42 in first line: {lines[0]}"
    assert "450" in lines[0], f"Expected min 450 in first line: {lines[0]}"
    assert "2200" in lines[0], f"Expected max 2200 in first line: {lines[0]}"
    assert "GBP" in lines[0], f"Expected GBP in first line: {lines[0]}"

    print(f"  ✅ PASS: Offer line formatting works correctly")
    print(f"     Sample: {lines[0]}")


def test_relax_filters():
    """Test zero-results filter relaxation."""
    print("\n=== Test 6: Filter Relaxation ===")

    from assistant.brain.policy.real_estate_policy import relax_filters

    slots = {
        "location": "Kyrenia",
        "budget": 500,
        "rental_type": "long_term",
        "bedrooms": 4
    }

    relaxed, widened = relax_filters(slots)

    # Budget should be widened by 20%
    assert "budget" in widened, f"Expected budget in widened: {widened}"
    assert relaxed["budget"] > 500, f"Expected budget > 500, got {relaxed['budget']}"
    expected_budget = int(500 * 1.2)  # 600
    assert relaxed["budget"] == expected_budget, f"Expected budget={expected_budget}, got {relaxed['budget']}"

    # Bedrooms should be removed
    assert "bedrooms" in widened, f"Expected bedrooms in widened: {widened}"
    assert "bedrooms" not in relaxed, f"Expected bedrooms removed from relaxed: {relaxed}"

    # Location should have radius added
    assert "location_radius_km" in relaxed, f"Expected location_radius_km in relaxed: {relaxed}"
    assert relaxed["location_radius_km"] == 20, f"Expected radius=20, got {relaxed['location_radius_km']}"

    print(f"  ✅ PASS: Filter relaxation works correctly")
    print(f"     Widened: {widened}")
    print(f"     Budget: 500 → {relaxed['budget']}")


def test_integration_scenario():
    """Test integrated E2E scenario."""
    print("\n=== Test 7: Integration Scenario ===")

    from assistant.brain.nlp.acts import classify_act
    from assistant.brain.policy.real_estate_policy import (
        _missing_slots,
        next_question,
        criteria_text
    )

    # Scenario: User asks "what do you have?" with partial slots
    user_input = "what do you have?"
    slots = {"location": "Kyrenia", "budget": 800}

    # Step 1: Classify act
    act = classify_act(user_input)
    assert act == "OFFER_SUMMARY", f"Expected OFFER_SUMMARY, got {act}"

    # Step 2: Check missing slots
    missing, complete = _missing_slots(slots)
    assert not complete, f"Expected incomplete slots"
    assert "rental_type" in missing, f"Expected rental_type missing"

    # Step 3: Get next question
    question = next_question(missing)
    assert "short-term" in question or "long-term" in question, f"Expected rental_type question: {question}"

    # Step 4: Build criteria
    crit = criteria_text(slots)
    assert "Kyrenia" in crit and "800" in crit, f"Expected location+budget in criteria: {crit}"

    print(f"  ✅ PASS: Integration scenario works correctly")
    print(f"     Act: {act}")
    print(f"     Missing: {missing}")
    print(f"     Next Q: {question[:50]}...")


def run_all_tests():
    """Run all validation tests."""
    print("=" * 70)
    print("STEP 7.2: Offer Surface & Dialogue Policy Validation")
    print("=" * 70)

    try:
        test_act_classification()
        test_missing_slots()
        test_next_question()
        test_criteria_text()
        test_build_offer_lines()
        test_relax_filters()
        test_integration_scenario()

        print("\n" + "=" * 70)
        print("✅ All STEP 7.2 validation tests passed (7/7)")
        print("=" * 70)
        print("\nOFFER SURFACE & DIALOGUE POLICY WORKING:")
        print("  • Act classification (OFFER_SUMMARY vs NONE) ✅")
        print("  • Missing slot detection (required/optional) ✅")
        print("  • Next question generation (ask_order) ✅")
        print("  • Criteria text formatting ✅")
        print("  • Offer line formatting (city, count, price range) ✅")
        print("  • Zero-result filter relaxation (budget widen, ignore bedrooms) ✅")
        print("  • E2E integration scenario ✅")
        print("\nReady for production deployment!")

        return 0

    except AssertionError as e:
        print("\n" + "=" * 70)
        print(f"❌ VALIDATION FAILED: {e}")
        print("=" * 70)
        return 1

    except Exception as e:
        print("\n" + "=" * 70)
        print(f"❌ ERROR: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
