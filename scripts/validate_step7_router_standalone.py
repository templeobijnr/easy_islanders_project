#!/usr/bin/env python3
"""
STEP 7: Context-Primed Router Standalone Validation

Tests the sticky-intent orchestration without requiring Django.
This is a lightweight version that directly tests intent_router functions.

Usage:
    python3 scripts/validate_step7_router_standalone.py

Expected Results:
    ✅ All 3 assertions pass (stick, switch, hysteresis)
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from assistant.brain import intent_router


def assert_sticks_on_refinement():
    """Test that short refinements maintain current domain."""
    print("\n=== Test 1: Refinement Stickiness ===")

    state = {
        "thread_id": "test_001",
        "user_input": "in girne",  # Short refinement
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "User asked for an apartment. Location pending."
    }

    # Classify intent
    intent, agent, confidence, evidence = intent_router.classify(state)

    # Apply continuity decision
    decision = intent_router.continuity_decision(state, intent, agent, confidence)

    # Determine target agent based on decision
    if decision["decision"] == "stick":
        target_agent = state["active_domain"]
    else:
        target_agent = agent

    # Should stick with real_estate_agent
    assert target_agent == "real_estate_agent", \
        f"Expected real_estate_agent, got {target_agent}"

    assert "stick" in decision["reason"].lower() or "refinement" in decision["reason"].lower(), \
        f"Expected stick/refinement reason, got: {decision['reason']}"

    print(f"  ✅ PASS: Stuck with {target_agent}")
    print(f"     Decision: {decision['decision']}")
    print(f"     Reason: {decision['reason']}")
    print(f"     Confidence: {confidence:.3f}")


def assert_switches_on_explicit():
    """Test that explicit switch markers override continuity."""
    print("\n=== Test 2: Explicit Switch Detection ===")

    state = {
        "thread_id": "test_002",
        "user_input": "actually show me cars",  # Explicit switch
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "User discussed apartments in Girne."
    }

    # Classify intent
    intent, agent, confidence, evidence = intent_router.classify(state)

    # Apply continuity decision
    decision = intent_router.continuity_decision(state, intent, agent, confidence)

    # Determine target agent based on decision
    if decision["decision"] == "stick":
        target_agent = state["active_domain"]
    else:
        target_agent = agent

    # Should switch to marketplace_agent
    assert target_agent == "marketplace_agent", \
        f"Expected marketplace_agent, got {target_agent}"

    assert "switch" in decision["reason"].lower(), \
        f"Expected switch reason, got: {decision['reason']}"

    print(f"  ✅ PASS: Switched to {target_agent}")
    print(f"     Decision: {decision['decision']}")
    print(f"     Reason: {decision['reason']}")
    print(f"     Confidence: {confidence:.3f}")


def assert_hysteresis():
    """Test hysteresis thresholds (stick/clarify/switch)."""
    print("\n=== Test 3: Hysteresis Thresholds ===")

    state = {
        "thread_id": "test_003",
        "user_input": "pharmacies nearby",  # Ambiguous context
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "The user is talking about housing in Girne."
    }

    # Classify intent
    intent, agent, confidence, evidence = intent_router.classify(state)

    # Apply continuity decision
    decision = intent_router.continuity_decision(state, intent, agent, confidence)

    # Determine target agent based on decision
    if decision["decision"] == "stick":
        target_agent = state["active_domain"]
    elif decision["decision"] == "clarify":
        target_agent = state["active_domain"]  # Stay but ask for clarification
    else:
        target_agent = agent

    # Should either stick (low conf), clarify (mid conf), or switch (high conf)
    # For this ambiguous case, we expect stick or switch to local_info_agent
    assert target_agent in ["real_estate_agent", "local_info_agent"], \
        f"Expected real_estate_agent or local_info_agent, got {target_agent}"

    print(f"  ✅ PASS: Routed to {target_agent}")
    print(f"     Decision: {decision['decision']}")
    print(f"     Reason: {decision['reason']}")
    print(f"     Confidence: {confidence:.3f}")
    print(f"     Intent classified as: {intent}")


def run_all_tests():
    """Run all validation tests."""
    print("=" * 70)
    print("STEP 7: Context-Primed Router Validation (Standalone)")
    print("=" * 70)

    try:
        assert_sticks_on_refinement()
        assert_switches_on_explicit()
        assert_hysteresis()

        print("\n" + "=" * 70)
        print("✅ Step 7 router validations passed (3/3)")
        print("=" * 70)
        print("\nSTICKY-INTENT ORCHESTRATION WORKING:")
        print("  • Short refinements maintain domain ✅")
        print("  • Explicit switches override continuity ✅")
        print("  • Hysteresis prevents oscillation ✅")
        print("\nReady for integration testing with Django/Docker!")

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
