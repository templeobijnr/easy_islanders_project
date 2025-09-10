#!/usr/bin/env python3
"""
Test script for the Easy Islanders Automated Outreach System.
This tests the complete flow: listing search → outreach → media processing.
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000/api"
TEST_LISTING_ID = 1  # Change this to an actual listing ID in your DB

def test_complete_outreach_flow():
    """Test the complete automated outreach flow."""
    print("Easy Islanders - Automated Outreach System Test")
    print("=" * 50)
    
    # Step 1: Get listing details
    print("\n1. Getting listing details...")
    listing_data = test_listing_details()
    
    if not listing_data:
        print("❌ Cannot proceed without listing data")
        return False
    
    if not listing_data.get('contact_available'):
        print("❌ Listing has no contact information - cannot test outreach")
        return False
    
    # Step 2: Test agent outreach
    print("\n2. Testing agent outreach...")
    outreach_result = test_agent_outreach()
    
    if not outreach_result:
        print("❌ Outreach failed")
        return False
    
    # Step 3: Test chat endpoint with the same listing
    print("\n3. Testing AI chat with property request...")
    chat_result = test_chat_with_property_request()
    
    if not chat_result:
        print("❌ Chat failed")
        return False
    
    # Step 4: Simulate Twilio webhook (media reply)
    print("\n4. Simulating Twilio media webhook...")
    webhook_result = test_twilio_webhook_simulation()
    
    print("\n" + "=" * 50)
    print("🎯 Automated Outreach System Test Complete!")
    
    if all([listing_data, outreach_result, chat_result, webhook_result]):
        print("✅ All systems working correctly!")
        return True
    else:
        print("❌ Some systems need attention")
        return False

def test_listing_details():
    """Test getting listing details."""
    print("   📋 Testing listing details endpoint...")
    
    url = f"{BASE_URL}/listings/{TEST_LISTING_ID}/"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Listing: {data.get('title')}")
        print(f"   📍 Location: {data.get('location')}")
        print(f"   💰 Price: {data.get('price')}")
        print(f"   📞 Contact Available: {data.get('contact_available')}")
        print(f"   📸 Verified with Photos: {data.get('verified_with_photos')}")
        return data
    else:
        print(f"   ❌ Error: {response.status_code} - {response.text}")
        return None

def test_agent_outreach():
    """Test initiating agent outreach."""
    print("   📤 Testing agent outreach endpoint...")
    
    url = f"{BASE_URL}/listings/outreach/"
    payload = {
        "listing_id": TEST_LISTING_ID,
        "channel": "whatsapp",
        "language": "en",
        "user_message": "Test automated outreach request"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Outreach initiated: {data.get('message')}")
        print(f"   🆔 Outreach ID: {data.get('outreach_id')}")
        print(f"   📊 Status: {data.get('status')}")
        return True
    else:
        print(f"   ❌ Error: {response.status_code} - {response.text}")
        return False

def test_chat_with_property_request():
    """Test the AI chat with a property request."""
    print("   🤖 Testing AI chat with property request...")
    
    url = f"{BASE_URL}/chat/"
    payload = {
        "message": "I'm looking for a 2+1 apartment in Kyrenia around 500 GBP",
        "conversation_id": "test_automated_outreach_123"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ AI Response: {data.get('message')[:100]}...")
        print(f"   🌍 Language: {data.get('language')}")
        print(f"   🏠 Recommendations: {len(data.get('recommendations', []))}")
        return True
    else:
        print(f"   ❌ Error: {response.status_code} - {response.text}")
        return False

def test_twilio_webhook_simulation():
    """Simulate a Twilio webhook with media."""
    print("   📱 Testing Twilio webhook simulation...")
    
    url = f"{BASE_URL}/webhooks/twilio/"
    
    # Simulate Twilio webhook data (form data, not JSON)
    webhook_data = {
        'From': 'whatsapp:+905551234567',  # Example Turkish number
        'Body': 'Here are the photos you requested',
        'MediaUrl0': 'https://example.com/test-photo-1.jpg',
        'MediaUrl1': 'https://example.com/test-photo-2.jpg',
        'MessageSid': 'test_message_123',
        'NumMedia': '2'
    }
    
    response = requests.post(url, data=webhook_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Webhook processed: {data.get('message')}")
        if data.get('listing_id'):
            print(f"   🏠 Listing ID: {data.get('listing_id')}")
        if data.get('media_url'):
            print(f"   📸 Media URL: {data.get('media_url')}")
        return True
    else:
        print(f"   ❌ Error: {response.status_code} - {response.text}")
        return False

def test_listing_update_after_media():
    """Test if listing was updated after media webhook."""
    print("\n5. Verifying listing update after media...")
    
    # Wait a moment for processing
    time.sleep(1)
    
    url = f"{BASE_URL}/listings/{TEST_LISTING_ID}/"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   📸 Current images: {len(data.get('images', []))}")
        print(f"   ✅ Verified with photos: {data.get('verified_with_photos')}")
        return True
    else:
        print(f"   ❌ Error checking updated listing: {response.status_code}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Automated Outreach System Test...")
    
    # Run the complete test
    success = test_complete_outreach_flow()
    
    if success:
        print("\n🎉 All tests passed! The automated outreach system is working correctly.")
        print("\nNext steps:")
        print("1. Configure your Twilio credentials in settings")
        print("2. Set up your Twilio webhook URL: https://yourdomain.com/api/webhooks/twilio/")
        print("3. Test with real WhatsApp numbers")
        print("4. Configure S3/CDN for media storage")
    else:
        print("\n⚠️  Some tests failed. Check the logs above for details.")
        print("\nCommon issues:")
        print("1. Django server not running")
        print("2. Database has no listings")
        print("3. Missing contact information in listings")
        print("4. API endpoints not configured correctly")
