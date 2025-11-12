# Easy Islanders - Comprehensive Product Overview

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** November 2025

---

## Executive Summary

**Easy Islanders** is an AI-powered marketplace platform designed specifically for communities on island economies. It functions as a multi-domain conversational marketplace where users interact with an intelligent assistant to discover, request, and book products and services across real estate, vehicles, general products, services, and more.

The platform bridges the gap between traditional marketplaces and AI-first applications by using natural language understanding, intent routing, and specialized domain agents to provide conversational commerce experiences tailored to local island economies (Cyprus, Malta, Greek Islands, etc.).

---

## Core Value Proposition

### For Users (Consumers & Buyers)
- **Conversational Discovery**: Search for properties, vehicles, and services using natural language instead of filters
- **One-Stop Marketplace**: Find accommodations, rentals, used vehicles, local services, jobs, and products in a single platform
- **Smart Matching**: AI-powered intent recognition ensures requests reach the right domain experts
- **Real-Time Notifications**: Instant updates on new listings and seller responses via WebSocket
- **Multi-Language Support**: Built-in support for English, Turkish, Russian, Polish, and German

### For Sellers & Businesses
- **Lead Access**: Direct access to qualified customer requests in their category
- **Broadcasting System**: Reach multiple customers at once for hot leads
- **Verified Profiles**: Business profile verification and seller ratings
- **Analytics**: Insights into customer demand and market trends
- **Multi-Category Listings**: Post properties, vehicles, services, and products in one platform

### For the Platform
- **Scalable Architecture**: Event-driven, multi-agent system with clear boundaries
- **Data-Driven Routing**: ML-powered intent classification with 92%+ accuracy
- **Production Observability**: Prometheus metrics, Grafana dashboards, structured logging
- **Real-Time Synchronization**: WebSocket-based chat for instant message delivery
- **Multi-Tenant Ready**: Support for different island communities with localized content

---

## Technical Architecture

### Technology Stack

**Backend:**
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL with pgvector for semantic search
- **Task Queue**: Celery + Redis for async operations
- **Vector DB**: Zep Cloud for conversation memory and context
- **AI/LLM**: OpenAI API for intent classification and response generation
- **Real-Time**: Django Channels + WebSocket for live chat
- **Observability**: Prometheus + Grafana + OpenTelemetry

**Frontend:**
- **Framework**: React 18.x with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Context API with custom hooks
- **HTTP Client**: Axios with JWT interceptors
- **Real-Time**: Native WebSocket with automatic reconnection
- **Testing**: Jest + Playwright for E2E tests

**Infrastructure:**
- **Containerization**: Docker + Docker Compose
- **Deployment**: Railway/Fly.io (staging), optional Kubernetes (production)
- **CI/CD**: GitHub Actions with automated testing gates
- **Monitoring**: Prometheus scraping, Grafana dashboards, custom alerting

---

## Product Architecture

### High-Level System Flow

```
User Input (Chat)
    ↓
Intent Parser & Router
    ↓
Domain Agent Selection
    ├─ Real Estate Agent
    ├─ Booking Agent
    ├─ Knowledge Agent
    └─ General Request Agent
    ↓
Tool Execution & Database Queries
    ↓
Response Generation
    ↓
WebSocket Broadcast to Client
    ↓
Message History & Memory
```

### Core Components

#### 1. **Intent Router** (`router_service/`)
**Purpose**: Classify user utterances to determine intent domain

**Key Features:**
- **Supervised Classification**: scikit-learn logistic regression trained on labeled router events
- **Probability Calibration**: Platt scaling ensures confidence scores reflect true accuracy
- **Governance Guardrails**: Automatic clarification for low-confidence predictions (< 0.7)
- **Multi-Domain Support**:
  - `real_estate` - Property search, rental inquiries
  - `booking` - Booking management
  - `general` - Misc queries, knowledge questions
  - `out_of_scope` - Unrelated requests

**Metrics:**
- Router accuracy ≥ 92% on test corpus
- p95 latency < 120ms
- Expected Calibration Error (ECE) ≤ 0.05

#### 2. **Real Estate Agent** (`assistant/agents/real_estate/`)
**Purpose**: Handle property searches and rental inquiries with tenure awareness

