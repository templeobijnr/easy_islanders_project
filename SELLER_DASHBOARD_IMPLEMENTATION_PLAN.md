# Seller Dashboard Implementation Plan

## Executive Summary

This plan outlines the **5-week critical path** to build a unified, multi-domain seller dashboard that orchestrates all business verticals (real estate, events, activities, appointments, services, products) through a single interface.

**Key Architecture:**
- `seller_portal/` app as orchestration layer
- Domain Service pattern for pluggable backends
- React component library for adaptive frontend
- Unified analytics & cross-domain workflows

---

## Timeline & Deliverables

### Week 1: Backend Scaffold - Domain Service Pattern

**Goal:** Establish the orchestration foundation and create the first reference implementation.

#### Tasks

**Backend**
- [ ] Create `seller_portal/` Django app
  - `models.py` - empty for now (aggregator-only)
  - `views.py` - aggregation endpoints
  - `urls.py` - register endpoints
  - `services.py` - factory and orchestration logic

- [ ] Create `listings/base_domain_service.py`
  - Abstract `BaseDomainService` class with methods:
    - `get_listings(seller_user)`
    - `get_metrics(seller_user, period)`
    - `get_bookings(seller_user)`
    - `create_listing(seller_user, payload)`
    - `update_listing(seller_user, listing_id, payload)`
    - `get_listing_detail(listing_id)`

- [ ] Create `real_estate/services.py`
  - Implement `RealEstateDomainService`
  - Methods query from `real_estate_listing`, `booking` tables
  - Returns standardized dicts with domain slug attached

- [ ] Register routes in `easy_islanders/urls.py`
  ```python
  path('api/seller/', include('seller_portal.urls')),
  ```

- [ ] Implement aggregator endpoints in `seller_portal/views.py`
  - `GET /api/seller/overview/` - aggregated KPIs
  - `GET /api/seller/listings/` - unified listings with domain filter
  - `GET /api/seller/bookings/` - unified bookings with status filter

**Testing**
- [ ] Unit test RealEstateDomainService
- [ ] Test aggregator endpoints return correct data
- [ ] Verify service factory pattern works

**Deliverable:** `seller/overview` returns cross-domain stats (total listings, bookings, revenue)

---

### Week 2: Frontend Shell - Dashboard Layout & KPI Cards

**Goal:** Build the main dashboard UI and wire it to backend aggregation endpoints.

#### Tasks

**Frontend Structure**
- [ ] Create `frontend/src/features/seller-dashboard/` directory
  ```
  seller-dashboard/
  ├── components/
  │   ├── SellerDashboard.tsx
  │   ├── DomainMetricsCard.tsx
  │   ├── UnifiedListingsTable.tsx
  │   └── UnifiedBookingsTable.tsx
  ├── hooks/
  │   └── useDomainServices.ts
  ├── types/
  │   └── dashboard.ts
  └── index.ts
  ```

- [ ] Implement `useDomainServices.ts` hooks
  - `useSummarizedMetrics()` → queries `/api/seller/overview/`
  - `useUnifiedListings(domain?)` → queries `/api/seller/listings/`
  - `useUnifiedBookings(status?)` → queries `/api/seller/bookings/`

- [ ] Build `SellerDashboard.tsx` main component
  - Top KPI cards (total listings, bookings, revenue, domains)
  - Domain-specific metric cards
  - Tab navigation (Overview, Listings, Bookings, Broadcasts, Messages, Analytics)

- [ ] Build `DomainMetricsCard.tsx` 
  - Shows domain icon, name, listings count, bookings count, revenue
  - Color-coded by domain (🏠 blue, 🎉 pink, ⚡ amber, ⏰ purple)

- [ ] Implement responsive grid layout
  - KPI cards: 4-column on desktop, stacked on mobile
  - Domain cards: 2-column on desktop

**Styling**
- [ ] Use ShadCN Card, Tabs components
- [ ] Ensure dark mode support via Tailwind
- [ ] Mobile-responsive design

