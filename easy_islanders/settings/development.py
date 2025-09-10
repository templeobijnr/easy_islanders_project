from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*'] # DO NOT USE THIS IN PRODUCTION!

# Show emails in the console instead of sending (development only)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Twilio WhatsApp Business API Configuration
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')

# For Development - Use WhatsApp Sandbox (free)
# Your actual sandbox number from Twilio Console
TWILIO_WHATSAPP_FROM = config('TWILIO_WHATSAPP_FROM', default='whatsapp:+14155238886')

# Optional: S3/CDN Configuration for Media Storage (for production)
# AWS_STORAGE_BUCKET_NAME = 'your-s3-bucket-name'
# CDN_DOMAIN = 'your-cdn-domain.com'

print('Running with development settings')

