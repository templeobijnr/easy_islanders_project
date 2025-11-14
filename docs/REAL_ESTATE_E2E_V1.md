# Real Estate E2E Golden Flows — RecItem v1

**Status**: ✅ Implemented
**Version**: 1.0.0
**Last Updated**: 2025-11-14

---

## Overview

This document defines the two **golden flows** for the RecItem v1 real estate booking vertical slice. These flows are the canonical end-to-end journeys that must work correctly for the RecItem v1 contract to be considered production-ready.

**Golden Flows**:
1. **Beach Search Flow** - General property search using RecommendationCard
2. **Daily Rental Booking Flow** - Short-term rental with availability check and booking using ShortTermRecommendationCard

---

## Flow 1: Beach Search Flow (General RecItem Card)

### User Journey

```
User: "Show me properties near the beach in Kyrenia"
  ↓
AI Agent: Intent classification → real_estate_agent
  ↓
AI Agent: Slot filling (location: Kyrenia, amenity: beach proximity)
  ↓
Backend Search: Query vw_listings_search for listings
  ↓
format_v1_listing_for_card(): Transform DB results → RecItem[]
  ↓
WebSocket: Send message.recommendations = RecItem[]
  ↓
Frontend: Render RecommendationCard for each item
  ↓
User: Views property cards with images, prices, badges
```

### Technical Flow

#### 1. Chat Message Submission

**Frontend** ([ShortTermRecommendationCard.tsx](../frontend/src/features/chat/components/ShortTermRecommendationCard.tsx))
```typescript
// User sends message via Composer
const handleSend = (message: string) => {
  sendMessage({
    text: message,
    conversationId: activeConversationId,
  });
};
```

**API Request**:
```http
POST /api/chat/
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Show me properties near the beach in Kyrenia",
  "conversation_id": "conv-123",
  "language": "en"
}
```

#### 2. Intent Classification

**Backend** ([router_service/pipeline.py](../router_service/pipeline.py))
```python
# Router classifies intent → domain: real_estate
{
  "domain": "real_estate",
  "confidence": 0.95,
  "calibrated_confidence": 0.92,
  "policy_action": "route"
}
```

#### 3. Agent Slot Filling

**Backend** ([assistant/agents/real_estate/](../assistant/agents/real_estate/))
```python
# Agent extracts slots from user message
slots = {
  "location": "Kyrenia",
  "amenities": ["beach proximity"],
  "listing_type": None,  # Will default to all types
}
```

#### 4. Backend Search Query

**Backend** ([assistant/domain/real_estate_search_v1.py](../assistant/domain/real_estate_search_v1.py))
```python
# Search v1 API with inferred slots
response = requests.get(
    "http://127.0.0.1:8000/api/v1/real_estate/listings/search/",
    params={
        "city": "Kyrenia",
        "listing_type": None,  # All types
        "limit": 5,
    },
    timeout=SEARCH_TIMEOUT_SECONDS,
)
```

**SQL Query** (vw_listings_search):
```sql
SELECT
    listing_id,
    title,
    city,
    area,
    base_price,
    currency,
    price_period,
    listing_type_code,
    bedrooms,
    bathrooms,
    has_wifi,
    has_kitchen,
    has_parking,
    ...
FROM vw_listings_search
WHERE city = 'Kyrenia'
  AND status = 'ACTIVE'
LIMIT 5;
```

#### 5. Card Formatting

**Backend** ([assistant/domain/real_estate_search_v1.py:349-508](../assistant/domain/real_estate_search_v1.py))
```python
def format_v1_listing_for_card(listing: Dict[str, Any]) -> Dict[str, Any]:
    """Transform DB result → RecItem."""

    # Map listing_type_code → rent_type
    rent_type = rent_type_map.get(listing["listing_type_code"], "long_term")

    # Generate badges (max 6)
    badges = ["WiFi", "Kitchen", "Pool", "Sea View", "Parking", "Furnished"][:6]

    # Build RecItem
    return {
        "id": "123",
        "title": "2+1 Sea View Apartment",
        "subtitle": "Kyrenia, Catalkoy",
        "price": "£750 / month",
        "imageUrl": "https://...",
        "area": "Catalkoy",
        "badges": badges,
        "galleryImages": ["https://..."],
        "metadata": {
            "bedrooms": 2,
            "bathrooms": 1,
            "sqm": 85,
            "description": "Beautiful apartment...",
            "amenities": ["WiFi", "Kitchen", "Pool", ...],
            "rent_type": "long_term",
        },
    }
```

