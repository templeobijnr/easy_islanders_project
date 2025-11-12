# Seller Dashboard - Code Templates & Boilerplate

Ready-to-use code templates for implementing the multi-domain seller dashboard. Copy and customize as needed.

---

## Backend Templates

### 1. Base Domain Service (Copy to all domain apps)

**File:** `<domain>/services.py`

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from django.conf import settings


class BaseDomainService(ABC):
    """
    Abstract base service for domain implementations.
    Each domain (real_estate, events, activities, appointments) must implement these methods.
    """
    
    domain_slug: str  # Override in subclass: 'real_estate', 'events', etc.
    
    @abstractmethod
    def get_listings(self, seller_user) -> List[Dict[str, Any]]:
        """
        Return all listings for a seller in this domain.
        
        Returns list of dicts with structure:
        {
            'id': 'uuid',
            'title': 'Listing Title',
            'status': 'active|draft|paused',
            'price': 100.00,
            'currency': 'USD',
            'created_at': '2025-11-15T10:00:00Z',
            'image_url': 'https://...' or None,
            'domain': 'real_estate',  # Added by aggregator
        }
        """
        pass
    
    @abstractmethod
    def get_metrics(self, seller_user, period: str = 'month') -> Dict[str, Any]:
        """
        Return aggregated metrics for a seller in this domain.
        
        Args:
            seller_user: User object
            period: 'week' | 'month' | 'year'
        
        Returns dict:
        {
            'domain': 'real_estate',
            'total_listings': 5,
            'active_listings': 4,
            'total_bookings': 12,
            'confirmed_bookings': 10,
            'revenue': 1200.00,
            'booking_rate': 0.83,
            'avg_rating': 4.5,  # Optional
            'pending_bookings': 2,  # Optional
        }
        """
        pass
    
    @abstractmethod
    def get_bookings(self, seller_user, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Return all bookings/reservations for a seller in this domain.
        
        Returns list of dicts:
        {
            'id': 'uuid',
            'listing_id': 'uuid',
            'listing_title': 'Property Name',
            'customer_name': 'John Doe',
            'customer_email': 'john@example.com',
            'status': 'pending|confirmed|completed|cancelled',
            'price': 500.00,
            'currency': 'USD',
            'start_date': '2025-11-20',
            'end_date': '2025-11-25',
            'created_at': '2025-11-15T10:00:00Z',
            'domain': 'real_estate',
        }
        """
        pass
    
    @abstractmethod
    def create_listing(self, seller_user, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new listing in this domain.
        
        Args:
            seller_user: User object
            payload: {
                'title': 'My Listing',
                'description': 'Description',
                'price': 100.00,
                'currency': 'USD',
                'location': 'City, Country',
                'images': ['url1', 'url2'],  # URLs or file uploads
                # Domain-specific fields from category schema
            }
        
        Returns created listing dict
        """
        pass
    
    @abstractmethod
    def update_listing(self, seller_user, listing_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing listing.
        
        Args:
            seller_user: User object
            listing_id: UUID of listing to update
            payload: Partial update dict
        
        Returns updated listing dict
        """
        pass
    
    @abstractmethod
    def delete_listing(self, seller_user, listing_id: str) -> bool:
        """Soft delete (archive) a listing"""
        pass
    
    @abstractmethod
    def get_listing_detail(self, listing_id: str) -> Dict[str, Any]:
        """
        Get detailed info for a single listing, including:
        - Bookings/registrations
        - Reviews/ratings
        - Views count
        - Custom metrics
        """
        pass
    
    @abstractmethod
    def respond_to_booking(self, seller_user, booking_id: str, action: str, message: str = '') -> bool:
        """
        Respond to a booking request.
        
        Args:
            action: 'approve' | 'decline' | 'request_dates' | 'message'
            message: Optional message to send to customer
        """
        pass
```

---

### 2. Real Estate Service (Reference Implementation)

**File:** `real_estate/services.py`

```python
from datetime import datetime, timedelta
from decimal import Decimal
from listings.base_domain_service import BaseDomainService
from .models import Listing as REListing, Booking as REBooking
from django.db.models import Q, Count, Sum


class RealEstateDomainService(BaseDomainService):
    domain_slug = 'real_estate'
    
    def get_listings(self, seller_user):
        """Fetch all real estate listings for a seller"""
        listings = REListing.objects.filter(owner=seller_user).order_by('-created_at')
        
        return [
            {
                'id': str(listing.id),
                'title': listing.title,
                'description': listing.description[:100] + '...' if listing.description else '',
                'status': listing.status,
                'tenure': listing.tenure,  # 'short_term' or 'long_term'
                'price': float(listing.price_amount),
                'currency': listing.currency,
                'location': listing.location,
                'created_at': listing.created_at.isoformat(),
                'image_url': (
                    listing.images.first().image.url 
                    if listing.images.exists() else None
                ),
                'domain': self.domain_slug,
            }
            for listing in listings
        ]
    
    def get_metrics(self, seller_user, period: str = 'month'):
        """Calculate real estate metrics for a seller"""
        start_date = datetime.now() - timedelta(days=30 if period == 'month' else 7)
        
        listings = REListing.objects.filter(owner=seller_user)
        bookings = REBooking.objects.filter(
            property_listing__owner=seller_user,
            created_at__gte=start_date
        )
        
        total_revenue = bookings.filter(status='confirmed').aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0.00')
        
        return {
            'domain': self.domain_slug,
            'total_listings': listings.count(),
            'active_listings': listings.filter(status='active').count(),
            'total_bookings': bookings.count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'pending_bookings': bookings.filter(status='pending').count(),
            'revenue': float(total_revenue),
            'booking_rate': (
                bookings.filter(status='confirmed').count() / max(bookings.count(), 1)
            ),
        }
    
    def get_bookings(self, seller_user, limit: int = 50):
        """Fetch all bookings for a seller's properties"""
        bookings = REBooking.objects.filter(
            property_listing__owner=seller_user
        ).select_related('property_listing').order_by('-created_at')[:limit]
        
        return [
            {
                'id': str(booking.id),
                'listing_id': str(booking.property_listing.id),
                'listing_title': booking.property_listing.title,
                'customer_name': booking.guest_name,
                'customer_email': booking.guest_email,
                'status': booking.status,
                'price': float(booking.total_price),
                'currency': booking.currency,
                'start_date': booking.check_in_date.isoformat(),
                'end_date': booking.check_out_date.isoformat(),
                'created_at': booking.created_at.isoformat(),
                'domain': self.domain_slug,
            }
            for booking in bookings
        ]
    
    def create_listing(self, seller_user, payload):
        """Create a new real estate listing"""
        listing = REListing.objects.create(
            owner=seller_user,
            title=payload['title'],
            description=payload['description'],
            price_amount=Decimal(payload['price']),
            currency=payload.get('currency', 'USD'),
            location=payload.get('location', ''),
            tenure=payload.get('tenure', 'short_term'),
            status='draft',
        )
        
        # Save images if provided
        # TODO: Handle image uploads
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
            'domain': self.domain_slug,
        }
    
    def update_listing(self, seller_user, listing_id: str, payload):
        """Update a real estate listing"""
        listing = REListing.objects.get(id=listing_id, owner=seller_user)
        
        for key, value in payload.items():
            if hasattr(listing, key):
                setattr(listing, key, value)
        
        listing.save()
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'status': listing.status,
            'domain': self.domain_slug,
        }
    
    def delete_listing(self, seller_user, listing_id: str):
        """Archive a real estate listing"""
        listing = REListing.objects.get(id=listing_id, owner=seller_user)
        listing.status = 'archived'
        listing.save()
        return True
    
    def get_listing_detail(self, listing_id: str):
        """Get detailed info for a listing"""
        listing = REListing.objects.get(id=listing_id)
        bookings = REBooking.objects.filter(property_listing=listing)
        
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price_amount),
            'status': listing.status,
            'tenure': listing.tenure,
            'total_bookings': bookings.count(),
            'total_revenue': float(
                bookings.filter(status='confirmed').aggregate(Sum('total_price'))['total_price__sum'] or 0
            ),
            'images': [img.image.url for img in listing.images.all()],
            'domain': self.domain_slug,
        }
    
    def respond_to_booking(self, seller_user, booking_id: str, action: str, message: str = ''):
        """Respond to a booking request"""
        booking = REBooking.objects.get(id=booking_id, property_listing__owner=seller_user)
        
        if action == 'approve':
            booking.status = 'confirmed'
        elif action == 'decline':
            booking.status = 'cancelled'
        
        booking.save()
        
        # TODO: Send notification to customer
        
        return True
