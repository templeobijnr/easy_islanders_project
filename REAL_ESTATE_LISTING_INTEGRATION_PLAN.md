# Real Estate Listing Creation & Management Integration Plan

## Executive Summary

This plan outlines the complete integration between **Real Estate Listing Creation** and **Portfolio Management** to ensure users can seamlessly create, edit, and manage real estate listings.

## Current State Analysis

### Existing Systems

**1. Generic Listings System (`listings` app)**
- Location: `frontend/src/pages/CreateListing.jsx`
- Features:
  - Multi-step wizard (Category → Subcategory → Photos → Details)
  - Dynamic field rendering based on category schema
  - Image upload with drag & drop
  - Premium UI with Framer Motion animations
  - Form validation
- Model: Uses `Listing` model with `dynamic_fields` JSON
- Status: ✅ Fully functional for generic marketplace listings

**2. Real Estate System (`real_estate` app)**
- Backend Models:
  - `Property` (physical unit with location, features, ownership)
  - `Listing` (market offering linked to Property)
  - `Location` (geographic data)
  - `Contact` (owners, tenants, clients)
  - Type-specific extensions (`RentalDetails`, `SaleDetails`, `ProjectListingDetails`)
- Frontend Components Built:
  - ✅ Portfolio Management Page with real data
  - ✅ TypeScript interfaces for all models
  - ✅ API service layer (30+ endpoints)
  - ✅ React Query hooks
  - ❌ Listing creation modal (NOT YET BUILT)
  - ❌ Edit listing modal (NOT YET BUILT)
- Status: ✅ Read operations complete, ❌ Write operations missing

### The Problem

**Data Model Mismatch:**
- Generic listings: Single `Listing` model with JSON `dynamic_fields`
- Real Estate: Requires `Property` → `Listing` → type-specific details (RentalDetails/SaleDetails)

**User Experience Gap:**
- Users can view portfolio listings but **cannot create or edit** them
- No integration between existing robust CreateListing.jsx and real estate system

## Integration Architecture

### Data Flow

```
User Creates Listing
     ↓
1. Select Listing Type (Daily Rental, Long-term, Sale, Project)
     ↓
2. Property Information (location, bedrooms, features)
     ↓
3. Listing Details (pricing, availability, type-specific fields)
     ↓
4. Images & Media Upload
     ↓
5. Review & Publish
     ↓
Backend: Create Property → Create Listing → Create Type Details → Upload Images
     ↓
Portfolio Management: Display new listing in real-time
```

### Component Hierarchy

```
RealEstateListingWizard (NEW)
├── Step 1: ListingTypeSelection
│   └── Buttons: Daily Rental | Long-term | Sale | Project
├── Step 2: PropertyForm
│   ├── LocationPicker (with map)
│   ├── PropertyDetails (bedrooms, bathrooms, sqm)
│   ├── PropertyType selector
│   └── Features checklist
├── Step 3: ListingDetailsForm
│   ├── BasicInfo (title, description)
│   ├── PricingForm (depends on listing type)
│   │   ├── Daily Rental: nightly_price, min_days
│   │   ├── Long-term: monthly_price, deposit, utilities
│   │   ├── Sale: price, negotiable, swap_possible
│   │   └── Project: price_range, payment_plan
│   └── AvailabilityPicker
├── Step 4: ImageUpload
│   └── Drag & drop with preview (reuse from CreateListing.jsx)
└── Step 5: ReviewPublish
    └── Summary with edit buttons for each section
```

## Detailed Implementation Plan

### Phase 1: Core Listing Creation Modal (Sprint 1)

#### 1.1 Create RealEstateListingWizard Component
**File:** `frontend/src/features/seller-dashboard/domains/real-estate/listing-creation/RealEstateListingWizard.tsx`

**Features:**
- Multi-step navigation with progress indicator
- State management for form data across steps
- Framer Motion animations (match CreateListing.jsx)
- Error handling and validation per step
- Loading states with optimistic UI updates

