# Messaging Feature: Roadmap Analysis & Implementation Plan

## 🎯 Where Messages Fit in the Roadmap

### Current Project Status
- **Phase Completed**: Phase 0 (Authentication) ✅
- **Phase Completed**: Phase 1 (Create Listing UI) ✅  
- **Current Phase**: Post Phase 1 - Dashboard & Business Features
- **Original Plan**: Phase 2-6 (Multi-Category AI Agent) - *Deferred*

### Messages Feature Classification
**The Messages feature is a PRE-PHASE-2 Business Feature** that bridges:
- ✅ Phase 0-1: Authentication & Listing Creation
- ⏳ Phase 2-6: AI Agent Features (Future)

It's similar to the **Sales Dashboard** - both are **Dashboard Features** that support business operations without requiring the complex AI agent infrastructure.

---

## 📊 Current Architecture vs. What's Needed

### What Already Exists (AI Chat Side)
```
assistant/models.py:
├── Conversation (Chat conversations between user & AI)
├── Message (Individual messages in conversations)
└── Purpose: AI Agent communication

Current Flow:
User → Frontend Chat → Backend Chat Endpoint → AI Agent → Response
```

**Problem**: This is ONE-DIRECTIONAL (user initiates, agent responds)

### What's Missing (Business Messaging)
```
We need a SEPARATE system for:
├── Inbound Messages (customers contacting business)
├── Outbound Replies (business responding to customers)
├── Message Threads (conversations about specific listings)
└── Notification System (unread counts, badges)
```

---

## 📋 Phase 2 (Multi-Category AI Agent) Dependencies

According to `PROJECT_ROADMAP.md`, Phase 1 includes:

**Phase 1, Step 2: "Implement UI-Driven Agent Actions"**
```
- Create backend API endpoints for UI button actions
  ("Contact Agent," "Request Photos")
- Trigger appropriate agent tools
- Log UI-driven events in conversation history
- Files: assistant/views.py, assistant/urls.py
```

**Phase 1, Step 5: "Refine Outbound Messaging & Status Tracking"**
```
- Improve "Request Photos" and "Contact Agent" flows
- Add status field to Message model (pending, sent, delivered, failed)
- Track state of outbound messages via Twilio
- Files: assistant/models.py, assistant/tasks.py, assistant/twilio_client.py
```

**Phase 1, Step 6: "Implement Inbound WhatsApp Image Processing"**
```
- Create webhook endpoint for incoming images from WhatsApp
- Download image from Twilio
- Associate with correct listing
- Update listing state to display new photos
```

---

## 🏗️ Recommended Implementation Plan

### Option A: Build Full Business Messaging Now ⭐ RECOMMENDED
**Timeline**: 1-2 weeks | **Complexity**: Medium | **Impact**: High

```
Fits BETWEEN current state and Phase 2 AI Agent work
├── Creates independent business communication channel
├── Supports listing inquiries from potential customers
├── Prepares database for Phase 2 agent integration
└── Revenue-enabling feature (enables sales)
```

### Option B: Minimal Mock for Dashboard
**Timeline**: 1 day | **Complexity**: Low | **Impact**: Low

```
Current implementation - just displays static mock data
├── Good for UI/UX demonstration
├── Requires full rebuild for real functionality
└── NOT recommended for production
```

---

## 📐 Proposed Data Model for Business Messaging

### New Model: CustomerMessage
```python
class CustomerMessage(models.Model):
    """Messages from customers/buyers to business owners"""
    
    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Relationships
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='received_messages',
        help_text='Business owner receiving the message'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        null=True,
        blank=True,
        help_text='Customer sending message (null if anonymous)'
    )
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='customer_messages',
        null=True,
        blank=True,
        help_text='Associated listing (may be null for general inquiry)'
    )
    
    # Message Content
    subject = models.CharField(
        max_length=255,
        help_text='Message subject/title'
    )
    message = models.TextField(
        help_text='Main message content'
    )
    
    # Contact Info
    sender_name = models.CharField(
        max_length=255,
        help_text='Name of person sending message'
    )
    sender_email = models.EmailField(
        help_text='Email address to reply to'
    )
    sender_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Phone number if provided'
    )
    
    # Status & Tracking
    STATUS_CHOICES = [
        ('unread', 'Unread'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='unread'
    )
    
    is_archived = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    last_reply_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['listing', 'recipient']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender_name} to {self.recipient}"
    
    def mark_as_read(self):
        if self.status == 'unread':
            self.status = 'read'
            self.read_at = timezone.now()
            self.save()
```

### New Model: MessageReply
```python
class MessageReply(models.Model):
    """Replies from business owner to customer messages"""
    
    # Identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Relationships
    message = models.ForeignKey(
        CustomerMessage,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='message_replies',
        help_text='Business owner sending reply'
    )
    
    # Content
    reply = models.TextField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply to message {self.message.id}"
```

### Update Existing Model: Message (Assistant Conversation)
```python
class Message(models.Model):
    """Chat messages within conversations"""
    # ... existing fields ...
    
    # NEW: Add language and context fields if not present
    language = models.CharField(max_length=5, default='en')
    message_context = models.JSONField(
        default=dict,
        blank=True,
        help_text='Context data (listing_id, user_preferences, etc.)'
    )
    
    # This model stays for AI Agent communication
    # NOT used for business-to-customer messaging
```

---

## 🔌 API Endpoints Needed

### For Business Users to View Messages

