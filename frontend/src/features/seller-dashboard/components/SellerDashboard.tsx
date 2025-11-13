/**
 * Unified Seller Dashboard - Multi-Domain Overview
 * 
 * Displays aggregated metrics across all business domains:
 * - Real Estate
 * - Events
 * - Activities
 * - Appointments
 */

import React, { useState } from 'react';
import { useSummarizedMetrics, useUnifiedListings, useUnifiedBookings } from '../hooks/useDomainMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainMetricsCard } from './DomainMetricsCard';
import { KPICard } from './KPICard';
import { AlertCircle } from 'lucide-react';

export const SellerDashboard: React.FC = () => {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useSummarizedMetrics();
  const { data: listings, isLoading: listingsLoading } = useUnifiedListings();
  const { data: bookings, isLoading: bookingsLoading } = useUnifiedBookings();
  const [activeTab, setActiveTab] = useState('overview');

  if (overviewLoading) {
    return <SellerDashboardSkeleton />;
  }

  if (overviewError) {
    return (
      <div className="space-y-6 p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
            <p className="text-sm text-red-700">Failed to load seller overview. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{overview.business_name}</h1>
        <p className="text-gray-600 mt-1">Manage all your listings, bookings, and revenue</p>
      </div>

      {/* KPI Cards - Cross Domain Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Listings"
          value={overview.total_listings}
          icon="📦"
          trend={null}
        />
        <KPICard
          label="Total Bookings"
          value={overview.total_bookings}
          icon="📅"
          trend={null}
        />
        <KPICard
          label="Total Revenue"
          value={`$${overview.total_revenue.toFixed(2)}`}
          icon="💰"
          trend={null}
        />
        <KPICard
          label="Active Domains"
          value={overview.domains.length}
          icon="🌐"
          trend={null}
        />
      </div>

      {/* Domain-Specific Cards */}
      {overview.domains.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Domain Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.domains.map((domain) => (
              <DomainMetricsCard key={domain.domain} metrics={domain} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs - Listings, Bookings, etc. */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">
            Listings {listings && `(${listings.length})`}
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings {bookings && `(${bookings.length})`}
          </TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>
                Overview of your business performance across all domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Booking Rate</p>
                  <p className="text-2xl font-bold">
                    {overview.domains.length > 0
                      ? (
                          (overview.domains.reduce((sum, d) => sum + d.booking_rate, 0) /
                            overview.domains.length) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold">
                    {overview.domains.length > 0
                      ? (
                          overview.domains.reduce((sum, d) => sum + (d.avg_rating || 0), 0) /
                          overview.domains.length
                        ).toFixed(1)
                      : '0'}
                    ⭐
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>All Listings</CardTitle>
              <CardDescription>
                Manage all your listings across all domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="space-y-2">
                  {listings.map((listing: any) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{listing.title}</h4>
                        <p className="text-sm text-gray-600">
                          {listing.domain} • {listing.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {listing.currency} {listing.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No listings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                All bookings across your domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-2">
                  {bookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{booking.title}</h4>
                        <p className="text-sm text-gray-600">
                          {booking.customer} • {booking.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${booking.total_price}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No bookings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts">
          <Card>
            <CardHeader>
              <CardTitle>Broadcasts & Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">Coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">Coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Loading skeleton for seller dashboard
 */
function SellerDashboardSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* Domain Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
