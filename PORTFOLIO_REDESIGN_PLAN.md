# Portfolio Redesign - Implementation Plan

**Based on user requirements - 2025-11-15**

---

## 1. Design Decisions Summary

✅ **Layout**: Tabs (Daily Rental, Long-term Rent, Sale, Projects)
✅ **Summary**: One-line summary per listing type
✅ **Card Content**: Messages, requests, pricing, performance metrics visible
✅ **Communication**: Slide-over panel (Option C) for messages & requests
✅ **Calendar**: Modal overlay
✅ **Empty State**: "Add your first listing to be able to manage listings and get bookings or sales"
✅ **Search/Filter**: Yes, include both
✅ **Activity Tab**: Keep, show summary of all activity
✅ **Mobile**: 1 card per column

---

## 2. Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Portfolio Management                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Daily Rental] [Long-term] [Sale] [Projects] [Activity] │   │ ← Tabs
│  └──────────────────────────────────────────────────────────┘   │
│  ──────────────────────────────────────────────────────────     │
│                                                                   │
│  24 active | 18 booked this month | 5 pending requests          │ ← Type summary
│                                                                   │
│  ┌──────────────────────┐  [Status ▼] [Sort ▼]                 │ ← Search/Filter
│  │ 🔍 Search listings...│                                        │
│  └──────────────────────┘                                        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ [Photo]  │  │ [Photo]  │  │ [Photo]  │                      │ ← Grid (3 cols)
│  │          │  │          │  │          │                      │
│  │ Title    │  │ Title    │  │ Title    │                      │
│  │ €120/nt  │  │ €850/mo  │  │ €450k    │                      │
│  │          │  │          │  │          │                      │
│  │ ● Active │  │ ● Rented │  │ ● Active │                      │
│  │ 💬 3 msg │  │ 📝 2 app │  │ 👁 5 view│                      │
│  │ 📅 Next  │  │ 📅 Until │  │ 💰 1 offr│                      │
│  │ 📊 Stats │  │ 📊 Stats │  │ 📊 Stats │                      │
│  │          │  │          │  │          │                      │
│  │ [📅][💰] │  │ [📝][💬] │  │ [👁][💬] │                      │ ← Primary actions
│  │    [•••] │  │    [•••] │  │    [•••] │                      │ ← Menu
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Main Page Component
**File**: `PortfolioManagementPage.tsx` (new)

```typescript
interface PortfolioManagementPageProps {
  // No props - fetches everything internally
}

State:
- activeTab: 'daily-rental' | 'long-term' | 'sale' | 'projects' | 'activity'
- searchQuery: string
- statusFilter: 'all' | 'active' | 'inactive' | 'draft' | etc.
- sortBy: 'recent' | 'price-high' | 'price-low' | 'bookings'
- selectedListingForMessages: string | null  // For slide-over
- selectedListingForRequests: string | null
- selectedListingForCalendar: string | null
```

### 3.2 Type Summary Component
**File**: `TypeSummary.tsx`

```typescript
interface TypeSummaryProps {
  type: ListingType;
  data: {
    active: number;
    total: number;
    // Type-specific metrics:
    // Daily Rental:
    booked_this_month?: number;
    pending_requests?: number;
    // Long-term:
    pending_applications?: number;
    // Sale:
    offers_received?: number;
    viewing_requests?: number;
  };
}

Display:
"24 active | 18 booked this month | 5 pending requests"
```

### 3.3 Listing Card Component (Type-Specific)
**File**: `ListingCard.tsx`

```typescript
interface BaseListingCardProps {
  listing: PortfolioListing;
  type: ListingType;
  onMessageClick: () => void;
  onRequestClick: () => void;
  onCalendarClick: () => void;
  onPricingClick: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

Card Layout:
┌─────────────────────────┐
│ [Photo - 16:9 ratio]    │
│           [•••] menu    │
├─────────────────────────┤
│ Kyrenia Beach Villa     │
│ €120/night              │
│                         │
│ ● Available             │ ← Status badge
│ 💬 3 new messages       │ ← Clickable
│ 📩 2 booking requests   │ ← Clickable
│ 📊 12 bookings | 45 viw │ ← Performance
│ 📅 Next: Dec 15-20      │
│                         │
│ [📅 Calendar] [💰 Price]│ ← Primary actions
└─────────────────────────┘
```

#### Daily Rental Card Specifics:
```typescript
interface DailyRentalCardData {
  status: 'available' | 'booked' | 'unavailable';
  new_messages: number;
  booking_requests: number;
  bookings_this_month: number;
  views_30d: number;
  next_booking?: {
    check_in: string;
    check_out: string;
  };
  occupancy_rate: number;
}

Primary Actions: [📅 Calendar] [💰 Pricing]
Menu Actions: Edit, Boost, Discount, View Analytics, Delete
```