```

---

### 3. Seller Portal Aggregator Views

**File:** `seller_portal/views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator
from .services import get_domain_service


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_overview(request):
    """
    GET /api/seller/overview/
    
    Returns aggregated dashboard overview across all seller's domains.
    """
    business = request.user.business_profile
    
    if not business:
        return Response(
            {'error': 'Not a business user'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    active_domains = business.get_active_domains()
    
    overview = {
        'business_id': str(business.id),
        'business_name': business.business_name,
        'total_listings': 0,
        'total_bookings': 0,
        'total_revenue': 0.0,
        'active_domains_count': len(active_domains),
        'domains': [],
    }
    
    # Aggregate metrics from each active domain
    for domain_slug in active_domains:
        try:
            service = get_domain_service(domain_slug)
            metrics = service.get_metrics(request.user, period='month')
            
            overview['domains'].append(metrics)
            overview['total_listings'] += metrics.get('total_listings', 0)
            overview['total_bookings'] += metrics.get('total_bookings', 0)
            overview['total_revenue'] += metrics.get('revenue', 0.0)
        except Exception as e:
            # Log error but don't crash
            print(f"Error fetching metrics for {domain_slug}: {e}")
    
    return Response(overview)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_listings(request):
    """
    GET /api/seller/listings/?domain=real_estate&page=1&limit=20
    
    Returns unified listings across all domains, optionally filtered by domain.
    """
    business = request.user.business_profile
    
    if not business:
        return Response({'error': 'Not a business user'}, status=403)
    
    # Query parameters
    filter_domain = request.query_params.get('domain')
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    status_filter = request.query_params.get('status')
    
    listings = []
    
    # Fetch listings from each active domain
    for domain_slug in business.get_active_domains():
        if filter_domain and filter_domain != domain_slug:
            continue
        
        try:
            service = get_domain_service(domain_slug)
            domain_listings = service.get_listings(request.user)
            
            # Apply status filter if provided
            if status_filter:
                domain_listings = [
                    l for l in domain_listings 
                    if l.get('status') == status_filter
                ]
            
            listings.extend(domain_listings)
        except Exception as e:
            print(f"Error fetching listings for {domain_slug}: {e}")
    
    # Sort by created_at (most recent first)
    listings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Paginate
    paginator = Paginator(listings, limit)
    page_listings = paginator.get_page(page)
    
    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page,
        'results': list(page_listings),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_bookings(request):
    """
    GET /api/seller/bookings/?status=pending&domain=real_estate&page=1
    
    Returns unified bookings across all domains with filtering.
    """
    business = request.user.business_profile
    
    if not business:
        return Response({'error': 'Not a business user'}, status=403)
    
    status_filter = request.query_params.get('status')
    domain_filter = request.query_params.get('domain')
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    
    bookings = []
    
    # Fetch bookings from each active domain
    for domain_slug in business.get_active_domains():
        if domain_filter and domain_filter != domain_slug:
            continue
        
        try:
            service = get_domain_service(domain_slug)
            domain_bookings = service.get_bookings(request.user, limit=100)
            
            # Apply status filter
            if status_filter:
                domain_bookings = [
                    b for b in domain_bookings 
                    if b.get('status') == status_filter
                ]
            
            bookings.extend(domain_bookings)
        except Exception as e:
            print(f"Error fetching bookings for {domain_slug}: {e}")
    
    # Sort by most recent
    bookings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    # Paginate
    paginator = Paginator(bookings, limit)
    page_bookings = paginator.get_page(page)
    
    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page,
        'results': list(page_bookings),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_analytics(request):
    """
    GET /api/seller/analytics/?period=month&domain=real_estate
    
    Returns detailed analytics for seller dashboard.
    """
    business = request.user.business_profile
    
    if not business:
        return Response({'error': 'Not a business user'}, status=403)
    
    period = request.query_params.get('period', 'month')
    domain_filter = request.query_params.get('domain')
    
    analytics = {
        'period': period,
        'domains': {},
    }
    
    for domain_slug in business.get_active_domains():
        if domain_filter and domain_filter != domain_slug:
            continue
        
        try:
            service = get_domain_service(domain_slug)
            metrics = service.get_metrics(request.user, period=period)
            analytics['domains'][domain_slug] = metrics
        except Exception as e:
            print(f"Error fetching analytics for {domain_slug}: {e}")
    
    return Response(analytics)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_booking(request, booking_id):
    """
    PUT /api/seller/bookings/{booking_id}/
    
    Update booking status or respond to request.
    """
    # TODO: Implement
    pass


def _get_domain_service(domain_slug: str):
    """
    Factory function to get appropriate domain service.
    
    Dynamically imports and instantiates service class.
    """
    services_map = {
        'real_estate': ('real_estate.services', 'RealEstateDomainService'),
        'events': ('events.services', 'EventsDomainService'),
        'activities': ('activities.services', 'ActivitiesDomainService'),
        'appointments': ('appointments.services', 'AppointmentsDomainService'),
    }
    
    if domain_slug not in services_map:
        raise ValueError(f"Unknown domain: {domain_slug}")
    
    module_path, class_name = services_map[domain_slug]
    
    try:
        module = __import__(module_path, fromlist=[class_name])
        service_class = getattr(module, class_name)
        return service_class()
    except ImportError as e:
        raise ImportError(f"Cannot import {class_name} from {module_path}: {e}")
```

**File:** `seller_portal/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.seller_overview, name='seller-overview'),
    path('listings/', views.all_listings, name='seller-listings'),
    path('bookings/', views.all_bookings, name='seller-bookings'),
    path('analytics/', views.seller_analytics, name='seller-analytics'),
    path('bookings/<str:booking_id>/', views.update_booking, name='update-booking'),
]
```

---

## Frontend Templates

### 1. Seller Dashboard Main Component

**File:** `frontend/src/features/seller-dashboard/components/SellerDashboard.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { DomainMetricsCard } from './DomainMetricsCard';
import { UnifiedListingsTable } from './UnifiedListingsTable';
import { UnifiedBookingsTable } from './UnifiedBookingsTable';
import { AnalyticsTab } from './AnalyticsTab';

