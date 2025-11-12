# Multi-Category Booking System Architecture
## Easy Islanders - Comprehensive Booking System

---

## 📋 Executive Summary

This document outlines the architecture for a scalable, multi-category booking system that supports:
- **Short-term apartment rentals**
- **Apartment viewings**
- **Services** (cleaning, repairs, maintenance)
- **Car rentals**
- **Hotel bookings**
- **Appointments** (hair, consultation, medical, etc.)

### Key Design Principles:
1. **Polymorphic base model** for common booking attributes
2. **Type-specific models** for category-unique attributes
3. **Signals and hooks** for cross-app integration
4. **RESTful API** with versioned endpoints
5. **Extensible** architecture for future booking types

---

## 🏗️ Architecture Overview

### Current State Analysis

**Existing Models:**
```
listings/models.py:
  - Category (top-level categories with schema)
  - SubCategory (subcategories)
  - Listing (dynamic core model with JSON fields)
  - Booking (basic booking model - TO BE ENHANCED)
  - SellerProfile (business sellers)
  - ListingImage (images)

users/models.py:
  - User (extended AbstractUser with user_type)
  - BusinessProfile (business user profiles)
  - UserPreferences (language, currency, notifications)

assistant/models.py:
  - DemandLead (user demand capture)
  - Request (structured user requests)
```

**Identified Gaps:**
1. Current `Booking` model is too basic (only start/end dates, status)
2. No support for different booking types
3. No booking-specific attributes (guests, services, equipment, etc.)
4. No availability management
5. No payment tracking
6. No cancellation policies
7. No booking history/audit trail

---

## 🎯 Proposed Architecture

### 1. Database Schema

#### **Core Models (bookings/models.py)**

```
BookingType
├── id: UUID
├── name: CharField (unique)
├── slug: SlugField
├── description: TextField
├── icon: CharField
├── color: CharField
├── requires_dates: Boolean
├── requires_time_slot: Boolean
├── requires_guests: Boolean
├── requires_vehicle_info: Boolean
├── schema: JSONField
└── is_active: Boolean

Booking (Enhanced Base Model)
├── id: UUID
├── booking_type: FK → BookingType
├── user: FK → User
├── listing: FK → Listing (nullable for appointments)
├── reference_number: CharField (unique, auto-generated)
│
├── STATUS CHOICES
├── status: CharField (pending, confirmed, in_progress, completed, cancelled)
│
├── DATES & TIMING
├── start_date: DateTimeField
├── end_date: DateTimeField (nullable for appointments)
├── check_in_time: TimeField (nullable)
├── check_out_time: TimeField (nullable)
│
├── PRICING
├── base_price: DecimalField
├── service_fees: DecimalField
├── taxes: DecimalField
├── discount: DecimalField
├── total_price: DecimalField
├── currency: CharField
│
├── CONTACT & COMMUNICATION
├── contact_name: CharField
├── contact_phone: CharField
├── contact_email: EmailField
├── special_requests: TextField
├── internal_notes: TextField
│
├── BOOKING METADATA
├── guests_count: PositiveIntegerField (nullable)
├── booking_data: JSONField (type-specific flexible data)
│
├── CANCELLATION
├── cancellation_policy: CharField
├── cancelled_at: DateTimeField
├── cancelled_by: FK → User
├── cancellation_reason: TextField
│
├── PAYMENT
├── payment_status: CharField (unpaid, partial, paid, refunded)
├── payment_method: CharField
├── paid_amount: DecimalField
├── payment_date: DateTimeField
│
├── TIMESTAMPS
├── created_at: DateTimeField
├── updated_at: DateTimeField
├── confirmed_at: DateTimeField
└── completed_at: DateTimeField

ApartmentRentalBooking (extends Booking)
├── booking: OneToOne → Booking
├── number_of_guests: PositiveIntegerField
├── number_of_adults: PositiveIntegerField
├── number_of_children: PositiveIntegerField
├── pets_allowed: Boolean
├── smoking_allowed: Boolean
├── checkin_instructions: TextField
├── wifi_password: CharField
└── amenities_requested: JSONField

ApartmentViewingBooking (extends Booking)
├── booking: OneToOne → Booking
├── viewing_date: DateField
├── viewing_time: TimeField
├── viewing_duration: DurationField
├── interested_in_buying: Boolean
├── interested_in_renting: Boolean
├── budget_range: CharField
├── agent_name: CharField
└── agent_contact: CharField

ServiceBooking (extends Booking)
├── booking: OneToOne → Booking
├── service_type: CharField (cleaning, repair, maintenance)
├── service_category: FK → Category
├── service_provider: FK → BusinessProfile
├── equipment_needed: JSONField
├── location_address: CharField
├── location_access_instructions: TextField
├── estimated_duration: DurationField
└── service_completed: Boolean

CarRentalBooking (extends Booking)
├── booking: OneToOne → Booking
├── vehicle: FK → Listing
├── pickup_location: CharField
├── dropoff_location: CharField
├── pickup_date: DateTimeField
├── dropoff_date: DateTimeField
├── driver_license_number: CharField (encrypted)
├── driver_age: PositiveIntegerField
├── insurance_selected: CharField
├── additional_drivers: PositiveIntegerField
├── fuel_policy: CharField
├── mileage_limit: PositiveIntegerField
└── gps_requested: Boolean

HotelBooking (extends Booking)
├── booking: OneToOne → Booking
├── hotel: FK → Listing
├── room_type: CharField
├── number_of_rooms: PositiveIntegerField
├── number_of_guests: PositiveIntegerField
├── meal_plan: CharField (none, breakfast, half_board, full_board)
├── smoking_preference: CharField
├── floor_preference: CharField
├── bed_type: CharField
├── early_checkin_requested: Boolean
└── late_checkout_requested: Boolean

AppointmentBooking (extends Booking)
├── booking: OneToOne → Booking
├── service_provider: FK → BusinessProfile
├── appointment_type: CharField (hair, consultation, medical, etc.)
├── duration_minutes: PositiveIntegerField
├── recurring: Boolean
├── recurrence_pattern: CharField
├── appointment_notes: TextField
├── reminder_sent: Boolean
├── reminder_date: DateTimeField
├── no_show: Boolean
└── rescheduled_from: FK → AppointmentBooking (nullable)

BookingAvailability
├── id: UUID
├── listing: FK → Listing (nullable)
├── service_provider: FK → BusinessProfile (nullable)
├── date: DateField
├── start_time: TimeField
├── end_time: TimeField
├── is_available: Boolean
├── max_bookings: PositiveIntegerField
├── current_bookings: PositiveIntegerField
└── blocked_reason: CharField

BookingHistory
├── id: UUID
├── booking: FK → Booking
├── changed_by: FK → User
├── change_type: CharField (created, updated, confirmed, cancelled, etc.)
├── old_values: JSONField
├── new_values: JSONField
├── notes: TextField
└── created_at: DateTimeField

BookingReview
├── id: UUID
├── booking: FK → Booking
├── reviewer: FK → User
├── rating: PositiveIntegerField (1-5)
├── review_text: TextField
├── cleanliness_rating: PositiveIntegerField
├── communication_rating: PositiveIntegerField
├── value_rating: PositiveIntegerField
├── location_rating: PositiveIntegerField
├── response: TextField (seller response)
├── is_verified: Boolean
└── created_at: DateTimeField
```

