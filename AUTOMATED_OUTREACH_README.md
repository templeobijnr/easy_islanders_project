# Easy Islanders - Automated Outreach System

## 🎯 Overview

The Automated Outreach System is the core "Proxy Agent" functionality that makes Easy Islanders unique. It automatically contacts sellers on behalf of users to get photos, confirm availability, and arrange viewings.

## 🔄 How It Works

### 1. **User Requests Photos**
- User sees a listing and clicks "Request Photos"
- AI agent automatically sends WhatsApp message via Twilio
- Message: "Hello! This is Easy Islanders. A client is interested in your property. Could you please share a few photos and confirm availability? Thank you!"

### 2. **Seller Responds with Photos**
- Seller receives WhatsApp message
- Seller replies with photos via WhatsApp
- Twilio webhook automatically receives the media

### 3. **Photos Automatically Processed**
- Media downloaded from Twilio
- Stored to S3/CDN with permanent URLs
- Listing updated with new photos
- Marked as "verified_with_photos"

### 4. **User Sees Updated Cards**
- Recommendation cards refresh automatically
- New photos appear immediately
- User gets notification: "Photos just arrived!"

## 🛠️ Technical Implementation

### **Core Components**

1. **`TwilioWhatsAppClient`** (`assistant/twilio_client.py`)
   - Sends automated outreach messages
   - Handles Twilio API communication
   - Multilingual message support (EN, RU, PL, DE, TR)

2. **`MediaProcessor`** (`assistant/twilio_client.py`)
   - Downloads media from Twilio webhooks
   - Stores to S3/CDN
   - Updates listing structured_data

3. **Agent Outreach Endpoint** (`/api/listings/outreach/`)
   - Initiates contact with sellers
   - Records outreach attempts
   - Returns outreach status

4. **Twilio Webhook Endpoint** (`/api/webhooks/twilio/`)
   - Receives WhatsApp replies and media
   - Processes incoming photos automatically
   - Updates listings in real-time

### **API Endpoints**

```
POST /api/listings/outreach/
POST /api/listings/{id}/outreach/
GET  /api/listings/{id}/
POST /api/webhooks/twilio/
```

## ⚙️ Setup Instructions

### 1. **Twilio Configuration**

#### Get Twilio Credentials
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a WhatsApp Business number
4. Note your WhatsApp number (format: `+1234567890`)

#### Configure Settings
Add to your Django settings:

```python
# Twilio WhatsApp Business API
TWILIO_ACCOUNT_SID = 'your_account_sid_here'
TWILIO_AUTH_TOKEN = 'your_auth_token_here'
TWILIO_WHATSAPP_FROM = 'whatsapp:+1234567890'

# Optional: S3/CDN for Media Storage
AWS_STORAGE_BUCKET_NAME = 'your-s3-bucket-name'
CDN_DOMAIN = 'your-cdn-domain.com'
```

### 2. **Twilio Webhook Setup**

#### In Twilio Console
1. Go to [Twilio Console > Messaging > Settings > WhatsApp Sandbox](https://console.twilio.com/us1/messaging/settings/whatsapp-sandbox)
2. Set your webhook URL: `https://yourdomain.com/api/webhooks/twilio/`
3. Ensure webhook is set to receive both messages and media

#### Webhook URL Format
```
https://yourdomain.com/api/webhooks/twilio/
```

### 3. **S3/CDN Configuration (Optional)**

For production media storage:

```python
# Django settings
AWS_ACCESS_KEY_ID = 'your_access_key'
AWS_SECRET_ACCESS_KEY = 'your_secret_key'
AWS_STORAGE_BUCKET_NAME = 'your-bucket-name'
AWS_S3_REGION_NAME = 'your-region'
AWS_DEFAULT_ACL = 'public-read'
```

## 🧪 Testing

### **Run Test Script**
```bash
python test_automated_outreach.py
```

### **Manual Testing**

1. **Test Listing Details**
   ```bash
   curl http://localhost:8000/api/listings/1/
   ```

2. **Test Agent Outreach**
   ```bash
   curl -X POST http://localhost:8000/api/listings/outreach/ \
     -H "Content-Type: application/json" \
     -d '{"listing_id": 1, "channel": "whatsapp", "language": "en"}'
   ```

3. **Test Twilio Webhook (Simulation)**
   ```bash
   curl -X POST http://localhost:8000/api/webhooks/twilio/ \
     -d "From=whatsapp:+905551234567" \
     -d "MediaUrl0=https://example.com/test-photo.jpg" \
     -d "MessageSid=test_123"
   ```

## 📱 WhatsApp Message Flow

### **Outgoing Message (Agent → Seller)**
```
From: Easy Islanders (via Twilio)
To: Seller's WhatsApp number
Message: "Hello! This is Easy Islanders. A client is interested in your property. Could you please share a few photos and confirm availability? Thank you!"
```

### **Incoming Reply (Seller → Agent)**
```
From: Seller's WhatsApp number
To: Easy Islanders (via Twilio webhook)
Media: Photos attached
```

## 🔒 Security & Privacy

### **Source Protection**
- Never reveal where listings were found
- All communication is neutral and professional
- No external platform references in user-facing content

### **Data Handling**
- Contact information stored securely
- Media processed and stored to your infrastructure
- Audit trail of all outreach attempts

## 🚀 Production Deployment

### **HTTPS Required**
- Twilio webhooks require HTTPS
- Use ngrok for local development
- Configure proper SSL certificates in production

### **Webhook Security**
- Validate Twilio webhook signatures
- Rate limiting on webhook endpoints
- Monitor webhook delivery status

### **Media Storage**
- Configure S3 bucket permissions
- Set up CDN for fast image delivery
- Implement media cleanup policies

## 📊 Monitoring & Analytics

### **Outreach Metrics**
- Messages sent successfully
- Media received and processed
- Response rates by channel
- Time to first response

### **System Health**
- Webhook delivery success
- Media processing times
- Storage usage
- Error rates

## 🐛 Troubleshooting

### **Common Issues**

1. **Twilio API Errors**
   - Check credentials in settings
   - Verify WhatsApp number format
   - Check API rate limits

2. **Webhook Not Receiving**
   - Verify webhook URL in Twilio console
   - Check HTTPS requirement
   - Test endpoint manually

3. **Media Not Processing**
   - Check S3/CDN configuration
   - Verify file permissions
   - Check media URL format

4. **Listings Not Updating**
   - Check database connections
   - Verify structured_data format
   - Check for validation errors

### **Debug Mode**
Enable detailed logging:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'assistant.twilio_client': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## 🔮 Future Enhancements

### **Planned Features**
- Telegram Bot integration
- SMS fallback for non-WhatsApp users
- Automated follow-up messages
- Response sentiment analysis
- Multi-language seller support

### **Integration Opportunities**
- CRM systems
- Calendar booking
- Payment processing
- Document signing

## 📞 Support

For technical support or questions about the Automated Outreach System:

1. Check the logs for error details
2. Verify Twilio configuration
3. Test webhook endpoints manually
4. Review this documentation

---

**Easy Islanders - Making North Cyprus Real Estate Simple, One Chat at a Time** 🏝️
