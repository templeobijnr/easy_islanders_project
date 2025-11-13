# Categories Implementation Plan - Backend & Frontend

## BACKEND IMPLEMENTATION

### Phase 1: Seed Data & Management Command

**File:** `listings/management/commands/seed_categories.py`

```python
from django.core.management.base import BaseCommand
from listings.models import Category, SubCategory
import json

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Define categories with schemas
        categories_data = [
            {
                "name": "Real Estate",
                "slug": "real-estate",
                "icon": "home",
                "color": "#FF6B6B",
                "is_bookable": True,
                "description": "Buy, sell, or rent properties",
                "schema": {
                    "fields": [
                        {"name": "transaction_type", "type": "select", "label": "Type", "choices": ["sale", "rent"], "required": True},
                        {"name": "rental_period", "type": "select", "label": "Rental Period", "choices": ["daily", "weekly", "monthly", "yearly"], "required_if": "transaction_type==rent"},
                        {"name": "bedrooms", "type": "number", "label": "Bedrooms", "min": 0, "max": 20},
                        {"name": "bathrooms", "type": "number", "label": "Bathrooms", "min": 0, "max": 10},
                        {"name": "sqft", "type": "number", "label": "Square Feet"},
                        {"name": "furnished", "type": "boolean", "label": "Furnished"},
                    ]
                },
                "subcategories": [
                    {"name": "House", "slug": "house"},
                    {"name": "Apartment", "slug": "apartment"},
                    {"name": "Villa", "slug": "villa"},
                    {"name": "Bungalow", "slug": "bungalow"},
                    {"name": "Townhouse", "slug": "townhouse"},
                    {"name": "Penthouse", "slug": "penthouse"},
                    {"name": "Hotel/Resort", "slug": "hotel-resort"},
                    {"name": "Office/Commercial", "slug": "office-commercial"},
                    {"name": "Land/Plot", "slug": "land-plot"},
                ]
            },
            {
                "name": "Vehicles",
                "slug": "vehicles",
                "icon": "car",
                "color": "#4ECDC4",
                "is_bookable": True,
                "description": "Buy, sell, or rent vehicles",
                "schema": {...},
                "subcategories": [...]
            },
            # ... more categories
        ]
        
        for cat_data in categories_data:
            subcats = cat_data.pop("subcategories", [])
            cat, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults=cat_data
            )
            for subcat in subcats:
                SubCategory.objects.get_or_create(
                    category=cat,
                    slug=subcat["slug"],
                    defaults={"name": subcat["name"]}
                )
```

### Phase 2: API Endpoints

**File:** `listings/views.py`

```python
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from listings.models import Category, SubCategory, Listing
from listings.serializers import CategorySerializer, ListingSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/categories/ - List all categories with schemas
    GET /api/categories/{id}/ - Get single category with subcategories
    GET /api/categories/{id}/subcategories/ - Get subcategories for category
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def subcategories(self, request, slug=None):
        category = self.get_object()
        subcats = category.subcategories.all()
        serializer = SubCategorySerializer(subcats, many=True)
        return Response(serializer.data)

class ListingViewSet(viewsets.ModelViewSet):
    """
    POST /api/listings/ - Create listing with category, subcategory, dynamic_fields
    GET /api/listings/?category=real-estate&subcategory=apartment - Filter by category/subcategory
    GET /api/listings/?search=2br+apartment - Full-text search
    """
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    filterset_fields = ['category__slug', 'subcategory__slug', 'status', 'is_featured']
    ordering_fields = ['created_at', 'price', 'views']
```

**File:** `listings/serializers.py`

```python
from rest_framework import serializers
from listings.models import Category, SubCategory, Listing

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug', 'description']

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'color', 'description', 'schema', 'is_bookable', 'subcategories']

class ListingSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'category', 'category_name', 'subcategory', 'subcategory_name',
            'title', 'description', 'price', 'currency', 'location', 'latitude', 'longitude',
            'dynamic_fields', 'status', 'is_featured', 'images', 'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validate dynamic_fields against category schema"""
        category = data.get('category')
        dynamic_fields = data.get('dynamic_fields', {})
        
        if category and dynamic_fields:
            schema = category.schema
            # Validate that provided fields match schema
            # Check required fields, types, choices, etc.
        return data
```

### Phase 3: URL Routing

**File:** `listings/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from listings.views import CategoryViewSet, ListingViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'listings', ListingViewSet, basename='listing')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

### Phase 4: Advanced Features

**A. Search & Filtering Service**

```python
# listings/services.py
from django.db.models import Q
from listings.models import Listing

