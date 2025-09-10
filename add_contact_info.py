#!/usr/bin/env python3
"""
Script to add contact information to a listing for testing the outreach system.
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

from assistant.models import Listing

def add_contact_info():
    """Add contact information to listing ID 1 for testing."""
    try:
        # Get the listing
        listing = Listing.objects.get(id=1)
        
        # Get or create structured_data
        sd = listing.structured_data or {}
        
        # Add contact information
        sd['contact_info'] = {
            'whatsapp': '+905488639394',
            'phone': '+905488639394',
            'contact_number': '+905488639394'
        }
        
        # Update the listing
        listing.structured_data = sd
        listing.save(update_fields=['structured_data'])
        
        print(f"✅ Successfully added contact info to Listing #{listing.id}")
        print(f"   WhatsApp: +905488639394")
        print(f"   Phone: +905488639394")
        print(f"   Title: {listing.structured_data.get('title', 'N/A')}")
        print(f"   Location: {listing.location}")
        print(f"   Price: {listing.price} {listing.currency}")
        
        return True
        
    except Listing.DoesNotExist:
        print("❌ Listing ID 1 not found")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Adding Contact Information for Testing...")
    print("=" * 50)
    
    success = add_contact_info()
    
    if success:
        print("\n🎉 Contact info added successfully!")
        print("Now you can test the automated outreach system.")
        print("\nNext steps:")
        print("1. Test the listing details endpoint")
        print("2. Test the agent outreach endpoint")
        print("3. Test the complete automated flow")
    else:
        print("\n⚠️  Failed to add contact info. Check the error above.")
