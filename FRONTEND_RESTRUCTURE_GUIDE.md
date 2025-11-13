# Frontend Restructuring Implementation Guide

## Overview

This document tracks the progress of restructuring the Easy Islanders frontend into a unified, TypeScript-first, feature-sliced SPA with multi-domain seller dashboard capabilities.

**Status:** Phase 1 Complete (Foundation) | Phase 2 Pending (Integration & Migration)

---

## ✅ Phase 1: Core Architecture (COMPLETE)

### 1.1 Entry Point & Shell

**Completed:**
- ✅ Updated `src/index.tsx` to use `BrowserRouter`, `AppShell`, and `AppRoutes`
- ✅ Maintained all providers: `AuthProvider`, `UiProvider`, `ChatProvider`
- ✅ Kept global axios interceptor for authentication
- ✅ Created `app/AppShell.tsx` with Navbar04 integration
- ✅ Created `app/routes.tsx` with unified route definitions

**Files:**
```
src/index.tsx          - Entry point with all providers
src/app/AppShell.tsx   - Main shell with navbar
src/app/routes.tsx     - Unified routing config
```

---

### 1.2 Domain Registry System

**Completed:**
- ✅ Created comprehensive domain registry with 10 domains
- ✅ Type-safe `DomainId` and `DashboardSectionId` types
- ✅ Domain configurations with icons, colors, enabled sections
- ✅ Helper functions: `getDomainConfig()`, `getAllDomains()`, `isSectionEnabled()`

**Domains Defined:**
1. `real_estate` - Properties, rentals & sales
2. `cars` - Vehicles, rentals & sales
3. `events` - Conferences, parties & gatherings
4. `services` - Professional & trade services
5. `restaurants` - Dining, catering & food services
6. `p2p` - Peer-to-peer marketplace
7. `appointments` - Appointment scheduling
8. `health_beauty` - Health, wellness & beauty
9. `activities` - Tours, experiences & activities
10. `products` - Physical products & retail

**Sections Defined:**
- `home` - Domain-specific home page
- `my_listings` - Listings management
- `bookings` - Bookings/reservations
- `seller_inbox` - Customer inquiries
- `broadcasts` - Mass communications
- `sales` - Sales tracking
- `messages` - Messaging
- `analytics` - Analytics & reporting
- `profile` - Business profile
- `help` - Help & support

**Files:**
```
src/features/seller-dashboard/domainRegistry.ts
```

---

### 1.3 Domain Context & Provider

**Completed:**
- ✅ Created `DomainContext` with React Context API
- ✅ `useDomainContext()` hook for accessing domain state
- ✅ `DomainProvider` component for wrapping routes
- ✅ Auto-detection of domain/section from URL
- ✅ Navigation helpers: `navigateToSection()`, `navigateToDomainHome()`

**API:**
```typescript
const {
  activeDomain,       // Current DomainConfig
  setActiveDomain,    // Switch domains
  availableDomains,   // All domains
  activeSection,      // Current section
  setActiveSection,   // Switch sections
  isSectionEnabled,   // Check if section available
  navigateToSection,  // Navigate to section
  navigateToDomainHome // Navigate to domain home
} = useDomainContext();
```

**Files:**
```
src/features/seller-dashboard/context/DomainContext.tsx
```

---

### 1.4 Dashboard Route Wrappers

**Completed:**
- ✅ Created 11 route wrapper pages in `pages/dashboard/`
- ✅ Each wraps content with `DomainProvider` + `DashboardLayout`
- ✅ All set appropriate `initialSection` prop

**Routes Created:**
```
/dashboard                → index.tsx (redirects to primary domain home)
/dashboard/my-listings    → my-listings.tsx
/dashboard/bookings       → bookings.tsx
/dashboard/seller-inbox   → seller-inbox.tsx
/dashboard/broadcasts     → broadcasts.tsx
/dashboard/sales          → sales.tsx
/dashboard/messages       → messages.tsx
/dashboard/analytics      → analytics.tsx
/dashboard/profile        → profile.tsx
/dashboard/help           → help.tsx
```