**Key Features:**
- **Tenure Awareness**: Explicitly handles short-term (nightly) and long-term (monthly) rentals
- **DB-Backed Search**: Queries PostgreSQL with composite indexes
- **Availability Checking**: Validates nightly availability for short-term rentals
- **Tool-First Design**: Uses deterministic database queries instead of LLM hallucination
- **Structured Responses**: Returns listings with images, amenities, pricing, and contact info

**Workflow:**
1. Parse user intent (property search)
2. Extract slots: tenure, city, bedrooms, budget, dates
3. Query real_estate_listing table with filters
4. Format results with availability and images
5. Return structured response for frontend rendering

**Database:**
- `real_estate_listing` - Property listings with tenure field
- `real_estate_availability` - Nightly calendar for short-term properties

#### 3. **Booking System** (`bookings/`)
**Purpose**: Manage short-term and long-term bookings end-to-end

**Key Features:**
- **Dual Booking Types**: Supports both nightly (vacation) and monthly (rental agreements) bookings
- **Availability Validation**: Prevents double-booking with overlap detection
- **Status Workflow**: pending → confirmed → completed/cancelled
- **Webhook Support**: Payment processors and Twilio agents can update status
- **Frontend Integration**: Beautiful cards with calendar picker, image gallery, modals

**API Endpoints:**
- `POST /api/shortterm/bookings/` - Create short-term booking
- `POST /api/longterm/bookings/` - Create long-term booking
- `POST /api/shortterm/check-availability/` - Validate date range
- `GET /api/bookings/my-bookings/` - User's booking history
- `POST /api/bookings/status-webhook/` - Payment/external status updates

#### 4. **Assistant Supervisor** (`assistant/brain/supervisor_graph.py`)
**Purpose**: Orchestrate multi-step conversations and route to specialized agents

**Architecture:**
- **Langgraph State Machine**: Explicit states (RECEIVE, ROUTE, EXECUTE, RESPOND)
- **Router Integration**: Multi-intent detection with fallback to general agent
- **Context Management**: Conversation history via Zep Cloud
- **Token Budget**: Tracks context window usage to prevent overflow
- **Lifecycle Management**: Handles conversation initialization, persistence, cleanup

**Agent Dispatch Logic:**
- Intent = `real_estate` → Real Estate Agent
- Intent = `booking` → Booking Agent
- Intent = `general` → General Knowledge Agent
- Intent = `out_of_scope` → Polite decline with suggestions

#### 5. **WebSocket Chat Engine** (`assistant/consumers.py`)
**Purpose**: Real-time bidirectional chat with authentication and metrics

**Key Features:**
- **HttpOnly JWT Cookies**: XSS-safe authentication
- **Automatic Reconnection**: Exponential backoff + jitter with max 16 retries
- **Duplicate Detection**: Idempotent message processing
- **Connection Pooling**: Efficient Redis-backed channel groups
- **Structured Logging**: Full audit trail of connections and disconnections
- **Client Metrics**: Browser-side latency, reconnection count, message throughput

**Message Types:**
- `chat` - User message input
- `assistant_message` - Agent response with actions
- `chat_status` - Typing indicators, read receipts
- `error` - Error notifications

**Authentication Flow:**
1. Client logs in via `/api/token/` → receives JWT cookie
2. Browser sends cookie with WebSocket handshake
3. Consumer verifies JWT and user ownership of thread
4. Connection established, async reader loop starts
5. Messages broadcast to channel group in real-time

#### 6. **Message & Thread Management** (`assistant/models.py`)
**Purpose**: Persistent storage of conversations and message history

**Models:**
- **ConversationThread**: Grouped messages per conversation (uuid-indexed)
- **Message**: Individual messages with sender/recipient, timestamps, read status
- **DemandLead**: Customer requests broadcast to sellers (legacy)
- **Request**: Generic requests across all domains (PROPERTY, VEHICLE, SERVICE, etc.)

**Key Fields:**
- Thread relationships for conversation grouping
- Message ordering by timestamp
- Read/unread status for notification triggers
- Agent attribution for proper credit/analytics
- Structured metadata for domain-specific needs

