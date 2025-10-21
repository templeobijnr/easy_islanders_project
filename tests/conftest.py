import pytest
from django.conf import settings

@pytest.fixture(scope='session')
def django_test_environment():
    """Load Django settings for pytest."""
    if not settings.configured:
        settings.configure(DJANGO_SETTINGS_MODULE='easy_islanders.settings.testing')
    return settings

@pytest.fixture
def user_model():
    """Fixture for User model."""
    from django.contrib.auth import get_user_model
    return get_user_model()

@pytest.fixture
def business_profile_model():
    """Fixture for BusinessProfile model."""
    from users.models import BusinessProfile
    return BusinessProfile

@pytest.fixture(autouse=True)
def _dj_autoclear_mailbox() -> None:
    """Override pytest-django's mailbox fixture to handle Django 5.2.5 compatibility."""
    from django.conf import settings as django_settings
    if not django_settings.configured:
        return
    
    # Only clear mailbox if it exists (for compatible email backends)
    try:
        from django.core import mail
        if hasattr(mail, 'outbox'):
            del mail.outbox[:]
    except (ImportError, AttributeError):
        pass