---

## 🔗 Relationships & Signals

### Model Relationships

```
User (1) ───> (N) Booking
BusinessProfile (1) ───> (N) ServiceBooking
BusinessProfile (1) ───> (N) AppointmentBooking
Listing (1) ───> (N) Booking
Category (1) ───> (N) BookingType
Booking (1) ───> (1) ApartmentRentalBooking
Booking (1) ───> (1) CarRentalBooking
Booking (1) ───> (1) HotelBooking
Booking (1) ───> (1) AppointmentBooking
Booking (1) ───> (N) BookingHistory
Booking (1) ───> (1) BookingReview
```

### Django Signals

**Post-save signals:**
```python
@receiver(post_save, sender=Booking)
def on_booking_created(sender, instance, created, **kwargs):
    if created:
        # Generate reference number
        # Send confirmation email
        # Create availability record
        # Notify seller/provider
        # Log to BookingHistory
```

**Pre-save signals:**
```python
@receiver(pre_save, sender=Booking)
def on_booking_status_change(sender, instance, **kwargs):
    if instance.pk:
        old_instance = Booking.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            # Log status change to BookingHistory
            # Send notifications based on status
            # Update availability
```

**Post-delete signals:**
```python
@receiver(post_delete, sender=Booking)
def on_booking_deleted(sender, instance, **kwargs):
    # Free up availability
    # Notify relevant parties
    # Archive booking data
```

---

## 🔌 API Endpoints

### Base URL: `/api/v1/bookings/`

#### **Booking Types**
```
GET    /booking-types/              List all booking types
GET    /booking-types/{slug}/       Get booking type details
POST   /booking-types/              Create booking type (admin)
PATCH  /booking-types/{id}/         Update booking type (admin)
DELETE /booking-types/{id}/         Delete booking type (admin)
```

