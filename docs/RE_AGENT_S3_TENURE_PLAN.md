# Real Estate Agent S3: Tenure Support + DB Integration

**Date:** 2025-11-02
**Status:** 📋 READY TO IMPLEMENT
**Alignment:** Production Playbooks (Contracts-first, Tool-first, Deterministic, Observable)

---

## Overview

Extend Real Estate Agent from S2 (fixtures) → S3 (database) with first-class tenure support:
- **Short-term:** Per-night pricing, date availability, minimum stay nights
- **Long-term:** Per-month pricing, move-in dates, minimum lease months

**Key Principles (from Production Books):**
1. **Contracts First:** Freeze v1.1 schemas before implementation
2. **Tool First:** Deterministic DB queries, no LLM in control flow
3. **State Machine:** Explicit tenure decision state
4. **Observable:** Metrics sliced by tenure
5. **Safe:** Feature-flagged rollout with caps and timeouts

---

## Implementation Steps

### Step 1: Contracts v1.1 (Freeze First)

**Files to Create:**
1. `assistant/agents/real_estate/schema.py` - Python TypedDict definitions
2. `schema/agent/real_estate/1.1/request.schema.json` - JSON schema
3. `schema/agent/real_estate/1.1/response.schema.json` - JSON schema

**Key Changes from v1.0:**
```python
class SearchParams(TypedDict, total=False):
    # NEW in v1.1
    tenure: Literal["short_term", "long_term", "auto"]
    price_unit: Literal["per_night", "per_month"]
    dates: Dict[str, str]  # {check_in, check_out} for short-term
    move_in: str           # ISO date for long-term
    min_stay_nights: int
    min_lease_months: int
    guests: int

    # Existing from v1.0
    budget: Dict[str, int]
    bedrooms: int
    property_type: List[str]
    amenities: List[str]
    location: Dict[str, str]

class PropertyCard(TypedDict):
    # NEW in v1.1
    tenure: Literal["short_term", "long_term"]
    price_unit: Literal["per_night", "per_month"]
    min_stay_nights: int  # If short-term
    min_lease_months: int  # If long-term
    available_from: str    # If long-term

    # Existing from v1.0
    id: str
    title: str
    location: str
    price: float
    currency: str
    bedrooms: int
    amenities: List[str]
    photos: List[str]
```

**Snapshot Test:**
```python
# tests/schemas/test_agent_contracts_v1_1.py
def test_v1_1_backward_compatible():
    """v1.1 must accept all v1.0 requests (tenure defaults to 'auto')."""
    v1_0_request = {...}  # Old request without tenure
    validate(v1_0_request, schema_v1_1)  # Should pass

def test_v1_1_short_term_golden():
    """Golden frame: short-term search."""
    request = {
        "tenure": "short_term",
        "price_unit": "per_night",
        "dates": {"check_in": "2025-12-01", "check_out": "2025-12-07"},
        "budget": {"max": 150},
        ...
    }
    validate(request, schema_v1_1)
```

---

### Step 2: Django App - `real_estate`

**Create App:**
```bash
python3 manage.py startapp real_estate
```