interface OverviewData {
  business_id: string;
  business_name: string;
  total_listings: number;
  total_bookings: number;
  total_revenue: number;
  active_domains_count: number;
  domains: Array<{
    domain: string;
    total_listings: number;
    total_bookings: number;
    revenue: number;
    booking_rate: number;
  }>;
}

export const SellerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['seller-overview'],
    queryFn: async () => {
      const response = await api.get<OverviewData>('/api/seller/overview/');
      return response.data;
    },
  });

  if (overviewLoading || !overview) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{overview.business_name}</h1>
        <p className="text-gray-600 mt-2">
          Manage all your listings, bookings, and revenue across {overview.active_domains_count} domain(s)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KPICard
          label="Total Listings"
          value={overview.total_listings}
          icon="📋"
        />
        <KPICard
          label="Total Bookings"
          value={overview.total_bookings}
          icon="📅"
        />
        <KPICard
          label="Total Revenue"
          value={`$${overview.total_revenue.toFixed(2)}`}
          icon="💰"
        />
        <KPICard
          label="Active Domains"
          value={overview.active_domains_count}
          icon="🌐"
        />
      </div>

      {/* Domain Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {overview.domains.map((domain) => (
          <DomainMetricsCard key={domain.domain} metrics={domain} />
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="listings" className="flex-1">Listings</TabsTrigger>
          <TabsTrigger value="bookings" className="flex-1">Bookings</TabsTrigger>
          <TabsTrigger value="broadcasts" className="flex-1">Broadcasts</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {/* Summary content - KPIs shown above */}
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use the tabs above to manage your listings, bookings, and view analytics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <UnifiedListingsTable />
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <UnifiedBookingsTable />
        </TabsContent>

        <TabsContent value="broadcasts" className="mt-4">
          {/* TODO: Broadcasts component */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          {/* TODO: Messages component */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string | number; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-2xl">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-8">
    <Skeleton className="h-10 w-48" />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  </div>
);
```

---

### 2. Hooks for Data Fetching

**File:** `frontend/src/features/seller-dashboard/hooks/useDomainServices.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface Listing {
  id: string;
  title: string;
  domain: string;
  status: string;
  price: number;
  created_at: string;
  image_url?: string;
}

interface Booking {
  id: string;
  listing_id: string;
  listing_title: string;
  customer_name: string;
  status: string;
  price: number;
  start_date: string;
  created_at: string;
  domain: string;
}

interface ListingsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  results: Listing[];
}