#### **Bookings**
```
GET    /                            List user's bookings
GET    /{id}/                       Get booking details
POST   /                            Create new booking
PATCH  /{id}/                       Update booking
DELETE /{id}/                       Cancel booking
POST   /{id}/confirm/               Confirm booking
POST   /{id}/complete/              Mark as completed
POST   /{id}/cancel/                Cancel with reason
GET    /{id}/history/               Get booking history
```

#### **Availability**
```
GET    /availability/               Check availability
POST   /availability/check/         Check specific dates/times
GET    /availability/calendar/      Get calendar view
POST   /availability/block/         Block dates (admin)
POST   /availability/unblock/       Unblock dates (admin)
```

#### **Reviews**
```
GET    /{booking_id}/reviews/       Get booking reviews
POST   /{booking_id}/reviews/       Create review
PATCH  /reviews/{id}/               Update review
DELETE /reviews/{id}/               Delete review
```

#### **Booking-specific endpoints**
```
POST   /apartments/                 Create apartment rental booking
POST   /viewings/                   Create viewing booking
POST   /services/                   Create service booking
POST   /cars/                       Create car rental booking
POST   /hotels/                     Create hotel booking
POST   /appointments/               Create appointment booking
```

---

## 🎨 Frontend Architecture

### Component Structure

```
frontend/src/
├── features/
│   └── bookings/
│       ├── components/
│       │   ├── BookingCard.tsx
│       │   ├── BookingList.tsx
│       │   ├── BookingCalendar.tsx (enhanced from examples)
│       │   ├── BookingTypeSelector.tsx
│       │   ├── BookingSummary.tsx
│       │   ├── BookingStatus.tsx
│       │   │
│       │   ├── forms/
│       │   │   ├── BaseBookingForm.tsx
│       │   │   ├── ApartmentRentalForm.tsx
│       │   │   ├── ViewingForm.tsx
│       │   │   ├── ServiceBookingForm.tsx
│       │   │   ├── CarRentalForm.tsx
│       │   │   ├── HotelBookingForm.tsx
│       │   │   └── AppointmentForm.tsx
│       │   │
│       │   ├── modals/
│       │   │   ├── BookingConfirmModal.tsx
│       │   │   ├── CancelBookingModal.tsx
│       │   │   └── ReviewBookingModal.tsx
│       │   │
│       │   └── wizards/
│       │       ├── BookingWizard.tsx
│       │       ├── Step1SelectType.tsx
│       │       ├── Step2SelectListing.tsx
│       │       ├── Step3SelectDates.tsx
│       │       ├── Step4EnterDetails.tsx
│       │       └── Step5Confirm.tsx
│       │
│       ├── hooks/
│       │   ├── useBookings.ts
│       │   ├── useBookingTypes.ts
│       │   ├── useAvailability.ts
│       │   └── useBookingForm.ts
│       │
│       ├── context/
│       │   └── BookingContext.tsx
│       │
│       ├── types/
│       │   └── booking.types.ts
│       │
│       └── BookingsPage.tsx
│
└── pages/
    ├── Bookings.jsx (enhanced)
    └── CreateBooking.tsx (new)
```

### State Management

**BookingContext:**
```typescript
interface BookingState {
  bookings: Booking[];
  bookingTypes: BookingType[];
  isLoading: boolean;
  error: string | null;
  selectedBooking: Booking | null;

  // Actions
  fetchBookings: () => Promise<void>;
  createBooking: (data: CreateBookingDTO) => Promise<Booking>;
  updateBooking: (id: string, data: UpdateBookingDTO) => Promise<Booking>;
  cancelBooking: (id: string, reason: string) => Promise<void>;
  confirmBooking: (id: string) => Promise<void>;
  checkAvailability: (params: AvailabilityQuery) => Promise<boolean>;
}
```

---

## 🔐 Security & Permissions

### Permission Classes

```python
# bookings/permissions.py

class IsBookingOwner(permissions.BasePermission):
    """Only booking owner can view/modify"""

class IsSellerOrOwner(permissions.BasePermission):
    """Seller of listing or booking owner"""

class CanConfirmBooking(permissions.BasePermission):
    """Only sellers can confirm bookings"""

class CanCancelBooking(permissions.BasePermission):
    """Owner can cancel, seller can cancel if policy allows"""
```

### Data Encryption

- Driver license numbers: `django-cryptography`
- Payment info: Never store card details (use payment gateway tokens)
- PII fields: Hash before logging

---

## 📊 Business Logic

### Booking Flow State Machine

```
[Draft] → [Pending] → [Confirmed] → [In Progress] → [Completed]
   ↓          ↓            ↓              ↓
[Cancelled] ←─────────────┘              ↓
                                    [Reviewed]
```