#### Long-term Rental Card Specifics:
```typescript
interface LongTermCardData {
  status: 'available' | 'rented' | 'unavailable';
  new_messages: number;
  applications: number;
  views_30d: number;
  current_tenant?: {
    name: string;
    lease_until: string;
  };
  monthly_rent: number;
}

Primary Actions: [📝 Applications] [💬 Messages]
Menu Actions: Edit, Mark as Rented, View Tenant, Delete
```

#### Sale Card Specifics:
```typescript
interface SaleCardData {
  status: 'active' | 'under-offer' | 'sold';
  new_messages: number;
  offers_received: number;
  viewing_requests: number;
  views_30d: number;
  price_history: {
    original: number;
    current: number;
    reduced_count: number;
  };
}

Primary Actions: [👁 Viewings] [💰 Offers]
Menu Actions: Edit, Adjust Price, Mark as Sold, Delete
```

#### Project Card Specifics:
```typescript
interface ProjectCardData {
  status: 'active' | 'sold-out';
  total_units: number;
  available_units: number;
  new_enquiries: number;
  viewing_requests: number;
  brochure_downloads: number;
}

Primary Actions: [🏢 Units] [📥 Enquiries]
Menu Actions: Edit, Manage Units, Download Brochure, Delete
```

### 3.4 Message Slide-over Panel
**File**: `MessagesSlideOver.tsx`

```typescript
interface MessagesSlideOverProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

Layout:
┌────────────────────────────────┐
│ ← Back   Kyrenia Beach Villa  │ ← Header
├────────────────────────────────┤
│                                │
│ ┌──────────────────────────┐  │
│ │ John Doe - 2h ago        │  │ ← Message
│ │ "Is this available..."   │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ You - 1h ago             │  │
│ │ "Yes, it's available"    │  │
│ └──────────────────────────┘  │
│                                │
├────────────────────────────────┤
│ [Type message...        Send] │ ← Reply box
└────────────────────────────────┘
```

### 3.5 Requests Slide-over Panel
**File**: `RequestsSlideOver.tsx`

```typescript
interface RequestsSlideOverProps {
  listingId: string;
  requestType: 'booking' | 'application' | 'viewing' | 'offer';
  isOpen: boolean;
  onClose: () => void;
}

Layout (Booking Request):
┌────────────────────────────────┐
│ ← Back   Booking Requests (2)  │
├────────────────────────────────┤
│                                │
│ ┌──────────────────────────┐  │
│ │ Sarah Johnson            │  │
│ │ Check-in: Dec 15, 2024   │  │
│ │ Check-out: Dec 20, 2024  │  │
│ │ Guests: 4 adults         │  │
│ │ Total: €600              │  │
│ │                          │  │
│ │ [✓ Approve] [✗ Decline]  │  │
│ └──────────────────────────┘  │
│                                │
│ ┌──────────────────────────┐  │
│ │ Mike Davis               │  │
│ │ ...                      │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

### 3.6 Calendar Modal
**File**: `CalendarModal.tsx`

```typescript
interface CalendarModalProps {
  listingId: string;
  listingType: 'daily-rental' | 'long-term';
  isOpen: boolean;
  onClose: () => void;
}

Layout (Daily Rental):
┌─────────────────────────────────────┐
│ Calendar - Kyrenia Beach Villa   ✕ │
├─────────────────────────────────────┤
│                                     │
│  [← November 2024 →]                │
│                                     │
│  Mo Tu We Th Fr Sa Su               │
│               1  2  3               │
│   4  5  6  7  8  9 10               │
│  11 12 13 14 15 16 17   ← Booked    │
│  18 19 20 21 22 23 24   ← Blocked   │
│  25 26 27 28 29 30                  │
│                                     │
│  Legend:                            │
│  ● Booked   ● Blocked   ○ Available│
│                                     │
│  [Block Dates] [Custom Pricing]    │
│                                     │
│  [Cancel] [Save]                    │
└─────────────────────────────────────┘

Layout (Long-term):
┌─────────────────────────────────────┐
│ Availability - Apartment Name    ✕ │
├─────────────────────────────────────┤
│                                     │
│  Current Status: ● Rented           │
│  Tenant: John Smith                 │
│  Lease Until: Dec 31, 2024          │
│                                     │
│  Available From:                    │
│  [Date picker] Jan 1, 2025          │
│                                     │
│  [Mark as Available]                │
│                                     │
│  [Cancel] [Save]                    │
└─────────────────────────────────────┘
```

### 3.7 Activity Tab
**File**: `ActivityTab.tsx` (keep existing, simplify)

```typescript
interface ActivityTabProps {
  // Shows aggregated activity from all listings
}

