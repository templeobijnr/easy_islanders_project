#!/usr/bin/env python3
"""
Test script to verify Twilio connection with your credentials.
Run this to check if your Twilio setup is working.
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

from assistant.twilio_client import TwilioWhatsAppClient

def test_twilio_connection():
    """Test Twilio connection and get account info."""
    print("🔐 Testing Twilio Connection...")
    print("=" * 40)
    
    try:
        # Initialize Twilio client
        client = TwilioWhatsAppClient()
        
        print(f"✅ Account SID: {client.account_sid}")
        print(f"✅ Auth Token: {'*' * 10}{client.auth_token[-4:] if client.auth_token else 'NOT SET'}")
        print(f"✅ WhatsApp From: {client.whatsapp_from}")
        
        if not all([client.account_sid, client.auth_token, client.whatsapp_from]):
            print("\n❌ Missing Twilio credentials!")
            print("Please check your Django settings file.")
            return False
        
        # Test API connection by getting account info
        import requests
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{client.account_sid}.json"
        response = requests.get(url, auth=(client.account_sid, client.auth_token))
        
        if response.status_code == 200:
            account_data = response.json()
            print(f"\n✅ Twilio API Connection Successful!")
            print(f"   Account Name: {account_data.get('friendly_name', 'N/A')}")
            print(f"   Account Status: {account_data.get('status', 'N/A')}")
            print(f"   Account Type: {account_data.get('type', 'N/A')}")
            
            # Check if account is active
            if account_data.get('status') == 'active':
                print("   🟢 Account is ACTIVE and ready to use!")
            else:
                print("   🟡 Account status needs attention")
            
            return True
            
        else:
            print(f"\n❌ Twilio API Connection Failed!")
            print(f"   Status Code: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing Twilio connection: {e}")
        return False

def get_whatsapp_sandbox_info():
    """Get WhatsApp sandbox information."""
    print("\n📱 WhatsApp Sandbox Information:")
    print("=" * 40)
    
    print("To get your WhatsApp sandbox number:")
    print("1. Go to: https://console.twilio.com/us1/messaging/settings/whatsapp-sandbox")
    print("2. Look for 'Sandbox Number'")
    print("3. Copy that number and update your settings")
    print("4. For testing, you'll need to join the sandbox with your phone")
    
    print("\n🔗 Direct Links:")
    print("   • WhatsApp Sandbox: https://console.twilio.com/us1/messaging/settings/whatsapp-sandbox")
    print("   • Phone Numbers: https://console.twilio.com/us1/phone-numbers/manage/active")
    print("   • Account Info: https://console.twilio.com/us1/account")

if __name__ == "__main__":
    print("🚀 Easy Islanders - Twilio Connection Test")
    print("=" * 50)
    
    # Test connection
    success = test_twilio_connection()
    
    if success:
        print("\n🎉 Twilio connection successful!")
        print("Your credentials are working correctly.")
        
        # Get sandbox info
        get_whatsapp_sandbox_info()
        
        print("\n📝 Next Steps:")
        print("1. Get your WhatsApp sandbox number from Twilio Console")
        print("2. Update TWILIO_WHATSAPP_FROM in your settings")
        print("3. Test the automated outreach system")
        print("4. Set up webhook URL in Twilio Console")
        
    else:
        print("\n⚠️  Twilio connection failed!")
        print("Please check your credentials and try again.")
        print("\nCommon issues:")
        print("• Incorrect Account SID or Auth Token")
        print("• Account not activated")
        print("• Network connectivity issues")
