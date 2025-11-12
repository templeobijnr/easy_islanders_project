# Business Users Comprehensive Guide

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [What Business Users Can Do](#what-business-users-can-do)
3. [User Journey & User Stories](#user-journey--user-stories)
4. [Business User Dashboard](#business-user-dashboard)
5. [Core Features](#core-features)
6. [API Reference](#api-reference)
7. [Dashboard Views & Components](#dashboard-views--components)
8. [Business Profile Management](#business-profile-management)
9. [Monetization & Revenue](#monetization--revenue)
10. [Support & Help](#support--help)

---

## Overview

Easy Islanders provides a **complete seller/business platform** enabling entrepreneurs to list products, services, accommodations, and vehicles across island communities. Business users are merchants, service providers, and property owners who use our platform to reach customers and manage their business operations.

### Key Differentiators

- **Dual User Model:** Consumers vs. Business users with role-based access
- **Multi-Category Support:** Real Estate, Vehicles, Services, Products, Electronics, etc.
- **AI-Powered Matching:** Conversational AI connects customers to relevant vendors
- **Broadcast System:** Receive customer requests and respond in real-time
- **Analytics & Insights:** Dashboard with comprehensive business metrics
- **Booking Management:** Short-term rentals, services, and appointments
- **Reputation System:** Ratings and reviews build trust

---

## What Business Users Can Do

### 1. Create & Manage Listings

**Supported Categories:**
- **Real Estate** - Apartments, villas, hotels, co-working spaces
- **Vehicles** - Cars, motorcycles, boats, scooters (rentals/sales)
- **Services** - Tours, spa, consulting, repairs, catering
- **Products** - Electronics, crafts, apparel, food & beverages
- **Accommodations** - Beach houses, guest houses, resorts
- **Experiences** - Events, classes, workshops

**Listing Capabilities:**
```
✓ Create unlimited listings per account
✓ Upload multiple images (carousel support)
✓ Dynamic fields based on category schema
✓ Flexible pricing (fixed, hourly, daily rates)
✓ Location tagging with GPS coordinates
✓ Inventory management (for products)
✓ Availability calendars (for bookable items)
✓ Feature listings for premium visibility
✓ Bulk listing management
```

### 2. Respond to Customer Requests

**Broadcast System:**
- Receive curated requests from customers
- AI matches customer needs to your expertise
- SMS/Email/WhatsApp notifications
- Quick response interface
- Request filtering by category/urgency

**Request Types:**
- Availability inquiries
- Price quotations
- Booking requests
- Service proposals
- Bulk orders

### 3. Manage Bookings & Reservations

**Booking Types:**
- **Short-term bookings** (days/weeks)
- **Long-term contracts** (months/years)
- **Service appointments** (hourly slots)
- **Experiential bookings** (events/classes)

**Seller Controls:**
```
✓ Confirm/reject booking requests
✓ Set availability calendars
✓ Block dates (maintenance, personal)
✓ Manage pricing tiers
✓ Automated reminders
✓ Cancellation policies
```

### 4. View Analytics & Insights

**Dashboard Metrics:**
- Total views & impressions
- Click-through rates
- Conversion metrics
- Revenue by category
- Customer retention
- Top-performing listings
- Seasonal trends

**Reports:**
- Performance summary (30/60/90 days)
- Revenue trends
- Booking completion rates
- Customer satisfaction scores

### 5. Build Reputation

**Review System:**
- Customer ratings (1-5 stars)
- Verified purchase reviews
- Seller responses to feedback
- Public reputation profile
- Trust badges

**Verification Status:**
- Badge shows verified business status
- Admin verification available
- Certified categories
- Premium tier eligibility

### 6. Communicate with Customers

**Messaging Channels:**
- In-app messaging (real-time)
- Email notifications
- SMS alerts (for key events)
- Automated responses
- Message templates

**Conversation Management:**
- Per-listing message threads
- Customer inquiry history
- Follow-up tracking
- Bulk messaging (to subscribers)

---

## User Journey & User Stories

### User Story 1: Maria (Accommodation Owner)

**Persona:** Portuguese property owner, age 45, tech-savvy

**Goal:** "I want to rent my beachfront villa to tourists and manage all bookings from one place"

**Journey:**
```
1. Sign up as business user
2. Create seller profile with villa details
3. Upload 15+ photos of rooms, amenities, views
4. Set pricing tiers (high/low season)
5. Enable availability calendar (mark block dates)
6. Receive booking requests from platform
7. Confirm bookings, send check-in details
8. View analytics on occupancy rates
9. Respond to customer reviews
10. Upgrade to premium tier for featured listing
```

**Success Metrics:**
- 70% monthly occupancy rate
- 4.8+ star average rating
- 5+ confirmed bookings per month

---

### User Story 2: João (Services Provider)

**Persona:** Local guide & tour operator, age 38

**Goal:** "I want customers to find me for eco-tours and manage group bookings"

**Journey:**
```
1. Register as business (tour company)
2. Create service profile with experience details
3. Add tours as listings with itineraries
4. Set capacity limits and scheduling rules
5. Receive broadcast requests from interested tourists
6. Quote pricing, confirm bookings
7. Manage customer communication
8. Track revenue per tour type
9. Request admin verification badge
10. Build reputation through customer reviews
```

**Success Metrics:**
- 20+ bookings per month
- €5,000+ monthly revenue
- 90%+ customer satisfaction

---

### User Story 3: António (Product Seller)

**Persona:** Artisan craft seller, age 52, limited tech experience

**Goal:** "I want to sell my handmade ceramics to tourists with minimal effort"

**Journey:**
```
1. Sign up (help from family member)
2. Create basic business profile
3. Upload photos of 20 craft items
4. Set competitive pricing
5. Enable automatic broadcast responses
6. Check messages daily on mobile
7. Ship orders to customers
8. Monitor sales dashboard
9. Upgrade photos after first month
10. Apply for merchant badge
```

**Success Metrics:**
- 5-10 sales per week
- €2,000+ monthly revenue
- Page visible in search results

---

### User Story 4: Sofia (Restaurant Owner)

**Persona:** Restaurant owner, age 35, experienced business operator

**Goal:** "I want to offer catering services, table reservations, and event hosting through the platform"

**Journey:**
```
1. Register restaurant as business
2. Create multiple listing types:
   - Dine-in reservations (bookable)
   - Catering services (by quotation)
   - Private events (by inquiry)
3. Upload menu, ambiance photos
4. Set availability/capacity per listing
5. Receive booking requests
6. Manage reservations from dashboard
7. Confirm/modify bookings via SMS
8. Track revenue by service type
9. Respond to customer ratings
10. Promote special events through broadcasts
```

**Success Metrics:**
- 50+ monthly reservations
- €8,000+ catering revenue
- 4.7+ star rating

---

## Business User Dashboard

### Dashboard Architecture

**Location:** `/dashboard` (authenticated route)

**Layout Components:**
```
┌─────────────────────────────────────────────────┐
│          DASHBOARD NAVIGATION SIDEBAR            │
├──────────┬────────────────────────────────────┤
│          │                                      │
│  NAV     │       MAIN CONTENT AREA             │
│          │                                      │
│  Items:  │  - Dynamic based on selected route |
│  ├─ Home │  - Responsive grid/list layouts    │
│  ├─ My   │  - Real-time data updates          │
│  │ List  │  - Action modals & confirmations   │
│  ├─ Book │                                      │
│  │ ings  │                                      │
│  ├─ Ana  │                                      │
│  │ lyt   │                                      │
│  ├─ Mess │                                      │
│  │ ages  │                                      │
│  └─ Sel  │                                      │
│    ler   │                                      │
│    Inbox │                                      │
└──────────┴────────────────────────────────────┘
```

### Dashboard Sections

#### 1. **My Listings** (`/dashboard/my-listings`)

**Purpose:** Manage all product, service, and accommodation listings

**Features:**
- Grid/table view toggle
- Filter by status (active, draft, paused, sold)
- Filter by category
- Search by title/location
- Sort options (newest, oldest, popular, best-rated)
- Bulk actions (publish, pause, delete, feature)

**Listing Card Displays:**
```
┌─────────────────────────────────┐
│  [IMAGE] [STATUS BADGE]         │
├─────────────────────────────────┤
│  Title: "Beachfront Villa..."    │
│  Category: Real Estate           │
│  Price: €150/night              │
│  Location: Praia, Cape Verde    │
│  Views: 234 | Favorites: 12     │
├─────────────────────────────────┤
│  [Edit] [View] [More Options]   │
└─────────────────────────────────┘
```

**Actions per Listing:**
- **Edit:** Modify title, description, images, pricing
- **View:** See public listing
- **Publish/Pause:** Control visibility
- **Feature:** Boost visibility (paid)
- **Delete:** Remove listing
- **Copy:** Duplicate listing
- **Analytics:** View listing-specific metrics

---

#### 2. **Bookings** (`/dashboard/bookings`)

**Purpose:** Manage all booking requests and reservations

**Tabs:**
- **Pending** - New booking requests awaiting confirmation
- **Confirmed** - Active bookings
- **Completed** - Past bookings
- **Cancelled** - Declined/refunded bookings

**Booking Details Card:**
```
┌──────────────────────────────────────┐
│  Booking #12345 | Status: Pending    │
│  Guest: John Smith                   │
│  Check-in: Dec 15, 2025              │
│  Check-out: Dec 22, 2025 (7 nights)  │
│  Total Price: €1,050                 │
│  Contact: john@email.com | +1234567  │
├──────────────────────────────────────┤
│  [Confirm] [Decline] [Message]       │
│  [View Details] [Send Reminder]      │
└──────────────────────────────────────┘
```

**Seller Actions:**
- **Confirm:** Accept booking (triggers payment/deposit)
- **Decline:** Reject with cancellation reason
- **Message:** Direct communication with guest
- **Send Reminder:** 24h, 7d, check-in reminders
- **Modify:** Update dates/pricing (if guest approves)
- **Complete:** Mark booking as finished

---

#### 3. **Seller Inbox** (`/dashboard/seller-inbox`)

**Purpose:** Receive and respond to customer requests (broadcasts)

**Broadcast Request Structure:**
```
REQUEST CARD:
┌──────────────────────────────────────┐
│  📍 BROADCAST REQUEST                │
│  Customer: Maria Silva               │
│  Type: Availability Inquiry          │
│  "Looking for 3BR villa, Dec 20-25"  │
├──────────────────────────────────────┤
│  ✓ Matches your listings             │
│  🏆 High match score (92%)            │
│  ⏰ 2 hours ago | Expires: 24h        │
├──────────────────────────────────────┤
│  [Quick Reply] [View Profile] [Skip] │
└──────────────────────────────────────┘
```

**Response Options:**
1. **Quick Reply** - Pre-templated responses
2. **Send Custom Quote** - Detailed pricing proposal
3. **Request Booking** - Direct booking link
4. **Skip** - Hide for now
5. **Block** - Mark as spam/not relevant

**Features:**
- Request filtering (by category, urgency)
- Response templates
- Auto-reply management
- Conversation history

---

#### 4. **Messages** (`/dashboard/messages`)

**Purpose:** Direct customer communication

**Message Threads:**
```
THREAD LIST:
├─ John Smith (beachfront villa inquiry)
│  Last: "When is available?" - 2h ago
├─ Sofia Restaurant Bookings
│  Last: "Confirmed for 4 people" - 1h ago
└─ Maria Tour Company
   Last: "Can you accommodate 10?" - 3h ago

CONVERSATION VIEW:
┌──────────────────────────────────────┐
│  JOHN SMITH - Beachfront Villa       │
├──────────────────────────────────────┤
│  [His msg] "Is Dec 15 available?"    │
│  [Your reply] "Yes! €150/night..."   │
│  [His msg] "Perfect! Book it now"    │
├──────────────────────────────────────┤
│  [Type reply...]        [Send] [Emoji]
└──────────────────────────────────────┘
```

**Features:**
- Real-time messaging
- Conversation history
- Message templates
- File attachments
- Read receipts
- Search conversations

---

#### 5. **Broadcasts** (`/dashboard/broadcasts`)

**Purpose:** Create and manage marketing broadcasts to customers

**Broadcast Types:**
1. **Promotions** - Limited-time offers
2. **Announcements** - New listings, events
3. **Updates** - Policy changes, maintenance

**Broadcast Creation:**
```
FORM:
┌─────────────────────────────────┐
│ Broadcast Title                 │
│ "50% Off Eco-Tour This Weekend" │
├─────────────────────────────────┤
│ Message Body                    │
│ [Rich text editor]              │
├─────────────────────────────────┤
│ Target Audience                 │
│ ☑ All followers                │
│ ☐ Previous customers            │
│ ☐ Specific locations            │
│ ☐ Specific categories           │
├─────────────────────────────────┤
│ Schedule Send                   │
│ ○ Send now   ○ Schedule for     │
│              [Date/Time]        │
├─────────────────────────────────┤
│ [Preview] [Draft] [Send]        │
└─────────────────────────────────┘
```

**Analytics:**
- Reach (recipients)
- Open rate
- Click-through rate
- Conversion to booking

---

#### 6. **Analytics** (`/dashboard/analytics`)

**Purpose:** Business performance metrics and insights

**Dashboard Sections:**

**A. Summary Cards:**
```
┌──────────┬──────────┬──────────┬──────────┐
│  Views   │ Clicks   │ Bookings │  Revenue │
│   1,234  │   456    │    12    │  €1,800  │
│  ↑ 12%   │  ↑ 8%    │  ↑ 15%   │  ↑ 22%   │
└──────────┴──────────┴──────────┴──────────┘
```

**B. Performance Charts:**
- 30/60/90-day trends
- Revenue by category
- Booking completion rates
- Customer satisfaction
- Seasonal patterns

**C. Insights Section:**
```
💡 Insights & Recommendations

✓ Your top listing "Beachfront Villa" has 
  50% more views than average - consider 
  featuring similar listings.

✗ Your response rate dropped 8%. Quick 
  responses lead to 20% higher booking rates.

⭐ You're in top 10% sellers for customer 
   satisfaction. Maintain this quality!

🚀 Morning bookings peak at 9-11am. 
   Post promotions during this window.
```

**D. Detailed Reports:**
- Export data (CSV, PDF)
- Custom date ranges
- Comparison period analysis
- Forecasting (next 30 days)

---

#### 7. **Sales** (`/dashboard/sales`)

**Purpose:** Revenue and payment management

**Features:**
```
SALES OVERVIEW:
├─ Total Revenue (Period)
├─ Revenue by Listing
├─ Payment Status (Pending/Completed)
├─ Transaction History
├─ Refunds & Chargebacks
├─ Payout Schedule
└─ Tax Reports

TRANSACTION TABLE:
┌─────────┬──────────┬──────────┬──────────┐
│ Date    │ Booking  │ Amount   │ Status   │
├─────────┼──────────┼──────────┼──────────┤
│ Dec 10  │ #12345   │ €1,050   │ Paid     │
│ Dec 8   │ #12344   │ €280     │ Pending  │
│ Dec 5   │ #12343   │ €500     │ Paid     │
└─────────┴──────────┴──────────┴──────────┘
```

---

#### 8. **Business Profile** (`/dashboard/profile`)

**Purpose:** Manage business information and verification

**Profile Sections:**
```
BUSINESS INFO:
├─ Business Name (required)
├─ Category (e.g., Accommodation, Services)
├─ Description
├─ Contact Phone
├─ Website URL
├─ Business Location
└─ Logo/Cover Image

VERIFICATION STATUS:
├─ Verification Badge (pending/verified/rejected)
├─ Admin Notes (if rejected, reason provided)
├─ Documents Required (if any)
└─ Verification History

CERTIFICATIONS:
├─ ISO/Industry Certifications
├─ Licenses (Tourism, Food Safety, etc.)
├─ Affiliation Programs
└─ Badges
```

**Edit Capabilities:**
- All fields editable until verified
- Document uploads
- Logo/image management
- Social media links

---

#### 9. **Help** (`/dashboard/help`)

**Purpose:** Support resources and documentation

**Sections:**
- FAQs by category
- Video tutorials
- Contact support form
- Knowledge base
- Live chat (premium)
- Ticket history

---

## Core Features

### Feature 1: Seller Profile

**Data Model:**
```python
class SellerProfile(models.Model):
    user = OneToOneField(User)
    business_name = CharField(255)
    description = TextField()
    phone = CharField(50)
    email = EmailField()
    website = URLField()
    verified = BooleanField(default=False)
    rating = FloatField(default=0.0)
    total_listings = PositiveIntegerField(default=0)
    ai_agent_enabled = BooleanField(default=True)
    logo_url = URLField()
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Verification Process:**
1. User creates seller profile with business info
2. Admin reviews submission
3. Admin checks:
   - Business name legitimacy
   - Contact info validity
   - Category match
   - Documentation (if required)
4. Approval/Rejection with reason
5. Verification badge displayed on profile

---

### Feature 2: Dynamic Listings

**Flexible Listing Model:**
```python
class Listing(models.Model):
    seller = ForeignKey(SellerProfile)
    owner = ForeignKey(User)
    category = ForeignKey(Category)
    subcategory = ForeignKey(SubCategory)
    
    title = CharField(255)
    description = TextField()
    price = DecimalField(max_digits=12, decimal_places=2)
    currency = CharField(10, default='EUR')
    location = CharField(255)
    latitude = FloatField()
    longitude = FloatField()
    
    # Category-specific fields as JSON
    dynamic_fields = JSONField()
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('sold', 'Sold'),
    ]
    status = CharField(20, choices=STATUS_CHOICES)
    
    views = PositiveIntegerField(default=0)
    is_featured = BooleanField(default=False)
```

**Category Schema Example (Real Estate):**
```json
{
  "fields": [
    {
      "name": "bedrooms",
      "type": "number",
      "label": "Bedrooms",
      "required": true
    },
    {
      "name": "bathrooms",
      "type": "number",
      "label": "Bathrooms"
    },
    {
      "name": "furnished",
      "type": "boolean",
      "label": "Furnished?"
    },
    {
      "name": "amenities",
      "type": "multi-select",
      "label": "Amenities",
      "choices": ["WiFi", "Pool", "Garden", "Parking", "AC"]
    },
    {
      "name": "rental_type",
      "type": "select",
      "label": "Rental Type",
      "choices": ["short_term", "long_term"]
    }
  ]
}
```

---

### Feature 3: Booking System

**Booking Lifecycle:**
```
[Customer Initiates] → [Seller Confirms/Rejects] → [Payment] → 
[Booking Confirmed] → [Check-in] → [Service Delivery] → 
[Check-out] → [Review] → [Completed]
```

**Booking Types:**
```python
class Booking(models.Model):
    listing = ForeignKey(Listing)
    user = ForeignKey(User)
    
    start_date = DateTimeField()
    end_date = DateTimeField()
    total_price = DecimalField()
    
    STATUS_CHOICES = [
        ('pending', 'Awaiting Seller Confirmation'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    status = CharField(20, choices=STATUS_CHOICES)
    
    PAYMENT_STATUS = [
        ('unpaid', 'Not Yet Paid'),
        ('paid', 'Payment Received'),
        ('refunded', 'Refunded'),
    ]
    payment_status = CharField(20, choices=PAYMENT_STATUS)
```

**Seller Controls:**
- **Confirm:** Accept booking, reserve dates
- **Decline:** Reject with reason
- **Modify:** Suggest alternative dates
- **Complete:** Mark finished, request review
- **Refund:** Process cancellation

---

### Feature 4: Review & Rating System

**Review Structure:**
```python
class BookingReview(models.Model):
    booking = ForeignKey(Booking)
    reviewer = ForeignKey(User)
    
    rating = IntegerField(choices=[(1,1), (2,2), (3,3), (4,4), (5,5)])
    title = CharField(255)
    comment = TextField()
    
    is_verified = BooleanField(auto_set_on_completion=True)
    
    # Seller response
    response = TextField(blank=True)
    response_date = DateTimeField(blank=True)
    
    created_at = DateTimeField(auto_now_add=True)
```

**Review Public Display:**
- Verified purchase badge
- Star rating
- Review text and response
- Reviewer name (optional anonymity)
- Helpful vote count

---

### Feature 5: Broadcast System

**Customer Request Broadcasting:**
```
[Customer makes inquiry] → [AI Router analyzes] → 
[Matches to relevant vendors] → [SMS/Email/App Notification] → 
[Vendor responds with quote] → [Customer chooses vendor] → 
[Booking created]
```

**Broadcast Matching Logic:**
- Category match
- Location proximity
- Seller capabilities
- Response rate history
- Rating threshold
- Availability

**Seller Notification:**
```
SMS: "🔔 New Request: Beachfront villa, Dec 15-22. 
      Matches your listing. Respond in 24h to stay visible."

EMAIL: Subject: "New Customer Request - Respond Now"
       - Request details
       - Customer info
       - Direct response link
       - 24h timer

APP: Push notification + in-app card with CTA
```

---

## API Reference

### Authentication

**Base URL:** `https://api.easyislanders.com/api/`

**Headers Required:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

### Seller Profile Endpoints

#### 1. Create Seller Profile

```http
POST /sellers/
Content-Type: application/json
Authorization: Bearer {token}

{
  "business_name": "Beachfront Villas",
  "description": "Luxury vacation rentals",
  "phone": "+238-123-4567",
  "email": "contact@villas.cv",
  "website": "https://villas.cv"
}

Response (201):
{
  "id": "uuid",
  "user": "user-id",
  "business_name": "Beachfront Villas",
  "verified": false,
  "rating": 0.0,
  "total_listings": 0,
  "ai_agent_enabled": true,
  "created_at": "2025-12-01T10:00:00Z"
}
```

#### 2. Get Current Seller Profile

```http
GET /sellers/me/
Authorization: Bearer {token}

Response (200):
{
  "id": "uuid",
  "business_name": "Beachfront Villas",
  "description": "Luxury vacation rentals",
  "phone": "+238-123-4567",
  "email": "contact@villas.cv",
  "website": "https://villas.cv",
  "verified": true,
  "rating": 4.8,
  "total_listings": 12,
  "ai_agent_enabled": true,
  "logo_url": "https://cdn.easyislanders.com/logos/villas.png",
  "created_at": "2025-01-15T00:00:00Z"
}
```

#### 3. Update Seller Profile

```http
PATCH /sellers/me/
Authorization: Bearer {token}

{
  "business_name": "Beachfront Villas Cape Verde",
  "description": "5-star luxury beach accommodations",
  "phone": "+238-123-4567",
  "website": "https://beachfront-villas.cv"
}

Response (200):
{
  "id": "uuid",
  "business_name": "Beachfront Villas Cape Verde",
  ...
}
```

---

### Listings Endpoints

#### 1. Create Listing

```http
POST /listings/
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "3BR Beachfront Villa with Pool",
  "description": "Stunning ocean views, private beach access...",
  "category": "real-estate",
  "subcategory": "vacation-rental",
  "price": 150.00,
  "currency": "EUR",
  "location": "Praia, Cape Verde",
  "latitude": 14.9215,
  "longitude": -23.6133,
  
  "dynamic_fields": {
    "bedrooms": 3,
    "bathrooms": 2,
    "furnished": true,
    "amenities": ["WiFi", "Pool", "Garden", "AC", "Parking"],
    "rental_type": "short_term",
    "max_guests": 6,
    "check_in_time": "15:00",
    "check_out_time": "11:00"
  }
}

Response (201):
{
  "id": "listing-uuid",
  "seller": "seller-uuid",
  "title": "3BR Beachfront Villa with Pool",
  "status": "draft",
  "price": 150.00,
  "currency": "EUR",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-01T10:00:00Z"
}
```

#### 2. Get My Listings

```http
GET /listings/my/
Authorization: Bearer {token}

Query Parameters:
?status=active|draft|paused|sold
?category=real-estate|vehicles|services
?search=villa
?sort=newest|oldest|popular

Response (200):
{
  "listings": [
    {
      "id": "uuid",
      "title": "3BR Beachfront Villa",
      "category": {
        "id": "uuid",
        "name": "Real Estate",
        "slug": "real-estate"
      },
      "price": 150.00,
      "currency": "EUR",
      "status": "active",
      "views": 234,
      "is_featured": false,
      "created_at": "2025-12-01T10:00:00Z"
    }
  ],
  "count": 12
}
```

#### 3. Update Listing

```http
PATCH /listings/{listing_id}/
Authorization: Bearer {token}

{
  "title": "3BR Luxury Beachfront Villa with Pool",
  "price": 175.00,
  "description": "Updated description...",
  "dynamic_fields": {
    "amenities": ["WiFi", "Pool", "Garden", "AC", "Parking", "Spa"]
  }
}

Response (200):
{
  "id": "listing-uuid",
  "title": "3BR Luxury Beachfront Villa with Pool",
  "price": 175.00,
  ...
}
```

#### 4. Delete Listing

```http
DELETE /listings/{listing_id}/
Authorization: Bearer {token}

Response (204): No Content
```

#### 5. Feature Listing

```http
POST /listings/{listing_id}/feature/
Authorization: Bearer {token}

{
  "duration_days": 30  // Premium feature
}

Response (200):
{
  "id": "listing-uuid",
  "is_featured": true,
  "featured_until": "2025-12-31T23:59:59Z"
}
```

---

### Bookings Endpoints

#### 1. Get My Bookings (as Seller)

```http
GET /bookings/
Authorization: Bearer {token}

Query Parameters:
?status=pending|confirmed|completed|cancelled
?role=seller  // Get bookings for your listings
?ordering=-created_at

Response (200):
{
  "results": [
    {
      "id": "booking-uuid",
      "listing": {
        "id": "uuid",
        "title": "3BR Beachfront Villa"
      },
      "user": {
        "id": "uuid",
        "username": "john_smith",
        "email": "john@example.com"
      },
      "start_date": "2025-12-15T00:00:00Z",
      "end_date": "2025-12-22T00:00:00Z",
      "total_price": 1050.00,
      "status": "pending",
      "payment_status": "unpaid",
      "created_at": "2025-12-01T10:00:00Z"
    }
  ],
  "count": 25
}
```

#### 2. Confirm Booking

```http
POST /bookings/{booking_id}/confirm/
Authorization: Bearer {token}

{
  "notes": "Looking forward to your stay! Check-in details sent."
}

Response (200):
{
  "id": "booking-uuid",
  "status": "confirmed",
  "payment_status": "paid",
  "confirmed_at": "2025-12-01T11:00:00Z"
}
```

#### 3. Decline Booking

```http
POST /bookings/{booking_id}/cancel/
Authorization: Bearer {token}

{
  "reason": "Dates no longer available - property maintenance"
}

Response (200):
{
  "id": "booking-uuid",
  "status": "cancelled",
  "cancellation_reason": "Dates no longer available..."
}
```

#### 4. Complete Booking

```http
POST /bookings/{booking_id}/complete/
Authorization: Bearer {token}

{
  "notes": "Great guests! Please leave a review."
}

Response (200):
{
  "id": "booking-uuid",
  "status": "completed",
  "completed_at": "2025-12-22T11:00:00Z"
}
```

---

### Analytics Endpoints

#### 1. Get Analytics Dashboard

```http
GET /sellers/analytics/
Authorization: Bearer {token}

Response (200):
{
  "stats": {
    "total_views": 1234,
    "total_listings": 12,
    "active_listings": 10,
    "pending_requests": 3,
    "conversion_rate": 45.5,
    "avg_rating": 4.8,
    "total_reviews": 42,
    "response_rate": 98.0,
    "avg_response_time_hours": 2.5
  },
  
  "category_breakdown": {
    "Real Estate": 8,
    "Services": 3,
    "Products": 1
  },
  
  "trends": {
    "period_days": 30,
    "new_listings": 3,
    "new_bookings": 8,
    "revenue": 5200.00,
    "month_growth": 15.5
  },
  
  "revenue": {
    "total": 5200.00,
    "by_listing": [
      {
        "listing_id": "uuid",
        "listing_title": "3BR Villa",
        "amount": 3500.00,
        "bookings": 5
      }
    ],
    "by_date": [
      {
        "date": "2025-12-01",
        "amount": 150.00
      }
    ]
  },
  
  "insights": [
    "💡 Your top listing has 50% more views than average",
    "✓ Response rate is excellent - keep it up!",
    "🚀 Weekend bookings peak at 9-11am"
  ]
}
```

#### 2. Get Listing Analytics

```http
GET /listings/{listing_id}/analytics/
Authorization: Bearer {token}

Response (200):
{
  "listing_id": "uuid",
  "title": "3BR Beachfront Villa",
  
  "metrics": {
    "views": 234,
    "views_trend": "+12%",
    "favorites": 18,
    "bookings": 5,
    "booking_rate": 2.1,
    "avg_rating": 4.8,
    "reviews": 12
  },
  
  "revenue": {
    "total": 3500.00,
    "bookings_completed": 5,
    "pending": 1050.00,
    "avg_booking_value": 700.00
  },
  
  "daily_stats": [
    {
      "date": "2025-12-01",
      "views": 12,
      "clicks": 4,
      "bookings": 0
    }
  ]
}
```

---

### Messages Endpoints

#### 1. Get Message Threads

```http
GET /messages/
Authorization: Bearer {token}

Query Parameters:
?listing_id=uuid  // Filter by listing
?search=text      // Search messages
?ordering=-updated_at

Response (200):
{
  "results": [
    {
      "id": "thread-uuid",
      "other_user": {
        "id": "uuid",
        "username": "john_smith",
        "email": "john@example.com"
      },
      "listing": {
        "id": "uuid",
        "title": "3BR Beachfront Villa"
      },
      "last_message": {
        "text": "When is available?",
        "created_at": "2025-12-01T09:00:00Z",
        "is_read": false
      },
      "unread_count": 1,
      "updated_at": "2025-12-01T09:00:00Z"
    }
  ],
  "count": 15
}
```

#### 2. Get Thread Messages

```http
GET /messages/{thread_id}/
Authorization: Bearer {token}

Response (200):
{
  "thread_id": "uuid",
  "messages": [
    {
      "id": "msg-uuid",
      "sender_id": "uuid",
      "sender_name": "john_smith",
      "text": "Is the villa available Dec 15-22?",
      "created_at": "2025-12-01T08:00:00Z",
      "is_read": true
    },
    {
      "id": "msg-uuid",
      "sender_id": "uuid",
      "sender_name": "your_username",
      "text": "Yes! €150/night. Would you like to book?",
      "created_at": "2025-12-01T08:30:00Z",
      "is_read": true
    }
  ]
}
```

#### 3. Send Message

```http
POST /messages/{thread_id}/
Authorization: Bearer {token}

{
  "text": "Perfect! I've sent check-in details to your email."
}

Response (201):
{
  "id": "msg-uuid",
  "sender_id": "uuid",
  "text": "Perfect! I've sent check-in details to your email.",
  "created_at": "2025-12-01T09:00:00Z"
}
```

---

### Broadcast Endpoints

#### 1. Get Broadcast Requests (Seller)

```http
GET /assistant/broadcasts/requests/
Authorization: Bearer {token}

Response (200):
{
  "requests": [
    {
      "id": "request-uuid",
      "customer_name": "Maria Silva",
      "customer_phone": "+238-123-4567",
      "request_text": "Looking for 3BR villa, Dec 15-25, max €180/night",
      "category": "real-estate",
      "matched_listings": 3,
      "match_score": 92,
      "created_at": "2025-12-01T08:00:00Z",
      "expires_at": "2025-12-02T08:00:00Z"
    }
  ],
  "count": 5
}
```

#### 2. Respond to Broadcast Request

```http
POST /assistant/broadcasts/requests/{request_id}/respond/
Authorization: Bearer {token}

{
  "response_type": "quote",  // quote | booking | skip | block
  "listing_id": "uuid",
  "message": "We have exactly what you're looking for! 3BR beachfront villa, €160/night for your dates.",
  "pricing": {
    "nightly_rate": 160.00,
    "total_nights": 10,
    "total_price": 1600.00
  }
}

Response (200):
{
  "request_id": "request-uuid",
  "status": "responded",
  "responded_at": "2025-12-01T09:00:00Z",
  "message_sent": true
}
```

#### 3. Create Broadcast (Marketing)

```http
POST /broadcasts/
Authorization: Bearer {token}

{
  "title": "50% Off Eco-Tours This Weekend",
  "message": "Limited time offer! All guided tours 50% off Dec 7-8. Reserve now!",
  "broadcast_type": "promotion",
  "target_audience": "all_followers",  // all_followers | previous_customers | geographic
  "location": "Praia",
  "schedule_for": null,  // null = send now, or ISO datetime
  "image_url": "https://cdn.example.com/tour-promo.jpg"
}

Response (201):
{
  "id": "broadcast-uuid",
  "status": "sent",
  "recipients": 342,
  "created_at": "2025-12-01T09:00:00Z"
}
```

---

### Reviews Endpoints

#### 1. Get Reviews (for Seller)

```http
GET /reviews/
Authorization: Bearer {token}
?listing_id=uuid
?rating=1-5
?ordering=-created_at

Response (200):
{
  "results": [
    {
      "id": "review-uuid",
      "booking": {
        "id": "booking-uuid",
        "dates": "Dec 15-22, 2025"
      },
      "reviewer": {
        "id": "uuid",
        "username": "john_smith"
      },
      "rating": 5,
      "title": "Amazing villa, wonderful hosts!",
      "comment": "Beautiful views, clean, great amenities...",
      "is_verified": true,
      "created_at": "2025-12-23T10:00:00Z",
      "seller_response": {
        "text": "Thank you so much! We loved having you!",
        "created_at": "2025-12-23T11:00:00Z"
      }
    }
  ],
  "count": 42,
  "avg_rating": 4.8
}
```

#### 2. Respond to Review

```http
POST /reviews/{review_id}/respond/
Authorization: Bearer {token}

{
  "response": "Thank you for the wonderful review! We're thrilled you enjoyed your stay. Hope to see you again soon!"
}

Response (200):
{
  "id": "review-uuid",
  "seller_response": {
    "text": "Thank you for the wonderful review!...",
    "created_at": "2025-12-23T11:00:00Z"
  }
}
```

---

## Dashboard Views & Components

### Frontend Component Architecture

**Technology Stack:**
- React 18 with Hooks
- React Router for navigation
- Axios for API calls
- TailwindCSS + shadcn/ui for styling
- Framer Motion for animations
- Recharts for analytics

### Key Components

#### 1. DashboardLayout

**Location:** `frontend/src/features/seller-dashboard/layout/DashboardLayout.tsx`

**Structure:**
```jsx
<DashboardLayout>
  <Sidebar />
  <MainContent>
    <Header />
    <PageContent />
  </MainContent>
</DashboardLayout>
```

**Features:**
- Responsive mobile-friendly sidebar
- Collapsible navigation
- User menu with logout
- Breadcrumb navigation

#### 2. MyListingsPage

**Location:** `frontend/src/pages/dashboard/MyListings.jsx`

**Key Features:**
```jsx
// State Management
const [listings, setListings] = useState([])
const [filter, setFilter] = useState('all')
const [categoryFilter, setCategoryFilter] = useState('all')
const [sortBy, setSortBy] = useState('newest')
const [viewMode, setViewMode] = useState('grid') // grid or table

// Data Fetching
useEffect(() => {
  fetchListings() // GET /api/listings/my/
}, [])

// Filtering Logic
const filteredListings = listings.filter(listing => {
  return matchesFilter && matchesCategory && matchesSearch
})

// Render Options
return (
  <div>
    <FilterBar />
    <TabsView defaultTab="all">
      <Tab value="all">All Listings ({count})</Tab>
      <Tab value="active">Active ({activeCount})</Tab>
      <Tab value="draft">Draft ({draftCount})</Tab>
    </TabsView>
    
    {viewMode === 'grid' && <GridView listings={filteredListings} />}
    {viewMode === 'table' && <TableView listings={filteredListings} />}
  </div>
)
```

#### 3. BookingsPage

**Location:** `frontend/src/pages/dashboard/Bookings.jsx`

**Features:**
- Tabbed interface (Pending, Confirmed, Completed, Cancelled)
- Booking cards with quick actions
- Modal for booking details
- Confirmation dialogs

---

## Business Profile Management

### Setup Wizard (First Time)

**Step 1: Business Type**
```
○ Accommodation Provider (Hotels, Villas, Guest Houses)
○ Service Provider (Tours, Spa, Repairs)
○ Product Seller (Crafts, Food, Electronics)
○ Transportation (Vehicles, Boats)
○ Multi-Category (I sell multiple types)
```

**Step 2: Business Information**
```
Business Name: [text input]
Description: [textarea with 50-300 chars]
Contact Phone: [phone input with country code]
Website: [URL input, optional]
Location: [address + map picker]
```

**Step 3: Media**
```
Logo: [file upload, 500x500 recommended]
Cover Image: [file upload, 1200x400 recommended]
Profile Photos: [upload up to 5 images]
```

**Step 4: Verification**
```
Upload Documentation:
- Business Registration Certificate
- Tax ID/VAT Number
- ID Document (owner)
- Optional: Insurance, Licenses
```

**Step 5: Review & Submit**
```
Summary of information
Acceptance of T&Cs
Submit for verification
```

---

### Business Tier System

**Tier 1: Free (Starter)**
```
✓ Unlimited listings
✓ Basic analytics
✓ Messaging system
✓ Booking management
✗ Premium features
✗ Featured listings
✗ API access
```

**Tier 2: Professional (€9.99/month)**
```
✓ All Tier 1 features
✓ Featured listings (30 days)
✓ Advanced analytics
✓ Priority support
✓ Broadcast access
✗ API access
```

**Tier 3: Enterprise (Custom pricing)**
```
✓ All Professional features
✓ Custom branding
✓ API access
✓ Dedicated account manager
✓ White-label options
✓ Bulk tools
```

---

## Monetization & Revenue

### Commission Structure

**Platform Fees:**
- **Booking Commission:** 5-8% per completed booking (varies by category)
- **Featured Listing:** €9.99 for 30 days
- **Premium Support:** €4.99/month
- **API Access:** €99/month

### Payment Flows

**Customer → Platform → Seller**
```
Customer Books: €1,000
↓
Platform Holds (Payment Processing): €1,050 (includes processing fee)
↓
Booking Confirmed → Payment Processed
↓
Seller Receives: €940 (95% after 5% commission)
↓
Payout Scheduled: 7-14 days after booking completion
```

### Payout Management

**Seller Dashboard - Sales Section:**
```
Pending Payouts: €2,345
Last Payout: Dec 1, 2025 | €1,200
Next Scheduled: Dec 15, 2025

Payout Methods:
☑ Bank Transfer
☐ Mobile Money (Vodafone, Emis, etc.)
☐ PayPal

Bank Details:
Account Name: [editable]
Account Number: [editable, encrypted]
Bank Name: [editable]
IBAN: [editable, if available]
```

---

## Support & Help

### Help Center Resources

**Knowledge Base Sections:**
1. **Getting Started**
   - Setting up your profile
   - Creating your first listing
   - Managing bookings
   - Responding to requests

2. **Selling Strategies**
   - Best practices for photos
   - Writing compelling descriptions
   - Pricing strategies
   - Seasonal planning

3. **Booking Management**
   - Handling cancellations
   - Refund policies
   - Dispute resolution
   - Customer communication

4. **Growth & Optimization**
   - SEO tips for listings
   - Marketing your business
   - Building reviews
   - Analytics interpretation

5. **Technical Support**
   - API documentation
   - Integration guides
   - Troubleshooting
   - Connectivity issues

### Contact Support

**Options:**
1. **Help Center Chat:** In-app chat with AI bot
2. **Email Support:** support@easyislanders.com
3. **Priority Support:** Live chat (Professional+ tier)
4. **Phone Support:** +238-XXX-XXXX (Enterprise tier)
5. **Community Forum:** Q&A with other sellers

### Support Ticket System

**Ticket Creation:**
```
Subject: [dropdown of categories]
Category: 
  - Booking Issues
  - Technical Problems
  - Payment/Payout
  - Verification
  - Other

Priority:
  - Low (response in 24h)
  - Medium (response in 12h)
  - High (response in 4h)

Description: [textarea]
Attachments: [file upload]

Status Tracking:
Open → In Review → Waiting for You → Resolved
```

---

## Compliance & Trust

### Business Verification

**Seller Badges:**
- ✓ Verified Business
- ✓ Trusted Seller
- ✓ Responsive
- ✓ Certified Category Expert

**Verification Checklist:**
```
☐ Business name matches documentation
☐ Contact information is valid
☐ Location is verified
☐ Payment information is legitimate
☐ No fraud or legal issues
☐ Meets category-specific requirements
```

### Trust & Safety

**Seller Responsibilities:**
- Accurate listing information
- Fair pricing
- Timely responses (24h target)
- Honest customer communication
- Compliance with local laws
- No fraudulent activity

**Customer Protection:**
- Booking guarantees
- Dispute resolution
- Money-back guarantees
- Insurance (where applicable)

---

## Performance Metrics

### KPIs to Track

**Business Health:**
```
Response Rate (%)
├─ Target: 90%+
├─ Tracked: Messages, broadcasts, requests
└─ Impact: Affects visibility in search

Completion Rate (%)
├─ Target: 95%+
├─ Tracked: Confirmed bookings / total bookings
└─ Impact: Trust score

Customer Satisfaction (★)
├─ Target: 4.5+
├─ Tracked: Average rating from reviews
└─ Impact: Featured/prominent placement

Conversion Rate (%)
├─ Target: 2-5%
├─ Tracked: Bookings / page views
└─ Impact: Revenue optimization signal
```

### Monthly Business Review

**What to Analyze:**
1. Top-performing listings
2. Underperforming listings (optimize or remove)
3. Customer feedback themes
4. Seasonal trends
5. Competitive pricing
6. Marketing opportunities
7. Operational challenges

---

## FAQ

**Q: How long does business verification take?**
A: 1-3 business days. We'll notify you via email.

**Q: Can I have multiple seller accounts?**
A: No. One account per person/entity. Contact support for business entities.

**Q: What payment methods do you accept?**
A: Bank transfer, mobile money (Vodafone, Emis), and PayPal.

**Q: How do refunds work?**
A: Handled per your cancellation policy. Platform fees are non-refundable after processing.

**Q: Can I change my category?**
A: Yes, anytime. But keep listings category-appropriate.

**Q: How do I handle disputes?**
A: Contact support with evidence. Mediator assigned for disputes >€100.

---

## Roadmap: Upcoming Features

**Q1 2026:**
- Social media integration (auto-share listings)
- Email marketing templates
- Advanced scheduling tools

**Q2 2026:**
- Group booking management
- Multi-currency support
- Affiliate program

**Q3 2026:**
- White-label dashboard
- Advanced API features
- AI-powered pricing suggestions

---

## Contact & Support

**Support Email:** business@easyislanders.com  
**Phone:** +238-XXX-XXXX  
**Community Forum:** community.easyislanders.com  
**Status Page:** status.easyislanders.com  

---

**End of Document**
