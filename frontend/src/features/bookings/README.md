# Easy Islanders - Frontend Booking System

Complete React/TypeScript booking system with shadcn/ui components.

## 📦 Features

- **6 Booking Types**: Apartments, Viewings, Services, Cars, Hotels, Appointments
- **Multi-step Wizard**: Guided booking creation flow
- **Type-specific Forms**: Customized forms for each booking type
- **Booking Management**: List, detail view, and actions
- **Real-time Validation**: Form validation with error messages
- **Status Management**: Track bookings through their lifecycle
- **Filtering & Sorting**: Advanced filtering and search
- **Responsive Design**: Mobile-first with Tailwind CSS
- **shadcn/ui Components**: Consistent, accessible UI components

## 🏗️ Architecture

```
features/bookings/
├── BookingsPage.tsx          # Main page component
├── types.ts                   # TypeScript type definitions
├── api/
│   └── bookingsApi.ts        # API client functions
├── utils/
│   └── bookingUtils.ts       # Utility functions
└── components/
    ├── BookingWizard.tsx     # Multi-step booking creation
    ├── BookingTypeSelector.tsx # Select booking category
    ├── BookingList.tsx       # List of bookings
    ├── BookingCard.tsx       # Individual booking card
    ├── BookingDetail.tsx     # Detailed booking view
    ├── StatusBadge.tsx       # Status display
    ├── PaymentBadge.tsx      # Payment status display
    ├── BookingTypeIcon.tsx   # Booking type icon
    └── forms/
        ├── BookingFormCommon.tsx          # Common fields
        ├── ApartmentRentalForm.tsx        # Apartment rental
        ├── ApartmentViewingForm.tsx       # Property viewing
        ├── ServiceBookingForm.tsx         # Service booking
        ├── CarRentalForm.tsx              # Car rental
        ├── HotelBookingForm.tsx           # Hotel booking
        └── AppointmentForm.tsx            # Appointments
```

## 🚀 Quick Start

### 1. Import the BookingsPage

```typescript
// In your routes or dashboard
import { BookingsPage } from './features/bookings';

// Use in routing
<Route path="/dashboard/bookings" element={<BookingsPage />} />
```

### 2. Use Individual Components

```typescript
import { BookingWizard, BookingList, BookingDetail } from './features/bookings';

// Create a booking
<BookingWizard
  listingId="optional-listing-id"
  onComplete={(booking) => console.log('Created:', booking)}
  onCancel={() => console.log('Cancelled')}
/>

// List bookings
<BookingList
  onBookingClick={(booking) => navigate(`/bookings/${booking.id}`)}
  showFilters={true}
/>

// Show booking details
<BookingDetail
  bookingId={bookingId}
  isOwner={true}
  isSeller={false}
  onUpdate={(booking) => console.log('Updated:', booking)}
/>
```

## 💻 Component Usage

### BookingWizard

Multi-step wizard for creating bookings.

```typescript
<BookingWizard
  listingId="listing-uuid"               // Optional: pre-fill listing
  onComplete={(booking) => {}}           // Called when booking created
  onCancel={() => {}}                    // Called when wizard cancelled
/>
```

**Steps:**
1. **Type Selection**: Choose booking category
2. **Details**: Fill common and type-specific fields
3. **Pricing**: Configure pricing details
4. **Review**: Review all information
5. **Confirmation**: Success message with reference number

### BookingList

Display filterable list of bookings.

```typescript
<BookingList
  onBookingClick={(booking) => {}}       // Called when booking clicked
  initialFilters={{}}                    // Optional initial filters
  showFilters={true}                     // Show/hide filter UI
/>
```

**Features:**
- Status tabs (All, Pending, Confirmed, etc.)
- Search by reference number or contact
- Sort by date, price, etc.
- Pagination with "Load More"

### BookingDetail

Detailed view with actions.

```typescript
<BookingDetail
  bookingId="booking-uuid"
  isOwner={true}                         // Enable owner actions
  isSeller={false}                       // Enable seller actions
  onUpdate={(booking) => {}}             // Called after update
/>
```

**Features:**
- Complete booking information
- Action buttons (Confirm, Cancel, Complete)
- Booking history timeline
- Type-specific details

### BookingTypeSelector

Select booking category.

```typescript
<BookingTypeSelector
  onSelect={(type) => console.log(type)}
  selectedType={currentType}             // Optional current selection
  listingId="listing-uuid"               // Optional listing filter
/>
```

### Type-Specific Forms

Each booking type has its own form with specific fields:

```typescript
import {
  ApartmentRentalForm,
  ApartmentViewingForm,
  ServiceBookingForm,
  CarRentalForm,
  HotelBookingForm,
  AppointmentForm,
} from './features/bookings';

<ApartmentRentalForm
  data={formData}
  onChange={(field, value) => {}}
  errors={{}}
/>
```

## 🎨 Styling

