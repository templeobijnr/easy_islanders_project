# Listings System

Comprehensive listing management system with dynamic category-based forms and category-specific renderers.

## Architecture

### Types (`src/types/`)

- **`category.ts`** - Category and schema definitions
  - `Category` - Top-level category with schema
  - `SchemaField` - Individual form field configuration
  - `CategorySchema` - Collection of fields

- **`listing.ts`** - Listing model definitions
  - `Listing` - Core listing type
  - `ListingDetail` - Full listing with images
  - `CreateListingRequest` - For API submissions
  - `ListingFilters` - Query parameters

- **`schema.ts`** - Unified types and API responses
  - Exports from `category.ts` and `listing.ts`
  - `FormFieldState`, `FetchState`, `MutationState`
  - `Booking` and booking-related types

### Services (`src/services/`)

- **`apiClient.ts`** - HTTP client wrapper
  - Handles authentication tokens
  - Automatic JSON serialization
  - Request timeout management
  - Error handling

### Hooks (`src/hooks/`)

- **`useCategories.ts`**
  - `useCategories()` - Fetch all categories with helpers
  - `useSubCategories(slug)` - Fetch subcategories for a category

- **`useListings.ts`**
  - `useListings(options)` - Full listings management
  - `useMyListings(options)` - User's own listings
  - CRUD operations and filtering

### Components (`src/features/listings/components/`)

#### Form Components

- **`DynamicListingForm`** - Main form component
  - Renders based on category schema
  - Validates dynamic fields
  - Handles submission

- **`DynamicFieldRenderer`** - Individual field renderer
  - Supports multiple field types
  - Error handling per field
  - Conditional rendering

#### Listing Display Components

- **`ListingCard`** - Router component
  - Routes to category-specific renderers
  - Falls back to generic display

- **`RealEstateListing`** - Real estate specific
  - Bedrooms, bathrooms display
  - Nightly and monthly pricing
  - Amenities list

- **`VehiclesListing`** - Vehicle specific
  - Make, model, year display
  - Mileage, fuel type, transmission
  - Features checklist

- **`ServicesListing`** - Service specific
  - Service type and provider info
  - Rating display
  - Skills/services list

## Usage Examples

### Fetch Categories and Build Form

```typescript
import { useCategories } from '../hooks/useCategories';
import DynamicListingForm from '../features/listings/components/DynamicListingForm';

function CreateListing() {
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (!selectedCategory) {
    return (
      <div>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat)}>
            {cat.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DynamicListingForm
      category={selectedCategory}
      onSubmit={async (values) => {
        // Submit listing
      }}
    />
  );
}
```

### Fetch and Display Listings

```typescript
import { useListings } from '../hooks/useListings';
import ListingCard from '../features/listings/components/ListingCard';

function ListingGrid() {
  const { listings, isLoading } = useListings({
    filters: { status: 'active', category: 'real-estate' }
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          variant="compact"
          onBook={(id) => console.log('Book:', id)}
        />
      ))}
    </div>
  );
}
```

### Search and Filter

```typescript
import { useListings } from '../hooks/useListings';

function SearchListings() {
  const { listings, searchListings, filterListings } = useListings();

  const handleSearch = async (query) => {
    await searchListings(query);
  };

  const handleFilter = async (filters) => {
    await filterListings(filters);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSearch('apartment');
    }}>
      <input type="text" placeholder="Search..." />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Full Integration Page

See `src/pages/ListingsIntegrationPage.tsx` for a complete example showing:
- Category selection
- Dynamic form rendering
- Listing grid with search/filter
- Category-specific displays

## API Endpoints

### Categories
- `GET /api/categories/` - List all categories
- `GET /api/categories/{slug}/subcategories/` - Get subcategories

### Listings
- `GET /api/listings/` - List listings (supports filters)
- `POST /api/listings/` - Create listing
- `GET /api/listings/{id}/` - Get listing details
- `PATCH /api/listings/{id}/` - Update listing
- `DELETE /api/listings/{id}/` - Delete listing
- `GET /api/listings/my_listings/` - User's listings

### Bookings (for bookable categories)
- `POST /api/shortterm/bookings/` - Create short-term booking
- `POST /api/longterm/bookings/` - Create long-term booking
- `POST /api/shortterm/check-availability/` - Check availability
- `GET /api/bookings/my-bookings/` - User's bookings

## Category Schema Structure

Each category has a JSON schema defining its form fields:

```json
{
  "fields": [
    {
      "name": "bedrooms",
      "type": "number",
      "label": "Number of Bedrooms",
      "required": true,
      "min": 1,
      "max": 10
    },
    {
      "name": "amenities",
      "type": "multi-select",
      "label": "Amenities",
      "choices": ["wifi", "parking", "pool", "ac"],
      "required": false
    },
    {
      "name": "furnished",
      "type": "boolean",
      "label": "Is Furnished?",
      "required": false
    }
  ]
}
```

### Supported Field Types

| Type | Component | Use Case |
|------|-----------|----------|
| `text` | Input[text] | Short text inputs |
| `textarea` | Textarea | Long text content |
| `number` | Input[number] | Quantities, prices |
| `email` | Input[email] | Email addresses |
| `tel` | Input[tel] | Phone numbers |
| `date` | Input[date] | Dates |
| `boolean` | Checkbox | Yes/No options |
| `select` | Select | Single choice |
| `multi-select` | Select[multiple] | Multiple choices |

## Adding New Category-Specific Components

1. Create new component in `src/features/listings/components/`
2. Import category data from props
3. Use `listing.dynamic_fields` for category-specific data
4. Register in `ListingCard.tsx` router

Example:
```typescript
// ElectronicsListing.tsx
const ElectronicsListing = ({ listing, variant = 'compact' }) => {
  const { brand, model, specs } = listing.dynamic_fields;
  
  return (
    <div>
      <h3>{brand} {model}</h3>
      <p>{specs}</p>
    </div>
  );
};

// Add to ListingCard.tsx router
case 'electronics':
  return <ElectronicsListing listing={listing} variant={variant} />;
```

## Testing

Run integration tests:
```bash
npm test -- src/__tests__/listings.integration.test.ts
```

Tests cover:
- Category fetching
- Listing CRUD operations
- Search and filtering
- Availability checking
- Form validation
- Complete workflows

## Environment Configuration

Set `REACT_APP_API_URL` environment variable to point to your backend:

```bash
REACT_APP_API_URL=http://localhost:8000
```

Default is `http://localhost:8000` if not set.

## Error Handling

All hooks and components handle errors gracefully:

```typescript
const { listings, error } = useListings();

if (error) {
  return <div>Failed to load listings: {error.message}</div>;
}
```

API client throws errors for:
- Network failures
- HTTP error statuses (4xx, 5xx)
- Timeout (30s default)
- Invalid JSON responses

## Performance Considerations

- Images are lazy-loaded in card components
- Listings use virtual scrolling for large lists (when implemented)
- Categories are cached after first fetch
- Debounced search to reduce API calls
- Pagination for listing grids

## Future Enhancements

- [ ] Image upload support
- [ ] Bulk operations
- [ ] Advanced filtering UI
- [ ] Saved searches/favorites
- [ ] Rating and reviews system
- [ ] Messaging system
- [ ] Payment integration
- [ ] Analytics dashboard