### Cancellation Policies

```python
CANCELLATION_POLICIES = [
    ('flexible', 'Flexible: Full refund up to 24h before'),
    ('moderate', 'Moderate: 50% refund up to 5 days before'),
    ('strict', 'Strict: 50% refund up to 30 days before'),
    ('non_refundable', 'Non-refundable'),
]
```

### Price Calculation

```python
def calculate_total_price(booking):
    base_price = booking.base_price
    nights = (booking.end_date - booking.start_date).days

    subtotal = base_price * nights
    service_fee = subtotal * 0.10  # 10% service fee
    taxes = subtotal * 0.08  # 8% VAT
    discount = booking.discount or 0

    total = subtotal + service_fee + taxes - discount
    return total
```

---

## 🧪 Testing Strategy

### Unit Tests
- Model methods
- Signal handlers
- Price calculations
- Availability checks

### Integration Tests
- Booking creation flow
- Cancellation flow
- Payment processing
- Notification delivery

### E2E Tests
- Complete booking wizard
- User booking management
- Seller booking confirmation
- Review submission

---

## 📈 Scalability Considerations

1. **Database Indexing:**
   - Index on `(user, created_at)` for user bookings
   - Index on `(listing, start_date, end_date)` for availability
   - Index on `(booking_type, status)` for filtering

2. **Caching:**
   - Cache booking types (rarely change)
   - Cache availability calendar (15min TTL)
   - Cache user bookings list (5min TTL)

3. **Async Processing:**
   - Send notifications via Celery tasks
   - Generate invoices/receipts async
   - Process refunds async

4. **Pagination:**
   - Paginate booking lists (20 per page)
   - Lazy load booking history

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- ✅ Create bookings app
- ✅ Implement base Booking model
- ✅ Implement BookingType model
- ✅ Create migrations
- ✅ Set up admin interface

### Phase 2: Booking Types (Week 2)
- Implement ApartmentRentalBooking
- Implement AppointmentBooking
- Implement ServiceBooking
- Implement signals
- Create availability system

### Phase 3: API Endpoints (Week 3)
- Create booking serializers
- Implement CRUD endpoints
- Add availability endpoints
- Add permission classes
- Write API tests

### Phase 4: Frontend Components (Week 4)
- Create BookingContext
- Build BookingTypeSelector
- Build booking forms
- Build booking wizard
- Integrate with dashboard

### Phase 5: Advanced Features (Week 5)
- Add CarRentalBooking
- Add HotelBooking
- Add booking reviews
- Add booking history
- Add email notifications

### Phase 6: Polish & Testing (Week 6)
- E2E testing
- Performance optimization
- Documentation
- Deployment

---

## 📝 Migration Strategy

### Existing Booking Model

Current simple `Booking` model will be:
1. **Kept** as-is for backward compatibility
2. **Enhanced** with new fields
3. **Data migrated** to new structure via migration script

### Migration Script Outline

```python
from django.db import migrations

def migrate_existing_bookings(apps, schema_editor):
    Booking = apps.get_model('listings', 'Booking')
    NewBooking = apps.get_model('bookings', 'Booking')

    for old_booking in Booking.objects.all():
        # Create new booking with enhanced fields
        new_booking = NewBooking(
            user=old_booking.user,
            listing=old_booking.listing,
            start_date=old_booking.start_date,
            end_date=old_booking.end_date,
            total_price=old_booking.total_price,
            status=old_booking.status,
            # ... populate new fields with defaults
        )
        new_booking.save()
```

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

1. **Booking Conversion Rate**: Target 15%
2. **Average Booking Value**: Target €200
3. **Cancellation Rate**: Target <10%
4. **Review Rate**: Target 40%
5. **Booking Time**: Target <3 minutes
6. **API Response Time**: Target <200ms
7. **Availability Check Time**: Target <100ms

---

## 🔧 Technical Stack Summary

**Backend:**
- Django 5.2.5
- Django REST Framework
- PostgreSQL with UUID primary keys
- Celery for async tasks
- Django Signals for event handling

**Frontend:**
- React 18.2 + TypeScript
- shadcn/ui components
- Context API for state
- Axios for HTTP
- React Router for navigation
- Framer Motion for animations

**Infrastructure:**
- Redis for caching
- Celery for task queue
- PostgreSQL for database
- Railway/Heroku for deployment

---

## 📚 Next Steps

1. ✅ Review and approve this architecture
2. Create `bookings` Django app
3. Implement models incrementally
4. Set up API endpoints
5. Build frontend components
6. Test and iterate

---

**Document Version:** 1.0
**Last Updated:** 2025-01-12
**Status:** ✅ Ready for Implementation