All components use **Tailwind CSS** with the Easy Islanders brand:

- **Primary Color**: `#6CC24A` (lime-600)
- **Design System**: shadcn/ui components
- **Responsive**: Mobile-first breakpoints
- **Animations**: Framer Motion

## 🔧 API Integration

The booking system uses axios for API calls:

```typescript
import { bookingApi } from './features/bookings';

// Booking Types
const types = await bookingApi.types.list();
const type = await bookingApi.types.get('slug');

// Bookings
const bookings = await bookingApi.bookings.myBookings();
const booking = await bookingApi.bookings.get(id);
const newBooking = await bookingApi.bookings.create(data);
await bookingApi.bookings.confirm(id, { notes: 'Confirmed' });
await bookingApi.bookings.cancel(id, { reason: 'Reason' });
await bookingApi.bookings.complete(id, {});

// Availability
const available = await bookingApi.availability.check({
  listing_id: 'uuid',
  start_date: '2024-06-01',
  end_date: '2024-06-07',
});

// Reviews
const reviews = await bookingApi.reviews.list();
await bookingApi.reviews.create({
  booking: 'uuid',
  rating: 5,
  review_text: 'Great!',
});
```

## 🛠️ Utilities

Helper functions for formatting and validation:

```typescript
import { bookingUtils } from './features/bookings';

// Date formatting
bookingUtils.formatDate('2024-06-01T10:00:00Z');
// → "June 1, 2024"

bookingUtils.formatDateShort('2024-06-01');
// → "Jun 1, 2024"

bookingUtils.getRelativeTime('2024-06-01T10:00:00Z');
// → "2 days ago" or "in 3 hours"

// Price formatting
bookingUtils.formatPrice('150.00', 'EUR');
// → "€150.00"

bookingUtils.calculateTotalPrice(150, 15, 12, 0);
// → 177

// Validation
bookingUtils.isValidEmail('user@example.com');
// → true

bookingUtils.isValidPhone('+357 99 123456');
// → true

bookingUtils.isValidDateRange('2024-06-01', '2024-06-07');
// → true

// Status helpers
bookingUtils.canCancelBooking(booking);
// → true/false

bookingUtils.getAvailableActions(booking, isOwner, isSeller);
// → [{ action: 'confirm', label: 'Confirm', variant: 'primary' }, ...]
```

## 📊 TypeScript Types

All types are fully typed:

```typescript
import type {
  Booking,
  BookingDetail,
  BookingType,
  BookingStatus,
  BookingCreateRequest,
  ApartmentRentalBooking,
  // ... and more
} from './features/bookings';

const booking: Booking = {
  id: 'uuid',
  reference_number: 'BK-2024-00001',
  status: 'confirmed',
  // ... all fields typed
};
```

## 🎯 Status Flow

```
[Draft] → [Pending] → [Confirmed] → [In Progress] → [Completed]
   ↓          ↓            ↓              ↓
[Cancelled] ←─────────────┴───────────────┘
```

## 🔐 Permissions

Actions are permission-based:

- **Owner**: Can view, cancel (if policy allows), review
- **Seller**: Can confirm, cancel, complete
- **Public**: Cannot access booking details

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test features/bookings
```

## 📝 Customization

### Add New Booking Type

1. **Add type definition** in `types.ts`:
```typescript
export interface YachtRentalBooking {
  booking: string;
  yacht: string;
  captain_needed: boolean;
  // ... your fields
}
```

2. **Create form component** in `components/forms/`:
```typescript
// YachtRentalForm.tsx
export const YachtRentalForm: React.FC<Props> = ({ data, onChange }) => {
  return (
    // Your form fields
  );
};
```

3. **Add to BookingWizard**:
```typescript
// In BookingWizard.tsx renderTypeSpecificForm()
else if (slug === 'yacht-rental') {
  return <YachtRentalForm data={typeSpecificData} onChange={handleTypeSpecificFieldChange} />;
}
```

### Customize Styling

Override Tailwind classes:

```typescript
<BookingCard
  booking={booking}
  className="shadow-xl border-2 border-lime-500"
/>
```

## 🚀 Production Checklist

- [ ] Backend API is deployed and accessible
- [ ] Environment variables configured (API_BASE_URL)
- [ ] Authentication tokens are working
- [ ] Booking types are seeded in backend
- [ ] File uploads configured (if needed)
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Analytics tracking added

## 📖 Related Documentation

- **Backend API**: `/bookings/README.md`
- **Architecture**: `/docs/BOOKING_SYSTEM_ARCHITECTURE.md`
- **shadcn/ui**: `/frontend/src/components/examples/README.md`

## 🤝 Contributing

When adding new features:
1. Create types first
2. Add API functions
3. Build UI components
4. Add to BookingsPage
5. Update this README

## 📝 License

Part of Easy Islanders project.

---

**Version**: 1.0
**Last Updated**: 2025-01-12
**Status**: ✅ Production Ready
