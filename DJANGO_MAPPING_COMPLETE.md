# Django Apps Mapping - COMPLETE ✅

**Comprehensive mapping of all Django app relationships completed**

**Date**: November 12, 2025  
**Status**: 100% Complete

---

## What Was Mapped

### 7 Core Django Apps
1. ✅ **users** - User management & profiles
2. ✅ **listings** - Universal marketplace listings
3. ✅ **bookings** - Unified booking system
4. ✅ **real_estate** - Real estate specific (legacy)
5. ✅ **seller_portal** - Multi-domain orchestration (new)
6. ✅ **router_service** - Intent routing
7. ✅ **assistant** - AI assistant & agents

### 11 Core Models
1. ✅ User (users.User)
2. ✅ BusinessProfile (users.BusinessProfile)
3. ✅ UserPreference (users.UserPreference)
4. ✅ Category (listings.Category)
5. ✅ SubCategory (listings.SubCategory)
6. ✅ Listing (listings.Listing) - PRIMARY
7. ✅ ListingImage (listings.ListingImage)
8. ✅ SellerProfile (listings.SellerProfile)
9. ✅ BookingType (bookings.BookingType)
10. ✅ Booking (bookings.Booking) - PRIMARY
11. ✅ DemandLead (assistant.DemandLead)

### 30+ Relationships Documented
- OneToOne relationships
- ForeignKey relationships
- OneToMany relationships (via related_name)
- ManyToMany relationships (future)

### Query Patterns Documented
- Seller queries
- Customer queries
- Category filtering
- Domain filtering
- Aggregation patterns
- Date filtering
- Status filtering
- Ordering & pagination

---

## Documentation Files Created

### 1. **COMPLETE_DJANGO_APPS_MAP.md** (Comprehensive)
- Complete model definitions
- All relationships with diagrams
- Detailed app relationships
- Data flow diagrams
- Query patterns
- Dependency graph
- Migration path
- Performance considerations

### 2. **DJANGO_APPS_RELATIONSHIP_MAP.md** (Detailed)
- Critical relationship distinctions
- Two Listing models explained
- Booking model details
- Category system
- Business profile relationships
- seller_portal integration

### 3. **DJANGO_QUICK_REFERENCE.md** (Quick Lookup)
- Model lookup table
- Common query patterns
- Relationship shortcuts
- Filtering by domain
- Aggregation patterns
- Date filtering
- Common mistakes to avoid

### 4. **IMPLEMENTATION_CHECKPOINT.md** (Status)
- Phase 1 & 2 completion status
- Architecture decisions
- Testing status
- Known limitations
- Next steps

---

## Key Discoveries

### 1. Two Separate Listing Models
**Problem**: 
- `listings.Listing` (primary) - has owner FK, supports all domains
- `real_estate.Listing` (legacy) - no owner FK, real estate specific
- They are NOT related

**Solution**:
- seller_portal uses `listings.Listing` exclusively
- Filter by `category__slug='real_estate'`
- Never use `real_estate.Listing` for seller queries

### 2. Universal Booking Model
**Design**:
- `bookings.Booking` links to `listings.Listing` (not `real_estate.Listing`)
- Supports all booking types via `booking_type` FK
- Flexible `booking_data` JSONField for type-specific fields
- Comprehensive status workflow

### 3. Category-Based Domain Filtering
**Pattern**:
```python
# Real Estate
Listing.objects.filter(category__slug='real_estate')

# Events (future)
Listing.objects.filter(category__slug='events')

# Activities (future)
Listing.objects.filter(category__slug='activities')

# Appointments (future)
Listing.objects.filter(category__slug='appointments')
```

### 4. Seller vs Customer Distinction
**Seller**:
- User.listings (via owner FK)
- Booking.listing.owner (seller of the listing)

**Customer**:
- User.bookings (via user FK)
- Booking.user (customer making the booking)

### 5. Multi-Domain Architecture
**Current**:
- Real estate fully supported
- Events, Activities, Appointments ready for Phase 4

**Future**:
- Extend BusinessProfile with secondary_categories
- Consolidate SellerProfile and BusinessProfile
- Migrate real_estate.Listing data to listings.Listing.dynamic_fields

---

## Critical Relationships

### User is the Central Hub
```
User (1) ──── (1) BusinessProfile
    ├─ (1) ──── (1) SellerProfile
    ├─ (Many) ──── Listing (owner)
    ├─ (Many) ──── Booking (customer)
    ├─ (Many) ──── UserPreference
    └─ (Many) ──── DemandLead
```

### Listing Links Everything
```
Listing (1) ──── (1) Category
    ├─ (1) ──── (1) SubCategory
    ├─ (Many) ──── ListingImage
    ├─ (Many) ──── Booking
    └─ (1) ──── (1) User (owner)
```

### Booking Connects Seller & Customer
```
Booking (1) ──── (1) User (customer)
    ├─ (1) ──── (1) Listing
    │   └─ (1) ──── (1) User (seller via owner)
    └─ (1) ──── (1) BookingType
```

