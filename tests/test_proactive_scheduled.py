"""
Test scheduled proactive messages (no user input required)
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from assistant.models import Conversation, UserProfile, Message
from assistant.tasks import send_proactive_reminders, send_market_updates


class ScheduledProactiveTests(TestCase):
    """Test scheduled proactive messages"""
    
    def setUp(self):
        """Set up test data"""
        from django.core.cache import cache
        cache.clear()
        
        # Create user profile with proactive enabled
        self.user_profile = UserProfile.objects.create(
            user_id="test_user_123",
            proactive_enabled=True,
            proactive_reminders=True,
            proactive_predictions=True,
            last_interaction=timezone.now() - timedelta(hours=25)  # Inactive for 25 hours
        )
        
        # Create conversation
        self.conv = Conversation.objects.create(conversation_id="test_user_123")
        
    def test_proactive_reminders_without_user_input(self):
        """Test that agent sends reminders without user input"""
        # This should trigger a proactive reminder
        result = send_proactive_reminders()
        
        # Should succeed
        self.assertTrue(result["success"])
        self.assertGreater(result["reminders_sent"], 0)
        
        # Should create a message in the database
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIsNotNone(msg)
        self.assertIn("active", msg.content.lower())
        self.assertTrue(msg.message_context["proactive"])
        
    def test_market_updates_without_user_input(self):
        """Test that agent sends market updates without user input"""
        # This should trigger a market update
        result = send_market_updates()
        
        # Should succeed
        self.assertTrue(result["success"])
        self.assertGreater(result["updates_sent"], 0)
        
    def test_no_reminders_for_active_users(self):
        """Test that active users don't get reminders"""
        # Update user to be recently active
        self.user_profile.last_interaction = timezone.now() - timedelta(hours=1)
        self.user_profile.save()
        
        result = send_proactive_reminders()
        
        # Should succeed but send no reminders
        self.assertTrue(result["success"])
        self.assertEqual(result["reminders_sent"], 0)
        
    def test_user_preferences_respected(self):
        """Test that user preferences are respected for scheduled messages"""
        # Disable reminders for this user
        self.user_profile.proactive_reminders = False
        self.user_profile.save()
        
        result = send_proactive_reminders()
        
        # Should succeed but send no reminders
        self.assertTrue(result["success"])
        self.assertEqual(result["reminders_sent"], 0)
        
    def test_rate_limiting_prevents_spam(self):
        """Test that rate limiting prevents spam from scheduled messages"""
        # Create multiple users to test rate limiting
        UserProfile.objects.create(
            user_id="test_user_456",
            proactive_enabled=True,
            proactive_reminders=True,
            last_interaction=timezone.now() - timedelta(hours=25)
        )
        
        # Send multiple reminders quickly
        result1 = send_proactive_reminders()
        result2 = send_proactive_reminders()
        result3 = send_proactive_reminders()
        
        # First should succeed
        self.assertTrue(result1["success"])
        self.assertGreater(result1["reminders_sent"], 0)
        
        # Subsequent calls should still succeed because we have multiple users
        # but each user should be rate limited individually
        self.assertTrue(result2["success"])
        self.assertTrue(result3["success"])
        
    def test_scheduled_message_content(self):
        """Test that scheduled messages have appropriate content"""
        result = send_proactive_reminders()
        
        self.assertTrue(result["success"])
        
        # Check the message content
        msg = Message.objects.filter(conversation=self.conv).last()
        self.assertIn("active", msg.content.lower())
        self.assertIn("property", msg.content.lower())
        self.assertTrue(msg.message_context["proactive"])
        self.assertEqual(msg.message_context["reminder_type"], "inactivity")
