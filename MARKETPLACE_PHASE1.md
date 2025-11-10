# Marketplace Phase 1: Hybrid Marketplace Architecture Foundation

**Status**: ✅ Complete
**Version**: 1.0.0
**Date**: 2025-11-10

---

## Overview

Phase 1 establishes the foundational backend infrastructure for a multi-domain marketplace system that unifies sellers, listings, and categories across real estate, vehicles, services, events, and activities.

### Key Features

- ✅ Unified seller profile system
- ✅ Generic listing model supporting multiple categories
- ✅ RESTful API with comprehensive filtering
- ✅ Zep Graph Memory integration for knowledge persistence
- ✅ Django admin interface
- ✅ Comprehensive test coverage
- ✅ Database migrations ready

---

## Architecture

### Models

#### 1. SellerProfile

Unified seller profile linking users to their business presence across multiple domains.

**Fields:**
- `user` (OneToOne): Link to Django user
- `business_name` (CharField): Business display name
- `categories` (JSONField): List of categories seller operates in
- `verified` (BooleanField): Admin verification status
- `rating` (FloatField): Average rating (0.0-5.0)
- `total_listings` (PositiveIntegerField): Active listing count
- `ai_agent_enabled` (BooleanField): AI auto-response toggle
- `phone`, `email`, `website`: Contact information
- `description` (TextField): Business description
- `logo_url` (URLField): Business logo

**Indexes:**
- `(verified, -rating)` - For listing verified sellers by rating
- `(user)` - For user lookups

**Methods:**
- `increment_listing_count()` - Increment total listings
- `decrement_listing_count()` - Decrement total listings
- `update_rating(new_rating)` - Update seller rating

---

#### 2. GenericListing

General-purpose listing model for all marketplace categories with JSON metadata for flexibility.

**Fields:**
- `id` (UUID): Primary key
- `seller` (ForeignKey): Link to SellerProfile
- `title` (CharField): Listing title
- `description` (TextField): Full description
- `category` (CharField): Category choice (vehicles, services, events, activities, marketplace)
- `price` (DecimalField): Price in specified currency
- `currency` (CharField): Currency code (default: EUR)
- `location` (CharField): Location string
- `latitude`, `longitude` (DecimalField): Geographic coordinates
- `image_url` (URLField): Primary image
- `metadata` (JSONField): Category-specific dynamic fields
- `status` (CharField): Status (active, inactive, pending, sold)
- `is_featured` (BooleanField): Featured listing flag
- `views_count` (PositiveIntegerField): View counter

**Indexes:**
- `(category, status)` - Category filtering
- `(seller, status)` - Seller's listings
- `(-created_at)` - Latest listings
- `(location)` - Location searches

**Properties:**
- `price_display` - Formatted price string

**Methods:**
- `increment_views()` - Increment view counter

---

#### 3. ListingImage

Multiple images for a listing with display ordering.

**Fields:**
- `listing` (ForeignKey): Link to GenericListing
- `image_url` (URLField): Image URL
- `caption` (CharField): Image caption
- `display_order` (PositiveIntegerField): Sort order
- `uploaded_at` (DateTimeField): Upload timestamp

---

## API Endpoints

### Base URL: `/api/v1/marketplace/`

### Seller Profile Endpoints

#### 1. List Sellers
```http
GET /api/v1/marketplace/sellers/
```

**Query Parameters:**
- `search` - Search business_name, description
- `verified` - Filter by verification status (true/false)
- `ordering` - Sort by rating, created_at, total_listings

**Response:**
```json
{
  "count": 10,
  "next": "http://...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 5,
      "user_id": 5,
      "username": "seller123",
      "business_name": "Cyprus Services Ltd",
      "categories": ["services", "events"],
      "verified": true,
      "rating": 4.7,
      "total_listings": 12,
      "ai_agent_enabled": true,
      "phone": "+123456789",
      "email": "contact@cyprusservices.com",
      "website": "https://cyprusservices.com",
      "description": "Professional services provider",
      "logo_url": "https://...",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-11-10T15:30:00Z"
    }
  ]
}
```

