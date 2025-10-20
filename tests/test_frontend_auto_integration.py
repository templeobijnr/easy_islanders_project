"""
Test frontend auto-response integration
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from assistant.utils.notifications import put_notification, get_notification


class FrontendAutoIntegrationTests(TestCase):
    """Test frontend auto-response integration"""
    
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
    
    def test_auto_update_notification_structure(self):
        """Test that auto-update notifications have the correct structure"""
        # Create an auto-update notification
        notification = {
            "type": "auto_update",
            "data": {
                "message": "Great! The agent sent 2 photos for your Kyrenia property. Here's what they look like: [gallery]. Any questions?",
                "recommendations": [
                    {
                        "id": 1,
                        "title": "Property 1",
                        "price": "500 GBP",
                        "location": "Kyrenia",
                        "images": ["http://example.com/image1.jpg"],
                        "description": "Updated with new photos",
                        "features": [],
                        "verified_with_photos": True,
                        "auto_display": True
                    }
                ],
                "proactive": True,
                "event_type": "photos_received",
                "listing_id": 1
            }
        }
        
        # Store notification
        put_notification("test_conv_123", notification)
        
        # Retrieve notification
        retrieved = get_notification("test_conv_123")
        
        # Should have correct structure
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["type"], "auto_update")
        self.assertIn("agent sent", retrieved["data"]["message"].lower())
        self.assertTrue(retrieved["data"]["proactive"])
        self.assertEqual(retrieved["data"]["event_type"], "photos_received")
        self.assertEqual(retrieved["data"]["listing_id"], 1)
        self.assertGreater(len(retrieved["data"]["recommendations"]), 0)
    
    def test_auto_update_notification_for_text(self):
        """Test auto-update notification for text responses"""
        # Create an auto-update notification for text
        notification = {
            "type": "auto_update",
            "data": {
                "message": "The agent replied: 'Available next week'. Should I book a viewing for you?",
                "recommendations": [],
                "proactive": True,
                "event_type": "text_reply",
                "listing_id": 1
            }
        }
        
        # Store notification
        put_notification("test_conv_123", notification)
        
        # Retrieve notification
        retrieved = get_notification("test_conv_123")
        
        # Should have correct structure
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["type"], "auto_update")
        self.assertIn("agent replied", retrieved["data"]["message"].lower())
        self.assertTrue(retrieved["data"]["proactive"])
        self.assertEqual(retrieved["data"]["event_type"], "text_reply")
        self.assertEqual(retrieved["data"]["listing_id"], 1)
    
    def test_auto_update_notification_for_mixed_response(self):
        """Test auto-update notification for mixed responses"""
        # Create an auto-update notification for mixed response
        notification = {
            "type": "auto_update",
            "data": {
                "message": "The agent replied: 'Here are the photos' and sent 2 photos for listing 1. Analyze and respond.",
                "recommendations": [],
                "proactive": True,
                "event_type": "mixed_response",
                "listing_id": 1
            }
        }
        
        # Store notification
        put_notification("test_conv_123", notification)
        
        # Retrieve notification
        retrieved = get_notification("test_conv_123")
        
        # Should have correct structure
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["type"], "auto_update")
        self.assertIn("agent replied", retrieved["data"]["message"].lower())
        self.assertIn("photos", retrieved["data"]["message"].lower())
        self.assertTrue(retrieved["data"]["proactive"])
        self.assertEqual(retrieved["data"]["event_type"], "mixed_response")
        self.assertEqual(retrieved["data"]["listing_id"], 1)
    
    def test_notification_clearing_after_retrieval(self):
        """Test that notifications are cleared after retrieval"""
        # Create notification
        notification = {
            "type": "auto_update",
            "data": {
                "message": "Test message",
                "recommendations": [],
                "proactive": True,
                "event_type": "text_reply",
                "listing_id": 1
            }
        }
        
        # Store notification
        put_notification("test_conv_123", notification)
        
        # First retrieval should succeed
        retrieved1 = get_notification("test_conv_123")
        self.assertIsNotNone(retrieved1)
        
        # Second retrieval should return None (cleared)
        retrieved2 = get_notification("test_conv_123")
        self.assertIsNone(retrieved2)
    
    def test_multiple_auto_update_notifications(self):
        """Test handling multiple auto-update notifications"""
        # Create multiple notifications
        notifications = [
            {
                "type": "auto_update",
                "data": {
                    "message": "First auto-response",
                    "recommendations": [],
                    "proactive": True,
                    "event_type": "text_reply",
                    "listing_id": 1
                }
            },
            {
                "type": "auto_update",
                "data": {
                    "message": "Second auto-response",
                    "recommendations": [],
                    "proactive": True,
                    "event_type": "photos_received",
                    "listing_id": 2
                }
            }
        ]
        
        # Store notifications
        for i, notification in enumerate(notifications):
            put_notification(f"test_conv_{i}", notification)
        
        # Retrieve notifications
        for i in range(len(notifications)):
            retrieved = get_notification(f"test_conv_{i}")
            self.assertIsNotNone(retrieved)
            self.assertEqual(retrieved["type"], "auto_update")
            self.assertTrue(retrieved["data"]["proactive"])