**Metrics Recorded**:
```python
record_card_generated(rent_type="long_term", has_image=True)
```

**Logs**:
```
[INFO] [format_v1_listing_for_card] Card generated successfully:
       listing_id=123, rent_type=long_term, badges_count=6, amenities_count=12
```

#### 6. WebSocket Message

**Backend** (WebSocket emit)
```json
{
  "type": "chat_message",
  "event": "assistant_message",
  "payload": {
    "text": "I found 3 properties near the beach in Kyrenia.",
    "rich": {
      "recommendations": [
        {
          "id": "123",
          "title": "2+1 Sea View Apartment",
          "subtitle": "Kyrenia, Catalkoy",
          "price": "£750 / month",
          "imageUrl": "https://...",
          "area": "Catalkoy",
          "badges": ["WiFi", "Kitchen", "Pool", "Sea View"],
          "galleryImages": ["https://..."],
          "metadata": {
            "bedrooms": 2,
            "bathrooms": 1,
            "sqm": 85,
            "description": "Beautiful apartment...",
            "amenities": ["WiFi", "Kitchen", "Pool", "Sea View", "Parking"],
            "rent_type": "long_term"
          }
        }
      ]
    },
    "agent": "real_estate"
  }
}
```

#### 7. Frontend Rendering

**Frontend** ([frontend/src/features/chat/components/RecommendationCard.tsx](../frontend/src/features/chat/components/RecommendationCard.tsx))
```tsx
// Component selection based on rent_type
{message.recommendations?.map((item) =>
  item.metadata?.rent_type === 'daily' ? (
    <ShortTermRecommendationCard key={item.id} item={item} />
  ) : (
    <RecommendationCard key={item.id} item={item} />
  )
)}
```

**RecommendationCard Display**:
- Hero image from `item.imageUrl`
- Title: `item.title`
- Subtitle: `item.subtitle`
- Price badge: `item.price`
- Area + rating: `item.area`
- Badge chips: `item.badges` (max 6)
- Quick actions: Photos, Info, Check

### Expected Behavior

✅ **User sees**:
- 3 property cards rendered
- Each card shows: image, title, location, price, badges
- "Photos" button opens gallery (`item.galleryImages`)
- "Info" button shows metadata (bedrooms, bathrooms, sqm, description, amenities)
- "Check" button navigates to property detail page

✅ **Metrics recorded**:
- `re_cards_generated_total{rent_type="long_term"}` incremented by 3
- `re_backend_search_ms` histogram updated

✅ **Logs**:
```
[INFO] [format_v1_listing_for_card] Card generated successfully: listing_id=123, rent_type=long_term
[INFO] [format_v1_listing_for_card] Card generated successfully: listing_id=124, rent_type=sale
[INFO] [format_v1_listing_for_card] Card generated successfully: listing_id=125, rent_type=long_term
```

---

## Flow 2: Daily Rental Booking Flow (ShortTermRecommendationCard)

### User Journey

```
User: "I need a place to stay in Catalkoy for 5 nights next month"
  ↓
AI Agent: Slot filling (location: Catalkoy, listing_type: daily rental, nights: 5)
  ↓
Backend Search: Query vw_listings_search for DAILY_RENTAL listings
  ↓
format_v1_listing_for_card(): Transform → RecItem[] with rent_type: "daily"
  ↓
WebSocket: Send RecItem[] with metadata.rent_type = "daily"
  ↓
Frontend: Render ShortTermRecommendationCard (enhanced card)
  ↓
User: Selects dates in date picker
  ↓
Frontend: POST /api/v1/real_estate/availability/check/
  ↓
Backend: Check overlapping tenancies → available: true
  ↓
User: Clicks "Book Now"
  ↓
Frontend: POST /api/v1/real_estate/bookings/
  ↓
Backend: Create Tenancy record with status=PENDING
  ↓
Frontend: Show success toast "Booking created! Awaiting confirmation."
```

