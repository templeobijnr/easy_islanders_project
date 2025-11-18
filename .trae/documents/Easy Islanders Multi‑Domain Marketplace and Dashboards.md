## Repo Scan Summary
- Domains: real estate, vehicles (cars), events, services, products; domain registry and labels in `frontend/src/features/seller-dashboard/domainRegistry.ts`.
- Frontend: React 18, TypeScript, React Router v6, TanStack Query, Axios, Tailwind + Shadcn + Radix; routes in `frontend/src/app/routes.tsx`.
- Explore: `frontend/src/features/explore/ExplorePage.tsx` with category/subcategory pills, filters, lanes, grid and detail modal; listings fetched via `/api/listings` and category endpoints.
- AI Chat: HTTP `POST /api/chat/` and WebSocket stream; context and socket in `frontend/src/shared/context/ChatContext.tsx` (send at `frontend/src/shared/context/ChatContext.tsx:224`) and `frontend/src/shared/hooks/useChatSocket.ts`.
- Real Estate Dashboard: portfolio and overview under `frontend/src/features/seller-dashboard/domains/real-estate/*`; active portfolio UI in `frontend/src/features/seller-dashboard/domains/real-estate/portfolio/PortfolioManagementPage.tsx:126`.
- Backend (Django/DRF): shared `Listing` + per-domain detail models; categories via ViewSets; real-estate portfolio/search/bookings endpoints; chat agents pipeline.

## Public Site Stack
- Header: consolidate brand, global nav, business CTA in `AppShell` and navbar components; ensure consistent top-level layout.
- Hero: centralized multi-domain `GlobalSearchBar` with domain selector; reuse Explore search state to avoid duplication.
- AI Chat: place `ChatPage` section directly under Hero; ensure recommendations render listing cards consistent with Explore.
- Explore: clear domain switching (All/Real Estate/Vehicles/Events/Services/Shopping), filters and sorting, infinite scroll; cards align with shared design tokens.

## Design System & Cards
- Unify tokens: typography scale, spacing, colors, elevation; codify as Tailwind theme + shared UI primitives.
- Shared card pattern: image → title → key info → price → location → secondary badges; domain-specific details in subtext/badges.
- Implement domain adapters that map backend `Listing` + dynamic fields to card props for Explore and Chat.

## Explore Architecture
- State: `activeCategory`, `activeSubcategory`, `searchQuery`, `filters`, `sortBy`, `page` using `useExplore` + React Query.
- Data: query `/api/listings` with structured filters (domain, price range, location, attributes); hydrate lanes client-side.
- Components: `CategoryPillButtons`, `SubcategoryPillButtons`, `AdvancedFiltersSidebar`, `ExploreGrid`, `ListingCard`, `ListingDetailModal`, `HorizontalLane`, `ExploreSpotlight`.
- Performance: debounce search, cache queries, infinite scroll/pagination, skeletons; SSR optional in future.

## AI Chat Integration
- Flow: `ChatContext.send()` → `POST /api/chat/` → agent → WebSocket `assistant_message` with recommendations → `InlineRecsCarousel` renders `RecommendationCard`.
- Consistency: use same card adapters as Explore; include structured metadata in agent `recommendations` payload for filters and booking.
- Actions: availability check, booking, contact requests; ensure endpoints are aligned and authenticated.

## Business Dashboards
- Shell: `DashboardLayout` + `DashboardSidebar`; `DomainProvider` supplies active domain.
- Real Estate: complete Portfolio flows (search/filter/sort/grid/map), slide-overs (messages/requests/bookings), calendar modal, listing CRUD; ensure data invalidation on create/edit.
- Vehicles, Events, Services, Products: implement domain homes with create/edit/delete flows, status, analytics; reusable tables and editors; booking/availability where applicable.
- Data Flow: all dashboard mutations sync to Explore via shared APIs and to AI via agent search layer.

## Data Models & APIs
- Backend: generic `Listing` with `category` and `dynamic_fields`; OneToOne detail models per domain (CarListing, EventListing, ServiceListing, ProductListing).
- Slugs: standardize domain slugs (use underscore or hyphen consistently) across `Category.slug`, `Listing.domain`, and service classes.
- Filters: define common query params (domain, status, price, location, date, attributes); implement server-side filtering + sorting; index frequently used fields.
- Categories: expose `GET /api/categories` and subcategories for Explore and dashboards.
- AI: agent search uses the same data source; ensure card formatter emits consistent fields used by Explore cards.

## Maps, Media, Rendering
- Maps: shared `PropertyLocationMap` and generic map for other domains; store coordinates and render snippets on cards and detail pages.
- Media: upload, reorder, delete; cover image selection; apply size/aspect constraints; endpoints per domain.
- Detail Pages: gallery, full attributes, map, contact/booking actions; reuse across Explore and Chat deep links.

## Implementation Phases
1. Unify domain slugs and shared TypeScript types; adapters for card props.
2. Landing: implement Header → Hero → AI Chat → Explore stack; wire shared search state.
3. Real Estate Dashboard: finish Portfolio slide-overs and calendar; robust CRUD and data sync.
4. Vehicles/Events/Services/Products: implement editors and tables; status and analytics.
5. AI: consolidate recommendation payload and card formatter; booking/availability flows.
6. Explore: refine filters, lanes, performance; pagination/infinite scroll.
7. Analytics & Insights: listings views, contact clicks, bookings across domains.

## Risks & Assumptions
- Assumption: DRF ViewSets for categories/listings are stable; agent payloads can be normalized without breaking consumers.
- Risk: slug inconsistency (`real-estate` vs `real_estate`) may cause filter mismatches; address early.
- Security: never log or expose secrets; ensure authenticated endpoints for dashboard actions.

Please confirm this plan; I will proceed to implement the cohesive landing stack, shared card adapters, and complete the Real Estate Portfolio flows first, then extend to other domains and AI integration.