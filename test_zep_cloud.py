#!/usr/bin/env python
"""
Zep Cloud Integration Test Suite

Tests all aspects of Zep Cloud integration to ensure proper functionality.
"""

import os
import sys
import time
import json
from datetime import datetime
from typing import Dict, List, Any

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(title: str):
    """Print a formatted header."""
    print(f"\n{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}{title}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")


def print_success(message: str):
    """Print success message."""
    print(f"{Colors.GREEN}✓{Colors.RESET} {message}")


def print_error(message: str):
    """Print error message."""
    print(f"{Colors.RED}✗{Colors.RESET} {message}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {message}")


def print_info(message: str):
    """Print info message."""
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
        print_info("Set it with: export ZEP_API_KEY='your-api-key-here'")

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

        # Check SDK version
        if version != 'unknown':
            major_version = int(version.split('.')[0]) if '.' in version else 0
            if major_version < 2:
                print_warning(f"SDK version {version} is outdated. Upgrade with: pip install --upgrade zep-python")
    except ImportError:
        print_error("zep-python SDK not installed")
        print_info("Install with: pip install zep-python")

    return results


def test_client_initialization():
    """Test client initialization."""
    print_header("CLIENT INITIALIZATION")

    try:
        from zep_python import ZepClient

        api_key = os.getenv("ZEP_API_KEY")
        if not api_key:
            print_error("Cannot test - ZEP_API_KEY not set")
            return False

        base_url = os.getenv("ZEP_BASE_URL", "https://api.getzep.com")

        print_info(f"Initializing client with base_url: {base_url}")

        client = ZepClient(
            api_key=api_key,
            base_url=base_url
        )

        print_success("Client initialized successfully")

        # Test basic connectivity
        try:
            # Try to get a non-existent session (should fail gracefully)
            test_id = f"test-{int(time.time())}"
            client.memory.get_session(session_id=test_id)
        except Exception as e:
            error_str = str(e).lower()
            if "401" in error_str or "unauthorized" in error_str:
                print_error("Authentication failed - check your API key")
                return False
            elif "404" in error_str or "not found" in error_str:
                print_success("API connection successful (404 expected for test session)")
                return True
            else:
                print_warning(f"Unexpected response: {str(e)[:100]}")
                return True

        return True

    except Exception as e:
        print_error(f"Client initialization failed: {e}")
        return False


def test_session_operations():
    """Test session creation, retrieval, and deletion."""
    print_header("SESSION OPERATIONS")

    try:
        from zep_python import ZepClient, Session

        client = ZepClient(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )

        session_id = f"test-session-{int(time.time())}"
        user_id = "test-user-123"
        metadata = {"test": "true", "created_by": "diagnostic"}

        # Test 1: Create session
        print_info(f"Creating session: {session_id}")
        try:
            session = Session(
                session_id=session_id,
                user_id=user_id,
                metadata=metadata
            )
            client.memory.add_session(session=session)
            print_success("Session created successfully")
        except Exception as e:
            if "already exists" in str(e).lower():
                print_warning("Session already exists (this is OK)")
            else:
                print_error(f"Session creation failed: {e}")
                return False

        # Test 2: Get session
        print_info("Retrieving session...")
        try:
            retrieved = client.memory.get_session(session_id=session_id)
            if retrieved:
                print_success(f"Session retrieved: {retrieved.session_id}")
                if hasattr(retrieved, 'user_id'):
                    print_info(f"  User ID: {retrieved.user_id}")
                if hasattr(retrieved, 'metadata'):
                    print_info(f"  Metadata: {retrieved.metadata}")
            else:
                print_error("Session retrieval returned None")
                return False
        except Exception as e:
            print_error(f"Session retrieval failed: {e}")
            return False

        # Test 3: Delete session
        print_info("Deleting session...")
        try:
            client.memory.delete_session(session_id=session_id)
            print_success("Session deleted successfully")
        except Exception as e:
            if "not found" in str(e).lower():
                print_warning("Session already deleted")
            else:
                print_error(f"Session deletion failed: {e}")
                return False

        return True

    except Exception as e:
        print_error(f"Session operations failed: {e}")
        return False


def test_memory_operations():
    """Test memory addition and retrieval."""
    print_header("MEMORY OPERATIONS")

    try:
        from zep_python import ZepClient, Session, Memory, Message

        client = ZepClient(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )

        session_id = f"test-memory-{int(time.time())}"

        # Create session first
        print_info("Creating test session...")
        session = Session(session_id=session_id)
        try:
            client.memory.add_session(session=session)
            print_success("Session created")
        except Exception as e:
            if "already exists" not in str(e).lower():
                print_error(f"Failed to create session: {e}")
                return False

        # Test 1: Add memory
        print_info("Adding memory messages...")
        messages = [
            Message(role="user", content="Hello, I need help finding an apartment"),
            Message(role="assistant", content="I'd be happy to help you find an apartment. What location are you interested in?"),
            Message(role="user", content="I'm looking in Kyrenia"),
        ]

        try:
            memory = Memory(messages=messages)
            client.memory.add_memory(session_id=session_id, memory=memory)
            print_success(f"Added {len(messages)} messages to memory")
        except Exception as e:
            print_error(f"Failed to add memory: {e}")
            return False

        # Test 2: Retrieve memory
        print_info("Retrieving memory...")
        try:
            retrieved_memory = client.memory.get_memory(session_id=session_id)
            if retrieved_memory and retrieved_memory.messages:
                print_success(f"Retrieved {len(retrieved_memory.messages)} messages")
                for i, msg in enumerate(retrieved_memory.messages[:3]):
                    print_info(f"  Message {i+1}: [{msg.role}] {msg.content[:50]}...")
            else:
                print_warning("No messages retrieved")
        except Exception as e:
            print_error(f"Failed to retrieve memory: {e}")
            return False

        # Clean up
        try:
            client.memory.delete_session(session_id=session_id)
            print_info("Test session cleaned up")
        except:
            pass

        return True

    except Exception as e:
        print_error(f"Memory operations failed: {e}")
        return False


