#!/usr/bin/env python3
"""Test what endpoints Zep Cloud SDK is actually calling."""

import httpx
from unittest.mock import patch
from zep_cloud.client import Zep
import os

# Monkey-patch httpx to log requests
original_request = httpx.Client.request

def logged_request(self, *args, **kwargs):
    print(f"\n🔍 HTTP REQUEST:")
    print(f"   Method: {args[0] if args else kwargs.get('method')}")
    print(f"   URL: {args[1] if len(args) > 1 else kwargs.get('url')}")
    print(f"   Headers: {kwargs.get('headers', {})}")
    return original_request(self, *args, **kwargs)

httpx.Client.request = logged_request

# Test SDK calls
api_key = os.getenv("ZEP_API_KEY", "test_key")
client = Zep(api_key=api_key, base_url="https://api.getzep.com")

print("=" * 60)
print("Testing Zep Cloud SDK Endpoint Paths")
print("=" * 60)

print("\n1. Testing graph.create()...")
try:
    client.graph.create(
        graph_id="test_endpoint_check",
        name="Test",
        description="Test"
    )
except Exception as e:
    print(f"   ❌ Error: {type(e).__name__}")

print("\n2. Testing graph.list_all()...")
try:
    client.graph.list_all()
except Exception as e:
    print(f"   ❌ Error: {type(e).__name__}")

print("\n3. Testing graph.add_fact_triple()...")
try:
    client.graph.add_fact_triple(
        graph_id="test",
        fact="test_fact",
        fact_name="Test Fact",
        source_node_name="A",
        target_node_name="B"
    )
except Exception as e:
    print(f"   ❌ Error: {type(e).__name__}")

print("\n" + "=" * 60)
print("Analysis:")
print("If URLs don't contain '/api/v2/graph/', the SDK needs updating")
print("=" * 60)