class ListingSearchService:
    @staticmethod
    def search_by_category(category_slug, filters=None):
        """Search listings by category with optional filters"""
        qs = Listing.objects.filter(category__slug=category_slug, status='active')
        
        if filters:
            # Apply dynamic field filters
            if 'min_price' in filters:
                qs = qs.filter(price__gte=filters['min_price'])
            if 'max_price' in filters:
                qs = qs.filter(price__lte=filters['max_price'])
            if 'bedrooms' in filters:
                qs = qs.filter(dynamic_fields__bedrooms=filters['bedrooms'])
        
        return qs
    
    @staticmethod
    def full_text_search(query):
        """Full-text search across all categories"""
        return Listing.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).filter(status='active')
```

**B. Booking Service**

```python
# bookings/services.py
class BookingService:
    @staticmethod
    def can_book_category(category):
        """Check if category supports bookings"""
        return category.is_bookable
    
    @staticmethod
    def get_available_slots(listing):
        """Get available booking slots from dynamic_fields"""
        slots = listing.dynamic_fields.get('available_slots', [])
        return [slot for slot in slots if not slot['booked']]
```

---

## FRONTEND IMPLEMENTATION

### Architecture Overview

```
frontend/src/
├── features/
│   ├── categories/
│   │   ├── components/
│   │   │   ├── CategoryBrowser.tsx      # Browse by category
│   │   │   ├── CategoryCard.tsx         # Individual category card
│   │   │   └── SubcategoryFilter.tsx    # Filter by subcategory
│   │   ├── pages/
│   │   │   └── CategoryPage.tsx         # Category detail view
│   │   └── hooks/
│   │       ├── useCategories.ts         # Fetch categories
│   │       └── useListingsByCategory.ts # Fetch listings for category
│   │
│   ├── listings/
│   │   ├── components/
│   │   │   ├── ListingCard.tsx          # Generic listing card (category-aware)
│   │   │   ├── DynamicListingForm.tsx   # Form builder based on schema
│   │   │   ├── RealEstateListing.tsx    # Category-specific components
│   │   │   ├── VehicleListing.tsx
│   │   │   ├── ElectronicsListing.tsx
│   │   │   ├── ServiceListing.tsx
│   │   │   └── ActivityListing.tsx
│   │   ├── pages/
│   │   │   ├── ListingDetailPage.tsx
│   │   │   └── CreateListingPage.tsx
│   │   └── hooks/
│   │       ├── useListings.ts
│   │       └── useListing.ts
│   │
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx            # Cross-category search
│   │   │   └── FilterPanel.tsx          # Dynamic filters based on category
│   │   └── pages/
│   │       └── SearchResultsPage.tsx
│   │
│   └── home/
│       ├── components/
│       │   ├── HeroSection.tsx
│       │   ├── CategoryGrid.tsx         # Show all 9 categories
│       │   └── FeaturedListings.tsx     # Mixed category listings
│       └── pages/
│           └── HomePage.tsx
│
└── types/
    ├── category.ts
    ├── listing.ts
    └── schema.ts
```

### Phase 1: Core Types & Hooks

**File:** `frontend/src/types/category.ts`

```typescript
export interface Schema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'time' | 'array';
  label: string;
  required?: boolean;
  required_if?: string; // conditional logic
  choices?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  schema: Schema;
  is_bookable: boolean;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Listing {
  id: string;
  owner: string;
  category: Category;
  subcategory: SubCategory;
  title: string;
  description: string;
  price?: number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  dynamic_fields: Record<string, any>;
  status: 'draft' | 'active' | 'paused' | 'sold';
  is_featured: boolean;
  images: ListingImage[];
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  image: string;
  uploaded_at: string;
}
```

**File:** `frontend/src/features/categories/hooks/useCategories.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Category } from '@/types/category';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/api/categories/');
      return response.data as Category[];
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/api/categories/${slug}/`);
      return response.data as Category;
    },
  });
}
```

### Phase 2: Dynamic Form Rendering

**File:** `frontend/src/features/listings/components/DynamicListingForm.tsx`

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { Category, Schema, SchemaField } from '@/types/category';

interface DynamicListingFormProps {
  category: Category;
  onSubmit: (data: Record<string, any>) => void;
}

