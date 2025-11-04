# Real Estate Django App - Setup Complete

**Status:** ✅ COMPLETE
**Date:** 2025-11-02

## What Was Built

Created a production-ready Django app (`real_estate`) with explicit tenure support for short-term (nightly) and long-term (monthly) property rentals.

## Implementation Details

### 1. Django App Structure

```
real_estate/
├── __init__.py
├── admin.py
├── apps.py
├── models.py                    # Listing + Availability models
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py          # Initial migration
├── management/
│   ├── __init__.py
│   └── commands/
│       ├── __init__.py
│       └── seed_listings.py     # Seed command
├── tests.py
└── views.py
```

### 2. Models

#### Listing Model
**Purpose:** Core property listing with tenure as first-class field

**Key Fields:**
- `tenure` (CharField): `short_term` or `long_term` - CRITICAL for routing
- `price_amount` (IntegerField): Price in smallest currency unit (e.g., £120 = 120)
- `price_unit` (CharField): `per_night` or `per_month`
- `bedrooms`, `bathrooms`, `max_guests`: Property specs
- `amenities` (ArrayField): PostgreSQL array for features
- `city`, `area`, `address`: Location fields
- `min_stay_nights` (IntegerField): For short-term (e.g., 3 nights minimum)
- `min_lease_months` (IntegerField): For long-term (e.g., 6 months minimum)
- `available_from` (DateField): Move-in date for long-term

**Composite Indexes:**
- `re_main_search_idx`: (tenure, city, bedrooms, price_amount) - Main query path
- `re_movein_idx`: (tenure, available_from, city) - Long-term move-in queries

#### Availability Model
**Purpose:** Nightly availability calendar for short-term rentals only

**Key Fields:**
- `listing` (ForeignKey): Links to Listing (limited to tenure='short_term')
- `date` (DateField): Specific night
- `is_available` (BooleanField): Availability flag
- `price_override` (IntegerField): Optional dynamic pricing

**Unique Constraint:** (listing, date) - One record per night

### 3. Seed Data

**Command:** `python3 manage.py seed_listings`

**Short-Term Fixtures (3 listings):**
- st-kyr-001: Modern 2BR Apartment, Kyrenia, £120/night
- st-fam-001: Luxury 3BR Villa, Famagusta, £250/night
- st-nic-001: Cozy Studio, Nicosia, £60/night

Each short-term listing includes 90 days of availability calendar.

**Long-Term Fixtures (3 listings):**
- lt-kyr-001: 2BR Apartment, Kyrenia, £800/month, 6-month min
- lt-fam-001: 3BR Family Home, Famagusta, £1200/month, 12-month min
- lt-nic-001: 1BR Central Flat, Nicosia, £650/month, 6-month min

### 4. Database Setup

```bash
# Add to INSTALLED_APPS in settings/base.py
'real_estate',

# Generate migrations
python3 manage.py makemigrations real_estate

# Apply migrations
python3 manage.py migrate real_estate

# Seed fixture data
python3 manage.py seed_listings
```

**Result:** 6 listings created (3 short-term + 3 long-term)

## Verification Tests

### Test 1: Short-Term Search
```python
# Query: short-term, Kyrenia, 2+ beds, ≤£150/night
Listing.objects.filter(
    tenure='short_term',
    city='Kyrenia',
    bedrooms__gte=2,
    price_amount__lte=150,
    is_active=True
)
# Result: 1 listing (Modern 2BR Apartment, £120/night)
```

### Test 2: Long-Term Search
```python
# Query: long-term, 1 bed, available within 30 days
from datetime import date, timedelta
cutoff = date.today() + timedelta(days=30)
Listing.objects.filter(
    tenure='long_term',
    bedrooms=1,
    available_from__lte=cutoff,
    is_active=True
)
# Result: 1 listing (1BR Central Flat, Nicosia, £650/month, available now)
```

### Test 3: Model Import
```python
from real_estate.models import Listing, Availability
# Success - no import errors
```

## Next Steps (S3 Continuation)

### Phase 1: Update Real Estate Agent Tools (tools.py)
Replace fixture-based search with DB-backed queries:

```python
def search_properties_db(
    tenure: str,  # 'short_term' or 'long_term'
    city: str,
    bedrooms: int,
    max_price: int,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
) -> List[Dict]:
    """DB-backed property search with tenure awareness."""
    from real_estate.models import Listing, Availability

    qs = Listing.objects.filter(
        tenure=tenure,
        city__iexact=city,
        bedrooms__gte=bedrooms,
        price_amount__lte=int(max_price * 1.1),  # +10% budget margin
        is_active=True,
    )

    # Short-term: Check nightly availability
    if tenure == 'short_term' and check_in and check_out:
        # Filter listings with full availability in date range
        qs = qs.filter(
            availability_calendar__date__range=(check_in, check_out),
            availability_calendar__is_available=True
        ).annotate(avail_count=Count('availability_calendar')).filter(
            avail_count__gte=(check_out - check_in).days
        )

    # Long-term: Check move-in date
    elif tenure == 'long_term' and check_in:
        qs = qs.filter(available_from__lte=check_in)

    return [format_listing(lst) for lst in qs[:10]]
```