**State Shape:**
```typescript
interface ListingCreationState {
  // Step 1: Listing Type
  listingType: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT';

  // Step 2: Property Data
  property: {
    location: {
      country: string;
      region: string;
      city: string;
      area: string;
      address_line: string;
      latitude: number | null;
      longitude: number | null;
    };
    property_type_id: number;
    bedrooms: number;
    bathrooms: number;
    living_rooms: number;
    total_area_sqm: number | null;
    furnished_status: 'UNFURNISHED' | 'PARTLY_FURNISHED' | 'FULLY_FURNISHED';
    feature_ids: number[]; // Selected features
  };

  // Step 3: Listing Data
  listing: {
    title: string;
    description: string;
    base_price: number;
    currency: string;
    available_from: string | null;
    available_to: string | null;
  };

  // Step 3b: Type-Specific Data
  rentalDetails?: {
    rental_kind: 'DAILY' | 'LONG_TERM';
    min_days?: number;
    min_months?: number;
    deposit_amount?: number;
    utilities_included: Record<string, boolean>;
  };

  saleDetails?: {
    is_swap_possible: boolean;
    negotiable: boolean;
  };

  projectDetails?: {
    completion_date: string | null;
    payment_plan_json: Record<string, any>;
  };

  // Step 4: Images
  images: File[];
}
```

#### 1.2 Create Form Sub-Components

**LocationPicker Component**
- Dropdown for country/region/city/area
- Google Maps/Leaflet integration for pin dropping
- Reverse geocoding to get address from coordinates
- Validation: Ensure location is selected

**PropertyDetailsForm Component**
- Number inputs for bedrooms, bathrooms, sqm
- Property type selector (fetched from API)
- Room configuration label (e.g., "2+1")
- Furnished status radio buttons

**FeaturesSelector Component**
- Fetch features from API grouped by category
- Checkboxes organized in tabs (Internal, External, Location, Safety)
- Visual icons for common features
- Search/filter functionality

**ListingPricingForm Component**
- Conditional rendering based on listing type
- Daily Rental: nightly price, min nights
- Long-term: monthly price, deposit, utilities checkboxes
- Sale: price, negotiable checkbox, swap option
- Project: price range sliders, payment plan JSON builder

**ImageUploadSection Component**
- Drag & drop file upload (reuse logic from CreateListing.jsx)
- Image preview with remove buttons
- Max 10 images validation
- File size and type validation
- Reorder functionality

#### 1.3 API Integration

**Create Mutation Hook:**
```typescript
// frontend/src/features/seller-dashboard/domains/real-estate/listing-creation/useCreateRealEstateListing.ts

export const useCreateRealEstateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ListingCreationState) => {
      // Step 1: Create or get location
      const location = await createLocation(data.property.location);

      // Step 2: Create property
      const property = await createProperty({
        ...data.property,
        location_id: location.id,
      });

      // Step 3: Create listing
      const listing = await createListing({
        ...data.listing,
        property_id: property.id,
        listing_type_code: data.listingType,
      });

      // Step 4: Create type-specific details
      if (data.rentalDetails) {
        await createRentalDetails({
          listing_id: listing.id,
          ...data.rentalDetails,
        });
      }
      // ... similar for sale/project

      // Step 5: Upload images
      if (data.images.length > 0) {
        await uploadListingImages(listing.id, data.images);
      }

      return listing;
    },
    onSuccess: (listing) => {
      // Invalidate portfolio queries to show new listing
      queryClient.invalidateQueries(['portfolio', 'stats']);
      queryClient.invalidateQueries(['listings', 'summaries']);
    },
  });
};
```

### Phase 2: Edit Listing Modal (Sprint 2)

#### 2.1 EditListingModal Component
**File:** `frontend/src/features/seller-dashboard/domains/real-estate/listing-management/EditListingModal.tsx`

**Features:**
- Pre-populate form with existing listing data
- Allow editing all fields except listing type (immutable)
- Tabbed interface matching wizard steps for familiarity
- Track dirty state (show unsaved changes warning)
- Partial update support (only send changed fields)

