# Django Apps Relationship Map

**Purpose**: Document all relationships between Django apps to ensure proper integration and avoid conflicts.

---

## App Overview

| App | Purpose | Models | Status |
|-----|---------|--------|--------|
| **users** | User management and profiles | User, BusinessProfile, UserPreference | Core |
| **listings** | Universal marketplace listings | Category, SubCategory, Listing, ListingImage, SellerProfile | Core |
| **bookings** | Unified booking system | BookingType, Booking | Core |
| **real_estate** | Real estate specific models | Listing, ShortTermBlock | Legacy/Specialized |
| **seller_portal** | Multi-domain seller orchestration | (None - service layer) | New |
| **router_service** | Intent routing | (Various) | Core |
| **assistant** | AI assistant | (Various) | Core |

---

## Critical Relationship Map

### 1. User Model (users.models.User)

**Relationships**:
```
User (1) ──────────────────────────────────────── (1) BusinessProfile
         ├─ OneToOneField: business_profile
         │
User (1) ──────────────────────────────────────── (Many) Listing
         ├─ ForeignKey: owner
         │
User (1) ──────────────────────────────────────── (Many) Booking
         ├─ ForeignKey: user (customer)
         │
User (1) ──────────────────────────────────────── (Many) UserPreference
         └─ ForeignKey: user
```

**Key Points**:
- Every User can have ONE BusinessProfile (OneToOne)
- Every User can own MANY Listings
- Every User can have MANY Bookings (as customer)
- BusinessProfile is optional (for business users only)

---

### 2. Listing Models - CRITICAL DISTINCTION

#### **listings.Listing** (Primary - Universal Marketplace)
```python
# Location: listings/models.py
class Listing(models.Model):
    id = UUIDField
    owner = ForeignKey(User)  # ← OWNER RELATIONSHIP
    category = ForeignKey(Category)
    subcategory = ForeignKey(SubCategory)
    title, description, price, currency, location
    dynamic_fields = JSONField  # Category-specific fields
    status = CharField (draft, active, paused, sold)
    created_at, updated_at
```

**Purpose**: Universal listing model for ALL categories (real estate, events, activities, etc.)

**Relationships**:
```
Listing (Many) ──────────────────────────────────── (1) User
        └─ ForeignKey: owner

Listing (Many) ──────────────────────────────────── (1) Category
        └─ ForeignKey: category

Listing (Many) ──────────────────────────────────── (1) SubCategory
        └─ ForeignKey: subcategory

Listing (Many) ──────────────────────────────────── (Many) ListingImage
        └─ OneToMany: images (related_name)

Listing (Many) ──────────────────────────────────── (Many) Booking
        └─ OneToMany: bookings (related_name)
```

#### **real_estate.Listing** (Legacy - Real Estate Specific)
```python
# Location: real_estate/models.py
class Listing(models.Model):
    id = UUIDField
    # NO owner field - this is a LEGACY model
    title, description
    city, district, lat, lng
    bedrooms, bathrooms, property_type
    rent_type (short_term, long_term, both)
    monthly_price, nightly_price, min_nights, min_term_months
    amenities, images (JSON)
    created_at, updated_at
```

**Purpose**: Real estate specific fields (bedrooms, rent_type, nightly_price, etc.)

**Relationships**:
```
real_estate.Listing (Many) ──────────────────── (Many) ShortTermBlock
                    └─ OneToMany: st_blocks (related_name)
```

### ⚠️ CRITICAL ISSUE: Two Listing Models

**Problem**: 
- `listings.Listing` is the primary model (has owner, category, bookings)
- `real_estate.Listing` is legacy (no owner, real estate specific fields)
- They are SEPARATE tables - NOT related

**Solution for seller_portal**:
- Use `listings.Listing` with `category__slug='real_estate'`
- Filter by `owner` and category
- Access real estate specific fields via `dynamic_fields` JSONField
- Do NOT use `real_estate.Listing` directly

**Current Implementation** (seller_portal/services.py):
```python
# ✅ CORRECT
listings = Listing.objects.filter(
    owner=seller_user, 
    category__slug='real_estate'
)

# ❌ WRONG (would not work)
# from real_estate.models import Listing as REListing
# listings = REListing.objects.filter(owner=seller_user)  # No owner field!
```

---

### 3. Booking Model (bookings.models.Booking)