**Models:**
```python
# real_estate/models.py
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator


class Listing(models.Model):
    """
    Property listing with explicit tenure support.

    Indexes:
    - (tenure, city, bedrooms, price_amount) - Composite for main query
    - price_amount, bedrooms, city - Individual indexes
    """

    TENURE_CHOICES = [
        ("short_term", "Short Term"),
        ("long_term", "Long Term"),
    ]

    PRICE_UNIT_CHOICES = [
        ("per_night", "Per Night"),
        ("per_month", "Per Month"),
    ]

    # Identity
    external_id = models.CharField(max_length=64, unique=True, db_index=True)
    title = models.CharField(max_length=200)

    # Tenure
    tenure = models.CharField(
        max_length=16,
        choices=TENURE_CHOICES,
        db_index=True,
        help_text="Rental mode: short_term (nightly) or long_term (monthly)"
    )

    # Pricing
    price_amount = models.IntegerField(
        validators=[MinValueValidator(0)],
        db_index=True,
        help_text="Price in smallest currency unit (e.g., pence for GBP)"
    )
    price_unit = models.CharField(
        max_length=16,
        choices=PRICE_UNIT_CHOICES,
        db_index=True
    )
    currency = models.CharField(max_length=3, default="GBP")

    # Property details
    bedrooms = models.IntegerField(default=1, db_index=True)
    property_type = models.CharField(
        max_length=32,
        db_index=True,
        help_text="apartment, villa, studio, etc."
    )
    amenities = ArrayField(
        models.CharField(max_length=32),
        default=list,
        help_text="wifi, pool, parking, etc."
    )

    # Location
    city = models.CharField(max_length=64, db_index=True)
    area = models.CharField(max_length=64, blank=True, default="")

    # Tenure-specific requirements
    min_stay_nights = models.IntegerField(
        default=1,
        help_text="Minimum stay for short-term rentals"
    )
    min_lease_months = models.IntegerField(
        default=1,
        help_text="Minimum lease duration for long-term rentals"
    )
    available_from = models.DateField(
        null=True,
        blank=True,
        help_text="Earliest move-in date for long-term rentals"
    )

    # Media
    image_url = models.URLField(blank=True, default="")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(
                fields=['tenure', 'city', 'bedrooms', 'price_amount'],
                name='re_main_search_idx'
            ),
        ]
        ordering = ['price_amount']

    def __str__(self):
        return f"{self.title} ({self.tenure}, {self.city})"


class Availability(models.Model):
    """
    Nightly availability calendar for short-term rentals.

    Long-term rentals use available_from + lease rules instead.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="availability_calendar"
    )
    date = models.DateField(db_index=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = [['listing', 'date']]
        indexes = [
            models.Index(fields=['listing', 'date'], name='re_avail_idx'),
        ]
        ordering = ['date']

    def __str__(self):
        return f"{self.listing_id} on {self.date}: {self.is_available}"
```

**Migration:**
```python
# real_estate/migrations/0001_initial.py
# Generated via: python3 manage.py makemigrations real_estate
```

**Seed Data:**
```python
# real_estate/management/commands/seed_listings.py
from django.core.management.base import BaseCommand
from real_estate.models import Listing, Availability
from datetime import date, timedelta
import json


class Command(BaseCommand):
    help = "Seed real_estate listings from fixtures"

    def handle(self, *args, **options):
        # Load from assistant/agents/real_estate/fixtures/listings.json
        # Convert to Listing model instances
        # For short-term: create Availability records (next 90 days)
        # For long-term: set available_from
        pass
```

---

### Step 3: Tools - DB-Backed with Tenure Logic

**File:** `assistant/agents/real_estate/tools.py`

**Key Functions:**