#### 7. **Authentication & Authorization** (`users/models.py`, `easy_islanders/auth/`)
**Purpose**: Secure user management with role-based access control

**Features:**
- **User Types**: Consumer, Business, Seller
- **Business Profiles**: Company info, verification status, category specialization
- **User Preferences**: Language, currency, timezone, notification settings
- **JWT Cookies**: HttpOnly, Secure, SameSite=Lax for CSRF protection
- **Token Refresh**: Automatic refresh loop with grace period
- **Permission Framework**: Django permissions for broadcast, moderation, etc.

**Endpoints:**
- `POST /api/token/` - Login with username/password
- `POST /api/token/refresh/` - Refresh expired tokens
- `GET /api/auth/status/` - Check authentication
- `POST /api/logout/` - Clear cookies
- `GET/PUT /api/auth/profile/` - User profile management
- `GET/PUT /api/auth/preferences/` - User settings

#### 8. **Listings & Categories** (`listings/models.py`)
**Purpose**: Flexible product/service catalog with schema-driven fields

**Models:**
- **Category**: Top-level categories (Real Estate, Vehicles, Services, etc.) with JSON schema
- **SubCategory**: Nested categories (Apartments, SUVs, Plumbing, etc.)
- **Listing**: Seller-created product/service with dynamic fields
- **SellerProfile**: Business profile with verification status
- **Image**: Listing images for galleries

**Key Features:**
- **JSON Schema Support**: Categories define their own field structure
- **Dynamic Fields**: Listings store flexible attributes based on category
- **Image Gallery**: Multi-image support with URL storage
- **Category-Specific Bookability**: Some categories support booking, others don't
- **Seller Verification**: Admin approval for business profiles

#### 9. **Observability Stack**

**Prometheus Metrics:**
- Router: `router_requests_total`, `router_confidence_histogram`, `router_calibration_ece`
- WebSocket: `ws_closes_total`, `ws_duration_seconds`, `ws_message_rate`
- RE Agent: `agent_re_requests_total`, `agent_re_execution_seconds`, `agent_re_results_count`
- General: HTTP request/response times, database query latency, error rates

**Grafana Dashboards:**
- Router accuracy and calibration trends
- WebSocket connection health
- Message throughput and latency percentiles
- Agent execution times by domain

**Structured Logging:**
- JSON logs with timestamp, level, message, context
- Router events with prediction, confidence, ground truth
- WebSocket events with connection ID, user ID, code/reason
- Agent execution with input, output, execution time

**OpenTelemetry:**
- Distributed tracing for multi-service requests
- Span creation for router, agent, database operations
- Context propagation through async queues

---

## Feature Modules

### Real Estate & Booking

**Short-Term Rentals (Nightly)**
- Vacation apartments, villas, studios
- Pricing per night (£60-£500/night typical)
- 90-day forward calendar
- Min stay requirements (e.g., 3+ nights)
- Instant availability checking

**Long-Term Rentals (Monthly)**
- Residential flats, houses, family homes
- Pricing per month (£650-£1200/month typical)
- Min lease duration (6-12 months)
- Move-in date selection
- No strict availability calendar needed

**Booking Flow:**
1. User searches "2 bed apartment in Kyrenia for a week"
2. Router identifies as real_estate domain
3. RE Agent extracts: tenure=short_term, city=Kyrenia, bedrooms=2, dates
4. Database query with availability filter
5. Results shown with images, amenities, contact info
6. User clicks "Book Now"
7. Availability re-validated, booking created
8. Confirmation sent via email/SMS/WebSocket

**UI Components:**
- `ShortTermRecommendationCard` - Image, date picker, price, amenities, info modal
- `LongTermRecommendationCard` - Move-in date, lease term, monthly price
- Calendar picker with availability visualization
- Image gallery with lightbox
- Info modals with full property details

### Customer Requests & Broadcasts

**Demand Lead System:**
- Customers create requests (e.g., "3BR apartment in Kyrenia")
- Sellers receive notifications of matching requests
- Sellers can respond with offers
- Broadcast to multiple sellers for competitive bidding
- Status tracking: new → broadcasted → responded → closed

