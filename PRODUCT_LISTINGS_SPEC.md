# Easy Islanders – Product Listings & Category Taxonomy Specification

## Table of Contents
1. [Data Models](#data-models)
2. [Category Taxonomy](#category-taxonomy)
3. [Django Models](#django-models)
4. [Serializers](#serializers)
5. [API Endpoints](#api-endpoints)
6. [AI Agent Integration](#ai-agent-integration)
7. [Implementation Checklist](#implementation-checklist)

---

## Data Models

### Product Listing Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `owner_id` | UUID | References User.id |
| `title` | String(255) | Product name |
| `description` | Text | Product details |
| `category_id` | UUID | References Category.id |
| `subcategory_id` | UUID | References Subcategory.id |
| `price` | Decimal(10,2) | Price of item |
| `currency` | String(3) | ISO currency code (default: EUR) |
| `stock_quantity` | Integer | Available units |
| `condition` | Enum | new, used, refurbished |
| `location` | String(255) | Island region or city |
| `images` | Array[String] | Image URLs (max 10) |
| `tags` | Array[String] | Search tags for classification |
| `status` | Enum | active, inactive, pending_verification |
| `rating` | Decimal(3,2) | Average customer rating (0-5) |
| `reviews_count` | Integer | Number of reviews |
| `created_at` | Timestamp | Listing creation time |
| `updated_at` | Timestamp | Last update |
| `is_featured` | Boolean | Featured listing flag |
| `featured_until` | Timestamp (nullable) | Featured expiration date |

### Category Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | String(100) | Category name (e.g., "Electronics") |
| `slug` | String(100) | URL-safe identifier |
| `description` | Text | Category description |
| `icon` | String(50) | Icon name for UI |
| `parent_id` | UUID (nullable) | For nested hierarchies |
| `created_at` | Timestamp | Creation time |

### Subcategory Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `category_id` | UUID | Parent Category.id |
| `name` | String(100) | Subcategory name (e.g., "Phones") |
| `slug` | String(100) | URL-safe identifier |
| `description` | Text | Subcategory description |
| `icon` | String(50) | Icon name for UI |
| `created_at` | Timestamp | Creation time |

### Business Profile Extension

| Field | Type | Description |
|-------|------|-------------|
| `category_focus` | Array[UUID] | Category IDs business operates in |
| `verified_seller` | Boolean | Platform verified flag |
| `avg_response_time` | Integer | Hours |
| `return_policy` | Text | Return/refund policy |

---

## Category Taxonomy

### Tier-1: Top-Level Categories (10)

| # | Category | Icon | Description |
|---|----------|------|-------------|
| 1 | **Electronics** | 📱 | Tech devices, gadgets, accessories |
| 2 | **Beauty & Personal Care** | 💄 | Hair, skin, makeup, grooming |
| 3 | **Home & Living** | 🏠 | Furniture, appliances, decor |
| 4 | **Fashion** | 👗 | Clothing, footwear, jewelry, bags |
| 5 | **Food & Beverages** | 🍽️ | Restaurants, delivery, groceries |
| 6 | **Services** | 🔧 | Repairs, rentals, cleaning, events |
| 7 | **Entertainment & Leisure** | 🎭 | Experiences, music, art, books |
| 8 | **Private Goods** | 🔒 | Adult products (discreet) |
| 9 | **Vehicles** | 🚗 | Cars, bikes, boats |
| 10 | **Miscellaneous** | 📦 | Other/unclassified |

### Tier-2: Subcategories (Examples per Category)

#### 1. Electronics
- Phones & Tablets
- Computers (Laptops, Desktops)
- Accessories (Chargers, Cases, Cables)
- Audio (Headphones, Speakers)
- Gaming (Consoles, Games)
- Wearables (Smartwatch, Fitness Bands)
- Cameras & Photography

#### 2. Beauty & Personal Care
- Hair Products & Tools
- Skincare
- Makeup
- Grooming (Razors, Trimmers)
- Fragrances
- Supplements & Wellness

#### 3. Home & Living
- Furniture (Beds, Sofas, Tables, Chairs)
- Kitchen & Dining
- Appliances (Microwave, Washing Machine)
- Bedding & Linens
- Home Decor
- Tools & Hardware

#### 4. Fashion
- Men's Clothing
- Women's Clothing
- Kids' Clothing
- Footwear
- Jewelry & Watches
- Bags & Accessories

#### 5. Food & Beverages
- Restaurants (Dine-in, Delivery)
- Grocery & Pantry
- Bakery & Sweets
- Beverages (Coffee, Tea, Juice)
- Fast Food & Takeout
- Specialty Foods

#### 6. Services
- Car Rental
- Home Repair & Maintenance
- Cleaning Services
- Event Planning
- Delivery & Logistics
- Tutoring & Education
- Health & Wellness Services

#### 7. Entertainment & Leisure
- Books & E-books
- Movies & Shows
- Music & Concerts
- Art & Crafts
- Tours & Experiences
- Sports & Recreation

#### 8. Private Goods
- Adult Products (discreet category)

#### 9. Vehicles
- Cars (Sedan, SUV, Coupe, Hatchback)
- Motorcycles & Scooters
- Boats & Watercraft
- Bicycles
- Accessories & Parts

#### 10. Miscellaneous
- Other/Unclassified

---

## Django Models

### assistant/models.py (Extended)

```python
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class Category(models.Model):
    """Top-level product categories"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='box')  # icon name for UI
    parent_id = models.UUIDField(null=True, blank=True)  # for nested categories
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    """Product subcategories (e.g., "Phones" under "Electronics")"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='tag')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('category', 'slug')
        verbose_name_plural = 'Subcategories'
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.category.name} > {self.name}'


class ProductListing(models.Model):
    """Product/service listing by a business"""
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending_verification', 'Pending Verification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey('User', on_delete=models.CASCADE, related_name='product_listings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='product_listings')
    subcategory = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_listings')
    
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='EUR')
    stock_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    
    location = models.CharField(max_length=255)  # e.g., "Kyrenia" or "North Cyprus"
    tags = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    reviews_count = models.IntegerField(default=0)
    
    is_featured = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['location', 'status']),
        ]

    def __str__(self):
        return f'{self.title} (ID: {self.id})'


class ProductImage(models.Model):
    """Images for product listings (max 10 per listing)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(ProductListing, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order']
        constraints = [
            models.UniqueConstraint(fields=['listing'], condition=models.Q(display_order=0), name='one_primary_image_per_listing')
        ]

    def __str__(self):
        return f'Image for {self.listing.title}'


class ProductReview(models.Model):
    """Customer reviews on product listings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(ProductListing, on_delete=models.CASCADE, related_name='product_reviews')
    reviewer = models.ForeignKey('User', on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('listing', 'reviewer')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.rating}★ by {self.reviewer.name} on {self.listing.title}'


# Extend BusinessProfile model to include category focus
class BusinessProfile(models.Model):
    # ... existing fields ...
    category_focus = models.ManyToManyField(Category, related_name='businesses', blank=True)
    verified_seller = models.BooleanField(default=False)
    avg_response_time = models.IntegerField(null=True, blank=True)  # hours
    return_policy = models.TextField(blank=True)
```

---

## Serializers

### assistant/serializers.py (Extended)

```python
from rest_framework import serializers
from .models import Category, Subcategory, ProductListing, ProductImage, ProductReview

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent_id', 'subcategories']

    def get_subcategories(self, obj):
        subs = obj.subcategories.all()
        return SubcategorySerializer(subs, many=True).data


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = ['id', 'category', 'name', 'slug', 'description', 'icon']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'display_order']


class ProductReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.name', read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'reviewer', 'reviewer_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['created_at']


class ProductListingSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(source='product_reviews', many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    owner_name = serializers.CharField(source='owner.name', read_only=True)

    class Meta:
        model = ProductListing
        fields = [
            'id', 'owner', 'owner_name', 'title', 'description',
            'category', 'category_name', 'subcategory', 'subcategory_name',
            'price', 'currency', 'stock_quantity', 'condition',
            'location', 'tags', 'status', 'rating', 'reviews_count',
            'is_featured', 'featured_until', 'images', 'reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'rating', 'reviews_count', 'created_at', 'updated_at']


class ProductListingCreateUpdateSerializer(serializers.ModelSerializer):
    """For create/update operations"""
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProductListing
        fields = [
            'title', 'description', 'category', 'subcategory',
            'price', 'currency', 'stock_quantity', 'condition',
            'location', 'tags', 'status', 'images'
        ]


class ProductListingSearchSerializer(serializers.ModelSerializer):
    """Simplified for search results"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = ProductListing
        fields = [
            'id', 'title', 'price', 'currency', 'location',
            'category', 'category_name', 'rating', 'owner_name',
            'is_featured', 'primary_image'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(display_order=0).first()
        return primary.image_url if primary else None
```

---

## API Endpoints

### 1. Category Endpoints

#### List All Categories
```
GET /api/categories/

Response (200 OK):
{
  "count": 10,
  "results": [
    {
      "id": "uuid-123",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Tech devices and gadgets",
      "icon": "📱",
      "subcategories": [
        {
          "id": "uuid-456",
          "name": "Phones & Tablets",
          "slug": "phones-tablets",
          "icon": "📱"
        },
        ...
      ]
    },
    ...
  ]
}
```

#### Get Category Details
```
GET /api/categories/{category_slug}/

Response (200 OK):
{
  "id": "uuid-123",
  "name": "Electronics",
  "slug": "electronics",
  "description": "...",
  "subcategories": [...]
}
```

---

### 2. Product Listing Endpoints

#### Create Product Listing (Business only)
```
POST /api/products/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "title": "iPhone 15 Pro Max",
  "description": "Excellent condition, 256GB, Space Black",
  "category": "uuid-electronics",
  "subcategory": "uuid-phones",
  "price": 999.99,
  "currency": "EUR",
  "stock_quantity": 5,
  "condition": "new",
  "location": "Kyrenia",
  "tags": ["iphone", "apple", "smartphone", "new"]
}

Response (201 Created):
{
  "id": "uuid-prod-001",
  "owner": "uuid-user-001",
  "owner_name": "Tech Store Kyrenia",
  "title": "iPhone 15 Pro Max",
  "category": "uuid-electronics",
  "category_name": "Electronics",
  "subcategory": "uuid-phones",
  "subcategory_name": "Phones & Tablets",
  "price": 999.99,
  "currency": "EUR",
  "stock_quantity": 5,
  "condition": "new",
  "location": "Kyrenia",
  "status": "active",
  "rating": 0,
  "reviews_count": 0,
  "images": [],
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### List Products (Search & Filter)
```
GET /api/products/?category=electronics&subcategory=phones&location=Kyrenia&min_price=500&max_price=1500&condition=new&language=en

Response (200 OK):
{
  "count": 12,
  "next": "/api/products/?page=2",
  "results": [
    {
      "id": "uuid-prod-001",
      "title": "iPhone 15 Pro Max",
      "price": 999.99,
      "currency": "EUR",
      "location": "Kyrenia",
      "category_name": "Electronics",
      "rating": 4.8,
      "owner_name": "Tech Store Kyrenia",
      "is_featured": true,
      "primary_image": "/media/products/001/img1.jpg"
    },
    ...
  ]
}
```

#### Get Product Details
```
GET /api/products/{product_id}/

Response (200 OK):
{
  "id": "uuid-prod-001",
  "owner": "uuid-user-001",
  "owner_name": "Tech Store Kyrenia",
  "title": "iPhone 15 Pro Max",
  "description": "Excellent condition, 256GB, Space Black",
  "category": "uuid-electronics",
  "category_name": "Electronics",
  "subcategory": "uuid-phones",
  "subcategory_name": "Phones & Tablets",
  "price": 999.99,
  "currency": "EUR",
  "stock_quantity": 5,
  "condition": "new",
  "location": "Kyrenia",
  "status": "active",
  "rating": 4.8,
  "reviews_count": 15,
  "tags": ["iphone", "apple", "smartphone", "new"],
  "is_featured": true,
  "images": [
    { "id": "uuid-img-1", "image_url": "/media/products/001/img1.jpg", "display_order": 0 },
    { "id": "uuid-img-2", "image_url": "/media/products/001/img2.jpg", "display_order": 1 }
  ],
  "reviews": [
    {
      "id": "uuid-rev-1",
      "reviewer_name": "Jane Doe",
      "rating": 5,
      "comment": "Great phone, fast delivery!",
      "created_at": "2025-10-15T10:00:00Z"
    },
    ...
  ],
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### Update Product Listing (Business owner only)
```
PUT /api/products/{product_id}/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "title": "iPhone 15 Pro Max - Updated",
  "price": 950.00,
  "stock_quantity": 3
}

Response (200 OK):
{
  // Updated product object
}
```

#### Delete Product Listing (Business owner only)
```
DELETE /api/products/{product_id}/
Authorization: Bearer <token>

Response (204 No Content):
```

---

### 3. Product Image Endpoints

#### Upload Product Images
```
POST /api/products/{product_id}/upload-images/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Request:
{
  "images": [file1.jpg, file2.jpg, file3.jpg]
}

Response (200 OK):
{
  "images": [
    {
      "id": "uuid-img-1",
      "image_url": "/media/products/001/img1.jpg",
      "display_order": 0
    },
    ...
  ]
}
```

#### Reorder Images
```
PATCH /api/products/{product_id}/reorder-images/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "image_order": ["uuid-img-3", "uuid-img-1", "uuid-img-2"]
}

Response (200 OK):
{
  "images": [
    { "id": "uuid-img-3", "image_url": "...", "display_order": 0 },
    { "id": "uuid-img-1", "image_url": "...", "display_order": 1 },
    { "id": "uuid-img-2", "image_url": "...", "display_order": 2 }
  ]
}
```

---

### 4. Product Review Endpoints

#### Create Review (Consumer after purchase)
```
POST /api/products/{product_id}/reviews/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "rating": 5,
  "comment": "Excellent product and fast delivery!"
}

Response (201 Created):
{
  "id": "uuid-rev-1",
  "reviewer": "uuid-user-002",
  "reviewer_name": "Jane Doe",
  "rating": 5,
  "comment": "Excellent product...",
  "created_at": "2025-10-20T10:00:00Z"
}
```

#### List Product Reviews
```
GET /api/products/{product_id}/reviews/

Response (200 OK):
{
  "count": 15,
  "average_rating": 4.8,
  "results": [
    {
      "id": "uuid-rev-1",
      "reviewer_name": "Jane Doe",
      "rating": 5,
      "comment": "Excellent product...",
      "created_at": "2025-10-20T10:00:00Z"
    },
    ...
  ]
}
```

---

### 5. Featured Listings Endpoint

#### Upgrade to Featured (Business owner)
```
POST /api/products/{product_id}/upgrade-featured/
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "duration_days": 30
}

Response (200 OK):
{
  "id": "uuid-prod-001",
  "is_featured": true,
  "featured_until": "2025-11-20T10:00:00Z",
  "cost": 49.99
}
```

---

## AI Agent Integration

### AI Agent Prompt & Logic

```python
# assistant/brain/agent_utils.py

from assistant.models import Category, Subcategory, ProductListing, ProductReview
from django.db.models import Q

def classify_product_query(user_query: str, language: str = 'en') -> dict:
    """
    Classify user query to category/subcategory using NLP + fallback to fuzzy matching.
    
    Example:
    - "show me iphones" → Category: Electronics, Subcategory: Phones & Tablets
    - "find hair products" → Category: Beauty & Personal Care, Subcategory: Hair Products
    """
    # Normalize query
    query_lower = user_query.lower().strip()
    
    # Build keyword-to-category mapping
    category_keywords = {
        'electronics': ['phone', 'iphone', 'laptop', 'computer', 'headphone', 'speaker', 'camera'],
        'beauty': ['hair', 'shampoo', 'makeup', 'skincare', 'grooming', 'fragrance'],
        'home': ['furniture', 'sofa', 'bed', 'kitchen', 'appliance', 'decor'],
        'fashion': ['clothing', 'dress', 'shirt', 'shoe', 'jewelry', 'bag'],
        'food': ['restaurant', 'delivery', 'grocery', 'coffee', 'bakery', 'food'],
        'services': ['repair', 'cleaning', 'rental', 'event', 'tutor'],
        'entertainment': ['book', 'music', 'concert', 'art', 'tour', 'experience'],
        'vehicles': ['car', 'bike', 'motorcycle', 'boat', 'bicycle'],
    }
    
    # Find matching category
    matched_category = None
    for cat_slug, keywords in category_keywords.items():
        if any(kw in query_lower for kw in keywords):
            try:
                matched_category = Category.objects.get(slug=cat_slug)
                break
            except Category.DoesNotExist:
                pass
    
    return {
        'category': matched_category,
        'confidence': 0.8 if matched_category else 0.0
    }


def search_products_by_user_intent(
    user_query: str,
    language: str = 'en',
    location: str = None,
    limit: int = 10
) -> list:
    """
    Main function for AI agent to fetch products based on user query.
    
    Steps:
    1. Classify user query to category/subcategory
    2. Apply filters (location, price range if mentioned)
    3. Return active listings, ordered by relevance
    """
    # Classify query
    classification = classify_product_query(user_query, language)
    category = classification.get('category')
    
    # Build query
    queryset = ProductListing.objects.filter(status='active')
    
    if category:
        queryset = queryset.filter(category=category)
    
    if location:
        queryset = queryset.filter(location__icontains=location)
    
    # Order by featured first, then rating, then recency
    queryset = queryset.order_by('-is_featured', '-rating', '-created_at')
    
    # Return serialized results
    from assistant.serializers import ProductListingSearchSerializer
    return ProductListingSearchSerializer(queryset[:limit], many=True).data


def build_product_recommendation_card(product_id: str) -> dict:
    """
    Build a formatted product card for chat display.
    
    Used by chat endpoint when recommending products.
    """
    try:
        product = ProductListing.objects.get(id=product_id)
        primary_image = product.images.filter(display_order=0).first()
        
        return {
            "id": str(product.id),
            "title": product.title,
            "description": product.description,
            "price": str(product.price),
            "currency": product.currency,
            "location": product.location,
            "category": product.category.name if product.category else "Unknown",
            "condition": product.condition,
            "stock_quantity": product.stock_quantity,
            "rating": float(product.rating),
            "reviews_count": product.reviews_count,
            "image_url": primary_image.image_url if primary_image else None,
            "owner_name": product.owner.name,
            "is_featured": product.is_featured,
            "auto_display": True,
        }
    except ProductListing.DoesNotExist:
        return {}


# Integration with chat agent
def chat_handle_product_search(message: str, language: str = 'en') -> dict:
    """
    Called by chat endpoint when user asks about products.
    
    Returns:
    {
      "message": "Here are some electronics I found...",
      "language": "en",
      "products": [list of product cards]
    }
    """
    products = search_products_by_user_intent(message, language, limit=3)
    
    if not products:
        return {
            "message": "Sorry, I didn't find any products matching your query. Try searching for electronics, clothing, or services.",
            "language": language,
            "products": []
        }
    
    product_cards = [build_product_recommendation_card(p['id']) for p in products]
    
    return {
        "message": f"I found {len(product_cards)} products matching your search. Here are the best options:",
        "language": language,
        "products": product_cards,
        "recommendations": product_cards
    }
```

### Backend Viewsets

```python
# assistant/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Category, Subcategory, ProductListing
from .serializers import CategorySerializer, ProductListingSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve categories with subcategories"""
    queryset = Category.objects.prefetch_related('subcategories')
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def list(self, request, *args, **kwargs):
        """GET /api/categories/"""
        return super().list(request, *args, **kwargs)


class ProductListingViewSet(viewsets.ModelViewSet):
    """CRUD operations on product listings"""
    queryset = ProductListing.objects.select_related('owner', 'category', 'subcategory').prefetch_related('images', 'product_reviews')
    serializer_class = ProductListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['category', 'subcategory', 'location', 'condition', 'status']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['price', 'created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by min/max price
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by owner (business)
        owner = self.request.query_params.get('owner')
        if owner:
            queryset = queryset.filter(owner__id=owner)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set owner to current user"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def upload_images(self, request, pk=None):
        """POST /api/products/{id}/upload-images/"""
        product = self.get_object()
        images = request.FILES.getlist('images')
        
        # Limit to 10 images
        if len(images) > 10:
            return Response(
                {'error': 'Maximum 10 images per listing'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Upload images
        for idx, image_file in enumerate(images):
            # TODO: Upload to S3/Cloudflare and get URL
            # For now: assume image_url provided in request
            pass
        
        return Response({'images': []}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def upgrade_featured(self, request, pk=None):
        """POST /api/products/{id}/upgrade-featured/"""
        product = self.get_object()
        duration_days = request.data.get('duration_days', 30)
        
        # TODO: Process payment via Stripe
        # For now: just set featured flag
        from datetime import timedelta
        product.is_featured = True
        product.featured_until = timezone.now() + timedelta(days=duration_days)
        product.save()
        
        return Response({
            'id': product.id,
            'is_featured': True,
            'featured_until': product.featured_until,
            'cost': 49.99
        })
```

---

## Implementation Checklist

### Phase 3A: Product Models (Week 3)

- [ ] Create `Category` model
- [ ] Create `Subcategory` model
- [ ] Create `ProductListing` model
- [ ] Create `ProductImage` model
- [ ] Create `ProductReview` model
- [ ] Create database migration files
- [ ] Run `python manage.py migrate`
- [ ] Seed categories & subcategories (fixture/management command)
- [ ] Test model relationships in Django shell

### Phase 3B: API Endpoints (Week 3–4)

- [ ] Create serializers (Category, Subcategory, ProductListing, ProductReview)
- [ ] Create viewsets (CategoryViewSet, ProductListingViewSet)
- [ ] Register routes in `urls.py`
- [ ] Test GET endpoints (list/retrieve categories and products)
- [ ] Test POST/PUT/DELETE endpoints (create, update, delete products)
- [ ] Test image upload
- [ ] Test search & filter by category, location, price, condition

### Phase 3C: AI Agent Integration (Week 4)

- [ ] Implement `classify_product_query()` function
- [ ] Implement `search_products_by_user_intent()` function
- [ ] Implement `build_product_recommendation_card()` function
- [ ] Wire chat endpoint to call product search (when user queries product-related keywords)
- [ ] Test chat → product search flow (e.g., "show me iphones")

### Phase 3D: Frontend Integration (Week 4)

- [ ] Add product card display component
- [ ] Wire category tabs in featured section (use product API instead of hardcoded)
- [ ] Add product search/filter UI (if needed)
- [ ] Test end-to-end: API → Frontend rendering

### Testing

- [ ] Manual: Create product, upload images, update, delete
- [ ] Manual: Search by category, location, price range
- [ ] Manual: Chat queries trigger product search
- [ ] Automated: pytest for model creation, API endpoints, search logic

---

## Database Seed Script

### management/commands/seed_categories.py

```python
from django.core.management.base import BaseCommand
from assistant.models import Category, Subcategory

class Command(BaseCommand):
    help = 'Seed product categories and subcategories'

    def handle(self, *args, **options):
        categories_data = {
            'electronics': {
                'name': 'Electronics',
                'icon': '📱',
                'subcategories': ['Phones & Tablets', 'Computers', 'Accessories', 'Audio', 'Gaming', 'Wearables', 'Cameras']
            },
            'beauty': {
                'name': 'Beauty & Personal Care',
                'icon': '💄',
                'subcategories': ['Hair Products', 'Skincare', 'Makeup', 'Grooming', 'Fragrances', 'Supplements']
            },
            # ... add remaining 8 categories
        }
        
        for slug, cat_data in categories_data.items():
            category, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': cat_data['name'], 'icon': cat_data['icon']}
            )
            
            for sub_name in cat_data['subcategories']:
                sub_slug = sub_name.lower().replace(' ', '-').replace('&', 'and')
                Subcategory.objects.get_or_create(
                    category=category,
                    slug=sub_slug,
                    defaults={'name': sub_name}
                )
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded categories'))
```

Run: `python manage.py seed_categories`

---

## Success Metrics (Phase 3)

By end of Phase 3:
- ✅ 10 top-level categories created
- ✅ 60+ subcategories created
- ✅ Businesses can create product listings with images
- ✅ Consumers can search by category, location, price
- ✅ AI agent classifies user queries and returns product recommendations
- ✅ Chat integration: "show me iphones" → fetches Electronics > Phones products
- ✅ All CRUD operations tested and working

---

Good luck! 🚀
