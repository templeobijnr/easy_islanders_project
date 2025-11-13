# Multi‑Domain AI Marketplace — Engineering Plan

## Goals
- Unified cross‑domain marketplace with AI discovery and seller automations
- Public storefronts per seller with domain tabs and CTAs (Book/Buy)
- Seller domain dashboards for Real Estate, Vehicles, Services/Appointments, Events/Activities, Products/P2P
- Robust API contracts, observability, and a clear delivery sequence

---

## Frontend Plan

### Explore Domain Set (Locked)
- Domains to surface in Explore (in this order):
  1. Accommodation / Real Estate (slug: `real-estate`)
  2. Services (slug: `services`)
  3. Events (slug: `events`)
  4. Activities (slug: `activities`)
  5. Health & Beauty (slug: `health-beauty`)
  6. Products (slug: `products`)
  7. Restaurants (slug: `restaurants`)
  8. Appointments (slug: `appointments`)
  9. P2P (slug: `p2p`)

Notes
- Vehicles and Electronics remain supported in taxonomy but are not primary Explore domains (Electronics roll up under Products; Vehicles can be reached via search or Services if rentals are offered).

### 1) Explore (home)
- Rename Featured → Explore; keep route `/` and add alias `/explore`
- Domain cards from `GET /api/domains/`
- Lanes (data-driven): Trending, Near You, New, For You, and domain-specific (e.g., “This Weekend” for events)
- Components
  - `ExplorePanel` (replaces `FeaturedPanel`)
  - `DomainCard`, `Lane`, `ListingCard*` variants per domain
- Data
  - Lanes backed by `GET /api/listings/?domain=…&status=active` with ordering params
  - “For You” lane uses Zep (Phase 4); fallback to recency/engagement
- Acceptance
  - Explore loads ≤ 1.5s p50; lanes render across 5+ domains

### 2) Public Storefronts
- Routes
  - `/s/:sellerSlug` (overview)
  - `/s/:sellerSlug/:domain` (domain tab)
- Multi‑storefront support
  - A business can create multiple storefronts, each with its own slug, theme and domain focus (e.g., `acme-homes`, `acme-events`).
  - Account‑level dashboard aggregates across storefronts; each storefront has domain‑specific views filtered to its scope.
- Data
  - `GET /api/storefronts/{slug}/` → header (name, logo, theme)
  - `GET /api/storefronts/{slug}/domains/` → domain counts
  - `GET /api/storefronts/{slug}/listings/?domain=…` → grid (paginated)
- CTAs
  - Book/Buy based on `listing.transaction_type`
- Components
  - `StorefrontHeader`, `StorefrontTabs`, `StorefrontGrid`
- Acceptance
  - Tab counts match API; only active listings shown; CTA respects domain

### 3) Seller Domain Dashboards
- Routes: `/dashboard/:domain/(overview|listings|bookings|analytics)`
- Pages
  - Overview (metrics), Listings (CRUD), Bookings (if bookable), Analytics (charts)
- Forms
  - Create/Edit Listing: dynamic fields from Category schema + nested domain detail (`car|service|event|product`)
- Data
  - `GET /api/listings/?domain=…&my_listings=1`
  - Optional: `GET /api/dashboard/{domain}/metrics` (Phase 2 or 5)
- Acceptance
  - Seller can create/edit domain listings; bookings visible where applicable

### 4) P2P (user‑to‑user)
- Flow: Create Listing with `domain='p2p'` (products-like)
- Listing detail emphasizes chat-first; purchase optional (Phase 3)

### 5) Transactions (Phase 3)
- Booking flows (services/events/vehicles/short‑stay)
- Product purchase MVP
  - Option A: BookingType `product_purchase` (no dates; shipping/contact in `booking_data`)
  - Option B: Orders app later (cleaner)

### 6) Shared FE Infrastructure
- Domain registry for labels/icons/nav (already scaffolded)
- State: caching for domains/categories; pagination; error boundaries
- Tests: Playwright e2e — Explore, Storefront, Create Listing, Booking

### 7) Observability & Perf
- Sentry + Web Vitals; measure p50/p95 for Explore/Storefront
- Lazy-load heavy components (galleries/maps)

---

## Backend Plan

### 1) Models (status: core shipped; multi‑storefront pending)
- Aggregate: `listings.Listing` with `domain`, `listing_kind`, `transaction_type`
- Domain detail (OneToOne → Listing): `CarListing`, `ServiceListing`, `EventListing`, `ProductListing`
- Real estate bridge: `real_estate.Listing` → OneToOne `listings.Listing` (+ backfill)
- Seller storefront fields on `SellerProfile` (slug, published, config)
- Storefront model (to implement): one user → many storefronts
  - `Storefront(id, owner(FK User), slug(unique), name, published, config(JSON), created_at, updated_at)`
  - Domains scoping: either
    - JSON list of top‑level domain slugs allowed for this storefront, or
    - derived by convention (e.g., storefront slug prefix) — preferred: explicit JSON field
  - Backward compatibility: keep `SellerProfile.slug` serving the original default storefront; migrate later

