# Easy Islanders - Frontend-Backend API Contracts

## Overview

This document defines the complete API contracts between the Easy Islanders frontend and backend, including request/response schemas, authentication, error handling, and versioning strategies.

---

## 🔐 Authentication & Authorization

### JWT Token Management
```javascript
// Frontend: Automatic token inclusion via axios interceptor
// Backend: IsAuthenticated permission required for protected endpoints

// Token Storage
localStorage.setItem('token', response.data.token);
localStorage.setItem('refresh', response.data.refresh);

// Automatic Authorization Header
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints
```javascript
// POST /api/auth/register/
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "user_type": "consumer|seller"
}
// Response: { "token": "string", "refresh": "string", "user": {...} }

// POST /api/auth/login/
{
  "username": "string",
  "password": "string"
}
// Response: { "token": "string", "refresh": "string", "user": {...} }

// GET /api/auth/status/
// Response: { "authenticated": boolean, "user": {...} }
```

---

## 💬 Chat & Messaging API

### Main Chat Endpoint
```javascript
// POST /api/chat/
{
  "message": "string",
  "language": "en|tr|ru|pl|de",
  "conversation_id": "uuid",
  "thread_id": "uuid" // optional
}
// Response: {
//   "response": "string",
//   "language": "string",
//   "conversation_id": "uuid",
//   "thread_id": "uuid",
//   "recommendations": [...],
//   "requires_phone": boolean,
//   "notifications": [...]
// }
```

### F.3 Messages API (V1 Contract)
```javascript
// GET /api/v1/messages/
// Query: ?page=1&limit=20&type=broadcast_request&thread_id=uuid&is_unread=true
// Response: {
//   "items": [
//     {
//       "id": "uuid",
//       "thread_id": "uuid",
//       "message_type": "broadcast_request|seller_response|user|assistant|system",
//       "content": "string",
//       "sender": {...},
//       "recipient": {...},
//       "is_unread": boolean,
//       "created_at": "timestamp",
//       "read_at": "timestamp"
//     }
//   ],
//   "unread_count": number,
//   "next": "url",
//   "previous": "url"
// }

// GET /api/v1/messages/unread-count/
// Response: { "unread_count": number, "last_updated": "timestamp" }

// POST /api/v1/messages/{thread_id}/read_status/
// Response: { "success": true }

// GET /api/v1/threads/
// Query: ?page=1&limit=20
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "title": "string",
//       "last_message": {...},
//       "unread_count": number,
//       "created_at": "timestamp",
//       "updated_at": "timestamp"
//     }
//   ],
//   "page": number,
//   "limit": number,
//   "has_next": boolean
// }
```

---

## 🏠 Listings API

### Listing Management
```javascript
// GET /api/listings/
// Query: ?category=string&location=string&page=1
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "title": "string",
//       "description": "string",
//       "price": number,
//       "location": "string",
//       "category": "string",
//       "images": [...],
//       "features": [...],
//       "availability": {...},
//       "created_at": "timestamp"
//     }
//   ],
//   "page": number,
//   "has_next": boolean
// }

// POST /api/listings/
{
  "title": "string",
  "description": "string",
  "price": number,
  "location": "string",
  "category": "string",
  "features": [...],
  "images": [...]
}
// Response: { "id": "uuid", "status": "draft|published" }

// GET /api/listings/{uuid}/
// Response: { "id": "uuid", "title": "string", ... }

// POST /api/listings/{uuid}/upload-image/
// FormData: { "image": File }
// Response: { "id": "uuid", "url": "string" }

// POST /api/listings/{uuid}/publish/
// Response: { "status": "published", "published_at": "timestamp" }
```

### Listing Categories
```javascript
// GET /api/categories/
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "name": "string",
//       "slug": "string",
//       "description": "string",
//       "icon": "string"
//     }
//   ]
// }

// GET /api/categories/{slug}/subcategories/
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "name": "string",
//       "slug": "string",
//       "parent": "uuid"
//     }
//   ]
// }
```

---

## 📅 Booking API

### Booking Management
```javascript
// POST /api/bookings/
{
  "listing_id": "uuid",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "message": "string",
  "contact_info": {
    "name": "string",
    "email": "string",
    "phone": "string"
  }
}
// Response: {
//   "id": "uuid",
//   "status": "pending|confirmed|cancelled",
//   "booking_reference": "string",
//   "created_at": "timestamp"
// }

// GET /api/bookings/user/
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "listing": {...},
//       "start_date": "YYYY-MM-DD",
//       "end_date": "YYYY-MM-DD",
//       "status": "string",
//       "created_at": "timestamp"
//     }
//   ]
// }

// POST /api/bookings/{booking_id}/status/
{
  "status": "confirmed|cancelled"
}
// Response: { "status": "string", "updated_at": "timestamp" }

// GET /api/listings/{uuid}/availability/
// Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Response: {
//   "available_dates": [...],
//   "booked_dates": [...],
//   "time_slots": [...]
// }
```

---

## 🤖 Agent & AI API

### Agent Search
```javascript
// POST /api/agent/search/
{
  "query": "string",
  "category": "string",
  "location": "string",
  "language": "string"
}
// Response: {
//   "results": [...],
//   "search_metadata": {...},
//   "agent_response": "string"
// }

// GET /api/agent/requests/
// Response: {
//   "results": [
//     {
//       "id": "uuid",
//       "query": "string",
//       "status": "pending|processing|completed",
//       "results": [...],
//       "created_at": "timestamp"
//     }
//   ]
// }