export const DynamicListingForm: React.FC<DynamicListingFormProps> = ({
  category,
  onSubmit,
}) => {
  const { register, watch, handleSubmit, formState: { errors } } = useForm();
  const formValues = watch();

  const renderField = (field: SchemaField) => {
    // Check conditional logic
    if (field.required_if) {
      const [fieldName, condition] = field.required_if.split('==');
      if (formValues[fieldName] !== condition) {
        return null;
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <input
            key={field.name}
            type="text"
            placeholder={field.placeholder || field.label}
            {...register(field.name, { required: field.required })}
            className="form-input"
          />
        );
      case 'number':
        return (
          <input
            key={field.name}
            type="number"
            placeholder={field.label}
            min={field.min}
            max={field.max}
            {...register(field.name, { required: field.required })}
            className="form-input"
          />
        );
      case 'boolean':
        return (
          <label key={field.name} className="checkbox-label">
            <input
              type="checkbox"
              {...register(field.name)}
              className="form-checkbox"
            />
            {field.label}
          </label>
        );
      case 'select':
        return (
          <select
            key={field.name}
            {...register(field.name, { required: field.required })}
            className="form-select"
          >
            <option value="">Select {field.label}</option>
            {field.choices?.map(choice => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            key={field.name}
            type="date"
            {...register(field.name, { required: field.required })}
            className="form-input"
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-xl font-bold">{category.name} Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {category.schema.fields.map(renderField)}
      </div>
      <button type="submit" className="btn btn-primary">
        Create Listing
      </button>
    </form>
  );
};
```

### Phase 3: Category-Specific Components

**File:** `frontend/src/features/listings/components/RealEstateListing.tsx`

```typescript
import React from 'react';
import { Listing } from '@/types/category';
import { MapPin, DollarSign, Home } from 'lucide-react';

interface RealEstateListingProps {
  listing: Listing;
}

export const RealEstateListing: React.FC<RealEstateListingProps> = ({ listing }) => {
  const { dynamic_fields } = listing;
  const isRental = dynamic_fields.transaction_type === 'rent';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image Carousel */}
      <div className="relative bg-gray-200 h-48">
        {listing.images[0] ? (
          <img src={listing.images[0].image} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full"><Home size={48} /></div>
        )}
        {listing.is_featured && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded">Featured</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{listing.title}</h3>
        
        {/* Property Details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          {dynamic_fields.bedrooms && (
            <div>🛏️ {dynamic_fields.bedrooms} Bedrooms</div>
          )}
          {dynamic_fields.bathrooms && (
            <div>🚿 {dynamic_fields.bathrooms} Bathrooms</div>
          )}
          {dynamic_fields.sqft && (
            <div>📐 {dynamic_fields.sqft} sqft</div>
          )}
          {dynamic_fields.furnished && (
            <div>✓ Furnished</div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1 text-lg font-bold text-green-600">
            <DollarSign size={20} />
            {listing.price} {listing.currency}
            {isRental && `/${dynamic_fields.rental_period}`}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
          <MapPin size={16} />
          {listing.location}
        </div>

        {/* CTA */}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {listing.category.is_bookable ? 'Book Now' : 'View Details'}
        </button>
      </div>
    </div>
  );
};
```

**File:** `frontend/src/features/listings/components/VehicleListing.tsx`

```typescript
import React from 'react';
import { Listing } from '@/types/category';
import { Car, Gauge, Zap } from 'lucide-react';

export const VehicleListing: React.FC<{ listing: Listing }> = ({ listing }) => {
  const { dynamic_fields } = listing;
  const isRental = dynamic_fields.transaction_type === 'rental';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="relative bg-gray-200 h-48">
        {listing.images[0] ? (
          <img src={listing.images[0].image} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full"><Car size={48} /></div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{listing.title}</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          {dynamic_fields.year && <div>📅 {dynamic_fields.year}</div>}
          {dynamic_fields.mileage && (
            <div className="flex items-center gap-1">
              <Gauge size={16} /> {dynamic_fields.mileage} km
            </div>
          )}
          {dynamic_fields.fuel_type && <div>⛽ {dynamic_fields.fuel_type}</div>}
          {dynamic_fields.transmission && <div>🔧 {dynamic_fields.transmission}</div>}
        </div>

        <div className="text-lg font-bold text-green-600 mb-3">
          {listing.price} {listing.currency}
          {isRental && `/${dynamic_fields.rental_period}`}
        </div>

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {isRental ? 'Book Rental' : 'View Details'}
        </button>
      </div>
    </div>
  );
};
```

### Phase 4: Browse by Category

**File:** `frontend/src/features/categories/components/CategoryBrowser.tsx`

```typescript
import React from 'react';
import { useCategories } from '../hooks/useCategories';
import { CategoryCard } from './CategoryCard';
import { Skeleton } from '@/components/ui/Skeleton';

export const CategoryBrowser: React.FC = () => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {Array(9).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {categories?.map(category => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};
```

**File:** `frontend/src/features/categories/components/CategoryCard.tsx`

```typescript
import React from 'react';
import { Category } from '@/types/category';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const navigate = useNavigate();
  // @ts-ignore - Dynamic icon lookup
  const IconComponent = LucideIcons[category.icon] || LucideIcons.Package;

  return (
    <div
      onClick={() => navigate(`/category/${category.slug}`)}
      className="cursor-pointer rounded-lg p-6 text-white transition transform hover:scale-105 hover:shadow-lg"
      style={{ backgroundColor: category.color }}
    >
      <IconComponent size={40} className="mb-3" />
      <h3 className="text-lg font-bold">{category.name}</h3>
      <p className="text-sm opacity-90">{category.description}</p>
      <div className="mt-3 text-xs">
        {category.subcategories.length} subcategories
        {category.is_bookable && ' • Bookable'}
      </div>
    </div>
  );
};
```

### Phase 5: Search & Filter

**File:** `frontend/src/features/search/components/FilterPanel.tsx`

```typescript
import React from 'react';
import { Category } from '@/types/category';

interface FilterPanelProps {
  category: Category;
  onFilterChange: (filters: Record<string, any>) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  category,
  onFilterChange,
}) => {
  const [filters, setFilters] = React.useState<Record<string, any>>({});

  const handleChange = (key: string, value: any) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded">
      <h3 className="font-bold text-lg">Filters</h3>
      
      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-2">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            onChange={(e) => handleChange('min_price', e.target.value)}
            className="w-1/2 px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Max"
            onChange={(e) => handleChange('max_price', e.target.value)}
            className="w-1/2 px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Category-Specific Filters */}
      {category.schema.fields.map(field => {
        if (field.type === 'select' && field.choices) {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-2">{field.label}</label>
              <select
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All {field.label}</option>
                {field.choices.map(choice => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
```

### Phase 6: Layout Components

**File:** `frontend/src/features/home/components/CategoryGrid.tsx`

```typescript
import React from 'react';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategoryCard } from '@/features/categories/components/CategoryCard';

export const CategoryGrid: React.FC = () => {
  const { data: categories } = useCategories();

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8">Browse All Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {categories?.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
};
```

**File:** `frontend/src/features/listings/components/ListingCard.tsx`

```typescript
import React from 'react';
import { Listing } from '@/types/category';
import { RealEstateListing } from './RealEstateListing';
import { VehicleListing } from './VehicleListing';
import { ElectronicsListing } from './ElectronicsListing';
import { ActivityListing } from './ActivityListing';
import { ServiceListing } from './ServiceListing';
import { GenericListing } from './GenericListing';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const slug = listing.category.slug;

  switch (slug) {
    case 'real-estate':
      return <RealEstateListing listing={listing} />;
    case 'vehicles':
      return <VehicleListing listing={listing} />;
    case 'electronics':
      return <ElectronicsListing listing={listing} />;
    case 'activities':
      return <ActivityListing listing={listing} />;
    case 'services':
      return <ServiceListing listing={listing} />;
    default:
      return <GenericListing listing={listing} />;
  }
};
```

---

## Implementation Timeline

### Week 1: Backend Foundation
- [ ] Create seed_categories.py management command
- [ ] Implement CategoryViewSet & ListingViewSet
- [ ] Add serializers and validation
- [ ] Add search and filtering service

### Week 2: Backend Advanced Features
- [ ] Add dynamic field validation
- [ ] Implement booking service logic
- [ ] Add advanced search/filters
- [ ] Write tests for all endpoints

### Week 3: Frontend Types & Hooks
- [ ] Define TypeScript types
- [ ] Implement useCategories hook
- [ ] Implement useListings hook
- [ ] Add React Query setup

### Week 4: Frontend Forms & Components
- [ ] Build DynamicListingForm
- [ ] Create category-specific listing components (5-6 variants)
- [ ] Build CategoryBrowser and CategoryCard
- [ ] Add FilterPanel

### Week 5: Frontend Integration
- [ ] Implement SearchResultsPage
- [ ] Create CreateListingPage with multi-step form
- [ ] Add CategoryPage
- [ ] Build ListingDetailPage with booking UI

### Week 6: Polish & Testing
- [ ] Add responsive design refinements
- [ ] Implement error handling
- [ ] Write integration tests
- [ ] Performance optimization (lazy loading, code splitting)

---

## Multi-Domain Frontend Strategy

### 1. Visual Differentiation
- Each category has unique color scheme (stored in DB)
- Category-specific icons (Lucide icons)
- Visual cards tailored to listing type

### 2. Dynamic Form Rendering
- Single form component renders different fields per category
- Conditional field display based on schema
- Type validation by schema

### 3. Smart Search
- Cross-category full-text search on homepage
- Category-filtered search with dynamic filters
- Suggested searches by category

### 4. Navigation Structure
```
/                          (Browse all categories)
/category/{slug}           (Category browse with listings)
/category/{slug}/listings  (Filtered listings)
/create-listing            (Multi-step: select category → fill form)
/listings/{id}             (Detail view, category-aware)
/search?q=term&category=X  (Search results)
```

### 5. Responsive Considerations
- Mobile: 2-column category grid → 1 column
- Tablet: 3 columns
- Desktop: 3 columns with detailed preview
- Listing cards responsive with image lazy loading