---

#### 2. Create Seller Profile
```http
POST /api/v1/marketplace/sellers/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "business_name": "My Business",
  "categories": ["vehicles", "services"],
  "phone": "+123456789",
  "email": "contact@mybusiness.com",
  "website": "https://mybusiness.com",
  "description": "We provide quality services"
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "user": 10,
  "user_id": 10,
  "username": "newuser",
  "business_name": "My Business",
  "categories": ["vehicles", "services"],
  "verified": false,
  "rating": 0.0,
  "total_listings": 0,
  "ai_agent_enabled": true,
  ...
}
```

**Errors:**
- `400 Bad Request` - Validation errors or user already has profile
- `401 Unauthorized` - Not authenticated

---

#### 3. Get My Profile
```http
GET /api/v1/marketplace/sellers/me/
Authorization: Bearer <token>
```

**Response:** `200 OK`
Returns current user's seller profile or `404 Not Found`.

---

#### 4. Update Seller Profile
```http
PATCH /api/v1/marketplace/sellers/{id}/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "description": "Updated description",
  "phone": "+987654321"
}
```

**Permission:** Only seller owner or staff can update.

---

### Listing Endpoints

#### 1. List Listings
```http
GET /api/v1/marketplace/listings/
```

**Query Parameters:**
- `category` - Filter by category (vehicles, services, events, activities)
- `location` - Filter by location (case-insensitive contains)
- `min_price` - Minimum price
- `max_price` - Maximum price
- `seller_verified` - Only verified sellers (true/false)
- `search` - Search title, description, location
- `ordering` - Sort by price, created_at, views_count

**Response:**
```json
{
  "count": 50,
  "next": "http://...",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Kayak Rental - Sea Adventure",
      "category": "activities",
      "price": "50.00",
      "currency": "EUR",
      "price_display": "EUR 50.00",
      "location": "Kyrenia",
      "image_url": "https://...",
      "status": "active",
      "is_featured": false,
      "seller_name": "Cyprus Adventures",
      "seller_verified": true,
      "created_at": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

#### 2. Create Listing
```http
POST /api/v1/marketplace/listings/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Professional Photography Services",
  "description": "High-quality event and portrait photography",
  "category": "services",
  "price": "200.00",
  "currency": "EUR",
  "location": "Nicosia",
  "latitude": 35.1856,
  "longitude": 33.3823,
  "image_url": "https://...",
  "metadata": {
    "service_type": "photography",
    "availability": "weekends",
    "equipment": ["DSLR", "drone"]
  }
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Validation errors or user has no seller profile
- `401 Unauthorized` - Not authenticated

---

#### 3. Get Listing Details
```http
GET /api/v1/marketplace/listings/{id}/
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "seller": {
    "id": 5,
    "business_name": "Cyprus Services",
    "verified": true,
    "rating": 4.7,
    ...
  },
  "title": "Professional Photography Services",
  "description": "High-quality event and portrait photography",
  "category": "services",
  "price": "200.00",
  "currency": "EUR",
  "price_display": "EUR 200.00",
  "location": "Nicosia",
  "latitude": "35.185600",
  "longitude": "33.382300",
  "image_url": "https://...",
  "metadata": {
    "service_type": "photography",
    "availability": "weekends"
  },
  "status": "active",
  "is_featured": false,
  "views_count": 42,
  "images": [
    {
      "id": 1,
      "image_url": "https://...",
      "caption": "Sample work 1",
      "display_order": 1,
      "uploaded_at": "2025-11-01T10:00:00Z"
    }
  ],
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-05T14:20:00Z"
}
```

---

#### 4. Update Listing
```http
PATCH /api/v1/marketplace/listings/{id}/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "price": "180.00",
  "description": "Updated description"
}
```