```python
def infer_tenure(params: SearchParams) -> TenureDecision:
    """
    Infer tenure from search params.

    Rules:
    1. Explicit: price_unit="per_night" → short_term
    2. Explicit: price_unit="per_month" → long_term
    3. Dates present → short_term
    4. Move-in date present → long_term
    5. Budget hints: "£150/night" → short_term, "£1500/month" → long_term
    6. Ambiguous → return "ambiguous" for clarification

    Returns:
        TenureDecision with tenure, confidence, reason
    """
    # Explicit price unit
    if params.get("price_unit") == "per_night":
        return TenureDecision(
            tenure="short_term",
            confidence="high",
            reason="price_unit=per_night"
        )

    if params.get("price_unit") == "per_month":
        return TenureDecision(
            tenure="long_term",
            confidence="high",
            reason="price_unit=per_month"
        )

    # Date-based signals
    if params.get("dates"):
        return TenureDecision(
            tenure="short_term",
            confidence="high",
            reason="dates specified (check-in/check-out)"
        )

    if params.get("move_in"):
        return TenureDecision(
            tenure="long_term",
            confidence="high",
            reason="move_in date specified"
        )

    # Ambiguous - need clarification
    return TenureDecision(
        tenure="ambiguous",
        confidence="low",
        reason="no explicit tenure signals"
    )


def search_listings_db(params: SearchParams) -> List[PropertyCard]:
    """
    Search listings in database with tenure awareness.

    Caps:
    - Max 25 results
    - +10% budget slack
    - +1 bedroom slack
    - Timeout: 5 seconds

    Filters:
    - Short-term: Check Availability for all nights in date range
    - Long-term: Check available_from <= move_in, respect min_lease_months
    """
    from real_estate.models import Listing
    from django.db.models import Q
    import logging

    logger = logging.getLogger(__name__)

    # Infer tenure
    tenure_decision = infer_tenure(params)

    if tenure_decision["tenure"] == "ambiguous":
        return []  # Policy will handle clarification

    tenure = tenure_decision["tenure"]

    # Start query
    q = Listing.objects.filter(tenure=tenure, is_active=True)

    # Location filter
    if "location" in params:
        city = params["location"]["city"]
        q = q.filter(city__iexact=city)

        if params["location"].get("area"):
            area = params["location"]["area"]
            q = q.filter(area__iexact=area)

    # Bedrooms filter (with +1 slack)
    if "bedrooms" in params:
        min_bedrooms = params["bedrooms"]
        q = q.filter(bedrooms__gte=min_bedrooms)
        q = q.filter(bedrooms__lte=min_bedrooms + 1)  # +1 slack

    # Budget filter (with +10% slack)
    if "budget" in params:
        budget = params["budget"]

        # Normalize to correct unit
        if tenure == "short_term":
            unit = "per_night"
        else:
            unit = "per_month"

        q = q.filter(price_unit=unit)

        if "min" in budget:
            q = q.filter(price_amount__gte=budget["min"])

        if "max" in budget:
            max_with_slack = int(budget["max"] * 1.10)  # +10%
            q = q.filter(price_amount__lte=max_with_slack)

    # Property type filter
    if "property_type" in params:
        q = q.filter(property_type__in=params["property_type"])

    # Amenities filter (all must be present)
    if "amenities" in params:
        for amenity in params["amenities"]:
            q = q.filter(amenities__contains=[amenity])

    # Order by price and limit
    q = q.order_by("price_amount")[:25]

    results = list(q)
    logger.info(f"DB query returned {len(results)} listings (tenure={tenure})")

    # Post-filter for availability (short-term only)
    if tenure == "short_term" and "dates" in params:
        results = filter_by_availability(results, params["dates"])

    # Post-filter for move-in (long-term only)
    if tenure == "long_term" and "move_in" in params:
        results = filter_by_move_in(results, params["move_in"])

    # Convert to PropertyCard
    return [to_property_card(listing) for listing in results]


def filter_by_availability(
    listings: List[Listing],
    dates: Dict[str, str]
) -> List[Listing]:
    """
    Filter short-term listings by nightly availability.

    All nights in [check_in, check_out) must be available.
    """
    from real_estate.models import Availability
    from datetime import datetime, timedelta

    check_in = datetime.fromisoformat(dates["check_in"]).date()
    check_out = datetime.fromisoformat(dates["check_out"]).date()

    nights = (check_out - check_in).days
    required_dates = [check_in + timedelta(days=i) for i in range(nights)]

    available_listings = []
    for listing in listings:
        # Check if all dates are available
        unavailable = Availability.objects.filter(
            listing=listing,
            date__in=required_dates,
            is_available=False
        ).exists()

        if not unavailable:
            available_listings.append(listing)

    return available_listings


def filter_by_move_in(
    listings: List[Listing],
    move_in_str: str
) -> List[Listing]:
    """
    Filter long-term listings by move-in date.

    Listing must have available_from <= move_in.
    """
    from datetime import datetime

    move_in = datetime.fromisoformat(move_in_str).date()

    return [
        listing for listing in listings
        if listing.available_from is None or listing.available_from <= move_in
    ]


def to_property_card(listing: Listing) -> PropertyCard:
    """Convert Django model to PropertyCard TypedDict."""
    card = PropertyCard(
        id=listing.external_id,
        title=listing.title,
        location=f"{listing.city}" + (f", {listing.area}" if listing.area else ""),
        price=float(listing.price_amount),
        price_unit=listing.price_unit,
        currency=listing.currency,
        bedrooms=listing.bedrooms,
        property_type=listing.property_type,
        amenities=listing.amenities,
        photos=[listing.image_url] if listing.image_url else [],
        tenure=listing.tenure,
        type="property",
        agent="real_estate",
    )

    # Add tenure-specific fields
    if listing.tenure == "short_term":
        card["min_stay_nights"] = listing.min_stay_nights
    else:
        card["min_lease_months"] = listing.min_lease_months
        if listing.available_from:
            card["available_from"] = listing.available_from.isoformat()

    return card
```