**API Contracts:**
- `POST /api/v1/requests/` - Create customer request
- `GET /api/v1/requests/` - List user's requests
- `GET /api/v1/requests/{id}/` - View request details with offers

### Multi-Language Support

**Supported Languages:**
- English (en)
- Turkish (tr) - Important for Cyprus market
- Russian (ru) - Large diaspora
- Polish (pl) - Growing community
- German (de) - European visitors

**Implementation:**
- Query param: `?language=en`
- Request header: `Accept-Language: en-US,tr;q=0.8`
- Response includes localized content
- Frontend auto-detects user preference

### Notifications

**Message Types:**
- New messages in chat (via WebSocket in real-time)
- Seller responses to customer requests
- Booking confirmations
- New listings in favorite categories
- System announcements

**Delivery Channels:**
- WebSocket (real-time, browser)
- Email (batched)
- Push notifications (mobile)
- SMS (critical alerts)

---

## API & Integration Contracts

### REST API Versioning

**Current API Versions:**
- `v1` - Messages, threads, requests (stable)
- `v1.1` - Generic requests across domains (current)
- Future: `v2` - Will maintain backward compatibility

### Authentication Flow

**Cookie-Based JWT (Production)**
```
1. POST /api/token/ → {"ok": true} + Set-Cookie: access=JWT; HttpOnly; Secure; SameSite=Lax
2. Browser auto-sends cookie with all requests
3. POST /api/token/refresh/ → Updates both access and refresh cookies
4. POST /api/logout/ → Clears all cookies
```

**Legacy Header-Based (Development)**
```
Authorization: Bearer <jwt_token>
```

### WebSocket Contract v1.0

**Connection:**
```
ws://api.easyislanders.com/ws/chat/
Authentication: Cookie (access JWT)
```

**Message Envelope:**
```json
{
  "type": "assistant_message|chat|chat_status|error",
  "thread_id": "uuid",
  "agent": "real_estate|booking|general",
  "timestamp": "ISO-8601",
  "payload": {...}
}
```

**Example: Real Estate Response**
```json
{
  "type": "assistant_message",
  "thread_id": "abc-123",
  "agent": "real_estate",
  "timestamp": "2025-11-10T15:00:00Z",
  "payload": {
    "reply": "I found 3 properties in Kyrenia matching your criteria:",
    "actions": [{
      "type": "show_listings",
      "params": {
        "listings": [
          {
            "id": "listing-uuid",
            "title": "Modern 2BR Apartment",
            "area": "Kyrenia",
            "price": "£120/night",
            "images": ["url1", "url2"],
            "amenities": ["WiFi", "Kitchen", "Pool"]
          }
        ],
        "tenure": "short_term"
      }
    }],
    "metadata": {
      "search_time_ms": 45,
      "results_count": 3,
      "filters_applied": ["tenure", "city", "bedrooms", "price"]
    }
  }
}
```

### Complete API Endpoint Reference

**Authentication:**
- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh tokens
- `GET /api/auth/status/` - Check auth
- `POST /api/logout/` - Logout

**Users:**
- `GET /api/auth/profile/` - User profile
- `PUT /api/auth/profile/` - Update profile
- `GET /api/auth/preferences/` - User preferences
- `PUT /api/auth/preferences/` - Update preferences

**Chat & Messages:**
- `POST /api/chat/` - Send chat message (legacy)
- `GET /api/v1/messages/` - List messages with filtering
- `GET /api/v1/messages/unread-count/` - Unread count
- `POST /api/v1/messages/{thread_id}/read_status/` - Mark as read

**Router (Direct):**
- `POST /api/route/` - Classify intent (admin/debug)
- `GET /api/metrics/` - Prometheus metrics

**Real Estate:**
- `POST /api/shortterm/bookings/` - Book short-term
- `POST /api/longterm/bookings/` - Book long-term
- `POST /api/shortterm/check-availability/` - Check dates
- `GET /api/bookings/my-bookings/` - User bookings

**Listings & Categories:**
- `GET /api/categories/` - List categories
- `GET /api/listings/` - List listings (with filters)
- `POST /api/listings/` - Create listing (seller)
- `GET /api/listings/{uuid}/` - Get listing details