**Permission:** Only listing owner or staff can update.

---

#### 5. Delete Listing
```http
DELETE /api/v1/marketplace/listings/{id}/
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Permission:** Only listing owner or staff can delete.

---

#### 6. Get My Listings
```http
GET /api/v1/marketplace/listings/my-listings/
Authorization: Bearer <token>
```

Returns all listings for current user's seller profile.

---

#### 7. Increment Views
```http
POST /api/v1/marketplace/listings/{id}/increment_views/
```

**Response:**
```json
{
  "views_count": 43
}
```

---

### Listing Image Endpoints

#### 1. List Images
```http
GET /api/v1/marketplace/images/?listing={listing_id}
```

#### 2. Create Image
```http
POST /api/v1/marketplace/images/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "listing": "550e8400-e29b-41d4-a716-446655440000",
  "image_url": "https://...",
  "caption": "Additional view",
  "display_order": 2
}
```

#### 3. Delete Image
```http
DELETE /api/v1/marketplace/images/{id}/
Authorization: Bearer <token>
```

---

## Zep Graph Integration

### Automatic Knowledge Sync

When marketplace entities are created, they're automatically synced to Zep Graph Memory for AI-powered context and recommendations.

#### Seller Profile Creation

Creates triplets:
- `User -> operates_as -> Business`
- `Business -> has_status -> verified_seller` (if verified)
- `Business -> specializes_in -> Category` (for each category)

#### Listing Creation

Creates triplets:
- `Seller -> offers_[category] -> Listing`
- `Listing -> located_in -> Location` (if location exists)
- `Listing -> priced_at -> Price` (if price exists)

**Example:**
```python
# When seller creates a vehicle listing:
graph_mgr.add_fact_triplet(
    user_id="123",
    source_node_name="Cyprus Motors",
    target_node_name="Toyota Corolla 2020",
    fact="offers_vehicles",
    confidence=0.9
)
```

---

## Database Migrations

### Apply Migrations

```bash
# Using Docker:
docker compose exec web python3 manage.py migrate marketplace

# OR locally:
python3 manage.py migrate marketplace
```

**Expected Output:**
```
Running migrations:
  Applying marketplace.0001_initial... OK
```

### Verify Migration

```bash
python3 manage.py showmigrations marketplace

# Should show:
# [X] 0001_initial
```

---

## Testing

### Run Tests

```bash
# Run marketplace tests only:
pytest tests/marketplace/

# Run with coverage:
pytest tests/marketplace/ --cov=marketplace --cov-report=html

# Run specific test class:
pytest tests/marketplace/test_marketplace_basic.py::TestSellerProfile
```

### Test Coverage

- ✅ SellerProfile CRUD operations
- ✅ GenericListing CRUD operations
- ✅ API authentication and permissions
- ✅ Query parameter filtering
- ✅ Listing count auto-increment/decrement
- ✅ Price display formatting
- ✅ View counter functionality
- ✅ ListingImage ordering
- ✅ Permission checks (ownership validation)

---

## Admin Interface

### Access

Navigate to: `http://localhost:8000/admin/marketplace/`

### Features

**SellerProfile Admin:**
- List display: business_name, user, verified, rating, total_listings
- Filters: verified, ai_agent_enabled, created_at
- Search: business_name, username, email
- Organized fieldsets

**GenericListing Admin:**
- List display: title, category, seller, price, location, status, views_count
- Filters: category, status, is_featured, created_at
- Search: title, description, location, seller name
- Inline images editor
- Bulk actions: mark as active/inactive/featured

**ListingImage Admin:**
- List display: listing, caption, display_order, uploaded_at
- Filters: uploaded_at

---

## Usage Examples

### Create Seller Profile & Listing

