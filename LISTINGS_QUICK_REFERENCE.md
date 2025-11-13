# Listings System - Quick Reference

## Import Paths Cheat Sheet

### Types
```typescript
// Category types
import { Category, SchemaField, SubCategory } from '../types/category';
// or
import { Category, SchemaField } from '../types/schema';

// Listing types
import { Listing, CreateListingRequest, UpdateListingRequest } from '../types/listing';
// or
import { Listing, CreateListingRequest } from '../types/schema';

// API types
import { FetchState, MutationState, ApiResponse } from '../types/schema';
```

### Hooks
```typescript
import { useCategories, useSubCategories } from '../hooks/useCategories';
import { useListings, useMyListings } from '../hooks/useListings';
```

### Components
```typescript
import DynamicListingForm from '../features/listings/components/DynamicListingForm';
import DynamicFieldRenderer from '../features/listings/components/DynamicFieldRenderer';
import ListingCard from '../features/listings/components/ListingCard';
import RealEstateListing from '../features/listings/components/RealEstateListing';
import VehiclesListing from '../features/listings/components/VehiclesListing';
import ServicesListing from '../features/listings/components/ServicesListing';
```

### Services
```typescript
import { apiClient } from '../services/apiClient';
```

## Common Patterns

### 1. Fetch Categories
```typescript
const { categories, isLoading, error } = useCategories();
```

### 2. Create Listing
```typescript
const { createListing } = useListings();

await createListing({
  title: 'My Listing',
  description: 'Description',
  category: 'category-uuid',
  price: 100,
  currency: 'EUR',
  dynamic_fields: { bedrooms: 2 }
});
```

### 3. Fetch Listings with Filters
```typescript
const { listings } = useListings({
  filters: {
    category: 'real-estate',
    status: 'active',
    search: 'apartment'
  }
});
```

### 4. Search Listings
```typescript
const { searchListings } = useListings();
await searchListings('apartment');
```

### 5. Display Listing Card
```typescript
<ListingCard
  listing={listing}
  variant="compact"
  onBook={(id) => handleBook(id)}
/>
```

### 6. Render Dynamic Form
```typescript
<DynamicListingForm
  category={category}
  onSubmit={async (values) => {
    // values has title, description, price, dynamic_fields
  }}
/>
```

## Component Props

### ListingCard
| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `listing` | `Listing` | Yes | The listing to display |
| `onBook` | `(id: string) => void` | No | Callback for booking/CTA |
| `variant` | `'compact' \| 'full'` | No | Display size, default 'compact' |

### DynamicListingForm
| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `category` | `Category` | Yes | Category with schema |
| `onSubmit` | `(values) => Promise<void>` | Yes | Form submission handler |
| `initialValues` | `Partial<CreateListingRequest>` | No | For editing |
| `isLoading` | `boolean` | No | Disable form while loading |
| `readOnly` | `boolean` | No | Display only mode |

### RealEstateListing / VehiclesListing / ServicesListing
| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `listing` | `Listing` | Yes | The listing to display |
| `onBook` | `(id: string) => void` | No | Callback for CTA |
| `variant` | `'compact' \| 'full'` | No | Display size |

## Hook Return Values

### useCategories()
```typescript
{
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getBookableCategories: () => Category[];
  getFeaturedCategories: () => Category[];
}
```

### useListings()
```typescript
{
  listings: Listing[];
  isLoading: boolean;
  error: Error | null;
  pagination: { count: number; limit: number; offset: number };
  refetch: () => Promise<void>;
  createListing: (data: CreateListingRequest) => Promise<Listing>;
  updateListing: (id: string, data: UpdateListingRequest) => Promise<Listing>;
  deleteListing: (id: string) => Promise<void>;
  getListingById: (id: string) => Promise<ListingDetail>;
  searchListings: (query: string, filters?) => Promise<void>;
  filterListings: (filters: ListingFilters) => Promise<void>;
}
```