**Integration Points:**
- Trigger from Portfolio Management card "Edit" button
- Trigger from Listing Detail Page header "Edit Listing" button
- Modal with backdrop blur effect

#### 2.2 Update Mutation Hook

```typescript
export const useUpdateRealEstateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      updates,
    }: {
      listingId: number;
      updates: Partial<ListingCreationState>;
    }) => {
      // Update property if changed
      if (updates.property) {
        await updateProperty(listing.property_id, updates.property);
      }

      // Update listing
      if (updates.listing) {
        await updateListing(listingId, updates.listing);
      }

      // Update type-specific details
      // ... similar logic

      // Handle image changes (add/remove)
      if (updates.images) {
        await updateListingImages(listingId, updates.images);
      }
    },
    onSuccess: (_, { listingId }) => {
      queryClient.invalidateQueries(['listings', listingId]);
      queryClient.invalidateQueries(['listings', 'summaries']);
    },
  });
};
```

### Phase 3: Map Integration (Sprint 3)

#### 3.1 Leaflet Map Component
**File:** `frontend/src/features/seller-dashboard/domains/real-estate/components/LocationMap.tsx`

**Features:**
- Display listing location on map
- Marker with custom icon
- Zoom controls
- Street view link
- Area polygon highlighting

**Usage Scenarios:**
1. **Listing Creation:** Interactive map for selecting property location
2. **Listing Detail Page:** Static map showing property location
3. **Portfolio Overview:** Clustered markers for all listings

#### 3.2 Map Dependencies
```bash
# Already installed (from package.json)
leaflet: ^1.9.4
react-leaflet: ^4.2.1
@types/leaflet: ^1.9.21
```

### Phase 4: Tab Components Data Wiring (Sprint 4)

Wire up all tab components in ListingDetailPage with real data:

#### 4.1 MessagesTab
- Fetch messages with `useListingMessages` hook
- Display threaded conversations
- Unread count badge
- Mark as read functionality
- Reply form

#### 4.2 RequestsTab
- Fetch booking/viewing requests
- Approve/decline actions
- Counter-offer functionality
- Request timeline view

#### 4.3 BookingsTab
- Fetch tenancies/bookings
- Calendar view of occupied dates
- Booking details modal
- Payment tracking

#### 4.4 CalendarTab
- FullCalendar integration with bookings
- Block dates functionality
- Custom pricing per date
- Availability management

#### 4.5 PricingTab
- Dynamic pricing rules
- Seasonal pricing
- Last-minute discounts
- Length-of-stay discounts

#### 4.6 AnalyticsTab
- Charts with Recharts
- Views/enquiries/bookings funnel
- Revenue trends
- Conversion rates

#### 4.7 ActivityTab
- Event feed with `useListingEvents`
- Filter by event type
- Export functionality

## Design System Consistency

### Color Palette (Match Portfolio Management)
- Primary gradient: `from-lime-200 via-emerald-200 to-sky-200`
- Action buttons: `from-lime-500 to-emerald-500`
- Status badges:
  - Active: `bg-emerald-100 text-emerald-700`
  - Inactive: `bg-slate-100 text-slate-700`
  - Draft: `bg-amber-100 text-amber-700`

### Typography
- Headings: `font-display` (if defined) or `font-bold`
- Body: `text-slate-700`
- Labels: `text-slate-600 text-sm font-medium`

### Spacing & Layout
- Card padding: `p-6`
- Section gaps: `gap-6`
- Border radius: `rounded-2xl` for cards, `rounded-xl` for inputs
- Shadows: `shadow-lg` for cards, `shadow-xl` on hover