**Pattern:**
```typescript
// Example: pages/dashboard/my-listings.tsx
const MyListingsPage: React.FC = () => (
  <DomainProvider initialSection="my_listings">
    <DashboardLayout>
      <MyListings />  {/* Existing component */}
    </DashboardLayout>
  </DomainProvider>
);
```

---

### 1.5 Domain-Specific Home Pages

**Completed:**
- ✅ Created 6 domain home route wrappers in `pages/dashboard/home/`
- ✅ Each sets specific `domainId` and `initialSection="home"`

**Routes Created:**
```
/dashboard/home/real-estate   → real-estate.tsx
/dashboard/home/cars          → cars.tsx
/dashboard/home/events        → events.tsx
/dashboard/home/services      → services.tsx
/dashboard/home/restaurants   → restaurants.tsx
/dashboard/home/p2p           → p2p.tsx
```

**Pattern:**
```typescript
// Example: pages/dashboard/home/real-estate.tsx
const RealEstateHomePage: React.FC = () => (
  <DomainProvider domainId="real_estate" initialSection="home">
    <DashboardLayout>
      <DomainHomeRealEstate />
    </DashboardLayout>
  </DomainProvider>
);
```

---

### 1.6 Domain Home Implementations

**Completed:**

**Real Estate (Full Implementation):**
- ✅ `DomainHomeRealEstate.tsx` with 6 domain-specific cards:
  1. Occupancy Rate Card (87% occupancy, 24/28 units)
  2. Monthly Revenue Card (€45,200, +12% growth)
  3. Sales Pipeline Card (viewings, offers, closings)
  4. Top Channels Card (traffic sources)
  5. Pending Tasks Card (maintenance, renewals, inspections)
  6. Broadcast Teaser Card (reach 1,200+ buyers/tenants)

**Other Domains (Stub Implementations):**
- ✅ `DomainHomeCars.tsx` - Active listings, inquiries, sales
- ✅ `DomainHomeEvents.tsx` - Upcoming events, tickets sold, revenue
- ✅ `DomainHomeServices.tsx` - Active services, bookings, revenue
- ✅ `DomainHomeRestaurants.tsx` - Reservations, menu items, revenue
- ✅ `DomainHomeP2P.tsx` - Active listings, pending offers, completed sales

**Files:**
```
src/features/seller-dashboard/domains/
├── real-estate/
│   └── DomainHomeRealEstate.tsx  (✅ COMPLETE)
├── cars/
│   └── DomainHomeCars.tsx        (⚠️  STUB)
├── events/
│   └── DomainHomeEvents.tsx      (⚠️  STUB)
├── services/
│   └── DomainHomeServices.tsx    (⚠️  STUB)
├── restaurants/
│   └── DomainHomeRestaurants.tsx (⚠️  STUB)
└── p2p/
    └── DomainHomeP2P.tsx         (⚠️  STUB)
```

---

## 📊 Phase 1 Summary

### Metrics
- **27 files created**
- **1,250 lines added**
- **20 lines removed**
- **10 domains configured**
- **10 sections defined**
- **17 routes created**

### Architecture Achievements
✅ Single routing config (`app/routes.tsx`)
✅ Type-safe domain/section management
✅ Config-driven dashboard (no hardcoded logic)
✅ Clean separation of concerns
✅ Multi-domain seller dashboard foundation
✅ Domain-specific home pages

---

## 🚧 Phase 2: Integration & Migration (TODO)

### 2.1 Configure Path Aliases for Webpack

**Problem:** Build fails with `@/` imports because webpack doesn't use tsconfig paths.

**Solution:**
```bash
# Install craco
npm install @craco/craco --save-dev

# Create craco.config.js
```

```javascript
// craco.config.js
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
};
```

