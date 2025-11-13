# Frontend Listings System - Setup & Integration Guide

## Overview

Complete frontend implementation for the dynamic listings system with:
- ✅ Type-safe category and listing models
- ✅ Hooks for data fetching and management
- ✅ Dynamic form generation based on category schemas
- ✅ Category-specific listing renderers
- ✅ Full CRUD operations
- ✅ Search and filtering
- ✅ Integration tests

## What Was Built

### 1. Type Definitions (`src/types/`)
- **`category.ts`** - Category, SubCategory, SchemaField types
- **`listing.ts`** - Listing, CreateListingRequest, ListingFilters types
- **`schema.ts`** - Unified exports and API response types

### 2. API Client (`src/services/`)
- **`apiClient.ts`** - HTTP wrapper with auth, error handling, timeouts

### 3. Data Hooks (`src/hooks/`)
- **`useCategories.ts`** - Category fetching and helpers
  - `useCategories()` - Get all categories
  - `useSubCategories(slug)` - Get subcategories
  
- **`useListings.ts`** - Complete listing management
  - `useListings()` - Fetch with filters
  - `useMyListings()` - User's own listings
  - CRUD: create, update, delete

### 4. Form Components (`src/features/listings/components/`)
- **`DynamicListingForm.tsx`** - Main form with validation
- **`DynamicFieldRenderer.tsx`** - Field type renderer

### 5. Display Components
- **`ListingCard.tsx`** - Router component
- **`RealEstateListing.tsx`** - Real estate specific
- **`VehiclesListing.tsx`** - Vehicles specific
- **`ServicesListing.tsx`** - Services specific

### 6. Example Page
- **`src/pages/ListingsIntegrationPage.tsx`** - Full integration example
  - Category selection
  - Dynamic form rendering
  - Listing grid with search/filter
  - Category-specific displays

### 7. Tests
- **`src/__tests__/listings.integration.test.ts`** - 20+ test cases

## Getting Started

### 1. Configure API URL

Create `.env.local` in frontend root:
```env
REACT_APP_API_URL=http://localhost:8000
```

### 2. Install Dependencies

If not already done:
```bash
cd frontend
npm ci
```

### 3. Test the Integration Page

Add route to `src/App.tsx` or Router:
```typescript
import ListingsIntegrationPage from './pages/ListingsIntegrationPage';

<Route path="/marketplace" element={<ListingsIntegrationPage />} />
```

Visit: `http://localhost:3000/marketplace`

### 4. Run Tests

```bash
npm test -- src/__tests__/listings.integration.test.ts
```

## Backend Requirements

### Categories

Must have at least these categories created in Django admin or via API:

```python
# Django shell or management command
from listings.models import Category

Category.objects.create(
    name="Real Estate",
    slug="real-estate",
    description="Rent or buy properties",
    is_active=True,
    schema={
        "fields": [
            {"name": "bedrooms", "type": "number", "label": "Bedrooms", "required": True},
            {"name": "bathrooms", "type": "number", "label": "Bathrooms", "required": False},
            {"name": "furnished", "type": "boolean", "label": "Furnished", "required": False},
            {"name": "amenities", "type": "multi-select", "label": "Amenities",
             "choices": ["wifi", "parking", "pool", "ac"], "required": False},
        ]
    },
    is_bookable=True,
    icon="Home",
    color="#3B82F6"
)

Category.objects.create(
    name="Vehicles",
    slug="vehicles",
    description="Buy or sell vehicles",
    schema={
        "fields": [
            {"name": "make", "type": "text", "label": "Make", "required": True},
            {"name": "model", "type": "text", "label": "Model", "required": True},
            {"name": "year", "type": "number", "label": "Year", "required": True},
            {"name": "mileage", "type": "number", "label": "Mileage (km)", "required": False},
            {"name": "fuel_type", "type": "select", "label": "Fuel Type",
             "choices": ["petrol", "diesel", "electric", "hybrid"], "required": False},
        ]
    },
    is_bookable=False,
    icon="Car",
    color="#EF4444"
)

Category.objects.create(
    name="Services",
    slug="services",
    description="Offer or request services",
    schema={
        "fields": [
            {"name": "service_type", "type": "text", "label": "Service Type", "required": True},
            {"name": "experience", "type": "text", "label": "Years of Experience", "required": False},
            {"name": "skills", "type": "multi-select", "label": "Skills",
             "choices": ["plumbing", "electrical", "carpentry", "cleaning"], "required": False},
        ]
    },
    is_bookable=True,
    icon="Wrench",
    color="#10B981"
)
```