### Technical Flow

#### 1. Chat Message → Agent Classification

**Same as Flow 1**, but with different slot extraction:

```python
slots = {
  "location": "Catalkoy",
  "listing_type": "DAILY_RENTAL",
  "nights": 5,
  "check_in": None,  # Inferred or asked later
  "check_out": None,
}
```

#### 2. Backend Search (Daily Rentals Only)

**API Request**:
```http
GET /api/v1/real_estate/listings/search/?city=Catalkoy&listing_type=DAILY_RENTAL&limit=5
```

**SQL Query**:
```sql
SELECT * FROM vw_listings_search
WHERE city = 'Catalkoy'
  AND listing_type_code = 'DAILY_RENTAL'
  AND status = 'ACTIVE'
LIMIT 5;
```

#### 3. Card Formatting (Daily Rental)

**Backend** ([format_v1_listing_for_card](../assistant/domain/real_estate_search_v1.py:349-508))
```python
# For DAILY_RENTAL listings
rec_item = {
    "id": "456",
    "title": "Beachfront Studio",
    "subtitle": "Catalkoy, Kyrenia",
    "price": "€120 / night",  # Note: " / night" suffix
    "imageUrl": "https://...",
    "area": "Catalkoy",
    "badges": ["WiFi", "Kitchen", "Sea View", "Balcony"],
    "galleryImages": ["https://..."],
    "metadata": {
        "bedrooms": 1,
        "bathrooms": 1,
        "sqm": 45,
        "description": "Cozy beachfront studio...",
        "amenities": ["WiFi", "Kitchen", "Sea View", "Balcony", "Air Conditioning"],
        "rent_type": "daily",  # ← Key field for component selection
    },
}
```

**Metrics Recorded**:
```python
record_card_generated(rent_type="daily", has_image=True)
```

#### 4. Frontend Component Selection

**Frontend** ([ChatPane.tsx](../frontend/src/features/chat/components/ChatPane.tsx))
```tsx
// Conditional rendering based on metadata.rent_type
{message.recommendations?.map((item) =>
  item.metadata?.rent_type === 'daily' ? (
    <ShortTermRecommendationCard key={item.id} item={item} />  // ← Enhanced card
  ) : (
    <RecommendationCard key={item.id} item={item} />
  )
)}
```

#### 5. User Selects Dates

**Frontend** ([ShortTermRecommendationCard.tsx](../frontend/src/features/chat/components/ShortTermRecommendationCard.tsx))
```tsx
// User clicks date picker and selects range
const [dateRange, setDateRange] = useState<DateRange | undefined>();

<Calendar
  mode="range"
  selected={dateRange}
  onSelect={setDateRange}
  disabled={{ before: new Date() }}
/>
```

**State**:
```typescript
dateRange = {
  from: new Date('2025-08-01'),
  to: new Date('2025-08-06'),
}
```

#### 6. Availability Check

**Frontend** ([ShortTermRecommendationCard.tsx:checkAvailability](../frontend/src/features/chat/components/ShortTermRecommendationCard.tsx))
```typescript
const checkAvailability = async () => {
  const response = await axios.post('/api/v1/real_estate/availability/check/', {
    listing_id: item.id,
    check_in: format(dateRange.from, 'yyyy-MM-dd'),
    check_out: format(dateRange.to, 'yyyy-MM-dd'),
  });

  setAvailabilityStatus(response.data.available ? 'available' : 'unavailable');
};
```

**API Request**:
```http
POST /api/v1/real_estate/availability/check/
Content-Type: application/json
Authorization: Bearer <token>

{
  "listing_id": "456",
  "check_in": "2025-08-01",
  "check_out": "2025-08-06"
}
```

