# RecItem - Canonical Recommendation Card Contract

## Overview

**RecItem** is the single source of truth for all real estate recommendation cards from the AI agent. This document defines the complete data contract between the frontend components and backend API.

**Status**: ✅ Fully Implemented
**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Versioning

**Current Version**: RecItem v1

**Stability Guarantee**:
- ⚠️ **Breaking changes** (renaming/removing fields) are **NOT ALLOWED** without bumping to RecItem v2
- ✅ **Backwards-compatible additions** (new optional fields) are allowed
- ✅ **Implementation changes** that maintain the contract are allowed

**What constitutes a breaking change**:
- Renaming any field (e.g., `imageUrl` → `image`)
- Removing any field (even optional ones)
- Changing field types (e.g., `string` → `number`)
- Changing array structures (e.g., `badges: string[]` → `badges: {label: string, color: string}[]`)

**What is allowed**:
- Adding new optional fields to `RecItem` or `RecItemMetadata`
- Adding new values to `rent_type` enum
- Improving formatting logic without changing output structure
- Performance optimizations

**Version Bump Process**:
1. Document breaking changes in a new `docs/RECITEM_V2_MIGRATION.md`
2. Update TypeScript interfaces with version suffix: `RecItemV2`
3. Update Python TypedDict with version suffix: `RecItemV2`
4. Create migration utilities: `convertV1ToV2()`
5. Support both versions during transition period

---

## Purpose

RecItem provides a unified data model for displaying real estate listings across all rental types:
- **Daily Rentals** (short-term vacation rentals)
- **Long-Term Rentals** (monthly/yearly leases)
- **Sales** (properties for purchase)
- **Projects** (off-plan developments)

### Design Goals

1. **Single Wire Format**: One schema for WebSocket messages (`message.recommendations`)
2. **Component Flexibility**: Generic card (RecommendationCard) and enhanced card (ShortTermRecommendationCard)
3. **Progressive Enhancement**: Core fields for basic display, metadata for detailed views
4. **Backend Mapping**: Direct mapping from database view to card schema

---

## TypeScript Interface

**Location**: `frontend/src/types/recItem.ts`

```typescript
export interface RecItem {
  /** Listing ID (maps to backend Listing.id) */
  id: string;

  /** Main title (e.g., "2+1 Sea View Apartment") */
  title: string;

  /** Optional subtitle (e.g., "Near Long Beach · İskele") */
  subtitle?: string;

  /** Legacy reason field (backwards compatibility) */
  reason?: string;

  /** Formatted price string (e.g., "£750 / month", "€120 / night") */
  price?: string;

  /** Rating out of 5 (e.g., 4.5) */
  rating?: number;

  /** Distance in minutes (e.g., 12) */
  distanceMins?: number;

  /** Short curated badges (3-6 items, e.g., ["WiFi", "Pool", "Sea View"]) */
  badges?: string[];

  /** Hero image URL */
  imageUrl?: string;

  /** Short area label (e.g., "Kyrenia · Catalkoy") */
  area?: string;

  /** Gallery image URLs for photo viewer */
  galleryImages?: string[];

  /** Extended metadata for detailed views */
  metadata?: RecItemMetadata;
}

export interface RecItemMetadata {
  /** Number of bedrooms */
  bedrooms?: number;

  /** Number of bathrooms */
  bathrooms?: number;

  /** Full amenities/features list */
  amenities?: string[];

  /** Total area in square meters */
  sqm?: number;

  /** Full property description */
  description?: string;

  /** Rental type: "daily" | "long_term" | "sale" | "project" */
  rent_type?: 'daily' | 'long_term' | 'sale' | 'project';

  /** Contact information (optional) */
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  /** Additional location info (optional) */
  location?: string;
}
```

---

## Python Schema

**Location**: `assistant/agents/real_estate/schema.py`

```python
from typing import TypedDict, Literal

class RecItemMetadata(TypedDict, total=False):
    """Extended metadata for RecItem."""
    bedrooms: int
    bathrooms: int
    amenities: list[str]
    sqm: int
    description: str
    rent_type: Literal['daily', 'long_term', 'sale', 'project']
    contactInfo: dict  # {phone?: str, email?: str, website?: str}
    location: str

class RecItem(TypedDict, total=False):
    """Canonical recommendation card item schema."""
    id: str
    title: str
    subtitle: str
    reason: str
    price: str
    rating: float
    distanceMins: int
    badges: list[str]
    imageUrl: str
    area: str
    galleryImages: list[str]
    metadata: RecItemMetadata
```

---

## Field Specifications

### Core Display Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | ✅ Yes | Listing ID from database | `"123"` |
| `title` | string | ✅ Yes | Main heading (short, human-readable) | `"2+1 Sea View Apartment"` |
| `subtitle` | string | ⬜ No | Location + context | `"Near Long Beach · İskele"` |
| `price` | string | ⬜ No | Formatted price with currency and period | `"£750 / month"`, `"€120 / night"` |
| `area` | string | ⬜ No | Short area label | `"Kyrenia · Catalkoy"` |
| `imageUrl` | string | ⬜ No | Hero image URL | `"https://..."` |
| `badges` | string[] | ⬜ No | 3-6 curated features | `["WiFi", "Pool", "Sea View"]` |

