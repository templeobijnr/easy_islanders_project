"""
Testing settings for Easy Islanders
"""

from .base import *

# Override settings for testing
DEBUG = True
SECRET_KEY = 'test-secret-key'

# Use in-memory SQLite for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Use in-memory email backend for testing
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Use in-memory cache for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-cache',
    }
}

# Disable Celery for testing
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Enable all proactive features for testing
PROACTIVE_AGENT_ENABLED = True
ENABLE_PROACTIVE_PHOTOS = True
ENABLE_PROACTIVE_REMINDERS = True
ENABLE_PROACTIVE_QUESTIONS = True
ENABLE_PROACTIVE_PREDICTIONS = True
ENABLE_AUTO_RESPONSE = True

# Test-specific limits
MAX_PROACTIVE_MESSAGES_PER_DAY = 10
PROACTIVE_RATE_LIMIT_WINDOW = 60  # 1 minute for testing

# Disable external services
OPENAI_API_KEY = 'test-key'
TWILIO_ACCOUNT_SID = 'test-sid'
TWILIO_AUTH_TOKEN = 'test-token'
TWILIO_PHONE_NUMBER = '+1234567890'

# Test media settings
MEDIA_ROOT = '/tmp/test_media'
MEDIA_URL = '/test_media/'

# Disable logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}