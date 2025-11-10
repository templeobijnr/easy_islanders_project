# Short-Term & Long-Term Booking System

## Overview

A complete booking system supporting both **short-term** (vacation rentals) and **long-term** (rental agreements) bookings, fully integrated with the Easy Islanders platform.

## Features

✅ **Dual Booking Types**
- Short-term: Date-specific bookings with availability checking
- Long-term: Reservation-based bookings without strict dates

✅ **Availability Management**
- Automatic overlap detection for short-term bookings
- Real-time availability API
- Conflict reporting with detailed information

✅ **Beautiful UI**
- `ShortTermRecommendationCard` with calendar date picker
- Image gallery modal
- Info modal with amenities and contact details
- Smooth animations with Framer Motion

✅ **Complete Backend**
- Django REST Framework API endpoints
- UUID-based booking IDs
- Status workflow (pending → confirmed → completed/cancelled)
- Webhook support for payment/Twilio integration

## Architecture

### Frontend Components

#### ShortTermRecommendationCard (`frontend/src/features/chat/components/ShortTermRecommendationCard.tsx`)

Premium booking card with:
- **Image Preview**: Click to open gallery
- **Date Selection**: Calendar picker with availability checking
- **Info Modal**: Full property details, amenities, contact info
- **Book Now**: Instant booking flow with validation

**Props:**
```typescript
interface ShortTermRecommendationCardProps {
  item: {
    id: string | number;
    title: string;
    description?: string;
    area?: string;
    location?: string;
    price: string;
    imageUrl?: string;
    photos?: string[];
    amenities?: string[];
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  };
}
```

**Usage:**
```tsx
import { ShortTermRecommendationCard } from '@/features/chat/components/ShortTermRecommendationCard';

<ShortTermRecommendationCard
  item={{
    id: "listing-uuid",
    title: "Luxury Villa",
    price: "€500/night",
    area: "Kyrenia",
    imageUrl: "/images/villa.jpg",
    photos: ["/img1.jpg", "/img2.jpg"],
    amenities: ["Pool", "WiFi", "Kitchen"],
    contactInfo: { phone: "+90...", email: "..." }
  }}
/>
```

#### UI Components Used
- `Calendar` from shadcn/ui (date range picker)
- `Dialog` for modals
- `Button` with premium variants
- `Badge` for status and pricing
- `Card` for layout

### Backend API

#### Models (`listings/models.py`)

**Booking Model:**
```python
class Booking(models.Model):
    id = UUIDField(primary_key=True)
    user = ForeignKey(User)
    listing = ForeignKey(Listing)
    booking_type = CharField  # 'short_term' | 'long_term'
    check_in = DateField(null=True, blank=True)
    check_out = DateField(null=True, blank=True)
    total_price = DecimalField(null=True, blank=True)
    currency = CharField(default='EUR')
    status = CharField  # 'pending' | 'confirmed' | 'cancelled' | 'completed'
    notes = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Properties:**
- `is_short_term` / `is_long_term` - Booking type checks
- `duration_days` - Calculated booking duration

**Validation:**
- Check-out must be after check-in
- Short-term bookings require dates
- Date overlap detection

#### API Endpoints

##### 1. Create Short-Term Booking

```http
POST /api/shortterm/bookings/
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": "uuid",
  "check_in": "2025-12-01",
  "check_out": "2025-12-10"
}
```

**Response (201):**
```json
{
  "id": "booking-uuid",
  "listing": "listing-uuid",
  "listing_title": "Luxury Villa",
  "booking_type": "short_term",
  "check_in": "2025-12-01",
  "check_out": "2025-12-10",
  "status": "pending",
  "duration_days": 9,
  "created_at": "2025-11-10T15:00:00Z"
}
```

**Error (400):**
```json
{
  "error": "Selected dates are not available for this listing."
}
```

##### 2. Check Availability

```http
POST /api/shortterm/check-availability/
Content-Type: application/json

{
  "listing_id": "uuid",
  "check_in": "2025-12-01",
  "check_out": "2025-12-10"
}
```

**Response:**
```json
{
  "available": false,
  "conflicts": [
    {
      "id": "conflict-booking-uuid",
      "check_in": "2025-12-05",
      "check_out": "2025-12-15",
      "status": "confirmed"
    }
  ]
}
```

##### 3. Create Long-Term Booking

```http
POST /api/longterm/bookings/
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": "uuid",
  "notes": "Interested in 12-month rental"
}
```

**Response (201):**
```json
{
  "id": "booking-uuid",
  "listing": "listing-uuid",
  "listing_title": "Modern Apartment",
  "booking_type": "long_term",
  "status": "pending",
  "notes": "Interested in 12-month rental",
  "created_at": "2025-11-10T15:00:00Z"
}
```

##### 4. Get User Bookings

```http
GET /api/bookings/my-bookings/
Authorization: Bearer <token>

Query Params (optional):
  - booking_type: short_term | long_term
  - status: pending | confirmed | cancelled | completed
