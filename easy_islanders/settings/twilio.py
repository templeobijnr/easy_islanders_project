"""
Twilio WhatsApp Business API Configuration for Easy Islanders.
Add these settings to your environment-specific settings file.
"""

# Twilio WhatsApp Business API Configuration
# Get these from your Twilio Console: https://console.twilio.com/

# Your Twilio Account SID
TWILIO_ACCOUNT_SID = 'your_account_sid_here'

# Your Twilio Auth Token
TWILIO_AUTH_TOKEN = 'your_auth_token_here'

# Your Twilio WhatsApp Business number (format: whatsapp:+1234567890)
TWILIO_WHATSAPP_FROM = 'whatsapp:+1234567890'

# Optional: S3/CDN Configuration for Media Storage
AWS_STORAGE_BUCKET_NAME = 'your-s3-bucket-name'
CDN_DOMAIN = 'your-cdn-domain.com'  # e.g., 'cdn.easyislanders.com'

# Twilio Webhook Configuration
# Set this URL in your Twilio Console webhook settings:
# https://yourdomain.com/api/webhooks/twilio/
