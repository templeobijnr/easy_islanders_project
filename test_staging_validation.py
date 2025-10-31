#!/usr/bin/env python3
"""
Staging validation test script for Easy Islanders project.
Tests different retrieval paths and verifies metrics are working.
"""

import os
import sys
import django
import requests
import json
import time

# Add the project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
django.setup()

from assistant.brain.supervisor_graph import build_supervisor_graph
from assistant.brain.supervisor_schemas import SupervisorState

def test_registry_service():
    """Test registry service functionality."""
    print("=== Testing Registry Service ===")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8081/v1/healthz", timeout=5)
        print(f"✓ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False
    
    # Test search endpoint
    try:
        response = requests.post(
            "http://localhost:8081/v1/terms/search",
            headers={
                "Authorization": "Bearer dev-key",
                "Content-Type": "application/json"
            },
            json={
                "text": "Immigration Office",
                "market_id": "CY-NC",
                "language": "en"
            },
            timeout=10
        )
        print(f"✓ Search test: {response.status_code}")
        if response.status_code != 200:
            print(f"  Error: {response.text}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Found {len(data)} terms")
            if data:
                print(f"  First result: {data[0]['localized_term']} -> {data[0]['route_target']}")
    except Exception as e:
        print(f"✗ Search test failed: {e}")
        return False
    
    # Test metrics endpoint
    try:
        response = requests.get("http://localhost:8081/metrics", timeout=5)
        print(f"✓ Metrics endpoint: {response.status_code}")
        if "registry_terms_search_latency_seconds" in response.text:
            print("  ✓ Prometheus metrics format detected")
        else:
            print("  ⚠ Prometheus metrics not found")
    except Exception as e:
        print(f"✗ Metrics test failed: {e}")
        return False
    
    return True

def test_supervisor_graph():
    """Test supervisor graph with different retrieval paths."""
    print("\n=== Testing Supervisor Graph ===")
    
    graph = build_supervisor_graph()
    
    # Test cases for different retrieval paths
    test_cases = [
        {
            "name": "Registry Path (Immigration Office)",
            "query": "Where is the immigration office in Nicosia?",
            "expected_agent": "local_info_agent"
        },
        {
            "name": "Web Search Path (Pharmacy)",
            "query": "Where can I find an open pharmacy in Nicosia?",
            "expected_agent": "local_info_agent"
        },
        {
            "name": "General Query",
            "query": "What services are available?",
            "expected_agent": "local_info_agent"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {test_case['name']} ---")
        
        try:
            state: SupervisorState = {
                'user_input': test_case['query'],
                'thread_id': f'test-{i}',
                'messages': [],
                'user_id': None,
                'conversation_history': [],
                'routing_decision': None,
                'routing_decision_normalized': None,
                'routing_decision_raw': None,
                'target_agent': None,
                'extracted_criteria': None,
                'property_data': None,
                'request_data': None,
                'current_node': 'supervisor',
                'error_message': None,
                'is_complete': False,
                'agent_response': None,
                'final_response': None,
                'recommendations': None
            }
            
            result = graph.invoke(state, config={'configurable': {'thread_id': f'test-{i}'}})
            
            print(f"✓ Query processed successfully")
            print(f"  Target agent: {result.get('target_agent', 'unknown')}")
            print(f"  Complete: {result.get('is_complete', False)}")
            final_response = result.get('final_response', {})
            if isinstance(final_response, dict):
                print(f"  Response type: {final_response.get('type', 'unknown')}")
            else:
                print(f"  Response type: {type(final_response).__name__}")
            
            if result.get('recommendations'):
                print(f"  Recommendations: {len(result['recommendations'])} items")
            
            results.append({
                "test": test_case['name'],
                "success": True,
                "target_agent": result.get('target_agent'),
                "complete": result.get('is_complete', False)
            })
            
        except Exception as e:
            print(f"✗ Test failed: {e}")
            results.append({
                "test": test_case['name'],
                "success": False,
                "error": str(e)
            })
    
    return results

def test_metrics_after_requests():
    """Test metrics after making requests."""
    print("\n=== Testing Metrics After Requests ===")
    
    try:
        response = requests.get("http://localhost:8081/metrics", timeout=5)
        metrics_text = response.text
        
        # Check for specific metrics
        metrics_found = []
        
        if "registry_terms_search_latency_seconds_count" in metrics_text:
            metrics_found.append("search_latency_counter")
        
        if "registry_text_fallback_total" in metrics_text:
            metrics_found.append("text_fallback_counter")
        
        if "registry_embeddings_requests_total" in metrics_text:
            metrics_found.append("embeddings_requests_counter")
        
        print(f"✓ Metrics found: {', '.join(metrics_found)}")
        
        # Extract specific values
        lines = metrics_text.split('\n')
        for line in lines:
            if line.startswith('registry_terms_search_latency_seconds_count'):
                count = line.split()[-1]
                print(f"  Search requests: {count}")
            elif line.startswith('registry_text_fallback_total'):
                count = line.split()[-1]
                print(f"  Text fallbacks: {count}")
        
        return len(metrics_found) > 0
        
    except Exception as e:
        print(f"✗ Metrics test failed: {e}")
        return False

def main():
    """Run all staging validation tests."""
    print("Easy Islanders - Staging Validation Test")
    print("=" * 50)
    
    # Test 1: Registry Service
    registry_ok = test_registry_service()
    
    # Test 2: Supervisor Graph
    supervisor_results = test_supervisor_graph()
    
    # Test 3: Metrics after requests
    metrics_ok = test_metrics_after_requests()
    
    # Summary
    print("\n" + "=" * 50)
    print("STAGING VALIDATION SUMMARY")
    print("=" * 50)
    
    print(f"Registry Service: {'✓ PASS' if registry_ok else '✗ FAIL'}")
    print(f"Metrics Endpoint: {'✓ PASS' if metrics_ok else '✗ FAIL'}")
    
    supervisor_success = sum(1 for r in supervisor_results if r['success'])
    print(f"Supervisor Tests: {supervisor_success}/{len(supervisor_results)} PASS")
    
    for result in supervisor_results:
        status = "✓" if result['success'] else "✗"
        print(f"  {status} {result['test']}")
        if not result['success'] and 'error' in result:
            print(f"    Error: {result['error']}")
    
    overall_success = registry_ok and metrics_ok and supervisor_success > 0
    print(f"\nOverall: {'✓ STAGING VALIDATION PASSED' if overall_success else '✗ STAGING VALIDATION FAILED'}")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
