# Real Estate System - Comprehensive Test Plan

**Date**: 2025-01-16
**Status**: In Progress
**Tester**: Automated Test Sweep

---

## Test Categories

### 1. Property Upload Flow ✓

#### 1.1 Create Listing Button
- [ ] **Test**: Click "Create Listing" button in Portfolio page
- [ ] **Expected**: Modal opens with 4 tabs visible
- [ ] **Endpoint**: N/A (UI only)

#### 1.2 Basic Info Tab
- [ ] **Test**: Fill in title, description, property type, bedrooms, bathrooms
- [ ] **Expected**: Form validates, allows progression to next tab
- [ ] **Validation**: Required fields show errors if empty

#### 1.3 Location Tab
- [ ] **Test**: Enter city, district, latitude, longitude
- [ ] **Expected**: Location data saved to state
- [ ] **Map Integration**: Map picker toggles and updates coordinates

#### 1.4 Pricing Tab
- [ ] **Test**: Enter base price for different listing types
  - [ ] rent_short (Daily Rental)
  - [ ] rent_long (Long-term Rental)
  - [ ] sale (Sale)
  - [ ] project (Project)
- [ ] **Expected**: Conditional fields appear based on listing type
- [ ] **Validation**: Price must be positive number

#### 1.5 Media Tab
- [ ] **Test**: Upload images (drag & drop or file picker)
- [ ] **Expected**: Images preview, max 10 images enforced
- [ ] **Remove**: Can remove individual images

#### 1.6 Submit Property
- [ ] **Test**: Click "Add Property" button
- [ ] **Expected**: Loading state shown, success callback triggered
- [ ] **Endpoints**:
  - `POST /api/v1/real_estate/properties/` → 201 Created
  - `POST /api/real-estate/listings/{id}/images/` → 200 OK

#### 1.7 Portfolio Refresh
- [ ] **Test**: After successful creation, portfolio should auto-refresh
- [ ] **Expected**: New listing appears in correct category tab
- [ ] **React Query**: Cache invalidation triggers refetch

---

### 2. Portfolio Display by Category ✓

#### 2.1 Daily Rental Tab
- [ ] **Test**: Click "Daily Rental" tab
- [ ] **Expected**: Shows only listings with `listing_type_code = 'DAILY_RENTAL'`
- [ ] **Endpoint**: `GET /api/real-estate/listings/summaries/?listing_type=DAILY_RENTAL`
- [ ] **Stats**: Type summary shows correct count

#### 2.2 Long-term Rent Tab
- [ ] **Test**: Click "Long-term Rent" tab
- [ ] **Expected**: Shows only listings with `listing_type_code = 'LONG_TERM_RENTAL'`
- [ ] **Endpoint**: `GET /api/real-estate/listings/summaries/?listing_type=LONG_TERM_RENTAL`
- [ ] **Stats**: Type summary shows correct count

#### 2.3 Sale Tab
- [ ] **Test**: Click "Sale" tab
- [ ] **Expected**: Shows only listings with `listing_type_code = 'SALE'`
- [ ] **Endpoint**: `GET /api/real-estate/listings/summaries/?listing_type=SALE`
- [ ] **Stats**: Type summary shows correct count

#### 2.4 Projects Tab
- [ ] **Test**: Click "Projects" tab
- [ ] **Expected**: Shows only listings with `listing_type_code = 'PROJECT'`
- [ ] **Endpoint**: `GET /api/real-estate/listings/summaries/?listing_type=PROJECT`
- [ ] **Stats**: Type summary shows correct count

#### 2.5 Activity Tab
- [ ] **Test**: Click "Activity" tab
- [ ] **Expected**: Shows recent activity across all listings
- [ ] **Endpoint**: `GET /api/real-estate/listings/events/`

---

### 3. Listing Detail Page ✓

#### 3.1 Navigation
- [ ] **Test**: Click a listing card from portfolio
- [ ] **Expected**: Navigate to `/dashboard/home/real-estate/portfolio/listing/{id}`
- [ ] **Endpoint**: `GET /api/real-estate/listings/{id}/`

#### 3.2 Loading State
- [ ] **Test**: Page loads while fetching data
- [ ] **Expected**: Spinner shown with "Loading listing details..."
- [ ] **UI**: Lime-600 animated spinner