### Phase 2: Update Policy (policy.py)
Add TENURE_DECIDE state before SEARCH:

```python
def policy(state: AgentState) -> str:
    slots = state['slots']

    # 1. TENURE_DECIDE: Determine rental mode
    if not slots.get('tenure'):
        return 'TENURE_DECIDE'

    # 2. SLOT_FILL: Collect required params
    if not all([slots.get('city'), slots.get('bedrooms'), slots.get('max_price')]):
        return 'SLOT_FILL'

    # 3. SEARCH: Execute DB query
    if not state.get('search_results'):
        return 'SEARCH'

    # 4. SHOW_LISTINGS: Present results
    return 'SHOW_LISTINGS'
```

### Phase 3: Update Metrics
Add tenure labels:

```python
RE_REQUESTS_TOTAL = Counter(
    "agent_re_requests_total",
    "Total RE agent requests",
    ["intent", "tenure"]  # Add tenure label
)

# Usage
RE_REQUESTS_TOTAL.labels(intent='property_search', tenure='short_term').inc()
```

### Phase 4: Create Golden Frames
Add tenure-specific test frames:

```json
// tests/golden/agent/v1.0/003-show_listings-short_term.json
{
  "reply": "I found 3 nightly rentals in Kyrenia:",
  "actions": [{
    "type": "show_listings",
    "params": {
      "listings": [...],
      "tenure": "short_term"
    }
  }]
}

// tests/golden/agent/v1.0/004-show_listings-long_term.json
{
  "reply": "I found 2 monthly rentals available from November:",
  "actions": [{
    "type": "show_listings",
    "params": {
      "listings": [...],
      "tenure": "long_term"
    }
  }]
}
```

### Phase 5: Update Tests
```python
def test_short_term_search():
    request = AgentRequest(
        intent='property_search',
        input='2 bedroom apartment in Kyrenia for a week',
        ctx=AgentContext(locale='en', time='2025-11-02T12:00:00Z')
    )
    response = handle_real_estate_request(request)

    assert response['actions'][0]['type'] == 'show_listings'
    assert response['actions'][0]['params']['tenure'] == 'short_term'
    assert len(response['actions'][0]['params']['listings']) > 0

def test_long_term_search():
    request = AgentRequest(
        intent='property_search',
        input='1 bedroom flat in Nicosia for 6 months',
        ctx=AgentContext(locale='en', time='2025-11-02T12:00:00Z')
    )
    response = handle_real_estate_request(request)

    assert response['actions'][0]['type'] == 'show_listings'
    assert response['actions'][0]['params']['tenure'] == 'long_term'
```

## Files Modified

1. **easy_islanders/settings/base.py** - Added `'real_estate'` to INSTALLED_APPS
2. **real_estate/models.py** - Created Listing and Availability models (260 lines)
3. **real_estate/management/commands/seed_listings.py** - Seed command (165 lines)
4. **real_estate/migrations/0001_initial.py** - Generated migration

## Database Schema

```sql
-- Tables created
CREATE TABLE real_estate_listing (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    tenure VARCHAR(16) NOT NULL,  -- 'short_term' or 'long_term'
    price_amount INTEGER NOT NULL,
    price_unit VARCHAR(16) NOT NULL,  -- 'per_night' or 'per_month'
    currency VARCHAR(3) DEFAULT 'GBP',
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    max_guests INTEGER DEFAULT 2,
    property_type VARCHAR(32) DEFAULT 'apartment',
    square_meters INTEGER,
    amenities TEXT[],  -- PostgreSQL array
    city VARCHAR(64) NOT NULL,
    area VARCHAR(64),
    address TEXT,
    min_stay_nights INTEGER DEFAULT 1,
    min_lease_months INTEGER DEFAULT 1,
    available_from DATE,
    image_url TEXT,
    additional_images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE real_estate_availability (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES real_estate_listing(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price_override INTEGER,
    UNIQUE (listing_id, date)
);

-- Indexes
CREATE INDEX re_main_search_idx ON real_estate_listing (tenure, city, bedrooms, price_amount);
CREATE INDEX re_movein_idx ON real_estate_listing (tenure, available_from, city);
CREATE INDEX re_avail_lookup_idx ON real_estate_availability (listing_id, date, is_available);
```

## Summary

✅ Django app created with `python3 manage.py startapp real_estate`
✅ Models defined with tenure as first-class field
✅ Composite indexes for efficient queries
✅ Migrations generated and applied
✅ Seed command created with 6 fixtures (3 short + 3 long)
✅ Database populated successfully
✅ Queries verified with tenure filters

**Ready for S3 Phase 2:** Wire DB-backed tools into Real Estate Agent.
