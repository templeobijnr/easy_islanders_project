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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Download, Settings, BarChart3, List, Activity, LayoutDashboard } from 'lucide-react';

// Import existing components
import { fetchPortfolioListings, fetchPortfolioSummary, updateListing } from './api';
import { PortfolioFilters, PortfolioListing, ListingUpdatePayload } from './types';

// Import new components (to be created)
import { PortfolioHeader } from './components/PortfolioHeader';
import { KPICardsGrid } from './components/KPICardsGrid';
import { OverviewTab } from './components/OverviewTab';
import { ListingsTab } from './components/ListingsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { ActivityTab } from './components/ActivityTab';

export const PortfolioPageEnhanced: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState<'30d' | '90d' | '1y'>('30d');

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
    queryFn: fetchPortfolioSummary,
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
      alert('No data available to export');
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
          isLoading={summaryLoading}
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-white shadow-sm border">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab
              summary={summary}
              timePeriod={timePeriod}
              isLoading={summaryLoading}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <ActivityTab timePeriod={timePeriod} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PortfolioPageEnhanced;
