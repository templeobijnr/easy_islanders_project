from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*'] # DO NOT USE THIS IN PRODUCTION!


# Show emails in the console instead of sending (development only)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
print('Running with development settings')

