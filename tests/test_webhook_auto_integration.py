"""
Test webhook auto-response integration
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from assistant.views import twilio_webhook
from django.test import RequestFactory


class WebhookAutoIntegrationTests(TestCase):
    """Test webhook auto-response integration"""
    
    def setUp(self):
        """Set up test data"""
        from assistant.models import Conversation, Listing, ContactIndex, UserProfile
        from django.core.cache import cache
        cache.clear()
        
        # Create test data
        self.listing = Listing.objects.create(
            source_name="test",
            source_id="test_123",
            location="Kyrenia",
            price=500.0,
            currency="GBP"
        )
        
        self.conv = Conversation.objects.create(conversation_id="test_conv_123")
        
        self.contact = ContactIndex.objects.create(
            listing=self.listing,
            conversation=self.conv,
            normalized_contact="+905551234567"
        )
        
        UserProfile.objects.create(user_id="test_conv_123", proactive_enabled=True)
    
    @patch('assistant.views.MediaProcessor')
    @patch('assistant.views._validate_twilio_webhook', return_value=True)
    @patch('assistant.auto_response.trigger_auto_response')
    def test_webhook_triggers_auto_response_with_photos(self, mock_auto_response, mock_validate, mock_processor):
        """Test that webhook triggers auto-response when photos are received"""
        # Mock media processor
        mock_instance = MagicMock()
        mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
        mock_processor.return_value = mock_instance
        
        # Mock auto-response task
        mock_task_result = MagicMock()
        mock_task_result.id = "test_task_123"
        mock_auto_response.delay.return_value = mock_task_result
        
        # Create webhook request
        factory = RequestFactory()
        request = factory.post('/api/webhooks/twilio/', {
            'From': 'whatsapp:+905551234567',
            'Body': 'Here are the photos',
            'MediaUrl0': 'http://example.com/image1.jpg',
            'MediaUrl1': 'http://example.com/image2.jpg',
            'MessageSid': 'test_message_123'
        })
        
        # Call webhook
        response = twilio_webhook(request)
        
        # Should succeed
        self.assertEqual(response.status_code, 200)
        
        # Should have called auto-response.delay()
        mock_auto_response.delay.assert_called_once()
        call_args = mock_auto_response.delay.call_args
        self.assertEqual(call_args[1]['listing_id'], self.listing.id)  # listing_id
        self.assertEqual(call_args[1]['conversation_id'], self.conv.conversation_id)  # conversation_id
        self.assertIn('MediaUrl0', call_args[1]['webhook_data'])  # webhook_data
    
    @patch('assistant.views._validate_twilio_webhook', return_value=True)
    @patch('assistant.auto_response.trigger_auto_response')
    def test_webhook_triggers_auto_response_with_text(self, mock_auto_response, mock_validate):
        """Test that webhook triggers auto-response when text is received"""
        # Mock auto-response task
        mock_task_result = MagicMock()
        mock_task_result.id = "test_task_123"
        mock_auto_response.delay.return_value = mock_task_result
        
        # Create webhook request
        factory = RequestFactory()
        request = factory.post('/api/webhooks/twilio/', {
            'From': 'whatsapp:+905551234567',
            'Body': 'Available next week',
            'MessageSid': 'test_message_123'
        })
        
        # Call webhook
        response = twilio_webhook(request)
        
        # Should succeed
        self.assertEqual(response.status_code, 200)
        
        # Should have called auto-response.delay()
        mock_auto_response.delay.assert_called_once()
        call_args = mock_auto_response.delay.call_args
        self.assertEqual(call_args[1]['listing_id'], self.listing.id)  # listing_id
        self.assertEqual(call_args[1]['conversation_id'], self.conv.conversation_id)  # conversation_id
        self.assertIn('Available next week', call_args[1]['webhook_data']['text'])  # webhook_data
    
    @patch('assistant.views._validate_twilio_webhook', return_value=True)
    @patch('assistant.auto_response.trigger_auto_response')
    def test_webhook_respects_auto_response_flag(self, mock_auto_response, mock_validate):
        """Test that webhook respects auto-response feature flag"""
        # Disable auto-response
        with patch('django.conf.settings.ENABLE_AUTO_RESPONSE', False):
            factory = RequestFactory()
            request = factory.post('/api/webhooks/twilio/', {
                'From': 'whatsapp:+905551234567',
                'Body': 'Available next week',
                'MessageSid': 'test_message_123'
            })
            
            # Call webhook
            response = twilio_webhook(request)
            
            # Should succeed but not call auto-response
            self.assertEqual(response.status_code, 200)
            mock_auto_response.delay.assert_not_called()
    
    @patch('assistant.views.MediaProcessor')
    @patch('assistant.views._validate_twilio_webhook', return_value=True)
    @patch('assistant.auto_response.trigger_auto_response')
    def test_webhook_handles_auto_response_errors(self, mock_auto_response, mock_validate, mock_processor):
        """Test that webhook handles auto-response errors gracefully"""
        # Mock media processor
        mock_instance = MagicMock()
        mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
        mock_processor.return_value = mock_instance
        
        # Mock auto-response task
        mock_task_result = MagicMock()
        mock_task_result.id = "test_task_123"
        mock_auto_response.delay.return_value = mock_task_result
        
        # Create webhook request
        factory = RequestFactory()
        request = factory.post('/api/webhooks/twilio/', {
            'From': 'whatsapp:+905551234567',
            'Body': 'Here are the photos',
            'MediaUrl0': 'http://example.com/image1.jpg',
            'MessageSid': 'test_message_123'
        })
        
        # Call webhook
        response = twilio_webhook(request)
        
        # Should still succeed (webhook doesn't fail if auto-response fails)
        self.assertEqual(response.status_code, 200)
        
        # Should have called auto-response.delay()
        mock_auto_response.delay.assert_called_once()
