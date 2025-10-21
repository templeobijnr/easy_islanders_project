# Easy Islanders – API Schema & Implementation Roadmap

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Database Schema](#database-schema)
3. [RBAC Rules](#rbac-rules)
4. [User Workflows](#user-workflows)
5. [Implementation Roadmap](#implementation-roadmap)

---

## API Endpoints

### 1. Authentication & User Management

#### Register (Consumer or Business)
```
POST /api/auth/register/
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "user_type": "consumer" | "business",
  // If business:
  "business_name": "Acme Rentals",
  "business_category": "car_rental" | "accommodation" | "dining" | "service",
  "business_subcategory": "luxury_apartments" | "budget_hotels" | etc.
}

Response (201 Created):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "user_type": "consumer",
  "profile_verified": false,
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### Login
```
POST /api/auth/login/
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response (200 OK):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "user_type": "consumer",
  "access_token": "jwt_token_here" (if JWT),
  "session_id": "session_cookie" (if session-based)
}
```

#### Logout
```
POST /api/auth/logout/

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

#### Check Auth Status
```
GET /api/auth/status/

Response (200 OK):
{
  "authenticated": true,
  "user_id": 1,
  "username": "john_doe",
  "user_type": "consumer",
  "email": "user@example.com"
}

Response (401 Unauthorized):
{
  "authenticated": false
}
```

#### Get Current User Profile
```
GET /api/auth/profile/

Response (200 OK):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "user_type": "consumer",
  "profile_verified": false,
  "created_at": "2025-10-20T10:00:00Z",
  // If consumer:
  "favorites": [1, 3, 5],
  "booking_history": [...]
  // If business:
  "business_name": "Acme Rentals",
  "business_category": "car_rental",
  "verification_status": "pending" | "verified" | "rejected",
  "listings_count": 5
}
```

#### Update Profile
```
PUT /api/auth/profile/
Content-Type: application/json

Request (varies by user_type):
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  // If business:
  "business_description": "Premium car rentals...",
  "business_contact": "contact@acme.com"
}

Response (200 OK):
{
  // Updated profile object
}
```

---

### 2. Business Listings (CRUD)

#### Create Listing (Business only)
```
POST /api/listings/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "title": "Luxury 2BR Apartment in Kyrenia",
  "description": "Modern apartment with sea view...",
  "category": "accommodation",
  "subcategory": "apartment",
  "price": 150.00,
  "currency": "EUR",
  "location": "Kyrenia, North Cyprus",
  "latitude": 35.3425,
  "longitude": 33.9547,
  "availability": {
    "start_date": "2025-11-01",
    "end_date": "2026-12-31",
    "blackout_dates": ["2025-12-25", "2025-12-26"]
  },
  "features": ["WiFi", "Parking", "Air Conditioning", "Sea View"],
  "contact_info": {
    "phone": "+1234567890",
    "email": "contact@example.com",
    "whatsapp": "+1234567890"
  }
}

Response (201 Created):
{
  "id": 123,
  "owner_id": 1,
  "title": "Luxury 2BR Apartment in Kyrenia",
  "description": "...",
  "category": "accommodation",
  "price": 150.00,
  "location": "Kyrenia, North Cyprus",
  "status": "active",
  "rating": 4.8,
  "reviews_count": 12,
  "images": [],
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### Get Listing (Public)
```
GET /api/listings/{listing_id}/

Response (200 OK):
{
  "id": 123,
  "owner_id": 1,
  "title": "Luxury 2BR Apartment in Kyrenia",
  "description": "...",
  "category": "accommodation",
  "price": 150.00,
  "location": "Kyrenia, North Cyprus",
  "images": [
    "/media/listings/123/img1.jpg",
    "/media/listings/123/img2.jpg"
  ],
  "features": ["WiFi", "Parking", "Air Conditioning"],
  "rating": 4.8,
  "reviews": [
    {
      "user": "Jane Doe",
      "rating": 5,
      "comment": "Amazing place!",
      "created_at": "2025-09-15T10:00:00Z"
    }
  ],
  "availability": {
    "start_date": "2025-11-01",
    "end_date": "2026-12-31"
  },
  "contact_info": {
    "phone": "+1234567890",
    "email": "contact@example.com"
  }
}
```

#### List Listings (Search & Filter)
```
GET /api/listings/?category=accommodation&location=Kyrenia&min_price=100&max_price=300&language=en

Response (200 OK):
{
  "count": 45,
  "next": "/api/listings/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "title": "Luxury 2BR Apartment in Kyrenia",
      "price": 150.00,
      "location": "Kyrenia",
      "rating": 4.8,
      "image_url": "/media/listings/123/img1.jpg"
    },
    ...
  ]
}
```

#### Update Listing (Business owner only)
```
PUT /api/listings/{listing_id}/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "title": "Updated Title",
  "price": 160.00,
  // ... other fields
}

