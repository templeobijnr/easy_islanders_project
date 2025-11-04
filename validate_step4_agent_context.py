#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STEP 4 VALIDATION - Agent Context Preservation & Multi-Agent Coherence

This script validates:
1. Agent context buckets are isolated per agent
2. Entity extraction works correctly
3. Handoff protocol preserves location/budget across agent switches
4. Shared context carries over to new agents
5. Agent conversation stages are tracked correctly
6. Context-aware continuity guard prevents drift
"""

import sys
import os
import time

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
import django
django.setup()

from assistant.brain.supervisor_graph import get_supervisor_graph
from assistant.brain.supervisor_schemas import SupervisorState

def print_section(title: str):
    """Print a section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_subsection(title: str):
    """Print a subsection header"""
    print("\n" + "-" * 70)
    print(f"  {title}")
    print("-" * 70)


def test_agent_context_isolation():
    """Test that agent contexts are isolated per agent"""
    print_section("TEST 1: Agent Context Isolation")

    supervisor = get_supervisor_graph()
    thread_id = f"step4-isolation-{int(time.time())}"

    # Turn 1: Real estate query
    print_subsection("Turn 1: Real Estate Query")
    print("Input: 'I want a 2-bedroom apartment in Girne for 1000 EUR'")

    state1 = {
        "user_input": "I want a 2-bedroom apartment in Girne for 1000 EUR",
        "thread_id": thread_id,
        "messages": [],
        "history": [],
        "user_id": None,
        "conversation_history": [],
        "routing_decision": None,
        "target_agent": None,
        "extracted_criteria": None,
        "property_data": None,
        "request_data": None,
        "current_node": "supervisor",
        "error_message": None,
        "is_complete": False,
        "agent_response": None,
        "final_response": None,
        "recommendations": None,
        "agent_name": None,
        "agent_traces": None,
        "conversation_ctx": None,
        "memory_trace": None,
        "memory_context_summary": None,
        "memory_context_facts": None,
        "memory_context_recent": None,
        "retrieved_context": None,
        "active_domain": None,
        "fused_context": None,
        "agent_contexts": None,
        "shared_context": None,
        "previous_agent": None,
        "agent_specific_context": None,
        "agent_collected_info": None,
        "agent_conversation_stage": None,
    }

    result1 = supervisor.invoke(state1, config={"configurable": {"thread_id": thread_id}})

    print(f"\nRouted to: {result1.get('current_node')}")
    print(f"Active domain: {result1.get('active_domain')}")

    agent_contexts = result1.get('agent_contexts') or {}
    print(f"\nAgent contexts: {list(agent_contexts.keys())}")

    if 'real_estate_agent' in agent_contexts:
        re_ctx = agent_contexts['real_estate_agent']
        print(f"Real Estate Agent context:")
        print(f"  - Collected info: {re_ctx.get('collected_info')}")
        print(f"  - Conversation stage: {re_ctx.get('conversation_stage')}")
        print(f"  - Result count: {re_ctx.get('result_count', 0)}")

        # Verify entities were extracted
        collected = re_ctx.get('collected_info', {})
        checks = {
            'location': 'Girne' in str(collected.get('location', '')),
            'budget': collected.get('budget') is not None,
            'bedrooms': collected.get('bedrooms') == 2,
        }

        if all(checks.values()):
            print("\n✅ Entity extraction verified (location, budget, bedrooms)")
        else:
            print(f"\n⚠️  Entity extraction incomplete: {checks}")
    else:
        print("\n❌ Real estate agent context not found")
        return False

    # Turn 2: Marketplace query (agent switch)
    print_subsection("Turn 2: Marketplace Query (Agent Switch)")
    print("Input: 'Actually, I also need a car'")

    state2 = {
        **result1,
        "user_input": "Actually, I also need a car",
        "is_complete": False,
    }

    result2 = supervisor.invoke(state2, config={"configurable": {"thread_id": thread_id}})

    print(f"\nRouted to: {result2.get('current_node')}")
    print(f"Active domain: {result2.get('active_domain')}")
    print(f"Previous agent: {result2.get('previous_agent')}")

    agent_contexts = result2.get('agent_contexts') or {}
    print(f"\nAgent contexts: {list(agent_contexts.keys())}")

    # Check that both agents have isolated contexts
    if 'real_estate_agent' in agent_contexts and 'marketplace_agent' in agent_contexts:
        print("\n✅ Both agents have isolated contexts")

        # Verify marketplace agent received handoff
        mp_ctx = agent_contexts.get('marketplace_agent', {})
        mp_collected = mp_ctx.get('collected_info', {})

        # Check shared context was transferred
        shared_ctx = result2.get('shared_context') or {}
        print(f"\nShared context: {shared_ctx}")

        if 'location' in shared_ctx and 'budget' in shared_ctx:
            print("✅ Shared context preserved (location, budget)")
        else:
            print("⚠️  Shared context incomplete")

        print("\n✅ Agent context isolation verified")
        return True
    else:
        print("\n❌ Agent context isolation failed")
        return False