### 2) APIs (status: core shipped)
- Domains: `GET /api/domains/`, `GET /api/domains/{slug}/categories/`
- Listings: CRUD with nested domain detail; filters `?domain=&seller=&owner=&status=`
- Storefronts:
  - `GET /api/storefronts/{slug}/`, `/domains/`, `/listings/?domain=` (existing, single‑store compatible)
  - After multi‑storefront: `POST/PATCH/DELETE /api/storefronts/` (owner only), `GET /api/storefronts/` (owner list)
- Bookings: existing app; Product purchase via BookingType (Phase 3) or Orders app
- Dashboard metrics: `GET /api/dashboard/{domain}/metrics` (Phase 2 or 5)

### 3) Taxonomy & Seeds
- Ensure top‑level domains (locked for Explore):
  - `real-estate`, `services`, `events`, `activities`, `health-beauty`, `products`, `restaurants`, `appointments`, `p2p`
- Vehicles and Electronics remain in taxonomy, but not primary Explore cards (Electronics → Products).
- Maintain Category JSON schema for dynamic fields and validation

### 4) Zep Indexing (Phase 4)
- ListingDoc schema
  - id (uuid), text (title + description + domain detail summary), metadata (domain/category/subcategory/price/city/seller/storefront/status/updated_at)
- Signals: post_save/post_delete to upsert/remove
- Commands: `backfill_zep_listings`
- Retrieval: search with filters for AI chat + personalized lanes

### 5) Transactions (Phase 3)
- BookingType `product_purchase` (if chosen): requires_dates=False; address/contact in `booking_data`
- Payment provider (Stripe) integration (create/payment intent; webhooks; receipts)
- Orders app (later): `Order`, `OrderItem`, `Payment`, `Shipment` with transitions

### 6) Observability & Security
- Metrics: `listings_created_total{domain}`, `storefront_views_total{seller}`, `bookings_created_total{domain}`
- Logs: booking failures, storefront 404s, validation errors
- Permissions: P2P allowed for consumers; other domains require business/verification; storefront gating (verified + published)

---

## Phases & Deliverables

### Phase 0 — Hardening & Taxonomy (Week 0–1)
- Seed completeness; migrations; RE backfill; smoke tests
- Acceptance: `/api/domains`, `/api/listings`, `/api/storefronts` all green

### Phase 1 — Explore + Storefronts (Week 1–3)
- Explore replacement with locked domain set; storefront UI; domain tabs
- Acceptance: Explore p50 ≤ 1.5s; storefront tabs match API counts

### Phase 2 — Domain Dashboards (Week 3–5)
- Dashboards per domain (account‑level and storefront‑scoped); metrics endpoint if needed
- Acceptance: CRUD works; bookings visible where applicable

### Phase 3 — Transactions (Week 5–7)
- Bookings E2E; product purchase MVP; Stripe
- Acceptance: booking success; purchase receipts; webhooks processed

### Phase 4 — AI & Zep (Week 7–9)
- Zep ingestion; personalized lanes; seller automations (2 features)
- Acceptance: “For You” populated; seller can apply AI suggestions

### Phase 5 — Analytics & SEO (Week 9–10)
- Metrics endpoints; storefront SEO (meta/OG); sitemaps
- Acceptance: metrics power FE graphs; storefronts indexable

---

## Acceptance Criteria & KPIs
- Explore CTR > 15%; storefront bounce < 55%
- Listing creation success > 98%; time-to-first-listing < 3m
- Checkout success > 85%
- Personalized lane CTR uplift > 10%

---

## Open Decisions (to lock)
1) Include restaurants now as `ServiceListing`? (Locked: Yes)
2) Add top‑level `p2p` now? (Locked: Yes)
3) Appointments `AppointmentOffering` now or later? (Now/Later)
4) Products path: BookingType `product_purchase` vs Orders app? (BookingType/Orders)
5) Payment provider: Stripe first? (Yes/No)
6) Storefront URLs: only `/s/:slug` or also `/store/:slug`? (One/Both)
7) Default owner id for RE backfill?
8) i18n: English-only v1? (Yes/No)
9) Media: Current vs S3+CDN in Phase 1? (Current/S3)
10) Metrics endpoints: Phase 2 or Phase 5? (P2/P5)

---

## Quick API Reference
- Domains
  - `GET /api/domains/`
  - `GET /api/domains/{slug}/categories/`
- Listings
  - `GET /api/listings/?domain=&seller=&owner=&status=`
  - `POST /api/listings/` (nested: `car|service|event|product`)
  - `GET /api/listings/{id}/`
- Storefronts
  - `GET /api/storefronts/{slug}/`
  - `GET /api/storefronts/{slug}/domains/`
  - `GET /api/storefronts/{slug}/listings/?domain=`
- Bookings
  - Existing bookings app endpoints (plus `product_purchase` if chosen)

---

## Tracking (Epics)
- EP‑01: Taxonomy & Hardening (P0)
- EP‑02: Explore & Storefronts (P1)
- EP‑03: Domain Dashboards (P2)
- EP‑04: Transactions (P3)
- EP‑05: AI & Zep (P4)
- EP‑06: Analytics & SEO (P5)
