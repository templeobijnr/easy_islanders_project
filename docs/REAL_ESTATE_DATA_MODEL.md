# Real Estate Data Model Documentation

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Core Entities](#core-entities)
4. [Entity Relationships](#entity-relationships)
5. [Data Flow](#data-flow)
6. [API Contracts](#api-contracts)
7. [Frontend Integration](#frontend-integration)
8. [Migration Strategy](#migration-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Testing Strategy](#testing-strategy)

---

## Overview

The v1 Real Estate Data Model is a comprehensive, unified schema that handles all aspects of property management, from physical units to market listings, customer relationships, and performance analytics.

### What It Covers
- **Properties**: Physical property units with full specifications
- **Listings**: Market offerings (daily rental, long-term rental, sale, project)
- **Projects**: Off-plan developments and new construction
- **People**: Leads, clients, owners, tenants, and agents
- **Features**: Property amenities and characteristics
- **Utilities & Taxes**: Operational details for each property
- **Deals**: Sales pipeline and transaction tracking
- **Tenancies**: Rental agreements and bookings
- **Analytics**: Performance metrics and location-based insights

### Key Design Decision

Instead of four separate, disconnected databases (rental/sales/project/daily rental), we use:
- **One `properties` table** for all physical units
- **One `listings` table** with a `listing_type` dimension
- **Extension tables** for type-specific fields (RentalDetails, SaleDetails, ProjectListingDetails)
- **Clean foreign keys** for all relationships

---

## Design Principles

### 1. Single Source of Truth
- One Property record = one physical unit
- One Listing record = one market offering
- Relationships defined via foreign keys, not duplicated data

### 2. Listing Type as Dimension
```python
ListingType:
  - DAILY_RENTAL      # Short-term, nightly bookings
  - LONG_TERM_RENTAL  # Monthly leases
  - SALE              # Properties for purchase
  - PROJECT           # Off-plan developments
```

Each listing links to either a `Property` or a `Project`, never both.

### 3. Extension Tables for Type-Specific Data
- **RentalDetails**: min_days, min_months, deposit, utilities_included
- **SaleDetails**: is_swap_possible, negotiable
- **ProjectListingDetails**: completion_date, payment_plan_json

This avoids nullable field sprawl in the main Listing table.

### 4. Contact + Roles Model
A single `Contact` can have multiple roles:
- Lead → Client (conversion)
- Client → Owner (buys a property)
- Client → Tenant (rents a property)

Roles are tracked via `ContactRole` with `active_from` and `active_to` dates.

### 5. Performance Data via Events
`ListingEvent` tracks:
- VIEW
- ENQUIRY
- BOOKING_REQUEST
- BOOKING_CONFIRMED
- WHATSAPP_CLICK

Aggregated for analytics without cluttering the Listing table.

---

## Core Entities

### 1. Location
**Purpose**: Geographic hierarchy for properties and projects.

```python
Location:
  country: str = "Cyprus"
  region: str              # e.g., "North Cyprus"
  city: str                # e.g., "Kyrenia"
  area: str                # e.g., "Esentepe"
  address_line: str
  latitude: Decimal
  longitude: Decimal
```

**Indexes**: `(city, area)` for location-based queries.

---

### 2. Property
**Purpose**: Physical property unit (apartment, villa, etc.).

```python
Property:
  reference_code: str (unique)  # e.g., "EI-RE-000123"
  title: str
  description: text

  location: FK(Location)
  property_type: FK(PropertyType)

  # Physical specs
  total_area_sqm: Decimal
  net_area_sqm: Decimal
  bedrooms: int
  living_rooms: int
  bathrooms: int
  room_configuration_label: str  # "2+1", "3+2"

  # Building details
  building_name: str
  flat_number: str
  floor_number: int
  floor_of_building: int
  total_floors: int

  # Additional
  furnished_status: Choice(UNFURNISHED, PARTLY_FURNISHED, FULLY_FURNISHED)
  year_built: int
  is_gated_community: bool
  title_deed_type: FK(TitleDeedType)

  # Project link
  project: FK(Project) nullable

  # Many-to-many
  features: M2M(Feature) through PropertyFeature
```

**Key Relationships**:
- `Property.owners` → `PropertyOwner` (many-to-many with Contact)
- `Property.listings` → `Listing` (one-to-many)
- `Property.tenancies` → `Tenancy` (one-to-many)
- `Property.deals` → `Deal` (one-to-many)

---

### 3. Listing
**Purpose**: Market offering (rental/sale/project).

```python
Listing:
  reference_code: str (unique)  # e.g., "EI-L-000123"

  listing_type: FK(ListingType)  # DAILY_RENTAL, LONG_TERM_RENTAL, SALE, PROJECT
  property: FK(Property) nullable
  project: FK(Project) nullable
  owner: FK(Contact) nullable     # Main landlord/seller

  title: str
  description: text

  # Pricing
  base_price: Decimal
  currency: str  # EUR, GBP, USD, TRY
  price_period: Choice(PER_DAY, PER_MONTH, TOTAL, STARTING_FROM)

  # Availability
  available_from: Date nullable
  available_to: Date nullable

  # Status
  is_active: bool
  status: Choice(DRAFT, ACTIVE, INACTIVE, UNDER_OFFER, SOLD, RENTED)

  created_by: FK(User)
```

**Extension Tables**:
- `listing.rental_details` (OneToOne) → RentalDetails
- `listing.sale_details` (OneToOne) → SaleDetails
- `listing.project_details` (OneToOne) → ProjectListingDetails

---

### 4. Contact
**Purpose**: Central person record (leads, clients, owners, tenants).

```python
Contact:
  first_name: str
  last_name: str
  phone: str
  email: str
  nationality: str
  notes: text
```

**Relationships**:
- `Contact.roles` → `ContactRole` (many-to-many with role dimension)
- `Contact.lead` → `Lead` (OneToOne)
- `Contact.client` → `Client` (OneToOne)
- `Contact.owned_properties` → `PropertyOwner`
- `Contact.tenancies` → `Tenancy`

---

### 5. Project
**Purpose**: Off-plan development.

```python
Project:
  name: str
  developer: FK(Contact) nullable
  location: FK(Location)

  total_units: int
  completion_date_estimate: Date
  min_unit_area_sqm: Decimal
  max_unit_area_sqm: Decimal
  min_price: Decimal
  max_price: Decimal
  currency: str

  payment_plan_json: JSONField  # Flexible payment plans
  description: text
```

**Relationships**:
- `Project.units` → `Property` (one-to-many)
- `Project.listings` → `Listing` (one-to-many)

---

### 6. Feature
**Purpose**: Property amenities and characteristics.

```python
FeatureCategory:
  code: str (unique)  # INSIDE, OUTSIDE, VIEW, AMENITY
  label: str

Feature:
  code: str (unique)  # BALCONY, WIFI, PRIVATE_POOL, SEA_VIEW
  label: str
  category: FK(FeatureCategory)
  is_required_for_daily_rental: bool  # WiFi, Kitchen must be true for daily rentals
```

**Examples**:
- **INSIDE**: BALCONY, MASTER_CABINET, FIRE_ALARM, AIR_CONDITION, FIREPLACE
- **OUTSIDE**: CLOSED_PARK, ELEVATOR, GARAGE, BBQ, PRIVATE_POOL, SECURITY_CAM
- **VIEW**: SEA_VIEW, MOUNTAIN_VIEW, CITY_VIEW
- **AMENITY**: WIFI, FULLY_EQUIPPED_KITCHEN

---

### 7. Tenancy
**Purpose**: Rental agreement (daily or long-term).

```python
Tenancy:
  property: FK(Property)
  listing: FK(Listing) nullable
  tenant: FK(Contact)

  tenancy_kind: Choice(DAILY, LONG_TERM)
  start_date: Date
  end_date: Date

  rent_amount: Decimal
  rent_currency: str
  deposit_amount: Decimal nullable

  status: Choice(PENDING, ACTIVE, ENDED, CANCELLED)
```

---

### 8. Deal
**Purpose**: Sales pipeline tracking.

```python
Deal:
  client: FK(Client)
  listing: FK(Listing) nullable
  property: FK(Property) nullable

  deal_type: Choice(RENTAL, SALE, PROJECT_SALE)
  stage: Choice(NEW, NEGOTIATION, RESERVATION, CONTRACT_SIGNED, CLOSED_WON, CLOSED_LOST)

  expected_close_date: Date
  actual_close_date: Date

  agreed_price: Decimal
  currency: str
  commission_amount: Decimal
```

---

### 9. ListingEvent
**Purpose**: Performance analytics.

```python
ListingEvent:
  listing: FK(Listing)
  occurred_at: DateTime
  event_type: Choice(VIEW, ENQUIRY, BOOKING_REQUEST, BOOKING_CONFIRMED, WHATSAPP_CLICK)
  source: str  # web, mobile, portal
  metadata: JSONField
```

---

## Entity Relationships

### Property Ownership Flow
```
Contact
  └─> ContactRole(role=OWNER)
  └─> PropertyOwner
        └─> Property
```

### Listing Creation Flow
```
Contact (owner)
  └─> Property
        └─> Listing(listing_type=DAILY_RENTAL)
              └─> RentalDetails(rental_kind=DAILY)
```

### Lead → Client → Tenant Flow
```
Contact
  └─> Lead(status=NEW)
  └─> Lead(status=CONVERTED)
  └─> Client
        └─> Deal(stage=CLOSED_WON)
  └─> ContactRole(role=TENANT)
  └─> Tenancy(property, start_date, end_date)
```

### Analytics Flow
```
Listing
  └─> ListingEvent(event_type=VIEW, occurred_at)
  └─> ListingEvent(event_type=ENQUIRY)
  └─> ListingEvent(event_type=BOOKING_CONFIRMED)

Query:
  SELECT listing_id, COUNT(*) as views_30d
  FROM listing_event
  WHERE event_type = 'VIEW'
    AND occurred_at >= NOW() - INTERVAL '30 days'
  GROUP BY listing_id
```

---

## Data Flow

### Creating a Daily Rental Listing
1. **Create Property** with features (WIFI=required, KITCHEN=required)
2. **Validate** property has required features for daily rental
3. **Create Listing** with `listing_type=DAILY_RENTAL`
4. **Create RentalDetails** with `rental_kind=DAILY`, `min_days=3`
5. **Create ListingEvent** (VIEW, ENQUIRY) as users interact

### Recording a Booking
1. **Create Tenancy** with `tenancy_kind=DAILY`, dates, tenant
2. **Create Deal** with `deal_type=RENTAL`, `stage=CLOSED_WON`
3. **Create ListingEvent** with `event_type=BOOKING_CONFIRMED`
4. **Update Listing** availability (via backend logic)

### Querying Top Performing Properties
```sql
SELECT
  l.id,
  l.title,
  p.city,
  p.area,
  lt.code as listing_type,
  COUNT(CASE WHEN le.event_type = 'VIEW' THEN 1 END) as views_30d,
  COUNT(CASE WHEN le.event_type = 'ENQUIRY' THEN 1 END) as enquiries_30d,
  COUNT(CASE WHEN le.event_type = 'BOOKING_CONFIRMED' THEN 1 END) as bookings_30d
FROM listing l
JOIN listing_type lt ON l.listing_type_id = lt.id
JOIN property p ON l.property_id = p.id
JOIN location loc ON p.location_id = loc.id
LEFT JOIN listing_event le ON le.listing_id = l.id
  AND le.occurred_at >= NOW() - INTERVAL '30 days'
WHERE lt.code = 'DAILY_RENTAL'
  AND loc.city = 'Esentepe'
GROUP BY l.id, l.title, p.city, p.area, lt.code
ORDER BY bookings_30d DESC
LIMIT 10;
```

---

## API Contracts

### Portfolio Listings API

**Endpoint**: `GET /api/v1/real_estate/portfolio/listings/`

**Query Params**:
- `listing_type`: DAILY_RENTAL | LONG_TERM_RENTAL | SALE | PROJECT (optional)
- `status`: DRAFT | ACTIVE | INACTIVE | UNDER_OFFER | SOLD | RENTED (optional)
- `city`: string (optional)
- `area`: string (optional)
- `search`: string (optional, searches title + reference_code)
- `page`: int (default 1)
- `page_size`: int (default 20)

**Response**:
```typescript
{
  results: PortfolioListing[];
  page: number;
  page_size: number;
  total: number;
}
```

**PortfolioListing Shape**:
```typescript
{
  id: number;
  reference_code: string;        // "EI-L-000123"
  listing_type: ListingTypeCode;  // "DAILY_RENTAL"
  status: ListingStatus;          // "ACTIVE"

  title: string;
  city: string | null;
  area: string | null;

  bedrooms: number | null;
  bathrooms: number | null;
  room_configuration_label: string | null;  // "2+1"

  base_price: string;             // "1200.00"
  currency: string;               // "EUR"
  price_period: PricePeriod;      // "PER_MONTH"

  available_from: string | null;  // "2025-01-10"
  available_to: string | null;
  availability_label: string;     // "AVAILABLE", "OCCUPIED", etc.

  views_30d: number;
  enquiries_30d: number;
  bookings_30d: number;

  created_at: string;
  updated_at: string;

  has_wifi: boolean;
  has_kitchen: boolean;
  has_pool: boolean;
  has_private_pool: boolean;
  has_sea_view: boolean;
}
```

---

### Portfolio Summary API

**Endpoint**: `GET /api/v1/real_estate/portfolio/summary/`

**Response**:
```typescript
PortfolioSummaryItem[] = [
  {
    listing_type: "DAILY_RENTAL";
    total_listings: number;
    active_listings: number;
    occupied_units?: number;    // Only for rentals
    vacant_units?: number;
    avg_price: string | null;
    views_30d: number;
    enquiries_30d: number;
    bookings_30d: number;
  },
  // ... repeat for LONG_TERM_RENTAL, SALE, PROJECT
]
```

---

### Update Listing API

**Endpoint**: `PATCH /api/v1/real_estate/listings/:id/`

**Request Body**:
```typescript
{
  title?: string;
  description?: string;
  base_price?: number;
  currency?: string;
  price_period?: PricePeriod;
  status?: ListingStatus;
  available_from?: string | null;
  available_to?: string | null;
}
```

**Response**: Updated `PortfolioListing` object

---

## Frontend Integration

### Component Structure
```
PortfolioPageV1
  ├─ PortfolioSummaryRow      # 4 cards (Daily, Long-Term, Sale, Project)
  ├─ PortfolioFiltersBar      # Tabs, filters, search
  ├─ PortfolioListingsTable   # Main table
  └─ EditListingModal         # Inline edit (price, availability, status)
```

### State Management
- **React Query** for server state
- **useState** for local UI state (filters, modals)
- **Query invalidation** on mutations

### Data Fetching
```typescript
// Summary
const { data: summary } = useQuery({
  queryKey: ['portfolioSummary'],
  queryFn: fetchPortfolioSummary,
});

// Listings
const { data: listings } = useQuery({
  queryKey: ['portfolioListings', filters],
  queryFn: () => fetchPortfolioListings(filters),
  keepPreviousData: true,
});

// Update
const mutation = useMutation({
  mutationFn: ({ id, payload }) => updateListing(id, payload),
  onSuccess: () => {
    queryClient.invalidateQueries(['portfolioSummary']);
    queryClient.invalidateQueries(['portfolioListings']);
  },
});
```

---

## Migration Strategy

### Phase 1: Core Tables
```
Migration 0001_initial_core:
  - Location
  - PropertyType, FeatureCategory, Feature
  - TitleDeedType, UtilityType, TaxType
  - Contact, ContactRole
  - Property, PropertyFeature, PropertyOwner
  - PropertyUtilityAccount, PropertyTax
```

### Phase 2: Listings
```
Migration 0002_listings:
  - ListingType (seed: DAILY_RENTAL, LONG_TERM_RENTAL, SALE, PROJECT)
  - Listing
  - RentalDetails, SaleDetails, ProjectListingDetails
```

### Phase 3: Projects
```
Migration 0003_projects:
  - Project
  - Link Property.project (nullable FK)
```

### Phase 4: Tenancies & Deals
```
Migration 0004_tenancies_deals:
  - Lead, Client
  - Tenancy
  - Deal
```

### Phase 5: Analytics
```
Migration 0005_analytics:
  - ListingEvent
```

### Rollback
Each migration is independent:
```bash
python manage.py migrate real_estate 0003_projects  # Roll back to phase 3
```

---

## Performance Considerations

### Indexes
- `Location(city, area)` - location queries
- `Property(location, property_type)` - search filters
- `Listing(listing_type, status)` - portfolio filtering
- `ListingEvent(listing, event_type)` - analytics aggregation
- `ListingEvent(occurred_at)` - time-based queries

### Query Optimization
- **Denormalize computed fields** in API responses (availability_label, views_30d)
- **Use select_related** for FK lookups (property.location, listing.property)
- **Use prefetch_related** for M2M (property.features)
- **Cache summary data** (5 min TTL)

### Materialized Views (Future)
```sql
CREATE MATERIALIZED VIEW vw_portfolio_listings AS
SELECT
  l.id,
  l.reference_code,
  lt.code as listing_type,
  p.city,
  p.area,
  -- pre-computed metrics
  (SELECT COUNT(*) FROM listing_event WHERE listing_id = l.id AND event_type = 'VIEW' AND occurred_at >= NOW() - INTERVAL '30 days') as views_30d,
  -- ...
FROM listing l
JOIN listing_type lt ON l.listing_type_id = lt.id
LEFT JOIN property p ON l.property_id = p.id;

REFRESH MATERIALIZED VIEW vw_portfolio_listings;  -- Run hourly via cron
```

---

## Testing Strategy

### Unit Tests

**Property Creation**:
```python
def test_property_creation_with_features():
    location = Location.objects.create(city="Kyrenia", area="Esentepe")
    property_type = PropertyType.objects.create(code="APARTMENT", label="Apartment")
    property = Property.objects.create(
        reference_code="EI-RE-001",
        title="Test Property",
        location=location,
        property_type=property_type,
        bedrooms=2,
        room_configuration_label="2+1"
    )

    wifi = Feature.objects.create(code="WIFI", label="WiFi", category=amenity_category)
    property.features.add(wifi)

    assert property.features.count() == 1
    assert property.features.first().code == "WIFI"
```

**Daily Rental Validation**:
```python
def test_daily_rental_requires_wifi_and_kitchen():
    property = create_property()  # without WiFi/Kitchen

    with pytest.raises(ValidationError):
        listing = Listing.objects.create(
            listing_type=daily_rental_type,
            property=property,
            # ... should fail validation
        )
```

### Integration Tests

**Portfolio Listings API**:
```python
def test_portfolio_listings_filter_by_type(api_client):
    create_listing(listing_type="DAILY_RENTAL", created_by=user)
    create_listing(listing_type="SALE", created_by=user)

    response = api_client.get("/api/v1/real_estate/portfolio/listings/?listing_type=DAILY_RENTAL")

    assert response.status_code == 200
    assert len(response.json()["results"]) == 1
    assert response.json()["results"][0]["listing_type"] == "DAILY_RENTAL"
```

**Listing Update**:
```python
def test_update_listing_price(api_client):
    listing = create_listing(base_price=1000, created_by=user)

    response = api_client.patch(
        f"/api/v1/real_estate/listings/{listing.id}/",
        {"base_price": 1200, "price_period": "PER_MONTH"}
    )

    assert response.status_code == 200
    assert response.json()["base_price"] == "1200.00"
```

### E2E Tests

**Portfolio Workflow**:
1. Create contact → convert to lead → convert to client
2. Create property → attach owner
3. Create listing (daily rental)
4. Create tenancy
5. Record events (view, enquiry, booking)
6. Query portfolio summary - verify counts
7. Query listings with filters - verify results

---

## Summary

The v1 Real Estate Data Model provides:
- **Unified schema** for all property types and transactions
- **Clear separation** of concerns (Property vs Listing vs Project)
- **Flexible CRM** (Contact + Roles)
- **Performance analytics** via events
- **Clean API contracts** for frontend integration
- **Scalable architecture** for future enhancements

**Backend implements**:
- Django models with proper indexes
- DRF serializers for API responses
- Validation for listing type requirements
- Aggregation for summary stats

**Frontend consumes**:
- Type-safe interfaces
- React Query for data fetching
- Optimistic updates
- Pagination and filtering

This architecture supports serious real estate operations while remaining simple enough to ship v1 quickly and iterate without breaking existing functionality.