```python
class Booking(models.Model):
    id = UUIDField
    reference_number = CharField (auto-generated)
    booking_type = ForeignKey(BookingType)
    user = ForeignKey(User)  # ← CUSTOMER
    listing = ForeignKey(listings.Listing)  # ← LINKS TO UNIVERSAL LISTING
    status = CharField (draft, pending, confirmed, in_progress, completed, cancelled)
    start_date, end_date = DateTimeField
    contact_name, contact_phone, contact_email
    base_price, service_fees, taxes, discount, total_price
    payment_status, payment_method, paid_amount
    booking_data = JSONField  # Type-specific flexible data
    created_at, updated_at, confirmed_at, completed_at
```

**Relationships**:
```
Booking (Many) ──────────────────────────────────── (1) User
       └─ ForeignKey: user (customer)

Booking (Many) ──────────────────────────────────── (1) listings.Listing
       └─ ForeignKey: listing

Booking (Many) ──────────────────────────────────── (1) BookingType
       └─ ForeignKey: booking_type
```

**Key Points**:
- Booking links to `listings.Listing`, NOT `real_estate.Listing`
- Booking.user is the CUSTOMER (who made the booking)
- Listing.owner is the SELLER (who owns the listing)
- To get seller's bookings: `Booking.objects.filter(listing__owner=seller_user)`

---

### 4. Category & SubCategory (listings.models)

```python
class Category(models.Model):
    id = UUIDField
    name, slug (unique)
    description
    schema = JSONField  # Defines dynamic fields for listings
    is_bookable = BooleanField
    is_active, is_featured_category
    icon, color
    created_at, updated_at

class SubCategory(models.Model):
    id = AutoField
    category = ForeignKey(Category)
    name, slug
    description
    display_order
```

**Relationships**:
```
Category (1) ──────────────────────────────────── (Many) SubCategory
        └─ OneToMany: subcategories (related_name)

Category (1) ──────────────────────────────────── (Many) Listing
        └─ OneToMany: listings (related_name)
```

**Real Estate Category**:
```python
# Should exist in database:
Category(
    name='Real Estate',
    slug='real_estate',
    is_bookable=True,
    schema={
        "fields": [
            {"name": "bedrooms", "type": "number"},
            {"name": "bathrooms", "type": "number"},
            {"name": "rent_type", "type": "select", "choices": ["short_term", "long_term", "both"]},
            {"name": "nightly_price", "type": "number"},
            {"name": "monthly_price", "type": "number"},
        ]
    }
)
```

---

### 5. BusinessProfile (users.models)

```python
class BusinessProfile(models.Model):
    id = UUIDField
    user = OneToOneField(User)  # ← BUSINESS USER
    business_name
    category = ForeignKey(Category)  # Primary business category
    subcategory = ForeignKey(SubCategory)
    description, contact_phone, website, location
    is_verified_by_admin
    verification_notes, verified_at
    created_at, updated_at
```

**Relationships**:
```
BusinessProfile (1) ──────────────────────────── (1) User
               └─ OneToOneField: user

BusinessProfile (1) ──────────────────────────── (1) Category
               └─ ForeignKey: category (primary)

BusinessProfile (1) ──────────────────────────── (1) SubCategory
               └─ ForeignKey: subcategory
```

**Note**: BusinessProfile.category is the PRIMARY category. For multi-domain support, we need to extend this (see MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md).

---

### 6. SellerProfile (listings.models)

```python
class SellerProfile(models.Model):
    id = UUIDField
    user = OneToOneField(User)  # ← SELLER USER
    business_name
    description, phone, email, website
    verified = BooleanField
    rating = FloatField
    total_listings = PositiveIntegerField
    ai_agent_enabled = BooleanField
    logo_url
    created_at, updated_at
```

**Relationships**:
```
SellerProfile (1) ──────────────────────────── (1) User
            └─ OneToOneField: user
```

**Note**: SellerProfile and BusinessProfile are SEPARATE. Consider consolidating in future.

---

### 7. seller_portal (New Service Layer)

```python
# No models - pure service layer
class BaseDomainService(ABC):
    # Abstract interface
    
class RealEstateDomainService(BaseDomainService):
    # Uses: listings.Listing, bookings.Booking
    # Filters: category__slug='real_estate'
```

**Relationships**:
```
seller_portal.RealEstateDomainService
    ├─ Queries: listings.Listing (owner=user, category__slug='real_estate')
    ├─ Queries: bookings.Booking (listing__owner=user, listing__category__slug='real_estate')
    └─ Returns: Aggregated metrics across seller's real estate listings
```

---