```

**Response:**
```json
[
  {
    "id": "uuid",
    "listing": "uuid",
    "listing_title": "Luxury Villa",
    "booking_type": "short_term",
    "check_in": "2025-12-01",
    "check_out": "2025-12-10",
    "status": "confirmed",
    "duration_days": 9
  }
]
```

##### 5. Booking Status Webhook

```http
POST /api/bookings/status-webhook/
Content-Type: application/json

{
  "booking_id": "uuid",
  "status": "confirmed"
}
```

Used by payment processors or Twilio agents to update booking status.

## Integration Guide

### 1. Frontend Integration

Add to your chat component when agent sends recommendations:

```typescript
import { ShortTermRecommendationCard } from '@/features/chat/components/ShortTermRecommendationCard';

function RecommendationsDisplay({ recommendations }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map(rec => {
        if (rec.booking_type === 'short_term') {
          return (
            <ShortTermRecommendationCard
              key={rec.id}
              item={rec}
            />
          );
        }
        // Use LongTermRecommendationCard for long-term bookings
        return <LongTermRecommendationCard key={rec.id} item={rec} />;
      })}
    </div>
  );
}
```

### 2. Backend Integration

#### Run Migrations

```bash
python3 manage.py makemigrations listings
python3 manage.py migrate listings
```

#### Agent Integration

When your AI agent generates recommendations, include booking type:

```python
recommendations = [
    {
        "id": str(listing.id),
        "title": listing.title,
        "description": listing.description,
        "price": f"€{listing.price}/night",
        "booking_type": "short_term",  # or "long_term"
        "imageUrl": listing.images.first().image.url if listing.images.exists() else None,
        "photos": [img.image.url for img in listing.images.all()],
        "amenities": listing.dynamic_fields.get("amenities", []),
        "location": listing.location,
        "contactInfo": {
            "phone": "+90...",
            "email": "..."
        }
    }
]
```

### 3. Webhook Integration (Optional)

For payment confirmation or Twilio agent callbacks:

```python
import requests

# After payment is confirmed
response = requests.post(
    'https://your-domain.com/api/bookings/status-webhook/',
    json={
        'booking_id': 'uuid',
        'status': 'confirmed'
    }
)
```

## Database Schema

```sql
CREATE TABLE listings_booking (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    listing_id UUID REFERENCES listings_listing(id),
    booking_type VARCHAR(20),
    check_in DATE NULL,
    check_out DATE NULL,
    total_price DECIMAL(10, 2) NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_booking_user_status ON listings_booking(user_id, status);
CREATE INDEX idx_booking_listing_type ON listings_booking(listing_id, booking_type, status);
CREATE INDEX idx_booking_dates ON listings_booking(check_in, check_out);
```

## Admin Interface

Access at `/admin/listings/booking/` to:
- View all bookings
- Filter by type, status, dates
- Update booking status
- View booking duration and pricing
- Search by user or listing

## Error Handling

### Frontend

```typescript
try {
  const response = await axios.post('/api/shortterm/bookings/', data);
  // Success
} catch (err: any) {
  if (err.response?.status === 400) {
    alert(err.response.data.error); // "Dates not available"
  } else if (err.response?.status === 401) {
    // Redirect to login
  } else {
    alert('Booking failed. Please try again.');
  }
}
```

### Backend

All endpoints return standardized error responses:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- `200/201` - Success
- `400` - Bad request (missing fields, invalid data, unavailable dates)
- `401` - Unauthorized (missing/invalid token)
- `404` - Resource not found
- `500` - Server error

## Testing

### Manual Testing

1. **Test Short-Term Booking:**
```bash
curl -X POST http://localhost:8000/api/shortterm/bookings/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "your-listing-uuid",
    "check_in": "2025-12-01",
    "check_out": "2025-12-10"
  }'
```

2. **Test Availability:**
```bash
curl -X POST http://localhost:8000/api/shortterm/check-availability/ \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "your-listing-uuid",
    "check_in": "2025-12-01",
    "check_out": "2025-12-10"
  }'
```

### Frontend Testing

```bash
cd frontend
npm start
# Navigate to your chat/recommendations page
```

## Deployment Checklist

- [ ] Run database migrations
- [ ] Configure CORS for frontend domain
- [ ] Set up JWT authentication
- [ ] Configure media file serving for images
- [ ] Set up webhook URLs for payment processor
- [ ] Configure email notifications (optional)
- [ ] Set up monitoring for booking errors
- [ ] Test availability checking under load

## Future Enhancements

- **Payment Integration**: Stripe/PayPal checkout flow
- **Calendar View**: Full calendar display of bookings
- **Automatic Pricing**: Dynamic pricing based on season/demand
- **Booking Modifications**: Allow users to modify existing bookings
- **Cancellation Policies**: Flexible cancellation rules
- **Reviews & Ratings**: Post-booking review system
- **Email Notifications**: Booking confirmations and reminders
- **SMS Integration**: Twilio-based booking confirmations
- **Multi-currency**: Support for multiple currencies with conversion

## Support

For issues or questions:
1. Check the Django admin at `/admin/listings/booking/`
2. Review API logs for error details
3. Test availability endpoint independently
4. Verify JWT token is valid and not expired

---

**Last Updated**: 2025-11-10
**Version**: 1.0