**Requests (Customer):**
- `GET /api/v1/requests/` - List user requests
- `POST /api/v1/requests/` - Create request
- `GET /api/v1/requests/{uuid}/` - View request with offers

---

## Security Architecture

### Authentication & Authorization

**Security Model:**
- HttpOnly cookies prevent XSS attacks
- SameSite=Lax cookies prevent CSRF
- Secure flag ensures HTTPS-only in production
- Token expiry (15 min access, 7-day refresh)
- Refresh token rotation on each refresh

**User Roles:**
- Anonymous - Can browse listings, read public content
- Consumer - Can search, create requests, make bookings
- Business - Can create listings, broadcast to leads
- Admin - Full platform management, metrics, moderation

### Data Security

**PII Handling:**
- Email redacted in logs, hashed in storage
- Phone numbers encrypted in transit, never in logs
- Addresses geocoded to coordinates, redacted
- Payment info never stored (Stripe/PayPal integration ready)

**Data Retention:**
- Chat messages: 90 days
- User data: Until account deletion
- Analytics: 1 year
- Logs: 30 days

**Database:**
- PostgreSQL with encrypted connections
- Row-level security for user data
- Parameterized queries prevent SQL injection
- pgvector extension for semantic search

### API Security

**Rate Limiting:**
- Auth endpoints: 5 req/min per IP
- Chat: 100 req/min per user
- Listings: 50 req/min per user
- Uploads: 10 req/min per user

**CORS:**
- Frontend domain(s) explicitly whitelisted
- Credentials allowed with cookies
- Preflight caching enabled

**Content Security Policy:**
- Script-src self + CDNs (tailwind, react)
- Img-src self + image CDN
- Default-src self (restrictive)

---

## Performance Characteristics

### Latency Targets

**Chat/Message Operations:**
- WebSocket message delivery: < 200ms (p95)
- HTTP API response: < 500ms (p95)
- Database query: < 100ms (p95)

**Search Operations:**
- Intent router classification: < 120ms (p95)
- Property search query: < 150ms (p95)
- Availability check: < 100ms (p95)

**Scaling Limits:**
- WebSocket connections: 10k+ per server
- Database: PostgreSQL with pgvector on 2-4 cores
- Redis: Message queue + caching
- Celery: Async tasks (email, SMS, webhooks)

### Database Performance

**Key Indexes:**
- real_estate_listing:
  - `(tenure, city, bedrooms, price_amount)` - Main search path
  - `(tenure, available_from, city)` - Long-term move-in queries
- listings_listing:
  - `(category, status, created_at)` - Category browse
  - `(seller_id, status)` - Seller inventory
- auth_user:
  - `(email)` - Login lookups
  - `(is_active)` - Active user counts

**Query Optimization:**
- Composite indexes cover most common queries
- Connection pooling via pgbouncer
- Query result caching in Redis where applicable

---

## Deployment & Operations

### Environment Targets

**Staging:**
- Railway or Fly.io
- PostgreSQL 14+ with pgvector
- Redis for caching
- Auto-deploy on `main` branch
- 24-hour soak testing before production

**Production:**
- Kubernetes or containerized VPS
- High-availability PostgreSQL cluster
- Redis cluster for caching
- CDN for static assets and images
- Monitoring: Prometheus + Grafana
- Logging: ELK or CloudWatch
- Alerting: PagerDuty integration

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Schema migrations tested on staging
- [ ] Performance benchmarks pass (latency, throughput)
- [ ] Security review complete
- [ ] Documentation updated

**Deployment:**
- [ ] Feature flags disabled for new features
- [ ] Canary rollout: 10% → 50% → 100%
- [ ] Monitor error rates and latency
- [ ] Health checks passing
- [ ] Smoke tests successful

**Post-Deployment:**
- [ ] 24-hour monitoring window
- [ ] User feedback collection
- [ ] Metrics validation against SLOs
- [ ] Rollback plan ready

---

## Development Workflow

### Local Setup

```bash
# Clone and install dependencies
git clone https://github.com/templeobijnr/easy_islanders_project
cd easy_islanders_project

# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_intent_exemplars
python manage.py populate_categories

# Frontend
cd frontend && npm ci && npm start

# Start services
python manage.py runserver
celery -A easy_islanders worker -l info
```