**Testing**
- [ ] Test dashboard renders when data loads
- [ ] Test domain cards display metrics correctly
- [ ] Test tab switching logic

**Deliverable:** Dashboard UI skeleton loads metrics and renders cards (no interactive features yet)

---

### Week 3: Unified Listings & Bookings Tables

**Goal:** Build interactive tables for managing all listings and bookings across domains.

#### Tasks

**Listings Table**
- [ ] Implement `UnifiedListingsTable.tsx`
  - Columns: Domain icon, Title, Category, Status, Price, Actions
  - Sortable by domain, date created, status
  - Filterable by domain, status (active/draft/paused)
  - Actions: View, Edit, Duplicate, Archive, Delete

- [ ] Implement `ListingDetailModal.tsx`
  - Shows full listing details (images, description, bookings, reviews)
  - Domain-aware display (rental calendar for real estate, ticket sales for events)

- [ ] Implement `EditListingForm.tsx`
  - Dynamic form based on category schema
  - Supports basic fields (title, description, price, location)
  - Loads category JSON schema to render custom fields

**Bookings Table**
- [ ] Implement `UnifiedBookingsTable.tsx`
  - Columns: Domain icon, Listing, Customer, Status, Date, Price, Actions
  - Sortable by status, date, domain
  - Filterable by status (pending, confirmed, completed, cancelled)
  - Actions: View, Confirm, Mark Complete, Respond, Cancel

- [ ] Implement `BookingDetailModal.tsx`
  - Shows customer info, booking dates, special requests
  - Domain-aware (check-in dates for real estate, event details for events)

- [ ] Implement `RespondToBookingModal.tsx`
  - Seller can approve, decline, request dates change, or message

**Backend Endpoints**
- [ ] `PUT /api/seller/listings/{id}/` - update listing
- [ ] `DELETE /api/seller/listings/{id}/` - archive listing
- [ ] `PUT /api/seller/bookings/{id}/` - update booking status
- [ ] `POST /api/seller/bookings/{id}/respond/` - seller response to booking

**Testing**
- [ ] Table renders and sorts correctly
- [ ] Modals open/close properly
- [ ] Responses to bookings saved and reflected in UI

**Deliverable:** Seller can view and manage all listings and bookings across domains from tables

---

### Week 4: Multi-Domain Service Implementations

**Goal:** Expand domain support by implementing services for Events, Activities, and Appointments.

#### Tasks

**Events Domain**
- [ ] Create `events/services.py`
  - Implement `EventsDomainService`
  - `get_listings()` returns events with registration count
  - `get_bookings()` returns registrations (attendees)
  - `get_metrics()` includes registration rate, revenue per ticket

- [ ] Create Event models (if not already done)
  - Event, EventRegistration

**Activities Domain**
- [ ] Create `activities/services.py`
  - Implement `ActivitiesDomainService`
  - `get_listings()` returns activities with sessions
  - `get_bookings()` returns activity bookings
  - `get_metrics()` includes capacity utilization, revenue

- [ ] Create Activity models
  - Activity, ActivitySession, ActivityBooking

**Appointments Domain**
- [ ] Create `appointments/services.py`
  - Implement `AppointmentsDomainService`
  - `get_listings()` returns appointment types (services)
  - `get_bookings()` returns appointments
  - `get_metrics()` includes appointment count, no-show rate, revenue

- [ ] Create Appointment models
  - AppointmentType, AppointmentSlot, Appointment

**Integration**
- [ ] Register new services in `seller_portal/services.py` factory
- [ ] Verify aggregator endpoints work with all 4 domains
- [ ] Test cross-domain analytics

**Testing**
- [ ] Unit test each domain service
- [ ] Test aggregation with mixed domains
- [ ] Verify metrics calculations are correct

**Deliverable:** Seller dashboard aggregates data from real estate, events, activities, and appointments domains

---

### Week 5: Analytics & Insights

**Goal:** Build comprehensive analytics dashboard and AI-powered insights.

#### Tasks

