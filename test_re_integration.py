#!/usr/bin/env python3
"""
Quick integration test for Real Estate Agent
Tests the full flow: Supervisor → RE Agent → Response
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
django.setup()

from assistant.brain.agent import run_supervisor_agent


def test_property_search():
    """Test property search through supervisor"""
    print("\n" + "="*80)
    print("TEST: Property Search - '2 bedroom apartment in Kyrenia under £200'")
    print("="*80)

    result = run_supervisor_agent(
        user_input="I'm looking for a 2 bedroom apartment in Kyrenia for under £200 per night",
        thread_id="test-integration-001"
    )

    print("\n📊 RESULT:")
    print(f"  Message: {result.get('message', 'N/A')[:200]}")
    print(f"  Recommendations: {len(result.get('recommendations', []))} cards")
    print(f"  Agent: {result.get('agent_name', 'N/A') or result.get('current_node', 'N/A')}")

    # Validate
    assert 'message' in result, "Missing message in response"
    assert result['message'], "Empty message"

    recommendations = result.get('recommendations', [])
    if recommendations:
        print("\n🏠 PROPERTIES FOUND:")
        for i, prop in enumerate(recommendations[:3], 1):
            print(f"\n  {i}. {prop.get('title', 'N/A')}")
            print(f"     Location: {prop.get('location', 'N/A')}")
            print(f"     Bedrooms: {prop.get('bedrooms', 'N/A')}")
            print(f"     Price: {prop.get('price', 'N/A')}")
            print(f"     Agent: {prop.get('agent', 'N/A')}")

        assert len(recommendations) > 0, "Expected at least 1 property"
        assert all(prop.get('type') == 'property' for prop in recommendations), "Not all recommendations are properties"
        assert all(prop.get('agent') == 'real_estate' for prop in recommendations), "Not all tagged with real_estate agent"

        print("\n✅ SUCCESS: Real Estate Agent integration working!")
    else:
        print("\n⚠️  WARNING: No recommendations returned (might be empty results)")

    return result


def test_general_greeting():
    """Test that greetings don't go to RE agent"""
    print("\n" + "="*80)
    print("TEST: General Greeting - 'Hello'")
    print("="*80)

    result = run_supervisor_agent(
        user_input="Hello",
        thread_id="test-integration-002"
    )

    print("\n📊 RESULT:")
    print(f"  Message: {result.get('message', 'N/A')[:200]}")
    print(f"  Agent: {result.get('agent_name', 'N/A') or result.get('current_node', 'N/A')}")

    # Should NOT go to real_estate_agent
    agent = result.get('agent_name') or result.get('current_node', '')
    assert 'real_estate' not in agent.lower(), f"Greeting went to RE agent! Agent: {agent}"

    print("\n✅ SUCCESS: Greeting correctly routed to general agent!")

    return result


if __name__ == "__main__":
    print("\n🚀 STARTING RE AGENT INTEGRATION TESTS")
    print("="*80)

    try:
        # Test 1: Property search
        result1 = test_property_search()

        # Test 2: General greeting (shouldn't use RE agent)
        result2 = test_general_greeting()

        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print("\n📝 NEXT STEPS:")
        print("  1. Test via HTTP: POST /api/chat/ with property search")
        print("  2. Test via WebSocket: Check WS frame has 'agent': 'real_estate'")
        print("  3. Add Prometheus metrics")
        print("  4. Create golden session tests")

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
    except Exception as e:
        print(f"\n💥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