### API Endpoints

Verify these endpoints exist in Django:
- ✅ `GET /api/categories/` - List categories
- ✅ `GET /api/categories/{slug}/subcategories/` - Get subcategories
- ✅ `GET /api/listings/` - List listings
- ✅ `POST /api/listings/` - Create listing
- ✅ `GET /api/listings/{id}/` - Get listing
- ✅ `PATCH /api/listings/{id}/` - Update listing
- ✅ `DELETE /api/listings/{id}/` - Delete listing

All endpoints should be working per your existing implementation.

## Usage Examples

### Basic: Display Category List

```typescript
import { useCategories } from './hooks/useCategories';

function CategoryList() {
  const { categories, isLoading } = useCategories();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {categories.map(cat => (
        <div key={cat.id}>
          <h3>{cat.name}</h3>
          <p>{cat.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Intermediate: Create Listing with Dynamic Form

```typescript
import { useListings } from './hooks/useListings';
import DynamicListingForm from './features/listings/components/DynamicListingForm';

function CreateListing({ category }) {
  const { createListing } = useListings();

  return (
    <DynamicListingForm
      category={category}
      onSubmit={async (data) => {
        await createListing(data);
      }}
    />
  );
}
```

### Advanced: Search and Display with Category-Specific Cards

```typescript
import { useListings } from './hooks/useListings';
import ListingCard from './features/listings/components/ListingCard';

function ListingGrid() {
  const { listings, searchListings, filterListings } = useListings();

  return (
    <>
      <form onSubmit={(e) => {
        e.preventDefault();
        searchListings('apartment');
      }}>
        <input type="text" placeholder="Search..." />
        <button type="submit">Search</button>
      </form>

      <div className="grid">
        {listings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            variant="compact"
            onBook={(id) => console.log('Book:', id)}
          />
        ))}
      </div>
    </>
  );
}
```

## File Structure

```
frontend/src/
├── types/
│   ├── category.ts          # Category types
│   ├── listing.ts           # Listing types
│   └── schema.ts            # Unified types
├── services/
│   └── apiClient.ts         # HTTP client
├── hooks/
│   ├── useCategories.ts     # Category hooks
│   └── useListings.ts       # Listing hooks
├── features/listings/
│   ├── components/
│   │   ├── DynamicListingForm.tsx
│   │   ├── DynamicFieldRenderer.tsx
│   │   ├── ListingCard.tsx
│   │   ├── RealEstateListing.tsx
│   │   ├── VehiclesListing.tsx
│   │   └── ServicesListing.tsx
│   ├── pages/
│   └── README.md
├── pages/
│   └── ListingsIntegrationPage.tsx
└── __tests__/
    └── listings.integration.test.ts
```

## Next Steps

### To test now:
1. ✅ Backend categories created
2. ✅ API endpoints verified
3. ✅ Frontend code in place
4. Visit `/marketplace` in the app
5. Run integration tests

### To extend:
1. Add more category-specific components
2. Integrate image upload
3. Add booking system UI
4. Connect to existing chat system
5. Add messaging for inquiries

## Testing Checklist

- [ ] Can fetch and display categories
- [ ] Can select category and see form fields
- [ ] Can fill form and submit listing
- [ ] Can view listings in grid
- [ ] Can search listings
- [ ] Can filter by category
- [ ] Real estate cards show bedrooms/bathrooms
- [ ] Vehicle cards show make/model/year
- [ ] Service cards show provider info
- [ ] All 20+ tests pass

## Troubleshooting

### "Categories is empty"
- Check backend categories are created
- Check `REACT_APP_API_URL` environment variable
- Check browser console for network errors

### "Form fields not rendering"
- Verify category schema has valid fields
- Check field types match supported types
- Look for errors in browser console

### "API calls failing"
- Verify backend is running on configured URL
- Check CORS settings in Django
- Check auth token if API requires authentication

### "Tests failing"
- Ensure backend is running
- Create test categories in backend
- Check network connectivity
- Review test output for specific errors

## Support

See `src/features/listings/README.md` for detailed documentation on:
- Architecture
- Component API
- Hook usage
- Schema structure
- Adding new components