## Complete Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User                                   │
│  (username, email, password, user_type, phone, is_verified)    │
└────────────────┬──────────────────────────────────────────────┘
                 │
        ┌────────┼────────┬──────────────┐
        │        │        │              │
        ▼        ▼        ▼              ▼
    (1:1)   (1:1)   (1:Many)        (1:Many)
        │        │        │              │
    Business  Seller   Listing      Booking
    Profile   Profile   (owner)      (user=customer)
        │        │        │              │
        │        │        ├─ Category    ├─ BookingType
        │        │        ├─ SubCategory ├─ listings.Listing
        │        │        ├─ ListingImage│
        │        │        └─ Booking     │
        │        │                       │
        └────────┴───────────────────────┘

Listing Relationships:
    Listing (1) ──────────────────── (Many) ListingImage
    Listing (1) ──────────────────── (Many) Booking
    Listing (Many) ────────────────── (1) Category
    Listing (Many) ────────────────── (1) SubCategory

real_estate.Listing:
    (SEPARATE TABLE - Legacy model)
    real_estate.Listing (1) ────────── (Many) ShortTermBlock
    ⚠️ NO relationship to User or Booking
```

---

## Data Flow for seller_portal

### Getting Seller's Real Estate Listings

```python
# Step 1: Get business user
user = User.objects.get(username='seller@example.com')

# Step 2: Get real estate category
category = Category.objects.get(slug='real_estate')

# Step 3: Query listings.Listing (NOT real_estate.Listing)
listings = Listing.objects.filter(
    owner=user,
    category=category
)

# Step 4: Access real estate specific fields via dynamic_fields
for listing in listings:
    print(listing.title)
    print(listing.dynamic_fields.get('bedrooms'))  # From schema
    print(listing.dynamic_fields.get('rent_type'))
    print(listing.dynamic_fields.get('nightly_price'))
```

### Getting Seller's Bookings

```python
# Step 1: Get seller's bookings (across all their listings)
bookings = Booking.objects.filter(
    listing__owner=user,
    listing__category__slug='real_estate'
)

# Step 2: Access booking details
for booking in bookings:
    print(booking.reference_number)
    print(booking.contact_name)
    print(booking.start_date, booking.end_date)
    print(booking.total_price)
    print(booking.listing.title)  # The listing being booked
```

---

## Migration Path: real_estate.Listing → listings.Listing

**Current State**:
- `real_estate.Listing` exists (legacy, no owner field)
- `listings.Listing` exists (primary, has owner field)
- They are NOT connected

**Future State** (Phase 4+):
- Migrate real_estate specific data to `listings.Listing.dynamic_fields`
- Deprecate `real_estate.Listing`
- Use only `listings.Listing` with category filtering

**For Now**:
- seller_portal uses `listings.Listing` only
- real_estate app remains unchanged
- No cross-references between the two

---

## Index Strategy (Following AGENTS.md Guidelines)

### listings.Listing Indexes
```python
class Meta:
    indexes = [
        models.Index(fields=['owner', '-created_at']),  # Seller's listings
        models.Index(fields=['category', 'status']),     # Category filtering
        models.Index(fields=['category', 'location', 'status']),  # Search
        models.Index(fields=['status', 'is_featured', '-created_at']),  # Featured
        models.Index(fields=['price']),                  # Price filtering
    ]
```

### bookings.Booking Indexes
```python
class Meta:
    indexes = [
        models.Index(fields=['user', '-created_at']),    # Customer bookings
        models.Index(fields=['listing', 'start_date', 'end_date']),  # Availability
        models.Index(fields=['booking_type', 'status']),  # Type filtering
        models.Index(fields=['user', 'status']),         # Dashboard queries
        models.Index(fields=['payment_status']),         # Financial reports
        models.Index(fields=['status', '-created_at']),  # Admin filtering
        models.Index(fields=['start_date', 'status']),   # Availability queries
    ]
```

---

## Validation Checklist

- [x] User model is the central hub
- [x] listings.Listing has owner FK to User
- [x] bookings.Booking has user FK (customer) and listing FK
- [x] Category/SubCategory properly linked
- [x] BusinessProfile is OneToOne with User
- [x] seller_portal uses listings.Listing (not real_estate.Listing)
- [x] Proper indexes on frequently queried fields
- [x] No circular dependencies between apps
- [x] All ForeignKeys have appropriate on_delete behavior

---

## Related Documentation

- See `MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md` for future multi-domain extensions
- See `AGENTS.md` for Django patterns and guidelines
- See `PHASE1_IMPLEMENTATION_SUMMARY.md` for seller_portal implementation
- See `API_CONTRACTS.md` for API standards

---

**Last Updated**: November 12, 2025  
**Status**: Complete - Ready for Phase 3 Implementation
