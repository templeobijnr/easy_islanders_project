"""
End-to-end test for auto-response functionality
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from assistant.views import twilio_webhook
from assistant.auto_response import trigger_auto_response
from assistant.utils.notifications import get_notification
from django.test import RequestFactory


class E2EAutoResponseTests(TestCase):
    """End-to-end test for auto-response functionality"""
    
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
    @patch('assistant.brain.agent.process_turn')
    def test_complete_auto_response_flow_with_photos(self, mock_process_turn, mock_validate, mock_processor):
        """Test complete auto-response flow from webhook to frontend notification"""
        # Mock media processor
        mock_instance = MagicMock()
        mock_instance.download_and_store_media.return_value = "http://example.com/stored_image.jpg"
        mock_processor.return_value = mock_instance
        
        # Mock agent response
        mock_process_turn.return_value = {
            "success": True,
            "message": "Great! The agent sent 2 photos for your Kyrenia property. Here's what they look like: [gallery]. Any questions?",
            "recommendations": [
                {
                    "id": 1,
                    "title": "Property 1",
                    "price": "500 GBP",
                    "location": "Kyrenia",
                    "images": ["http://example.com/stored_image.jpg"],
                    "description": "Updated with new photos",
                    "features": [],
                    "verified_with_photos": True,
                    "auto_display": True
                }
            ]
        }
        
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
        
        # Wait for async task to complete (in testing, tasks run eagerly)
        # Check that notification was created
        notification = get_notification("test_conv_123")
        
        # Should have auto-update notification
        self.assertIsNotNone(notification)
        self.assertEqual(notification["type"], "auto_update")
        self.assertIn("agent sent", notification["data"]["message"].lower())
        self.assertTrue(notification["data"]["proactive"])
        self.assertEqual(notification["data"]["event_type"], "mixed_response")
        self.assertEqual(notification["data"]["listing_id"], self.listing.id)
        self.assertGreater(len(notification["data"]["recommendations"]), 0)
        
        # Should have called agent
        mock_process_turn.assert_called_once()
        call_args = mock_process_turn.call_args
        self.assertIn("internal_update", call_args[0][0])  # fake_input
        self.assertEqual(call_args[0][1], "test_conv_123")  # conversation_id
    
    @patch('assistant.views._validate_twilio_webhook', return_value=True)
    @patch('assistant.brain.agent.process_turn')
    def test_complete_auto_response_flow_with_text(self, mock_process_turn, mock_validate):
        """Test complete auto-response flow from webhook to frontend notification for text"""
        # Mock agent response
        mock_process_turn.return_value = {
            "success": True,
            "message": "The agent replied: 'Available next week'. Should I book a viewing for you?",
            "recommendations": []
        }
        
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
        
        # Wait for async task to complete (in testing, tasks run eagerly)
        # Check that notification was created
        notification = get_notification("test_conv_123")
        
        # Should have auto-update notification
        self.assertIsNotNone(notification)
        self.assertEqual(notification["type"], "auto_update")
        self.assertIn("agent replied", notification["data"]["message"].lower())
        self.assertTrue(notification["data"]["proactive"])
        self.assertEqual(notification["data"]["event_type"], "text_reply")
        self.assertEqual(notification["data"]["listing_id"], self.listing.id)
        
        # Should have called agent
        mock_process_turn.assert_called_once()
        call_args = mock_process_turn.call_args
        self.assertIn("internal_update", call_args[0][0])  # fake_input
        self.assertEqual(call_args[0][1], "test_conv_123")  # conversation_id
    
    def test_auto_response_function_directly(self):
        """Test auto-response function directly"""
        # Mock agent response
        with patch('assistant.brain.agent.process_turn') as mock_process_turn:
            mock_process_turn.return_value = {
                "success": True,
                "message": "Test auto-response message",
                "recommendations": []
            }
            
            # Test data
            webhook_data = {
                "text": "Test message",
                "listing_id": self.listing.id,
                "conversation_id": "test_conv_123"
            }
            
            # Call auto-response function
            result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data)
            
            # Should succeed
            self.assertTrue(result["success"])
            self.assertIn("Test auto-response message", result["message"])
            self.assertEqual(result["event_type"], "text_reply")
            
            # Should have called agent
            mock_process_turn.assert_called_once()
            
            # Should have created notification
            notification = get_notification("test_conv_123")
            self.assertIsNotNone(notification)
            self.assertEqual(notification["type"], "auto_update")
            self.assertTrue(notification["data"]["proactive"])
    
    def test_auto_response_with_different_event_types(self):
        """Test auto-response with different event types"""
        with patch('assistant.brain.agent.process_turn') as mock_process_turn:
            mock_process_turn.return_value = {
                "success": True,
                "message": "Test message",
                "recommendations": []
            }
            
            # Test photos only
            webhook_data_photos = {
                "MediaUrl0": "http://example.com/image1.jpg",
                "MediaUrl1": "http://example.com/image2.jpg",
                "listing_id": self.listing.id,
                "conversation_id": "test_conv_123"
            }
            
            result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data_photos)
            self.assertTrue(result["success"])
            self.assertEqual(result["event_type"], "photos_received")
            
            # Test mixed response
            webhook_data_mixed = {
                "text": "Here are the photos",
                "MediaUrl0": "http://example.com/image1.jpg",
                "listing_id": self.listing.id,
                "conversation_id": "test_conv_123"
            }
            
            result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data_mixed)
            self.assertTrue(result["success"])
            self.assertEqual(result["event_type"], "mixed_response")


