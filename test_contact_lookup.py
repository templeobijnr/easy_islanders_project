#!/usr/bin/env python3
"""
Test script to verify contact lookup functionality.
"""

import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/Users/apple_trnc/Desktop/work/easy_islanders_project')

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')

# Setup Django
django.setup()

from assistant.twilio_client import MediaProcessor

def test_contact_lookup():
    """Test the contact lookup functionality."""
    print("🔍 Testing Contact Lookup...")
    print("=" * 40)
    
    # Test different phone number formats
    test_numbers = [
        "whatsapp:+905488639394",
        "+905488639394", 
        "905488639394",
        "whatsapp:905488639394"
    ]
    
    media_processor = MediaProcessor()
    
    for phone_number in test_numbers:
        print(f"\n📱 Testing: {phone_number}")
        
        listing_id = media_processor._find_listing_by_contact(phone_number)
        
        if listing_id:
            print(f"   ✅ Found listing ID: {listing_id}")
        else:
            print(f"   ❌ No listing found")
    
    print("\n" + "=" * 40)
    print("Contact lookup test complete!")

if __name__ == "__main__":
    test_contact_lookup()