```python
from marketplace.models import SellerProfile, GenericListing
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username='myuser')

# Create seller profile
seller = SellerProfile.objects.create(
    user=user,
    business_name='Cyprus Adventures',
    categories=['activities', 'events'],
    phone='+123456789',
    email='info@cyprusadventures.com'
)

# Create listing
listing = GenericListing.objects.create(
    seller=seller,
    title='Scuba Diving Experience',
    description='Explore the underwater world of Cyprus',
    category='activities',
    price=Decimal('75.00'),
    currency='EUR',
    location='Ayia Napa',
    metadata={
        'duration': '3 hours',
        'difficulty': 'beginner',
        'includes': ['equipment', 'instructor', 'photos']
    }
)
```

### Query Listings

```python
# Get all vehicle listings
vehicles = GenericListing.objects.filter(category='vehicles', status='active')

# Get verified seller listings in Nicosia
listings = GenericListing.objects.filter(
    seller__verified=True,
    location__icontains='Nicosia'
).select_related('seller')

# Get featured listings under €100
featured = GenericListing.objects.filter(
    is_featured=True,
    price__lt=100
).order_by('-created_at')
```

---

## Next Steps (Phase 2+)

### Phase 2: Request/Response System
- BuyerRequest model
- SellerResponse model
- Request inbox for sellers
- Notification system

### Phase 3: Broadcast System
- Broadcast new requests to relevant sellers
- AI-powered request routing
- Response aggregation

### Phase 4: Advanced AI Integration
- LangGraph context integration
- Automated seller responses
- Smart matching algorithms

### Phase 5: Frontend Dashboard
- shadcn/ui seller dashboard
- Listing management interface
- Request/response UI
- Analytics dashboard

---

## Troubleshooting

### Issue: "User already has a seller profile"

**Cause:** Attempting to create multiple seller profiles for same user.

**Solution:** Use `GET /api/v1/marketplace/sellers/me/` to check existing profile first.

---

### Issue: "You must create a seller profile before creating listings"

**Cause:** User trying to create listing without seller profile.

**Solution:**
```bash
# Create seller profile first
POST /api/v1/marketplace/sellers/
{
  "business_name": "My Business",
  "categories": ["services"]
}

# Then create listing
POST /api/v1/marketplace/listings/
{...}
```

---

### Issue: Migration fails with "relation already exists"

**Cause:** Migration already applied or manual table creation.

**Solution:**
```bash
# Fake the migration
python3 manage.py migrate marketplace 0001_initial --fake

# Or check migration status
python3 manage.py showmigrations marketplace
```

---

## Performance Optimization

### Database Indexes

All critical queries are indexed:
- Seller verification & rating lookups
- Category + status filtering
- Location searches
- Timestamp ordering

### Query Optimization

Use `select_related()` and `prefetch_related()`:

```python
# Efficient listing query with seller data
listings = GenericListing.objects.select_related('seller').prefetch_related('images')

# Admin queryset optimization (already implemented)
queryset = queryset.select_related('seller', 'seller__user')
```

---

## Security Considerations

### Permission Checks

- ✅ Only authenticated users can create profiles/listings
- ✅ Users can only update/delete their own content
- ✅ Staff have full access
- ✅ Non-staff users only see verified sellers

### Data Validation

- ✅ Price must be positive
- ✅ Metadata must be valid JSON dict
- ✅ Category choices enforced
- ✅ Status choices enforced

### Best Practices

- Use JWT authentication (already configured)
- Sanitize user input in metadata fields
- Rate limit listing creation endpoints
- Monitor for spam/abuse

---

## Summary

**Phase 1 Deliverables:**
- ✅ Marketplace Django app created and registered
- ✅ Unified seller & generic listing models
- ✅ REST API with comprehensive filtering
- ✅ Zep Graph integration via signals
- ✅ Django admin interface
- ✅ Database migrations ready
- ✅ Comprehensive test suite
- ✅ Complete API documentation

**Status:** Production-ready for Phase 2 development

**Last Updated:** 2025-11-10