#### 3.3 Error State
- [ ] **Test**: Invalid listing ID or network error
- [ ] **Expected**: Error message with "Back to Portfolio" button
- [ ] **Status**: 404 or 500 error handled gracefully

#### 3.4 Listing Header Display
- [ ] **Test**: Verify all header data displays correctly
- [ ] **Expected**: Shows:
  - Property image (or gradient placeholder)
  - Title
  - Reference code
  - Location (city)
  - Bedrooms, bathrooms
  - Status badge (Active/Draft/Inactive)
  - Price with currency and period (/night or /month)

#### 3.5 Quick Metrics (TODO)
- [ ] **Test**: Verify quick metrics display
- [ ] **Expected**: Currently shows "-" placeholders
- [ ] **Future**: Wire with real data:
  - New Messages count
  - Pending Requests count
  - Bookings (30d) count
  - Occupancy Rate percentage

---

### 4. Listing Detail Tabs ✓

#### 4.1 Overview Tab
- [ ] **Test**: Click "Overview" tab
- [ ] **Expected**: Shows property details
- [ ] **Data**: Property description, features, amenities
- [ ] **Status**: Mock data (not yet wired)

#### 4.2 Messages Tab ✅
- [ ] **Test**: Click "Messages" tab
- [ ] **Expected**: Shows threaded conversations
- [ ] **Endpoint**: `GET /api/real-estate/listings/{id}/messages/`
- [ ] **Features**:
  - Search conversations
  - Thread list with unread counts
  - Message timeline
  - Reply box (TODO: wire send endpoint)
- [ ] **Loading**: Spinner during fetch
- [ ] **Error**: Error message if fetch fails

#### 4.3 Requests Tab
- [ ] **Test**: Click "Requests" tab
- [ ] **Expected**: Shows booking/viewing requests
- [ ] **Status**: Mock data (no API endpoint yet)

#### 4.4 Bookings Tab
- [ ] **Test**: Click "Bookings" tab
- [ ] **Expected**: Shows confirmed bookings
- [ ] **Status**: Mock data (no API endpoint yet)

#### 4.5 Calendar Tab
- [ ] **Test**: Click "Calendar" tab
- [ ] **Expected**: Shows availability calendar
- [ ] **Status**: Mock data (no API endpoint yet)

#### 4.6 Pricing Tab
- [ ] **Test**: Click "Pricing" tab
- [ ] **Expected**: Shows dynamic pricing rules
- [ ] **Status**: Mock data (no API endpoint yet)

#### 4.7 Analytics Tab ✅
- [ ] **Test**: Click "Analytics" tab
- [ ] **Expected**: Shows performance metrics
- [ ] **Endpoint**: `GET /api/real-estate/listings/{id}/analytics/`
- [ ] **Metrics**:
  - Views (total, 30d, 7d)
  - Enquiries (total, 30d)
  - Booking requests (total, 30d)
  - Bookings confirmed (total, 30d)
  - Conversion rate
  - Avg response time
- [ ] **Loading**: Spinner during fetch
- [ ] **Error**: Error message if fetch fails
- [ ] **Fallback**: Mock data if no real data

#### 4.8 Activity Tab ✅
- [ ] **Test**: Click "Activity" tab
- [ ] **Expected**: Shows activity timeline
- [ ] **Endpoint**: `GET /api/real-estate/listings/{id}/events/`
- [ ] **Features**:
  - Filter by activity type
  - Event type badges with colors
  - Metadata display (user names, amounts, ratings)
  - Time formatting (relative: "2h ago", "3d ago")
- [ ] **Event Types Mapped**:
  - VIEW → listing_viewed
  - ENQUIRY → message_received
  - BOOKING_REQUEST → request_received
  - BOOKING_CONFIRMED → booking_created
  - WHATSAPP_CLICK → message_received
- [ ] **Loading**: Spinner during fetch
- [ ] **Error**: Error message if fetch fails
- [ ] **Fallback**: Mock data if no real events

---

### 5. Edit Listing Modal ✓

#### 5.1 Open Modal
- [ ] **Test**: Click "Edit Listing" button in detail page header
- [ ] **Expected**: EditListingModal opens
- [ ] **Pre-population**: Form pre-filled with existing listing data

#### 5.2 Pricing Tab
- [ ] **Test**: Change base price, currency, or price period
- [ ] **Expected**:
  - Input updates form state
  - Preview shows formatted price
  - Dirty state warning appears
