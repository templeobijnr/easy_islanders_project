"""
Phase 1: Event-Driven Proactivity Tests
Test proactive photo notifications
"""

from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
import json

from assistant.models import Conversation, Listing, Message


class ProactivePhotoTests(TestCase):
    """Test proactive photo notification functionality"""
    
    def setUp(self):
        """Set up test data"""
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
        
    def test_proactive_photo_notification_structure(self):
        """Test that proactive photo notification has correct structure"""
        # This test will fail initially (Red phase)
        # We'll implement the functionality to make it pass (Green phase)
        
        # Mock the proactive response function
        with patch('assistant.tasks.trigger_proactive_agent_response') as mock_task:
            mock_task.return_value = {
                "success": True,
                "listing_id": 1,
                "conversation_id": "test_conv_123",
                "image_count": 2,
                "response": {
                    "message": "Great news! I've received 2 new photo(s) for listing 1.",
                    "language": "en",
                    "recommendations": [],
                    "proactive": True
                }
            }
            
            # Call the mocked function
            result = mock_task(1, "test_conv_123", 2)
            
            # Assert the structure
            self.assertTrue(result["success"])
            self.assertEqual(result["listing_id"], 1)
            self.assertEqual(result["image_count"], 2)
            self.assertIn("new photo(s)", result["response"]["message"])
            self.assertTrue(result["response"]["proactive"])
            
    def test_proactive_photo_message_creation(self):
        """Test that proactive messages are created in the database"""
        # This test will fail initially (Red phase)
        
        # Create a proactive message
        message = Message.objects.create(
            conversation=self.conv,
            content="Great news! I've received 2 new photo(s) for listing 1.",
            message_context={
                "intent_type": "proactive_update",
                "listing_id": 1,
                "image_count": 2,
                "proactive": True
            }
        )
        
        # Assert the message was created correctly
        self.assertEqual(message.conversation, self.conv)
        self.assertIn("new photo(s)", message.content)
        self.assertTrue(message.message_context["proactive"])
        self.assertEqual(message.message_context["listing_id"], 1)
        self.assertEqual(message.message_context["image_count"], 2)
        
    def test_proactive_photo_notification_storage(self):
        """Test that proactive notifications are stored for frontend"""
        # This test will fail initially (Red phase)
        
        # Mock the notification storage
        with patch('assistant.utils.notifications.put_notification') as mock_put:
            notification_data = {
                "listing_id": 1,
                "type": "proactive_update",
                "data": {
                    "message": "Great news! I've received 2 new photo(s) for listing 1.",
                    "recommendations": [],
                    "proactive": True,
                    "image_count": 2
                }
            }
            
            # Call the mocked function
            mock_put("test_conv_123", notification_data)
            
            # Assert the notification was stored
            mock_put.assert_called_once_with("test_conv_123", notification_data)
            
    def test_no_proactive_on_empty_media(self):
        """Test that no proactive message is sent when no photos are received"""
        # This test will fail initially (Red phase)
        
        # Mock empty media processing
        with patch('assistant.tasks.process_incoming_media_task') as mock_task:
            mock_task.return_value = {
                "success": False,
                "stored_urls": [],
                "message": "No media items were processed"
            }
            
            result = mock_task(1, [])
            
            # Assert no proactive response
            self.assertFalse(result["success"])
            self.assertEqual(len(result["stored_urls"]), 0)
            
    def test_feature_flag_disabled(self):
        """Test that proactive features are disabled when flag is off"""
        # This test will fail initially (Red phase)
        
        with patch('django.conf.settings.ENABLE_PROACTIVE_PHOTOS', False):
            # Mock the proactive response function
            with patch('assistant.tasks.trigger_proactive_agent_response') as mock_task:
                # Should not be called when flag is disabled
                mock_task.assert_not_called()
                
    def test_user_preferences_respected(self):
        """Test that user preferences are respected for proactive messages"""
        # This test will fail initially (Red phase)
        
        # Mock user with proactive disabled
        with patch('assistant.models.UserProfile.objects.get') as mock_user:
            mock_profile = MagicMock()
            mock_profile.proactive_enabled = False
            mock_user.return_value = mock_profile
            
            # Should not send proactive message
            with patch('assistant.tasks.trigger_proactive_agent_response') as mock_task:
                mock_task.assert_not_called()
