#!/usr/bin/env python3
"""
Test script to verify Real Estate Agent Prometheus metrics.

Tests that metrics are properly emitted when the agent processes requests.
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings.development")
django.setup()

# Import the agent module to register metrics
from assistant.agents.real_estate import agent as re_agent
from assistant.brain.agent import run_supervisor_agent
from prometheus_client import REGISTRY, generate_latest


def test_metrics_emission():
    """Test that RE agent metrics are emitted correctly."""
    print("\n" + "="*80)
    print("TEST: Verify Prometheus Metrics Emission")
    print("="*80)

    # Get baseline metrics
    print("\n1. Checking baseline metrics...")
    baseline = generate_latest(REGISTRY).decode('utf-8')

    # Check if our metrics are registered
    has_requests_total = 'agent_re_requests_total' in baseline
    has_execution_seconds = 'agent_re_execution_duration_seconds' in baseline
    has_search_results = 'agent_re_search_results_count' in baseline
    has_errors_total = 'agent_re_errors_total' in baseline

    print(f"   agent_re_requests_total registered: {has_requests_total}")
    print(f"   agent_re_execution_duration_seconds registered: {has_execution_seconds}")
    print(f"   agent_re_search_results_count registered: {has_search_results}")
    print(f"   agent_re_errors_total registered: {has_errors_total}")

    if not all([has_requests_total, has_execution_seconds, has_search_results, has_errors_total]):
        print("\n❌ FAILED: Not all metrics are registered!")
        return False

    # Run a property search to generate metrics
    print("\n2. Running property search to generate metrics...")
    result = run_supervisor_agent(
        user_input="I'm looking for a 2 bedroom apartment in Kyrenia for under £200 per night",
        thread_id="test-metrics-001"
    )

    print(f"   ✓ Search completed: {len(result.get('recommendations', []))} properties found")

    # Get updated metrics
    print("\n3. Checking updated metrics...")
    updated = generate_latest(REGISTRY).decode('utf-8')

    # Extract metric values
    for line in updated.split('\n'):
        if line.startswith('agent_re_'):
            print(f"   {line}")

    # Verify metrics have non-zero values
    print("\n4. Validating metric values...")

    # Check requests_total has intent="property_search" with count >= 1
    requests_found = False
    for line in updated.split('\n'):
        if 'agent_re_requests_total{intent="property_search"}' in line:
            try:
                value = float(line.split()[-1])
                requests_found = value >= 1
                print(f"   ✓ agent_re_requests_total{{intent=\"property_search\"}} = {value}")
            except:
                pass

    # Check execution_duration has data
    duration_found = False
    for line in updated.split('\n'):
        if 'agent_re_execution_duration_seconds_count' in line:
            try:
                value = float(line.split()[-1])
                duration_found = value >= 1
                print(f"   ✓ agent_re_execution_duration_seconds_count = {value}")
            except:
                pass

    # Check search_results has data
    results_found = False
    for line in updated.split('\n'):
        if 'agent_re_search_results_count_count' in line:
            try:
                value = float(line.split()[-1])
                results_found = value >= 1
                print(f"   ✓ agent_re_search_results_count_count = {value}")
            except:
                pass

    if not all([requests_found, duration_found, results_found]):
        print("\n❌ FAILED: Not all metrics have non-zero values!")
        print(f"   requests_found: {requests_found}")
        print(f"   duration_found: {duration_found}")
        print(f"   results_found: {results_found}")
        return False

    print("\n" + "="*80)
    print("✅ SUCCESS: All metrics are emitting correctly!")
    print("="*80)
    print("\n📊 METRICS SUMMARY:")
    print("   - agent_re_requests_total: Tracking requests by intent ✓")
    print("   - agent_re_execution_duration_seconds: Tracking execution time ✓")
    print("   - agent_re_search_results_count: Tracking result counts ✓")
    print("   - agent_re_errors_total: Ready to track errors ✓")
    print("\n🎯 ACCEPTANCE GATE PASSED:")
    print("   Step 2 (Telemetry) is complete - metrics are wired and emitting!")

    return True


if __name__ == "__main__":
    try:
        success = test_metrics_emission()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n💥 ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