- [ ] **Validation**: Price must be positive number

#### 5.3 Availability Tab
- [ ] **Test**: Change available_from or available_to dates
- [ ] **Expected**:
  - Date picker updates
  - Current availability display updates
  - Dirty state warning appears

#### 5.4 Status Tab
- [ ] **Test**: Change listing status (Draft/Active/Inactive/etc.)
- [ ] **Expected**:
  - Dropdown updates
  - Status descriptions visible
  - Dirty state warning appears

#### 5.5 Basic Info Tab
- [ ] **Test**: Change listing title
- [ ] **Expected**:
  - Input updates
  - Note shown about full edit page for extensive changes

#### 5.6 Save Changes
- [ ] **Test**: Click "Save Changes" button
- [ ] **Expected**:
  - Button shows "Saving..." loading state
  - Endpoint called: `PATCH /api/real-estate/listings/{id}/`
  - Success: Modal closes, React Query cache invalidated
  - Error: Error message shown in modal
- [ ] **Disabled**: Button disabled if no changes (not dirty)

#### 5.7 Cancel
- [ ] **Test**: Click "Cancel" button
- [ ] **Expected**: Modal closes without saving

---

### 6. Data Integrity Tests ✓

#### 6.1 Type Code Mapping
- [ ] **Test**: Create listing with `rent_short`
- [ ] **Expected**: Appears in "Daily Rental" tab
- [ ] **Mapping**: `rent_short` → `DAILY_RENTAL`

- [ ] **Test**: Create listing with `rent_long`
- [ ] **Expected**: Appears in "Long-term Rent" tab
- [ ] **Mapping**: `rent_long` → `LONG_TERM_RENTAL`

- [ ] **Test**: Create listing with `sale`
- [ ] **Expected**: Appears in "Sale" tab
- [ ] **Mapping**: `sale` → `SALE`

- [ ] **Test**: Create listing with `project`
- [ ] **Expected**: Appears in "Projects" tab
- [ ] **Mapping**: `project` → `PROJECT`

#### 6.2 Image Upload
- [ ] **Test**: Upload 1 image
- [ ] **Expected**:
  - FormData has 1 file in `images` field
  - POST to `/api/real-estate/listings/{id}/images/`
  - Image URL returned in response

- [ ] **Test**: Upload 5 images
- [ ] **Expected**:
  - FormData has 5 files in `images` field
  - All uploaded in single request
  - Image URLs array returned

- [ ] **Test**: Upload 10 images (max)
- [ ] **Expected**: All 10 uploaded successfully

- [ ] **Test**: Try uploading 11 images
- [ ] **Expected**: Validation prevents >10 images

#### 6.3 Nested Data Structure
- [ ] **Test**: Verify Property → Location nesting
- [ ] **Expected**:
  - API returns `listing.property.location.city`
  - UI correctly displays nested location data

- [ ] **Test**: Verify Property details
- [ ] **Expected**:
  - `listing.property.bedrooms` displayed
  - `listing.property.bathrooms` displayed
  - `listing.property.property_type` displayed

---

### 7. React Query Integration ✓

#### 7.1 Cache Keys
- [ ] **Test**: Verify correct query keys used
- [ ] **Expected**:
  - `['listings', 'summaries', params]` for portfolio
  - `['listings', id]` for detail
  - `['listings', id, 'messages']` for messages
  - `['listings', id, 'events']` for activity
  - `['listings', id, 'analytics']` for analytics

#### 7.2 Cache Invalidation
- [ ] **Test**: Create new listing
- [ ] **Expected**:
  - `invalidateQueries(['portfolio', 'stats'])`
  - `invalidateQueries(['listings', 'summaries'])`
  - Portfolio auto-refreshes

- [ ] **Test**: Update listing via EditModal
- [ ] **Expected**:
  - `invalidateQueries(['listings', id])`
  - `invalidateQueries(['listings', 'summaries'])`
  - `invalidateQueries(['portfolio', 'stats'])`
  - Detail page auto-refreshes

#### 7.3 Stale Time
- [ ] **Test**: Verify stale times configured
- [ ] **Expected**:
  - Portfolio: 2 minutes
  - Detail: 5 minutes
  - Messages: 1 minute
  - Events: 1 minute
  - Analytics: 5 minutes

