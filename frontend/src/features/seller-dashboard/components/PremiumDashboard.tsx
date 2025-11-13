import React, { useState } from 'react';
import { useDomainContext } from '../hooks/useDomainContext';
import { DomainSwitcher } from './DomainSwitcher';
import { PremiumKPICard } from './PremiumKPICard';
import { PremiumMetricsCard } from './PremiumMetricsCard';
import { UnifiedListingsTable } from './UnifiedListingsTable';
import { UnifiedBookingsTable } from './UnifiedBookingsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  Plus,
  Settings,
  Bell,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const PremiumDashboard: React.FC = () => {
  const { activeDomain } = useDomainContext();
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const metrics = {
    total_listings: 24,
    active_listings: 18,
    total_bookings: 156,
    confirmed_bookings: 142,
    revenue: 12500.0,
    booking_rate: 0.91,
    pending_bookings: 8,
    cancelled_bookings: 6,
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header Section */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Seller Dashboard
                  </h1>
                  <p className="text-sm text-slate-600">Manage your multi-domain business</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>

          {/* Domain Switcher */}
          <div className="mt-4 flex items-center justify-between">
            <DomainSwitcher />
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Key Performance Indicators</h2>
              <p className="text-slate-600 mt-1">Real-time metrics for {activeDomain}</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PremiumKPICard
              title="Total Listings"
              value={metrics.total_listings}
              icon={<BarChart3 className="w-5 h-5" />}
              trend={{ direction: 'up', percentage: 12 }}
              color="blue"
            />
            <PremiumKPICard
              title="Active Listings"
              value={metrics.active_listings}
              icon={<TrendingUp className="w-5 h-5" />}
              trend={{ direction: 'up', percentage: 8 }}
              color="green"
            />
            <PremiumKPICard
              title="Total Bookings"
              value={metrics.total_bookings}
              icon={<Calendar className="w-5 h-5" />}
              trend={{ direction: 'up', percentage: 15 }}
              color="purple"
            />
            <PremiumKPICard
              title="Revenue"
              value={`€${metrics.revenue.toLocaleString()}`}
              icon={<Users className="w-5 h-5" />}
              trend={{ direction: 'up', percentage: 22 }}
              color="amber"
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PremiumMetricsCard
            title="Booking Rate"
            value={`${(metrics.booking_rate * 100).toFixed(1)}%`}
            subtitle="Conversion rate"
            trend={{ direction: 'up', percentage: 5 }}
            color="blue"
          />
          <PremiumMetricsCard
            title="Confirmed Bookings"
            value={metrics.confirmed_bookings}
            subtitle="This month"
            trend={{ direction: 'up', percentage: 12 }}
            color="green"
          />
          <PremiumMetricsCard
            title="Avg Revenue/Booking"
            value={`€${(metrics.revenue / metrics.confirmed_bookings).toFixed(2)}`}
            subtitle="Per transaction"
            trend={{ direction: 'down', percentage: 3 }}
            color="amber"
          />
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm text-slate-600">Confirmed</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.confirmed_bookings}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{metrics.pending_bookings}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                  <div>
                    <p className="text-sm text-slate-600">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.cancelled_bookings}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Listing
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Calendar className="w-4 h-4" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Users className="w-4 h-4" />
                  Manage Customers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings & Bookings Tabs */}
        <Card className="border-0 shadow-lg">
          <Tabs defaultValue="listings" className="w-full">
            <div className="border-b border-slate-200">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-4">
                <TabsTrigger
                  value="listings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Listings
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Bookings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="listings" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Your Listings</h3>
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Listing
                  </Button>
                </div>
                <UnifiedListingsTable domain={activeDomain} />
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Bookings</h3>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
                <UnifiedBookingsTable domain={activeDomain} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
