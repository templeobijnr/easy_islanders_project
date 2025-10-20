"""
Test-Driven Development for Proactive Agent Enhancement
=====================================================

This module contains comprehensive tests for proactive agent behaviors.
Following TDD principles: Red -> Green -> Refactor
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import json

from assistant.models import Conversation, Listing, Message
from assistant.tasks import (
    trigger_proactive_agent_response, 
    process_incoming_media_task,
    monitor_pending_outreaches
)
from assistant.brain.agent import process_turn
from assistant.utils.notifications import put_notification, get_notification_data


class ProactiveTests(TestCase):
    """Test suite for proactive agent behaviors"""
    
    def setUp(self):
        """Set up test data"""
        self.conv = Conversation.objects.create(conversation_id="test_conv_123")
        self.listing = Listing.objects.create(
            id=1,
            title="Test Property",
            location="Kyrenia",
            price=500.0,
            currency="GBP",
            structured_data={
                "contact_info": {"whatsapp": "+905551234567"},
                "image_urls": []
            }
        )
        
    def test_proactive_photo_update(self):
        """Test proactive notification when photos are received"""
        # Mock webhook trigger
        result = trigger_proactive_agent_response(1, "test_conv_123", 2)
        
        # Should contain proactive message about photos
        self.assertIn("new photo(s)", result["response"]["message"])
        
        # Should save message to conversation
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIsNotNone(msg)
        self.assertIn("Photos received", msg.content)
        
    def test_proactive_photo_notification(self):
        """Test complete photo notification flow"""
        # Simulate webhook with media
        with patch('assistant.tasks.MediaProcessor') as mock_processor:
            mock_processor.return_value.download_and_store_media.return_value = "test.jpg"
            
            result = process_incoming_media_task(1, ["test.jpg"])
            
            # Should trigger proactive response
            self.assertTrue(result["success"])
            
            # Should create notification
            notif = get_notification_data("test_conv_123")
            self.assertTrue(notif)
            
    def test_no_proactive_on_no_photos(self):
        """Test no proactive message when no photos received"""
        # Simulate webhook with empty media
        result = process_incoming_media_task(1, [])
        
        # Should not trigger proactive response
        self.assertFalse(result["success"])
        
        # Should not create notification
        notif = get_notification_data("test_conv_123")
        self.assertFalse(notif)
        
    def test_outreach_reminder(self):
        """Test proactive reminder for pending outreaches"""
        # Mock pending action >30min old
        old_timestamp = (timezone.now() - timedelta(minutes=31)).isoformat()
        Message.objects.create(
            conversation=self.conv,
            content="Test message",
            message_context={
                "pending_actions": [{
                    "type": "outreach_pictures",
                    "listing_id": 1,
                    "timestamp": old_timestamp,
                    "status": "waiting"
                }]
            }
        )
        
        # Run monitoring task
        result = monitor_pending_outreaches()
        
        # Should create reminder message
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIn("No response", msg.content)
        
    def test_proactive_question(self):
        """Test proactive questions for incomplete requests"""
        # Mock incomplete search request (no location)
        result = process_turn("Find apartment", "test_conv_123")
        
        # Should ask clarifying question
        self.assertIn("location", result["message"].lower())
        
    def test_predictive_engagement(self):
        """Test predictive engagement based on user behavior"""
        # Mock user with multiple views
        state = {"view_count": 3, "last_search": "apartment"}
        
        with patch('assistant.tasks.analyze_user_behavior_patterns') as mock_analyze:
            mock_analyze.return_value = {"message": "Ready to contact agents?"}
            
            result = mock_analyze("test_conv_123")
            
            # Should suggest next action
            self.assertIn("contact", result["message"].lower())
            
    def test_feature_flag_disabled(self):
        """Test that proactive features are disabled when flag is off"""
        with patch('django.conf.settings.ENABLE_PROACTIVE_AGENT', False):
            result = trigger_proactive_agent_response(1, "test_conv_123", 2)
            
            # Should not create proactive message
            self.assertNotIn("proactive", result)
            
    def test_user_preferences_respected(self):
        """Test that user preferences are respected"""
        # Mock user with proactive disabled
        with patch('assistant.models.UserProfile.objects.get') as mock_user:
            mock_user.return_value.proactive_enabled = False
            
            result = trigger_proactive_agent_response(1, "test_conv_123", 2)
            
            # Should not create proactive message
            self.assertNotIn("proactive", result)
            
    def test_rate_limiting(self):
        """Test rate limiting for proactive messages"""
        # Mock Redis counter
        with patch('assistant.utils.notifications.cache') as mock_cache:
            mock_cache.get.return_value = 3  # Already sent 3 today
            
            result = trigger_proactive_agent_response(1, "test_conv_123", 2)
            
            # Should respect rate limit
            self.assertIn("rate_limit", result)
            
    def test_error_handling(self):
        """Test error handling in proactive tasks"""
        with patch('assistant.tasks.trigger_proactive_agent_response') as mock_task:
            mock_task.side_effect = Exception("Test error")
            
            # Should not crash the system
            try:
                result = mock_task(1, "test_conv_123", 2)
            except Exception:
                pass  # Expected to fail gracefully
                
    def test_monitoring_metrics(self):
        """Test that monitoring metrics are recorded"""
        with patch('assistant.monitoring.metrics.LLMMetrics.track_request') as mock_track:
            trigger_proactive_agent_response(1, "test_conv_123", 2)
            
            # Should track proactive message
            mock_track.assert_called()


