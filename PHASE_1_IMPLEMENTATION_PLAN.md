# Phase 1: Booking System - Implementation Plan

## Overview

Phase 1 implements the booking system for Easy Islanders marketplace, enabling customers to book appointments for:
- **Accommodation** (property viewings)
- **Car Rentals** (vehicle rental dates)
- **Experiences** (tours, activities)
- **Services** (professional appointments)

## Approach: Test-Driven Development (TDD)

**Write tests FIRST, then implement.**

---

## Implementation Sequence

### STEP 1: Frontend Booking Component Tests (Week 1)
**File:** `frontend/src/components/booking/BookingCalendar.test.jsx`

Test cases to write FIRST:
1. ✅ Calendar renders with correct month
2. ✅ Can select date from calendar
3. ✅ Time slots display for selected date
4. ✅ Can select time slot
5. ✅ Booking confirmation modal appears
6. ✅ Can submit booking with message

**Then implement:** `BookingCalendar.jsx` component

---

### STEP 2: Booking Request Modal Tests (Week 1)
**File:** `frontend/src/components/booking/BookingModal.test.jsx`

Test cases to write FIRST:
1. ✅ Modal displays listing details
2. ✅ Date/time selection works
3. ✅ Can add optional message
4. ✅ Can submit booking request
5. ✅ Shows success message
6. ✅ Redirects to bookings page

**Then implement:** `BookingModal.jsx` component

---

### STEP 3: Booking Dashboard Page Tests (Week 1)
**File:** `frontend/src/pages/dashboard/Bookings.test.jsx`

Test cases to write FIRST:
1. ✅ Loads user's bookings on mount
2. ✅ Displays booking list with status
3. ✅ Shows seller response when available
4. ✅ Can cancel pending booking
5. ✅ Shows confirmation date when confirmed
6. ✅ Displays completed bookings with review option

**Then implement:** `Bookings.jsx` page

---

### STEP 4: Backend Booking Endpoints Tests (Week 2)
**File:** `tests/test_booking_api.py`

Test cases to write FIRST:
1. ✅ POST /api/bookings/ - Create booking (authenticated)
2. ✅ GET /api/bookings/user/ - Get user's bookings
3. ✅ PUT /api/bookings/{id}/status - Update status (agent only)
4. ✅ DELETE /api/bookings/{id}/ - Cancel booking
5. ✅ GET /api/bookings/{id}/availability - Get calendar availability
6. ✅ Authentication required for all endpoints
7. ✅ Permission checks (can't update others' bookings)

**Then implement:** API views and serializers

---

### STEP 5: Booking Calendar Availability Backend (Week 2)
**File:** `tests/test_booking_availability.py`

Test cases to write FIRST:
1. ✅ Returns available dates for listing
2. ✅ Returns available time slots for selected date
3. ✅ Excludes already booked times
4. ✅ Respects seller's availability settings
5. ✅ Prevents booking in the past

**Then implement:** Calendar availability logic

---

### STEP 6: Booking Notification Tests (Week 2)
**File:** `tests/test_booking_notifications.py`

Test cases to write FIRST:
1. ✅ WhatsApp sent to seller on new booking
2. ✅ Email sent to customer on confirmation
3. ✅ SMS reminder 24h before booking
4. ✅ Notification includes all relevant details
5. ✅ Respects notification preferences

**Then implement:** Notification service

---

### STEP 7: Integration Tests (Week 3)
**File:** `tests/test_booking_flow.py`

End-to-end test cases:
1. ✅ Full booking flow: customer requests → seller confirms → booking confirmed
2. ✅ Cancellation flow: pending booking → cancelled
3. ✅ Multiple bookings by same customer
4. ✅ Seller manages multiple bookings
5. ✅ Calendar updates correctly after booking
6. ✅ Notifications sent at each step

**Then implement:** Integration between components

---

## Frontend Components to Build