**Analytics Endpoints**
- [ ] Create `seller_portal/analytics.py`
  - `get_revenue_by_domain(seller, period)` - revenue chart data
  - `get_bookings_timeline(seller, period)` - bookings over time
  - `get_listing_performance(seller, domain)` - per-listing metrics
  - `get_customer_metrics(seller)` - repeat customers, ratings

- [ ] Implement endpoints
  - `GET /api/seller/analytics/` - return all metrics
  - `GET /api/seller/analytics/revenue/?period=month` - revenue by domain
  - `GET /api/seller/analytics/bookings/?period=week` - booking trends

**Frontend Analytics Tab**
- [ ] Implement `AnalyticsTab.tsx`
  - Revenue chart (line chart, domain-colored)
  - Booking trends (bar chart)
  - Top listings (table with performance)
  - Customer insights (repeat rate, satisfaction)

- [ ] Add filters
  - Period selector (week, month, year)
  - Domain filter
  - Date range picker

**AI-Powered Insights**
- [ ] Integrate with assistant service
  - Generate insights: "Your event had 40% more registrations than average"
  - Recommendations: "You have 20 views but no bookings - consider lowering price"
  - Alerts: "3 new booking requests in your area"

- [ ] Implement `InsightsCard.tsx`
  - Displays AI-generated recommendations
  - Dismissible, cached for 24 hours

**Testing**
- [ ] Test revenue calculations across domains
- [ ] Verify analytics API performance (< 500ms)
- [ ] Test AI insight generation

**Deliverable:** Seller sees comprehensive analytics and AI-powered recommendations across all domains

---

## Detailed Implementation Guide

### Create seller_portal App

```bash
python manage.py startapp seller_portal
```

Add to `INSTALLED_APPS` in `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'seller_portal',
]
```

### Directory Structure

```
seller_portal/
├── __init__.py
├── apps.py
├── views.py          # Aggregator endpoints
├── urls.py
├── services.py       # Service factory
└── tests.py
```

### File: seller_portal/services.py

```python
from typing import Dict, Any

def get_domain_service(domain_slug: str):
    """Factory pattern - return appropriate domain service"""
    
    services = {
        'real_estate': ('real_estate.services', 'RealEstateDomainService'),
        'events': ('events.services', 'EventsDomainService'),
        'activities': ('activities.services', 'ActivitiesDomainService'),
        'appointments': ('appointments.services', 'AppointmentsDomainService'),
    }
    
    if domain_slug not in services:
        raise ValueError(f"Unknown domain: {domain_slug}")
    
    module_path, class_name = services[domain_slug]
    module = __import__(module_path, fromlist=[class_name])
    service_class = getattr(module, class_name)
    return service_class()
```

### File: seller_portal/views.py

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import get_domain_service

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_overview(request):
    """GET /api/seller/overview/"""
    
    business = request.user.business_profile
    if not business:
        return Response({'error': 'Not a business user'}, status=403)
    
    active_domains = business.get_active_domains()
    overview = {
        'business_id': str(business.id),
        'business_name': business.business_name,
        'total_listings': 0,
        'total_bookings': 0,
        'total_revenue': 0.0,
        'domains': [],
    }
    
    for domain_slug in active_domains:
        service = get_domain_service(domain_slug)
        metrics = service.get_metrics(request.user)
        
        overview['domains'].append(metrics)
        overview['total_listings'] += metrics.get('total_listings', 0)
        overview['total_bookings'] += metrics.get('total_bookings', 0)
        overview['total_revenue'] += metrics.get('revenue', 0.0)
    
    return Response(overview)
```

### File: seller_portal/urls.py

```python
from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.seller_overview, name='seller-overview'),
    path('listings/', views.all_listings, name='seller-listings'),
    path('bookings/', views.all_bookings, name='seller-bookings'),
    path('analytics/', views.analytics, name='seller-analytics'),
]
```

### Register in Main URLs

Add to `easy_islanders/urls.py`:
```python
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/seller/', include('seller_portal.urls')),
]
```

---

## Testing Strategy

### Backend Tests

```python
# seller_portal/tests.py

