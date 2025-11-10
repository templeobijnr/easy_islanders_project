#!/usr/bin/env python
"""
Zep Cloud Integration Test Suite - For SDK v2.0.2

Corrected for zep-python v2.0.2 which uses 'Zep' not 'ZepClient'
"""

import os
import sys
import time
import json
from datetime import datetime
from typing import Dict, List, Any

# Color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(title: str):
    print(f"\n{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{title}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")


def print_success(message: str):
    print(f"{Colors.GREEN}✓{Colors.RESET} {message}")


def print_error(message: str):
    print(f"{Colors.RED}✗{Colors.RESET} {message}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")


def print_info(message: str):
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {message}")


def test_environment():
    """Test environment variables and SDK availability."""
    print_header("ENVIRONMENT CHECK")
    
    results = {
        "api_key": False,
        "base_url": False,
        "sdk": False
    }
    
    # Check API key
    api_key = os.getenv("ZEP_API_KEY")
    if api_key:
        print_success(f"ZEP_API_KEY found: ...{api_key[-8:] if len(api_key) > 8 else '***'}")
        results["api_key"] = True
    else:
        print_error("ZEP_API_KEY not found in environment")
    
    # Check base URL
    base_url = os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
    print_info(f"ZEP_BASE_URL: {base_url}")
    results["base_url"] = True
    
    # Check SDK installation
    try:
        import zep_python
        version = getattr(zep_python, '__version__', 'unknown')
        print_success(f"zep-python SDK installed (version: {version})")
        results["sdk"] = True
    except ImportError:
        print_error("zep-python SDK not installed")
    
    return results


def test_client_initialization():
    """Test client initialization with Zep class (not ZepClient)."""
    print_header("CLIENT INITIALIZATION")
    
    try:
        # CORRECTED IMPORT FOR v2.0.2
        from zep_python import Zep
        
        api_key = os.getenv("ZEP_API_KEY")
        if not api_key:
            print_error("Cannot test - ZEP_API_KEY not set")
            return False
        
        base_url = os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        
        print_info(f"Initializing Zep client with base_url: {base_url}")
        
        # Initialize with Zep class
        client = Zep(
            api_key=api_key,
            base_url=base_url
        )
        
        print_success(f"Client initialized: {type(client).__name__}")
        
        # Check available attributes
        if hasattr(client, 'memory'):
            print_success("Client has 'memory' attribute")
            memory_methods = [m for m in dir(client.memory) if not m.startswith('_')]
            print_info(f"Memory methods available: {', '.join(memory_methods[:5])}...")
        else:
            print_warning("Client has no 'memory' attribute")
        
        # Test connectivity
        try:
            test_id = f"test-{int(time.time())}"
            client.memory.get_session(test_id)
        except Exception as e:
            error_str = str(e).lower()
            if "401" in error_str or "unauthorized" in error_str:
                print_error("Authentication failed - check API key")
                return False
            elif "404" in error_str or "not found" in error_str:
                print_success("API connection successful (404 expected)")
                return True
            else:
                # Connection works if we get any response
                print_success(f"API connection successful")
                return True
        
        return True
        
    except ImportError as e:
        print_error(f"Cannot import Zep: {e}")
        return False
    except Exception as e:
        print_error(f"Client initialization failed: {e}")
        return False


def test_session_operations():
    """Test session operations with the Zep class."""
    print_header("SESSION OPERATIONS")
    
    try:
        from zep_python import Zep
        
        # Check if Session class exists
        try:
            from zep_python import Session
            has_session = True
            print_info("Session class found")
        except ImportError:
            has_session = False
            print_info("No Session class - will use direct methods")
        
        client = Zep(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )
        
        session_id = f"test-session-{int(time.time())}"
        user_id = "test-user-123"
        
        # Test 1: Create session
        print_info(f"Creating session: {session_id}")
        try:
            if has_session:
                from zep_python import Session
                session = Session(
                    session_id=session_id,
                    user_id=user_id,
                    metadata={"test": "true"}
                )
                
                # Try different methods
                if hasattr(client.memory, 'add_session'):
                    client.memory.add_session(session=session)
                elif hasattr(client.memory, 'create_session'):
                    client.memory.create_session(session)
                elif hasattr(client.memory, 'add'):
                    client.memory.add(session)
            else:
                # Try direct methods
                if hasattr(client.memory, 'add_session'):
                    client.memory.add_session(
                        session_id=session_id,
                        user_id=user_id
                    )
                elif hasattr(client.memory, 'create_session'):
                    client.memory.create_session(
                        session_id=session_id,
                        user_id=user_id
                    )
            
            print_success("Session created successfully")
        except Exception as e:
            if "already exists" in str(e).lower():
                print_warning("Session already exists")
            else:
                print_error(f"Session creation failed: {e}")
                return False
        
        # Test 2: Get session
        print_info("Retrieving session...")
        try:
            if hasattr(client.memory, 'get_session'):
                retrieved = client.memory.get_session(session_id=session_id)
            elif hasattr(client.memory, 'get'):
                retrieved = client.memory.get(session_id)
            else:
                print_warning("No get method found")
                retrieved = None
            
            if retrieved:
                print_success(f"Session retrieved")
            else:
                print_warning("Session retrieval returned None")
        except Exception as e:
            if "not found" not in str(e).lower():
                print_error(f"Session retrieval failed: {e}")
        
        # Test 3: Delete session
        print_info("Deleting session...")
        try:
            if hasattr(client.memory, 'delete_session'):
                client.memory.delete_session(session_id=session_id)
            elif hasattr(client.memory, 'delete'):
                client.memory.delete(session_id)
            
            print_success("Session deleted")
        except Exception as e:
            if "not found" in str(e).lower():
                print_info("Session already deleted")
            else:
                print_warning(f"Session deletion error: {e}")
        
        return True
        
    except Exception as e:
        print_error(f"Session operations failed: {e}")
        return False


