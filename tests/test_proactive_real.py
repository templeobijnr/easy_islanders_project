"""
Real proactive functionality tests (Green phase)
Tests the actual implementation without mocks
"""

from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch
import json

from assistant.models import Conversation, Listing, Message, UserProfile
from assistant.tasks import trigger_proactive_agent_response


class RealProactiveTests(TestCase):
    """Test real proactive functionality"""
    
    def setUp(self):
        """Set up test data"""
        from django.core.cache import cache
        
        # Clear cache before each test
        cache.clear()
        
        self.conv = Conversation.objects.create(conversation_id="test_conv_123")
        self.listing = Listing.objects.create(
            source_name="test",
            source_id="test_123",
            location="Kyrenia",
            price=500.0,
            currency="GBP",
            structured_data={
                "contact_info": {"whatsapp": "+905551234567"},
                "image_urls": []
            }
        )
        
    def test_proactive_photo_notification_real(self):
        """Test real proactive photo notification"""
        # This should work with the real implementation
        result = trigger_proactive_agent_response(1, "test_conv_123", 2)
        
        # Should succeed (assuming feature flags are enabled in testing)
        self.assertTrue(result["success"])
        self.assertEqual(result["listing_id"], 1)
        self.assertEqual(result["image_count"], 2)
        self.assertIn("new photos", result["response"]["message"])
        self.assertTrue(result["response"]["proactive"])
        
        # Should create a message in the database
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIsNotNone(msg)
        self.assertIn("photos", msg.content.lower())
        self.assertTrue(msg.message_context["proactive"])
        
    def test_proactive_with_user_preferences(self):
        """Test proactive behavior with user preferences"""
        # Create user profile with proactive disabled
        UserProfile.objects.create(
            user_id="test_conv_123",
            proactive_enabled=False,
            proactive_photos=False
        )
        
        result = trigger_proactive_agent_response(1, "test_conv_123", 2)
        
        # Should be disabled due to user preferences
        self.assertFalse(result["success"])
        self.assertEqual(result["reason"], "user_preference")
        
    def test_proactive_rate_limiting(self):
        """Test proactive rate limiting"""
        # Send multiple proactive messages quickly (rate limit is 10 per hour in testing)
        results = []
        for i in range(12):  # Send 12 messages to exceed the limit
            result = trigger_proactive_agent_response(1, "test_conv_123", 1)
            results.append(result)
        
        # First 10 should succeed, 11th and 12th should be rate limited
        for i in range(10):
            self.assertTrue(results[i]["success"], f"Message {i+1} should succeed")
        
        for i in range(10, 12):
            self.assertFalse(results[i]["success"], f"Message {i+1} should be rate limited")
            self.assertEqual(results[i]["reason"], "rate_limit")
        
    def test_proactive_message_content(self):
        """Test that proactive messages have good content"""
        result = trigger_proactive_agent_response(1, "test_conv_123", 3)
        
        self.assertTrue(result["success"])
        message = result["response"]["message"]
        
        # Should contain emoji and engaging language
        self.assertIn("📸", message)
        self.assertIn("photos", message.lower())
        self.assertIn("Kyrenia", message)  # Should include location
        self.assertIn("?", message)  # Should have call to action
        
    def test_proactive_with_different_image_counts(self):
        """Test proactive messages with different image counts"""
        # Test single photo
        result1 = trigger_proactive_agent_response(1, "test_conv_123", 1)
        self.assertTrue(result1["success"])
        self.assertIn("photo", result1["response"]["message"])
        
        # Test multiple photos
        result2 = trigger_proactive_agent_response(1, "test_conv_123", 5)
        self.assertTrue(result2["success"])
        self.assertIn("photos", result2["response"]["message"])
        self.assertIn("5", result2["response"]["message"])