### Testing Strategy

**Unit Tests:**
- Django models and serializers
- Router classification logic
- Agent tool functions
- Frontend components (Jest)

**Integration Tests:**
- Chat flow end-to-end
- Real estate search with availability
- Booking creation and confirmation
- WebSocket message routing

**E2E Tests:**
- User registration → listing creation → search
- Customer request → seller response → booking
- WebSocket connection → message delivery → reconnection
- Full marketplace flow

**Performance Tests:**
- Router latency under load (1000 RPS)
- WebSocket message throughput
- Database query optimization
- Memory leaks under sustained connections

### CI/CD Pipeline

**GitHub Actions:**
- On every PR: Unit tests, lint, type check
- Gate B: WebSocket dependency validation
- Gate C: Platform hardening checks
- On merge to main: Integration tests, deployment to staging
- Manual approval for production canary/rollout

---

## Business Model & Monetization

### Revenue Streams (Future)

1. **Commission on Bookings**: 5-10% per booking (short-term rentals)
2. **Featured Listings**: £5-20/month to pin properties
3. **Seller Subscriptions**: Tiered plans for broadcast limits, analytics
4. **Premium Membership**: Fast-track customer responses, priority support
5. **Advertising**: Local business listings, sponsored recommendations

### Growth Metrics to Track

- **User Acquisition**: Sign-ups, email verifications, login rate
- **Engagement**: Daily active users, messages per user, search-to-booking conversion
- **Marketplace Health**: Seller-to-buyer ratio, avg response time, satisfaction ratings
- **Financial**: Bookings per day, avg booking value, gross merchandise volume

---

## Roadmap & Future Enhancements

### Q1 2026 (Immediate)
- [ ] Production deployment and 24h soak testing
- [ ] Real estate tenure support fully production-grade
- [ ] Booking confirmations via SMS (Twilio)
- [ ] Email notifications for leads/responses
- [ ] Seller analytics dashboard

### Q2 2026 (Short-Term)
- [ ] Multi-agent system: Real Estate, Vehicles, General Services
- [ ] Car rental agent with insurance/license verification
- [ ] Payment integration (Stripe, PayPal)
- [ ] Reviews and ratings system
- [ ] User recommendations based on search history

### Q3-Q4 2026 (Medium-Term)
- [ ] Expand to additional island communities (Malta, Greek Islands)
- [ ] Mobile app (React Native)
- [ ] Automated seller profiles and onboarding
- [ ] Dynamic pricing for short-term rentals
- [ ] Translation improvements for all 5 languages

### 2027+ (Long-Term)
- [ ] B2B integration for property management companies
- [ ] White-label platform for other island communities
- [ ] Advanced analytics and market insights
- [ ] Fintech integration (escrow, insurance)

---

## Technical Decisions & Trade-Offs

### Why Django + DRF?

**Pros:**
- Mature ecosystem with security batteries included
- Built-in ORM with relationships and transactions
- Admin interface for non-technical operations
- Excellent async support with Channels

**Trade-off:** Heavier than FastAPI, but better for rapid feature iteration and team scale

### Why PostgreSQL + pgvector?

**Pros:**
- Full relational integrity for complex booking logic
- pgvector extension for semantic search without separate DB
- Excellent JSON/JSONB support for flexible schemas
- ACID compliance for financial transactions

**Trade-off:** Less horizontally scalable than NoSQL, but consistency is critical

### Why WebSocket over polling?

**Pros:**
- Real-time message delivery (sub-second latency)
- Reduced bandwidth (single connection vs. repeated requests)
- Better for mobile battery life
- Natural fit for chat/messaging

**Trade-off:** More complex to scale (connection management, stateful servers)

### Why Celery for async?

**Pros:**
- Decouples long-running tasks (email, webhooks, LLM calls)
- Reliable message delivery with retries
- Built-in rate limiting and scheduling

**Trade-off:** Additional infrastructure (Redis), complexity for small deployments

### Why Zep Cloud for memory?

**Pros:**
- Conversation history without custom implementation
- Semantic search over messages
- No local vector DB to maintain
- Easy multi-tenant isolation

