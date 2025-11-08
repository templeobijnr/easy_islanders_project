#!/usr/bin/env python
"""
Zep Integration Diagnostic Script

Tests various aspects of the Zep integration to identify configuration issues.
"""

import os
import sys
import json
import requests
from datetime import datetime


def test_zep_connection():
    """Test basic connectivity to Zep server."""
    results = []
    
    # Get configuration from environment
    zep_url = os.getenv("ZEP_URL", "http://localhost:8000")
    zep_key = os.getenv("ZEP_API_KEY", "test-api-key")
    
    print("=" * 60)
    print("ZEP INTEGRATION DIAGNOSTIC")
    print("=" * 60)
    print(f"ZEP_URL: {zep_url}")
    print(f"ZEP_API_KEY: {'*' * (len(zep_key) - 4) + zep_key[-4:] if len(zep_key) > 4 else '***'}")
    print()
    
    # Determine if cloud or OSS
    is_cloud = "cloud.getzep.com" in zep_url or "getzep.com" in zep_url
    print(f"Detected Type: {'Zep Cloud' if is_cloud else 'OSS/Local Zep'}")
    
    # Test different API versions
    api_versions = ["/api/v1", "/api/v2", "/v1", "/v2", ""]
    
    print("\n" + "=" * 60)
    print("TESTING API ENDPOINTS")
    print("=" * 60)
    
    for api_version in api_versions:
        test_url = f"{zep_url.rstrip('/')}{api_version}"
        
        # Try different header configurations
        header_configs = [
            {
                "name": "Bearer Auth",
                "headers": {
                    "Authorization": f"Bearer {zep_key}",
                    "Content-Type": "application/json",
                }
            },
            {
                "name": "X-API-Key",
                "headers": {
                    "X-API-Key": zep_key,
                    "Content-Type": "application/json",
                }
            },
            {
                "name": "Api-Key",
                "headers": {
                    "Api-Key": zep_key,
                    "Content-Type": "application/json",
                }
            }
        ]
        
        print(f"\nTesting API Version: {api_version if api_version else '(root)'}")
        print("-" * 40)
        
        for header_config in header_configs:
            try:
                # Try to get health or sessions endpoint
                for endpoint in ["/health", "/sessions", ""]:
                    full_url = f"{test_url}{endpoint}" if endpoint else test_url
                    
                    response = requests.get(
                        full_url,
                        headers=header_config["headers"],
                        timeout=5
                    )
                    
                    print(f"  {header_config['name']:12} -> {endpoint:10} : {response.status_code}", end=" ")
                    
                    if response.status_code in [200, 404]:
                        print("✓ (Connected)")
                        results.append({
                            "api_version": api_version,
                            "auth_type": header_config["name"],
                            "endpoint": endpoint,
                            "status": response.status_code,
                            "success": True,
                            "response_preview": response.text[:100] if response.text else ""
                        })
                        
                        # If we got a successful connection, test session creation
                        if response.status_code == 200 or (response.status_code == 404 and "sessions" in full_url):
                            test_session_operations(test_url, header_config["headers"], api_version)
                    elif response.status_code == 401:
                        print("✗ (Auth Failed)")
                    elif response.status_code == 403:
                        print("✗ (Forbidden)")
                    else:
                        print(f"? ({response.status_code})")
                        
            except requests.exceptions.ConnectionError:
                print(f"  {header_config['name']:12} -> Connection Failed")
            except requests.exceptions.Timeout:
                print(f"  {header_config['name']:12} -> Timeout")
            except Exception as e:
                print(f"  {header_config['name']:12} -> Error: {e}")
    
    return results


def test_session_operations(base_url, headers, api_version):
    """Test session creation and memory operations."""
    print(f"\n    Testing Session Operations with {api_version}:")
    test_session_id = f"test-session-{datetime.utcnow().isoformat()}"
    
    # Test different payload formats
    payload_formats = [
        {
            "name": "Cloud Format",
            "payload": {
                "SessionID": test_session_id,
                "UserID": "test-user",
                "Metadata": {"test": "diagnostic"}
            }
        },
        {
            "name": "OSS Format",
            "payload": {
                "session_id": test_session_id,
                "user_id": "test-user",
                "metadata": {"test": "diagnostic"}
            }
        },
        {
            "name": "Minimal",
            "payload": {
                "session_id": test_session_id
            }
        }
    ]
    
    for format_config in payload_formats:
        try:
            create_url = f"{base_url}/sessions"
            response = requests.post(
                create_url,
                json=format_config["payload"],
                headers=headers,
                timeout=5
            )
            
            print(f"      Create Session ({format_config['name']:12}): {response.status_code}", end=" ")
            
            if response.status_code in [200, 201, 409]:
                print("✓")
                
                # Try to add memory
                test_add_memory(base_url, headers, test_session_id)
                
                # Clean up
                requests.delete(
                    f"{base_url}/sessions/{test_session_id}",
                    headers=headers,
                    timeout=5
                )
                break
            else:
                print(f"✗ ({response.text[:50] if response.text else 'No response'})")
                
        except Exception as e:
            print(f"✗ (Error: {e})")


def test_add_memory(base_url, headers, session_id):
    """Test adding memory to a session."""
    # Test different memory payload formats
    memory_formats = [
        {
            "name": "Array Format",
            "payload": {
                "messages": [{
                    "role": "user",
                    "content": "Test message",
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }]
            }
        },
        {
            "name": "Single Format",
            "payload": {
                "role": "user",
                "content": "Test message"
            }
        }
    ]
    
    for format_config in memory_formats:
        try:
            memory_url = f"{base_url}/sessions/{session_id}/memory"
            response = requests.post(
                memory_url,
                json=format_config["payload"],
                headers=headers,
                timeout=5
            )
            
            print(f"      Add Memory ({format_config['name']:12}): {response.status_code}", end=" ")
            
            if response.status_code in [200, 201]:
                print("✓")
                return True
            else:
                print(f"✗")
                
        except Exception as e:
            print(f"✗ (Error: {e})")
    
    return False


def provide_recommendations(results):
    """Provide recommendations based on test results."""
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    
    if not results:
        print("❌ No successful connections found.")
        print("\nRecommended Actions:")
        print("1. Verify ZEP_URL is correct")
        print("2. Check if Zep server is running")
        print("3. Verify network connectivity to Zep server")
        print("4. Check firewall/security group settings")
        return
    
    # Find successful configuration
    successful = [r for r in results if r.get("success")]
    if successful:
        best = successful[0]
        print("✅ Working configuration found!")
        print(f"\nRecommended Settings:")
        print(f"  API Version: {best['api_version'] if best['api_version'] else '(root)'}")
        print(f"  Auth Type: {best['auth_type']}")
        print(f"\nUpdate your environment variables:")
        
        if "cloud.getzep.com" in os.getenv("ZEP_URL", ""):
            print("  # For Zep Cloud")
            print(f"  ZEP_URL={os.getenv('ZEP_URL')}")
            print(f"  ZEP_API_KEY=your-api-key-here")
        else:
            print("  # For OSS/Local Zep")
            print(f"  ZEP_URL=http://your-zep-server:port")
            print(f"  ZEP_API_KEY=your-api-key-here")


if __name__ == "__main__":
    results = test_zep_connection()
    provide_recommendations(results)
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)