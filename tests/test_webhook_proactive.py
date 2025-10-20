"""
Test webhook proactive triggering
"""

from django.test import TestCase, Client
from django.utils import timezone
from unittest.mock import patch, MagicMock
import json

from assistant.models import Conversation, Listing, ContactIndex, UserProfile


class WebhookProactiveTests(TestCase):
    """Test webhook proactive triggering"""
    
    def setUp(self):
        """Set up test data"""
        from django.core.cache import cache
        cache.clear()
        
        self.client = Client()
        
        # Create test listing
        self.listing = Listing.objects.create(
            source_name="test",
            source_id="test_123",
            location="Kyrenia",
            price=500.0,
            currency="GBP",
            has_image=True,
            image_urls=["http://example.com/image1.jpg", "http://example.com/image2.jpg"]
        )
        
        # Create conversation
        self.conv = Conversation.objects.create(conversation_id="test_conv_123")
        
        # Create contact index
        self.contact = ContactIndex.objects.create(
            listing=self.listing,
            conversation=self.conv,
            normalized_contact="+905551234567"
        )
        
    def test_webhook_triggers_proactive_on_media(self):
        """Test that webhook triggers proactive response when media is received"""
        from assistant.views import twilio_webhook
        from django.test import RequestFactory
        
        # Mock the media processor
        with patch('assistant.views.MediaProcessor') as mock_processor:
            mock_instance = MagicMock()
            mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
            mock_processor.return_value = mock_instance
            
            # Mock the proactive task
            with patch('assistant.tasks.trigger_proactive_agent_response') as mock_proactive:
                mock_proactive.delay.return_value = MagicMock()
                
                # Mock the Twilio signature validation
                with patch('assistant.views._validate_twilio_webhook', return_value=True):
                    # Create a mock request
                    factory = RequestFactory()
                    request = factory.post('/api/webhooks/twilio/', {
                        'From': 'whatsapp:+905551234567',
                        'Body': 'Here are the photos',
                        'MediaUrl0': 'http://example.com/image1.jpg',
                        'MediaUrl1': 'http://example.com/image2.jpg',
                        'MessageSid': 'test_message_123'
                    })
                    
                    # Call the webhook function directly
                    response = twilio_webhook(request)
                    
                    # Should succeed
                    self.assertEqual(response.status_code, 200)
                    
                    # Should have called proactive task
                    mock_proactive.delay.assert_called_once()
                    call_args = mock_proactive.delay.call_args
                    self.assertEqual(call_args[1]['listing_id'], self.listing.id)
                    self.assertEqual(call_args[1]['conversation_id'], self.conv.conversation_id)
                    self.assertEqual(call_args[1]['image_count'], 2)
                
    def test_webhook_creates_conversation_if_missing(self):
        """Test that webhook creates conversation if none exists"""
        from assistant.views import twilio_webhook
        from django.test import RequestFactory
        
        # Clear existing contacts and create a new one without conversation
        ContactIndex.objects.all().delete()
        ContactIndex.objects.create(
            listing=self.listing,
            conversation=None,
            normalized_contact="+905559876543"
        )
        
        with patch('assistant.views.MediaProcessor') as mock_processor:
            mock_instance = MagicMock()
            mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
            mock_processor.return_value = mock_instance
            
            with patch('assistant.tasks.trigger_proactive_agent_response') as mock_proactive:
                mock_proactive.delay.return_value = MagicMock()
                
                with patch('assistant.views._validate_twilio_webhook', return_value=True):
                    factory = RequestFactory()
                    request = factory.post('/api/webhooks/twilio/', {
                        'From': 'whatsapp:+905559876543',
                        'Body': 'Here are the photos',
                        'MediaUrl0': 'http://example.com/image1.jpg',
                        'MessageSid': 'test_message_123'
                    })
                    
                    response = twilio_webhook(request)
                    
                    # Should succeed
                    self.assertEqual(response.status_code, 200)
                    
                    # Should have called proactive task
                    mock_proactive.delay.assert_called_once()
                    call_args = mock_proactive.delay.call_args
                    # The conversation_id should be set (either existing or new)
                    self.assertIsNotNone(call_args[1]['conversation_id'])
                
    def test_webhook_respects_feature_flags(self):
        """Test that webhook respects feature flags"""
        from assistant.views import twilio_webhook
        from django.test import RequestFactory
        
        with patch('assistant.views.MediaProcessor') as mock_processor:
            mock_instance = MagicMock()
            mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
            mock_processor.return_value = mock_instance
            
            with patch('assistant.tasks.trigger_proactive_agent_response') as mock_proactive:
                mock_proactive.delay.return_value = MagicMock()
                
                # Disable proactive agent
                with patch('django.conf.settings.PROACTIVE_AGENT_ENABLED', False):
                    with patch('assistant.views._validate_twilio_webhook', return_value=True):
                        factory = RequestFactory()
                        request = factory.post('/api/webhooks/twilio/', {
                            'From': 'whatsapp:+905551234567',
                            'Body': 'Here are the photos',
                            'MediaUrl0': 'http://example.com/image1.jpg',
                            'MessageSid': 'test_message_123'
                        })
                        
                        response = twilio_webhook(request)
                        
                        # Should succeed but not call proactive task
                        self.assertEqual(response.status_code, 200)
                        mock_proactive.delay.assert_not_called()
                    
    def test_media_monitoring_task(self):
        """Test the media monitoring task"""
        from assistant.tasks import monitor_new_media_and_trigger_proactive
        
        # Update listing to be recent
        self.listing.last_seen_at = timezone.now()
        self.listing.save()
        
        # Run monitoring task
        result = monitor_new_media_and_trigger_proactive()
        
        # Should succeed
        self.assertTrue(result["success"])
        self.assertGreaterEqual(result["proactive_responses_triggered"], 0)
        self.assertGreaterEqual(result["listings_checked"], 0)
        
    def test_webhook_with_no_media(self):
        """Test webhook with no media doesn't trigger proactive"""
        from assistant.views import twilio_webhook
        from django.test import RequestFactory
        
        with patch('assistant.tasks.trigger_proactive_agent_response') as mock_proactive:
            with patch('assistant.views._validate_twilio_webhook', return_value=True):
                factory = RequestFactory()
                request = factory.post('/api/webhooks/twilio/', {
                    'From': 'whatsapp:+905551234567',
                    'Body': 'Just a text message',
                    'MessageSid': 'test_message_123'
                })
                
                response = twilio_webhook(request)
                
                # Should succeed but not call proactive task
                self.assertEqual(response.status_code, 200)
                mock_proactive.delay.assert_not_called()
