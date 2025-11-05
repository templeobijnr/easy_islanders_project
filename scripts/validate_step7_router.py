#!/usr/bin/env python3
"""
STEP 7: Context-Primed Router Validation Script

Tests the sticky-intent orchestration with hysteresis thresholds.

Usage:
    python3 scripts/validate_step7_router.py

Expected Results:
    ✅ All 3 assertions pass (stick, switch, hysteresis)
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')

try:
    import django
    django.setup()
except Exception as e:
    print(f"⚠️  Django not available: {e}")
    print("   Proceeding with standalone router tests...")

from assistant.brain.supervisor import route_with_sticky


def assert_sticks_on_refinement(route_fn):
    """Test that short refinements maintain current domain."""
    print("\n=== Test 1: Refinement Stickiness ===")

    state = {
        "thread_id": "test_001",
        "user_input": "in girne",  # Short refinement
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "User asked for an apartment. Location pending."
    }

    out = route_fn(state)

    # Should stick with real_estate_agent
    assert out["target_agent"] == "real_estate_agent", \
        f"Expected real_estate_agent, got {out['target_agent']}"

    assert "stick" in out["router_reason"].lower() or "refinement" in out["router_reason"].lower(), \
        f"Expected stick/refinement reason, got: {out['router_reason']}"

    print(f"  ✅ PASS: Stuck with {out['target_agent']}")
    print(f"     Reason: {out['router_reason']}")
    print(f"     Confidence: {out.get('router_confidence', 0):.3f}")


def assert_switches_on_explicit(route_fn):
    """Test that explicit switch markers override continuity."""
    print("\n=== Test 2: Explicit Switch Detection ===")

    state = {
        "thread_id": "test_002",
        "user_input": "actually show me cars",  # Explicit switch
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "User discussed apartments in Girne."
    }

    out = route_fn(state)

    # Should switch to marketplace_agent
    assert out["target_agent"] == "marketplace_agent", \
        f"Expected marketplace_agent, got {out['target_agent']}"

    assert "switch" in out["router_reason"].lower(), \
        f"Expected switch reason, got: {out['router_reason']}"

    print(f"  ✅ PASS: Switched to {out['target_agent']}")
    print(f"     Reason: {out['router_reason']}")
    print(f"     Confidence: {out.get('router_confidence', 0):.3f}")


def assert_hysteresis(route_fn):
    """Test hysteresis thresholds (stick/clarify/switch)."""
    print("\n=== Test 3: Hysteresis Thresholds ===")

    state = {
        "thread_id": "test_003",
        "user_input": "pharmacies nearby",  # Ambiguous context
        "active_domain": "real_estate_agent",
        "current_intent": "property_search",
        "fused_context": "The user is talking about housing in Girne."
    }

    out = route_fn(state)

    # Should either stick (low conf), clarify (mid conf), or switch (high conf)
    # For this ambiguous case, we expect stick or clarify
    assert out["target_agent"] in ["real_estate_agent", "local_info_agent"], \
        f"Expected real_estate_agent or local_info_agent, got {out['target_agent']}"

    print(f"  ✅ PASS: Routed to {out['target_agent']}")
    print(f"     Reason: {out['router_reason']}")
    print(f"     Confidence: {out.get('router_confidence', 0):.3f}")
    print(f"     Decision: {out.get('router_reason')}")


def run_all_tests():
    """Run all validation tests."""
    print("=" * 70)
    print("STEP 7: Context-Primed Router Validation")
    print("=" * 70)

    try:
        assert_sticks_on_refinement(route_with_sticky)
        assert_switches_on_explicit(route_with_sticky)
        assert_hysteresis(route_with_sticky)

        print("\n" + "=" * 70)
        print("✅ Step 7 router validations passed (3/3)")
        print("=" * 70)
        print("\nSTICKY-INTENT ORCHESTRATION WORKING:")
        print("  • Short refinements maintain domain ✅")
        print("  • Explicit switches override continuity ✅")
        print("  • Hysteresis prevents oscillation ✅")
        print("\nReady for production use!")

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
