# Frontend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architectural Model](#architectural-model)
3. [Entry Point & Shell](#entry-point--shell)
4. [Routing System](#routing-system)
5. [Feature Modules](#feature-modules)
6. [Legacy Layer](#legacy-layer)
7. [Shared Layer](#shared-layer)
8. [HTTP Client Architecture](#http-client-architecture)
9. [UI Design System](#ui-design-system)
10. [Testing & Dev Tools](#testing--dev-tools)
11. [Known Issues & TODOs](#known-issues--todos)

---

## Overview

The Easy Islanders frontend is a **React 18 Single Page Application (SPA)** built with a hybrid architecture:

- **New Architecture**: TypeScript-first, feature-sliced design under `src/features/*`, `src/app/*`, `src/shared/*`
- **Legacy Architecture**: JavaScript/JSX pages under `src/pages/*.jsx` with direct axios usage

### Technology Stack

- **Framework**: React 18.2 with TypeScript 4.9
- **Routing**: React Router v6
- **State Management**: React Context API (no Redux)
- **UI Library**: Hero UI + Shadcn-style components
- **Data Fetching**: @tanstack/react-query + custom hooks
- **HTTP Clients**:
  - Legacy: axios (src/api.js)
  - New: fetch-based ApiClient (src/services/apiClient.ts)
  - Alternative: axios wrapper (src/lib/axios.ts)
- **Build Tool**: Create React App 5.0.1
- **Styling**: Tailwind CSS 3.3.2

### Business Impact

This architecture enables:

1. **Multi-domain seller dashboard** (real estate, cars, services, events, restaurants, P2P)
2. **AI-powered chat interface** with inline recommendations
3. **Unified listings system** across all verticals
4. **Premium UX** with modern TypeScript components
5. **Incremental migration** from legacy to modern stack

---

## Architectural Model

### Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Single React SPA                         │
│  (New TypeScript architecture layered on legacy JS/JSX)     │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
    │  New    │      │  Legacy   │    │  Shared   │
    │  (TS)   │      │  (JS/JSX) │    │  (Mixed)  │
    └─────────┘      └───────────┘    └───────────┘
         │                 │                 │
    src/app/*        src/pages/*.jsx   src/shared/*
    src/features/*   src/api.js        src/hooks/*
    src/services/*   src/auth/*        src/lib/*
    src/types/*      src/components/*  src/components/ui/*
```

### Directory Structure

```
src/
├── app/                      # NEW: Application shell
│   ├── AppShell.tsx          # Layout wrapper with navbar, left rail
│   └── routes.tsx            # Central routing configuration
│
├── features/                 # NEW: Feature-sliced modules
│   ├── chat/                 # AI chat interface
│   ├── featured/             # Featured recommendations pane
│   ├── listings/             # Multi-category listings system
│   ├── bookings/             # Bookings feature (new)
│   ├── seller-dashboard/     # Multi-domain seller dashboard
│   │   ├── components/       # Shared dashboard components
│   │   ├── context/          # DomainContext
│   │   ├── hooks/            # useDomainMetrics, etc.
│   │   ├── layout/           # DashboardLayout, DashboardSidebar
│   │   └── domains/          # Domain-specific features
│   │       ├── real-estate/  # Real estate domain (primary)
│   │       ├── services/
│   │       ├── restaurants/
│   │       ├── events/
│   │       └── cars/
│   └── p2p-consumer/         # P2P marketplace
│
├── pages/                    # LEGACY + NEW: Route components
│   ├── *.jsx                 # LEGACY: JS pages (to migrate)
│   └── dashboard/            # NEW: Dashboard route wrappers
│       └── home/             # Domain home pages
│           ├── real-estate.tsx
│           ├── cars.tsx
│           ├── services.tsx
│           └── ...
│
├── shared/                   # Shared utilities (mixed TS/JS)
│   ├── components/           # Page, Header, Footer
│   ├── context/              # AuthContext, ChatContext, UiContext
│   ├── hooks/                # useChatSocket, useAuthMigration
│   ├── constants.ts          # MOCK_RESULTS, JOB_CHIPS
│   └── types.ts              # Shared TypeScript types
│
├── components/               # LEGACY + NEW: UI components
│   ├── auth/                 # AuthModal, AuthForm
│   ├── common/               # Legacy common components
│   ├── dashboard/            # Legacy dashboard components
│   └── ui/                   # NEW: Shadcn-style components
│       ├── button.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       └── ...
│
├── @/components/ui/          # DUPLICATE: Alias imports (to unify)
│
├── services/                 # NEW: API clients
│   ├── apiClient.ts          # Typed fetch-based client
│   └── api.ts                # Convenience wrappers
│
├── hooks/                    # Mixed old/new hooks
│   ├── useListings.ts        # NEW: Typed listings hook
│   ├── useCategories.ts      # NEW: Typed categories hook
│   └── useSellerDashboard.js # LEGACY: Dashboard hook
│
├── lib/                      # Utilities
│   ├── axios.ts              # Axios wrapper (alternative client)
│   ├── utils.ts              # General utilities
│   ├── categoryDesign.ts     # Domain icons/colors
│   └── animations.ts         # Animation utilities
│
├── types/                    # NEW: TypeScript types
│   ├── listing.ts
│   ├── category.ts
│   └── schema.ts
│
├── api.js                    # LEGACY: Axios client
├── auth/                     # LEGACY: Auth utilities
├── config.js                 # LEGACY: Config
├── dev/                      # Dev tools (DebugMemoryHUD)
├── layout/                   # LEGACY: Layout components
└── __tests__/                # Tests
```

---

## Entry Point & Shell

### 1. Entry Point: `src/index.tsx`

**Purpose**: Bootstrap React 18 app with all providers.

**Provider Stack** (order matters):

```tsx
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <HeroUIProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UiProvider>
              <ChatProvider>
                <AppShell>
                  <AppRoutes />
                </AppShell>
              </ChatProvider>
            </UiProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HeroUIProvider>
  </React.StrictMode>
);
```

**Global Setup**:
- Axios interceptor to attach auth tokens to all requests
- Global styles import
- React Query client configuration

**Key Files**:
- `src/index.tsx` - Entry point
- `src/index.css` - Global styles (Tailwind directives)

---

### 2. App Shell: `src/app/AppShell.tsx`

**Purpose**: Global layout wrapper for all routes.

**Responsibilities**:

1. **Top Navbar**: `Navbar04` from `src/components/ui/shadcn-io/navbar-04.tsx`
2. **Auth Modal**: `AuthModal` from `src/components/auth/AuthModal`
3. **Conditional Left Rail**: Visible on `/` and `/chat*` routes
4. **Main Content Area**: Renders routed pages (`children`)
5. **Debug HUD**: `DebugMemoryHUD` (toggled with Cmd/Ctrl+M)

**Layout Logic**:

```tsx
const AppShell = ({ children }) => {
  const location = useLocation();

  // Determine layout based on route
  const showLeftRail = location.pathname === '/' || location.pathname.startsWith('/chat');
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <>
      <Navbar04 />
      <AuthModal />

      <div className="flex">
        {showLeftRail && <LeftRail />}

        <main className={isDashboard ? 'dashboard-layout' : 'chat-layout'}>
          {children}
        </main>
      </div>

      <DebugMemoryHUD />
    </>
  );
};
```

**Integrations**:
- `useAuthMigration()` - Bridges legacy tokens to new flow
- `useUnreadCount()` - Syncs unread message count into AuthContext
- `useLocation()` - React Router hook for route detection

---

### 3. Central Router: `src/app/routes.tsx`

**Purpose**: Single source of truth for all app routes.

**Route Categories**:

#### Core Routes
```tsx
<Route path="/" element={<ChatPage />} />
<Route path="/chat/:conversationId" element={<ChatPage />} />
```

#### Legacy Routes (to be migrated)
```tsx
<Route path="/listings/create" element={<CreateListingPage />} />
<Route path="/create-listing" element={<Navigate to="/listings/create" />} />
<Route path="/bookings" element={<BookingsPage />} />
<Route path="/messages" element={<MessagesPage />} />
<Route path="/requests" element={<RequestsPage />} />
```

#### Unified Seller Dashboard
```tsx
<Route path="/dashboard" element={<DashboardIndexPage />} />
<Route path="/dashboard/my-listings" element={<DashboardMyListingsPage />} />
<Route path="/dashboard/bookings" element={<DashboardBookingsPage />} />
<Route path="/dashboard/seller-inbox" element={<DashboardSellerInboxPage />} />
<Route path="/dashboard/broadcasts" element={<DashboardBroadcastsPage />} />
<Route path="/dashboard/sales" element={<DashboardSalesPage />} />
<Route path="/dashboard/messages" element={<DashboardMessagesPage />} />
<Route path="/dashboard/analytics" element={<DashboardAnalyticsPage />} />
<Route path="/dashboard/profile" element={<DashboardProfilePage />} />
<Route path="/dashboard/help" element={<DashboardHelpPage />} />
```

#### Domain Home Routes (Real Estate)
```tsx
<Route path="/dashboard/home/real-estate" element={<RealEstateHomePage />} />
<Route path="/dashboard/home/real-estate/portfolio" element={<PortfolioPage />} />
<Route path="/dashboard/home/real-estate/location" element={<LocationPage />} />
<Route path="/dashboard/home/real-estate/occupancy" element={<OccupancyPage />} />
<Route path="/dashboard/home/real-estate/earnings" element={<EarningsPage />} />
<Route path="/dashboard/home/real-estate/sales-pipeline" element={<SalesPipelinePage />} />
<Route path="/dashboard/home/real-estate/requests" element={<RequestsPage />} />
<Route path="/dashboard/home/real-estate/calendar" element={<CalendarPage />} />
<Route path="/dashboard/home/real-estate/maintenance" element={<MaintenancePage />} />
<Route path="/dashboard/home/real-estate/owners-and-tenants" element={<OwnersTenantsPage />} />
<Route path="/dashboard/home/real-estate/pricing-and-promotions" element={<PricingPromotionsPage />} />
<Route path="/dashboard/home/real-estate/channels-and-distribution" element={<ChannelsPage />} />
<Route path="/dashboard/home/real-estate/projects" element={<ProjectsPage />} />
```

#### Other Domain Home Routes
```tsx
<Route path="/dashboard/home/cars" element={<CarsHomePage />} />
<Route path="/dashboard/home/events" element={<EventsHomePage />} />
<Route path="/dashboard/home/services" element={<ServicesHomePage />} />
<Route path="/dashboard/home/restaurants" element={<RestaurantsHomePage />} />
<Route path="/dashboard/home/p2p" element={<P2PHomePage />} />
```

#### Fallback
```tsx
<Route path="*" element={<Navigate to="/" />} />
```

**Pattern**: Dashboard routes → `pages/dashboard/*.tsx` → those wrap feature modules from `features/seller-dashboard/...`

---

## Feature Modules

### 1. Chat + Featured Panel

**Location**: `src/features/chat/` and `src/features/featured/`

**Purpose**: AI-powered chat interface with inline recommendations.

#### Chat Feature (`src/features/chat/`)

**Main Component**: `ChatPage.tsx`

**Composes**:
- `ChatHeader` - Conversation title, actions
- `ChatThread` - Message history with animations
- `Composer` - Message input with send button
- `TypingDots` - Loading indicator
- `ConnectionStatus` - WebSocket connection status
- `InlineRecsCarousel` - Inline recommendations within chat
- `FeaturedPane` (from `features/featured/`)

**Integrations**:
- `useChat()` - ChatContext for messages, send, threadId
- `useUi()` - UiContext for activeJob
- `useChatSocket()` - WebSocket connection management

**Key Files**:
```
features/chat/
├── ChatPage.tsx              # Main page component
├── components/
│   ├── ChatHeader.tsx
│   ├── ChatThread.tsx
│   ├── Composer.tsx
│   ├── TypingDots.tsx
│   ├── ConnectionStatus.tsx
│   ├── InlineRecsCarousel.tsx
│   └── RecommendationCard.tsx
└── hooks/
    └── useChat.ts
```

#### Featured Panel (`src/features/featured/`)

**Main Component**: `FeaturedPane.tsx`

**Purpose**: Side panel showing curated recommendations in lanes.

**Composes**:
- `DealsLane` - Special deals
- `EventsLane` - Upcoming events
- `ThingsToDoLane` - Activities and attractions

**Data Types**: Uses domain-agnostic `RecItem`, `LaneCard` from `src/shared/types.ts`

**Key Files**:
```
features/featured/
├── FeaturedPane.tsx
├── lanes/
│   ├── DealsLane.tsx
│   ├── EventsLane.tsx
│   └── ThingsToDoLane.tsx
└── constants.ts
```

---

### 2. Seller Dashboard (Multi-Domain)

**Location**: `src/features/seller-dashboard/`

**Purpose**: Unified multi-domain dashboard for sellers/agents.

**Architecture**: Domain-agnostic shell + domain-specific modules.

#### Common Components

```
features/seller-dashboard/components/
├── SellerDashboard.tsx           # High-level aggregated view
├── DomainMetricsCard.tsx         # Metrics card per domain
├── KPICard.tsx                   # Key performance indicator card
├── PremiumDashboard.tsx          # Premium UI variant
├── UnifiedListingsTable.tsx      # Cross-domain listings table
└── UnifiedBookingsTable.tsx      # Cross-domain bookings table
```

#### Context & Hooks

**DomainContext** (`context/DomainContext.tsx`):
- Provides: `domainId` (e.g., "real_estate"), `currentSection`
- Used to scope data fetching and UI per domain

**Hooks**:
- `useDomainContext()` - Read current domain from context
- `useDomainMetrics()` - Unified fetch for metrics, listings, bookings across domains

#### Layout

**DashboardLayout** (`layout/DashboardLayout.tsx`):
- Inner layout for all dashboard pages
- Composes:
  - `DashboardSidebar` - Domain-specific navigation
  - Main content area
  - Breadcrumbs

**DashboardSidebar** (`layout/DashboardSidebar.tsx`):
- Navigation items from `layout/NavItems.ts`
- Switches based on `domainId`

#### Domain-Specific Modules

##### Real Estate Domain (`domains/real-estate/`)

**Main Component**: `DomainHomeRealEstate.tsx`

**Submodules**:

```
domains/real-estate/
├── DomainHomeRealEstate.tsx
├── overview/
│   ├── RealEstateOverviewPage.tsx
│   └── RealEstateOverviewPageEnhanced.tsx
├── portfolio/
│   ├── PortfolioPage.tsx
│   └── PortfolioTableEnhanced.tsx
├── location/
│   ├── LocationPage.tsx
│   └── LocationPageEnhanced.tsx
├── occupancy/
│   ├── OccupancyPage.tsx
│   └── OccupancyPageEnhanced.tsx
├── earnings/
│   ├── EarningsPage.tsx
│   └── EarningsPageEnhanced.tsx
├── sales-pipeline/
│   ├── SalesPipelinePage.tsx
│   └── SalesPipelinePageEnhanced.tsx
├── requests/
│   └── RequestsPage.tsx
├── calendar/
│   └── CalendarPage.tsx
├── maintenance/
│   └── MaintenancePage.tsx
├── owners-and-tenants/
│   ├── OwnersTenantsPage.tsx
│   └── components/
│       ├── OwnersTable.tsx
│       └── TenantsTable.tsx
├── pricing-and-promotions/
│   └── PricingPromotionsPage.tsx
├── channels-and-distribution/
│   └── ChannelsPage.tsx
├── projects/
│   └── ProjectsPage.tsx
├── api/
│   └── realEstateDashboardApi.ts   # Data fetchers
└── hooks/
    ├── useRealEstateMetrics.ts
    └── usePortfolio.ts
```

**Data Fetching**: `api/realEstateDashboardApi.ts` exports:
```ts
export const getRealEstateMetrics = async (userId: string) => { /* ... */ };
export const getPortfolioData = async (filters: PortfolioFilters) => { /* ... */ };
export const getOccupancyData = async () => { /* ... */ };
// etc.
```

##### Other Domains

```
domains/
├── services/
│   └── DomainHomeServices.tsx
├── restaurants/
│   └── DomainHomeRestaurants.tsx
├── events/
│   └── DomainHomeEvents.tsx
└── cars/
    └── DomainHomeCars.tsx
```

Each has simple `DomainHome*` components with basic metrics.

#### Dashboard Routes Pattern

**Route Wrapper** (`pages/dashboard/home/real-estate.tsx`):

```tsx
const RealEstateHomePage = () => (
  <DomainProvider domainId="real_estate" initialSection="home">
    <DashboardLayout>
      <RealEstateOverviewPage />
    </DashboardLayout>
  </DomainProvider>
);
```

All real estate dashboard routes follow this pattern:
1. Wrap with `DomainProvider` (sets context)
2. Use `DashboardLayout` (provides sidebar + breadcrumbs)
3. Render feature component from `features/seller-dashboard/domains/real-estate/*`

---

### 3. Listings System (Multi-Category Marketplace)

**Location**: `src/features/listings/`

**Purpose**: Unified listings system across all verticals (real estate, vehicles, services, etc.).

#### Components

```
features/listings/components/
├── DynamicFieldRenderer.tsx      # Render fields based on schema
├── DynamicListingForm.tsx        # Form builder from category schema
├── ListingCard.tsx               # Generic listing card
├── ListingCardFactory.tsx        # Factory pattern: switches card per domain
├── RealEstateListing.tsx         # Real estate specific card
├── VehicleListing.tsx            # Vehicle specific card
└── ServiceListing.tsx            # Service specific card
```

**ListingCardFactory Pattern**:

```tsx
export const ListingCardFactory = ({ listing }) => {
  switch (listing.category_slug) {
    case 'real-estate':
      return <RealEstateListing listing={listing} />;
    case 'vehicles':
      return <VehicleListing listing={listing} />;
    case 'services':
      return <ServiceListing listing={listing} />;
    default:
      return <ListingCard listing={listing} />;
  }
};
```

#### Pages

```
features/listings/pages/
├── BrowseListingsPage.tsx        # Browse/search listings
└── CreateListingPage.tsx         # Create new listing (new flow)
```

#### Types

**Type Definitions** (`src/types/`):

```
types/
├── listing.ts          # BaseListing, Listing, ListingDetail
├── category.ts         # Category, SubCategory, SchemaField, CategorySchema
└── schema.ts           # Response types: ListingsResponse, CategoriesResponse
```

**Example** (`listing.ts`):

```ts
export interface BaseListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_slug: string;
  subcategory_slug?: string;
  location: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Listing extends BaseListing {
  dynamic_fields: Record<string, any>;  // Category-specific fields
  seller: {
    id: string;
    name: string;
    avatar?: string;
  };
}
```

#### API Integration

**Hooks**:

```
hooks/
├── useListings.ts        # Typed hook using apiClient
└── useCategories.ts      # Typed hook using apiClient
```

**Example** (`useListings.ts`):

```ts
export const useListings = (filters?: ListingFilters) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => apiClient.getListings(filters),
  });
};
```

**API Client** (`src/services/api.ts`):

```ts
export const getRecs = (categorySlug: string) => apiClient.get(`/api/recs/${categorySlug}/`);
export const getFeatured = () => apiClient.get('/api/featured/');
export const getListings = (filters: ListingFilters) => apiClient.getListings(filters);
```

---

### 4. P2P Consumer Marketplace

**Location**: `src/features/p2p-consumer/`

**Purpose**: Peer-to-peer barter/exchange marketplace.

**Components**:

```
features/p2p-consumer/components/
├── P2PMarketplace.tsx           # Main marketplace view
├── CreateP2PPostDialog.tsx      # Create post dialog
├── BrowseP2PPosts.tsx           # Browse posts
├── MyP2PPosts.tsx               # My active posts
└── MyExchangeProposals.tsx      # Exchange proposals
```

**Hooks**:
- `useP2PPosts()` - Data fetching for P2P posts

**Entry Point**: `index.ts` exports unified marketplace component

---

### 5. Bookings

**Location**: `src/features/bookings/` (new) + `src/pages/Bookings.jsx` (legacy)

#### New Bookings Feature (`src/features/bookings/`)

**Components**:

```
features/bookings/
├── BookingsPage.tsx
├── components/
│   ├── BookingCard.tsx
│   ├── BookingDetail.tsx
│   ├── BookingWizard.tsx
│   └── StatusBadge.tsx
└── api/
    └── bookingsApi.ts            # Typed client for bookings domain
```

#### Legacy Bookings Page (`src/pages/Bookings.jsx`)

**Current Usage**:
- JS/JSX with direct axios calls
- Uses `Page` layout from `src/shared/components/Page`
- Still routed under `/bookings` in `routes.tsx`

**Migration Path**: See [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md)

---

## Legacy Layer

**Location**: `src/pages/*.jsx`

**Purpose**: Original JavaScript pages (to be migrated to TypeScript features).

### Legacy Pages

```
pages/
├── HomePage.tsx              # Alternative shell (not currently used)
├── CreateListing.jsx         # Old create listing flow
├── Bookings.jsx              # Old bookings page
├── Messages.jsx              # Old messages page
├── Requests.jsx              # Old requests page
├── Profile.jsx               # User profile
├── Settings.jsx              # User settings
└── UIShowcase.tsx            # Component showcase
```

### Characteristics

- **Language**: JavaScript (JSX)
- **HTTP Client**: Direct axios via `src/api.js` or `config`
- **Layout**: Uses `Page` component from `src/shared/components/Page`
- **State**: Local state or legacy context
- **Marked in routes**: Comments say "Legacy routes (to be migrated)"

### Migration Strategy

1. **Wrap** legacy pages in feature modules
2. **Refactor** to TypeScript incrementally
3. **Replace** with new feature pages
4. **Remove** from routes once parity is achieved

See [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md) for detailed migration roadmap.

---

## Shared Layer

### 1. Shared Contexts

**Location**: `src/shared/context/`

#### AuthContext (`AuthContext.jsx`)

**Purpose**: Manage authentication state globally.

**Provides**:

```js
{
  isAuthenticated: boolean,
  user: User | null,
  showAuthModal: boolean,
  authMode: 'login' | 'signup',
  authStep: 'credentials' | 'verification' | 'success',
  unreadCount: number,
  login: (credentials) => Promise<void>,
  signup: (credentials) => Promise<void>,
  logout: () => void,
  openAuthModal: (mode) => void,
  closeAuthModal: () => void,
}
```

**Integration**:
- Uses `config` for endpoints
- Uses `http` from `src/api.js` (legacy axios)
- Uses `tokenStore` utilities for token management

#### ChatContext (`ChatContext.tsx`)

**Purpose**: Manage chat state and WebSocket connection.

**Provides**:

```ts
{
  messages: Message[],
  threadId: string | null,
  connectionStatus: 'connected' | 'disconnected' | 'connecting',
  send: (message: string) => Promise<void>,
  clearMessages: () => void,
  memoryDebugInfo: MemoryDebugInfo | null,
  correlationId: string | null,
}
```

**Integration**:
- Talks to backend via `config` + HTTP/WebSocket
- Uses `useChatSocket()` hook for connection management

#### UiContext (`UiContext.tsx`)

**Purpose**: Manage UI state (job selection, tabs, left rail).

**Provides**:

```ts
{
  activeJob: string,              // e.g., 'real_estate', 'general'
  setActiveJob: (job: string) => void,
  activeTab: string,
  setActiveTab: (tab: string) => void,
  leftRailOpen: boolean,
  toggleLeftRail: () => void,
}
```

---

### 2. Shared Hooks

**Location**: `src/hooks/` and `src/shared/hooks/`

#### Key Hooks

**Authentication**:
- `useAuthMigration.js` - Bridges old tokens to new AuthContext

**Messaging**:
- `useMessages.js` - Messaging layer
- `useThreadManager.js` - Thread management
- `useChatSocket.ts` - WebSocket connection

**Data Fetching** (New):
- `useListings.ts` - Typed listings hook
- `useCategories.ts` - Typed categories hook

**Data Fetching** (Legacy):
- `useSellerDashboard.js` - Dashboard data using `api.js`

**Actions**:
- `useHITLGate.js` - Human-in-the-loop gating for actions

---

### 3. Shared Types

**Location**: `src/shared/types.ts` and `src/types/*`

**Shared Types** (`shared/types.ts`):

```ts
export interface RecItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  category?: string;
}

export interface LaneCard {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badge?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**Domain Types** (`types/`):
- `listing.ts` - Listing interfaces
- `category.ts` - Category and schema interfaces
- `schema.ts` - API response types

---

## HTTP Client Architecture

⚠️ **Critical Inconsistency**: Three HTTP stacks currently coexist.

### 1. Legacy Axios Client (`src/api.js`)

**Exports**: `http` (axios instance)

**Used By**:
- `AuthContext.jsx`
- `useSellerDashboard.js`
- Legacy pages (`CreateListing.jsx`, `Bookings.jsx`, etc.)

**Configuration**:

```js
const http = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
http.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 2. New Typed Fetch Client (`src/services/apiClient.ts`)

**Exports**: `ApiClient` class and default instance

**Used By**:
- `useListings.ts`
- `useCategories.ts`
- `__tests__/listings.integration.test.ts`

**Example**:

```ts
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const token = getAccessToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ... post, put, delete, etc.
}

export const apiClient = new ApiClient(config.apiBaseUrl);
```

---

### 3. Axios Wrapper (`src/lib/axios.ts`)

**Exports**: `api` (axios instance with interceptor)

**Used By**: Some newer hooks/features

**Configuration**:

```ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Global Axios Interceptor (`src/index.tsx`)

**Purpose**: Attach auth token to all axios requests globally.

```tsx
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### ⚠️ TODO: Consolidate HTTP Clients

**Current State**: Three HTTP clients causing:
- Inconsistent error handling
- Duplicate token management
- Mixed TypeScript/JavaScript usage

**Goal**: Single typed HTTP client for all requests.

**Recommendation**:
1. Standardize on `apiClient.ts` (fetch-based, typed)
2. Migrate all `api.js` usage to `apiClient`
3. Remove `lib/axios.ts` and global interceptor
4. Add ESLint rule to prevent direct axios imports

See [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md) for detailed plan.

---

## UI Design System

⚠️ **Critical Duplication**: Two overlapping UI kits exist.

### 1. Main UI Kit (`src/components/ui/*`)

**Components**:

```
components/ui/
├── button.tsx
├── card.tsx
├── tabs.tsx
├── badge.tsx
├── table.tsx
├── dialog.tsx
├── skeleton.tsx
├── input.tsx
├── select.tsx
├── textarea.tsx
├── calendar.tsx
├── LocationMapPicker.tsx
├── ImageUploadWithPreview.tsx
├── animated-wrapper.tsx
├── motion-wrapper.tsx
└── shadcn-io/
    └── navbar-04.tsx
```

**Style**: Shadcn-style components with Tailwind CSS

**Usage**: Primary UI kit for new features

---

### 2. Alias UI Kit (`src/@/components/ui/*`)

**Components**: Duplicates of main kit

```
@/components/ui/
├── button.ts
├── card.ts
├── badge.ts
├── tabs.ts
└── table.ts
```

**Purpose**: Imported via alias paths like `@/components/ui/tabs`

**Issue**: Creates duplication and import confusion

---

### 3. Legacy Components

**Location**: `src/components/*` (non-ui subdirectories)

```
components/
├── auth/
│   ├── AuthModal.tsx
│   └── AuthForm.tsx
├── common/
│   └── (legacy common components)
└── dashboard/
    └── (legacy dashboard components)
```

**Layout Components** (`src/layout/`):
- `Header.tsx` - Older header (superseded by Navbar04)

---

### 4. Design System Utilities

**Category Design** (`src/lib/categoryDesign.ts`):

**Purpose**: Canonical map from domain/category slug → icon + gradient + color

```ts
export const categoryDesign = {
  'real-estate': {
    icon: 'building',
    gradient: 'from-blue-500 to-blue-700',
    color: 'blue',
  },
  'car-rental': {
    icon: 'car',
    gradient: 'from-red-500 to-red-700',
    color: 'red',
  },
  // ... etc.
};
```

**Other Utilities**:
- `lib/spacing.ts` - Spacing constants
- `lib/animations.ts` - Animation utilities
- `lib/utils.ts` - General utilities (cn, etc.)

---

### ⚠️ TODO: Unify UI Kits

**Current State**: Duplicate components causing:
- Import confusion (`components/ui/button` vs `@/components/ui/button`)
- Inconsistent styling
- Maintenance overhead

**Goal**: Single source of truth for UI components.

**Recommendation**:
1. Consolidate all components in `src/components/ui/*`
2. Remove `src/@/components/ui/*` duplicates
3. Update all imports to use `@/components/ui/*` (or remove alias)
4. Add ESLint rule to enforce single import path

See [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md) for detailed plan.

---

## Testing & Dev Tools

### 1. Integration Tests

**Location**: `src/__tests__/listings.integration.test.ts`

**Purpose**: Integration tests against live backend API.

**Example**:

```ts
describe('Listings API Integration', () => {
  it('should fetch categories', async () => {
    const response = await apiClient.get('/api/categories/');
    expect(response).toHaveProperty('results');
  });

  it('should fetch listings', async () => {
    const response = await apiClient.get('/api/listings/');
    expect(response).toHaveProperty('results');
  });
});
```

---

### 2. Component Tests

**Location**: `src/components/*/__tests__/`

**Types**:
- Snapshot tests
- Unit tests for Button, Card, Chip, chat messages, etc.

**Example** (`Button.test.tsx`):

```tsx
describe('Button', () => {
  it('renders correctly', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container).toMatchSnapshot();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

### 3. Debug Memory HUD

**Location**: `src/dev/DebugMemoryHUD.tsx`

**Purpose**: Overlay to debug AI memory usage, correlation IDs, token counts.

**Activation**:
- Environment variable: `REACT_APP_DEBUG_HUD=true`
- Query param: `?debugHUD=1`
- Keyboard shortcut: Cmd/Ctrl+M

**Features**:
- Shows memory stats from ChatContext
- Displays correlation IDs for request tracing
- Token usage breakdown
- Connection status

---

## Known Issues & TODOs

### 1. HTTP Client Inconsistency

**Issue**: Three HTTP clients coexist (`api.js`, `apiClient.ts`, `lib/axios.ts`)

**Impact**:
- Inconsistent error handling
- Duplicate token management
- Mixed TS/JS usage

**TODO**:
- [ ] Standardize on `apiClient.ts`
- [ ] Migrate all `api.js` usage
- [ ] Remove `lib/axios.ts`
- [ ] Add ESLint rule to prevent direct axios imports

---

### 2. UI Kit Duplication

**Issue**: Two UI kits (`components/ui/*` vs `@/components/ui/*`)

**Impact**:
- Import confusion
- Inconsistent styling
- Maintenance overhead

**TODO**:
- [ ] Consolidate in `src/components/ui/*`
- [ ] Remove `@/components/ui/*`
- [ ] Update all imports
- [ ] Add ESLint rule for single import path

---

### 3. Legacy Pages Migration

**Issue**: Legacy JS/JSX pages still in use

**Impact**:
- Inconsistent UX
- Mixed TS/JS codebase
- Harder to maintain

**TODO**:
- [ ] Migrate `/bookings` to `features/bookings`
- [ ] Migrate `/messages` to `features/messaging`
- [ ] Migrate `/requests` to `features/seller-dashboard`
- [ ] Migrate `/listings/create` to `features/listings`
- [ ] Remove legacy pages from routes

---

### 4. Type Coverage

**Issue**: Partial TypeScript adoption

**TODO**:
- [ ] Track TypeScript coverage
- [ ] Ensure new dashboard features are TSX
- [ ] Add strict type checking
- [ ] Convert remaining hooks to TS

---

### 5. Routing Consistency

**Issue**: `HomePage.tsx` exists but is not used (potential second router)

**TODO**:
- [ ] Verify `HomePage.tsx` is not accidentally used
- [ ] Remove or document its purpose
- [ ] Ensure single source of truth for routing

---

### 6. Testing Coverage

**TODO**:
- [ ] Add unit tests for all feature modules
- [ ] Add integration tests for dashboard domains
- [ ] Add E2E tests for critical user flows
- [ ] Set up CI pipeline for automated testing

---

## Best Practices

### 1. Component Organization

**Feature-First Structure**:

```
features/
└── <feature-name>/
    ├── components/       # Feature-specific components
    ├── hooks/            # Feature-specific hooks
    ├── api/              # Feature-specific API clients
    ├── types/            # Feature-specific types
    └── <FeatureName>Page.tsx  # Main page component
```

### 2. Routing Pattern

**Dashboard Routes**:

```tsx
// pages/dashboard/home/<domain>.tsx
const DomainHomePage = () => (
  <DomainProvider domainId="<domain>" initialSection="home">
    <DashboardLayout>
      <DomainOverviewPage />
    </DashboardLayout>
  </DomainProvider>
);
```

### 3. Data Fetching

**Use Typed Hooks**:

```tsx
// Prefer this:
const { data, isLoading, error } = useListings(filters);

// Over this:
const [data, setData] = useState(null);
useEffect(() => {
  api.get('/api/listings/').then(setData);
}, []);
```

### 4. Component Imports

**Use Barrel Exports**:

```tsx
// features/<feature>/index.ts
export { FeaturePage } from './FeaturePage';
export { FeatureComponent } from './components/FeatureComponent';

// Usage:
import { FeaturePage, FeatureComponent } from 'features/<feature>';
```

---

## Migration Checklist

When migrating legacy code to new architecture:

- [ ] Convert JS/JSX to TypeScript
- [ ] Replace `api.js` with `apiClient.ts`
- [ ] Use `DomainProvider` for dashboard pages
- [ ] Use typed hooks (`useListings`, etc.)
- [ ] Import UI from `components/ui/*` (not `@/components/ui/*`)
- [ ] Add unit tests
- [ ] Update routes in `app/routes.tsx`
- [ ] Remove legacy page once parity is achieved

---

## Support & Resources

**Key Documentation**:
- [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md) - Migration roadmap
- [REAL_ESTATE_FRONTEND_MAP.md](./REAL_ESTATE_FRONTEND_MAP.md) - Real estate domain map
- [API_CONTRACTS.md](../API_CONTRACTS.md) - Backend API contracts
- [REAL_ESTATE_DATA_MODEL.md](../REAL_ESTATE_DATA_MODEL.md) - Backend data model

**Contact**:
- Frontend architecture questions: Review this doc first
- Legacy code migration: See FRONTEND_MIGRATION_PLAN.md
- Real estate domain: See REAL_ESTATE_FRONTEND_MAP.md

**Last Updated**: 2025-11-14 (v1.0 - Initial Architecture Snapshot)