---

### Step 4: Policy - TENURE_DECIDE State

**File:** `assistant/agents/real_estate/policy.py`

**State Machine:**
```
SLOT_FILL → TENURE_DECIDE → SEARCH → SHOW_LISTINGS
                ↓
          ASK_CLARIFY (if ambiguous)
```

**Key Changes:**
```python
State = Literal[
    "SLOT_FILL",
    "TENURE_DECIDE",  # NEW
    "SEARCH",
    "RELAX",
    "SHOW_LISTINGS",
    "ANSWER_QA",
    "CLARIFY",
    "ERROR",
]


def execute_policy(request: AgentRequest) -> AgentResponse:
    state = initial_state()

    # Extract params from input
    state = slot_fill(request, state)

    # NEW: Decide tenure
    state = tenure_decide(state)

    if state["current_state"] == "CLARIFY":
        # Ask user for tenure clarification
        return build_clarification_response(state)

    # Search
    state = search(state)

    # ... rest of policy


def tenure_decide(state: PolicyState) -> PolicyState:
    """
    Decide tenure based on extracted params.

    If ambiguous, transition to CLARIFY with specific question.
    """
    params = state["params"]

    tenure_decision = infer_tenure(params)

    if tenure_decision["tenure"] == "ambiguous":
        state["current_state"] = "CLARIFY"
        state["clarification"] = {
            "prompt": "Is this a short stay (per night) or a monthly lease (per month)?",
            "options": [
                {"value": "short_term", "label": "Short stay (nightly)"},
                {"value": "long_term", "label": "Monthly lease"}
            ],
            "field": "tenure"
        }
        return state

    # Set tenure in params
    state["params"]["tenure"] = tenure_decision["tenure"]
    state["current_state"] = "SEARCH"

    return state
```

---

### Step 5: Metrics - Tenure Labels

**File:** `assistant/agents/real_estate/agent.py`

**Update Metrics:**
```python
# Add tenure label to all metrics
RE_REQUESTS_TOTAL.labels(intent=intent, tenure=tenure).inc()
RE_EXECUTION_SECONDS.labels(tenure=tenure).observe(elapsed)
RE_SEARCH_RESULTS.labels(tenure=tenure).observe(count)
RE_ERRORS_TOTAL.labels(error_type=error_type, tenure=tenure).inc()
```

**Grafana Queries:**
```promql
# Results by tenure
sum(rate(agent_re_search_results_count_bucket[5m])) by (tenure, le)

# Latency by tenure
histogram_quantile(0.95,
  sum(rate(agent_re_execution_duration_seconds_bucket[5m])) by (tenure, le)
)

# Error rate by tenure
rate(agent_re_errors_total[5m]) by (tenure, error_type)
```

---

### Step 6: Golden Frames for Both Tenures

**Short-Term Golden:**
```json
{
  "request": {
    "thread_id": "golden-st-001",
    "client_msg_id": "msg-001",
    "intent": "property_search",
    "input": "I need a 2 bedroom apartment in Kyrenia for 7 nights, check-in Dec 1st",
    "ctx": {
      "user_id": null,
      "locale": "en",
      "time": "2025-11-02T12:00:00Z"
    }
  },
  "expected_response": {
    "reply": "I found 3 properties for your 7-night stay:",
    "actions": [{
      "type": "show_listings",
      "params": {
        "listings": [{
          "tenure": "short_term",
          "price_unit": "per_night",
          "price": 120,
          "min_stay_nights": 3,
          ...
        }]
      }
    }]
  }
}
```

**Long-Term Golden:**
```json
{
  "request": {
    "thread_id": "golden-lt-001",
    "client_msg_id": "msg-001",
    "intent": "property_search",
    "input": "Looking for a 2 bedroom apartment in Kyrenia, move in early December, around £1500/month",
    "ctx": {
      "user_id": null,
      "locale": "en",
      "time": "2025-11-02T12:00:00Z"
    }
  },
  "expected_response": {
    "reply": "I found 2 long-term rentals matching your budget:",
    "actions": [{
      "type": "show_listings",
      "params": {
        "listings": [{
          "tenure": "long_term",
          "price_unit": "per_month",
          "price": 1500,
          "min_lease_months": 12,
          "available_from": "2025-11-15",
          ...
        }]
      }
    }]
  }
}
```

