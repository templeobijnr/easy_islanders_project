# Easy Islanders – Hybrid Architecture & Category Model

## Executive Summary

**Easy Islanders is a hybrid marketplace:**

### **Frontend (User-Facing)**
Curated tourism & leisure focus with 6 prominent categories:
- 🏨 Hotels & Accommodations
- 🚗 Car Rentals
- 📸 Activities & Tours
- 🍽️ Restaurants & Dining
- 🏖️ Beaches
- 💬 AI Chat (intelligent search across ALL backend categories)

### **Backend (Database)**
Unlimited, extensible marketplace that can handle:
- ✅ Tourism products (hotels, cars, activities)
- ✅ Electronics (phones, laptops, cameras)
- ✅ Beauty (hair, makeup, skincare)
- ✅ Fashion (clothing, shoes, jewelry)
- ✅ Home & Living (furniture, appliances)
- ✅ Adult Products (discreetly categorized)
- ✅ **Literally anything else**

**Key Insight:** Users see 6 categories in sidebar/featured section, but AI chat can search and return results from 50+ backend categories.

---

## Frontend Architecture (What Users See)

### Sidebar Navigation (Fixed 6 Categories)
```javascript
const sidebarItems = [
  { id: 'chat', label: 'Chat Assistant', icon: Compass },
  { id: 'accommodation', label: 'Hotels', icon: Home },
  { id: 'car_rental', label: 'Car Rentals', icon: Car },
  { id: 'activities', label: 'Activities', icon: Camera },
  { id: 'dining', label: 'Restaurants', icon: Utensils },
  { id: 'beaches', label: 'Beaches', icon: Waves },
];
```

### Featured Section (Per-Category Tabs)
```
Tabs: [Cars] [Hotels] [Activities] [Restaurants]
Displays: 3 featured items per selected category
```

### Quick Action Buttons
```
[Rent a Car] [Find Hotels] [Things to Do] [Restaurants]
```

### AI Chat (Intelligent Discovery)
```
User: "Show me hair products"
→ AI searches backend (not in sidebar)
→ Returns hair products from database

User: "Find 5-star hotels"
→ AI searches accommodation
→ Returns hotels (also in sidebar featured)

User: "Electronics under 500 euros"
→ AI searches backend electronics category
→ Returns results
```

---

## Backend Architecture (Unlimited Scalability)

### Core Concept: Two-Tier Category System

**Tier 1: Frontend Categories (Fixed, 6 items)**
```
- accommodation
- car_rental
- activities
- dining
- beaches
- (chat is not a category, it's a feature)
```

**Tier 2: Full Database Categories (Unlimited)**
```
Frontend Categories (6):
├── accommodation
├── car_rental
├── activities
├── dining
└── beaches

Backend-Only Categories (40+):
├── electronics (phones, laptops, cameras, audio)
├── beauty (hair, makeup, skincare, grooming, fragrances)
├── fashion (clothing, footwear, jewelry, bags)
├── home_living (furniture, appliances, decor, bedding)
├── food_grocery (groceries, specialty foods, beverages)
├── services (repairs, cleaning, tutoring, events)
├── entertainment (books, music, art, games)
├── vehicles (cars for sale, motorcycles, boats, bicycles)
├── adult_products (discreet category)
├── sports_outdoors (equipment, apparel, activities)
├── pets_animals (pet supplies, pet services)
├── health_wellness (supplements, fitness, medical devices)
├── office_supplies (business, stationery, equipment)
├── toys_games (children's toys, board games, puzzles)
├── books_media (ebooks, audiobooks, movies, music)
├── handmade_crafts (artisan goods, DIY, vintage)
├── jewelry_watches (luxury, fashion, vintage)
├── garden_outdoor (plants, tools, furniture, landscaping)
├── automotive_parts (car parts, accessories, tools)
├── real_estate (property sales, land, commercial)
└── ... infinite flexibility for new categories
```

---

## Django Data Model

### Strategy: Single Universal Model + Dynamic Categories