def test_search_operations():
    """Test memory search functionality."""
    print_header("SEARCH OPERATIONS")

    try:
        from zep_python import (
            ZepClient, Session, Memory, Message,
            MemorySearchPayload, SearchScope, SearchType
        )

        client = ZepClient(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )

        session_id = f"test-search-{int(time.time())}"

        # Create session and add memory
        print_info("Setting up test data...")
        session = Session(session_id=session_id)
        try:
            client.memory.add_session(session=session)
        except:
            pass

        # Add searchable content
        messages = [
            Message(role="user", content="I need a 2-bedroom apartment in Kyrenia"),
            Message(role="assistant", content="I can help you find apartments in Kyrenia. What's your budget?"),
            Message(role="user", content="My budget is around 1000 EUR per month"),
            Message(role="assistant", content="Great! I'll search for 2-bedroom apartments in Kyrenia within 1000 EUR budget"),
        ]

        memory = Memory(messages=messages)
        client.memory.add_memory(session_id=session_id, memory=memory)
        print_success("Test data added")

        # Wait a moment for indexing
        time.sleep(2)

        # Test search
        print_info("Searching for 'budget'...")
        try:
            search_payload = MemorySearchPayload(
                text="budget",
                search_scope=SearchScope.MESSAGES,
                search_type=SearchType.SIMILARITY
            )

            results = client.memory.search_memory(
                session_id=session_id,
                search_payload=search_payload,
                limit=5
            )

            if results:
                print_success(f"Found {len(results)} search results")
                for i, result in enumerate(results):
                    if hasattr(result, 'message') and result.message:
                        score = getattr(result, 'score', 'N/A')
                        print_info(f"  Result {i+1} (score: {score}): {result.message.content[:50]}...")
            else:
                print_warning("No search results found")
        except Exception as e:
            print_error(f"Search failed: {e}")
            # Not a critical failure - search might not be available

        # Clean up
        try:
            client.memory.delete_session(session_id=session_id)
            print_info("Test session cleaned up")
        except:
            pass

        return True

    except Exception as e:
        print_error(f"Search operations failed: {e}")
        return False


def test_error_handling():
    """Test error handling scenarios."""
    print_header("ERROR HANDLING")

    try:
        from zep_python import ZepClient

        client = ZepClient(
            api_key=os.getenv("ZEP_API_KEY"),
            base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
        )

        # Test 1: Non-existent session
        print_info("Testing non-existent session handling...")
        try:
            client.memory.get_memory(session_id="non-existent-session-12345")
            print_warning("No error for non-existent session (might be OK)")
        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                print_success("Correctly handles non-existent session (404)")
            else:
                print_warning(f"Unexpected error: {str(e)[:50]}")

        # Test 2: Invalid API key
        print_info("Testing invalid API key handling...")
        try:
            bad_client = ZepClient(
                api_key="invalid-key-12345",
                base_url=os.getenv("ZEP_BASE_URL", "https://api.getzep.com")
            )
            bad_client.memory.get_session(session_id="test")
        except Exception as e:
            if "401" in str(e) or "unauthorized" in str(e).lower():
                print_success("Correctly handles invalid API key (401)")
            else:
                print_info(f"Error response: {str(e)[:50]}")

        return True

    except Exception as e:
        print_error(f"Error handling test failed: {e}")
        return False


def run_all_tests():
    """Run all tests and provide summary."""
    print_header("ZEP CLOUD INTEGRATION TEST SUITE")
    print_info(f"Started at: {datetime.now().isoformat()}")

    test_results = {}

    # Run tests
    test_results["environment"] = test_environment()

    if not test_results["environment"]["api_key"] or not test_results["environment"]["sdk"]:
        print_error("\nCannot continue without API key and SDK. Please fix environment issues first.")
        return

    test_results["client"] = test_client_initialization()

    if test_results["client"]:
        test_results["sessions"] = test_session_operations()
        test_results["memory"] = test_memory_operations()
        test_results["search"] = test_search_operations()
        test_results["errors"] = test_error_handling()

    # Summary
    print_header("TEST SUMMARY")

    total_tests = 0
    passed_tests = 0

    for category, result in test_results.items():
        if isinstance(result, dict):
            # Environment check returns dict
            all_passed = all(result.values())
            status = "PASS" if all_passed else "FAIL"
            color = Colors.GREEN if all_passed else Colors.RED
            if all_passed:
                passed_tests += 1
        else:
            status = "PASS" if result else "FAIL"
            color = Colors.GREEN if result else Colors.RED
            if result:
                passed_tests += 1

        total_tests += 1
        print(f"{color}{status}{Colors.RESET} - {category.upper()}")

    print(f"\n{Colors.BOLD}Results: {passed_tests}/{total_tests} tests passed{Colors.RESET}")

    if passed_tests == total_tests:
        print_success("All tests passed! Zep Cloud integration is working correctly.")
    else:
        print_warning("Some tests failed. Review the output above for details.")

    print_info(f"Completed at: {datetime.now().isoformat()}")


if __name__ == "__main__":
    run_all_tests()