**Backend** ([AvailabilityCheckView](../real_estate/api/booking_views.py:40-154))
```python
def post(self, request):
    listing = Listing.objects.get(id=listing_id)

    # Check for overlapping tenancies
    overlapping = Tenancy.objects.filter(
        listing=listing,
        start_date__lte=check_out,
        end_date__gte=check_in,
        status__in=['PENDING', 'ACTIVE']
    ).exists()

    if overlapping:
        record_availability_check(result='unavailable')
        return Response({'available': False, 'message': 'Not available'})

    record_availability_check(result='available')
    return Response({'available': True, 'message': 'Available for selected dates'})
```

**Metrics Recorded**:
```python
record_availability_check(result='available')
```

**Logs**:
```
[INFO] [AvailabilityCheck] Available: listing_id=456, dates=with_dates
```

**API Response**:
```json
{
  "available": true,
  "message": "Property is available for selected dates"
}
```

#### 7. User Clicks "Book Now"

**Frontend** ([ShortTermRecommendationCard.tsx:handleBookNow](../frontend/src/features/chat/components/ShortTermRecommendationCard.tsx))
```typescript
const handleBookNow = async () => {
  const response = await axios.post('/api/v1/real_estate/bookings/', {
    listing_id: item.id,
    check_in: format(dateRange.from, 'yyyy-MM-dd'),
    check_out: format(dateRange.to, 'yyyy-MM-dd'),
  });

  // Show success toast
  setBookingStatus('success');
  toast({
    title: 'Booking Created!',
    description: response.data.message,
  });
};
```

**API Request**:
```http
POST /api/v1/real_estate/bookings/
Content-Type: application/json
Authorization: Bearer <token>

{
  "listing_id": "456",
  "check_in": "2025-08-01",
  "check_out": "2025-08-06"
}
```

**Backend** ([BookingCreateView](../real_estate/api/booking_views.py:183-315))
```python
def post(self, request):
    listing = Listing.objects.select_related('property').get(id=listing_id)

    # Atomic transaction
    with transaction.atomic():
        # Double-check availability
        overlapping = Tenancy.objects.filter(
            listing=listing,
            start_date__lte=check_out,
            end_date__gte=check_in,
            status__in=['PENDING', 'ACTIVE']
        ).exists()

        if overlapping:
            record_booking_request(result='conflict', rent_type='daily')
            return Response({'error': 'No longer available'}, status=409)

        # Create tenancy
        tenancy = Tenancy.objects.create(
            property=listing.property,
            listing=listing,
            tenant=request.user,
            tenancy_kind='DAILY',
            start_date=check_in,
            end_date=check_out,
            rent_amount=listing.base_price,
            rent_currency=listing.currency,
            status='PENDING',
        )

        record_booking_request(result='success', rent_type='daily')
        return Response({
            'id': tenancy.id,
            'status': 'PENDING',
            'listing_id': '456',
            'check_in': '2025-08-01',
            'check_out': '2025-08-06',
            'nights': 5,
            'rent_amount': '600.00',
            'currency': 'EUR',
            'message': 'Booking created successfully. Awaiting confirmation.',
        }, status=201)
```

**Metrics Recorded**:
```python
record_booking_request(result='success', rent_type='daily')
```

**Logs**:
```
[INFO] [BookingCreate] Booking created successfully: tenancy_id=789, listing_id=456,
       rent_type=daily, nights=5, user=john@example.com
```

**API Response**:
```json
{
  "id": 789,
  "status": "PENDING",
  "listing_id": "456",
  "check_in": "2025-08-01",
  "check_out": "2025-08-06",
  "nights": 5,
  "rent_amount": "600.00",
  "currency": "EUR",
  "message": "Booking created successfully. Awaiting confirmation."
}
```

#### 8. Frontend Success State

**Frontend**:
```tsx
// Success toast displayed
<Toast>
  <ToastTitle>Booking Created!</ToastTitle>
  <ToastDescription>
    Booking created successfully. Awaiting confirmation.
  </ToastDescription>
</Toast>

// Card shows booking confirmation
<div className="booking-success">
  <CheckCircle className="text-green-500" />
  <p>Booking #{tenancy.id} created</p>
  <p>Check-in: Aug 1, 2025</p>
  <p>Check-out: Aug 6, 2025</p>
  <p>Total: €600.00 (5 nights)</p>
</div>
```

