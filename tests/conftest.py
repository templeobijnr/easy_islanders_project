"""
Pytest configuration for Easy Islanders tests.
"""

import os
import sys
import pytest
import django
from django.conf import settings

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings')
django.setup()

@pytest.fixture(scope='session')
def django_test_environment():
    """Load Django settings for pytest."""
    return settings

@pytest.fixture
def user_model():
    """Fixture for User model."""
    from django.contrib.auth import get_user_model
    return get_user_model()

@pytest.fixture
def business_profile_model():
    """Fixture for BusinessProfile model."""
    try:
        from users.models import BusinessProfile
        return BusinessProfile
    except ImportError:
        return None

@pytest.fixture(autouse=True)
def _dj_autoclear_mailbox() -> None:
    """Override pytest-django's mailbox fixture to handle Django 5.2.5 compatibility."""
    try:
        from django.core import mail
        if hasattr(mail, 'outbox'):
            mail.outbox = []
    except (ImportError, AttributeError):
        pass
