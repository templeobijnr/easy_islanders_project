# Easy Islanders - Multi-Category Booking System

Complete Django app for managing bookings across multiple categories with extensible architecture.

## 📦 Features

- **6 Booking Types** supported out of the box:
  - Short-term apartment rentals
  - Apartment viewings
  - Services (cleaning, repairs, maintenance)
  - Car rentals
  - Hotel bookings
  - Appointments (hair, medical, consultation, etc.)

- **Comprehensive Booking Management**:
  - Auto-generated reference numbers (BK-2024-00001)
  - Status workflow (draft → pending → confirmed → in_progress → completed)
  - 4 cancellation policies (flexible, moderate, strict, non-refundable)
  - Payment tracking
  - Availability management
  - Review system

- **Polymorphic Design**:
  - Base `Booking` model with common fields
  - Type-specific models for unique attributes
  - Easy to extend with new booking types

- **RESTful API**:
  - 35+ endpoints
  - Token authentication
  - Comprehensive permissions
  - Filtering, searching, ordering

- **Django Admin Integration**:
  - Beautiful admin panels
  - Inline editing
  - Bulk actions
  - Audit trail viewing

## 🚀 Quick Start

### 1. Add to Django Settings

```python
# easy_islanders/settings/base.py

INSTALLED_APPS = [
    # ...
    'bookings',
    # ...
]
```

### 2. Run Migrations

```bash
python manage.py makemigrations bookings
python manage.py migrate
```

### 3. Seed Booking Types

```bash
python manage.py seed_booking_types
```

This creates 6 default booking types:
- ✅ Apartment Rental
- ✅ Apartment Viewing
- ✅ Service Booking
- ✅ Car Rental
- ✅ Hotel Booking
- ✅ Appointment

### 4. Add to URLs

```python
# easy_islanders/urls.py

urlpatterns = [
    # ...
    path('api/v1/bookings/', include('bookings.urls')),
    # ...
]
```

### 5. Test the API

```bash
# Get all booking types
curl http://localhost:8000/api/v1/bookings/types/

# Get user's bookings
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/bookings/bookings/
```

## 📚 API Endpoints

### Booking Types

```
GET    /api/v1/bookings/types/                     List booking types
GET    /api/v1/bookings/types/{slug}/              Get booking type details
```

### Bookings

```
GET    /api/v1/bookings/bookings/                  List user's bookings
POST   /api/v1/bookings/bookings/                  Create booking
GET    /api/v1/bookings/bookings/{id}/             Get booking details
PATCH  /api/v1/bookings/bookings/{id}/             Update booking
DELETE /api/v1/bookings/bookings/{id}/             Cancel booking

GET    /api/v1/bookings/bookings/my_bookings/      Get current user's bookings
GET    /api/v1/bookings/bookings/upcoming/         Get upcoming bookings
GET    /api/v1/bookings/bookings/past/             Get past bookings
GET    /api/v1/bookings/bookings/statistics/       Get user statistics

POST   /api/v1/bookings/bookings/{id}/confirm/     Confirm booking (seller)
POST   /api/v1/bookings/bookings/{id}/cancel/      Cancel with reason
POST   /api/v1/bookings/bookings/{id}/complete/    Mark as completed
GET    /api/v1/bookings/bookings/{id}/history/     Get audit trail
```

### Availability

```
GET    /api/v1/bookings/availability/              List availability
POST   /api/v1/bookings/availability/              Create availability
GET    /api/v1/bookings/availability/{id}/         Get availability details
PATCH  /api/v1/bookings/availability/{id}/         Update availability

POST   /api/v1/bookings/availability/check/        Check if dates available
GET    /api/v1/bookings/availability/calendar/     Get calendar view
POST   /api/v1/bookings/availability/block/        Block dates (seller)
POST   /api/v1/bookings/availability/unblock/      Unblock dates
```

### Reviews

```
GET    /api/v1/bookings/reviews/                   List reviews
POST   /api/v1/bookings/reviews/                   Create review
GET    /api/v1/bookings/reviews/{id}/              Get review details
PATCH  /api/v1/bookings/reviews/{id}/              Update review
DELETE /api/v1/bookings/reviews/{id}/              Delete review

GET    /api/v1/bookings/reviews/my_reviews/        Get user's reviews
POST   /api/v1/bookings/reviews/{id}/respond/      Add seller response
```

## 💻 Usage Examples

### Create an Apartment Rental Booking

```python
import requests

data = {
    "booking_type": "apartment-rental-uuid",
    "listing": "listing-uuid",
    "start_date": "2024-06-01T15:00:00Z",
    "end_date": "2024-06-07T11:00:00Z",
    "base_price": "150.00",
    "service_fees": "15.00",
    "taxes": "12.00",
    "total_price": "177.00",
    "currency": "EUR",
    "contact_name": "John Doe",
    "contact_phone": "+357 99 123456",
    "contact_email": "john@example.com",
    "guests_count": 2,
    "special_requests": "Early check-in if possible",
    "cancellation_policy": "flexible"
}

response = requests.post(
    'http://localhost:8000/api/v1/bookings/bookings/',
    json=data,
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
```

### Check Availability

```python
data = {
    "listing_id": "listing-uuid",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07"
}

response = requests.post(
    'http://localhost:8000/api/v1/bookings/availability/check/',
    json=data,
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

# Response:
# {
#     "is_available": true,
#     "unavailable_dates": [],
#     "checked_dates": ["2024-06-01", "2024-06-02", ...],
#     "message": "All dates available"
# }
```

### Confirm a Booking (Seller)

