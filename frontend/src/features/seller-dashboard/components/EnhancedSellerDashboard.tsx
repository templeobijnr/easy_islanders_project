import React from 'react';
import { useDomainContext } from '../hooks/useDomainContext';
import { DomainSwitcher } from './DomainSwitcher';
import { DomainMetricsCard } from './DomainMetricsCard';
import { KPICard } from './KPICard';
import { UnifiedListingsTable } from './UnifiedListingsTable';
import { UnifiedBookingsTable } from './UnifiedBookingsTable';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { BarChart3, Calendar, TrendingUp, Users } from 'lucide-react';

export const EnhancedSellerDashboard: React.FC = () => {
  const { activeDomain } = useDomainContext();

  // Mock data - replace with actual API calls
  const metrics = {
    total_listings: 24,
    active_listings: 18,
    total_bookings: 156,
    confirmed_bookings: 142,
    revenue: 12500.0,
    booking_rate: 0.91,
  };

  return (
    <div className="space-y-6">
      {/* Header with Domain Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your multi-domain business</p>
        </div>
        <DomainSwitcher />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Listings"
          value={metrics.total_listings}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={12}
        />
        <KPICard
          label="Active Listings"
          value={metrics.active_listings}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={8}
        />
        <KPICard
          label="Total Bookings"
          value={metrics.total_bookings}
          icon={<Calendar className="w-5 h-5" />}
          trend={15}
        />
        <KPICard
          label="Revenue"
          value={`€${metrics.revenue.toLocaleString()}`}
          icon={<Users className="w-5 h-5" />}
          trend={22}
        />
      </div>

      {/* Domain-Specific Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <DomainMetricsCard metrics={{
            domain: activeDomain,
            total_listings: metrics.total_listings,
            active_listings: metrics.active_listings,
            total_bookings: metrics.total_bookings,
            confirmed_bookings: metrics.confirmed_bookings,
            revenue: metrics.revenue,
            booking_rate: metrics.booking_rate,
          }} />
        </CardContent>
      </Card>

      {/* Listings & Bookings Tabs */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <UnifiedListingsTable domain={activeDomain} />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <UnifiedBookingsTable domain={activeDomain} />
        </TabsContent>
      </Tabs>

      {/* Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Booking Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {(metrics.booking_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics.confirmed_bookings}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Revenue per Booking</p>
              <p className="text-2xl font-bold text-purple-600">
                €{(metrics.revenue / metrics.confirmed_bookings).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
