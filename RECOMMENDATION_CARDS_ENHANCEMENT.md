# Recommendation Cards Enhancement - Complete Feature Guide

**Date:** 2025-11-10
**Status:** ✅ IMPLEMENTATION COMPLETE
**Feature:** Enhanced Property Cards with Gallery, Info & WhatsApp Availability Check

---

## 🎯 Overview

Enhanced the `RecommendationCard` component with three new interactive features:
1. **📸 View Photos** - Full-screen image gallery with swipe navigation
2. **ℹ️ View Info** - Detailed property information modal
3. **📅 Check Availability** - Real-time availability check via WhatsApp agent

---

## 🚀 Key Features

### 1. Gallery Modal
- Full-screen image viewer with dark overlay
- Swipe/click navigation between images
- Thumbnail strip for quick navigation
- Keyboard controls (Escape, Arrow keys)
- Image counter display
- Responsive design

### 2. Info Modal
- Comprehensive property details
- Property specifications (bedrooms, bathrooms, size)
- Full amenities list
- Rating display
- Location information
- Rental type badge
- Scrollable content with sticky header/footer

### 3. WhatsApp Availability Check
**Complete Flow:**
```
User clicks "Check" button
    ↓
Frontend → POST /api/v1/availability/check/
    ↓
Backend sends WhatsApp to agent via Twilio
    ↓
Agent responds "Yes" or "No" on WhatsApp
    ↓
Twilio webhook → POST /api/webhooks/twilio/whatsapp/
    ↓
Backend parses response → Celery task
    ↓
System message injected into chat via WebSocket
    ↓
User sees: "✅ The property is available!" automatically
```

---

## 📁 Files Created/Modified

### Frontend Components

#### 1. Enhanced RecommendationCard
**File:** `frontend/src/features/chat/components/RecommendationCard.tsx`

**Changes:**
- Added `galleryImages` and `metadata` to `RecItem` interface
- Added state for modals (`isGalleryOpen`, `isInfoOpen`)
- Added three new button handlers
- Added quick action buttons row (Photos, Info, Check)
- Integrated `GalleryModal` and `InfoModal` components

**New Interface:**
```typescript
export interface RecItem {
  id: string;
  title: string;
  subtitle?: string;
  price?: string;
  rating?: number;
  badges?: string[];
  imageUrl?: string;
  area?: string;
  galleryImages?: string[];  // ✅ NEW
  metadata?: {               // ✅ NEW
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    sqm?: number;
    description?: string;
    rent_type?: string;
  };
}
```

#### 2. GalleryModal Component
**File:** `frontend/src/features/chat/components/GalleryModal.tsx`

**Features:**
- Full-screen dark overlay
- Image navigation (previous/next buttons)
- Keyboard shortcuts (←, →, Escape)
- Thumbnail strip at bottom
- Image counter (1 / 5)
- Click outside to close
- Responsive layout

**Props:**
```typescript
interface GalleryModalProps {
  images: string[];
  title: string;
  onClose: () => void;
}
```

#### 3. InfoModal Component
**File:** `frontend/src/features/chat/components/InfoModal.tsx`

**Features:**
- Scrollable content
- Sticky header with close button
- Property image display
- Location & price header
- Property details grid (beds, baths, size)
- Rating display
- Rental type badge
- Amenities list
- Full description
- Distance information
- Sticky footer with close button

**Props:**
```typescript
interface InfoModalProps {
  item: RecItem;
  onClose: () => void;
}
```

---

### Backend Components

#### 1. Twilio WhatsApp Utility
**File:** `assistant/integrations/twilio_utils.py`

**Functions:**
- `get_twilio_client()` - Get configured Twilio client
- `send_whatsapp_message(to_phone, message, listing_id)` - Send WhatsApp message
- `format_availability_check_message(...)` - Format agent message
- `parse_agent_response(message_body)` - Parse agent's yes/no response

**Environment Variables Required:**
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### 2. Availability Check API Endpoint
**File:** `assistant/views/availability.py`

**Endpoint:** `POST /api/v1/availability/check/`

**Request:**
```json
{
  "listing_id": "uuid-or-int"
}
```