Response (200 OK):
{
  // Updated listing object
}
```

#### Delete Listing (Business owner only)
```
DELETE /api/listings/{listing_id}/
Authorization: Bearer <token>

Response (204 No Content):
```

#### Upload Listing Images
```
POST /api/listings/{listing_id}/upload-images/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Request:
{
  "images": [file1.jpg, file2.jpg, file3.jpg]
}

Response (200 OK):
{
  "images": [
    "/media/listings/123/img1.jpg",
    "/media/listings/123/img2.jpg",
    "/media/listings/123/img3.jpg"
  ]
}
```

---

### 3. Bookings & Reservations

#### Create Booking (Consumer only)
```
POST /api/bookings/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "listing_id": 123,
  "start_date": "2025-11-15",
  "end_date": "2025-11-20",
  "guests": 2,
  "special_requests": "High floor preferred"
}

Response (201 Created):
{
  "id": 456,
  "listing_id": 123,
  "consumer_id": 2,
  "start_date": "2025-11-15",
  "end_date": "2025-11-20",
  "total_price": 750.00,
  "status": "pending",
  "payment_status": "pending",
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### Get Booking Details
```
GET /api/bookings/{booking_id}/
Authorization: Bearer <token>

Response (200 OK):
{
  "id": 456,
  "listing_id": 123,
  "listing_title": "Luxury 2BR Apartment in Kyrenia",
  "consumer_id": 2,
  "consumer_name": "Jane Doe",
  "start_date": "2025-11-15",
  "end_date": "2025-11-20",
  "guests": 2,
  "total_price": 750.00,
  "status": "confirmed",
  "payment_status": "paid",
  "special_requests": "High floor preferred",
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### List Bookings (by Consumer or Business)
```
GET /api/bookings/?filter=my_bookings (consumer) or /api/bookings/?filter=my_listings (business)
Authorization: Bearer <token>

Response (200 OK):
{
  "count": 5,
  "results": [
    {
      "id": 456,
      "listing_title": "Luxury 2BR Apartment",
      "start_date": "2025-11-15",
      "end_date": "2025-11-20",
      "status": "confirmed",
      "total_price": 750.00
    },
    ...
  ]
}
```

#### Update Booking Status (Business owner or Admin)
```
PATCH /api/bookings/{booking_id}/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "status": "confirmed" | "cancelled" | "completed"
}

Response (200 OK):
{
  "id": 456,
  "status": "confirmed",
  "updated_at": "2025-10-20T11:00:00Z"
}
```

#### Cancel Booking (Consumer or Business)
```
POST /api/bookings/{booking_id}/cancel/
Authorization: Bearer <token>

Request:
{
  "reason": "Change of plans"
}

Response (200 OK):
{
  "id": 456,
  "status": "cancelled",
  "refund_amount": 750.00,
  "refund_status": "pending"
}
```

---

### 4. Payments & Transactions

#### Create Payment Intent (Stripe)
```
POST /api/payments/create-intent/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "booking_id": 456,
  "amount": 750.00,
  "currency": "EUR"
}

Response (200 OK):
{
  "client_secret": "pi_xxx_secret_xxx",
  "publishable_key": "pk_xxx"
}
```

#### Confirm Payment
```
POST /api/payments/confirm/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "payment_intent_id": "pi_xxx"
}

Response (200 OK):
{
  "booking_id": 456,
  "status": "succeeded",
  "amount": 750.00,
  "transaction_id": "txn_xxx"
}
```

#### List Transactions (Business owner)
```
GET /api/payments/transactions/?filter=received
Authorization: Bearer <token>