### Expected Behavior

✅ **User sees**:
- Enhanced ShortTermRecommendationCard with date picker
- Date picker disabled for past dates
- "Check Availability" button becomes enabled when dates selected
- Availability status badge: "Available" (green) or "Unavailable" (red)
- "Book Now" button enabled only when property is available
- Success toast after booking creation
- Booking confirmation details (ID, dates, total)

✅ **Metrics recorded**:
- `re_cards_generated_total{rent_type="daily"}` = 1
- `re_availability_checks_total{result="available"}` = 1
- `re_booking_requests_total{result="success", rent_type="daily"}` = 1

✅ **Database state**:
```sql
-- New Tenancy record created
SELECT * FROM real_estate_tenancy WHERE id = 789;

id  | property_id | listing_id | tenant_id | tenancy_kind | start_date | end_date   | status  | rent_amount
----|-------------|------------|-----------|--------------|------------|------------|---------|------------
789 | 101         | 456        | 42        | DAILY        | 2025-08-01 | 2025-08-06 | PENDING | 600.00
```

✅ **Logs**:
```
[INFO] [format_v1_listing_for_card] Card generated successfully: listing_id=456, rent_type=daily
[INFO] [AvailabilityCheck] Request: listing_id=456, check_in=2025-08-01, check_out=2025-08-06
[INFO] [AvailabilityCheck] Available: listing_id=456, dates=with_dates
[INFO] [BookingCreate] Request: listing_id=456, check_in=2025-08-01, check_out=2025-08-06, user=john@example.com
[INFO] [BookingCreate] Booking created successfully: tenancy_id=789, listing_id=456, rent_type=daily, nights=5
```

---

## Error Scenarios

### Scenario 1: Double Booking Attempt

**User Action**: User A and User B try to book the same dates simultaneously

**Expected Behavior**:
1. User A submits booking → Creates Tenancy (status=PENDING)
2. User B submits booking → Receives 409 Conflict
3. User B sees error toast: "Property is no longer available for selected dates"

**Metrics**:
```python
record_booking_request(result='success', rent_type='daily')  # User A
record_booking_request(result='conflict', rent_type='daily')  # User B
```

**Logs**:
```
[INFO] [BookingCreate] Booking created successfully: tenancy_id=789, user=user_a@example.com
[WARN] [BookingCreate] Double booking conflict: listing_id=456, check_in=2025-08-01, user=user_b@example.com
```

### Scenario 2: Card Generated Without Image

**Condition**: `listing.hero_image_url = NULL`

**Expected Behavior**:
- Card still renders with placeholder image
- Warning logged
- Metric incremented

**Metrics**:
```python
record_card_generated(rent_type='daily', has_image=False)
# re_cards_without_images_total{rent_type="daily"} += 1
```

**Logs**:
```
[WARN] [format_v1_listing_for_card] Card generated without image: listing_id=456, rent_type=daily
```

### Scenario 3: Unavailable Listing Status

**Condition**: `listing.status = 'INACTIVE'`

**Expected Behavior**:
1. Availability check returns `available: false`
2. "Book Now" button remains disabled
3. User sees badge: "Unavailable"

**Metrics**:
```python
record_availability_check(result='unavailable')
```

**Logs**:
```
[INFO] [AvailabilityCheck] Unavailable due to status: listing_id=456, status=INACTIVE
```

---

## Validation Checklist

### Pre-Deployment Validation

Before deploying RecItem v1 to production, verify:

- [ ] **Flow 1: Beach Search**
  - [ ] AI agent correctly classifies intent as `real_estate`
  - [ ] Backend search returns results from vw_listings_search
  - [ ] All listings formatted as valid RecItem objects
  - [ ] RecommendationCard renders with all fields (title, price, badges, image)
  - [ ] "Photos" button opens gallery with `item.galleryImages`
  - [ ] "Info" modal shows metadata (bedrooms, bathrooms, amenities)