---

## Database Indexes

### listings.Listing Indexes
```python
models.Index(fields=['owner', '-created_at']),
models.Index(fields=['category', 'status']),
models.Index(fields=['category', 'location', 'status']),
models.Index(fields=['status', 'is_featured', '-created_at']),
models.Index(fields=['price']),
```

### bookings.Booking Indexes
```python
models.Index(fields=['user', '-created_at']),
models.Index(fields=['listing', 'start_date', 'end_date']),
models.Index(fields=['booking_type', 'status']),
models.Index(fields=['reference_number']),
models.Index(fields=['user', 'status']),
models.Index(fields=['payment_status']),
models.Index(fields=['status', '-created_at']),
models.Index(fields=['start_date', 'status']),
```

### users.UserPreference Indexes
```python
models.Index(fields=['user', 'preference_type']),
models.Index(fields=['user', '-confidence']),
models.Index(fields=['-confidence', '-last_used_at']),
```

---

## Query Performance Tips

### 1. Use Select Related for ForeignKey
```python
bookings = Booking.objects.select_related(
    'user',
    'listing',
    'booking_type'
).all()
```

### 2. Use Prefetch Related for OneToMany
```python
listings = Listing.objects.prefetch_related(
    'images',
    'bookings'
).all()
```

### 3. Filter at Database Level
```python
# ✅ GOOD - 1 query
bookings = Booking.objects.filter(status='confirmed')

# ❌ BAD - N queries
all_bookings = Booking.objects.all()
confirmed = [b for b in all_bookings if b.status == 'confirmed']
```

### 4. Use Aggregation Functions
```python
from django.db.models import Sum, Count, Avg

stats = Booking.objects.aggregate(
    total_revenue=Sum('total_price'),
    total_bookings=Count('id'),
    avg_price=Avg('total_price')
)
```

---

## Common Query Patterns

### Get Seller's Real Estate Data
```python
# Listings
listings = Listing.objects.filter(
    owner=seller_user,
    category__slug='real_estate'
)

# Bookings
bookings = Booking.objects.filter(
    listing__owner=seller_user,
    listing__category__slug='real_estate'
)

# Metrics
metrics = {
    'total_listings': listings.count(),
    'active_listings': listings.filter(status='active').count(),
    'total_bookings': bookings.count(),
    'confirmed_bookings': bookings.filter(status='confirmed').count(),
    'revenue': bookings.filter(status='confirmed').aggregate(Sum('total_price'))['total_price__sum'] or 0,
}
```

### Get Customer's Bookings
```python
bookings = Booking.objects.filter(
    user=customer_user
).select_related(
    'listing',
    'booking_type'
).order_by('-created_at')
```

### Get Featured Listings
```python
featured = Listing.objects.filter(
    is_featured=True,
    status='active'
).select_related(
    'category',
    'owner'
).prefetch_related(
    'images'
)
```

---

## Validation Checklist

- [x] All 7 apps mapped
- [x] All 11 core models documented
- [x] 30+ relationships documented
- [x] Query patterns provided
- [x] Indexes documented
- [x] Two Listing models explained
- [x] seller_portal integration verified
- [x] No circular dependencies
- [x] All ForeignKeys have on_delete behavior
- [x] JSONField used for flexible metadata
- [x] Atomic operations identified
- [x] Performance tips provided

---

## Next Steps

### Phase 3: Unified Listings & Bookings
- Implement data tables with sorting/filtering
- Add quick actions (view, edit, delete)
- Implement search functionality
- Add pagination

### Phase 4: Multi-Domain Support
- Implement EventsDomainService
- Implement ActivitiesDomainService
- Implement AppointmentsDomainService
- Create Event, Activity, Appointment models

### Phase 5: Analytics & Insights
- Cross-domain analytics endpoint
- Revenue by domain chart
- Booking trends over time
- AI-powered insights

### Future: Consolidation
- Merge SellerProfile and BusinessProfile
- Migrate real_estate.Listing to listings.Listing
- Extend BusinessProfile with secondary_categories
- Deprecate real_estate app

---

## Files to Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| COMPLETE_DJANGO_APPS_MAP.md | Comprehensive reference | Architects, Senior Devs |
| DJANGO_APPS_RELATIONSHIP_MAP.md | Detailed relationships | Backend Devs |
| DJANGO_QUICK_REFERENCE.md | Quick lookup | All Devs |
| IMPLEMENTATION_CHECKPOINT.md | Project status | Project Managers |
| AGENTS.md | Code style | All Devs |
| API_CONTRACTS.md | API standards | Backend Devs |

---

## Summary

✅ **Complete mapping of all Django app relationships**
- 7 apps analyzed
- 11 core models documented
- 30+ relationships mapped
- Query patterns provided
- Performance tips included
- Common mistakes identified
- Future migration path outlined

**Ready for**: Phase 3 implementation with full understanding of data relationships and query patterns.

---

**Mapping Completed**: November 12, 2025  
**Status**: 100% Complete  
**Quality**: Production Ready
