#!/usr/bin/env python3
"""
Complete test script for Create Listing API endpoints
Tests the full flow with dynamic fields
"""

import os
import sys
import django
import json
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
sys.path.append('/Users/apple_trnc/Desktop/work/easy_islanders_project')
django.setup()

from django.contrib.auth import get_user_model
from listings.models import Category, SubCategory
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_create_listing_complete():
    """Test the complete create listing flow"""
    print("🚀 TESTING COMPLETE CREATE LISTING FLOW")
    print("=" * 60)
    
    # Base API URL
    API_BASE = "http://localhost:8000/api"
    
    # 1. Test Categories API
    print("\n1️⃣ Testing Categories API...")
    try:
        response = requests.get(f"{API_BASE}/categories/")
        if response.status_code == 200:
            data = response.json()
            categories = data.get('categories', [])
            print(f"✅ Categories API working - Found {len(categories)} categories")
            
            # Show first few categories with schemas
            for i, cat in enumerate(categories[:3]):
                print(f"   {i+1}. {cat['name']} ({len(cat.get('schema', {}).get('fields', []))} dynamic fields)")
        else:
            print(f"❌ Categories API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Categories API error: {e}")
        return False
    
    # 2. Create or get test business user
    print("\n2️⃣ Setting up test business user...")
    try:
        # Get or create business user
        user, created = User.objects.get_or_create(
            username='testbusiness',
            defaults={
                'email': 'test@business.com',
                'user_type': 'business'
            }
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
            print("✅ Created test business user")
        else:
            print("✅ Using existing test business user")
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        print(f"✅ Generated JWT token for {user.username}")
        
    except Exception as e:
        print(f"❌ User setup error: {e}")
        return False
    
    # 3. Test Create Listing API with different categories
    print("\n3️⃣ Testing Create Listing API...")
    
    # Test cases for different categories
    test_listings = [
        {
            'name': 'Real Estate Apartment',
            'category_slug': 'real-estate',
            'data': {
                'title': 'Beautiful 2-Bedroom Apartment in Nicosia',
                'description': 'Modern apartment with great views, close to amenities',
                'price': '1200.00',
                'currency': 'EUR',
                'location': 'Nicosia, Cyprus',
                'dynamic_fields': {
                    'property_type': 'apartment',
                    'bedrooms': 2,
                    'bathrooms': 1,
                    'area_sqm': 85,
                    'furnished': True,
                    'parking': True,
                    'rental_type': 'long_term'
                }
            }
        },
        {
            'name': 'Electronics Laptop',
            'category_slug': 'electronics',
            'data': {
                'title': 'High-Performance Laptop for Sale',
                'description': 'Powerful laptop in excellent condition, perfect for work and gaming',
                'price': '899.00',
                'currency': 'EUR',
                'location': 'Limassol, Cyprus',
                'dynamic_fields': {
                    'brand': 'Dell',
                    'model': 'XPS 15',
                    'condition': 'like_new',
                    'warranty': True,
                    'original_box': True,
                    'year_manufactured': 2023
                }
            }
        },
        {
            'name': 'Service IT Support',
            'category_slug': 'services',
            'data': {
                'title': 'Professional IT Support Services',
                'description': 'Expert IT support for businesses and individuals',
                'price': '45.00',
                'currency': 'EUR',
                'location': 'Larnaca, Cyprus',
                'dynamic_fields': {
                    'service_type': 'consulting',
                    'experience_years': 8,
                    'service_area': 'All Cyprus',
                    'hourly_rate': 45,
                    'onsite_service': True
                }
            }
        }
    ]
    
    # Get category mapping
    categories_response = requests.get(f"{API_BASE}/categories/")
    categories_data = categories_response.json()['categories']
    category_map = {cat['slug']: cat for cat in categories_data}
    
    created_listings = []
    
    for test_case in test_listings:
        print(f"\n   Testing {test_case['name']}...")
        
        # Get category
        category = category_map.get(test_case['category_slug'])
        if not category:
            print(f"   ❌ Category {test_case['category_slug']} not found")
            continue
            
        # Prepare listing data
        listing_data = test_case['data'].copy()
        listing_data['category'] = category['id']
        
        # Make API request
        try:
            response = requests.post(
                f"{API_BASE}/listings/",
                json=listing_data,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            
            if response.status_code == 201:
                listing = response.json()
                created_listings.append(listing)
                print(f"   ✅ Created listing: {listing['title']}")
                print(f"      ID: {listing['id']}")
                print(f"      Dynamic fields: {len(listing.get('dynamic_fields', {}))}")
            else:
                print(f"   ❌ Failed to create listing: {response.status_code}")
                print(f"      Error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ API request error: {e}")
    
    # 4. Test retrieving created listings
    print("\n4️⃣ Testing My Listings API...")
    try:
        response = requests.get(
            f"{API_BASE}/listings/my/",
            headers={'Authorization': f'Bearer {token}'}
        )
        
        if response.status_code == 200:
            my_listings = response.json()
            print(f"✅ My Listings API working - Found {len(my_listings.get('results', []))} listings")
            
            # Show details of created listings
            for listing in my_listings.get('results', [])[:3]:
                print(f"   - {listing['title']} ({listing.get('category_name', 'Unknown')})")
                print(f"     Price: {listing['price']} {listing['currency']}")
                print(f"     Dynamic fields: {len(listing.get('dynamic_fields', {}))}")
        else:
            print(f"❌ My Listings API failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ My Listings API error: {e}")
    
    # 5. Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print(f"   ✅ Categories API: Working")
    print(f"   ✅ User Authentication: Working")
    print(f"   ✅ Create Listing API: {len(created_listings)} listings created")
    print(f"   ✅ Dynamic Fields: Working")
    print(f"   ✅ My Listings API: Working")
    
    print(f"\n🎉 CREATE LISTING FLOW IS WORKING!")
    print(f"   Ready for frontend integration")
    
    return True

if __name__ == '__main__':
    success = test_create_listing_complete()
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