### useMyListings()
```typescript
{
  listings: Listing[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createListing: (data: CreateListingRequest) => Promise<Listing>;
  updateListing: (id: string, data: UpdateListingRequest) => Promise<Listing>;
  deleteListing: (id: string) => Promise<void>;
}
```

## API Client Methods

```typescript
// GET
const response = await apiClient.get<T>('/api/endpoint/');

// POST
const response = await apiClient.post<T>('/api/endpoint/', data);

// PATCH
const response = await apiClient.patch<T>('/api/endpoint/', data);

// PUT
const response = await apiClient.put<T>('/api/endpoint/', data);

// DELETE
const response = await apiClient.delete('/api/endpoint/');

// All return: { data: T, status: number }
```

## Schema Field Types

```typescript
type FieldType =
  | 'text'           // Input[text]
  | 'textarea'       // Textarea
  | 'number'         // Input[number]
  | 'email'          // Input[email]
  | 'tel'            // Input[tel]
  | 'date'           // Input[date]
  | 'boolean'        // Checkbox
  | 'select'         // Select dropdown
  | 'multi-select';  // Select[multiple]
```

## Filter Options

```typescript
interface ListingFilters {
  category?: string;
  subcategory?: string;
  status?: 'draft' | 'active' | 'paused' | 'sold';
  search?: string;
  ordering?: string;
  price_min?: number;
  price_max?: number;
  is_featured?: boolean;
  my_listings?: boolean;
  limit?: number;
  offset?: number;
}
```

## Common Tasks

### Task: Show categories on homepage
```typescript
import { useCategories } from './hooks/useCategories';

export function CategoryCarousel() {
  const { categories } = useCategories();
  
  return (
    <div className="flex gap-4">
      {categories.map(cat => (
        <div key={cat.id} className="cursor-pointer">
          {cat.icon && <span>{cat.icon}</span>}
          <p>{cat.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Task: Search listings
```typescript
const { listings, searchListings } = useListings();

const handleSearch = async (query) => {
  await searchListings(query);
};
```

### Task: Show user's listings
```typescript
import { useMyListings } from './hooks/useListings';

export function MyListingsDashboard() {
  const { listings } = useMyListings();
  
  return (
    <div>
      {listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

### Task: Create new listing flow
```typescript
export function CreateListingFlow() {
  const { categories } = useCategories();
  const { createListing } = useListings();
  const [selected, setSelected] = useState(null);

  if (!selected) {
    return (
      <div>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelected(cat)}>
            {cat.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DynamicListingForm
      category={selected}
      onSubmit={createListing}
    />
  );
}
```

### Task: Show real estate with booking
```typescript
export function RealEstateDetail({ listing }) {
  const handleBook = (id) => {
    // Navigate to booking flow
  };

  return (
    <RealEstateListing
      listing={listing}
      variant="full"
      onBook={handleBook}
    />
  );
}
```

## Error Handling

```typescript
const { listings, error } = useListings();

if (error) {
  return <ErrorBanner message={error.message} />;
}
```

```typescript
try {
  await createListing(data);
} catch (error) {
  setError(error.message);
}
```

## Authentication

```typescript
// Set token after login
import { apiClient } from './services/apiClient';

apiClient.setAuthToken(token);

// Clear on logout
apiClient.clearAuthToken();
```

## Environment Variables

```bash
# .env.local
REACT_APP_API_URL=http://localhost:8000
```

## Testing

```bash
# Run all tests
npm test

# Run listings tests only
npm test -- listings.integration.test.ts

# Run with coverage
npm test -- --coverage
```

## Files You Need to Know

| File | Purpose |
|------|---------|
| `src/types/schema.ts` | All type definitions |
| `src/services/apiClient.ts` | HTTP communication |
| `src/hooks/useListings.ts` | Main data hook |
| `src/features/listings/components/ListingCard.tsx` | Display router |
| `src/pages/ListingsIntegrationPage.tsx` | Full example |
| `LISTINGS_FRONTEND_SETUP.md` | Setup guide |
| `src/features/listings/README.md` | Detailed docs |