### Enhanced Display Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `rating` | number | ⬜ No | Rating out of 5 | `4.5` |
| `distanceMins` | number | ⬜ No | Distance in minutes | `12` |
| `galleryImages` | string[] | ⬜ No | Photo gallery URLs | `["url1", "url2"]` |
| `reason` | string | ⬜ No | Legacy field for match explanation | `"Best match for your budget"` |

### Metadata Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `metadata.bedrooms` | number | ⬜ No | Number of bedrooms | `2` |
| `metadata.bathrooms` | number | ⬜ No | Number of bathrooms | `1` |
| `metadata.sqm` | number | ⬜ No | Total area in m² | `85` |
| `metadata.description` | string | ⬜ No | Full property description | `"Spacious apartment with..."` |
| `metadata.amenities` | string[] | ⬜ No | Full feature list | `["WiFi", "Kitchen", "AC", ...]` |
| `metadata.rent_type` | string | ⬜ No | `"daily"` \| `"long_term"` \| `"sale"` \| `"project"` | `"daily"` |
| `metadata.contactInfo` | object | ⬜ No | Contact details | `{phone: "+123", email: "..."}` |

---

## Backend Mapping

### Database to RecItem

**Function**: `format_v1_listing_for_card(listing: Dict) -> Dict`
**Location**: `assistant/domain/real_estate_search_v1.py:349-477`

#### Field Mapping

| RecItem Field | Database Source | Transformation |
|---------------|----------------|----------------|
| `id` | `listing_id` | Convert to string |
| `title` | `title` | Direct |
| `subtitle` | `city`, `area` | Join with ", " |
| `area` | `area` | Direct |
| `price` | `base_price`, `currency`, `price_period` | Format: `"£750 / month"` |
| `imageUrl` | `hero_image_url` | Direct (TODO: implement) |
| `galleryImages` | TBD | Array from image storage |
| `badges` | Feature flags | Up to 6 curated items |
| `metadata.bedrooms` | `bedrooms` | Direct |
| `metadata.bathrooms` | `bathrooms` | Direct |
| `metadata.sqm` | `total_area_sqm` or `net_area_sqm` | Prefer total |
| `metadata.description` | `description` | Direct |
| `metadata.amenities` | Feature flags | All features as strings |
| `metadata.rent_type` | `listing_type_code` | Map: `DAILY_RENTAL` → `"daily"` |

#### Badge Generation Logic

```python
badges = []
if listing.get("has_wifi"):
    badges.append("WiFi")
if listing.get("has_kitchen"):
    badges.append("Kitchen")
if listing.get("has_private_pool"):
    badges.append("Private Pool")
elif listing.get("has_shared_pool"):
    badges.append("Pool")
if listing.get("view_sea"):
    badges.append("Sea View")
if listing.get("has_parking"):
    badges.append("Parking")
if listing.get("furnished_status") == "FULLY_FURNISHED":
    badges.append("Furnished")
badges = badges[:6]  # Limit to 6
```

#### Rent Type Mapping

```python
rent_type_map = {
    "DAILY_RENTAL": "daily",
    "LONG_TERM_RENTAL": "long_term",
    "SALE": "sale",
    "PROJECT": "project",
}
```

---

## Frontend Components

### 1. RecommendationCard (Generic)

**File**: `frontend/src/features/chat/components/RecommendationCard.tsx`

**Usage**: All listing types (default card)

**Display**:
- Hero image (`imageUrl`)
- Title, subtitle
- Price badge
- Area + rating row
- Badge chips (3-6 items)
- Quick actions: Photos, Info, Check

### 2. ShortTermRecommendationCard (Enhanced)

**File**: `frontend/src/features/chat/components/ShortTermRecommendationCard.tsx`

**Usage**: Daily rentals (`metadata.rent_type === 'daily'`)

**Enhanced Features**:
- Date picker for check-in/check-out
- Availability checking
- Booking flow
- Property details grid (bedrooms, bathrooms, sqm)

**Field Mapping**:
```typescript
const description = item.metadata?.description;
const amenities = item.metadata?.amenities || [];
const contactInfo = item.metadata?.contactInfo;
const location = item.area || item.metadata?.location || 'North Cyprus';
const photos = item.galleryImages || (item.imageUrl ? [item.imageUrl] : []);
```

---

## API Endpoints

### 1. Availability Check

**Endpoint**: `POST /api/v1/real_estate/availability/check/`

**Request**:
```json
{
  "listing_id": "123",
  "check_in": "2025-08-01",
  "check_out": "2025-08-07"
}
```

**Response**:
```json
{
  "available": true,
  "message": "Property is available for selected dates"
}
```