**Trade-off:** External dependency, requires API key, cost per token

---

## Monitoring & Alerting

### Key SLOs (Service Level Objectives)

**Availability:** 99.5% uptime
**Latency:** p95 < 500ms for API endpoints, p95 < 200ms for WebSocket
**Error Rate:** < 0.5% of requests
**Chat Delivery:** 99.9% of messages delivered within 5 seconds

### Critical Alerts

- [ ] Error rate spike (> 1%)
- [ ] P95 latency > 1 second
- [ ] WebSocket connection failures (> 5 simultaneous)
- [ ] Database connection pool exhaustion
- [ ] Memory usage > 80%
- [ ] Disk space < 10% free
- [ ] Router accuracy drop (< 90%)
- [ ] Zep Cloud API unavailable

### Dashboards

**Real-Time Operations:**
- WebSocket connection count and latency
- HTTP request rate and error codes
- Router accuracy and confidence distribution
- Database query performance
- Celery task queue depth

**Business Metrics:**
- Active users and DAU/MAU
- Messages per minute
- Bookings per day
- Seller response time
- Customer satisfaction score

---

## Glossary & Key Concepts

| Term | Definition |
|------|-----------|
| **Tenure** | Rental duration type: `short_term` (nightly) or `long_term` (monthly) |
| **DemandLead** | Customer request broadcast to multiple sellers for competitive bidding |
| **Request** | Generic customer request across domains (v1.1 API) |
| **Thread** | Conversation grouping for a user-to-assistant interaction |
| **ConversationThread** | Database model storing thread metadata and relationship to messages |
| **Agent** | Specialized handler for a domain (Real Estate, Booking, General) |
| **Router** | Intent classifier that directs user input to the right agent |
| **Slot** | Extracted parameter from user input (city, bedrooms, budget, dates) |
| **Tool** | Function called by agent (e.g., search_properties, check_availability) |
| **Action** | Frontend directive (show_listings, open_calendar, request_phone) |
| **Availability** | Nightly booking calendar for short-term rentals |
| **SellerProfile** | Business account with verification and category specialization |
| **Listing** | Product/service published by a seller |
| **Booking** | Customer reservation of a listing (status: pending→confirmed) |

---

## Support & Troubleshooting

### Common Issues

**WebSocket Connection Fails**
- Check JWT cookie in browser → ensure not expired
- Check server logs for auth errors → refresh token
- Verify firewall allows WebSocket (port 8000/8001)
- Check Redis connectivity for channel layer

**Router Mislassifies Intent**
- Add to router_eval_corpus.json with correct label
- Run `python manage.py update_calibration_params`
- Monitor router_calibration_ece metric
- Review router confidence distribution histogram

**Booking Availability Check Fails**
- Ensure real_estate.Availability records exist (run seed_listings)
- Check for date range overlap with existing bookings
- Verify tenure field matches query (short_term vs long_term)
- Check database indexes are created

**Chat Messages Don't Appear**
- Check WebSocket connected status in browser console
- Verify message was sent (check network tab)
- Check server Celery worker is running for async tasks
- Look for 403 errors in consumer logs (auth issue)

---

## Contact & Resources

**Repository:** https://github.com/templeobijnr/easy_islanders_project

**Documentation:**
- [README.md](README.md) - Quick start and router demo
- [API_CONTRACTS.md](API_CONTRACTS.md) - Complete API reference
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Database initialization
- [BOOKING_SYSTEM.md](BOOKING_SYSTEM.md) - Booking flow details
- [REAL_ESTATE_APP_SETUP.md](REAL_ESTATE_APP_SETUP.md) - RE data model

**Testing Commands:**
```bash
# Run all tests
pytest

# Router evaluation
python scripts/eval_router.py --corpus scripts/router_eval_corpus.json

# Seed data
python manage.py seed_listings
python manage.py populate_categories

# WebSocket demo
curl -X POST http://127.0.0.1:8000/api/route/ \
  -H "Authorization: Bearer <token>" \
  -d '{"utterance":"2br apartment in kyrenia"}'
```

---

**Last Updated:** November 2025  
**Status:** Production-Ready for Staging Deployment
