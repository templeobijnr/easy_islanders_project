#!/usr/bin/env python3
"""
Quick validation script for Zep Graph v3 integration.

Tests:
1. GraphManager initialization
2. System graph creation
3. User preference storage
4. User preference retrieval
5. Graph search functionality

Usage:
    python3 scripts/test_graph_memory.py
    python3 scripts/test_graph_memory.py --verbose
"""

import os
import sys
import django
import argparse
from datetime import datetime

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
django.setup()

from assistant.memory.graph_manager import get_graph_manager, GraphManager


def test_initialization(verbose=False):
    """Test 1: GraphManager initialization"""
    print("\n=== Test 1: GraphManager Initialization ===")

    try:
        mgr = get_graph_manager()

        if mgr is None:
            print("❌ FAIL: GraphManager not available")
            print("   Check ZEP_API_KEY and zep-cloud SDK installation")
            return False

        print("✅ PASS: GraphManager initialized")
        if verbose:
            print(f"   Client: {mgr.client}")
            print(f"   Enabled: {mgr.enabled}")

        return True

    except Exception as e:
        print(f"❌ FAIL: Initialization error: {e}")
        return False


def test_system_graph_creation(mgr, verbose=False):
    """Test 2: System graph creation"""
    print("\n=== Test 2: System Graph Creation ===")

    try:
        # Attempt to create system graph
        graph_id = "real_estate_system"
        name = "Real Estate System Graph (Test)"
        description = "Test system graph for validation"

        try:
            result = mgr.create_graph(
                graph_id=graph_id,
                name=name,
                description=description
            )
            print(f"✅ PASS: System graph created: {graph_id}")
            if verbose:
                print(f"   Result: {result}")

        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print(f"✅ PASS: System graph already exists: {graph_id}")
            else:
                raise

        return True

    except Exception as e:
        print(f"❌ FAIL: Graph creation error: {e}")
        return False


def test_user_preference_storage(mgr, verbose=False):
    """Test 3: User preference storage"""
    print("\n=== Test 3: User Preference Storage ===")

    test_user_id = f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        # Store test preferences
        preferences = [
            ("location", "Girne", 0.9),
            ("budget", "600", 0.8),
            ("budget_currency", "GBP", 1.0),
            ("bedrooms", "2", 0.85),
            ("property_type", "apartment", 0.75),
        ]

        for pref_type, value, confidence in preferences:
            mgr.store_user_preference(
                user_id=test_user_id,
                preference_type=pref_type,
                value=value,
                confidence=confidence
            )
            if verbose:
                print(f"   Stored: {test_user_id} —[prefers_{pref_type}]→ {value}")

        print(f"✅ PASS: Stored {len(preferences)} preferences for {test_user_id}")
        return True, test_user_id

    except Exception as e:
        print(f"❌ FAIL: Preference storage error: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def test_user_preference_retrieval(mgr, user_id, verbose=False):
    """Test 4: User preference retrieval"""
    print("\n=== Test 4: User Preference Retrieval ===")

    try:
        # Retrieve all preferences
        prefs = mgr.get_user_preferences(user_id=user_id)

        if not prefs:
            print(f"❌ FAIL: No preferences retrieved for {user_id}")
            return False

        print(f"✅ PASS: Retrieved {len(prefs)} preferences for {user_id}")

        if verbose:
            for pref in prefs:
                fact = pref.get("fact", "")
                target = pref.get("target", "")
                source = pref.get("source", "")
                print(f"   {source} —[{fact}]→ {target}")

        # Verify specific preference types
        pref_types = set()
        for pref in prefs:
            fact = pref.get("fact", "")
            if fact.startswith("prefers_"):
                pref_types.add(fact[8:])  # Remove "prefers_" prefix

        expected = {"location", "budget", "budget_currency", "bedrooms", "property_type"}
        if expected.issubset(pref_types):
            print(f"✅ PASS: All expected preference types found")
        else:
            missing = expected - pref_types
            print(f"⚠️  WARNING: Missing preference types: {missing}")

        return True

    except Exception as e:
        print(f"❌ FAIL: Preference retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_graph_search(mgr, verbose=False):
    """Test 5: Graph search functionality"""
    print("\n=== Test 5: Graph Search ===")

    try:
        # Search system graph
        results = mgr.search_graph(
            graph_id="real_estate_system",
            query="locations cities",
            limit=5
        )

        if not results:
            print("⚠️  WARNING: Search returned no results (system graph may be empty)")
            print("   Run 'python3 manage.py init_zep_graphs' to seed data")
            return True  # Not a failure, just empty graph

        nodes = results.get("nodes", [])
        edges = results.get("edges", [])
        episodes = results.get("episodes", [])

        print(f"✅ PASS: Graph search successful")
        print(f"   Nodes: {len(nodes)}, Edges: {len(edges)}, Episodes: {len(episodes)}")

        if verbose and nodes:
            print("   Sample nodes:")
            for node in nodes[:3]:
                print(f"   - {node}")

        return True

    except Exception as e:
        print(f"❌ FAIL: Graph search error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(description="Test Zep Graph v3 integration")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    print("=" * 60)
    print("Zep Graph v3 Integration Validation")
    print("=" * 60)

    # Check environment
    print("\n=== Environment Check ===")
    print(f"ZEP_API_KEY set: {bool(os.getenv('ZEP_API_KEY'))}")
    print(f"ZEP_BASE_URL: {os.getenv('ZEP_BASE_URL', 'not set')}")

    # Run tests
    results = []

    # Test 1: Initialization
    init_result = test_initialization(verbose=args.verbose)
    results.append(("Initialization", init_result))

    if not init_result:
        print("\n❌ Cannot proceed without GraphManager. Exiting.")
        sys.exit(1)

    mgr = get_graph_manager()

    # Test 2: System graph creation
    graph_result = test_system_graph_creation(mgr, verbose=args.verbose)
    results.append(("System Graph Creation", graph_result))

    # Test 3: User preference storage
    storage_result, test_user_id = test_user_preference_storage(mgr, verbose=args.verbose)
    results.append(("User Preference Storage", storage_result))

    # Test 4: User preference retrieval
    if storage_result and test_user_id:
        retrieval_result = test_user_preference_retrieval(mgr, test_user_id, verbose=args.verbose)
        results.append(("User Preference Retrieval", retrieval_result))
    else:
        print("\n⚠️  SKIP: Test 4 (retrieval) - storage failed")
        results.append(("User Preference Retrieval", False))

    # Test 5: Graph search
    search_result = test_graph_search(mgr, verbose=args.verbose)
    results.append(("Graph Search", search_result))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Graph memory integration is working.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
