#!/usr/bin/env python3
"""
Test script for the Easy Islanders Agent Outreach system.
Run this to test the outreach functionality.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_LISTING_ID = 1  # Change this to an actual listing ID in your DB

def test_listing_details():
    """Test getting listing details."""
    print("=== Testing Listing Details ===")
    
    url = f"{BASE_URL}/listings/{TEST_LISTING_ID}/"
    response = requests.get(url)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Listing: {data.get('title')}")
        print(f"Location: {data.get('location')}")
        print(f"Price: {data.get('price')}")
        print(f"Contact Available: {data.get('contact_available')}")
        print(f"Outreach Status: {data.get('outreach_status')}")
        return data
    else:
        print(f"Error: {response.text}")
        return None

def test_agent_outreach():
    """Test initiating agent outreach."""
    print("\n=== Testing Agent Outreach ===")
    
    url = f"{BASE_URL}/listings/outreach/"
    payload = {
        "listing_id": TEST_LISTING_ID,
        "channel": "whatsapp",
        "language": "en",
        "user_message": "Test outreach request"
    }
    
    response = requests.post(url, json=payload)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data.get('message')}")
        print(f"Outreach ID: {data.get('outreach_id')}")
        print(f"Status: {data.get('status')}")
    else:
        print(f"Error: {response.text}")

def test_chat_endpoint():
    """Test the main chat endpoint."""
    print("\n=== Testing Chat Endpoint ===")
    
    url = f"{BASE_URL}/chat/"
    payload = {
        "message": "I'm looking for a 2+1 apartment in Kyrenia",
        "conversation_id": "test_conv_123"
    }
    
    response = requests.post(url, json=payload)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {data.get('message')[:100]}...")
        print(f"Language: {data.get('language')}")
        print(f"Recommendations: {len(data.get('recommendations', []))}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("Easy Islanders - Agent Outreach Test")
    print("=" * 40)
    
    # Test listing details first
    listing_data = test_listing_details()
    
    if listing_data and listing_data.get('contact_available'):
        # Only test outreach if contact info is available
        test_agent_outreach()
    else:
        print("\nSkipping outreach test - no contact info available")
    
    # Test chat endpoint
    test_chat_endpoint()
    
    print("\n=== Test Complete ===")