**Response (202 Accepted):**
```json
{
  "ok": true,
  "message": "Availability check request sent to agent",
  "listing_id": "123",
  "thread_id": "9814114a-...",
  "twilio_sid": "SM..."
}
```

**Flow:**
1. Validate user authentication
2. Fetch listing from database
3. Get agent's phone number from listing owner
4. Format WhatsApp message
5. Send via Twilio
6. Store agent_phone → thread_id mapping in cache (24h TTL)
7. Return 202 Accepted

**Cache Key:** `availability_check:{agent_phone}` → `{thread_id}`

#### 3. Twilio Webhook Endpoint
**File:** `assistant/views/twilio_webhook.py`

**Endpoint:** `POST /api/webhooks/twilio/whatsapp/`

**Flow:**
1. Receive webhook from Twilio (agent's WhatsApp response)
2. Parse message body → determine availability (yes/no)
3. Look up thread_id from cache using agent's phone
4. Generate chat message based on availability
5. Trigger Celery task to inject message into chat
6. Return 200 OK

**Expected Twilio Webhook Data:**
```
From: whatsapp:+1234567890
Body: "Yes, available"
MessageSid: SM...
```

**Agent Response Parsing:**
- **Available:** "yes", "available", "free", "ok", "sure", "✅"
- **Unavailable:** "no", "unavailable", "booked", "taken", "sorry", "❌"

#### 4. System Message Injection Task
**File:** `assistant/tasks.py` (new task added)

**Task:** `inject_system_message_to_chat(thread_id, message, metadata)`

**Purpose:** Inject system-generated messages into ongoing chat conversations

**Flow:**
1. Get conversation thread
2. Create assistant message in database
3. Format as WebSocket frame
4. Send to WebSocket group
5. Frontend receives and displays automatically

**Usage:**
```python
from assistant.tasks import inject_system_message_to_chat

inject_system_message_to_chat.delay(
    thread_id="9814114a-...",
    message="✅ Great news! The property is available.",
    metadata={
        "source": "twilio_webhook",
        "availability": True,
        "agent_phone": "whatsapp:+123..."
    }
)
```

---

## 🔗 URL Routes Added

```python
# assistant/urls.py
urlpatterns = [
    # ... existing routes ...

    # Availability check via WhatsApp
    path("v1/availability/check/", check_availability, name="availability-check"),

    # Twilio WhatsApp webhook
    path("webhooks/twilio/whatsapp/", twilio_whatsapp_webhook, name="twilio-whatsapp-webhook"),
]
```

**Full URLs:**
- Availability Check: `http://localhost:8000/api/v1/availability/check/`
- Twilio Webhook: `http://localhost:8000/api/webhooks/twilio/whatsapp/`

---

## ⚙️ Setup Instructions

### 1. Install Twilio SDK

```bash
pip install twilio
```

Add to `requirements.txt`:
```
twilio==8.10.0
```

### 2. Configure Twilio Account

1. Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. Get Account SID and Auth Token from dashboard
3. Enable WhatsApp messaging (sandbox or production)
4. Get WhatsApp-enabled phone number

### 3. Set Environment Variables

```bash
# .env or docker-compose.yml
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Configure Twilio Webhook

In Twilio Console:
1. Go to WhatsApp Sandbox Settings (or your WhatsApp number)
2. Set "When a message comes in" webhook URL:
   ```
   https://yourdomain.com/api/webhooks/twilio/whatsapp/
   ```
3. Method: POST
4. Save

### 5. Test Webhook Locally (Development)

Use ngrok to expose local server:
```bash
ngrok http 8000
```

Set Twilio webhook to:
```
https://your-ngrok-url.ngrok.io/api/webhooks/twilio/whatsapp/
```

---

## 🧪 Testing Guide

### Test 1: Gallery Modal

1. Open frontend
2. View a property recommendation card
3. Click "Photos" button
4. Verify:
   - ✅ Full-screen gallery opens
   - ✅ Can navigate between images
   - ✅ Thumbnails display at bottom
   - ✅ Counter shows "X / Y"
   - ✅ Escape key closes gallery
   - ✅ Click outside closes gallery

### Test 2: Info Modal

1. Click "Info" button on a card
2. Verify:
   - ✅ Modal opens with property details
   - ✅ Shows bedrooms, bathrooms, size
   - ✅ Displays amenities list
   - ✅ Shows rating if available
   - ✅ Location and price visible
   - ✅ Scroll works for long content
   - ✅ Close button works

### Test 3: Availability Check (Full Flow)

**Prerequisites:**
- Twilio account configured
- WhatsApp sandbox enabled
- Agent phone number in database

**Steps:**

1. **Frontend Test:**
   ```bash
   # Open browser console
   # Click "Check" button on a card
   # Should see: POST /api/v1/availability/check/
   ```

2. **Backend Test:**
   ```bash
   # Check logs
   docker compose logs web | grep "Availability check initiated"

   # Expected:
   # Availability check initiated: user=john, listing=123, agent_phone=+123..., thread_id=9814114a...
   ```

3. **Agent Receives WhatsApp:**
   ```
   🏠 Availability Check Request

   Property: 2BR Apartment
   User: John Doe
   Listing ID: 123

   Please reply:
   ✅ YES if available
   ❌ NO if unavailable
   ```

4. **Agent Responds (WhatsApp):**
   ```
   Yes, available
   ```

5. **Webhook Test:**
   ```bash
   # Check webhook logs
   docker compose logs web | grep "Twilio Webhook"

   # Expected:
   # [Twilio Webhook] Received WhatsApp message: from=whatsapp:+123..., body=Yes, available
   # [Twilio Webhook] Injected system message to thread 9814114a...
   ```

6. **Frontend Receives Update:**
   ```
   Browser console shows:
   [ChatPage] WebSocket message received: {
     type: 'chat_message',
     event: 'assistant_message',
     payload: {
       text: '✅ Great news! The property is available...'
     }
   }
   ```

7. **User Sees:**
   ```
   ✅ Great news! The agent confirmed this property is available.
   Would you like to proceed with a reservation?
   ```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│                                                              │
│  [Recommendation Card]                                       │
│     ├─ [View Photos] → GalleryModal                         │
│     ├─ [View Info] → InfoModal                              │
│     └─ [Check Availability]                                  │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│                                                              │
│  POST /api/v1/availability/check/                           │
│  { listing_id: "123" }                                      │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Django REST API)                   │
│                                                              │
│  availability.py::check_availability()                       │
│    1. Get listing & agent phone                             │
│    2. Format WhatsApp message                               │
│    3. Send via Twilio                                       │
│    4. Store agent_phone→thread_id in cache                  │
│    5. Return 202 Accepted                                   │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  TWILIO WHATSAPP API                         │
│                                                              │
│  Sends WhatsApp message to agent                            │
│  "🏠 Availability Check Request..."                         │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT (WhatsApp)                          │
│                                                              │
│  Receives message                                           │
│  Replies: "Yes, available"                                  │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              TWILIO WEBHOOK CALLBACK                         │
│                                                              │
│  POST /api/webhooks/twilio/whatsapp/                        │
│  { From: "whatsapp:+123...", Body: "Yes, available" }      │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND (Webhook Handler)                          │
│                                                              │
│  twilio_webhook.py::twilio_whatsapp_webhook()               │
│    1. Parse agent response (yes/no)                         │
│    2. Look up thread_id from cache                          │
│    3. Generate chat message                                 │
│    4. Trigger Celery task                                   │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              CELERY TASK (Async)                            │
│                                                              │
│  inject_system_message_to_chat(thread_id, message)          │
│    1. Create message in database                            │
│    2. Format as WebSocket frame                             │
│    3. Send to thread group                                  │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            WEBSOCKET (Django Channels)                       │
│                                                              │
│  Broadcasts message to frontend                             │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            FRONTEND (React Context)                          │
│                                                              │
│  ChatContext.pushAssistantMessage()                          │
│  Adds message to chat: "✅ Property is available!"          │
│            ↓                                                 │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER SEES RESULT                          │
│                                                              │
│  "✅ Great news! The property is available.                 │
│   Would you like to proceed with a reservation?"            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Considerations

### 1. Webhook Security

**Current:** Webhook is AllowAny (Twilio doesn't send auth headers)

**Recommended:** Validate Twilio signatures
```python
from twilio.request_validator import RequestValidator

def validate_twilio_request(request):
    validator = RequestValidator(os.getenv('TWILIO_AUTH_TOKEN'))
    signature = request.META.get('HTTP_X_TWILIO_SIGNATURE', '')
    url = request.build_absolute_uri()
    return validator.validate(url, request.POST, signature)
```

### 2. Rate Limiting

Add rate limiting to availability check endpoint:
```python
@ratelimit(key='user', rate='5/h', method='POST')
def check_availability(request):
    ...
```

### 3. Cache Security

Ensure cache keys are unique and unpredictable. Current implementation uses agent phone number which is semi-predictable. Consider adding random nonce:
```python
cache_key = f"availability_check:{agent_phone}:{uuid.uuid4()}"
```

---

## 🐛 Troubleshooting

### Issue: WhatsApp Message Not Sent

**Symptoms:**
```
Failed to send WhatsApp message for listing 123
```

**Check:**
1. Twilio credentials configured correctly
2. WhatsApp number in E.164 format (+country code)
3. Twilio account has WhatsApp enabled
4. Account has sufficient balance

**Fix:**
```bash
# Test Twilio credentials
docker compose exec web python -c "
from assistant.integrations.twilio_utils import get_twilio_client
client = get_twilio_client()
print('Twilio client:', client)
"
```

### Issue: Webhook Not Receiving Messages

**Symptoms:**
- Agent responds but chat doesn't update

**Check:**
1. Webhook URL configured in Twilio console
2. Webhook URL accessible from internet (use ngrok for local testing)
3. Webhook returns 200 OK

**Debug:**
```bash
# Check webhook logs
docker compose logs web | grep "Twilio Webhook"

# Test webhook manually
curl -X POST http://localhost:8000/api/webhooks/twilio/whatsapp/ \
  -d "From=whatsapp:+1234567890" \
  -d "Body=Yes, available"
```

### Issue: System Message Not Appearing in Chat

**Symptoms:**
- Webhook processes successfully but message doesn't show in frontend

**Check:**
1. WebSocket connection active
2. Thread ID lookup successful
3. Celery task executed

**Debug:**
```bash
# Check Celery logs
docker compose logs celery_chat | grep "System Message"

# Check WebSocket group
docker compose logs web | grep "group_send"

# Check frontend console
# Look for: [ChatPage] WebSocket message received
```

---

## 📈 Future Enhancements

### 1. Booking Flow Integration
- After agent confirms availability, show "Book Now" button
- Pre-fill booking form with property details
- Automatically create booking in database

### 2. Multi-Agent Support
- Handle multiple agents per property
- Round-robin availability checks
- Fallback to secondary agent if primary doesn't respond

### 3. Automated Follow-ups
- If agent doesn't respond within 2 hours, send reminder
- If still no response after 24 hours, mark as unavailable
- Notify user of timeout

### 4. Rich Agent Responses
- Allow agent to send property photos via WhatsApp
- Parse pricing information from agent response
- Extract availability dates from response

### 5. Analytics Dashboard
- Track availability check success rate
- Monitor agent response times
- Measure conversion from check → booking

---

## ✅ Deployment Checklist

- [ ] Install Twilio SDK (`pip install twilio`)
- [ ] Set environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER)
- [ ] Configure Twilio webhook URL
- [ ] Test WhatsApp sending in sandbox
- [ ] Test webhook reception
- [ ] Verify cache is working (Redis configured)
- [ ] Test end-to-end flow in staging
- [ ] Monitor Celery task execution
- [ ] Set up error alerting for webhook failures
- [ ] Document agent phone number requirements in Listing model
- [ ] Train agents on responding to availability checks
- [ ] Deploy to production
- [ ] Monitor success rate for first week

---

## 📚 Related Documentation

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Celery Task Documentation](https://docs.celeryproject.org/)
- `RECOMMENDATION_CARDS_FIXES_APPLIED.md` - Previous fixes
- `RECOMMENDATION_CARDS_DEBUGGING.md` - Debugging guide

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** ✅ Implementation Complete - Ready for Testing