// POST /api/agent/requests/create/
{
  "query": "string",
  "category": "string",
  "location": "string",
  "contact_info": {...}
}
// Response: { "id": "uuid", "status": "pending" }
```

### Recommendations
```javascript
// GET /api/recommendations/
// Query: ?category=string&language=string&location=string
// Response: {
//   "recommendations": [
//     {
//       "id": "uuid",
//       "title": "string",
//       "description": "string",
//       "price": number,
//       "location": "string",
//       "images": [...],
//       "features": [...],
//       "actions": {
//         "view_photos": "url",
//         "request_photos": "url",
//         "book": "url",
//         "contact_agent": "url",
//         "wishlist": "url"
//       }
//     }
//   ],
//   "metadata": {...}
// }
```

---

## 📨 Request Management API

### Customer Requests
```javascript
// GET /api/v1/requests/
// Query: ?status=pending|responded|completed&page=1
// Response: {
//   "items": [
//     {
//       "id": "uuid",
//       "category": "string",
//       "location": "string",
//       "budget_min": number,
//       "budget_max": number,
//       "description": "string",
//       "status": "string",
//       "offers_count": number,
//       "created_at": "timestamp"
//     }
//   ],
//   "total": number
// }

// POST /api/v1/requests/
{
  "category": "string",
  "location": "string",
  "budget_min": number,
  "budget_max": number,
  "description": "string",
  "duration": "string",
  "contact_email": "string",
  "contact_phone": "string",
  "additional_criteria": {...}
}
// Response: {
//   "id": "uuid",
//   "status": "pending",
//   "demand_lead_id": "uuid"
// }

// GET /api/v1/requests/{uuid}/
// Response: {
//   "id": "uuid",
//   "status": "string",
//   "created_at": "timestamp",
//   "offers_count": number,
//   "offers": [...]
// }
```

---

## 🔔 Notifications & Events

### Chat Events
```javascript
// POST /api/chat/events/
{
  "conversation_id": "uuid",
  "event": "typing|read|delivered",
  "data": {...}
}
// Response: { "success": true }

// GET /api/notifications/
// Query: ?conversation_id=uuid
// Response: {
//   "notifications": [
//     {
//       "id": "uuid",
//       "type": "string",
//       "message": "string",
//       "is_read": boolean,
//       "created_at": "timestamp"
//     }
//   ]
// }

// POST /api/notifications/clear/
// Response: { "success": true }
```

---

## 🌐 WebSocket API

### Real-time Communication
```javascript
// WebSocket Connection
const ws = new WebSocket('ws://127.0.0.1:8001/ws/');

// Message Types
{
  "type": "message|notification|typing|read",
  "data": {...},
  "timestamp": "ISO_string"
}

// Authentication
{
  "type": "auth",
  "token": "jwt_token"
}
```

---

## 📊 Error Handling

### Standard Error Response
```javascript
// HTTP Status Codes
200: Success
201: Created
400: Bad Request
401: Unauthorized
403: Forbidden
404: Not Found
422: Validation Error
500: Internal Server Error

// Error Response Format
{
  "error": "string",
  "message": "string",
  "details": {...},
  "code": "ERROR_CODE",
  "timestamp": "ISO_string"
}

// Validation Errors
{
  "error": "Validation failed",
  "details": {
    "field_name": ["error message"],
    "another_field": ["error message"]
  }
}
```

---

## 🔄 Pagination

### Standard Pagination
```javascript
// Query Parameters
?page=1&limit=20&offset=0

// Response Format
{
  "results": [...],
  "page": 1,
  "limit": 20,
  "total": 100,
  "has_next": true,
  "has_previous": false,
  "next": "url",
  "previous": null
}
```

---

## 🌍 Internationalization

### Language Support
```javascript
// Supported Languages
const SUPPORTED_LANGUAGES = ['en', 'tr', 'ru', 'pl', 'de'];

// Language Headers
Accept-Language: en-US,en;q=0.9,tr;q=0.8

// Language Parameters
?language=en&locale=en-US

// Localized Responses
{
  "content": "string",
  "language": "en",
  "locale": "en-US",
  "translations": {
    "tr": "string",
    "ru": "string"
  }
}
```

---

## 🔒 Security & Privacy

### PII Handling
```javascript
// PII Redaction Rules
- Email: redacted in logs, hashed in storage
- Phone: redacted in logs, encrypted in storage
- Address: geocoded to coordinates, redacted in logs
- Payment Info: never stored, PCI compliant

// Data Retention
- Chat messages: 90 days
- User data: until account deletion
- Analytics: 1 year
- Logs: 30 days
```

---

## 📈 Rate Limiting

### Rate Limits
```javascript
// Standard Limits
- Authentication: 5 requests/minute
- Chat: 100 requests/minute
- Listings: 50 requests/minute
- Uploads: 10 requests/minute

// Rate Limit Headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🚀 Versioning Strategy

### API Versioning
```javascript
// URL Path Versioning
/api/v1/messages/     // Current version
/api/v2/messages/     // Future version

// Header Versioning
API-Version: v1
Accept: application/vnd.easyislanders.v1+json

// Backward Compatibility
- Legacy endpoints maintained for 6 months
- Deprecation warnings in response headers
- Migration guides provided
```

---

## 📋 Frontend Integration Examples

### Axios Configuration
```javascript
// Global axios interceptor setup
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication error
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### React Hooks Integration
```javascript
// useThreadManager hook
const { threadId, isLoading, error, refreshThread } = useThreadManager(isAuthenticated);

// useMessages hook
const { messages, unreadCount, markAsRead } = useMessages(threadId);

// useAuth hook
const { isAuthenticated, user, login, logout } = useAuth();
```

---

**Status**: ✅ **COMPREHENSIVE API CONTRACTS DOCUMENTED**

This document provides complete frontend-backend API contracts with request/response schemas, authentication, error handling, and integration examples for the Easy Islanders platform.
