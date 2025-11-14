# Real Estate Frontend Map

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Dashboard Routes](#dashboard-routes)
4. [Feature Modules](#feature-modules)
5. [Components](#components)
6. [API Integration](#api-integration)
7. [Types & Interfaces](#types--interfaces)
8. [Data Flow](#data-flow)
9. [Integration with Backend](#integration-with-backend)
10. [Development Guide](#development-guide)

---

## Overview

This document maps all Real Estate-related frontend artifacts in the Easy Islanders application. It serves as a **comprehensive reference** for developers working on the real estate domain.

### Purpose

The Real Estate domain is the **flagship vertical** of the Easy Islanders platform, covering:
- **Residential rentals** (daily/short-term and long-term)
- **Property sales**
- **Off-plan projects** (new developments)
- **Property management** (owners, tenants, maintenance)
- **Portfolio analytics** (occupancy, earnings, location performance)

### Quick Navigation

**For Sellers/Agents**:
- Dashboard Home: `/dashboard/home/real-estate`
- Portfolio Management: `/dashboard/home/real-estate/portfolio`
- Sales Pipeline: `/dashboard/home/real-estate/sales-pipeline`
- Earnings Analytics: `/dashboard/home/real-estate/earnings`

**For Consumers**:
- Browse Listings: `/` (chat interface with inline recommendations)
- Featured Properties: Featured pane in chat

**For Admins**:
- Analytics Dashboard: `/dashboard/analytics`
- System Metrics: Integration with backend real estate models

---

## Architecture Summary

### Frontend-Backend Alignment

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard Routes          Feature Modules                  │
│  (/dashboard/home/         (src/features/                   │
│   real-estate/*)            seller-dashboard/               │
│                             domains/real-estate/*)          │
│                                                             │
│  ┌──────────────┐     ┌─────────────────────┐             │
│  │ Portfolio    │────►│ PortfolioPage.tsx   │             │
│  │ Location     │────►│ LocationPage.tsx    │             │
│  │ Occupancy    │────►│ OccupancyPage.tsx   │             │
│  │ Earnings     │────►│ EarningsPage.tsx    │             │
│  │ Sales        │────►│ SalesPipelinePage   │             │
│  │ Requests     │────►│ RequestsPage.tsx    │             │
│  │ Calendar     │────►│ CalendarPage.tsx    │             │
│  │ Maintenance  │────►│ MaintenancePage.tsx │             │
│  │ Owners/Tenants│────►│OwnersTenantsPage   │             │
│  │ Pricing      │────►│ PricingPromotions   │             │
│  │ Channels     │────►│ ChannelsPage.tsx    │             │
│  │ Projects     │────►│ ProjectsPage.tsx    │             │
│  └──────────────┘     └─────────────────────┘             │
│         │                       │                           │
│         └───────────┬───────────┘                           │
│                     ▼                                       │
│         ┌─────────────────────┐                            │
│         │  realEstateApi.ts   │                            │
│         │  (API Client)       │                            │
│         └──────────┬──────────┘                            │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     Backend (Django)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Real Estate App           Models                          │
│  (real_estate/*)           (models.py)                      │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐              │
│  │ DRF Serializers  │   │ Property         │              │
│  │ Views/ViewSets   │──►│ Listing          │              │
│  │ URL Routes       │   │ Project          │              │
│  │ Permissions      │   │ Contact          │              │
│  └──────────────────┘   │ PropertyOwner    │              │
│                         │ Tenancy          │              │
│                         │ Deal             │              │
│                         │ ListingEvent     │              │
│                         └──────────────────┘              │
│                                                             │
│  API Endpoints:                                            │
│  - /api/v1/real-estate/properties/                         │
│  - /api/v1/real-estate/listings/                           │
│  - /api/v1/real-estate/projects/                           │
│  - /api/v1/real-estate/metrics/                            │
│  - /api/v1/real-estate/portfolio/                          │
│  - /api/v1/real-estate/occupancy/                          │
│  - /api/v1/real-estate/earnings/                           │
│  - /api/v1/real-estate/sales-pipeline/                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard Routes

### Route Structure

All real estate dashboard routes follow the pattern: `/dashboard/home/real-estate/*`

### Route-to-Component Mapping

| Route | Page Wrapper | Feature Component | Description |
|-------|--------------|-------------------|-------------|
| `/dashboard/home/real-estate` | `pages/dashboard/home/real-estate.tsx` | `DomainHomeRealEstate.tsx` | Main real estate dashboard |
| `/dashboard/home/real-estate/portfolio` | `pages/dashboard/home/real-estate/portfolio.tsx` | `PortfolioPage.tsx` | Property portfolio view |
| `/dashboard/home/real-estate/location` | `pages/dashboard/home/real-estate/location.tsx` | `LocationPage.tsx` | Location analytics |
| `/dashboard/home/real-estate/occupancy` | `pages/dashboard/home/real-estate/occupancy.tsx` | `OccupancyPage.tsx` | Occupancy tracking |
| `/dashboard/home/real-estate/earnings` | `pages/dashboard/home/real-estate/earnings.tsx` | `EarningsPage.tsx` | Revenue analytics |
| `/dashboard/home/real-estate/sales-pipeline` | `pages/dashboard/home/real-estate/sales-pipeline.tsx` | `SalesPipelinePage.tsx` | Sales funnel |
| `/dashboard/home/real-estate/requests` | `pages/dashboard/home/real-estate/requests.tsx` | `RequestsPage.tsx` | Booking requests |
| `/dashboard/home/real-estate/calendar` | `pages/dashboard/home/real-estate/calendar.tsx` | `CalendarPage.tsx` | Availability calendar |
| `/dashboard/home/real-estate/maintenance` | `pages/dashboard/home/real-estate/maintenance.tsx` | `MaintenancePage.tsx` | Maintenance tracking |
| `/dashboard/home/real-estate/owners-and-tenants` | `pages/dashboard/home/real-estate/owners-and-tenants.tsx` | `OwnersTenantsPage.tsx` | People management |
| `/dashboard/home/real-estate/pricing-and-promotions` | `pages/dashboard/home/real-estate/pricing-and-promotions.tsx` | `PricingPromotionsPage.tsx` | Pricing strategy |
| `/dashboard/home/real-estate/channels-and-distribution` | `pages/dashboard/home/real-estate/channels-and-distribution.tsx` | `ChannelsPage.tsx` | Channel management |
| `/dashboard/home/real-estate/projects` | `pages/dashboard/home/real-estate/projects.tsx` | `ProjectsPage.tsx` | Off-plan projects |

---

### Route Wrapper Pattern

**Example** (`pages/dashboard/home/real-estate.tsx`):

```tsx
import React from 'react';
import { DomainProvider } from '../../../features/seller-dashboard/context/DomainContext';
import { DashboardLayout } from '../../../features/seller-dashboard/layout/DashboardLayout';
import { RealEstateOverviewPage } from '../../../features/seller-dashboard/domains/real-estate/overview/RealEstateOverviewPage';

const RealEstateHomePage: React.FC = () => {
  return (
    <DomainProvider domainId="real_estate" initialSection="home">
      <DashboardLayout>
        <RealEstateOverviewPage />
      </DashboardLayout>
    </DomainProvider>
  );
};

export default RealEstateHomePage;
```

**Pattern Explanation**:
1. **DomainProvider**: Sets domain context (`domainId="real_estate"`)
2. **DashboardLayout**: Provides sidebar navigation and breadcrumbs
3. **Feature Component**: Renders the actual page content

---

## Feature Modules

### Directory Structure

```
src/features/seller-dashboard/domains/real-estate/
├── DomainHomeRealEstate.tsx          # Main domain home component
│
├── overview/
│   ├── RealEstateOverviewPage.tsx
│   └── RealEstateOverviewPageEnhanced.tsx
│
├── portfolio/
│   ├── PortfolioPage.tsx
│   ├── PortfolioTableEnhanced.tsx
│   └── components/
│       ├── PropertyCard.tsx
│       └── PortfolioFilters.tsx
│
├── location/
│   ├── LocationPage.tsx
│   ├── LocationPageEnhanced.tsx
│   └── components/
│       ├── LocationMap.tsx
│       └── LocationMetrics.tsx
│
├── occupancy/
│   ├── OccupancyPage.tsx
│   ├── OccupancyPageEnhanced.tsx
│   └── components/
│       ├── OccupancyChart.tsx
│       └── OccupancyCalendar.tsx
│
├── earnings/
│   ├── EarningsPage.tsx
│   ├── EarningsPageEnhanced.tsx
│   └── components/
│       ├── EarningsChart.tsx
│       ├── RevenueBreakdown.tsx
│       └── PayoutSchedule.tsx
│
├── sales-pipeline/
│   ├── SalesPipelinePage.tsx
│   ├── SalesPipelinePageEnhanced.tsx
│   └── components/
│       ├── PipelineKanban.tsx
│       ├── DealCard.tsx
│       └── StageMetrics.tsx
│
├── requests/
│   ├── RequestsPage.tsx
│   └── components/
│       ├── RequestCard.tsx
│       └── RequestFilters.tsx
│
├── calendar/
│   ├── CalendarPage.tsx
│   └── components/
│       ├── BookingCalendar.tsx
│       └── AvailabilityToggle.tsx
│
├── maintenance/
│   ├── MaintenancePage.tsx
│   └── components/
│       ├── MaintenanceTicket.tsx
│       ├── MaintenanceStatus.tsx
│       └── MaintenanceSchedule.tsx
│
├── owners-and-tenants/
│   ├── OwnersTenantsPage.tsx
│   └── components/
│       ├── OwnersTable.tsx
│       ├── TenantsTable.tsx
│       ├── ContactCard.tsx
│       └── LeaseDetails.tsx
│
├── pricing-and-promotions/
│   ├── PricingPromotionsPage.tsx
│   └── components/
│       ├── PricingStrategy.tsx
│       ├── SeasonalRates.tsx
│       └── PromotionCard.tsx
│
├── channels-and-distribution/
│   ├── ChannelsPage.tsx
│   └── components/
│       ├── ChannelCard.tsx
│       ├── ChannelMetrics.tsx
│       └── SyncStatus.tsx
│
├── projects/
│   ├── ProjectsPage.tsx
│   └── components/
│       ├── ProjectCard.tsx
│       ├── ProjectTimeline.tsx
│       └── UnitAvailability.tsx
│
├── api/
│   └── realEstateDashboardApi.ts     # API client for real estate
│
├── hooks/
│   ├── useRealEstateMetrics.ts
│   ├── usePortfolio.ts
│   ├── useOccupancy.ts
│   ├── useEarnings.ts
│   └── useSalesPipeline.ts
│
└── types/
    ├── property.ts
    ├── listing.ts
    ├── project.ts
    ├── deal.ts
    └── metrics.ts
```

---

### Key Feature Components

#### 1. Overview Page

**File**: `overview/RealEstateOverviewPage.tsx`

**Purpose**: Dashboard home showing high-level KPIs

**Features**:
- Total properties count
- Active listings count
- Occupancy rate
- Monthly revenue
- Recent activity feed
- Quick actions (create listing, view requests)

**API Calls**:
```ts
const metrics = await getRealEstateMetrics(userId);
```

---

#### 2. Portfolio Page

**File**: `portfolio/PortfolioPage.tsx`

**Purpose**: Manage property portfolio

**Features**:
- Property list with filters (type, location, status)
- Property cards with images, details, status
- Quick actions (edit, view details, manage listing)
- Bulk operations
- Export to CSV

**Components**:
- `PortfolioTableEnhanced.tsx` - Data table with sorting/filtering
- `PropertyCard.tsx` - Individual property card
- `PortfolioFilters.tsx` - Filter controls

**API Calls**:
```ts
const portfolio = await getPortfolioData({ filters });
```

---

#### 3. Location Analytics Page

**File**: `location/LocationPage.tsx`

**Purpose**: Performance by location/area

**Features**:
- Map view with property pins
- Metrics by city/area (occupancy, revenue, views)
- Top-performing locations
- Market trends by region

**Components**:
- `LocationMap.tsx` - Interactive map
- `LocationMetrics.tsx` - Metrics breakdown

**API Calls**:
```ts
const locationData = await getLocationAnalytics();
```

---

#### 4. Occupancy Tracking Page

**File**: `occupancy/OccupancyPage.tsx`

**Purpose**: Track occupancy rates and availability

**Features**:
- Occupancy rate by property/time period
- Calendar view of bookings
- Availability blocks visualization
- Occupancy trends chart

**Components**:
- `OccupancyChart.tsx` - Line/bar chart
- `OccupancyCalendar.tsx` - Calendar grid

**API Calls**:
```ts
const occupancy = await getOccupancyData({ startDate, endDate });
```

---

#### 5. Earnings Analytics Page

**File**: `earnings/EarningsPage.tsx`

**Purpose**: Revenue analytics and payouts

**Features**:
- Total earnings (daily, monthly, yearly)
- Revenue breakdown by property/listing type
- Payout schedule and history
- Earnings trends chart
- Expense tracking

**Components**:
- `EarningsChart.tsx` - Revenue visualization
- `RevenueBreakdown.tsx` - Pie/donut chart
- `PayoutSchedule.tsx` - Upcoming payouts

**API Calls**:
```ts
const earnings = await getEarningsData({ period });
```

---

#### 6. Sales Pipeline Page

**File**: `sales-pipeline/SalesPipelinePage.tsx`

**Purpose**: Track deals through sales funnel

**Features**:
- Kanban board (stages: New, Negotiation, Reservation, Contract, Closed Won/Lost)
- Deal cards with client info, property, value
- Stage metrics (conversion rates, avg time in stage)
- Deal details modal
- Activity timeline per deal

**Components**:
- `PipelineKanban.tsx` - Drag-and-drop board
- `DealCard.tsx` - Individual deal card
- `StageMetrics.tsx` - Metrics per stage

**API Calls**:
```ts
const pipeline = await getSalesPipelineData();
```

---

#### 7. Requests Page

**File**: `requests/RequestsPage.tsx`

**Purpose**: Manage booking/viewing requests

**Features**:
- Request list (pending, approved, rejected)
- Request cards with client info, property, dates
- Quick actions (approve, reject, message client)
- Filters (status, date range, property)

**Components**:
- `RequestCard.tsx` - Individual request
- `RequestFilters.tsx` - Filter controls

**API Calls**:
```ts
const requests = await getBookingRequests({ status });
```

---

#### 8. Calendar Page

**File**: `calendar/CalendarPage.tsx`

**Purpose**: Availability calendar for all properties

**Features**:
- Multi-property calendar view
- Booking blocks visualization
- Quick availability toggle
- Drag to block dates
- Export calendar

**Components**:
- `BookingCalendar.tsx` - Full calendar component
- `AvailabilityToggle.tsx` - Quick on/off toggle

**API Calls**:
```ts
const calendar = await getCalendarData({ properties, month });
```

---

#### 9. Maintenance Page

**File**: `maintenance/MaintenancePage.tsx`

**Purpose**: Track maintenance tickets and schedule

**Features**:
- Maintenance ticket list (open, in progress, closed)
- Ticket details (property, issue, priority, assigned to)
- Schedule maintenance tasks
- Vendor management
- Cost tracking

**Components**:
- `MaintenanceTicket.tsx` - Individual ticket
- `MaintenanceStatus.tsx` - Status badge
- `MaintenanceSchedule.tsx` - Upcoming maintenance

**API Calls**:
```ts
const tickets = await getMaintenanceTickets({ status });
```

---

#### 10. Owners & Tenants Page

**File**: `owners-and-tenants/OwnersTenantsPage.tsx`

**Purpose**: Manage property owners and tenants

**Features**:
- Owners table (name, properties owned, contact)
- Tenants table (name, property, lease dates, status)
- Contact cards with details
- Lease details and documents
- Quick actions (message, view profile)

**Components**:
- `OwnersTable.tsx` - Owners data table
- `TenantsTable.tsx` - Tenants data table
- `ContactCard.tsx` - Contact info card
- `LeaseDetails.tsx` - Lease information

**API Calls**:
```ts
const owners = await getPropertyOwners();
const tenants = await getTenants({ status: 'active' });
```

---

#### 11. Pricing & Promotions Page

**File**: `pricing-and-promotions/PricingPromotionsPage.tsx`

**Purpose**: Manage pricing strategy and promotions

**Features**:
- Base pricing by property/listing
- Seasonal rates configuration
- Promotions and discounts
- Dynamic pricing rules
- Price comparison with market

**Components**:
- `PricingStrategy.tsx` - Pricing setup
- `SeasonalRates.tsx` - Seasonal rates calendar
- `PromotionCard.tsx` - Active promotions

**API Calls**:
```ts
const pricing = await getPricingData({ property });
```

---

#### 12. Channels & Distribution Page

**File**: `channels-and-distribution/ChannelsPage.tsx`

**Purpose**: Manage listing distribution channels

**Features**:
- Connected channels (Airbnb, Booking.com, direct website)
- Channel metrics (listings, bookings, revenue per channel)
- Sync status and errors
- Channel configuration
- Add/remove channels

**Components**:
- `ChannelCard.tsx` - Individual channel
- `ChannelMetrics.tsx` - Performance metrics
- `SyncStatus.tsx` - Sync health

**API Calls**:
```ts
const channels = await getDistributionChannels();
```

---

#### 13. Projects Page

**File**: `projects/ProjectsPage.tsx`

**Purpose**: Manage off-plan development projects

**Features**:
- Project list (name, location, completion date, units)
- Project cards with details
- Unit availability and reservations
- Project timeline and milestones
- Payment plans

**Components**:
- `ProjectCard.tsx` - Individual project
- `ProjectTimeline.tsx` - Milestones timeline
- `UnitAvailability.tsx` - Available units grid

**API Calls**:
```ts
const projects = await getProjects();
const units = await getProjectUnits({ projectId });
```

---

## Components

### Shared Real Estate Components

Located under: `src/features/seller-dashboard/components/`

**Used across multiple real estate pages**:

| Component | Purpose | Used In |
|-----------|---------|---------|
| `DomainMetricsCard.tsx` | KPI card with icon, value, trend | Overview, all domain pages |
| `KPICard.tsx` | Generic metric card | All pages |
| `UnifiedListingsTable.tsx` | Cross-domain listings table | Portfolio, Listings |
| `UnifiedBookingsTable.tsx` | Cross-domain bookings table | Requests, Bookings |
| `PropertyStatusBadge.tsx` | Status indicator (active, inactive, sold, rented) | Portfolio, listings |
| `ListingTypeBadge.tsx` | Listing type badge (daily, long-term, sale, project) | Portfolio, listings |
| `OccupancyIndicator.tsx` | Visual occupancy indicator | Portfolio, Occupancy |
| `RevenueChart.tsx` | Revenue line/bar chart | Earnings, Overview |
| `LocationPicker.tsx` | Map-based location selector | Create listing, Edit property |

---

### Listings Components

Located under: `src/features/listings/components/`

**Real estate-specific listing components**:

| Component | File | Purpose |
|-----------|------|---------|
| `RealEstateListing.tsx` | `RealEstateListing.tsx` | Real estate listing card |
| `DynamicListingForm.tsx` | `DynamicListingForm.tsx` | Schema-driven listing form |
| `DynamicFieldRenderer.tsx` | `DynamicFieldRenderer.tsx` | Render fields based on category schema |
| `ListingCardFactory.tsx` | `ListingCardFactory.tsx` | Factory pattern for domain-specific cards |

**Example**: `RealEstateListing.tsx`

```tsx
export const RealEstateListing: React.FC<{ listing: Listing }> = ({ listing }) => {
  return (
    <Card>
      <CardHeader>
        <img src={listing.images[0]} alt={listing.title} />
        <Badge>{listing.subcategory_slug}</Badge>
      </CardHeader>
      <CardContent>
        <h3>{listing.title}</h3>
        <p>{listing.location}</p>
        <div>
          <span>{listing.dynamic_fields.bedrooms} bed</span>
          <span>{listing.dynamic_fields.bathrooms} bath</span>
          <span>{listing.dynamic_fields.total_area_sqm} m²</span>
        </div>
        <p className="price">{listing.currency} {listing.price}</p>
      </CardContent>
    </Card>
  );
};
```

---

## API Integration

### API Client

**File**: `src/features/seller-dashboard/domains/real-estate/api/realEstateDashboardApi.ts`

**Purpose**: Centralized API calls for real estate domain.

**Example Implementation**:

```ts
import { apiClient } from '../../../../../services/apiClient';
import type {
  RealEstateMetrics,
  PortfolioData,
  PortfolioFilters,
  OccupancyData,
  EarningsData,
  SalesPipelineData,
  LocationAnalytics,
  BookingRequest,
  MaintenanceTicket,
  PropertyOwner,
  Tenant,
  PricingData,
  DistributionChannel,
  Project,
} from '../types';

export const getRealEstateMetrics = async (userId: string): Promise<RealEstateMetrics> => {
  return apiClient.get(`/api/v1/real-estate/metrics/${userId}/`);
};

export const getPortfolioData = async (filters?: PortfolioFilters): Promise<PortfolioData> => {
  const params = new URLSearchParams(filters as any).toString();
  return apiClient.get(`/api/v1/real-estate/portfolio/${params ? `?${params}` : ''}`);
};

export const getOccupancyData = async (params: {
  startDate: string;
  endDate: string;
}): Promise<OccupancyData> => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/api/v1/real-estate/occupancy/?${query}`);
};

export const getEarningsData = async (params: {
  period: 'day' | 'week' | 'month' | 'year';
}): Promise<EarningsData> => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/api/v1/real-estate/earnings/?${query}`);
};

export const getSalesPipelineData = async (): Promise<SalesPipelineData> => {
  return apiClient.get('/api/v1/real-estate/sales-pipeline/');
};

export const getLocationAnalytics = async (): Promise<LocationAnalytics> => {
  return apiClient.get('/api/v1/real-estate/location-analytics/');
};

export const getBookingRequests = async (params: {
  status?: string;
}): Promise<BookingRequest[]> => {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`/api/v1/real-estate/requests/${query ? `?${query}` : ''}`);
};

export const getMaintenanceTickets = async (params: {
  status?: string;
}): Promise<MaintenanceTicket[]> => {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`/api/v1/real-estate/maintenance/${query ? `?${query}` : ''}`);
};

export const getPropertyOwners = async (): Promise<PropertyOwner[]> => {
  return apiClient.get('/api/v1/real-estate/owners/');
};

export const getTenants = async (params: { status?: string }): Promise<Tenant[]> => {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`/api/v1/real-estate/tenants/${query ? `?${query}` : ''}`);
};

export const getPricingData = async (params: {
  property?: string;
}): Promise<PricingData> => {
  const query = new URLSearchParams(params as any).toString();
  return apiClient.get(`/api/v1/real-estate/pricing/${query ? `?${query}` : ''}`);
};

export const getDistributionChannels = async (): Promise<DistributionChannel[]> => {
  return apiClient.get('/api/v1/real-estate/channels/');
};

export const getProjects = async (): Promise<Project[]> => {
  return apiClient.get('/api/v1/real-estate/projects/');
};

export const getProjectUnits = async (projectId: string) => {
  return apiClient.get(`/api/v1/real-estate/projects/${projectId}/units/`);
};
```

---

### Custom Hooks

**File**: `src/features/seller-dashboard/domains/real-estate/hooks/`

**Purpose**: Typed React Query hooks for data fetching.

**Examples**:

```ts
// useRealEstateMetrics.ts
import { useQuery } from '@tanstack/react-query';
import { getRealEstateMetrics } from '../api/realEstateDashboardApi';
import { useAuth } from '../../../../../shared/context/AuthContext';

export const useRealEstateMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['realEstateMetrics', user?.id],
    queryFn: () => getRealEstateMetrics(user!.id),
    enabled: !!user,
  });
};

// usePortfolio.ts
import { useQuery } from '@tanstack/react-query';
import { getPortfolioData } from '../api/realEstateDashboardApi';
import type { PortfolioFilters } from '../types';

export const usePortfolio = (filters?: PortfolioFilters) => {
  return useQuery({
    queryKey: ['portfolio', filters],
    queryFn: () => getPortfolioData(filters),
  });
};

// useOccupancy.ts
export const useOccupancy = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['occupancy', startDate, endDate],
    queryFn: () => getOccupancyData({ startDate, endDate }),
  });
};

// useEarnings.ts
export const useEarnings = (period: 'day' | 'week' | 'month' | 'year') => {
  return useQuery({
    queryKey: ['earnings', period],
    queryFn: () => getEarningsData({ period }),
  });
};

// useSalesPipeline.ts
export const useSalesPipeline = () => {
  return useQuery({
    queryKey: ['salesPipeline'],
    queryFn: getSalesPipelineData,
  });
};
```

---

## Types & Interfaces

### TypeScript Types

**Location**: `src/features/seller-dashboard/domains/real-estate/types/`

**Files**:

#### 1. `property.ts`

```ts
export interface Property {
  id: string;
  reference_code: string;
  title: string;
  description: string;
  location: Location;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  total_area_sqm: number;
  furnished_status: 'UNFURNISHED' | 'PARTLY_FURNISHED' | 'FULLY_FURNISHED';
  features: Feature[];
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  city: string;
  area: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyType {
  id: string;
  code: string;
  label: string;
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND';
}

export interface Feature {
  id: string;
  code: string;
  label: string;
  category: 'INSIDE' | 'OUTSIDE' | 'VIEW' | 'AMENITY';
}
```

---

#### 2. `listing.ts`

```ts
export interface Listing {
  id: string;
  reference_code: string;
  listing_type: ListingType;
  property?: Property;
  project?: Project;
  title: string;
  description: string;
  base_price: number;
  currency: string;
  price_period: 'PER_DAY' | 'PER_MONTH' | 'TOTAL' | 'STARTING_FROM';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'UNDER_OFFER' | 'SOLD' | 'RENTED';
  available_from?: string;
  available_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ListingType {
  id: string;
  code: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT';
  label: string;
}

export interface RentalDetails {
  rental_kind: 'DAILY' | 'LONG_TERM';
  min_days?: number;
  min_months?: number;
  deposit_amount?: number;
  utilities_included: Record<string, boolean>;
}

export interface SaleDetails {
  is_swap_possible: boolean;
  negotiable: boolean;
}

export interface ProjectDetails {
  completion_date?: string;
  min_unit_area_sqm?: number;
  max_unit_area_sqm?: number;
  payment_plan: any;
}
```

---

#### 3. `project.ts`

```ts
export interface Project {
  id: string;
  name: string;
  location: Location;
  developer?: Contact;
  total_units?: number;
  completion_date_estimate?: string;
  min_price?: number;
  max_price?: number;
  currency: string;
  description: string;
  payment_plan: any;
}
```

---

#### 4. `deal.ts`

```ts
export interface Deal {
  id: string;
  client: Client;
  listing?: Listing;
  property?: Property;
  deal_type: 'RENTAL' | 'SALE' | 'PROJECT_SALE';
  stage: 'NEW' | 'NEGOTIATION' | 'RESERVATION' | 'CONTRACT_SIGNED' | 'CLOSED_WON' | 'CLOSED_LOST';
  agreed_price?: number;
  currency: string;
  expected_close_date?: string;
  actual_close_date?: string;
  commission_amount?: number;
  created_at: string;
}

export interface Client {
  id: string;
  contact: Contact;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  nationality?: string;
}
```

---

#### 5. `metrics.ts`

```ts
export interface RealEstateMetrics {
  total_properties: number;
  active_listings: number;
  occupancy_rate: number;
  monthly_revenue: number;
  pending_requests: number;
  active_deals: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'listing_created' | 'deal_closed' | 'request_received';
  description: string;
  timestamp: string;
}

export interface PortfolioData {
  properties: Property[];
  total_count: number;
  filters: PortfolioFilters;
}

export interface PortfolioFilters {
  property_type?: string;
  location?: string;
  status?: string;
  search?: string;
}

export interface OccupancyData {
  overall_rate: number;
  by_property: Array<{
    property: Property;
    occupancy_rate: number;
    bookings: number;
  }>;
  trends: Array<{
    date: string;
    rate: number;
  }>;
}

export interface EarningsData {
  total_revenue: number;
  period: string;
  by_property: Array<{
    property: Property;
    revenue: number;
  }>;
  by_listing_type: Array<{
    type: string;
    revenue: number;
  }>;
  trends: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface SalesPipelineData {
  stages: Array<{
    name: string;
    deals: Deal[];
    total_value: number;
    conversion_rate?: number;
  }>;
  total_pipeline_value: number;
}

export interface LocationAnalytics {
  by_city: Array<{
    city: string;
    properties: number;
    occupancy_rate: number;
    revenue: number;
  }>;
  by_area: Array<{
    area: string;
    properties: number;
    occupancy_rate: number;
    revenue: number;
  }>;
  map_data: Array<{
    property: Property;
    lat: number;
    lng: number;
  }>;
}
```

---

## Data Flow

### Example: Portfolio Page

```
┌────────────────────────────────────────────────────────────┐
│                  User Opens Portfolio Page                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Route: /dashboard/home/real-estate/portfolio              │
│  Component: pages/dashboard/home/real-estate/portfolio.tsx │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Wrapped with:                                             │
│  - DomainProvider (domainId="real_estate")                 │
│  - DashboardLayout (sidebar + breadcrumbs)                 │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Feature Component: PortfolioPage.tsx                      │
│  - Uses usePortfolio(filters) hook                         │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  Hook: usePortfolio()                                      │
│  - Uses useQuery from React Query                          │
│  - Calls getPortfolioData(filters)                         │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  API Client: realEstateDashboardApi.ts                     │
│  - getPortfolioData(filters)                               │
│  - Calls apiClient.get('/api/v1/real-estate/portfolio/')   │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼ HTTP GET
┌────────────────────────────────────────────────────────────┐
│  Backend: Django                                           │
│  Endpoint: /api/v1/real-estate/portfolio/                  │
│  - Fetches Property, Listing, PropertyOwner from DB        │
│  - Serializes and returns JSON                             │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼ Response
┌────────────────────────────────────────────────────────────┐
│  React Query Cache                                         │
│  - Stores response data                                    │
│  - Provides isLoading, isError states                      │
└─────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│  PortfolioPage.tsx                                         │
│  - Renders PortfolioTableEnhanced with data               │
│  - Shows loading spinner or error message                  │
└────────────────────────────────────────────────────────────┘
```

---

## Integration with Backend

### Backend API Endpoints (Expected)

Based on the real estate data model, the frontend expects these endpoints:

| Endpoint | Method | Purpose | Response Type |
|----------|--------|---------|---------------|
| `/api/v1/real-estate/metrics/{userId}/` | GET | Get dashboard metrics | `RealEstateMetrics` |
| `/api/v1/real-estate/portfolio/` | GET | Get portfolio data | `PortfolioData` |
| `/api/v1/real-estate/properties/` | GET | List properties | `Property[]` |
| `/api/v1/real-estate/properties/{id}/` | GET | Get property details | `Property` |
| `/api/v1/real-estate/listings/` | GET | List listings | `Listing[]` |
| `/api/v1/real-estate/listings/{id}/` | GET | Get listing details | `Listing` |
| `/api/v1/real-estate/projects/` | GET | List projects | `Project[]` |
| `/api/v1/real-estate/projects/{id}/` | GET | Get project details | `Project` |
| `/api/v1/real-estate/occupancy/` | GET | Get occupancy data | `OccupancyData` |
| `/api/v1/real-estate/earnings/` | GET | Get earnings data | `EarningsData` |
| `/api/v1/real-estate/sales-pipeline/` | GET | Get sales pipeline | `SalesPipelineData` |
| `/api/v1/real-estate/location-analytics/` | GET | Get location analytics | `LocationAnalytics` |
| `/api/v1/real-estate/requests/` | GET | Get booking requests | `BookingRequest[]` |
| `/api/v1/real-estate/maintenance/` | GET | Get maintenance tickets | `MaintenanceTicket[]` |
| `/api/v1/real-estate/owners/` | GET | Get property owners | `PropertyOwner[]` |
| `/api/v1/real-estate/tenants/` | GET | Get tenants | `Tenant[]` |
| `/api/v1/real-estate/pricing/` | GET | Get pricing data | `PricingData` |
| `/api/v1/real-estate/channels/` | GET | Get distribution channels | `DistributionChannel[]` |

---

### Backend Data Model Mapping

**Frontend Types** ↔ **Backend Models**:

| Frontend Type | Backend Model | Notes |
|---------------|---------------|-------|
| `Property` | `Property` (real_estate/models.py) | Direct mapping |
| `Listing` | `Listing` (real_estate/models.py) | Direct mapping |
| `ListingType` | `ListingType` (real_estate/models.py) | Reference table |
| `Project` | `Project` (real_estate/models.py) | Direct mapping |
| `Deal` | `Deal` (real_estate/models.py) | Direct mapping |
| `Contact` | `Contact` (real_estate/models.py) | Direct mapping |
| `PropertyOwner` | `PropertyOwner` (real_estate/models.py) | Direct mapping |
| `Tenant` | Via `Tenancy` model | Derived from tenancy relationships |
| `BookingRequest` | Via `ListingEvent` or `Tenancy` | Derived from events/tenancies |
| `MaintenanceTicket` | TBD | May need new model or custom endpoint |

---

## Development Guide

### Adding a New Real Estate Page

**Example**: Add a "Market Analysis" page

#### Step 1: Create Feature Component

```bash
# Create directory
mkdir -p src/features/seller-dashboard/domains/real-estate/market-analysis

# Create files
touch src/features/seller-dashboard/domains/real-estate/market-analysis/MarketAnalysisPage.tsx
touch src/features/seller-dashboard/domains/real-estate/market-analysis/components/MarketChart.tsx
```

**MarketAnalysisPage.tsx**:

```tsx
import React from 'react';
import { useMarketAnalysis } from '../hooks/useMarketAnalysis';
import { MarketChart } from './components/MarketChart';

export const MarketAnalysisPage: React.FC = () => {
  const { data, isLoading } = useMarketAnalysis();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Market Analysis</h1>
      <MarketChart data={data} />
    </div>
  );
};
```

---

#### Step 2: Add API Client Method

**realEstateDashboardApi.ts**:

```ts
export const getMarketAnalysis = async (): Promise<MarketAnalysisData> => {
  return apiClient.get('/api/v1/real-estate/market-analysis/');
};
```

---

#### Step 3: Create Hook

**useMarketAnalysis.ts**:

```ts
import { useQuery } from '@tanstack/react-query';
import { getMarketAnalysis } from '../api/realEstateDashboardApi';

export const useMarketAnalysis = () => {
  return useQuery({
    queryKey: ['marketAnalysis'],
    queryFn: getMarketAnalysis,
  });
};
```

---

#### Step 4: Add Route Wrapper

**pages/dashboard/home/real-estate/market-analysis.tsx**:

```tsx
import React from 'react';
import { DomainProvider } from '../../../../features/seller-dashboard/context/DomainContext';
import { DashboardLayout } from '../../../../features/seller-dashboard/layout/DashboardLayout';
import { MarketAnalysisPage } from '../../../../features/seller-dashboard/domains/real-estate/market-analysis/MarketAnalysisPage';

const MarketAnalysisRoutePage: React.FC = () => {
  return (
    <DomainProvider domainId="real_estate" initialSection="market-analysis">
      <DashboardLayout>
        <MarketAnalysisPage />
      </DashboardLayout>
    </DomainProvider>
  );
};

export default MarketAnalysisRoutePage;
```

---

#### Step 5: Add Route

**app/routes.tsx**:

```tsx
<Route
  path="/dashboard/home/real-estate/market-analysis"
  element={<MarketAnalysisPage />}
/>
```

---

#### Step 6: Add to Sidebar Navigation

**features/seller-dashboard/layout/NavItems.ts**:

```ts
export const realEstateNavItems = [
  // ... existing items
  {
    label: 'Market Analysis',
    path: '/dashboard/home/real-estate/market-analysis',
    icon: 'chart-line',
  },
];
```

---

### Testing Real Estate Features

**Unit Test Example** (`PortfolioPage.test.tsx`):

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortfolioPage } from './PortfolioPage';
import { getPortfolioData } from '../api/realEstateDashboardApi';

jest.mock('../api/realEstateDashboardApi');

const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('PortfolioPage', () => {
  it('displays portfolio data', async () => {
    const mockData = {
      properties: [{ id: '1', title: 'Test Property', bedrooms: 2 }],
      total_count: 1,
    };
    (getPortfolioData as jest.Mock).mockResolvedValue(mockData);

    render(<PortfolioPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });
  });
});
```

---

## Summary

This map provides a complete reference for all real estate frontend artifacts:

- **13 Dashboard Pages** covering all aspects of real estate management
- **Feature-sliced architecture** under `features/seller-dashboard/domains/real-estate/`
- **Typed API client** with custom hooks for data fetching
- **Complete type definitions** matching backend models
- **Clear data flow** from route → component → hook → API → backend

**For New Developers**:
1. Start with [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) for overall structure
2. Use this document to find real estate-specific code
3. Follow the development guide to add new features
4. See [FRONTEND_MIGRATION_PLAN.md](./FRONTEND_MIGRATION_PLAN.md) for ongoing improvements

**For Backend Developers**:
- API endpoints expected by frontend are listed in "Integration with Backend"
- Type definitions show expected response shapes
- Backend models map directly to frontend types

**Last Updated**: 2025-11-14 (v1.0 - Initial Real Estate Frontend Map)
