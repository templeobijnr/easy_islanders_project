"""
Comprehensive tests for chat view and webhook endpoints.
Ensures they work correctly and don't return None.
"""

import json
import uuid
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client as DjangoClient
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from listings.models import Listing
from assistant.models import Conversation, Message, ContactIndex

User = get_user_model()


class ChatWithAssistantEndpointTests(TestCase):
    """Tests for chat_with_assistant endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_chat_with_valid_message_returns_response(self):
        """Test that chat endpoint returns a valid response for valid input."""
        with patch('assistant.views.run_enterprise_agent') as mock_agent:
            mock_agent.return_value = {
                'message': 'Hello! How can I help you?',
                'language': 'en',
                'recommendations': [],
                'conversation_id': str(uuid.uuid4())
            }

            response = self.client.post(
                '/api/chat/',
                {'message': 'Hello', 'language': 'en'},
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('response', data)
            self.assertIn('thread_id', data)
            self.assertIn('language', data)
            self.assertIn('recommendations', data)
            self.assertIsNotNone(data['response'])
            self.assertIsNotNone(data['thread_id'])

    def test_chat_with_empty_message_returns_error(self):
        """Test that empty message returns 400 error."""
        response = self.client.post(
            '/api/chat/',
            {'message': '', 'language': 'en'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('message', data)
        self.assertIsNotNone(data['message'])

    def test_chat_with_none_message_returns_error(self):
        """Test that None message returns 400 error."""
        response = self.client.post(
            '/api/chat/',
            {'message': None, 'language': 'en'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('message', data)
        self.assertIsNotNone(data['message'])

    def test_chat_with_guardrail_blocked_content(self):
        """Test that guardrail-blocked content returns appropriate response."""
        with patch('assistant.views.run_enterprise_guardrails') as mock_guardrail:
            mock_guardrail.return_value = MagicMock(passed=False, reason='inappropriate content')

            response = self.client.post(
                '/api/chat/',
                {'message': 'inappropriate content', 'language': 'en'},
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('message', data)
            self.assertIsNotNone(data['message'])
            self.assertIn('reason', data)

    def test_chat_with_agent_failure_returns_fallback(self):
        """Test that agent failure returns fallback response."""
        with patch('assistant.views.run_enterprise_agent') as mock_agent:
            mock_agent.side_effect = Exception('Agent failed')

            response = self.client.post(
                '/api/chat/',
                {'message': 'Hello', 'language': 'en'},
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('message', data)
            self.assertIsNotNone(data['message'])
            self.assertIn('thread_id', data)
            self.assertIsNotNone(data['thread_id'])

    def test_chat_with_supervisor_agent_enabled(self):
        """Test chat with supervisor agent enabled."""
        with patch('assistant.views.run_supervisor_agent') as mock_supervisor, \
             patch('django.conf.settings.ENABLE_SUPERVISOR_AGENT', True):
            mock_supervisor.return_value = {
                'message': 'Supervisor response',
                'language': 'en',
                'recommendations': [],
                'conversation_id': str(uuid.uuid4())
            }

            response = self.client.post(
                '/api/chat/',
                {'message': 'Hello', 'language': 'en'},
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertEqual(data['response'], 'Supervisor response')

    def test_chat_creates_thread_for_authenticated_user(self):
        """Test that chat creates thread for authenticated user."""
        with patch('assistant.views.run_enterprise_agent') as mock_agent:
            mock_agent.return_value = {
                'message': 'Response',
                'language': 'en',
                'recommendations': [],
                'conversation_id': str(uuid.uuid4())
            }

            response = self.client.post(
                '/api/chat/',
                {'message': 'Hello', 'language': 'en'},
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data['thread_id'])

            # Verify thread was created
            from assistant.models import ConversationThread
            thread = ConversationThread.objects.get(thread_id=data['thread_id'])
            self.assertEqual(thread.user, self.user)
            self.assertTrue(thread.is_active)

    def test_chat_with_provided_thread_id(self):
        """Test chat with provided thread_id."""
        # Create a thread first
        from assistant.models import ConversationThread
        existing_thread = ConversationThread.objects.create(
            user=self.user,
            thread_id=str(uuid.uuid4()),
            is_active=True
        )

        with patch('assistant.views.run_enterprise_agent') as mock_agent:
            mock_agent.return_value = {
                'message': 'Response',
                'language': 'en',
                'recommendations': [],
                'conversation_id': existing_thread.thread_id
            }

            response = self.client.post(
                '/api/chat/',
                {
                    'message': 'Hello',
                    'language': 'en',
                    'thread_id': existing_thread.thread_id
                },
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(data['thread_id'], existing_thread.thread_id)


class HandleChatEventEndpointTests(TestCase):
    """Tests for handle_chat_event endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        # Create a test listing
        self.listing = Listing.objects.create(
            source_id='test-123',
            source_name='Test Source',
            listing_type='property_rent',
            location='Kyrenia',
            price=1000,
            currency='EUR',
            structured_data={'contact_info': '+905551234567'}
        )

    def test_handle_request_photos_event(self):
        """Test request_photos event handling."""
        with patch('assistant.views.initiate_contact_with_seller') as mock_contact, \
             patch('assistant.views.check_for_new_images') as mock_check_images, \
             patch('assistant.brain.memory.save_assistant_turn') as mock_save_turn:

            mock_contact.return_value = {'ok': True}
            mock_check_images.return_value = {'image_count': 0}

            response = self.client.post(
                '/api/chat/events/',
                {
                    'event': 'request_photos',
                    'listing_id': self.listing.id,
                    'conversation_id': str(uuid.uuid4())
                },
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('response', data)
            self.assertIsNotNone(data['response'])

    def test_handle_contact_agent_event(self):
        """Test contact_agent event handling."""
        with patch('assistant.views.initiate_contact_with_seller') as mock_contact, \
             patch('assistant.brain.memory.save_assistant_turn') as mock_save_turn:

            mock_contact.return_value = {'ok': True}

            response = self.client.post(
                '/api/chat/events/',
                {
                    'event': 'contact_agent',
                    'listing_id': self.listing.id,
                    'conversation_id': str(uuid.uuid4())
                },
                format='json'
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('response', data)
            self.assertIsNotNone(data['response'])

    def test_handle_submit_contact_info_event(self):
        """Test submit_contact_info event handling."""
        response = self.client.post(
            '/api/chat/events/',
            {
                'event': 'submit_contact_info',
                'data': {
                    'category': 'property_search',
                    'location': 'Kyrenia',
                    'budget_amount': 1000,
                    'budget_currency': 'EUR',
                    'seller_ids': ['seller1', 'seller2']
                },
                'conversation_id': str(uuid.uuid4())
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('response', data)
        self.assertIsNotNone(data['response'])
        self.assertIn('request_id', data)

    def test_handle_unknown_event_returns_error(self):
        """Test unknown event returns error."""
        response = self.client.post(
            '/api/chat/events/',
            {
                'event': 'unknown_event',
                'conversation_id': str(uuid.uuid4())
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('error', data)
        self.assertIsNotNone(data['error'])

    def test_handle_event_without_event_type(self):
        """Test event without event type returns error."""
        response = self.client.post(
            '/api/chat/events/',
            {'conversation_id': str(uuid.uuid4())},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('error', data)
        self.assertIsNotNone(data['error'])

    def test_handle_request_photos_without_listing_id(self):
        """Test request_photos without listing_id returns error."""
        response = self.client.post(
            '/api/chat/events/',
            {
                'event': 'request_photos',
                'conversation_id': str(uuid.uuid4())
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('error', data)
        self.assertIsNotNone(data['error'])


class TwilioWebhookEndpointTests(TestCase):
    """Tests for twilio_webhook endpoint."""

    def setUp(self):
        self.client = DjangoClient()

        # Create test listing and contact
        self.listing = Listing.objects.create(
            source_id='test-webhook-123',
            source_name='Test Webhook Source',
            listing_type='property_rent',
            location='Kyrenia',
            price=1000,
            currency='EUR',
            structured_data={'contact_info': '+905551234567'}
        )

        # Create contact index entry
        self.contact = ContactIndex.objects.create(
            listing=self.listing,
            normalized_contact='+905551234567',
            conversation_id=str(uuid.uuid4())
        )

    def test_webhook_get_request_returns_health_check(self):
        """Test GET request to webhook returns health check."""
        response = self.client.get('/api/twilio/webhook/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsNotNone(data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'webhook verified')

    def test_webhook_text_message_processing(self):
        """Test processing text message via webhook."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True):
            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Yes, the property is available',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('success', data)
            self.assertTrue(data['success'])

    def test_webhook_media_message_processing(self):
        """Test processing media message via webhook."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True), \
             patch('assistant.views.MediaProcessor') as mock_processor_class, \
             patch('assistant.views._notify_new_images') as mock_notify, \
             patch('assistant.views._auto_trigger_image_display') as mock_auto_display:

            mock_processor = MagicMock()
            mock_processor.download_and_store_media.return_value = '/media/test.jpg'
            mock_processor_class.return_value = mock_processor

            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'MediaUrl0': 'https://api.twilio.com/test.jpg',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('success', data)
            self.assertTrue(data['success'])
            self.assertIn('media_urls', data)
            self.assertIsNotNone(data['media_urls'])

    def test_webhook_invalid_signature_returns_403(self):
        """Test invalid webhook signature returns 403."""
        with patch('django.conf.settings.DEBUG', False), \
             patch('assistant.views._validate_twilio_webhook', return_value=False):

            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Test message'
                }
            )

            self.assertEqual(response.status_code, 403)

    def test_webhook_unknown_contact_returns_error(self):
        """Test webhook from unknown contact returns error."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True):
            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905559876543',  # Unknown number
                    'Body': 'Test message'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('success', data)
            self.assertFalse(data['success'])

    def test_webhook_media_without_listing_returns_error(self):
        """Test media webhook without listing context returns error."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True):
            # Remove contact index entry
            self.contact.delete()

            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'MediaUrl0': 'https://api.twilio.com/test.jpg'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('success', data)
            self.assertFalse(data['success'])

    def test_webhook_availability_parsing_available(self):
        """Test availability parsing for 'available' response."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True):
            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Yes, the property is still available',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('availability', data)
            self.assertEqual(data['availability'], 'available')

    def test_webhook_availability_parsing_unavailable(self):
        """Test availability parsing for 'unavailable' response."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True):
            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Sorry, the property is no longer available',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertIsNotNone(data)
            self.assertIn('availability', data)
            self.assertEqual(data['availability'], 'unavailable')

    def test_webhook_auto_response_enabled(self):
        """Test auto-response triggering when enabled."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True), \
             patch('django.conf.settings.ENABLE_AUTO_RESPONSE', True), \
             patch('assistant.auto_response.trigger_auto_response') as mock_trigger:

            mock_trigger.delay.return_value = MagicMock(id='test-task-id')

            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Hello, any updates?',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            mock_trigger.delay.assert_called_once()

    def test_webhook_auto_response_disabled(self):
        """Test auto-response not triggered when disabled."""
        with patch('assistant.views._validate_twilio_webhook', return_value=True), \
             patch('django.conf.settings.ENABLE_AUTO_RESPONSE', False), \
             patch('assistant.auto_response.trigger_auto_response') as mock_trigger:

            response = self.client.post(
                '/api/twilio/webhook/',
                {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Hello, any updates?',
                    'MessageSid': 'test-sid-123'
                }
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            mock_trigger.delay.assert_not_called()


class HelperFunctionTests(TestCase):
    """Tests for helper functions used by endpoints."""

    def test_normalize_chat_result_with_valid_data(self):
        """Test _normalize_chat_result with valid data."""
        from assistant.views._helpers import _normalize_chat_result

        request = MagicMock()
        request.data = {'language': 'en'}

        result = _normalize_chat_result(request, 'test-thread', {
            'message': 'Hello',
            'recommendations': [{'type': 'test'}],
            'function_calls': [],
            'requires_phone': False
        })

        self.assertIsNotNone(result)
        self.assertEqual(result['response'], 'Hello')
        self.assertEqual(result['thread_id'], 'test-thread')
        self.assertEqual(result['language'], 'en')
        self.assertEqual(len(result['recommendations']), 1)

    def test_normalize_chat_result_with_none_result(self):
        """Test _normalize_chat_result with None result."""
        from assistant.views._helpers import _normalize_chat_result

        request = MagicMock()
        request.data = {'language': 'en'}

        result = _normalize_chat_result(request, 'test-thread', None)

        self.assertIsNotNone(result)
        self.assertEqual(result['response'], '')
        self.assertEqual(result['thread_id'], 'test-thread')
        self.assertEqual(result['language'], 'en')
        self.assertEqual(result['recommendations'], [])

    def test_safe_chat_response_always_returns_response(self):
        """Test _safe_chat_response always returns a Response object."""
        from assistant.views._helpers import _safe_chat_response

        request = MagicMock()
        response = _safe_chat_response(request, 'test-thread', {
            'message': 'Test message',
            'language': 'en',
            'recommendations': []
        })

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIsNotNone(data)
        self.assertIn('response', data)
        self.assertIsNotNone(data['response'])

    def test_safe_chat_response_with_none_result(self):
        """Test _safe_chat_response with None result."""
        from assistant.views._helpers import _safe_chat_response

        request = MagicMock()
        response = _safe_chat_response(request, 'test-thread', None)

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIsNotNone(data)
        self.assertIn('response', data)
        self.assertIsNotNone(data['response'])

    def test_resolve_thread_id_for_authenticated_user(self):
        """Test _resolve_thread_id for authenticated user."""
        from assistant.views._helpers import _resolve_thread_id
        from assistant.models import ConversationThread

        user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )

        thread_id = _resolve_thread_id(user, None)
        self.assertIsNotNone(thread_id)

        # Verify thread was created
        thread = ConversationThread.objects.get(thread_id=thread_id)
        self.assertEqual(thread.user, user)
        self.assertTrue(thread.is_active)

    def test_resolve_thread_id_for_anonymous_user(self):
        """Test _resolve_thread_id for anonymous user."""
        from assistant.views._helpers import _resolve_thread_id

        user = MagicMock()
        user.is_anonymous = True

        thread_id = _resolve_thread_id(user, None)
        self.assertIsNotNone(thread_id)

        # Verify conversation was created
        conversation = Conversation.objects.get(id=thread_id)
        self.assertIsNotNone(conversation)

    def test_ensure_conversation_creates_new(self):
        """Test _ensure_conversation creates new conversation."""
        from assistant.views._helpers import _ensure_conversation

        conversation_id = _ensure_conversation(None)
        self.assertIsNotNone(conversation_id)

        # Verify conversation exists
        conversation = Conversation.objects.get(id=conversation_id)
        self.assertIsNotNone(conversation)

    def test_ensure_conversation_returns_existing(self):
        """Test _ensure_conversation returns existing conversation."""
        from assistant.views._helpers import _ensure_conversation

        existing_id = str(uuid.uuid4())
        Conversation.objects.create(id=existing_id)

        conversation_id = _ensure_conversation(existing_id)
        self.assertEqual(conversation_id, existing_id)