Display:
- Recent bookings (all types)
- New messages
- New requests
- Price changes
- Status changes
- Timeline view
```

---

## 4. Data Requirements

### 4.1 API Endpoints Needed

#### GET /api/v1/real_estate/portfolio/by-type/
```typescript
Query Params:
- type: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT'
- search?: string
- status?: string
- sort?: string
- page?: number
- page_size?: number

Response:
{
  "results": [
    {
      "id": "listing-123",
      "type": "DAILY_RENTAL",
      "title": "Kyrenia Beach Villa",
      "reference_code": "KYR-001",
      "base_price": 120,
      "currency": "EUR",
      "price_unit": "night",
      "status": "ACTIVE",
      "main_image": "https://...",

      // Daily Rental specific:
      "new_messages": 3,
      "booking_requests": 2,
      "bookings_this_month": 12,
      "views_30d": 45,
      "next_booking": {
        "check_in": "2024-12-15",
        "check_out": "2024-12-20",
        "guest_name": "Sarah J."
      },
      "occupancy_rate": 78.5,

      // Long-term specific:
      "applications": 2,
      "current_tenant": {
        "name": "John Smith",
        "lease_until": "2024-12-31"
      },

      // Sale specific:
      "offers_received": 1,
      "viewing_requests": 5,
      "price_history": {
        "original": 500000,
        "current": 450000,
        "reduced_count": 1
      },

      // Project specific:
      "total_units": 50,
      "available_units": 12,
      "enquiries": 24,
      "brochure_downloads": 156
    }
  ],
  "total": 24,
  "page": 1,
  "page_size": 20
}
```

#### GET /api/v1/real_estate/portfolio/type-summary/
```typescript
Query Params:
- type: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT'