### Animations (Framer Motion)
```typescript
// Card entrance
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}

// Hover scale
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

## Backend API Requirements

### New Endpoints Needed

**Property Creation:**
```
POST /api/real-estate/properties/
{
  "location_id": number,
  "property_type_id": number,
  "bedrooms": number,
  "bathrooms": number,
  ...
}
→ Returns Property object
```

**Location Creation:**
```
POST /api/real-estate/locations/
{
  "country": "Cyprus",
  "city": "Kyrenia",
  "area": "Esentepe",
  ...
}
→ Returns Location object (or existing if duplicate)
```

**Type-Specific Details:**
```
POST /api/real-estate/listings/{id}/rental-details/
POST /api/real-estate/listings/{id}/sale-details/
POST /api/real-estate/listings/{id}/project-details/
```

### Existing Endpoints to Use

✅ Already implemented:
- `GET /api/real-estate/listing-types/` - Get all listing types
- `GET /api/real-estate/property-types/` - Get property types
- `GET /api/real-estate/locations/` - Get locations
- `GET /api/real-estate/features/` - Get features
- `POST /api/real-estate/listings/{id}/images/` - Upload images
- `PATCH /api/real-estate/listings/{id}/` - Update listing

## Testing Strategy

### Unit Tests
- Form validation logic
- State management in wizard
- Field conditional rendering

### Integration Tests
- Full create listing flow
- Edit listing flow
- Image upload

### E2E Tests (Playwright)
```typescript
test('user can create a daily rental listing', async ({ page }) => {
  await page.goto('/dashboard/home/real-estate/portfolio');
  await page.click('button:has-text("Create Listing")');
  await page.click('button:has-text("Daily Rental")');
  // ... fill form steps
  await page.click('button:has-text("Publish")');
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page).toHaveURL(/\/portfolio\/listing\/\d+/);
});
```

## Migration & Rollout Plan

### Phase 1: Create Functionality (Week 1)
- Day 1-2: Build RealEstateListingWizard shell with navigation
- Day 3-4: Implement all form sub-components
- Day 5: API integration and testing
- Deliverable: Users can create new real estate listings

### Phase 2: Edit Functionality (Week 2)
- Day 1-2: Build EditListingModal
- Day 3: Wire up edit buttons in Portfolio & Detail pages
- Day 4-5: Testing and refinement
- Deliverable: Users can edit existing listings

### Phase 3: Map & Advanced Features (Week 3)
- Day 1-2: Leaflet map integration
- Day 3-5: Wire up all tab components with data
- Deliverable: Full listing management suite

### Phase 4: Polish & Optimization (Week 4)
- Performance optimization
- Error handling improvements
- User feedback implementation
- Documentation

## Success Metrics

### User Journey Completion
- [ ] User can create a daily rental listing in < 3 minutes
- [ ] User can edit listing price without confusion
- [ ] User sees new listing in portfolio immediately after creation
- [ ] User can upload and reorder images smoothly

### Technical Requirements
- [ ] All API calls use React Query with proper caching
- [ ] Form validation prevents invalid submissions
- [ ] Loading states shown during API calls
- [ ] Error messages are user-friendly and actionable
- [ ] TypeScript strict mode passes with no errors

### Design Consistency
- [ ] Listing creation modal matches Portfolio Management styling
- [ ] Animations are smooth (60fps)
- [ ] Mobile responsive (works on 375px width)
- [ ] Accessibility: keyboard navigation works
- [ ] ARIA labels on all interactive elements

## Open Questions & Decisions Needed

1. **Property Reuse:** If a user has multiple listings for the same property (e.g., daily + long-term rental), should we:
   - Option A: Allow linking to existing Property
   - Option B: Always create new Property record
   - **Recommendation:** Option A with "Link to existing property" checkbox

2. **Draft Listings:** Should we auto-save drafts or require explicit "Save as Draft" action?
   - **Recommendation:** Auto-save to localStorage, prompt to restore on revisit

3. **Image Storage:** Where should images be stored?
   - **Recommendation:** AWS S3 with CloudFront CDN (configure in Django settings)

4. **Validation:** Should validation be synchronous (client-side) or include server validation?
   - **Recommendation:** Both - client for UX, server for security

## Next Steps

1. **Immediate:** Review and approve this plan
2. **Setup:** Create feature branch `feature/real-estate-listing-creation`
3. **Sprint 1 Kickoff:** Begin implementing RealEstateListingWizard
4. **Daily Standups:** Track progress against this plan

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Author:** Claude AI Assistant
**Stakeholders:** Development Team, Product Owner