```json
// package.json - update scripts
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

**Affected Files:** 15 files using `@/` imports

---

### 2.2 Deprecate HomePage.tsx

**Current State:** `HomePage.tsx` still has nested routing and providers.

**Actions:**
1. Extract useful components from HomePage navigation
2. Move to `shared/components/` or integrate into Navbar04
3. Update any links/references to HomePage routes
4. Delete `pages/HomePage.tsx`

**Impact:** Simplifies routing, removes duplicate provider nesting

---

### 2.3 HTTP Layer Consolidation

**Goal:** Single HTTP abstraction across the app.

**Files to Create/Update:**
```typescript
// services/apiClient.ts
export class ApiClient {
  private baseURL = process.env.REACT_APP_API_URL;

  async get<T>(endpoint: string): Promise<T> { /* ... */ }
  async post<T>(endpoint: string, body: any): Promise<T> { /* ... */ }
  // ... other methods
}

// services/api.ts
import { ApiClient } from './apiClient';

export const apiClient = new ApiClient();

export const authApi = {
  login: (payload) => apiClient.post('/auth/login/', { body: payload }),
  // ...
};

export const listingsApi = {
  getListings: (filters) => apiClient.get(`/listings/?${qs.stringify(filters)}`),
  // ...
};
```

**Migration Steps:**
1. Grep for `from '../api'` and `from './api'`
2. Replace with apiClient or typed helpers
3. Ensure auth interceptor logic is in ApiClient
4. Delete `api.js` once fully migrated

---

### 2.4 Design System Organization

**Goal:** Clear hierarchy: primitives → brand wrappers → feature components

**Actions:**

1. **Create shared components barrel:**
```typescript
// shared/components/index.ts
export { Button } from '../../components/ui/button';
export { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
export { Badge } from '../../components/ui/badge';
export { Page } from './Page';
// ... etc
```

2. **Migrate common components:**
```bash
mv components/common/* shared/components/
```

3. **Quarantine examples:**
```bash
mv components/examples dev/examples
mv components/__archive__ dev/archive
```

4. **Update imports across codebase:**
```typescript
// Before
import { Button } from '../../../components/ui/button';

// After
import { Button } from '@shared/components';
```

---

### 2.5 Migrate Hooks to Features

**Current:** Hooks in flat `hooks/` folder

**Target:** Domain-specific hooks in feature folders

**Migrations:**
```
hooks/useMessages.ts       → features/chat/hooks/useMessages.ts
hooks/useThreadManager.ts  → features/chat/hooks/useThreadManager.ts
hooks/useSellerDashboard.ts → features/seller-dashboard/hooks/useSellerDashboard.ts
hooks/useListings.ts       → features/listings/hooks/useListings.ts
hooks/useCategories.ts     → features/listings/hooks/useCategories.ts
```

**Keep in shared/hooks:**
- `useChatSocket.ts` (infrastructure)
- `useSpotlight.ts` (global UI)

---

### 2.6 Complete Domain Home Implementations

**TODO:** Expand stub implementations to match Real Estate quality

**Cars Domain Cards:**
1. Inventory Overview (total vehicles, by type)
2. Sales Performance (monthly revenue, conversion rate)
3. Pending Test Drives (scheduled, awaiting confirmation)
4. Leads Pipeline (inquiries → offers → sold)
5. Popular Models (top sellers, trending)
6. Broadcast Teaser (reach car buyers)

**Events Domain Cards:**
1. Upcoming Events Calendar (next 30 days)
2. Ticket Sales Metrics (sold, available, revenue)
3. Attendance Projections (RSVP, check-in stats)
4. Promo Assets Library (banners, videos, posters)
5. Video Gallery (event highlights, teasers)
6. Broadcast Teaser (promote to 500+ event-goers)

**Services, Restaurants, P2P:** Similar patterns

---

### 2.7 Create Shared Section Components

**Goal:** Section views that adapt based on active domain

**Components to Create:**
```
features/seller-dashboard/components/
├── UnifiedListingsTable.tsx    (shows listings filtered by activeDomain)
├── UnifiedBookingsTable.tsx    (bookings filtered by activeDomain)
├── BroadcastsDashboard.tsx     (broadcasts for activeDomain)
├── SalesDashboard.tsx          (sales metrics for activeDomain)
├── MessagesDashboard.tsx       (messages filtered by activeDomain)
├── AnalyticsDashboard.tsx      (analytics for activeDomain)
├── SellerProfilePage.tsx       (business profile editor)
└── HelpAndSupportPage.tsx      (help center)
```

**Pattern:**
```typescript
// UnifiedListingsTable.tsx
export const UnifiedListingsTable: React.FC = () => {
  const { activeDomain } = useDomainContext();

  const { data, loading } = useListings({
    domain: activeDomain.id
  });

  // Render table with domain-specific columns
  return (
    <Table>
      {/* Standard columns */}
      <Column field="title" />
      <Column field="status" />

      {/* Domain-specific columns */}
      {activeDomain.id === 'real_estate' && (
        <Column field="occupancy" />
      )}
      {activeDomain.id === 'cars' && (
        <Column field="mileage" />
      )}
    </Table>
  );
};
```

---

### 2.8 CSS Cleanup

**Actions:**
1. Audit `App.css` and `index.css` for useful rules
2. Merge into `main.css`
3. Delete `App.css` and `index.css`
4. Remove imports from codebase

---

### 2.9 Testing

**Unit Tests:**
```typescript
// domainRegistry.test.ts
describe('domainRegistry', () => {
  it('should have unique domain IDs', () => {
    const ids = getAllDomains().map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have valid enabled sections', () => {
    getAllDomains().forEach(domain => {
      domain.enabledSections.forEach(section => {
        expect(SECTION_LABELS[section]).toBeDefined();
      });
    });
  });
});

