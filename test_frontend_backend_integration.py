#!/usr/bin/env python3
"""
Test frontend-backend integration for Create Listing flow
Tests that the frontend can properly connect to and use the backend APIs
"""

import requests
import json
import time

def test_frontend_backend_integration():
    """Test that frontend can connect to backend APIs"""
    print("🔗 TESTING FRONTEND-BACKEND INTEGRATION")
    print("=" * 60)
    
    # API endpoints to test
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"
    
    tests = [
        {
            'name': 'Backend Health Check',
            'url': f'{backend_url}/api/categories/',
            'method': 'GET',
            'expected_status': 200
        },
        {
            'name': 'Backend Categories API',
            'url': f'{backend_url}/api/categories/',
            'method': 'GET',
            'expected_status': 200,
            'validate_json': True
        },
        {
            'name': 'Backend Listings API',
            'url': f'{backend_url}/api/listings/',
            'method': 'GET',
            'expected_status': 200
        },
        {
            'name': 'Frontend Accessibility',
            'url': frontend_url,
            'method': 'GET',
            'expected_status': 200
        }
    ]
    
    results = []
    
    for test in tests:
        print(f"\n🧪 Testing: {test['name']}")
        
        try:
            if test['method'] == 'GET':
                response = requests.get(test['url'], timeout=10)
            
            if response.status_code == test['expected_status']:
                print(f"✅ {test['name']} - Status: {response.status_code}")
                
                # Additional validation for JSON responses
                if test.get('validate_json'):
                    try:
                        data = response.json()
                        if 'categories' in data:
                            print(f"   Found {len(data['categories'])} categories")
                            # Show sample categories
                            for cat in data['categories'][:3]:
                                fields_count = len(cat.get('schema', {}).get('fields', []))
                                print(f"   - {cat['name']}: {fields_count} dynamic fields")
                    except json.JSONDecodeError:
                        print(f"   ⚠️  Response is not valid JSON")
                
                results.append(True)
            else:
                print(f"❌ {test['name']} - Expected {test['expected_status']}, got {response.status_code}")
                results.append(False)
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {test['name']} - Connection refused")
            results.append(False)
        except requests.exceptions.Timeout:
            print(f"❌ {test['name']} - Request timeout")
            results.append(False)
        except Exception as e:
            print(f"❌ {test['name']} - Error: {e}")
            results.append(False)
    
    # Test CORS headers
    print(f"\n🌐 Testing CORS Headers...")
    try:
        response = requests.options(f'{backend_url}/api/categories/')
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"   CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"   ✅ {header}: {value}")
            else:
                print(f"   ⚠️  {header}: Not set")
                
    except Exception as e:
        print(f"   ❌ CORS test failed: {e}")
    
    # Summary
    print(f"\n" + "=" * 60)
    print("📊 INTEGRATION TEST SUMMARY")
    
    passed = sum(results)
    total = len(results)
    
    print(f"   Tests passed: {passed}/{total}")
    
    if passed == total:
        print(f"\n🎉 FRONTEND-BACKEND INTEGRATION IS WORKING!")
        print(f"   ✅ Backend APIs are accessible")
        print(f"   ✅ Categories API returns proper data")
        print(f"   ✅ Frontend is running")
        print(f"   ✅ Ready for end-to-end testing")
        return True
    else:
        print(f"\n❌ Some integration tests failed")
        print(f"   Check the errors above")
        return False

def test_api_response_format():
    """Test that API responses match frontend expectations"""
    print(f"\n🔍 TESTING API RESPONSE FORMATS")
    print("-" * 40)
    
    try:
        # Test categories API format
        response = requests.get('http://localhost:8000/api/categories/')
        data = response.json()
        
        required_keys = ['categories', 'count']
        for key in required_keys:
            if key not in data:
                print(f"❌ Missing required key: {key}")
                return False
        
        print("✅ Categories API has correct format")
        
        # Check first category structure
        if data['categories']:
            cat = data['categories'][0]
            required_cat_keys = ['id', 'name', 'slug', 'icon', 'color', 'description', 'schema', 'is_bookable', 'is_active', 'subcategories']
            
            for key in required_cat_keys:
                if key not in cat:
                    print(f"❌ Category missing key: {key}")
                    return False
            
            print("✅ Category objects have correct structure")
            
            # Check schema structure
            if 'schema' in cat and 'fields' in cat['schema']:
                fields = cat['schema']['fields']
                if fields:
                    field = fields[0]
                    required_field_keys = ['name', 'type', 'label']
                    
                    for key in required_field_keys:
                        if key not in field:
                            print(f"❌ Schema field missing key: {key}")
                            return False
                    
                    print("✅ Schema fields have correct structure")
        
        print("✅ All API response formats are correct")
        return True
        
    except Exception as e:
        print(f"❌ API format test failed: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Starting Frontend-Backend Integration Tests...")
    print("Make sure both frontend (port 3000) and backend (port 8000) are running\n")
    
    # Wait a moment for services to be ready
    time.sleep(2)
    
    # Run integration tests
    integration_success = test_frontend_backend_integration()
    format_success = test_api_response_format()
    
    if integration_success and format_success:
        print(f"\n🎉 ALL INTEGRATION TESTS PASSED!")
        print(f"   Frontend and backend are properly connected")
        print(f"   Ready for CreateListing flow testing")
    else:
        print(f"\n❌ Some integration tests failed")
        print(f"   Please check the errors above")
