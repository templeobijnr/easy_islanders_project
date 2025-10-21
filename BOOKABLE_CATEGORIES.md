# Bookable Categories: What Can Be Booked on Easy Islanders

## Overview

Not everything on Easy Islanders requires booking. Some items are **bought** (one-time purchase), while others are **booked** (appointment-based with date/time).

---

## 📅 BOOKABLE Categories (Require Appointments)

These require customers to book a specific date and time with the seller.

### 1. **Accommodation / Real Estate** ✅ BOOKABLE
- Apartments → View the apartment at a scheduled time
- Villas → Schedule a property viewing
- Bungalows → Book a site visit
- Houses → Arrange viewing appointment
- Guesthouses → Check availability & book dates
- Hostels → Reserve bed spaces
- Hotels → Book room reservation
- Rooms / Shared Spaces → Book duration
- Commercial Spaces → Arrange viewing
- Land / Plots → Site inspection booking

**Use Case:** "I want to view this apartment on October 25 at 2:30 PM"

### 2. **Vehicles / Car Rentals** ✅ BOOKABLE
- Car Rentals → Book rental dates
- Motorcycles / Scooters → Reserve rental period
- Bicycles → Book usage dates
- Boats / Water Vehicles → Book rental time
- Other Vehicles → Schedule rental

**Use Case:** "I want to rent a car from October 25-27"

### 3. **Experiences & Entertainment** ✅ BOOKABLE
- Tours → Book tour date/time
- Excursions → Reserve spot on excursion
- Water Sports → Book activity session
- Workshops → Register for workshop
- Events → Book event tickets/entry

**Use Case:** "I want to book a boat tour for October 26 at 10:00 AM"

### 4. **Services** ✅ BOOKABLE (Some)
- Cleaning → Schedule cleaning service
- Maintenance / Repairs → Book repair appointment
- Photography / Videography → Book session
- Event Planning → Consult appointment
- Tutoring / Education → Book lesson time

**Use Case:** "I want to book a photographer for October 30"

---

## 🛒 NON-BOOKABLE Categories (Direct Purchase)

These are one-time purchases without appointment scheduling.

### 1. **Products / Goods**
- Electronics
- Clothing & Fashion
- Home & Garden
- Sports & Outdoor
- Toys & Games
- Books & Media
- Antiques & Collectibles

**Use Case:** "I'll buy this iPhone" (pickup/shipping arranged after purchase)

### 2. **Food & Dining**
- Restaurants → Delivery or walk-in
- Cafes → Pickup order
- Bakeries → Pickup baked goods
- Food Delivery → Order delivery

**Use Case:** "Order this pizza for delivery"

### 3. **Jobs & Gigs**
- Employment offers
- Freelance work
- Consulting gigs

**Use Case:** "Apply for this job" (no booking needed)

### 4. **Miscellaneous Services**
- One-time purchases
- Digital goods
- Vouchers
- Subscriptions

---

## Quick Reference Table

| Category | Type | Bookable? | How It Works |
|----------|------|-----------|--------------|
| Apartments | Real Estate | ✅ YES | Book viewing date/time |
| Car Rentals | Vehicle | ✅ YES | Select rental dates |
| Tours | Experience | ✅ YES | Choose tour date/time |
| iPhone | Product | ❌ NO | Buy and arrange pickup |
| Restaurant | Food | ❌ NO | Order for delivery/pickup |
| Freelance Job | Work | ❌ NO | Apply/bid for job |
| Photography | Service | ✅ YES | Book session date/time |
| Dress | Clothing | ❌ NO | Buy directly |
| Workshop | Experience | ✅ YES | Register for date/time |

---

## Booking Flow (Bookable Items Only)

```
Customer finds listing
    ↓
Clicks "Request Booking"
    ↓
Selects Date & Time
    ↓
Adds Optional Message
    ↓
Submits Booking Request
    ↓
Seller Gets WhatsApp Notification
    ↓
Seller Confirms Available Times
    ↓
Customer Confirms Appointment
    ↓
Booking Confirmed ✅
```

---

## Phase 1 Implementation Focus

**Start with these 3 categories:**

1. **Accommodation** (high value, clear use case)
2. **Car Rentals** (simple date range)
3. **Experiences** (popular for tourists)

**Booking fields to collect:**
- Date
- Time (or date range for rentals)
- Message/Notes
- Contact phone
- Contact email

---

## Examples of Bookable Listings

✅ "2-Bedroom Apartment in Nicosia - €1,500/month" → Book viewing
✅ "Toyota Corolla Car Rental - €40/day" → Book rental dates
✅ "Guided Beach Tour - €30 per person" → Book tour time
✅ "Photography Session - €150" → Book session date/time
✅ "Motorcycle Rental - €25/day" → Book rental period

---

## Examples of Non-Bookable Listings

❌ "iPhone 15 Pro - €999" → Buy directly
❌ "Winter Jacket - €50" → Purchase and ship
❌ "Pizza Delivery - €12" → Order and deliver
❌ "Full-time Developer Position" → Apply for job
❌ "Vintage Watch - €200" → Buy directly

---

## Decision Framework

**Ask: "Does this require scheduling an appointment?"**

- **YES** → BOOKABLE ✅
  - Property viewing
  - Car rental period
  - Tour/activity time
  - Service appointment

- **NO** → NON-BOOKABLE ❌
  - One-time product purchase
  - Digital delivery
  - Job application
  - Instant transaction

---

## Summary

**For Phase 1 Booking System:**
- Focus on **Accommodation**, **Vehicles**, **Experiences**, and **Services**
- These are clearly appointment-based
- They generate recurring revenue
- They have natural "need" for date/time selection

**For Phase 2+:**
- Can add more complex booking logic
- Recurring bookings for regular services
- Multi-day bookings
- Group bookings
- Payment integration tied to bookings

---

**Document:** Bookable Categories Definition
**Status:** Ready for Phase 1 Implementation
**Last Updated:** October 21, 2025
