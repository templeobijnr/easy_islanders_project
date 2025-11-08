#!/usr/bin/env python3
"""
Verify Zep Graph v3 API Integration

Tests that GraphManager correctly calls Zep Cloud v3 Graph API endpoints.

Usage:
    python3 scripts/verify_graph_v3.py
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
django.setup()

from assistant.memory.graph_manager import GraphManager, get_graph_manager
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def test_graph_connection():
    """Test basic Graph API connection."""
    print("\n" + "=" * 60)
    print("TEST 1: Graph API Connection")
    print("=" * 60)

    try:
        gm = GraphManager()
        print("✅ GraphManager initialized successfully")
        print(f"   Base URL: {os.getenv('ZEP_BASE_URL')}")
        print(f"   Circuit Breaker: {'enabled' if gm.circuit_breaker else 'disabled'}")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize GraphManager: {e}")
        return False


def test_add_fact_triplet():
    """Test adding a fact triplet with v3 API."""
    print("\n" + "=" * 60)
    print("TEST 2: Add Fact Triplet (v3 API)")
    print("=" * 60)

    try:
        gm = get_graph_manager()
        if gm is None:
            print("❌ GraphManager not available")
            return False

        # First, ensure the graph exists
        graph_id = "test_graph_v3"
        print(f"\nEnsuring graph '{graph_id}' exists...")

        try:
            gm.create_graph(
                graph_id=graph_id,
                name="Test Graph V3",
                description="Test graph for v3 API verification"
            )
            print("✅ Graph created (or already exists)")
        except Exception as e:
            if "already exists" in str(e).lower() or "409" in str(e):
                print("✅ Graph already exists")
            else:
                print(f"⚠️  Graph creation warning: {e}")

        # Test adding a fact to the graph
        print(f"\nAdding fact to '{graph_id}': Girne —[is_near]→ beach")
        result = gm.add_fact_triplet(
            graph_id=graph_id,
            source_node_name="Girne",
            target_node_name="beach",
            fact="is_near",
            valid_from=datetime.now().isoformat()
        )

        print("✅ Fact added successfully")
        print(f"   Response type: {type(result)}")
        return True

    except Exception as e:
        print(f"❌ Failed to add fact: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_store_user_preference():
    """Test storing user preference with v3 API."""
    print("\n" + "=" * 60)
    print("TEST 3: Store User Preference")
    print("=" * 60)

    try:
        gm = get_graph_manager()
        if gm is None:
            print("❌ GraphManager not available")
            return False

        # Test storing a user preference
        user_id = "test_user_v3"
        print(f"\nStoring preference for {user_id}")
        print(f"  {user_id} —[prefers_location]→ Girne")

        result = gm.store_user_preference(
            user_id=user_id,
            preference_type="location",
            value="Girne",
            confidence=0.9
        )

        print("✅ Preference stored successfully")
        print(f"   Response: {result}")
        return True

    except Exception as e:
        print(f"❌ Failed to store preference: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_get_user_preferences():
    """Test retrieving user preferences."""
    print("\n" + "=" * 60)
    print("TEST 4: Get User Preferences")
    print("=" * 60)

    try:
        gm = get_graph_manager()
        if gm is None:
            print("❌ GraphManager not available")
            return False

        user_id = "test_user_v3"
        print(f"\nRetrieving preferences for {user_id}")

        prefs = gm.get_user_preferences(user_id=user_id)

        print(f"✅ Retrieved {len(prefs)} preferences")
        for pref in prefs:
            print(f"   - {pref.get('fact')}: {pref.get('target')}")

        return True

    except Exception as e:
        print(f"❌ Failed to get preferences: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_metrics():
    """Test metrics tracking."""
    print("\n" + "=" * 60)
    print("TEST 5: Metrics Tracking")
    print("=" * 60)

    try:
        gm = get_graph_manager()
        if gm is None:
            print("❌ GraphManager not available")
            return False

        metrics = gm.get_metrics()

        print("✅ Metrics retrieved successfully")
        print(f"   Operations Total: {metrics.get('operations_total')}")
        print(f"   Operations Failed: {metrics.get('operations_failed')}")
        print(f"   Circuit Breaker State: {metrics.get('circuit_breaker_state')}")
        print(f"   Last Operation Time: {metrics.get('last_operation_time')}s")

        return True

    except Exception as e:
        print(f"❌ Failed to get metrics: {e}")
        return False


def main():
    """Run all verification tests."""
    print("\n" + "=" * 60)
    print("ZEP GRAPH V3 API VERIFICATION")
    print("=" * 60)

    # Check if Graph Memory is enabled
    enabled = os.getenv("ENABLE_GRAPH_MEMORY", "false").lower() == "true"
    print(f"\nENABLE_GRAPH_MEMORY: {enabled}")

    if not enabled:
        print("\n⚠️  WARNING: Graph Memory is disabled in .env.dev")
        print("   Set ENABLE_GRAPH_MEMORY=true to proceed")
        return

    # Run tests
    results = []
    results.append(("Connection", test_graph_connection()))
    results.append(("Add Fact Triplet", test_add_fact_triplet()))
    results.append(("Store User Preference", test_store_user_preference()))
    results.append(("Get User Preferences", test_get_user_preferences()))
    results.append(("Metrics Tracking", test_metrics()))

    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Graph v3 integration is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check logs for details.")


if __name__ == "__main__":
    main()