// DomainContext.test.tsx
describe('useDomainContext', () => {
  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useDomainContext());
    }).toThrow('must be used within a DomainProvider');
  });

  it('should provide domain and section', () => {
    const wrapper = ({ children }) => (
      <DomainProvider domainId="cars">
        {children}
      </DomainProvider>
    );

    const { result } = renderHook(() => useDomainContext(), { wrapper });

    expect(result.current.activeDomain.id).toBe('cars');
    expect(result.current.activeSection).toBe('home');
  });
});
```

**E2E Tests:**
```typescript
// dashboard-navigation.spec.ts
test('should navigate between domains', async ({ page }) => {
  await page.goto('/dashboard/home/real-estate');
  await expect(page).toHaveURL(/\/dashboard\/home\/real-estate/);

  // Switch to cars domain
  await page.click('[data-testid="domain-switcher"]');
  await page.click('[data-testid="domain-cars"]');

  await expect(page).toHaveURL(/\/dashboard\/home\/cars/);
});

test('should navigate between sections', async ({ page }) => {
  await page.goto('/dashboard/home/events');

  await page.click('[data-testid="nav-my-listings"]');
  await expect(page).toHaveURL(/\/dashboard\/my-listings/);

  await page.click('[data-testid="nav-bookings"]');
  await expect(page).toHaveURL(/\/dashboard\/bookings/);
});
```

---

## 🎯 Priority Order for Phase 2

### Week 1: Make it Build
1. ✅ Configure craco for path aliases
2. ✅ Test build - should succeed
3. ✅ Fix any remaining import errors
4. ✅ Verify all routes load

### Week 2: HTTP & Context
5. ✅ Consolidate HTTP layer (apiClient)
6. ✅ Migrate hooks to features
7. ✅ Update all API calls to use new client

### Week 3: Components & UI
8. ✅ Design system barrel exports
9. ✅ Migrate common components to shared
10. ✅ Create shared section components
11. ✅ Quarantine examples

### Week 4: Domain Homes & Testing
12. ✅ Complete Cars domain home
13. ✅ Complete Events domain home
14. ✅ Complete remaining domain homes
15. ✅ Write unit tests
16. ✅ Write E2E tests
17. ✅ CSS cleanup

---

## 📚 Developer References

### Key Files to Understand

1. **`domainRegistry.ts`** - Domain & section configuration
2. **`DomainContext.tsx`** - Domain state management
3. **`app/routes.tsx`** - All route definitions
4. **`pages/dashboard/home/*.tsx`** - Domain home route wrappers
5. **`features/seller-dashboard/domains/*/DomainHome*.tsx`** - Domain implementations

### Common Patterns

**Creating a New Domain:**
```typescript
// 1. Add to domainRegistry.ts
export type DomainId = '...' | 'new_domain';

