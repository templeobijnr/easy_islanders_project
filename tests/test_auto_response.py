"""
Test auto-response functionality
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from assistant.auto_response import trigger_auto_response


class AutoResponseTests(TestCase):
    """Test auto-response function"""
    
    def setUp(self):
        """Set up test data"""
        from assistant.models import Conversation, Listing, UserProfile
        from django.core.cache import cache
        cache.clear()
        
        # Create test data
        self.conv = Conversation.objects.create(conversation_id="test_conv_123")
        self.listing = Listing.objects.create(
            source_name="test",
            source_id="test_123",
            location="Kyrenia",
            price=500.0,
            currency="GBP"
        )
        UserProfile.objects.create(user_id="test_conv_123", proactive_enabled=True)
    
    @patch('assistant.brain.agent.process_turn')
    def test_auto_response_trigger_with_photos(self, mock_process_turn):
        """Test auto-response with photos"""
        # Mock the agent response
        mock_process_turn.return_value = {
            "success": True,
            "message": "Great! The agent sent 2 photos for your Kyrenia property. Here's what they look like: [gallery]. Any questions?",
            "recommendations": []
        }
        
        webhook_data = {
            "MediaUrl0": "test.jpg",
            "MediaUrl1": "test2.jpg", 
            "text": "Here are the photos",
            "listing_id": self.listing.id,
            "conversation_id": "test_conv_123"
        }
        
        result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data)
        
        # Should succeed
        self.assertTrue(result["success"])
        self.assertIn("agent sent", result["message"].lower())
        
        # Should have called process_turn
        mock_process_turn.assert_called_once()
        
        # Should save message
        from assistant.models import Message
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIsNotNone(msg)
        self.assertTrue(msg.message_context.get("proactive"))
        self.assertEqual(msg.message_context.get("event_type"), "mixed_response")
    
    @patch('assistant.brain.agent.process_turn')
    def test_auto_response_trigger_with_text(self, mock_process_turn):
        """Test auto-response with text only"""
        # Mock the agent response
        mock_process_turn.return_value = {
            "success": True,
            "message": "The agent replied: 'Available next week'. Should I book a viewing for you?",
            "recommendations": []
        }
        
        webhook_data = {
            "text": "Available next week",
            "listing_id": self.listing.id,
            "conversation_id": "test_conv_123"
        }
        
        result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data)
        
        # Should succeed
        self.assertTrue(result["success"])
        self.assertIn("agent replied", result["message"].lower())
        
        # Should have called process_turn
        mock_process_turn.assert_called_once()
        
        # Should save message
        from assistant.models import Message
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIsNotNone(msg)
        self.assertTrue(msg.message_context.get("proactive"))
        self.assertEqual(msg.message_context.get("event_type"), "text_reply")
    
    def test_auto_response_disabled_by_flag(self):
        """Test auto-response respects feature flag"""
        with patch('django.conf.settings.ENABLE_AUTO_RESPONSE', False):
            webhook_data = {
                "text": "Available next week",
                "listing_id": self.listing.id,
                "conversation_id": "test_conv_123"
            }
            
            result = trigger_auto_response(self.listing.id, "test_conv_123", webhook_data)
            
            # Should be disabled
            self.assertFalse(result["success"])
    
    def test_auto_response_handles_errors(self):
        """Test auto-response handles errors gracefully"""
        webhook_data = {
            "text": "Available next week",
            "listing_id": 99999,  # Non-existent listing
            "conversation_id": "test_conv_123"
        }
        
        result = trigger_auto_response(99999, "test_conv_123", webhook_data)
        
        # Should handle error gracefully
        self.assertFalse(result["success"])
        self.assertIn("error", result)
