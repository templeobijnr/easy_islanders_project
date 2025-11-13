#!/usr/bin/env python3
"""
Test script for Create Listing API endpoints
"""
import os
import sys
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
sys.path.append('/Users/apple_trnc/Desktop/work/easy_islanders_project')
django.setup()

User = get_user_model()

def test_categories_api():
    """Test the categories API endpoint"""
    print("=== TESTING CATEGORIES API ===")
    
    client = Client()
    response = client.get('/api/categories/')
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        
        categories = data.get('categories', [])
        print(f"Categories count: {len(categories)}")
        
        if categories:
            # Show first category with schema
            first_cat = categories[0]
            print(f"\nFirst category: {first_cat['name']}")
            print(f"Slug: {first_cat['slug']}")
            print(f"Bookable: {first_cat['is_bookable']}")
            print(f"Subcategories: {len(first_cat.get('subcategories', []))}")
            
            if first_cat.get('schema', {}).get('fields'):
                print(f"Dynamic fields: {len(first_cat['schema']['fields'])}")
                for field in first_cat['schema']['fields'][:3]:  # Show first 3 fields
                    print(f"  - {field['label']} ({field['type']}) {'*' if field.get('required') else ''}")
            else:
                print("No dynamic fields defined")
                
        # Test a specific category with rich schema
        print("\n=== TESTING REAL ESTATE CATEGORY ===")
        real_estate = next((cat for cat in categories if cat['slug'] == 'real-estate'), None)
        if real_estate:
            print(f"Real Estate category found: {real_estate['name']}")
            print(f"Schema fields: {len(real_estate.get('schema', {}).get('fields', []))}")
            for field in real_estate.get('schema', {}).get('fields', [])[:5]:
                print(f"  - {field['label']} ({field['type']}) {'*' if field.get('required') else ''}")
        else:
            print("Real Estate category not found")
            
    else:
        print(f"Error: {response.content}")

def test_create_listing():
    """Test creating a listing"""
    print("\n=== TESTING CREATE LISTING ===")
    
    # Create a test business user
    try:
        user = User.objects.get(username='testbusiness')
    except User.DoesNotExist:
        user = User.objects.create_user(
            username='testbusiness',
            email='test@business.com',
            password='testpass123',
            user_type='business'
        )
        print(f"Created test user: {user.username}")
    
    client = Client()
    client.force_login(user)
    
    # Get categories first
    categories_response = client.get('/api/categories/')
    if categories_response.status_code != 200:
        print("Failed to get categories")
        return
        
    categories = categories_response.json()['categories']
    real_estate = next((cat for cat in categories if cat['slug'] == 'real-estate'), None)
    
    if not real_estate:
        print("Real estate category not found")
        return
        
    # Create a test listing
    listing_data = {
        'title': 'Test Apartment Listing',
        'description': 'A beautiful test apartment for rent',
        'category': real_estate['id'],
        'subcategory': real_estate['subcategories'][0]['id'] if real_estate['subcategories'] else None,
        'price': 1200.00,
        'currency': 'EUR',
        'location': 'Nicosia, Cyprus',
        'dynamic_fields': {
            'bedrooms': 2,
            'bathrooms': 1,
            'property_type': 'apartment',
            'furnished': True
        }
    }
    
    response = client.post('/api/listings/', data=json.dumps(listing_data), 
                          content_type='application/json')
    
    print(f"Create listing status: {response.status_code}")
    if response.status_code == 201:
        listing = response.json()
        print(f"Created listing: {listing.get('title')}")
        print(f"Listing ID: {listing.get('id')}")
        print(f"Dynamic fields saved: {listing.get('dynamic_fields')}")
    else:
        print(f"Error creating listing: {response.content}")

if __name__ == '__main__':
    test_categories_api()
    test_create_listing()