```python
# assistant/models.py

from django.db import models
from django.contrib.postgres.fields import ArrayField
import uuid

class Category(models.Model):
    """
    Universal category system - handles both frontend & backend categories.
    Frontend shows only specific ones, backend stores all.
    """
    FRONTEND_CATEGORIES = [
        ('accommodation', 'Hotels & Accommodations'),
        ('car_rental', 'Car Rentals'),
        ('activities', 'Activities & Tours'),
        ('dining', 'Restaurants & Dining'),
        ('beaches', 'Beaches'),
    ]
    
    # ALL possible categories (frontend + backend)
    ALL_CATEGORIES = FRONTEND_CATEGORIES + [
        ('electronics', 'Electronics'),
        ('beauty', 'Beauty & Personal Care'),
        ('fashion', 'Fashion'),
        ('home_living', 'Home & Living'),
        ('food_grocery', 'Food & Grocery'),
        ('services', 'Services'),
        ('entertainment', 'Entertainment'),
        ('vehicles', 'Vehicles'),
        ('adult_products', 'Private Goods'),
        ('sports_outdoors', 'Sports & Outdoors'),
        ('pets_animals', 'Pets & Animals'),
        ('health_wellness', 'Health & Wellness'),
        ('office_supplies', 'Office Supplies'),
        ('toys_games', 'Toys & Games'),
        ('books_media', 'Books & Media'),
        ('handmade_crafts', 'Handmade & Crafts'),
        ('jewelry_watches', 'Jewelry & Watches'),
        ('garden_outdoor', 'Garden & Outdoor'),
        ('automotive_parts', 'Automotive Parts'),
        ('real_estate', 'Real Estate'),
        # Add more as needed
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='box')  # Emoji or icon name
    
    # Flag: is this a frontend-featured category?
    is_featured_category = models.BooleanField(
        default=False,
        help_text="If True, appears in sidebar and featured section"
    )
    
    # UI Configuration
    featured_image_url = models.URLField(null=True, blank=True)  # For frontend display
    display_order = models.IntegerField(default=0)  # Sort order in sidebar
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['is_featured_category']),
        ]
    
    def __str__(self):
        return self.name


class Subcategory(models.Model):
    """
    Nested categories for better organization and filtering.
    Examples: Phones, Laptops (under Electronics)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    slug = models.SlugField(max_length=100)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='tag')
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('category', 'slug')
        verbose_name_plural = 'Subcategories'
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return f'{self.category.name} > {self.name}'


class Listing(models.Model):
    """
    Universal product/service listing model.
    Handles hotels, cars, hair products, electronics, etc.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending_verification', 'Pending Verification'),
        ('archived', 'Archived'),
    ]
    
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
        ('vintage', 'Vintage'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey('User', on_delete=models.CASCADE, related_name='listings')
    
    # Core Content
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='listings')
    subcategory = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Pricing & Availability
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    
    # Flexible pricing for different product types
    # "per night", "per day", "per person", "per hour", "per item", etc.
    price_unit = models.CharField(max_length=50, default='per item')
    
    # Inventory
    stock_quantity = models.IntegerField(default=1, help_text="Available units")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    
    # Location
    location = models.CharField(max_length=255, help_text="City, region, or address")
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Media
    image_urls = models.JSONField(default=list, blank=True, help_text="Array of image URLs")
    featured_image_url = models.URLField(null=True, blank=True)
    
    # Metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text='["luxury", "beachfront", "pets-allowed", "wifi"]'
    )
    features = models.JSONField(
        default=list,
        blank=True,
        help_text='Feature list: ["WiFi", "Pool"] or ["AC", "GPS"] or ["Group discount"]'
    )
    
    # Ratings & Reviews
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.IntegerField(default=0)
    
    # Verification (for photo authenticity)
    photos_requested = models.BooleanField(default=False)
    verified_with_photos = models.BooleanField(default=False)
    
    # Monetization
    is_featured = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['location', 'status']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.title} ({self.category.name})'


class ListingImage(models.Model):
    """Store images for listings (max 10 per listing)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['display_order']
    
    def __str__(self):
        return f'Image for {self.listing.title}'


class ListingReview(models.Model):
    """Customer reviews on listings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey('User', on_delete=models.CASCADE)
    rating = models.IntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )
    comment = models.TextField(blank=True)
    verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('listing', 'reviewer')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.rating}★ by {self.reviewer.name} on {self.listing.title}'


class Booking(models.Model):
    """
    Universal booking/reservation model for all product types.
    Hotels: dates, guests
    Cars: dates, driver
    Restaurants: date, time, party size
    Activities: date, time, group size
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    consumer = models.ForeignKey('User', on_delete=models.CASCADE, related_name='bookings')
    
    # Dates & Time
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)  # For restaurants, activities
    end_time = models.TimeField(null=True, blank=True)
    
    # Quantity
    guests = models.IntegerField(default=1, help_text="Guests, party size, group size")
    quantity = models.IntegerField(default=1, help_text="Number of items for product purchases")
    
    # Pricing
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seller_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Additional Info
    special_requests = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['consumer', 'status']),
            models.Index(fields=['listing', 'status']),
        ]
    
    def __str__(self):
        return f'Booking {self.id} - {self.listing.title}'
```

---

## API Endpoints (Unified & Flexible)

### 1. Get Featured Categories (Frontend)
```
GET /api/categories/featured/

Response:
{
  "results": [
    {
      "id": "uuid-accommodation",
      "slug": "accommodation",
      "name": "Hotels & Accommodations",
      "icon": "🏨",
      "is_featured_category": true
    },
    // ... 5 more categories
  ]
}
```

### 2. Get All Categories (Backend)
```
GET /api/categories/?include_all=true

Response:
{
  "count": 50,
  "results": [
    // 6 frontend categories
    // + 44 backend categories (electronics, beauty, etc.)
  ]
}
```