- [ ] **Flow 2: Daily Rental Booking**
  - [ ] ShortTermRecommendationCard renders for `rent_type === 'daily'`
  - [ ] Date picker allows future date selection only
  - [ ] "Check Availability" button calls `/api/v1/real_estate/availability/check/`
  - [ ] Availability status badge updates correctly (green/red)
  - [ ] "Book Now" button calls `/api/v1/real_estate/bookings/`
  - [ ] Tenancy record created with status=PENDING
  - [ ] Success toast displays booking confirmation
  - [ ] Double booking attempt rejected with 409 Conflict

- [ ] **Metrics & Logging**
  - [ ] `re_cards_generated_total{rent_type}` increments correctly
  - [ ] `re_cards_without_images_total{rent_type}` increments for listings without images
  - [ ] `re_availability_checks_total{result}` tracks available/unavailable/error
  - [ ] `re_booking_requests_total{result, rent_type}` tracks success/conflict/error
  - [ ] All log statements appear at correct levels (INFO/WARN/ERROR)

- [ ] **Error Handling**
  - [ ] Invalid date format returns 400 with clear error message
  - [ ] Listing not found returns 404
  - [ ] Double booking returns 409 Conflict
  - [ ] Unauthenticated requests return 401

---

## Performance Benchmarks

### Target Latencies (P95)

| Operation | Target P95 | Notes |
|-----------|------------|-------|
| Backend search query | < 200ms | vw_listings_search indexed on city, listing_type |
| format_v1_listing_for_card | < 10ms | Pure Python dict transformation |
| Availability check | < 100ms | Simple Tenancy overlap query |
| Booking creation | < 150ms | Atomic transaction with 1 SELECT + 1 INSERT |
| End-to-end (chat → cards) | < 2s | Includes AI inference + search + formatting |

### Metrics to Monitor

```promql
# Card generation rate
rate(re_cards_generated_total[5m])

# Card generation without images (should be low)
rate(re_cards_without_images_total[5m]) / rate(re_cards_generated_total[5m])

# Availability check success rate
rate(re_availability_checks_total{result="available"}[5m]) / rate(re_availability_checks_total[5m])

# Booking success rate (should be > 90% if availability check works correctly)
rate(re_booking_requests_total{result="success"}[5m]) / rate(re_booking_requests_total[5m])

# Booking conflict rate (indicates double booking attempts)
rate(re_booking_requests_total{result="conflict"}[5m])
```

---

## Known Limitations (RecItem v1)

1. **Image Storage**: `imageUrl` and `galleryImages` are placeholders (TODO in v1)
2. **Contact Info**: `metadata.contactInfo` not wired up yet (TODO in v1)
3. **Rating System**: `rating` field not implemented (always null in v1)
4. **Distance Calculation**: `distanceMins` field not implemented (always null in v1)
5. **Real-time Updates**: Availability not pushed via WebSocket (requires manual check)

---

## Next Steps (Post-v1)

### Phase 2 Enhancements
- [ ] Image storage integration (S3/CloudFlare) for `imageUrl` and `galleryImages`
- [ ] Contact info wiring (`metadata.contactInfo.phone`, `metadata.contactInfo.email`)
- [ ] Rating system implementation (aggregate from reviews)
- [ ] Distance calculation (user location → property GPS coordinates)

### Phase 3 Real-Time Features
- [ ] WebSocket availability updates (notify when property becomes available)
- [ ] Price optimization suggestions (based on demand/seasonality)
- [ ] Similar properties recommendations (based on viewed/booked history)
- [ ] Saved searches and alerts (notify when new listings match criteria)

---

## References

- [RecItem Contract](./RECITEM_CONTRACT.md)
- [Real Estate Data Model](./REAL_ESTATE_DATA_MODEL.md)
- [API Contracts](./API_CONTRACTS.md)
- [Backend Tests](../assistant/agents/real_estate/tests/test_format_v1_listing_for_card.py)
- [Booking API Tests](../real_estate/tests/test_booking_views.py)

---

**Maintained by**: Development Team
**Questions**: See [RECITEM_CONTRACT.md](./RECITEM_CONTRACT.md) or CLAUDE.md