Response:
{
  "type": "DAILY_RENTAL",
  "active": 24,
  "total": 28,
  "inactive": 4,

  // Type-specific metrics:
  "booked_this_month": 18,
  "pending_requests": 5,
  "total_revenue_this_month": 2160,
  "avg_occupancy": 75.5
}
```

#### GET /api/v1/messages/listing/{listing_id}/
```typescript
Response:
{
  "listing_id": "listing-123",
  "listing_title": "Kyrenia Beach Villa",
  "threads": [
    {
      "id": "thread-456",
      "user": {
        "name": "John Doe",
        "avatar": "https://..."
      },
      "last_message": {
        "text": "Is this available for...",
        "timestamp": "2024-11-15T10:30:00Z",
        "sender": "user"
      },
      "unread_count": 2,
      "messages": [
        {
          "id": "msg-789",
          "text": "Is this available...",
          "sender": "user",
          "timestamp": "2024-11-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

#### GET /api/v1/bookings/requests/?listing_id={id}
```typescript
Response:
{
  "requests": [
    {
      "id": "req-123",
      "listing_id": "listing-123",
      "guest": {
        "name": "Sarah Johnson",
        "email": "sarah@example.com",
        "phone": "+90..."
      },
      "check_in": "2024-12-15",
      "check_out": "2024-12-20",
      "guests": {
        "adults": 4,
        "children": 0
      },
      "total_price": 600,
      "status": "pending",
      "created_at": "2024-11-14T15:20:00Z",
      "special_requests": "Late check-in needed"
    }
  ]
}
```

#### POST /api/v1/bookings/requests/{id}/approve/
```typescript
Request Body:
{
  "notes": "Looking forward to hosting you!"
}

Response:
{
  "success": true,
  "booking_id": "booking-789",
  "message": "Booking confirmed"
}
```

#### GET /api/v1/real_estate/listing/{id}/calendar/
```typescript
Query Params:
- month: '2024-11'

Response:
{
  "listing_id": "listing-123",
  "month": "2024-11",
  "days": {
    "2024-11-15": {
      "status": "booked",
      "booking_id": "booking-123",
      "price": 120
    },
    "2024-11-16": {
      "status": "blocked",
      "reason": "Maintenance"
    },
    "2024-11-17": {
      "status": "available",
      "price": 120
    }
  },
  "bookings": [
    {
      "id": "booking-123",
      "guest_name": "John Doe",
      "check_in": "2024-11-15",
      "check_out": "2024-11-20"
    }
  ]
}
```

#### POST /api/v1/real_estate/listing/{id}/calendar/block/
```typescript
Request Body:
{
  "start_date": "2024-12-24",
  "end_date": "2024-12-26",
  "reason": "Holiday closure"
}
```

#### POST /api/v1/real_estate/listing/{id}/pricing/custom/
```typescript
Request Body:
{
  "date_range": {
    "start": "2024-07-01",
    "end": "2024-08-31"
  },
  "price": 180,
  "min_nights": 3
}
```

---

## 5. File Structure

```
frontend/src/features/seller-dashboard/domains/real-estate/portfolio/
├── PortfolioManagementPage.tsx          (NEW - main page)
├── components/
│   ├── TypeSummary.tsx                  (NEW)
│   ├── SearchFilterBar.tsx              (NEW)
│   ├── ListingCard/
│   │   ├── ListingCard.tsx              (NEW - base)
│   │   ├── DailyRentalCard.tsx          (NEW)
│   │   ├── LongTermCard.tsx             (NEW)
│   │   ├── SaleCard.tsx                 (NEW)
│   │   └── ProjectCard.tsx              (NEW)
│   ├── MessagesSlideOver.tsx            (NEW)
│   ├── RequestsSlideOver.tsx            (NEW)
│   ├── CalendarModal.tsx                (NEW)
│   ├── ActivityTab.tsx                  (KEEP - simplify)
│   ├── EmptyState.tsx                   (KEEP - reuse)
│   └── Toast.tsx                        (KEEP)
├── hooks/
│   ├── useListingsByType.ts             (NEW)
│   ├── useTypeSummary.ts                (NEW)
│   ├── useMessages.ts                   (NEW)
│   ├── useRequests.ts                   (NEW)
│   └── useCalendar.ts                   (NEW)
└── types.ts                              (UPDATE)
```

---

## 6. Implementation Phases

### Phase 1: Core Structure (Day 1)
- ✅ Create PortfolioManagementPage.tsx with tabs
- ✅ Create TypeSummary.tsx
- ✅ Create SearchFilterBar.tsx
- ✅ Setup routing

### Phase 2: Listing Cards (Day 2)
- ✅ Create base ListingCard.tsx
- ✅ Create DailyRentalCard.tsx
- ✅ Create LongTermCard.tsx
- ✅ Create SaleCard.tsx
- ✅ Create ProjectCard.tsx
- ✅ Add responsive grid (3 cols → 2 cols → 1 col)

### Phase 3: Communication (Day 3)
- ✅ Create MessagesSlideOver.tsx
- ✅ Create RequestsSlideOver.tsx
- ✅ Wire up message fetching
- ✅ Wire up request fetching
- ✅ Add reply functionality

### Phase 4: Calendar & Actions (Day 4)
- ✅ Create CalendarModal.tsx
- ✅ Implement date blocking
- ✅ Implement custom pricing
- ✅ Add primary action handlers

### Phase 5: Activity & Polish (Day 5)
- ✅ Simplify ActivityTab.tsx
- ✅ Add empty states
- ✅ Add loading states
- ✅ Add error handling
- ✅ Mobile optimization

### Phase 6: Backend Integration (Day 6)
- ✅ Create all API endpoints
- ✅ Test with real data
- ✅ Performance optimization
- ✅ Final polish

---

## 7. Responsive Breakpoints

```css
/* Desktop (default) */
.listing-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet (md) */
@media (max-width: 1024px) {
  .listing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile (sm) */
@media (max-width: 640px) {
  .listing-grid {
    grid-template-columns: 1fr;
  }

  /* Simplified card actions on mobile */
  .card-actions {
    flex-direction: column;
  }
}
```

---

## 8. Key Features Summary

✅ **Type-based organization** - Tab per listing type
✅ **At-a-glance metrics** - Performance visible on card
✅ **Quick communication** - Messages/requests in slide-over
✅ **Calendar management** - Block dates, custom pricing
✅ **Search & filter** - Find listings easily
✅ **Responsive** - Works on all devices
✅ **Empty states** - Clear guidance when no listings
✅ **Activity tracking** - See all recent activity

---

## 9. Next Steps

1. **Review this plan** - Confirm everything looks good
2. **Start with Phase 1** - Create main page structure
3. **Build incrementally** - One phase at a time
4. **Test continuously** - Verify each component works
5. **Backend coordination** - Ensure APIs are ready

---

**Questions before we start coding?**

Let me know if you want me to:
- Adjust any component layouts
- Add/remove any features
- Change the implementation approach
- Start coding immediately

I'm ready to build this simplified, practical portfolio management interface!