### 3. Search Listings (Unified Search Across All Categories)
```
GET /api/listings/?category=accommodation&location=Kyrenia&min_price=50&max_price=200&language=en

Query Parameters:
- category: Any category slug (accommodation, car_rental, electronics, beauty, etc.)
- location: City/region
- min_price / max_price
- subcategory (optional)
- sort_by: price, rating, newest, featured
- featured: true/false

Response:
{
  "count": 25,
  "results": [
    {
      "id": "uuid-001",
      "title": "Luxury Beachfront Hotel",
      "price": 150,
      "price_unit": "per night",
      "category": "accommodation",
      "rating": 4.8,
      "featured_image_url": "...",
      "is_featured": true
    }
  ]
}
```

### 4. AI Chat Search (Intelligent Intent Classification)
```
POST /api/chat/

Request:
{
  "message": "Show me hair products under 50 euros",
  "language": "en",
  "conversation_id": "uuid-conv-001"
}

Response:
{
  "response": "I found 12 hair products under €50. Here are the top-rated ones:",
  "recommendations": [
    {
      "id": "uuid-hair-001",
      "title": "Premium Hair Serum",
      "price": 35,
      "category": "beauty",
      "subcategory": "hair_products",
      "rating": 4.7,
      "image_url": "..."
    }
  ]
}
```

### 5. Create Listing (Any Category)
```
POST /api/listings/
Authorization: Bearer <token>

Request:
{
  "title": "Professional Hair Straightener",
  "description": "Ceramic ionic straightener...",
  "category_slug": "beauty",
  "subcategory_id": "uuid-hair-tools",
  "price": 89.99,
  "price_unit": "per item",
  "location": "Kyrenia",
  "stock_quantity": 15,
  "condition": "new",
  "tags": ["professional", "ceramic", "ionic"],
  "features": ["3 heat settings", "Auto shutoff", "5-year warranty"]
}

Response (201):
{
  "id": "uuid-product-001",
  "title": "Professional Hair Straightener",
  "category": "beauty",
  "price": 89.99,
  "status": "active",
  "created_at": "2025-10-20T10:00:00Z"
}
```

---

## Frontend Integration (Hybrid Approach)

### Featured Section on Homepage
```javascript
// Always show 6 frontend categories with 3 featured items each
const FRONTEND_CATEGORIES = ['accommodation', 'car_rental', 'activities', 'dining', 'beaches'];

// Fetch only featured items from these categories
GET /api/listings/?category={cat}&featured=true&limit=3
```

### AI Chat (Dynamic, Unlimited)
```javascript
// User can ask about ANY category in backend
// Chat classifies intent and searches database
// Results returned regardless of whether category is in sidebar

User: "Show me hair products"
→ Query: GET /api/listings/?category=beauty&...
→ Returns results even though "beauty" not in sidebar
```

### Sidebar Always Shows 6 Categories
```javascript
const sidebarItems = [
  { id: 'chat', label: 'Chat Assistant' },
  { id: 'accommodation', label: 'Hotels' },
  { id: 'car_rental', label: 'Car Rentals' },
  { id: 'activities', label: 'Activities' },
  { id: 'dining', label: 'Restaurants' },
  { id: 'beaches', label: 'Beaches' },
];
```

---

## How It Works in Practice

### Scenario 1: Tourist Looking for Hotels (Frontend Category)
```
1. User clicks "Hotels" in sidebar
2. Frontend queries: GET /api/listings/?category=accommodation&featured=true
3. Shows featured hotels from database
4. User can book directly
```

### Scenario 2: Consumer Searching for Hair Products (Backend-Only Category)
```
1. User opens Chat
2. User: "Show me hair products under 50 euros"
3. Chat sends: POST /api/chat/ → message: "hair products under 50"
4. AI classifies → beauty category
5. Backend queries: GET /api/listings/?category=beauty&max_price=50
6. Returns hair products (NOT in sidebar, but available via AI)
7. User can view, rate, and possibly order/book
```

### Scenario 3: Business Adding Product to Any Category
```
1. Business creates account
2. Clicks "Create Listing"
3. Selects category: BEAUTY (from dropdown with all 50+ options)
4. Lists hair straightener
5. Listing goes into database
6. AI chat can find it immediately
7. Frontend doesn't show it (not in sidebar), but it's searchable
```

---

## Scalability & Growth

**Day 1:** 6 frontend categories + basic backend structure
**Week 1:** Add 20 backend categories (electronics, beauty, fashion, etc.)
**Month 1:** 50+ backend categories handling everything
**Year 1:** Unlimited categories, AI gets smarter at classification

**The Frontend Never Changes** — always 6 categories
**The Backend Grows Infinitely** — add categories dynamically

---

## Summary

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Categories Shown** | 6 (tourism focused) | 50+ (unlimited) |
| **Featured Section** | Shows 6 categories | Stores all |
| **Chat Search** | Can search all backend | Returns any category |
| **Sidebar** | Fixed 6 items | Not displayed but functional |
| **Product Types** | Hotels, Cars, Activities, Dining, Beaches | Everything: hair, electronics, clothes, sex toys, etc. |
| **Model Flexibility** | Uses unified Listing model | Handles any product type |

**Result:** Curated, focused user experience (6 categories visible) + unlimited marketplace potential (any product searchable via AI).

---

**This is the architecture. Ready for Phase 1 (Authentication)?**
