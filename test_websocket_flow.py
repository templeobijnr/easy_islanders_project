#!/usr/bin/env python3
"""
Test script to verify WebSocket + Celery + Redis integration.
This script simulates the complete flow:
1. Create a message
2. Enqueue Celery task
3. Task broadcasts via channel layer
4. Check if message was broadcast
"""

import os
import sys
import django
import asyncio
from asgiref.sync import async_to_sync

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings')
django.setup()

from django.contrib.auth import get_user_model
from assistant.models import Message, ConversationThread
from assistant.tasks import process_chat_message
from channels.layers import get_channel_layer

User = get_user_model()

def test_basic_channel_layer():
    """Test if we can send a message through the channel layer"""
    print("=" * 60)
    print("TEST 1: Basic Channel Layer Test")
    print("=" * 60)

    channel_layer = get_channel_layer()
    print(f"✓ Channel layer: {channel_layer}")
    print(f"✓ Config: {channel_layer.hosts if hasattr(channel_layer, 'hosts') else 'N/A'}")

    # Test sending a message
    test_group = "test_group_123"
    test_message = {
        "type": "chat_message",
        "event": "test",
        "message": "Hello from test",
    }

    try:
        async_to_sync(channel_layer.group_send)(test_group, test_message)
        print(f"✓ Successfully sent test message to group: {test_group}")
        return True
    except Exception as e:
        print(f"✗ Failed to send message: {e}")
        return False

def test_celery_task():
    """Test if Celery task can be enqueued and processes correctly"""
    print("\n" + "=" * 60)
    print("TEST 2: Celery Task Enqueue Test")
    print("=" * 60)

    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_ws_user',
        defaults={'email': 'test_ws@example.com'}
    )
    print(f"✓ Test user: {user.username} ({'created' if created else 'existing'})")

    # Get or create active thread
    thread, created = ConversationThread.get_or_create_active(user)
    print(f"✓ Thread: {thread.thread_id} ({'created' if created else 'existing'})")

    # Create a test message
    msg = Message.objects.create(
        type='user',
        conversation_id=str(thread.thread_id),
        content='Test WebSocket flow',
        sender=user
    )
    print(f"✓ Message created: {msg.id}")

    # Enqueue the task
    print("\n  Enqueueing Celery task...")
    try:
        result = process_chat_message.delay(
            str(msg.id),
            str(thread.thread_id),
            'test-client-123'
        )
        print(f"✓ Task enqueued: {result.id}")
        print(f"  Initial state: {result.state}")

        # Wait a bit and check status
        print("\n  Waiting 5 seconds for task to process...")
        import time
        time.sleep(5)

        print(f"  Final state: {result.state}")
        if result.state == 'SUCCESS':
            print(f"  Result: {result.result}")
        elif result.state == 'FAILURE':
            print(f"  Error: {result.traceback}")

        return result.state == 'SUCCESS'
    except Exception as e:
        print(f"✗ Failed to enqueue task: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_message_creation():
    """Check if assistant messages are being created"""
    print("\n" + "=" * 60)
    print("TEST 3: Check Assistant Messages")
    print("=" * 60)

    # Get the last few messages
    messages = Message.objects.filter(type='assistant').order_by('-created_at')[:5]
    print(f"✓ Found {messages.count()} recent assistant messages:")
    for msg in messages:
        print(f"  - [{msg.created_at}] {msg.content[:50]}...")

    return messages.exists()

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("WebSocket + Celery + Redis Integration Test")
    print("=" * 60 + "\n")

    # Run tests
    test1_passed = test_basic_channel_layer()
    test2_passed = test_celery_task()
    test3_passed = test_message_creation()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"  Channel Layer:  {'✓ PASS' if test1_passed else '✗ FAIL'}")
    print(f"  Celery Task:    {'✓ PASS' if test2_passed else '✗ FAIL'}")
    print(f"  Message Created: {'✓ PASS' if test3_passed else '✗ FAIL'}")
    print("=" * 60 + "\n")

    if test1_passed and test2_passed and test3_passed:
        print("✓ All tests passed! WebSocket integration should be working.")
        print("\nNext steps:")
        print("  1. Ensure frontend is connected to WebSocket")
        print("  2. Check browser console for WebSocket connection")
        print("  3. Verify thread_id matches between frontend and backend")
    else:
        print("✗ Some tests failed. Check the output above for details.")
        sys.exit(1)