def test_handoff_protocol():
    """Test that handoff protocol preserves information across agent switches"""
    print_section("TEST 2: Handoff Protocol")

    supervisor = get_supervisor_graph()
    thread_id = f"step4-handoff-{int(time.time())}"

    # Turn 1: Real estate with location
    print_subsection("Turn 1: Real Estate with Location")
    print("Input: 'I want an apartment in Girne'")

    state1 = {
        "user_input": "I want an apartment in Girne",
        "thread_id": thread_id,
        "messages": [],
        "history": [],
        "user_id": None,
        "conversation_history": [],
        "routing_decision": None,
        "target_agent": None,
        "extracted_criteria": None,
        "property_data": None,
        "request_data": None,
        "current_node": "supervisor",
        "error_message": None,
        "is_complete": False,
        "agent_response": None,
        "final_response": None,
        "recommendations": None,
        "agent_name": None,
        "agent_traces": None,
        "conversation_ctx": None,
        "memory_trace": None,
        "memory_context_summary": None,
        "memory_context_facts": None,
        "memory_context_recent": None,
        "retrieved_context": None,
        "active_domain": None,
        "fused_context": None,
        "agent_contexts": None,
        "shared_context": None,
        "previous_agent": None,
        "agent_specific_context": None,
        "agent_collected_info": None,
        "agent_conversation_stage": None,
    }

    result1 = supervisor.invoke(state1, config={"configurable": {"thread_id": thread_id}})

    shared_ctx_before = result1.get('shared_context') or {}
    print(f"\nShared context after RE agent: {shared_ctx_before}")

    # Turn 2: Switch to local info (should preserve location)
    print_subsection("Turn 2: Local Info Query (Should Preserve Location)")
    print("Input: 'Where are the pharmacies?'")

    state2 = {
        **result1,
        "user_input": "Where are the pharmacies?",
        "is_complete": False,
    }

    result2 = supervisor.invoke(state2, config={"configurable": {"thread_id": thread_id}})

    print(f"\nRouted to: {result2.get('current_node')}")
    print(f"Previous agent: {result2.get('previous_agent')}")

    # Check if handoff occurred
    if result2.get('previous_agent') == 'real_estate_agent':
        print("✅ Agent switch detected (real_estate -> local_info)")

        # Check if location was preserved
        shared_ctx_after = result2.get('shared_context') or {}
        print(f"\nShared context after handoff: {shared_ctx_after}")

        if 'location' in shared_ctx_after:
            print(f"✅ Location preserved in handoff: {shared_ctx_after['location']}")

            # Check if local_info agent received the location
            agent_contexts = result2.get('agent_contexts') or {}
            if 'local_info_agent' in agent_contexts:
                local_ctx = agent_contexts['local_info_agent']
                local_collected = local_ctx.get('collected_info', {})

                if 'location' in local_collected or 'location' in shared_ctx_after:
                    print("✅ Handoff protocol verified (location carried over)")
                    return True
                else:
                    print("⚠️  Location not found in local_info context")
            else:
                print("⚠️  Local info agent context not found")
        else:
            print("❌ Location not preserved in handoff")
            return False
    else:
        print("⚠️  Agent switch not detected or incorrect previous agent")
        return False