---

## Rollout Plan

### Phase 1: Schema Freeze (Day 1)
- [ ] Create `schema.py` with v1.1 TypedDict
- [ ] Create JSON schemas v1.1
- [ ] Add snapshot tests
- [ ] CI: Prevent v1.1 schema edits

### Phase 2: Django App (Days 2-3)
- [ ] Create `real_estate` app
- [ ] Write models with indexes
- [ ] Generate migration
- [ ] Write seed command
- [ ] Seed from fixtures → DB

### Phase 3: Tools Refactor (Day 4)
- [ ] Implement `infer_tenure()`
- [ ] Implement `search_listings_db()`
- [ ] Implement availability filtering
- [ ] Add feature flag `RE_AGENT_DB=off` (default fixtures)

### Phase 4: Policy Update (Day 5)
- [ ] Add TENURE_DECIDE state
- [ ] Implement clarification flow
- [ ] Add tenure to traces

### Phase 5: Metrics & Tests (Day 6)
- [ ] Add tenure labels to metrics
- [ ] Create golden frames (short + long)
- [ ] Write unit tests for tenure logic
- [ ] Write integration test with DB

### Phase 6: Staging (Week 2)
- [ ] Deploy with `RE_AGENT_DB=off`
- [ ] Enable for internal users
- [ ] Monitor metrics by tenure
- [ ] Dogfood: 5 short-term + 5 long-term searches

### Phase 7: Production (Week 3)
- [ ] Canary: `RE_AGENT_DB=on` for 10%
- [ ] Monitor: latency, error rate, result quality
- [ ] Full rollout after 48h stability

---

## Acceptance Criteria

### Functional
- [ ] Short-term search returns per-night pricing with dates
- [ ] Long-term search returns per-month pricing with move-in
- [ ] Ambiguous input triggers single clarification question
- [ ] Availability filtering works for short-term
- [ ] Move-in filtering works for long-term

### Performance
- [ ] p95 latency < 100ms (DB query)
- [ ] Result count within caps (max 25)
- [ ] Budget slack (+10%) applied correctly

### Observability
- [ ] All metrics labeled by tenure
- [ ] Grafana panels show tenure split
- [ ] Traces include tenure classification reason

### Safety
- [ ] Feature flag works (fixtures vs DB)
- [ ] No regressions in existing tests
- [ ] Schema v1.0 requests still work (backward compat)

---

## Files to Modify/Create

**New Files (8):**
1. `assistant/agents/real_estate/schema.py`
2. `real_estate/models.py`
3. `real_estate/migrations/0001_initial.py`
4. `real_estate/management/commands/seed_listings.py`
5. `schema/agent/real_estate/1.1/request.schema.json`
6. `schema/agent/real_estate/1.1/response.schema.json`
7. `tests/golden/agent/real_estate/short_term_search.json`
8. `tests/golden/agent/real_estate/long_term_search.json`

**Modified Files (3):**
1. `assistant/agents/real_estate/tools.py` - DB-backed search
2. `assistant/agents/real_estate/policy.py` - TENURE_DECIDE state
3. `assistant/agents/real_estate/agent.py` - Tenure metrics labels

---

## Next Commands

```bash
# 1. Create Django app
python3 manage.py startapp real_estate

# 2. Add to INSTALLED_APPS
# easy_islanders/settings/base.py:
# INSTALLED_APPS += ['real_estate']

# 3. Create models
# (Copy models.py from plan above)

# 4. Generate migration
python3 manage.py makemigrations real_estate

# 5. Run migration
python3 manage.py migrate real_estate

# 6. Seed data
python3 manage.py seed_listings

# 7. Test DB query
python3 manage.py shell
>>> from real_estate.models import Listing
>>> Listing.objects.filter(tenure='short_term').count()
```

---

**Status:** 📋 PLAN COMPLETE - Ready for implementation

**Estimated Time:** 6-7 days (schema → DB → tools → policy → tests → rollout)

**Risk:** LOW (feature-flagged, backward compatible, deterministic tools)