from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User, BusinessProfile
from real_estate.models import Listing as REListing

class SellerPortalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('seller', password='pass123')
        self.business = BusinessProfile.objects.create(
            user=self.user,
            business_name='Test Business'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_overview_endpoint(self):
        """Test /api/seller/overview/ returns aggregated metrics"""
        response = self.client.get('/api/seller/overview/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('business_name', response.data)
        self.assertIn('total_listings', response.data)
    
    def test_listings_endpoint(self):
        """Test /api/seller/listings/ returns all listings"""
        response = self.client.get('/api/seller/listings/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
```

### Frontend Tests

```typescript
// frontend/src/features/seller-dashboard/__tests__/SellerDashboard.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { SellerDashboard } from '../components/SellerDashboard';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

describe('SellerDashboard', () => {
  it('renders KPI cards with overview data', async () => {
    (useQuery as jest.Mock).mockReturnValueOnce({
      data: {
        business_name: 'Test Business',
        total_listings: 5,
        total_bookings: 10,
        total_revenue: 1200,
      },
      isLoading: false,
    });

    render(<SellerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // total listings
    });
  });
});
```

---

## Verification Checklist

### Week 1
- [ ] `seller_portal/` app created and registered
- [ ] `BaseDomainService` abstract class defined
- [ ] `RealEstateDomainService` implemented and tested
- [ ] `/api/seller/overview/` returns correct aggregated metrics
- [ ] Service factory pattern working

### Week 2
- [ ] Dashboard component renders without errors
- [ ] KPI cards display correct numbers
- [ ] Tab navigation works
- [ ] Responsive design tested on mobile
- [ ] Performance: page loads < 1s

### Week 3
- [ ] Listings table displays all columns
- [ ] Bookings table displays all columns
- [ ] Sorting and filtering work
- [ ] Modals open/close properly
- [ ] Edit/update operations persist

### Week 4
- [ ] All 4 domain services implemented
- [ ] Aggregator works with mixed domains
- [ ] Metrics calculations verified
- [ ] No duplicate listings in aggregation

### Week 5
- [ ] Analytics endpoints return correct data
- [ ] Charts render correctly
- [ ] AI insights generated and displayed
- [ ] Full end-to-end flow tested

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Dashboard Load Time** | < 1.5s | Lighthouse audit, browser devtools |
| **API Response Time** | < 300ms | Server logs, APM tool |
| **Cross-Domain Accuracy** | 100% | Unit tests, manual verification |
| **Code Coverage** | > 80% | Coverage.py report |
| **Responsive Design** | All breakpoints | Manual testing on mobile/tablet/desktop |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Service factory fails to load** | Test in isolation, add logging |
| **Missing data from some domains** | Graceful fallback, show "N/A" |
| **Performance degradation with 100+ listings** | Add pagination, caching at service layer |
| **Inconsistent metrics across domains** | Standardize metric calculations, document formula |

---

## Future Enhancements

- **Real-time notifications** via WebSocket when bookings arrive
- **Automated recommendations** using ML models
- **Payment integration** (Stripe, PayPal) for multi-currency support
- **Bulk operations** (archive 10 listings at once)
- **Custom dashboards** per business type
- **White-label** seller portal
- **Mobile app** with offline capability

---

## Dependencies

| Tool | Version | Purpose |
|------|---------|---------|
| Django | 4.x | Backend framework |
| Django REST Framework | 3.x | API layer |
| React | 18.x | Frontend framework |
| TanStack Query | 4.x | Data fetching |
| Tailwind CSS | 3.x | Styling |
| ShadCN UI | Latest | Component library |

---

## Reference Documents

- [MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md](./MULTI_DOMAIN_DASHBOARD_ARCHITECTURE.md) - Full architecture overview
- [API_CONTRACTS.md](./API_CONTRACTS.md) - API endpoint specifications
- [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) - Product context

---

**Start Date:** [TBD]  
**Target Completion:** 5 weeks  
**Status:** Planning Phase  
**Owner:** [Team Lead Name]