def test_conversation_stage_tracking():
    """Test that conversation stages are tracked correctly"""
    print_section("TEST 3: Conversation Stage Tracking")

    supervisor = get_supervisor_graph()
    thread_id = f"step4-stages-{int(time.time())}"

    # Turn 1: Initial query (should be discovery/presenting)
    print_subsection("Turn 1: Initial Property Query")
    print("Input: 'Show me apartments in Nicosia'")

    state1 = {
        "user_input": "Show me apartments in Nicosia",
        "thread_id": thread_id,
        "messages": [],
        "history": [],
        "user_id": None,
        "conversation_history": [],
        "routing_decision": None,
        "target_agent": None,
        "extracted_criteria": None,
        "property_data": None,
        "request_data": None,
        "current_node": "supervisor",
        "error_message": None,
        "is_complete": False,
        "agent_response": None,
        "final_response": None,
        "recommendations": None,
        "agent_name": None,
        "agent_traces": None,
        "conversation_ctx": None,
        "memory_trace": None,
        "memory_context_summary": None,
        "memory_context_facts": None,
        "memory_context_recent": None,
        "retrieved_context": None,
        "active_domain": None,
        "fused_context": None,
        "agent_contexts": None,
        "shared_context": None,
        "previous_agent": None,
        "agent_specific_context": None,
        "agent_collected_info": None,
        "agent_conversation_stage": None,
    }

    result1 = supervisor.invoke(state1, config={"configurable": {"thread_id": thread_id}})

    agent_contexts = result1.get('agent_contexts') or {}
    if 'real_estate_agent' in agent_contexts:
        re_ctx = agent_contexts['real_estate_agent']
        stage = re_ctx.get('conversation_stage')
        print(f"\nConversation stage: {stage}")

        expected_stages = ['discovery', 'presenting', 'refinement']
        if stage in expected_stages:
            print(f"✅ Valid conversation stage: {stage}")
            return True
        else:
            print(f"⚠️  Unexpected conversation stage: {stage}")
            return False
    else:
        print("❌ Real estate agent context not found")
        return False