```
GET /api/business/messages/
- List all customer messages
- Filter: status, listing, date range
- Pagination
- Response: CustomerMessage list with unread count

GET /api/business/messages/{id}/
- Get single message + all replies
- Auto-mark as read

GET /api/business/messages/unread/
- Count unread messages by listing
- Quick dashboard stat

POST /api/business/messages/{id}/reply/
- Send reply to customer message
- Input: reply text
- Auto-update message status to 'replied'

PATCH /api/business/messages/{id}/
- Update status (read, archived)
- Mark as spam

DELETE /api/business/messages/{id}/
- Delete message
```

### For Customers to Send Messages

```
POST /api/customer/messages/
- Send message about a listing (or general inquiry)
- Input: 
  - listing_id (optional)
  - recipient_id (business owner)
  - sender_name, sender_email, sender_phone
  - subject, message content
- Auth: Optional (anonymous or logged-in)
- Response: Confirmation + message_id

GET /api/customer/messages/{id}/conversation/
- View message thread with all replies
- Auth: Must be original sender or admin
```

---

## 🎯 Implementation Steps (1-2 weeks)

### Week 1: Backend Foundation

**Day 1-2: Models & Migrations**
```bash
# 1. Add CustomerMessage and MessageReply models to assistant/models.py
# 2. Update Message model if needed
# 3. Create migration: python manage.py makemigrations
# 4. Run migration: python manage.py migrate
# 5. Add models to admin: assistant/admin.py
```

**Day 3-4: API Endpoints**
```bash
# 1. Create assistant/views_messages.py with 6 endpoints above
# 2. Add URL patterns to assistant/urls.py
# 3. Add serializers to assistant/serializers.py
# 4. Add permission classes for business/customer roles
```

**Day 5: Testing**
```bash
# 1. Write tests for all 6 endpoints
# 2. Test permissions (business can only see their messages)
# 3. Test listing filtering
# 4. Test read/unread status
```

### Week 2: Frontend Integration

**Day 6-7: Update Messages Page**
```javascript
// frontend/src/pages/dashboard/Messages.jsx
// Replace mock data with real API calls:
// 1. Fetch GET /api/business/messages/
// 2. Display real conversations
// 3. Add reply functionality
// 4. Mark as read
```

**Day 8-9: Add Conversation View**
```javascript
// Create frontend/src/pages/dashboard/MessageThread.jsx
// Show single conversation + all replies
// Add reply form
```

**Day 10: Polish & Testing**
```bash
# 1. Test all flows
# 2. Add loading/error states
# 3. Add notifications for new messages
# 4. Add message count badge to sidebar
```

---

## 🔄 Integration with Phase 2 AI Agent

### When Phase 2 Starts:

The Messages system becomes the foundation for:

**Phase 2 Goal**: When "Contact Agent" button is clicked
```
User clicks "Contact Agent" on listing
  ↓
Creates CustomerMessage to business owner
  ↓
AI Agent notified (via webhook)
  ↓
Agent tools use this message as context
  ↓
Agent can generate suggested replies
  ↓
Business owner sees AI-suggested responses in Messages UI
```

**Benefits**:
- ✅ Messages system already exists
- ✅ Database ready for agent integration
- ✅ API ready for agent webhooks
- ✅ Frontend ready for AI suggestions
- ✅ Smooth transition to Phase 2

---

## 💾 Database Schema Summary

```
CustomerMessage (NEW)
├─ id: UUID
├─ recipient: FK(User) - Business owner
├─ sender: FK(User) - Customer (optional)
├─ listing: FK(Listing) - What's being inquired about
├─ subject, message, sender_name, sender_email, sender_phone
├─ status: unread/read/replied/archived
├─ created_at, read_at, last_reply_at

MessageReply (NEW)
├─ id: UUID
├─ message: FK(CustomerMessage)
├─ sender: FK(User) - Business owner replying
├─ reply: Text
├─ created_at

Message (EXISTING - for AI chat)
├─ Used for: User ↔ AI Agent conversations
├─ NOT used for: Customer ↔ Business owner

Conversation (EXISTING - for AI chat)
├─ Used for: AI chat sessions
├─ NOT used for: Business messaging
```

---

## ⚠️ Important Notes

### What NOT to Do
❌ Don't modify existing `Message` or `Conversation` models - they're for AI chat
❌ Don't use AI chat system for customer messages - they're separate concerns
❌ Don't build customer inbox - just business owner inbox for now

### What TO Do
✅ Create new `CustomerMessage` and `MessageReply` models
✅ Build separate API endpoints for business messaging
✅ Keep AI chat system independent
✅ Plan for Phase 2 integration from day 1

---

## 📈 Success Criteria

### Week 1 Backend Complete When:
- [ ] CustomerMessage model created & migrated
- [ ] MessageReply model created & migrated
- [ ] All 6 API endpoints working
- [ ] Tests passing (80%+ coverage)
- [ ] Admin panel shows messages
- [ ] Permissions enforced (business users only see their messages)

### Week 2 Frontend Complete When:
- [ ] Messages page shows real data
- [ ] Can read individual messages
- [ ] Can send replies
- [ ] Mark as read/archived
- [ ] Message count badge shows unread count
- [ ] Performance acceptable (< 1s load time)

---

## 🚀 Recommended Next Steps

### Option 1: Build Full Business Messaging Now
1. Read this document (✅ Done)
2. Review models section above
3. Start Week 1 backend implementation
4. Integrate with frontend after backend done

### Option 2: Keep Mock Version Until Phase 2
1. Keep current mock Messages page
2. Focus on Phase 2 AI Agent first
3. Come back to real messaging later
4. ⚠️ NOT RECOMMENDED - Delays revenue feature

**RECOMMENDATION**: **Choose Option 1** - Business messaging is an independent, revenue-enabling feature that should be built now.