#### 7.4 Loading States
- [ ] **Test**: Slow network simulation
- [ ] **Expected**:
  - Spinners shown during fetch
  - isPending state handled
  - No flash of content

#### 7.5 Error Handling
- [ ] **Test**: Network failure or 500 error
- [ ] **Expected**:
  - Error state shown
  - User-friendly message
  - Retry option (via navigation)

---

### 8. UI/UX Tests ✓

#### 8.1 Design Consistency
- [ ] **Test**: Verify lime-emerald gradient theme throughout
- [ ] **Expected**:
  - Buttons: `from-lime-500 to-emerald-500`
  - Active states: `bg-lime-600 text-white`
  - Badges: `bg-emerald-100 text-emerald-700` (Active)
  - Borders: `rounded-2xl` for cards
  - Shadows: `shadow-lg` hover `shadow-xl`

#### 8.2 Loading Spinners
- [ ] **Test**: All loading states use consistent spinner
- [ ] **Expected**:
  - Loader2 icon from lucide-react
  - `text-lime-600` color
  - `animate-spin` class
  - Centered with text below

#### 8.3 Error Messages
- [ ] **Test**: All error states use consistent format
- [ ] **Expected**:
  - Red border `border-red-200`
  - ⚠️ emoji icon
  - Clear error message
  - Action button (Back/Retry)

#### 8.4 Empty States
- [ ] **Test**: Empty data arrays show friendly messages
- [ ] **Expected**:
  - Icon with background circle
  - "No X yet" message
  - Helper text

#### 8.5 Responsive Design
- [ ] **Test**: View on mobile (375px)
- [ ] **Expected**: Layout adapts, no horizontal scroll

- [ ] **Test**: View on tablet (768px)
- [ ] **Expected**: Sidebar shows, grid adjusts

- [ ] **Test**: View on desktop (1920px)
- [ ] **Expected**: Max width containers, centered content

---

### 9. End-to-End User Flow ✓

#### Scenario 1: Daily Rental Listing
```
1. User clicks "Create Listing"
2. Selects listing type: rent_short
3. Fills Basic Info: "Beachfront Villa", 3 bed, 2 bath
4. Adds Location: Kyrenia, Esentepe, coordinates
5. Sets Pricing: €120/night, min 3 nights
6. Uploads 5 images
7. Clicks "Add Property"
8. ✓ Property created: POST /api/v1/real_estate/properties/ → 201
9. ✓ Images uploaded: POST /api/real-estate/listings/{id}/images/ → 200
10. ✓ Portfolio refreshes automatically
11. ✓ User sees listing in "Daily Rental" tab
12. User clicks listing card
13. ✓ Detail page loads with all data
14. ✓ Messages tab shows conversations (or empty state)
15. ✓ Activity tab shows events (or mock data)
16. ✓ Analytics tab shows metrics (or mock data)
17. User clicks "Edit Listing"
18. Changes price to €130/night
19. Clicks "Save Changes"
20. ✓ Update successful: PATCH /api/real-estate/listings/{id}/ → 200
21. ✓ Detail page refreshes with new price
22. ✓ Portfolio shows updated price
```

#### Scenario 2: Long-term Rental Listing
```
1. User clicks "Create Listing"
2. Selects listing type: rent_long
3. Fills Basic Info: "Modern Apartment", 2 bed, 1 bath
4. Adds Location: Nicosia, City Center
5. Sets Pricing: €800/month, deposit €1600
6. Uploads 3 images
7. Clicks "Add Property"
8. ✓ Property created successfully
9. ✓ User sees listing in "Long-term Rent" tab (NOT in Daily Rental)
10. User clicks listing
11. ✓ Detail page shows monthly pricing
```

#### Scenario 3: Sale Listing
```
1. User clicks "Create Listing"
2. Selects listing type: sale
3. Fills Basic Info: "Luxury Villa", 4 bed, 3 bath
4. Adds Location: Famagusta, Beach Road
5. Sets Pricing: €450,000, negotiable: yes
6. Uploads 8 images
7. Clicks "Add Property"
8. ✓ Property created successfully
9. ✓ User sees listing in "Sale" tab
10. ✓ Detail page shows total price (not /night or /month)
```

---

### 10. Performance Tests ✓

