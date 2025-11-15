# Portfolio Page Component Data Requirements & API Contracts

**Last Updated:** 2025-11-15
**Purpose:** Complete specification of data requirements, API contracts, and backend integration for all 15 UX enhancement components.

---

## Table of Contents

1. [ListingHealthBadge](#1-listinghealthbadge)
2. [HelpTooltip](#2-helptooltip)
3. [QuickFilterChips](#3-quickfilterchips)
4. [DataFreshnessIndicator](#4-datafreshnessindicator)
5. [InsightsBanner](#5-insightsbanner)
6. [BulkActionTemplates](#6-bulkactiontemplates)
7. [KeyboardShortcuts](#7-keyboardshortcuts)
8. [ExportTemplates](#8-exporttemplates)
9. [ProgressiveLoader](#9-progressiveloader)
10. [EmptyState (Enhanced)](#10-emptystate-enhanced)
11. [KPICardsGrid (Enhanced)](#11-kpicardsgrid-enhanced)
12. [PortfolioPageEnhanced (Main Integration)](#12-portfoliopageenhanced-main-integration)

---

## 1. ListingHealthBadge

### Purpose
Displays a visual health indicator (🟢🟡🔴) for each listing based on completeness and performance metrics.

### Component Interface
```typescript
interface HealthScore {
  score: number;           // 0-100
  status: 'excellent' | 'good' | 'needs-improvement';
  color: string;           // 'emerald', 'amber', 'rose'
  issues: string[];        // List of specific issues
}

interface ListingHealthBadgeProps {
  listing: PortfolioListing;  // Full listing object
  showLabel?: boolean;        // Show text label alongside badge
  showIssues?: boolean;       // Show issue list on hover
  className?: string;
}
```

### Data Requirements

**From PortfolioListing object:**
```typescript
interface PortfolioListing {
  // Completeness factors (50 points total)
  title: string;              // Required, length > 10 (10 pts)
  base_price: number;         // Required, > 0 (10 pts)
  bedrooms?: number;          // Optional (5 pts)
  bathrooms?: number;         // Optional (5 pts)
  city?: string;             // Required for location (5 pts)
  area?: string;             // Optional (5 pts)
  amenities?: string[];      // Array of amenities (10 pts if length >= 3)

  // Performance factors (50 points total)
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'OCCUPIED';  // ACTIVE = 20 pts
  views_30d: number;         // > 0 = 10 pts
  enquiries_30d: number;     // > 0 = 10 pts
  bookings_30d: number;      // > 0 = 15 pts
  available_from?: string;   // Date string (5 pts if set)
}
```

### API Contract

**No new endpoint required** - uses existing listing data from:
```
GET /api/v1/real_estate/portfolio/listings/
```

**Response includes all required fields above.**

### Backend Implementation Notes

1. **Health score calculation is done on frontend** - no backend changes needed
2. Ensure all fields are returned in listing API response
3. `views_30d`, `enquiries_30d`, `bookings_30d` should be computed fields in backend
4. Consider adding these to Django model as properties or computed fields

### Integration Example
```typescript
<ListingHealthBadge
  listing={listing}
  showLabel={true}
  showIssues={true}
/>
```

---

## 2. HelpTooltip

### Purpose
Provides inline help text with descriptions and industry benchmarks for metrics.

### Component Interface
```typescript
interface HelpTooltipProps {
  title: string;        // Metric name (e.g., "Occupancy Rate")
  description: string;  // What this metric means
  benchmark?: string;   // Industry benchmark/guidance
  className?: string;
}
```

### Data Requirements

**Static content** - All help text is hardcoded in component. No API needed.

**Content Structure:**
```typescript
const metricHelp = {
  'Total Portfolio Value': {
    description: 'Total estimated market value of all your active property listings combined.',
    benchmark: 'Aim for steady growth aligned with market appreciation (3-5% annually).'
  },
  'Occupancy Rate': {
    description: 'Percentage of time your properties are booked vs. available for short-term rentals.',
    benchmark: 'Industry average: 60-70%. Top performers: 75-85%.'
  },
  // ... etc
};
```

### API Contract

**No API required** - Static content.

**Future Enhancement:** Could fetch from CMS endpoint:
```
GET /api/v1/help/metrics/
Response: {
  metrics: [
    { key: 'occupancy_rate', title: '...', description: '...', benchmark: '...' }
  ]
}
```

### Integration Example
```typescript
<HelpTooltip
  title="Occupancy Rate"
  description="% of time your properties are booked..."
  benchmark="Industry average: 60-70%"
/>
```

---

## 3. QuickFilterChips

### Purpose
Pre-configured filter views for common scenarios (all, active, needs-attention, high-performers, drafts).

### Component Interface
```typescript
type QuickFilterType = 'all' | 'needs-attention' | 'high-performers' | 'drafts' | 'active';

interface QuickFilterChipsProps {
  activeFilter: QuickFilterType;
  onFilterChange: (filter: QuickFilterType) => void;
  counts?: {
    all: number;
    needsAttention: number;
    highPerformers: number;
    drafts: number;
    active: number;
  };
  className?: string;
}
```

### Data Requirements

**Counts for each filter view:**
```typescript
{
  all: 42,              // Total listings
  active: 38,           // Status = ACTIVE
  needsAttention: 5,    // Health score < 60 OR enquiries_30d === 0
  highPerformers: 12,   // Health score >= 80 AND bookings_30d > 0
  drafts: 4             // Status = DRAFT
}
```

### API Contract

**Option 1: Compute on frontend** from existing listing data (current implementation)

**Option 2: Backend endpoint** (recommended for large datasets):
```
GET /api/v1/real_estate/portfolio/filter-counts/

Response:
{
  "all": 42,
  "active": 38,
  "needs_attention": 5,
  "high_performers": 12,
  "drafts": 4
}
```

**Backend Logic:**
```python
# Django view example
class PortfolioFilterCountsView(APIView):
    def get(self, request):
        user_listings = Listing.objects.filter(owner=request.user)

        return Response({
            'all': user_listings.count(),
            'active': user_listings.filter(status='ACTIVE').count(),
            'needs_attention': user_listings.filter(
                Q(health_score__lt=60) | Q(enquiries_30d=0)
            ).count(),
            'high_performers': user_listings.filter(
                health_score__gte=80, bookings_30d__gt=0
            ).count(),
            'drafts': user_listings.filter(status='DRAFT').count()
        })
```

### Integration Example
```typescript
const { data: counts } = useQuery({
  queryKey: ['filterCounts'],
  queryFn: fetchFilterCounts
});

<QuickFilterChips
  activeFilter={currentFilter}
  onFilterChange={setFilter}
  counts={counts}
/>
```

---

## 4. DataFreshnessIndicator

### Purpose
Shows when data was last updated and provides manual refresh capability.

### Component Interface
```typescript
interface DataFreshnessIndicatorProps {
  lastUpdated?: Date;       // When data was fetched
  onRefresh: () => void;    // Callback to refresh data
  isRefreshing?: boolean;   // Loading state
  className?: string;
}
```

### Data Requirements

**From React Query cache metadata:**
```typescript
const { data, dataUpdatedAt, refetch, isRefetching } = useQuery({
  queryKey: ['portfolioListings'],
  queryFn: fetchListings
});

const lastUpdated = new Date(dataUpdatedAt);
```

### API Contract

**No new endpoint required** - uses existing query metadata.

**Manual Refresh:** Triggers existing endpoints:
```
GET /api/v1/real_estate/portfolio/listings/?force_refresh=true
GET /api/v1/real_estate/portfolio/summary/?force_refresh=true
```

**Backend Enhancement (optional):**
Add cache headers to responses:
```python
response = JsonResponse(data)
response['X-Data-Timestamp'] = datetime.now().isoformat()
response['Cache-Control'] = 'max-age=300'  # 5 minutes
return response
```

### Integration Example
```typescript
<DataFreshnessIndicator
  lastUpdated={new Date(dataUpdatedAt)}
  onRefresh={refetch}
  isRefreshing={isRefetching}
/>
```

---

## 5. InsightsBanner

### Purpose
Displays auto-generated insights based on portfolio performance with actionable CTAs.

### Component Interface
```typescript
type InsightType = 'positive' | 'warning' | 'neutral' | 'opportunity';

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InsightsBannerProps {
  insights: Insight[];
  onDismiss?: (insightId: string) => void;
  className?: string;
}
```

### Data Requirements

**Generated from KPI analysis:**
```typescript
interface PortfolioAnalytics {
  // Current period metrics
  occupancyRate: number;
  conversionRate: number;
  avgDailyRate: number;
  monthlyRevenue: number;

  // Comparison with previous period
  occupancyChange: number;      // +12.5 = up 12.5%
  conversionChange: number;
  revenueChange: number;

  // Trend analysis
  topPerformers: PortfolioListing[];  // Top 3 by bookings
  lowPerformers: PortfolioListing[];   // Bottom 3 by health score
  incompleteListings: PortfolioListing[];

  // Seasonal insights
  seasonalTrends?: {
    nextMonthForecast: 'high' | 'medium' | 'low';
    suggestedAction: string;
  };
}
```

### API Contract

**New Endpoint Required:**
```
GET /api/v1/real_estate/portfolio/insights/

Query Parameters:
- time_period: '30d' | '90d' | '1y'

Response:
{
  "insights": [
    {
      "id": "occupancy-high-2024-11",
      "type": "positive",
      "title": "Excellent occupancy rate at 78.5%",
      "description": "Your properties are performing above the industry average. 3 listings are driving this growth: Kyrenia Villa, Nicosia Apartment, Famagusta Studio.",
      "priority": 1,
      "category": "performance",
      "metadata": {
        "metric": "occupancy",
        "change_pct": 12.5,
        "top_listings": ["listing-123", "listing-456", "listing-789"]
      }
    },
    {
      "id": "conversion-low-2024-11",
      "type": "warning",
      "title": "Conversion rate below industry average",
      "description": "Your inquiry-to-booking rate is 8.2%, below the target 15-25%. Consider reviewing pricing or listing quality.",
      "priority": 2,
      "category": "conversion",
      "metadata": {
        "metric": "conversion_rate",
        "current_value": 8.2,
        "target_range": [15, 25]
      }
    },
    {
      "id": "incomplete-listings-2024-11",
      "type": "warning",
      "title": "5 listings have incomplete information",
      "description": "Listings with complete details get 3x more enquiries on average.",
      "priority": 3,
      "category": "quality",
      "metadata": {
        "incomplete_count": 5,
        "incomplete_listings": ["listing-111", "listing-222", ...]
      }
    },
    {
      "id": "seasonal-opportunity-2024-11",
      "type": "opportunity",
      "title": "Summer pricing opportunity",
      "description": "Similar properties are increasing prices by 15-20% for July-August.",
      "priority": 4,
      "category": "pricing",
      "metadata": {
        "season": "summer",
        "suggested_increase_pct": [15, 20],
        "affected_listings": 12
      }
    }
  ],
  "generated_at": "2024-11-15T10:30:00Z"
}
```

**Backend Implementation:**
```python
# Django view example
class PortfolioInsightsView(APIView):
    def get(self, request):
        time_period = request.GET.get('time_period', '30d')
        user_listings = Listing.objects.filter(owner=request.user)

        insights = []

        # 1. Occupancy insight
        occupancy_rate = calculate_occupancy_rate(user_listings, time_period)
        if occupancy_rate > 75:
            insights.append({
                'id': f'occupancy-high-{datetime.now().strftime("%Y-%m")}',
                'type': 'positive',
                'title': f'Excellent occupancy rate at {occupancy_rate:.1f}%',
                'description': '...',
                'priority': 1,
                'category': 'performance',
                'metadata': {...}
            })

        # 2. Conversion rate insight
        conversion_rate = calculate_conversion_rate(user_listings, time_period)
        if conversion_rate < 10:
            insights.append({
                'id': f'conversion-low-{datetime.now().strftime("%Y-%m")}',
                'type': 'warning',
                'title': 'Conversion rate below industry average',
                'description': f'Your rate is {conversion_rate:.1f}%, below target 15-25%',
                'priority': 2,
                'category': 'conversion',
                'metadata': {...}
            })

        # 3. Incomplete listings insight
        incomplete = user_listings.filter(health_score__lt=60)
        if incomplete.count() > 0:
            insights.append({
                'id': f'incomplete-listings-{datetime.now().strftime("%Y-%m")}',
                'type': 'warning',
                'title': f'{incomplete.count()} listings have incomplete information',
                'description': 'Complete listings get 3x more enquiries',
                'priority': 3,
                'category': 'quality',
                'metadata': {
                    'incomplete_count': incomplete.count(),
                    'incomplete_listings': list(incomplete.values_list('id', flat=True))
                }
            })

        # 4. Seasonal opportunity
        if is_pre_summer_period():
            insights.append({
                'id': f'seasonal-opportunity-{datetime.now().strftime("%Y-%m")}',
                'type': 'opportunity',
                'title': 'Summer pricing opportunity',
                'description': 'Similar properties increasing prices 15-20%',
                'priority': 4,
                'category': 'pricing',
                'metadata': {...}
            })

        # Sort by priority
        insights.sort(key=lambda x: x['priority'])

        return Response({
            'insights': insights[:5],  # Limit to top 5
            'generated_at': datetime.now().isoformat()
        })
```

### Integration Example
```typescript
const { data: insightsData } = useQuery({
  queryKey: ['portfolioInsights', timePeriod],
  queryFn: () => fetchInsights(timePeriod)
});

const insights: Insight[] = insightsData?.insights.map(insight => ({
  ...insight,
  action: {
    label: getActionLabel(insight.category),
    onClick: () => handleInsightAction(insight)
  }
})) || [];

<InsightsBanner
  insights={insights}
  onDismiss={(id) => localStorage.setItem(`insight-dismissed-${id}`, 'true')}
/>
```

---

## 6. BulkActionTemplates

### Purpose
Pre-configured bulk operation templates for common tasks (mark as rented, adjust pricing, etc.).

### Component Interface
```typescript
interface BulkTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'status' | 'pricing' | 'availability' | 'settings';
}

interface BulkActionTemplatesProps {
  templates: BulkTemplate[];
  disabled?: boolean;
  className?: string;
}
```

### Data Requirements

**Templates are predefined on frontend**, actions call backend endpoints.

**Template Actions:**
```typescript
const templates = [
  {
    id: 'mark-rented',
    action: () => bulkUpdateStatus(selectedIds, 'OCCUPIED')
  },
  {
    id: 'summer-pricing',
    action: () => bulkAdjustPrice(selectedIds, 1.20)  // +20%
  },
  // ...
];
```

### API Contract

**Bulk Update Endpoint (Required):**
```
POST /api/v1/real_estate/portfolio/bulk-update/

Request Body:
{
  "listing_ids": ["listing-123", "listing-456", "listing-789"],
  "action": "update_status" | "adjust_price" | "set_availability",
  "params": {
    // For update_status:
    "status": "ACTIVE" | "INACTIVE" | "DRAFT" | "OCCUPIED"

    // For adjust_price:
    "adjustment_type": "percentage" | "fixed",
    "adjustment_value": 1.20,  // 20% increase or +120 EUR

    // For set_availability:
    "available_from": "2024-07-01",
    "available_to": "2024-08-31"
  }
}

Response:
{
  "success": true,
  "updated_count": 3,
  "failed": [],
  "message": "Successfully updated 3 listings"
}
```

**Backend Implementation:**
```python
class BulkUpdateView(APIView):
    def post(self, request):
        listing_ids = request.data.get('listing_ids', [])
        action = request.data.get('action')
        params = request.data.get('params', {})

        listings = Listing.objects.filter(
            id__in=listing_ids,
            owner=request.user
        )

        updated = 0
        failed = []

        if action == 'update_status':
            status = params.get('status')
            updated = listings.update(status=status)

        elif action == 'adjust_price':
            adjustment_type = params.get('adjustment_type')
            value = params.get('adjustment_value')

            for listing in listings:
                try:
                    if adjustment_type == 'percentage':
                        listing.base_price *= value
                    else:
                        listing.base_price += value
                    listing.save()
                    updated += 1
                except Exception as e:
                    failed.append({'id': listing.id, 'error': str(e)})

        elif action == 'set_availability':
            updated = listings.update(
                available_from=params.get('available_from'),
                available_to=params.get('available_to')
            )

        return Response({
            'success': len(failed) == 0,
            'updated_count': updated,
            'failed': failed,
            'message': f'Successfully updated {updated} listings'
        })
```

### Integration Example
```typescript
const templates: BulkTemplate[] = DEFAULT_BULK_TEMPLATES.map(t => ({
  ...t,
  action: async () => {
    await bulkUpdate({
      listing_ids: selectedListingIds,
      action: t.id === 'mark-rented' ? 'update_status' : 'adjust_price',
      params: getParamsForTemplate(t.id)
    });
    toast.success(`Applied ${t.label} to ${selectedListingIds.length} listings`);
    refetch();
  }
}));

<BulkActionTemplates
  templates={templates}
  disabled={selectedListingIds.length === 0}
/>
```

---

## 7. KeyboardShortcuts

### Purpose
Global keyboard navigation for power users.

### Component Interface
```typescript
interface Shortcut {
  key: string;  // 'l', 'o', 'a', 'n', '/', 'escape', etc.
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'filters' | 'general';
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  disabled?: boolean;
}
```

### Data Requirements

**No backend data required** - Pure frontend functionality.

**Configuration:**
```typescript
const shortcuts: Shortcut[] = [
  { key: 'l', description: 'Go to Listings', action: () => setTab('listings'), category: 'navigation' },
  { key: 'n', description: 'New listing', action: () => navigate('/create'), category: 'actions' },
  // ...
];
```

### API Contract

**No API required** - Client-side only.

### Integration Example
```typescript
<KeyboardShortcuts shortcuts={shortcuts} />
```

---

## 8. ExportTemplates

### Purpose
Multiple export format options with clear descriptions.

### Component Interface
```typescript
interface ExportTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  format: 'csv' | 'xlsx' | 'pdf' | 'json' | 'png';
  onExport: () => void;
}

interface ExportTemplatesProps {
  templates: ExportTemplate[];
  currentFilterCount?: number;
  disabled?: boolean;
  className?: string;
}
```

### Data Requirements

**Exports current filtered listing data.**

### API Contract

**Export Endpoint (Required):**
```
POST /api/v1/real_estate/portfolio/export/

Request Body:
{
  "format": "csv" | "xlsx" | "pdf" | "json",
  "template": "full-report" | "performance-summary" | "active-listings" | "financial-data",
  "filters": {
    "listing_type": "DAILY_RENTAL",
    "status": "ACTIVE",
    "city": "Kyrenia"
    // ... any active filters
  }
}

Response:
{
  "download_url": "https://s3.../exports/portfolio-2024-11-15.xlsx",
  "expires_at": "2024-11-15T11:30:00Z",
  "record_count": 42
}
```

**Backend Implementation:**
```python
class PortfolioExportView(APIView):
    def post(self, request):
        format_type = request.data.get('format', 'csv')
        template = request.data.get('template', 'full-report')
        filters = request.data.get('filters', {})

        # Get filtered listings
        listings = Listing.objects.filter(owner=request.user)
        for key, value in filters.items():
            if value and value != 'ALL':
                listings = listings.filter(**{key: value})

        # Generate export based on template
        if template == 'full-report':
            fields = ['reference_code', 'title', 'status', 'base_price',
                     'views_30d', 'enquiries_30d', 'bookings_30d']
        elif template == 'performance-summary':
            fields = ['reference_code', 'title', 'views_30d',
                     'enquiries_30d', 'bookings_30d', 'revenue_30d']
        elif template == 'financial-data':
            fields = ['reference_code', 'title', 'base_price',
                     'revenue_30d', 'revenue_90d', 'revenue_1y']

        # Generate file
        if format_type == 'csv':
            file_path = generate_csv(listings, fields)
        elif format_type == 'xlsx':
            file_path = generate_xlsx(listings, fields)

        # Upload to S3 and return URL
        download_url = upload_to_s3(file_path)

        return Response({
            'download_url': download_url,
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat(),
            'record_count': listings.count()
        })
```

### Integration Example
```typescript
const templates: ExportTemplate[] = DEFAULT_EXPORT_TEMPLATES.map(t => ({
  ...t,
  onExport: async () => {
    const response = await exportPortfolio({
      format: t.format,
      template: t.id,
      filters: currentFilters
    });
    window.open(response.download_url, '_blank');
    toast.success(`Exported ${response.record_count} listings to ${t.format.toUpperCase()}`);
  }
}));

<ExportTemplates
  templates={templates}
  currentFilterCount={filteredListings.length}
/>
```

---

## 9. ProgressiveLoader

### Purpose
Enhanced loading states with progressive messages instead of generic spinners.

### Component Interface
```typescript
interface LoadingStage {
  message: string;
  duration: number;  // milliseconds
}

interface ProgressiveLoaderProps {
  stages?: LoadingStage[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### Data Requirements

**No backend data required** - Static loading messages.

**Configuration:**
```typescript
const stages: LoadingStage[] = [
  { message: 'Fetching your listings...', duration: 600 },
  { message: 'Loading property details...', duration: 500 },
  { message: 'Preparing table view...', duration: 400 }
];
```

### API Contract

**No API required** - Client-side only.

### Integration Example
```typescript
{isLoading && <ListingsLoader />}
{isLoadingAnalytics && <AnalyticsLoader />}
```

---

## 10. EmptyState (Enhanced)

### Purpose
Context-aware empty states that show counts of listings in other states.

### Component Interface
```typescript
interface ContextHint {
  label: string;
  count: number;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  contextHints?: ContextHint[];  // NEW
  className?: string;
}
```

### Data Requirements

**Context hints computed from full listing dataset:**
```typescript
interface ListingStateCounts {
  draft: number;
  inactive: number;
  active: number;
  occupied: number;
}
```

### API Contract

**Use existing filter counts endpoint** (see QuickFilterChips):
```
GET /api/v1/real_estate/portfolio/filter-counts/
```

### Integration Example
```typescript
const contextHints: ContextHint[] = [];

if (counts?.drafts > 0) {
  contextHints.push({
    label: 'Drafts',
    count: counts.drafts,
    onClick: () => setFilters({ status: 'DRAFT' })
  });
}

if (counts?.inactive > 0) {
  contextHints.push({
    label: 'Inactive',
    count: counts.inactive,
    onClick: () => setFilters({ status: 'INACTIVE' })
  });
}

<EmptyState
  title="No active listings found"
  message="You don't have any active listings matching your filters."
  contextHints={contextHints}
  primaryAction={{ label: 'Add listing', onClick: handleAdd }}
  secondaryAction={{ label: 'Clear filters', onClick: clearFilters }}
/>
```

---

## 11. KPICardsGrid (Enhanced)

### Purpose
KPI cards with comparison context, help tooltips, and quick action menus.

### Component Interface
```typescript
interface KPICardsGridProps {
  // Core metrics
  totalValue: number;
  activeListings: number;
  monthlyRevenue: number;
  occupancyRate: number;
  avgDailyRate: number;
  conversionRate: number;

  // Config
  timePeriod: '30d' | '90d' | '1y';
  isLoading?: boolean;

  // NEW: Quick action handlers
  onViewAnalytics?: (metric: string) => void;
  onFilterBy?: (filter: string) => void;
  onExportData?: (metric: string) => void;
}
```

### Data Requirements

**From Portfolio Summary API + Comparison Data:**
```typescript
interface PortfolioMetrics {
  current: {
    total_value: number;
    active_listings: number;
    monthly_revenue: number;
    occupancy_rate: number;
    avg_daily_rate: number;
    conversion_rate: number;
  };
  previous: {
    // Same structure for previous period
    total_value: number;
    active_listings: number;
    // ...
  };
  trends: {
    total_value_change: number;      // +5.2 = up 5.2%
    active_listings_change: number;  // +2 listings
    monthly_revenue_change: number;  // +12.5%
    occupancy_rate_change: number;   // +3.1%
    avg_daily_rate_change: number;   // +8.3%
    conversion_rate_change: number;  // -1.2%
  };
}
```

### API Contract

**Enhanced Summary Endpoint:**
```
GET /api/v1/real_estate/portfolio/summary/

Query Parameters:
- time_period: '30d' | '90d' | '1y'
- include_comparison: true  // NEW

Response:
{
  "current_period": {
    "total_value": 1250000,
    "active_listings": 42,
    "monthly_revenue": 18500,
    "occupancy_rate": 78.5,
    "avg_daily_rate": 125.50,
    "conversion_rate": 18.2,
    "period": "2024-10-15 to 2024-11-15"
  },
  "previous_period": {
    "total_value": 1188000,
    "active_listings": 40,
    "monthly_revenue": 16400,
    "occupancy_rate": 75.4,
    "avg_daily_rate": 115.80,
    "conversion_rate": 19.4,
    "period": "2024-09-15 to 2024-10-15"
  },
  "trends": {
    "total_value": {
      "change_absolute": 62000,
      "change_percent": 5.2,
      "is_positive": true
    },
    "monthly_revenue": {
      "change_absolute": 2100,
      "change_percent": 12.5,
      "is_positive": true
    },
    "conversion_rate": {
      "change_absolute": -1.2,
      "change_percent": -1.2,
      "is_positive": false
    }
    // ... for all metrics
  }
}
```

**Backend Implementation:**
```python
class PortfolioSummaryView(APIView):
    def get(self, request):
        time_period = request.GET.get('time_period', '30d')
        include_comparison = request.GET.get('include_comparison') == 'true'

        # Calculate current period
        current_start, current_end = get_period_dates(time_period)
        current_metrics = calculate_metrics(request.user, current_start, current_end)

        response_data = {
            'current_period': current_metrics
        }

        if include_comparison:
            # Calculate previous period
            period_length = current_end - current_start
            prev_start = current_start - period_length
            prev_end = current_start

            prev_metrics = calculate_metrics(request.user, prev_start, prev_end)

            # Calculate trends
            trends = {}
            for key in current_metrics.keys():
                curr_val = current_metrics[key]
                prev_val = prev_metrics[key]

                change_abs = curr_val - prev_val
                change_pct = (change_abs / prev_val * 100) if prev_val != 0 else 0

                trends[key] = {
                    'change_absolute': change_abs,
                    'change_percent': change_pct,
                    'is_positive': change_abs > 0
                }

            response_data['previous_period'] = prev_metrics
            response_data['trends'] = trends

        return Response(response_data)
```

### Integration Example
```typescript
const { data: metricsData } = useQuery({
  queryKey: ['portfolioMetrics', timePeriod],
  queryFn: () => fetchPortfolioSummary(timePeriod, { includeComparison: true })
});

<KPICardsGrid
  totalValue={metricsData.current_period.total_value}
  activeListings={metricsData.current_period.active_listings}
  monthlyRevenue={metricsData.current_period.monthly_revenue}
  occupancyRate={metricsData.current_period.occupancy_rate}
  avgDailyRate={metricsData.current_period.avg_daily_rate}
  conversionRate={metricsData.current_period.conversion_rate}
  timePeriod={timePeriod}
  onViewAnalytics={(metric) => {
    setActiveTab('analytics');
    setAnalyticsMetric(metric);
  }}
  onFilterBy={(filter) => {
    setActiveTab('listings');
    applyFilter(filter);
  }}
  onExportData={(metric) => {
    exportMetricData(metric);
  }}
/>
```

---

## 12. PortfolioPageEnhanced (Main Integration)

### Summary of All Required API Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/v1/real_estate/portfolio/listings/` | GET | Fetch paginated listings | **Required** ✅ |
| `/api/v1/real_estate/portfolio/summary/` | GET | Fetch KPI metrics | **Required** ✅ |
| `/api/v1/real_estate/portfolio/filter-counts/` | GET | Get counts for quick filters | Recommended |
| `/api/v1/real_estate/portfolio/insights/` | GET | Auto-generated insights | Recommended |
| `/api/v1/real_estate/portfolio/bulk-update/` | POST | Bulk operations | Recommended |
| `/api/v1/real_estate/portfolio/export/` | POST | Data export | Optional |

### Complete Data Flow Example

```typescript
// 1. Initial page load
const PortfolioPageEnhanced = () => {
  const [timePeriod, setTimePeriod] = useState('30d');
  const [filters, setFilters] = useState<PortfolioFilters>({...});

  // 2. Fetch all data
  const { data: summary } = useQuery({
    queryKey: ['portfolioSummary', timePeriod],
    queryFn: () => fetchPortfolioSummary(timePeriod, { includeComparison: true })
  });

  const { data: listingsData, refetch } = useQuery({
    queryKey: ['portfolioListings', filters],
    queryFn: () => fetchPortfolioListings(filters)
  });

  const { data: counts } = useQuery({
    queryKey: ['filterCounts'],
    queryFn: fetchFilterCounts
  });

  const { data: insights } = useQuery({
    queryKey: ['insights', timePeriod],
    queryFn: () => fetchInsights(timePeriod)
  });

  // 3. Render with all components
  return (
    <div>
      <KeyboardShortcuts shortcuts={shortcuts} />

      <DataFreshnessIndicator
        lastUpdated={new Date()}
        onRefresh={refetch}
      />

      <KPICardsGrid
        {...summary.current_period}
        timePeriod={timePeriod}
        onViewAnalytics={handleViewAnalytics}
        onFilterBy={handleFilterBy}
        onExportData={handleExport}
      />

      {insights && (
        <InsightsBanner insights={insights} />
      )}

      <QuickFilterChips
        activeFilter={currentFilter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {listingsData.results.map(listing => (
        <ListingHealthBadge
          key={listing.id}
          listing={listing}
          showLabel
        />
      ))}

      <BulkActionTemplates
        templates={templates}
        disabled={selectedIds.length === 0}
      />

      <ExportTemplates
        templates={exportTemplates}
        currentFilterCount={listingsData.total}
      />
    </div>
  );
};
```

---

## Summary: Backend Work Required

### High Priority (Core Functionality)

1. **Enhance `/api/v1/real_estate/portfolio/summary/`**
   - Add `include_comparison` parameter
   - Return previous period data and trends
   - Calculate: `total_value`, `monthly_revenue`, `occupancy_rate`, `avg_daily_rate`, `conversion_rate`

2. **Add Computed Fields to Listing Model**
   ```python
   class Listing(models.Model):
       # ... existing fields

       @property
       def health_score(self):
           """Calculate 0-100 health score"""
           return calculate_health_score(self)

       @property
       def views_30d(self):
           """Views in last 30 days"""
           return self.analytics.filter(
               created_at__gte=timezone.now() - timedelta(days=30)
           ).aggregate(Sum('view_count'))['view_count__sum'] or 0
   ```

### Medium Priority (Enhanced UX)

3. **Create `/api/v1/real_estate/portfolio/filter-counts/`**
   - Return counts for all quick filter views
   - Optimize with database aggregations

4. **Create `/api/v1/real_estate/portfolio/insights/`**
   - Implement insight generation logic
   - Return top 5 insights sorted by priority
   - Include metadata for frontend actions

5. **Create `/api/v1/real_estate/portfolio/bulk-update/`**
   - Support status updates, price adjustments, availability
   - Return success/failure details

### Low Priority (Nice to Have)

6. **Create `/api/v1/real_estate/portfolio/export/`**
   - Generate CSV/XLSX exports
   - Upload to S3 and return temporary URL
   - Support multiple templates

---

## Testing Checklist

- [ ] All metrics calculate correctly with real data
- [ ] Comparison trends show accurate percentages
- [ ] Health scores match frontend calculation
- [ ] Filter counts update in real-time
- [ ] Insights generate based on actual thresholds
- [ ] Bulk operations handle errors gracefully
- [ ] Export includes all filtered data
- [ ] API responses match TypeScript interfaces
- [ ] Performance acceptable with 100+ listings
- [ ] Error states handled properly

---

**Questions or Issues?**
Contact: [Your Team]
Last Updated: 2025-11-15