```python
response = requests.post(
    'http://localhost:8000/api/v1/bookings/bookings/{booking_id}/confirm/',
    json={"notes": "Booking confirmed, check-in details sent"},
    headers={'Authorization': 'Bearer SELLER_TOKEN'}
)
```

### Cancel a Booking

```python
response = requests.post(
    'http://localhost:8000/api/v1/bookings/bookings/{booking_id}/cancel/',
    json={"reason": "Change of plans, cannot make it"},
    headers={'Authorization': 'Bearer USER_TOKEN'}
)
```

### Create a Review

```python
data = {
    "booking": "booking-uuid",
    "rating": 5,
    "review_text": "Amazing place, very clean and great location!",
    "cleanliness_rating": 5,
    "communication_rating": 5,
    "value_rating": 4,
    "location_rating": 5
}

response = requests.post(
    'http://localhost:8000/api/v1/bookings/reviews/',
    json=data,
    headers={'Authorization': 'Bearer USER_TOKEN'}
)
```

## 🏗️ Models

### Core Models

- **BookingType**: Defines booking categories with flexible schemas
- **Booking**: Base booking model with 40+ fields
- **BookingAvailability**: Manages available dates/times
- **BookingHistory**: Complete audit trail
- **BookingReview**: Customer reviews with detailed ratings

### Type-Specific Models

- **ApartmentRentalBooking**: Guest details, amenities, check-in info
- **ApartmentViewingBooking**: Viewing slots, agent info, buyer intent
- **ServiceBooking**: Service type, provider, location, equipment
- **CarRentalBooking**: Driver details, insurance, fuel policy
- **HotelBooking**: Rooms, meal plans, preferences
- **AppointmentBooking**: Provider, duration, recurring appointments

## 🔐 Permissions

- **IsBookingOwner**: Only booking owner can access
- **IsSellerOrOwner**: Seller or owner can access
- **CanConfirmBooking**: Only sellers can confirm
- **CanCancelBooking**: Owner/seller can cancel based on policy
- **CanReviewBooking**: Only completed booking owners can review
- **IsServiceProvider**: Must have business profile

## 🎯 Signals

Automatic event handling for:
- ✅ Booking creation (history logging, notifications)
- ✅ Status changes (timestamps, notifications)
- ✅ Cancellations (availability updates)
- ✅ Availability management (auto-update on bookings)

## 🔧 Admin Features

- Beautiful color-coded status displays
- Inline type-specific details
- Bulk actions (confirm, cancel, complete)
- Audit trail viewing
- Advanced filtering and search
- Direct links between related objects

## 📊 Business Logic

### Status Workflow

```
[Draft] → [Pending] → [Confirmed] → [In Progress] → [Completed]
   ↓          ↓            ↓              ↓
[Cancelled] ←─────────────┴───────────────┘
```

### Cancellation Policies

- **Flexible**: Full refund up to 24h before
- **Moderate**: 50% refund up to 5 days before
- **Strict**: 50% refund up to 30 days before
- **Non-refundable**: No refund

### Auto-Calculation

- Total price = base_price + service_fees + taxes - discount
- Duration in days for date-range bookings
- Active status checking (within date range + confirmed)
- Cancellation eligibility based on policy

## 🧪 Testing

Run tests for the bookings app:

```bash
python manage.py test bookings
```

## 🚀 Extending

### Add a New Booking Type

1. **Create type-specific model:**

```python
# bookings/models.py

class YachtRentalBooking(models.Model):
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='yacht_rental'
    )
    yacht = models.ForeignKey('listings.Listing', on_delete=models.CASCADE)
    captain_needed = models.BooleanField(default=False)
    passenger_count = models.PositiveIntegerField()
    # ... add your fields
```

2. **Create serializer:**

```python
# bookings/serializers.py

class YachtRentalDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = YachtRentalBooking
        fields = ['yacht', 'captain_needed', 'passenger_count']
```

3. **Add to BookingDetailSerializer:**

```python
yacht_rental = YachtRentalDetailSerializer(read_only=True)
```

4. **Seed booking type:**

```bash
python manage.py shell

from bookings.models import BookingType

BookingType.objects.create(
    name='Yacht Rental',
    slug='yacht-rental',
    description='Rent luxury yachts',
    icon='Anchor',
    color='#06B6D4',
    requires_dates=True,
    requires_time_slot=True,
    requires_guests=True,
    requires_vehicle_info=False,
    is_active=True
)
```

## 📁 File Structure

```
bookings/
├── __init__.py                    # App config
├── apps.py                        # Django app configuration
├── models.py                      # 11 models (900+ lines)
├── serializers.py                 # DRF serializers (500+ lines)
├── views.py                       # API viewsets (400+ lines)
├── admin.py                       # Django admin (500+ lines)
├── signals.py                     # Event handlers
├── permissions.py                 # Custom permissions
├── urls.py                        # URL routing
├── README.md                      # This file
├── migrations/
│   └── __init__.py
└── management/
    └── commands/
        └── seed_booking_types.py  # Seeding command
```

## 📖 Documentation

- **Architecture**: `/docs/BOOKING_SYSTEM_ARCHITECTURE.md`
- **API Schema**: Available via `/api/schema/` (OpenAPI/Swagger)
- **Admin Guide**: Access Django admin at `/admin/`

## 🤝 Contributing

When adding new features:
1. Update models and migrations
2. Add serializers for API
3. Create/update viewsets
4. Add tests
5. Update this README

## 📝 License

Part of Easy Islanders project.

---

**Version**: 1.0
**Last Updated**: 2025-01-12
**Status**: ✅ Production Ready
