"""
Tests for F.1: Thread State Management
Tests ConversationThread model and conversation endpoints
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from assistant.models import ConversationThread

User = get_user_model()


class ConversationThreadModelTest(TestCase):
    """Tests for ConversationThread model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_conversation_thread(self):
        """Test creating a new conversation thread"""
        thread = ConversationThread.objects.create(
            user=self.user,
            thread_id='test-uuid-123',
            is_active=True
        )
        self.assertEqual(thread.user, self.user)
        self.assertEqual(thread.thread_id, 'test-uuid-123')
        self.assertTrue(thread.is_active)

    def test_get_or_create_active_thread(self):
        """Test get_or_create_active creates new thread if none exists"""
        thread, created = ConversationThread.get_or_create_active(self.user)
        self.assertTrue(created)
        self.assertEqual(thread.user, self.user)
        self.assertTrue(thread.is_active)
        self.assertIsNotNone(thread.thread_id)

        # Second call should return same thread
        thread2, created2 = ConversationThread.get_or_create_active(self.user)
        self.assertFalse(created2)
        self.assertEqual(thread.id, thread2.id)

    def test_get_active_thread_id(self):
        """Test getting thread_id for active thread"""
        thread, _ = ConversationThread.get_or_create_active(self.user)
        thread_id = ConversationThread.get_active_thread_id(self.user)
        self.assertEqual(thread_id, thread.thread_id)

    def test_get_active_thread_id_no_thread(self):
        """Test get_active_thread_id returns None if no active thread"""
        thread_id = ConversationThread.get_active_thread_id(self.user)
        self.assertIsNone(thread_id)

    def test_unique_thread_id(self):
        """Test thread_id is unique"""
        thread1 = ConversationThread.objects.create(
            user=self.user,
            thread_id='unique-uuid-1',
            is_active=False
        )
        
        # Try to create thread with same thread_id
        with self.assertRaises(Exception):  # Should raise IntegrityError
            ConversationThread.objects.create(
                user=self.user,
                thread_id='unique-uuid-1',
                is_active=True
            )

    def test_unique_active_thread_per_user(self):
        """Test only one active thread per user constraint"""
        thread1, _ = ConversationThread.get_or_create_active(self.user)
        
        # Try to create another active thread
        with self.assertRaises(Exception):  # Should raise IntegrityError
            ConversationThread.objects.create(
                user=self.user,
                thread_id='another-uuid',
                is_active=True
            )


class ChatEndpointTest(TestCase):
    """Tests for chat endpoint with thread management"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_chat_creates_thread_on_first_message(self):
        """Test chat endpoint creates thread_id on first message"""
        response = self.client.post(
            '/api/chat/',
            {'message': 'Hello', 'language': 'en'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('thread_id', response.data)
        self.assertIsNotNone(response.data['thread_id'])

    def test_chat_returns_thread_id(self):
        """Test chat endpoint returns thread_id for caching"""
        response = self.client.post(
            '/api/chat/',
            {'message': 'Hello', 'language': 'en'},
            format='json'
        )
        
        thread_id = response.data.get('thread_id')
        self.assertIsNotNone(thread_id)
        
        # Verify thread was created in database
        thread = ConversationThread.objects.get(thread_id=thread_id)
        self.assertEqual(thread.user, self.user)
        self.assertTrue(thread.is_active)

    def test_chat_with_provided_thread_id(self):
        """Test chat accepts thread_id from request"""
        # Create initial thread
        thread, _ = ConversationThread.get_or_create_active(self.user)
        
        response = self.client.post(
            '/api/chat/',
            {
                'message': 'Hello again',
                'language': 'en',
                'thread_id': thread.thread_id
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['thread_id'], thread.thread_id)

    def test_chat_requires_authentication(self):
        """Test chat endpoint requires authentication"""
        self.client.force_authenticate(user=None)
        response = self.client.post(
            '/api/chat/',
            {'message': 'Hello', 'language': 'en'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ConversationEndpointsTest(TestCase):
    """Tests for conversation management endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_current_conversation_empty(self):
        """Test get_current_conversation when no thread exists"""
        response = self.client.get('/api/conversations/current/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)

    def test_get_current_conversation_with_thread(self):
        """Test get_current_conversation returns thread info"""
        thread, _ = ConversationThread.get_or_create_active(self.user)
        
        response = self.client.get('/api/conversations/current/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['thread_id'], thread.thread_id)
        self.assertIn('created_at', response.data)
        self.assertIn('message_count', response.data)

    def test_create_new_conversation(self):
        """Test creating a new conversation thread"""
        # Create initial thread
        thread1, _ = ConversationThread.get_or_create_active(self.user)
        
        response = self.client.post(
            '/api/conversations/',
            {},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('thread_id', response.data)
        self.assertNotEqual(response.data['thread_id'], thread1.thread_id)
        
        # Verify old thread is marked inactive
        thread1.refresh_from_db()
        self.assertFalse(thread1.is_active)
        
        # Verify new thread is active
        new_thread = ConversationThread.objects.get(thread_id=response.data['thread_id'])
        self.assertTrue(new_thread.is_active)

    def test_migrate_legacy_data(self):
        """Test legacy data migration endpoint"""
        response = self.client.post(
            '/api/migrate-legacy-data/',
            {
                'messages': [
                    {'role': 'user', 'content': 'Hello'},
                    {'role': 'assistant', 'content': 'Hi there'}
                ],
                'language': 'en',
                'theme': 'dark'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('thread_id', response.data)

    def test_endpoints_require_authentication(self):
        """Test conversation endpoints require authentication"""
        self.client.force_authenticate(user=None)
        
        # Test get_current_conversation
        response = self.client.get('/api/conversations/current/', format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test create_new_conversation
        response = self.client.post(
            '/api/conversations/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test migrate_legacy_data
        response = self.client.post(
            '/api/migrate-legacy-data/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@pytest.mark.asyncio
class ThreadCrossSyncTest(TestCase):
    """Tests for cross-device sync via thread management"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_cross_device_sync_same_user(self):
        """Test same user on different devices retrieves same thread"""
        # Device A: Create thread
        self.client.force_authenticate(user=self.user)
        response_a = self.client.post(
            '/api/chat/',
            {'message': 'Hello from Device A', 'language': 'en'},
            format='json'
        )
        thread_id_a = response_a.data['thread_id']
        
        # Simulate Device B: Same user, no cached thread_id
        # Fetch current conversation
        response_b = self.client.get('/api/conversations/current/', format='json')
        thread_id_b = response_b.data['thread_id']
        
        # Should be the same thread
        self.assertEqual(thread_id_a, thread_id_b)

    def test_different_users_different_threads(self):
        """Test different users get different threads"""
        user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        # User 1: Create thread
        self.client.force_authenticate(user=self.user)
        response1 = self.client.post(
            '/api/chat/',
            {'message': 'User 1 message', 'language': 'en'},
            format='json'
        )
        thread_id_1 = response1.data['thread_id']
        
        # User 2: Create thread
        self.client.force_authenticate(user=user2)
        response2 = self.client.post(
            '/api/chat/',
            {'message': 'User 2 message', 'language': 'en'},
            format='json'
        )
        thread_id_2 = response2.data['thread_id']
        
        # Threads should be different
