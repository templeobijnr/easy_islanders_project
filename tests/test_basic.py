"""
Basic test to verify Django setup works
"""

from django.test import TestCase
from django.conf import settings


class BasicTest(TestCase):
    """Basic Django test"""
    
    def test_django_setup(self):
        """Test that Django is properly configured"""
        # DEBUG might be False in testing, let's just check it exists
        self.assertIsNotNone(settings.DEBUG)
        # Check that we're using the testing database
        self.assertEqual(settings.DATABASES['default']['ENGINE'], 'django.db.backends.sqlite3')
        
    def test_proactive_settings(self):
        """Test that proactive settings are available"""
        self.assertTrue(settings.PROACTIVE_AGENT_ENABLED)  # Testing settings enable this
        self.assertTrue(settings.ENABLE_PROACTIVE_PHOTOS)
        self.assertTrue(settings.ENABLE_PROACTIVE_REMINDERS)
        self.assertTrue(settings.ENABLE_PROACTIVE_QUESTIONS)
        self.assertTrue(settings.ENABLE_PROACTIVE_PREDICTIONS)