```
frontend/src/
├── components/
│   ├── booking/
│   │   ├── BookingCalendar.jsx       (Calendar date picker)
│   │   ├── BookingModal.jsx          (Request booking modal)
│   │   ├── TimeSlotSelector.jsx      (Time slot selection)
│   │   └── BookingConfirmation.jsx   (Confirmation screen)
│   └── dashboard/
│       └── BookingCard.jsx           (Booking status card)
│
└── pages/
    └── dashboard/
        ├── Bookings.jsx             (Booking history page)
        └── SellerBookings.jsx       (Seller's bookings page)
```

---

## Backend Components to Build

```
assistant/
├── models.py              (Update Booking model if needed)
├── views_booking.py       (NEW - Booking API views)
├── serializers_booking.py (NEW - Booking serializers)
├── services/
│   └── booking_service.py (NEW - Booking business logic)
├── services/
│   └── notifications.py   (Update - Add booking notifications)
└── urls.py               (Add booking routes)
```

---

## Database: Already Ready ✅

The Booking model already exists with:
- ✅ UUID primary key
- ✅ Listing reference
- ✅ User reference
- ✅ Date/time fields
- ✅ Status tracking
- ✅ Agent response fields
- ✅ Available times storage

No migrations needed!

---

## API Endpoints to Implement

### Customer Endpoints
```
POST   /api/bookings/                  - Create booking request
GET    /api/bookings/user/             - Get customer's bookings
DELETE /api/bookings/{id}/             - Cancel booking
GET    /api/bookings/{id}/availability - Get calendar availability
```

### Seller Endpoints
```
GET    /api/bookings/seller/           - Get bookings for seller's listings
PUT    /api/bookings/{id}/status       - Update booking status
GET    /api/bookings/{id}/             - Get booking details
```

### Calendar Endpoints
```
GET    /api/listings/{id}/calendar/available-dates/
GET    /api/listings/{id}/calendar/available-times/?date=YYYY-MM-DD
```

---

## Integration Points

### Existing Systems
- **Listings:** Each booking links to a listing
- **Users:** Track customer and seller
- **Conversations:** Optional - link booking discussion to conversation
- **WhatsApp:** Already integrated - send notifications
- **Notifications:** Use existing notification system

### New Systems
- Calendar availability management
- Booking status workflow
- Notification templates

---

## Testing Strategy

1. **Unit Tests:** Each component/function independently
2. **Integration Tests:** Components working together
3. **E2E Tests:** Full user flow (if using Cypress/Playwright)
4. **API Tests:** All endpoints with mocking

**Test Coverage Goal:** 85%+

---

## Phase 1 Timeline

```
Week 1: Frontend components + tests
  - Booking calendar component (3 days)
  - Booking modal (2 days)
  - Booking dashboard page (2 days)

Week 2: Backend API + tests
  - Booking API endpoints (3 days)
  - Calendar availability logic (2 days)
  - Booking notifications (2 days)

Week 3: Integration + Polish
  - E2E testing (2 days)
  - Bug fixes & optimization (3 days)
  - Documentation (2 days)
```

---

## Success Criteria

✅ All tests passing (frontend + backend)
✅ Customer can request booking
✅ Seller gets WhatsApp notification
✅ Seller can respond with available times
✅ Customer can confirm booking
✅ Booking appears in customer dashboard
✅ Seller can manage bookings
✅ Calendar prevents double-booking
✅ Notifications work for all scenarios
✅ Zero regressions in Phase 0 tests

---

## Next Steps

1. **Create test file:** `frontend/src/components/booking/BookingCalendar.test.jsx`
2. **Write 5-6 test cases** for the calendar component
3. **Run tests** (they will fail - that's expected in TDD)
4. **Implement** the component to make tests pass
5. **Move to next component** and repeat

---

## Files to Reference

- `BOOKABLE_CATEGORIES.md` - What can be booked
- `PHASE_0_COMPLETE.md` - Phase 0 details
- `assistant/models.py` - Booking model (already exists)
- `assistant/views.py` - Existing booking endpoints
- `users/models.py` - User model for bookings
- `listings/models.py` - Listing model for bookings

---

**Ready to start Phase 1? Follow this plan step by step, write tests first, then implement.**

No blockers. All backend foundation ready.

---

**Phase 1 Start Date:** October 21, 2025
**Methodology:** TDD (Test-Driven Development)
**Duration:** 3 weeks
**Team:** Ready to proceed