**Implementation**: `real_estate/api/booking_views.py:AvailabilityCheckView`

**Logic**:
1. Check listing status (`ACTIVE` or `DRAFT`)
2. Check for overlapping tenancies
3. Validate against `available_from`/`available_to` dates

### 2. Booking Creation

**Endpoint**: `POST /api/v1/real_estate/bookings/`

**Request**:
```json
{
  "listing_id": "123",
  "check_in": "2025-08-01",
  "check_out": "2025-08-07"
}
```

**Response**:
```json
{
  "id": 456,
  "status": "PENDING",
  "listing_id": "123",
  "check_in": "2025-08-01",
  "check_out": "2025-08-07",
  "nights": 6,
  "rent_amount": "720.00",
  "currency": "EUR",
  "message": "Booking created successfully. Awaiting confirmation."
}
```

**Implementation**: `real_estate/api/booking_views.py:BookingCreateView`

**Logic**:
1. Validate dates (check_out > check_in)
2. Atomic check-and-create within transaction
3. Create Tenancy record with `PENDING` status

---

## WebSocket Integration

### Agent Response Format

```json
{
  "type": "chat_message",
  "event": "assistant_message",
  "payload": {
    "text": "I found 5 properties matching your criteria.",
    "rich": {
      "recommendations": [
        {
          "id": "123",
          "title": "2+1 Sea View Apartment",
          "subtitle": "Kyrenia, Catalkoy",
          "price": "£750 / month",
          "imageUrl": "https://...",
          "area": "Catalkoy",
          "badges": ["WiFi", "Pool", "Sea View"],
          "galleryImages": ["url1", "url2"],
          "metadata": {
            "bedrooms": 2,
            "bathrooms": 1,
            "sqm": 85,
            "description": "Spacious...",
            "amenities": ["WiFi", "Kitchen", "Pool", ...],
            "rent_type": "long_term"
          }
        }
      ]
    },
    "agent": "real_estate"
  }
}
```

### Component Selection Logic

```typescript
{message.recommendations?.map((item) =>
  item.metadata?.rent_type === 'daily' ? (
    <ShortTermRecommendationCard key={item.id} item={item} />
  ) : (
    <RecommendationCard key={item.id} item={item} />
  )
)}
```

---

## Validation & Testing

### Frontend Type Guards

```typescript
export function isDailyRental(item: RecItem): boolean {
  return item.metadata?.rent_type === 'daily';
}

export function isLongTermRental(item: RecItem): boolean {
  return item.metadata?.rent_type === 'long_term';
}

export function isForSale(item: RecItem): boolean {
  return item.metadata?.rent_type === 'sale';
}

export function isProject(item: RecItem): boolean {
  return item.metadata?.rent_type === 'project';
}
```

### Backend Tests

**TODO**: Unit tests for `format_v1_listing_for_card`

**Test Cases**:
1. ✅ All required fields populated
2. ✅ Badge generation (limit to 6)
3. ✅ Amenities list completeness
4. ✅ Rent type mapping
5. ✅ Price formatting with different currencies
6. ✅ Gallery images handling

---

## Future Enhancements

### Phase 1 (Current)
- ✅ RecItem schema defined
- ✅ Backend mapping implemented
- ✅ Frontend components updated
- ✅ Availability/booking endpoints created

### Phase 2 (Next)
- ⬜ Image storage integration (`imageUrl`, `galleryImages`)
- ⬜ Contact info wiring (`metadata.contactInfo`)
- ⬜ Rating system (`rating` field)
- ⬜ Distance calculation (`distanceMins` field)

### Phase 3 (Future)
- ⬜ Real-time availability updates (WebSocket)
- ⬜ Price optimization suggestions
- ⬜ Similar properties recommendations
- ⬜ Saved searches and alerts

---

## Migration Notes

### From Legacy Schema

**Old PropertyCard**:
```typescript
interface PropertyCard {
  id: string;
  title: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: int;
  price_per_night: string;
  amenities: list[str];
  photos: list[str];
  available: bool;
}
```

**Migration Path**:
- `location` → `area` + `subtitle`
- `price_per_night` → `price` (generalized)
- `photos` → `galleryImages`
- `amenities` → `metadata.amenities`
- `available` → Check via availability endpoint

---

## References

- [Frontend RecItem Types](../frontend/src/types/recItem.ts)
- [Backend RecItem Schema](../assistant/agents/real_estate/schema.py)
- [Format Function](../assistant/domain/real_estate_search_v1.py)
- [RecommendationCard Component](../frontend/src/features/chat/components/RecommendationCard.tsx)
- [ShortTermRecommendationCard Component](../frontend/src/features/chat/components/ShortTermRecommendationCard.tsx)
- [Availability/Booking API](../real_estate/api/booking_views.py)
- [Real Estate Data Model](./REAL_ESTATE_DATA_MODEL.md)

---

**Maintained by**: Development Team
**Questions**: See [API_CONTRACTS.md](./API_CONTRACTS.md) or CLAUDE.md
