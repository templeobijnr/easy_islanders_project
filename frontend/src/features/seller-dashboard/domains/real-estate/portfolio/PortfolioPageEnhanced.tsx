/**
 * Enhanced Real Estate Portfolio Page
 *
 * Premium portfolio management interface with:
 * - KPI cards with trend indicators
 * - Navigation tabs (Overview, Listings, Analytics, Activity)
 * - Advanced filters and search
 * - Data visualizations and charts
 * - Bulk operations and inline editing
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Download, Settings, BarChart3, List, Activity, LayoutDashboard } from 'lucide-react';

// Import toast system
import { useToast } from './components/use-toast';
import { ToastContainer } from './components/Toast';

// Import existing components
import { fetchPortfolioListings, fetchPortfolioSummary, updateListing } from './api';
import { PortfolioFilters, PortfolioListing, ListingUpdatePayload } from './types';

// Import new components
import { PortfolioHeader } from './components/PortfolioHeader';
import { KPICardsGrid } from './components/KPICardsGrid';
import { OverviewTab } from './components/OverviewTab';
import { ListingsTab } from './components/ListingsTab';

// Lazy load heavy tabs for better performance
const AnalyticsTab = lazy(() => import('./components/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const ActivityTab = lazy(() => import('./components/ActivityTab').then(m => ({ default: m.ActivityTab })));

// Loading skeleton for lazy tabs
const TabLoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="animate-pulse bg-slate-200 h-64 rounded-2xl" />
    <div className="animate-pulse bg-slate-200 h-64 rounded-2xl" />
  </div>
);

export const PortfolioPageEnhanced: React.FC = () => {
  const queryClient = useQueryClient();
  const { toasts, toast, success, error, dismiss } = useToast();

  // Default to 'listings' tab and persist to localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('portfolio-active-tab') || 'listings';
  });

  const [timePeriod, setTimePeriod] = useState<'30d' | '90d' | '1y'>('30d');

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio-active-tab', activeTab);
  }, [activeTab]);

  const [filters, setFilters] = useState<PortfolioFilters>({
    listing_type: 'ALL',
    status: 'ALL',
    city: '',
    area: '',
    search: '',
    page: 1,
    page_size: 20,
  });

  // Fetch portfolio summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['portfolioSummary', timePeriod],
    queryFn: () => fetchPortfolioSummary(timePeriod),
  });

  // Fetch portfolio listings
  const {
    data: listingsData,
    isLoading: listingsLoading,
    refetch: refetchListings,
  } = useQuery({
    queryKey: ['portfolioListings', filters],
    queryFn: () => fetchPortfolioListings(filters),
  });

  // Calculate KPIs from summary data
  const kpis = React.useMemo(() => {
    if (!summary || !Array.isArray(summary)) {
      return {
        totalValue: 0,
        activeListings: 0,
        monthlyRevenue: 0,
        occupancyRate: 0,
        avgDailyRate: 0,
        conversionRate: 0,
      };
    }

    const totalListings = summary.reduce((acc, item) => acc + item.total_listings, 0);
    const activeListings = summary.reduce((acc, item) => acc + item.active_listings, 0);
    const totalEnquiries = summary.reduce((acc, item) => acc + item.enquiries_30d, 0);
    const totalBookings = summary.reduce((acc, item) => acc + item.bookings_30d, 0);

    // Calculate total value (sum of all active listing prices)
    const dailyRentals = summary.find(s => s.listing_type === 'DAILY_RENTAL');
    const longTermRentals = summary.find(s => s.listing_type === 'LONG_TERM_RENTAL');

    return {
      totalValue: 0, // TODO: Calculate from actual data
      activeListings,
      monthlyRevenue: 0, // TODO: Get from analytics endpoint
      occupancyRate: dailyRentals?.occupied_units && dailyRentals?.vacant_units
        ? (dailyRentals.occupied_units / (dailyRentals.occupied_units + dailyRentals.vacant_units)) * 100
        : 0,
      avgDailyRate: dailyRentals?.avg_price ? parseFloat(dailyRentals.avg_price) : 0,
      conversionRate: totalEnquiries > 0 ? (totalBookings / totalEnquiries) * 100 : 0,
    };
  }, [summary]);

  const handleCreateListing = () => {
    // Navigate to create listing page or open modal
    window.location.href = '/dashboard/home/real-estate/upload';
  };

  const handleExportData = () => {
    // Export portfolio summary and listings data to CSV
    if (!summary || !listingsData) {
      error('No data available to export');
      return;
    }

    const csvRows: string[] = [];

    // Add header
    csvRows.push([
      'Ref Code',
      'Type',
      'Status',
      'Title',
      'City',
      'Area',
      'Bedrooms',
      'Bathrooms',
      'Price',
      'Currency',
      'Available From',
      'Available To',
      'Views (30d)',
      'Enquiries (30d)',
      'Bookings (30d)',
    ].join(','));

    // Add listings data
    listingsData.results.forEach((listing) => {
      csvRows.push([
        listing.reference_code,
        listing.listing_type,
        listing.status,
        `"${listing.title.replace(/"/g, '""')}"`,
        listing.city || 'N/A',
        listing.area || 'N/A',
        listing.bedrooms || 'N/A',
        listing.bathrooms || 'N/A',
        listing.base_price,
        listing.currency,
        listing.available_from || 'N/A',
        listing.available_to || 'N/A',
        listing.views_30d,
        listing.enquiries_30d,
        listing.bookings_30d,
      ].join(','));
    });

    // Create CSV file and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success toast
    success('Portfolio data exported successfully');
  };

  const handleBulkEdit = () => {
    // Scroll to listings tab and enable bulk selection
    setActiveTab('listings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Portfolio Header */}
      <PortfolioHeader
        totalValue={kpis.totalValue}
        activeListings={kpis.activeListings}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        onCreateListing={handleCreateListing}
        onExportData={handleExportData}
        onBulkEdit={handleBulkEdit}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards Grid */}
        <KPICardsGrid
          totalValue={kpis.totalValue}
          activeListings={kpis.activeListings}
          monthlyRevenue={kpis.monthlyRevenue}
          occupancyRate={kpis.occupancyRate}
          avgDailyRate={kpis.avgDailyRate}
          conversionRate={kpis.conversionRate}
          timePeriod={timePeriod}
          isLoading={summaryLoading}
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-white shadow-sm border">
            <TabsTrigger value="overview" className="gap-2" aria-label="Portfolio overview">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden sr-only">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2" aria-label="Property listings">
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Listings</span>
              <span className="sm:hidden sr-only">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" aria-label="Analytics and charts">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden sr-only">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2" aria-label="Activity feed">
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Activity</span>
              <span className="sm:hidden sr-only">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              summary={summary}
              timePeriod={timePeriod}
              isLoading={summaryLoading}
            />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <ListingsTab
              filters={filters}
              onFiltersChange={setFilters}
              listings={listingsData?.results || []}
              total={listingsData?.total || 0}
              isLoading={listingsLoading}
              onRefetch={refetchListings}
            />
          </TabsContent>

          {/* Analytics Tab (Lazy Loaded) */}
          <TabsContent value="analytics" className="mt-6">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <AnalyticsTab
                summary={summary}
                timePeriod={timePeriod}
                isLoading={summaryLoading}
              />
            </Suspense>
          </TabsContent>

          {/* Activity Tab (Lazy Loaded) */}
          <TabsContent value="activity" className="mt-6">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <ActivityTab timePeriod={timePeriod} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};

export default PortfolioPageEnhanced;