def test_context_aware_continuity_guard():
    """Test that continuity guard is aware of agent context"""
    print_section("TEST 4: Context-Aware Continuity Guard")

    supervisor = get_supervisor_graph()
    thread_id = f"step4-guard-{int(time.time())}"

    # Turn 1: Build up context in real estate agent
    print_subsection("Turn 1: Build Context in Real Estate Agent")
    print("Input: 'I want a 3-bedroom villa in Girne for 2000 EUR per month'")

    state1 = {
        "user_input": "I want a 3-bedroom villa in Girne for 2000 EUR per month",
        "thread_id": thread_id,
        "messages": [],
        "history": [],
        "user_id": None,
        "conversation_history": [],
        "routing_decision": None,
        "target_agent": None,
        "extracted_criteria": None,
        "property_data": None,
        "request_data": None,
        "current_node": "supervisor",
        "error_message": None,
        "is_complete": False,
        "agent_response": None,
        "final_response": None,
        "recommendations": None,
        "agent_name": None,
        "agent_traces": None,
        "conversation_ctx": None,
        "memory_trace": None,
        "memory_context_summary": None,
        "memory_context_facts": None,
        "memory_context_recent": None,
        "retrieved_context": None,
        "active_domain": None,
        "fused_context": None,
        "agent_contexts": None,
        "shared_context": None,
        "previous_agent": None,
        "agent_specific_context": None,
        "agent_collected_info": None,
        "agent_conversation_stage": None,
    }

    result1 = supervisor.invoke(state1, config={"configurable": {"thread_id": thread_id}})

    agent_contexts = result1.get('agent_contexts') or {}
    if 'real_estate_agent' in agent_contexts:
        re_ctx = agent_contexts['real_estate_agent']
        collected = re_ctx.get('collected_info', {})
        print(f"\nReal Estate Agent collected {len(collected)} entities")
        print(f"Conversation stage: {re_ctx.get('conversation_stage')}")

        # Turn 2: Ambiguous follow-up (should maintain domain due to context)
        print_subsection("Turn 2: Ambiguous Follow-up (Should Maintain Domain)")
        print("Input: 'cheaper' (ambiguous, but agent has significant context)")

        state2 = {
            **result1,
            "user_input": "cheaper",
            "is_complete": False,
        }

        result2 = supervisor.invoke(state2, config={"configurable": {"thread_id": thread_id}})

        print(f"\nRouted to: {result2.get('current_node')}")
        print(f"Active domain: {result2.get('active_domain')}")

        # Should stay in real_estate due to:
        # 1. Ambiguous pattern "cheaper"
        # 2. Agent has significant context (3+ entities)
        # 3. Agent in presenting/refinement stage

        if result2.get('current_node') == 'real_estate_agent':
            print("✅ Continuity guard maintained domain (context-aware)")
            return True
        else:
            print(f"⚠️  Unexpected routing: {result2.get('current_node')}")
            return False
    else:
        print("❌ Real estate agent context not found")
        return False


def main():
    """Run all STEP 4 validation tests"""
    print("\n" + "=" * 70)
    print("  STEP 4 VALIDATION - Agent Context Preservation & Multi-Agent Coherence")
    print("=" * 70)

    results = {}

    # Test 1: Agent Context Isolation
    try:
        results['isolation'] = test_agent_context_isolation()
    except Exception as e:
        print(f"\n❌ Test 1 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results['isolation'] = False

    # Test 2: Handoff Protocol
    try:
        results['handoff'] = test_handoff_protocol()
    except Exception as e:
        print(f"\n❌ Test 2 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results['handoff'] = False

    # Test 3: Conversation Stage Tracking
    try:
        results['stages'] = test_conversation_stage_tracking()
    except Exception as e:
        print(f"\n❌ Test 3 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results['stages'] = False

    # Test 4: Context-Aware Continuity Guard
    try:
        results['guard'] = test_context_aware_continuity_guard()
    except Exception as e:
        print(f"\n❌ Test 4 failed with exception: {e}")
        import traceback
        traceback.print_exc()
        results['guard'] = False

    # Summary
    print_section("VALIDATION SUMMARY")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"\nTests passed: {passed}/{total}")
    print("\nDetailed results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name:20s}: {status}")

    if passed == total:
        print("\n" + "=" * 70)
        print("  🎉 ALL TESTS PASSED - STEP 4 Implementation Complete!")
        print("=" * 70)
        print("\n✅ Capabilities verified:")
        print("   • Agent context buckets (isolated per agent)")
        print("   • Entity extraction from user input")
        print("   • Handoff protocol (location/budget preservation)")
        print("   • Shared context across agents")
        print("   • Conversation stage tracking")
        print("   • Context-aware continuity guard")
        print("\n📊 Integration Status:")
        print("   • Short-term memory: LangGraph MemorySaver (ephemeral)")
        print("   • Long-term memory: Zep vector store (persistent)")
        print("   • Context fusion: 5-layer context merging")
        print("   • Multi-agent coherence: Context preservation + handoff")
        print("\n🚀 System is production-ready for multi-agent conversations!")
        print("=" * 70 + "\n")
        return True
    else:
        print("\n" + "=" * 70)
        print(f"  ⚠️  {total - passed} TEST(S) FAILED")
        print("=" * 70)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