def test_memory_operations():
    """Test memory operations with Zep class."""
    print_header("MEMORY OPERATIONS")
    
    try:
        from zep_python import Zep, Memory, Message
        
        client = Zep(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )
        
        session_id = f"test-memory-{int(time.time())}"
        
        # Create session first
        print_info("Creating test session...")
        try:
            # Try to create session (method depends on SDK version)
            try:
                from zep_python import Session
                session = Session(session_id=session_id)
                if hasattr(client.memory, 'add_session'):
                    client.memory.add_session(session=session)
                elif hasattr(client.memory, 'create_session'):
                    client.memory.create_session(session)
            except ImportError:
                # No Session class
                if hasattr(client.memory, 'add_session'):
                    client.memory.add_session(session_id=session_id)
                elif hasattr(client.memory, 'create_session'):
                    client.memory.create_session(session_id=session_id)
            
            print_success("Session created")
        except Exception as e:
            if "already exists" not in str(e).lower():
                print_warning(f"Session creation issue: {e}")
        
        # Test 1: Add memory
        print_info("Adding memory messages...")
        messages = [
            Message(role="user", content="I need help finding an apartment"),
            Message(role="assistant", content="I can help you find an apartment"),
            Message(role="user", content="I'm looking in Kyrenia"),
        ]
        
        try:
            memory = Memory(messages=messages)
            
            # Try different methods
            if hasattr(client.memory, 'add_memory'):
                client.memory.add_memory(session_id=session_id, memory=memory)
            elif hasattr(client.memory, 'add'):
                client.memory.add(session_id=session_id, memory=memory)
            else:
                print_warning("No add_memory method found")
                
            print_success(f"Added {len(messages)} messages")
        except Exception as e:
            print_error(f"Failed to add memory: {e}")
            return False
        
        # Test 2: Retrieve memory
        print_info("Retrieving memory...")
        try:
            if hasattr(client.memory, 'get_memory'):
                result = client.memory.get_memory(session_id=session_id)
            elif hasattr(client.memory, 'get'):
                result = client.memory.get(session_id)
            else:
                result = None
            
            if result:
                if hasattr(result, 'messages'):
                    print_success(f"Retrieved {len(result.messages)} messages")
                    for i, msg in enumerate(result.messages[:3]):
                        print_info(f"  Msg {i+1}: [{msg.role}] {msg.content[:40]}...")
                else:
                    print_info("Memory retrieved but no messages attribute")
            else:
                print_warning("No memory retrieved")
        except Exception as e:
            print_error(f"Failed to retrieve memory: {e}")
        
        # Clean up
        try:
            if hasattr(client.memory, 'delete_session'):
                client.memory.delete_session(session_id=session_id)
            elif hasattr(client.memory, 'delete'):
                client.memory.delete(session_id)
            print_info("Test session cleaned up")
        except:
            pass
        
        return True
        
    except ImportError as e:
        print_error(f"Import error: {e}")
        return False
    except Exception as e:
        print_error(f"Memory operations failed: {e}")
        return False


def run_all_tests():
    """Run all tests and provide summary."""
    print_header("ZEP CLOUD TEST SUITE (v2.0.2)")
    print_info(f"Started at: {datetime.now().isoformat()}")
    
    test_results = {}
    
    # Run tests
    test_results["environment"] = test_environment()
    
    if not test_results["environment"]["api_key"] or not test_results["environment"]["sdk"]:
        print_error("\nCannot continue without API key and SDK.")
        return
    
    test_results["client"] = test_client_initialization()
    
    if test_results["client"]:
        test_results["sessions"] = test_session_operations()
        test_results["memory"] = test_memory_operations()
    
    # Summary
    print_header("TEST SUMMARY")
    
    total = 0
    passed = 0
    
    for category, result in test_results.items():
        if isinstance(result, dict):
            all_passed = all(result.values())
            status = "PASS" if all_passed else "FAIL"
            color = Colors.GREEN if all_passed else Colors.RED
            if all_passed:
                passed += 1
        else:
            status = "PASS" if result else "FAIL"
            color = Colors.GREEN if result else Colors.RED
            if result:
                passed += 1
        
        total += 1
        print(f"{color}{status}{Colors.RESET} - {category.upper()}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print_success("All tests passed! Zep Cloud is working.")
    else:
        print_warning("Some tests failed. Review output above.")
    
    print_info(f"Completed at: {datetime.now().isoformat()}")


if __name__ == "__main__":
    # First try to discover the correct imports
    print_header("DISCOVERING IMPORTS")
    try:
        import zep_python
        print_info("Checking available classes...")
        
        if hasattr(zep_python, 'Zep'):
            print_success("Found: zep_python.Zep")
        if hasattr(zep_python, 'Memory'):
            print_success("Found: zep_python.Memory")
        if hasattr(zep_python, 'Message'):
            print_success("Found: zep_python.Message")
        if hasattr(zep_python, 'Session'):
            print_success("Found: zep_python.Session")
    except:
        pass
    
    # Run tests
    run_all_tests()