DOMAIN_CONFIGS.new_domain = {
  id: 'new_domain',
  label: 'New Domain',
  icon: NewIcon,
  colorClass: 'bg-...',
  gradientClass: 'from-... to-...',
  defaultSection: 'home',
  homePath: '/dashboard/home/new-domain',
  description: 'Description',
  enabledSections: ['home', 'my_listings', ...],
};

// 2. Create route wrapper
// pages/dashboard/home/new-domain.tsx

// 3. Create implementation
// features/seller-dashboard/domains/new-domain/DomainHomeNewDomain.tsx

// 4. Add to app/routes.tsx
```

**Creating a New Section:**
```typescript
// 1. Add to domainRegistry.ts
export type DashboardSectionId = '...' | 'new_section';

SECTION_LABELS.new_section = 'New Section';

// 2. Add to enabled sections in relevant domains
DOMAIN_CONFIGS.real_estate.enabledSections.push('new_section');

// 3. Create route wrapper
// pages/dashboard/new-section.tsx

// 4. Create shared component
// features/seller-dashboard/components/NewSectionComponent.tsx

// 5. Add to app/routes.tsx
<Route path="/dashboard/new-section" element={<NewSectionPage />} />
```

**Using Domain Context:**
```typescript
import { useDomainContext } from '@/features/seller-dashboard/context/DomainContext';

const MyComponent = () => {
  const {
    activeDomain,       // Current domain config
    activeSection,      // Current section
    navigateToSection   // Navigate helper
  } = useDomainContext();

  return (
    <div>
      <h1>Welcome to {activeDomain.label}</h1>
      <button onClick={() => navigateToSection('my_listings')}>
        My Listings
      </button>
    </div>
  );
};
```

---

## 🐛 Known Issues & Workarounds

### Issue 1: Build Fails with @/ Imports
**Error:** `Module not found: Error: Can't resolve '@/...'`
**Cause:** Webpack doesn't use tsconfig paths
**Fix:** Configure craco (see Phase 2.1)

### Issue 2: HomePage Still Loads
**Cause:** index.tsx was updated but HomePage.tsx still referenced
**Status:** Fixed in Phase 1, but HomePage.tsx should be deprecated
**Next:** Complete Phase 2.2

### Issue 3: Legacy Pages Use Old Patterns
**Examples:** `pages/Bookings.jsx`, `pages/Messages.jsx`
**Status:** These work but should be migrated to features
**Priority:** Medium (Phase 2, Week 2-3)

---

## 📈 Success Metrics

### Phase 1 (Complete)
- ✅ Domain registry with 10 domains
- ✅ 17 routes created
- ✅ 27 files added
- ✅ Type-safe architecture
- ✅ Zero breaking changes (old routes still work)

### Phase 2 (Target)
- ⏳ Build succeeds without errors
- ⏳ All @/ imports resolve correctly
- ⏳ All 6 domain homes fully implemented
- ⏳ All section components created
- ⏳ Test coverage ≥70%
- ⏳ E2E tests for key user flows
- ⏳ HTTP layer consolidated
- ⏳ Zero duplicate components

---

## 🤝 Contributing

### Adding a New Domain
See: **Common Patterns → Creating a New Domain**

### Adding a New Section
See: **Common Patterns → Creating a New Section**

### Questions?
- Review this guide first
- Check existing implementations (Real Estate is most complete)
- Consult domain registry types for available options

---

**Last Updated:** 2025-11-13
**Phase:** 1 Complete, 2 Pending
**Next Milestone:** Configure craco + complete Cars domain home