Response (200 OK):
{
  "count": 12,
  "total_revenue": 3500.00,
  "results": [
    {
      "id": "txn_xxx",
      "booking_id": 456,
      "amount": 750.00,
      "status": "succeeded",
      "date": "2025-10-15T10:00:00Z"
    }
  ]
}
```

---

### 5. Reviews & Ratings

#### Create Review (Consumer after booking completion)
```
POST /api/reviews/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "listing_id": 123,
  "booking_id": 456,
  "rating": 5,
  "comment": "Amazing place, will definitely come back!"
}

Response (201 Created):
{
  "id": 789,
  "listing_id": 123,
  "user": "Jane Doe",
  "rating": 5,
  "comment": "Amazing place...",
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### Get Listing Reviews
```
GET /api/listings/{listing_id}/reviews/

Response (200 OK):
{
  "count": 12,
  "average_rating": 4.8,
  "results": [
    {
      "user": "Jane Doe",
      "rating": 5,
      "comment": "Amazing place...",
      "created_at": "2025-10-20T10:00:00Z"
    }
  ]
}
```

---

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type ENUM('consumer', 'business', 'admin') NOT NULL,
  phone VARCHAR(20),
  profile_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### BusinessProfile Table
```sql
CREATE TABLE business_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  business_category ENUM('accommodation', 'food', 'shop', 'service') NOT NULL,
  business_subcategory VARCHAR(100),
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_whatsapp VARCHAR(20),
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### ConsumerProfile Table
```sql
CREATE TABLE consumer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  preferences JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Favorites Table
```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);
```

### Listing Table
```sql
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('accommodation', 'food', 'shop', 'service') NOT NULL,
  subcategory VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status ENUM('active', 'inactive', 'pending_verification') DEFAULT 'active',
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  features JSON,
  availability JSON,
  contact_info JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (category),
  INDEX (location),
  INDEX (created_at)
);
```

### ListingImage Table
```sql
CREATE TABLE listing_images (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);
```

### Booking Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  consumer_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guests INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (consumer_id),
  INDEX (status)
);
```

### Payment/Transaction Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status ENUM('pending', 'succeeded', 'failed') DEFAULT 'pending',
  payment_method ENUM('stripe', 'paypal', 'other') DEFAULT 'stripe',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  commission_amount DECIMAL(10, 2),
  commission_rate DECIMAL(4, 2) DEFAULT 10.00,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

### Review Table
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  booking_id INTEGER,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## RBAC Rules

### Consumer Permissions
- `list_listings` – search and view all public listings
- `view_listing_details` – see full listing info (contact, reviews, availability)
- `create_booking` – book a listing
- `view_own_bookings` – see their bookings
- `cancel_own_booking` – cancel their own booking (with refund policy)
- `leave_review` – review after booking completion
- `manage_favorites` – add/remove favorites
- `update_own_profile` – update consumer profile

### Business Permissions
- `create_listing` – create new listing
- `update_own_listing` – edit their own listings
- `delete_own_listing` – remove their own listings
- `upload_listing_images` – add/manage listing images
- `view_own_bookings` – see bookings for their listings
- `update_booking_status` – confirm/cancel bookings
- `view_transactions` – see payment history
- `view_analytics` – access dashboard (bookings, revenue, etc.)
- `apply_for_featured` – request featured listing status
- `update_own_profile` – update business profile

### Admin Permissions
- All consumer and business permissions
- `verify_business` – approve/reject business verification
- `manage_users` – suspend/delete users
- `moderate_reviews` – remove inappropriate reviews
- `view_platform_analytics` – revenue, user metrics, etc.
- `manage_featured_listings` – approve/feature listings
- `handle_disputes` – resolve booking/payment disputes

### Middleware
```python
# Role-based decorator
@require_user_type('consumer')
def consumer_only_view(request):
    pass

@require_user_type('business')
def business_only_view(request):
    pass

@require_user_type('admin')
def admin_only_view(request):
    pass

# Object-level permission
class IsListingOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.id
```

---

## User Workflows

### Workflow 1: Consumer Discovery → Booking → Payment

```
1. User visits homepage
   ↓
2. Browse/search listings (no login required)
   ├─ Filter by category, location, price
   ├─ View listing details
   └─ Read reviews
   ↓
3. [Optional] Create account or Login
   ├─ Register as consumer
   └─ Login with email/password
   ↓
4. Create booking
   ├─ Select dates
   ├─ Specify guests
   └─ Add special requests
   ↓
5. Proceed to payment
   ├─ View booking summary & total price
   ├─ Enter payment info (Stripe)
   └─ Confirm payment
   ↓