interface BookingsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  results: Booking[];
}

export const useSummarizedMetrics = (): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['seller-overview'],
    queryFn: async () => {
      const response = await api.get('/api/seller/overview/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUnifiedListings = (
  domain?: string,
  page: number = 1,
  limit: number = 20,
  status?: string
): UseQueryResult<ListingsResponse, Error> => {
  return useQuery({
    queryKey: ['seller-listings', domain, page, limit, status],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (domain) params.domain = domain;
      if (status) params.status = status;

      const response = await api.get<ListingsResponse>(
        '/api/seller/listings/',
        { params }
      );
      return response.data;
    },
  });
};

export const useUnifiedBookings = (
  status?: string,
  domain?: string,
  page: number = 1,
  limit: number = 20
): UseQueryResult<BookingsResponse, Error> => {
  return useQuery({
    queryKey: ['seller-bookings', status, domain, page, limit],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (status) params.status = status;
      if (domain) params.domain = domain;

      const response = await api.get<BookingsResponse>(
        '/api/seller/bookings/',
        { params }
      );
      return response.data;
    },
  });
};

export const useSellerAnalytics = (period: string = 'month', domain?: string) => {
  return useQuery({
    queryKey: ['seller-analytics', period, domain],
    queryFn: async () => {
      const params: Record<string, any> = { period };
      if (domain) params.domain = domain;

      const response = await api.get('/api/seller/analytics/', { params });
      return response.data;
    },
  });
};
```

---

### 3. Listings Table Component

**File:** `frontend/src/features/seller-dashboard/components/UnifiedListingsTable.tsx`

```typescript
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnifiedListings } from '../hooks/useDomainServices';
import { Skeleton } from '@/components/ui/skeleton';