#### 10.1 Initial Load
- [ ] **Test**: Measure time to first render
- [ ] **Target**: < 3 seconds on 4G network
- [ ] **Metrics**:
  - Time to Interactive (TTI)
  - First Contentful Paint (FCP)

#### 10.2 API Response Times
- [ ] **Test**: Measure API call latency
- [ ] **Target**:
  - GET summaries: < 500ms
  - GET detail: < 300ms
  - POST create: < 1000ms
  - PATCH update: < 500ms
  - POST images: < 2000ms per image

#### 10.3 React Query Caching
- [ ] **Test**: Navigate between pages
- [ ] **Expected**:
  - Cached data shown immediately
  - Background refetch if stale
  - No unnecessary API calls

#### 10.4 Image Loading
- [ ] **Test**: Upload 10 large images (5MB each)
- [ ] **Expected**:
  - Progress indication
  - Successful upload within 10 seconds
  - No browser freeze

---

### 11. Edge Cases & Error Scenarios ✓

#### 11.1 Missing Required Fields
- [ ] **Test**: Try submitting form without title
- [ ] **Expected**: Validation error, submission blocked

#### 11.2 Invalid Price
- [ ] **Test**: Enter negative price
- [ ] **Expected**: Validation error

- [ ] **Test**: Enter non-numeric price
- [ ] **Expected**: Input rejected or validation error

#### 11.3 Network Offline
- [ ] **Test**: Disconnect network, try to create listing
- [ ] **Expected**:
  - Error message shown
  - User can retry after reconnecting

#### 11.4 Session Expired
- [ ] **Test**: Token expired, make API call
- [ ] **Expected**:
  - 401 Unauthorized response
  - Redirect to login
  - Token refresh attempt (if implemented)

#### 11.5 Concurrent Edits
- [ ] **Test**: User A edits listing, User B edits same listing
- [ ] **Expected**:
  - Last write wins
  - OR conflict detection (if implemented)

#### 11.6 Large Dataset
- [ ] **Test**: User has 100+ listings
- [ ] **Expected**:
  - Pagination works
  - No performance degradation
  - Virtual scrolling (if implemented)

#### 11.7 Special Characters
- [ ] **Test**: Title with emojis, special chars: "🏠 Villa with café ñ"
- [ ] **Expected**:
  - Characters saved correctly
  - Display renders correctly
  - No encoding issues

#### 11.8 Image Upload Failures
- [ ] **Test**: Network failure during image upload
- [ ] **Expected**:
  - Property still created
  - Error shown for image upload
  - User can retry image upload

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Database seeded with test data
- [ ] Redis running (if used)
- [ ] Browser console open for error monitoring
- [ ] Network tab open for API monitoring

### Test Data Required
- [ ] At least 1 listing in each category (Daily, Long-term, Sale, Project)
- [ ] Listings with images
- [ ] Listings without images
- [ ] Listings with different statuses (Active, Draft, Inactive)
- [ ] Messages/events data (if available)

### Post-Test Validation
- [ ] No console errors
- [ ] No 404 or 500 API errors
- [ ] All images load correctly
- [ ] No memory leaks
- [ ] Browser performance acceptable

---

## Known Issues / TODO

1. **Quick Metrics**: Currently showing "-" placeholders
   - Need to wire with real API data
   - Count messages, requests, bookings

2. **Mock Data Tabs**: Some tabs still using mock data
   - RequestsTab: No API endpoint yet
   - BookingsTab: No API endpoint yet
   - CalendarTab: No API endpoint yet
   - PricingTab: No API endpoint yet

3. **Send Message**: Reply functionality in MessagesTab
   - TODO: Wire up send message API call
   - Need POST endpoint for sending replies

4. **Image Gallery**: Single image vs carousel
   - Detail page shows only first image
   - TODO: Add image carousel/lightbox

5. **Delete Listing**: No delete functionality yet
   - "Delete" button exists but not wired
   - Need confirmation modal

---

## Test Results

### Summary
- **Total Tests**: TBD
- **Passed**: TBD
- **Failed**: TBD
- **Blocked**: TBD
- **Coverage**: TBD%

### Critical Bugs Found
(To be filled during testing)

### Non-Critical Issues
(To be filled during testing)

### Performance Issues
(To be filled during testing)

---

**Test Plan Version**: 1.0
**Last Updated**: 2025-01-16
**Next Review**: After initial test execution