6. Booking confirmed
   ├─ Receive confirmation email
   └─ View booking in "My Bookings"
   ↓
7. After booking completion → Leave review
```

### Workflow 2: Business Listing Creation & Management

```
1. Business signs up
   ├─ Select business type & category
   ├─ Enter business details
   └─ Verification pending
   ↓
2. Admin verifies business
   └─ Status: Verified
   ↓
3. Business creates listing
   ├─ Enter title, description, price
   ├─ Add location & availability
   ├─ Upload images (3+ required)
   └─ Publish listing
   ↓
4. Listing appears in search results
   ↓
5. Manage bookings
   ├─ Receive booking notifications
   ├─ Confirm/cancel bookings
   └─ View booking details
   ↓
6. Track revenue
   ├─ View transactions
   ├─ Check commission deductions
   └─ Payout to bank account
   ↓
7. [Optional] Upgrade to featured
   ├─ Pay featured listing fee
   └─ Boost visibility
```

### Workflow 3: Payment & Payout Flow

```
Consumer Payment Flow:
- Booking created (status: pending)
- Consumer initiates payment → Stripe Intent Created
- Stripe processes payment
- Payment succeeds → Transaction recorded (status: succeeded)
- Booking status → confirmed
- Consumer receives confirmation

Business Payout Flow:
- Transaction succeeded
- Platform calculates commission (e.g., 10%)
- Net amount = Total - Commission
- Weekly/monthly payout to business bank account
- Payout status tracked in dashboard
```

---

## Implementation Roadmap

### Phase 1: Authentication & User Management (Week 1–2)

**Module 1: Authentication**
- [ ] User model (email, password_hash, user_type, profile_verified)
- [ ] BusinessProfile & ConsumerProfile models
- [ ] JWT or session-based auth setup
- [ ] Register endpoint (consumer + business variants)
- [ ] Login endpoint
- [ ] Logout endpoint
- [ ] Status check endpoint
- [ ] CORS/CSRF configuration (Django settings)
- [ ] Frontend: wire auth modal to endpoints
- [ ] Test: manual register/login/logout

**Acceptance Criteria:**
- Consumers and businesses can register separately
- Login works with email/password
- Session persists on page refresh
- Auth endpoints return expected shapes
- CORS allows frontend → backend requests

---

### Phase 2: Role-Based Access Control (Week 2–3)

**Module 2: RBAC & Authorization**
- [ ] DRF permissions (IsAuthenticated, IsBusinessUser, IsConsumer)
- [ ] Role-based decorators (@require_user_type)
- [ ] Permission mixins for viewsets
- [ ] API endpoints enforce permissions
- [ ] Frontend: show/hide UI based on user_type
- [ ] Test: verify consumers can't create listings, etc.

**Acceptance Criteria:**
- Consumers see "Create Listing" button only if logged in as business
- Businesses see "My Bookings" (incoming), consumers see "My Bookings" (outgoing)
- API returns 403 if user lacks permission
- No permission bypass via direct URL

---

### Phase 3: Business Listings CRUD (Week 3–4)

**Module 3: Listing Management**
- [ ] Listing model (title, category, price, location, features, images, status, rating)
- [ ] ListingImage model
- [ ] Create listing endpoint (business only)
- [ ] List listings endpoint (search, filter by category/location/price)
- [ ] Get listing detail endpoint (public)
- [ ] Update listing endpoint (business owner only)
- [ ] Delete listing endpoint (business owner only)
- [ ] Upload images endpoint
- [ ] Frontend: create/edit listing forms
- [ ] Test: CRUD operations, search filters

**Acceptance Criteria:**
- Business can create, update, delete their own listings
- Consumers can search listings by category, location, price
- Images upload and display correctly
- Listing appears in search results immediately (or after verification if required)
- API prevents unauthorized edits

---

### Phase 4: Bookings & Reservations (Week 4–5)

**Module 4: Booking System**
- [ ] Booking model (listing, consumer, dates, status, payment_status)
- [ ] Create booking endpoint (consumer only)
- [ ] List bookings endpoint (consumer sees their bookings, business sees bookings for their listings)
- [ ] Get booking detail endpoint
- [ ] Update booking status endpoint (business can confirm/cancel)
- [ ] Cancel booking endpoint (consumer or business can cancel with refund logic)
- [ ] Availability logic (check if dates are booked)
- [ ] Frontend: booking form, booking confirmation, my bookings view
- [ ] Test: create booking, cancel booking, check availability

**Acceptance Criteria:**
- Consumers can book available dates
- Bookings show in both consumer and business dashboards
- Business can confirm/cancel
- Booking status flows: pending → confirmed → completed
- Overlapping bookings prevented

---

### Phase 5: Payments & Transactions (Week 5–6)

**Module 5: Payment Processing**
- [ ] Stripe integration (API keys, webhook handling)
- [ ] Transaction model (booking, amount, status, stripe_charge_id, commission)
- [ ] Create payment intent endpoint
- [ ] Confirm payment endpoint
- [ ] Webhook handler for payment events (succeeded, failed)
- [ ] Commission calculation logic (e.g., 10% platform fee)
- [ ] Payout tracking (weekly/monthly to business accounts)
- [ ] Frontend: Stripe payment form, payment status
- [ ] Test: successful payment, failed payment, webhook handling

**Acceptance Criteria:**
- Payment form appears before booking confirmation
- Stripe processes payment
- Transaction recorded with correct commission
- Business dashboard shows earned revenue (after commission)
- Webhook updates booking status on payment success
- Consumer receives confirmation email

---

### Phase 6: Reviews, Analytics & Refinement (Week 6+)

**Post-MVP Enhancements**
- [ ] Review model & endpoints
- [ ] Consumer can leave review after booking
- [ ] Average rating calculation for listings
- [ ] Business dashboard with analytics (bookings, revenue, reviews)
- [ ] Consumer favorites (save listings)
- [ ] Featured listings (paid boost)
- [ ] Admin dashboard (user verification, disputes, platform metrics)
- [ ] Email notifications (booking confirmation, payment receipt, etc.)
- [ ] Rate limiting & abuse prevention
- [ ] Soft delete for listings (archive instead of hard delete)

---

## Development & Testing Checklist

### Backend Setup
- [ ] Django project initialized with DRF
- [ ] PostgreSQL configured (development)
- [ ] Models created and migrated
- [ ] Serializers defined (UserSerializer, ListingSerializer, BookingSerializer, etc.)
- [ ] Viewsets created (CRUD endpoints)
- [ ] Permissions configured (RBAC)
- [ ] CORS headers configured
- [ ] Stripe API keys configured (dev & prod)

### Frontend Setup
- [ ] Axios withCredentials enabled
- [ ] Auth modal wired to endpoints
- [ ] CSRF token handling (if session-based auth)
- [ ] Error messages surface on auth failures
- [ ] Conditional rendering based on user_type
- [ ] React Router for navigation (Home, ListingDetail, CreateListing, MyBookings, etc.)

### Testing (Manual → Automated)
- [ ] Register consumer, login, logout
- [ ] Register business, verify business (admin), create listing
- [ ] Search listings (filter by category, location)
- [ ] Consumer creates booking
- [ ] Business confirms booking
- [ ] Consumer leaves review
- [ ] Payment flow (Stripe test mode)
- [ ] Verify commission deducted correctly
- [ ] Automated: pytest fixtures for user/listing/booking creation, API endpoint tests

### Deployment
- [ ] Environment variables (Django, Stripe, CORS origins)
- [ ] Database migrations run in production
- [ ] Static files collected (Django)
- [ ] Media uploads use S3 or CDN
- [ ] Email backend configured (SendGrid, AWS SES, etc.)
- [ ] Error monitoring (Sentry)
- [ ] Health checks & uptime monitoring

---

## Success Metrics

By end of Phase 5:
- ✅ Businesses can list properties/services
- ✅ Consumers can discover and book
- ✅ Payments process successfully
- ✅ Platform takes commission on each transaction
- ✅ All RBAC enforced (no data leaks)
- ✅ Zero duplicate bookings
- ✅ User can refresh page and stay logged in

---

## Next Steps

1. **Finalize Django models** (make sure to align with schema above)
2. **Create serializers** for User, Listing, Booking, Transaction
3. **Build viewsets & endpoints** (start with Auth, then Listings, then Bookings)
4. **Wire frontend** to endpoints as backend rolls out
5. **Run integration tests** end-to-end
6. **Deploy to staging** for acceptance testing
7. **Monitor metrics** and refine UX

Good luck! 🚀