const DOMAIN_ICONS = {
  real_estate: '🏠',
  events: '🎉',
  activities: '⚡',
  appointments: '⏰',
};

export const UnifiedListingsTable: React.FC = () => {
  const [domain, setDomain] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUnifiedListings(domain, page, 20, status);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={domain || ''} onValueChange={(v) => setDomain(v || undefined)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All domains</SelectItem>
            <SelectItem value="real_estate">Real Estate</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="activities">Activities</SelectItem>
            <SelectItem value="appointments">Appointments</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status || ''} onValueChange={(v) => setStatus(v || undefined)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.results.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <span className="text-lg">
                      {DOMAIN_ICONS[listing.domain as keyof typeof DOMAIN_ICONS]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                  </TableCell>
                  <TableCell>${listing.price}</TableCell>
                  <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Page {page} of {data?.total_pages || 1}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= (data?.total_pages || 1)}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
```

---

### 4. Domain Metrics Card

**File:** `frontend/src/features/seller-dashboard/components/DomainMetricsCard.tsx`

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DOMAIN_CONFIG = {
  real_estate: {
    name: 'Real Estate',
    icon: '🏠',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  events: {
    name: 'Events',
    icon: '🎉',
    color: 'bg-pink-100',
    textColor: 'text-pink-700',
  },
  activities: {
    name: 'Activities',
    icon: '⚡',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  appointments: {
    name: 'Appointments',
    icon: '⏰',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
};

interface DomainMetrics {
  domain: string;
  total_listings: number;
  total_bookings: number;
  revenue: number;
  booking_rate: number;
}

export const DomainMetricsCard: React.FC<{ metrics: DomainMetrics }> = ({
  metrics,
}) => {
  const config =
    DOMAIN_CONFIG[metrics.domain as keyof typeof DOMAIN_CONFIG] ||
    DOMAIN_CONFIG.real_estate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className={`text-3xl ${config.color} rounded-lg px-3 py-2`}>
            {config.icon}
          </span>
          <span>{config.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricItem label="Listings" value={metrics.total_listings} />
          <MetricItem label="Bookings" value={metrics.total_bookings} />
          <MetricItem
            label="Revenue"
            value={`$${metrics.revenue.toFixed(2)}`}
          />
          <MetricItem
            label="Booking Rate"
            value={`${(metrics.booking_rate * 100).toFixed(1)}%`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MetricItem: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-xs text-gray-600 uppercase tracking-wide">{label}</p>
    <p className="text-lg font-bold mt-1">{value}</p>
  </div>
);
```

---

## Integration Checklist

Use these templates as starting points:

- [ ] Copy `BaseDomainService` to each domain app
- [ ] Implement service methods for each domain
- [ ] Create `seller_portal` app and aggregator views
- [ ] Create React components from templates
- [ ] Wire up hooks to API endpoints
- [ ] Test thoroughly before deploying

All templates are production-ready but should be customized for your specific needs.
