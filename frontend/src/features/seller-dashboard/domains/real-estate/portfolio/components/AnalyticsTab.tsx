/**
 * Analytics Tab Component
 *
 * Displays detailed analytics and performance metrics with charts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PortfolioSummaryResponse } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Home } from 'lucide-react';
import { TabContextHeader } from './TabContextHeader';

interface AnalyticsTabProps {
  summary: PortfolioSummaryResponse | undefined;
  timePeriod: '30d' | '90d' | '1y';
  isLoading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  summary,
  timePeriod,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary || !Array.isArray(summary) || summary.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-slate-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const revenueData = summary.map((item) => ({
    name: item.listing_type.replace('_', ' '),
    revenue: item.bookings_30d * (item.avg_price ? parseFloat(item.avg_price) : 0),
    bookings: item.bookings_30d,
    enquiries: item.enquiries_30d,
  }));

  const performanceData = summary.map((item) => ({
    name: item.listing_type.replace('_', ' '),
    active: item.active_listings,
    total: item.total_listings,
    occupancy: item.occupied_units && item.vacant_units
      ? (item.occupied_units / (item.occupied_units + item.vacant_units)) * 100
      : 0,
  }));

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = revenueData.reduce((sum, item) => sum + item.bookings, 0);
  const totalEnquiries = revenueData.reduce((sum, item) => sum + item.enquiries, 0);
  const avgConversionRate = totalEnquiries > 0 ? (totalBookings / totalEnquiries) * 100 : 0;

  return (
    <div className="space-y-6">
      <TabContextHeader
        title="Performance Analytics"
        description="Detailed metrics, trends, and insights into your portfolio's performance over time."
        timePeriod={timePeriod}
        showTimePeriod={true}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {timePeriod === '30d' ? '30 days' : timePeriod === '90d' ? '90 days' : '1 year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgConversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnquiries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all listing types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.reduce((sum, item) => sum + item.active_listings, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Listing Type</CardTitle>
            <CardDescription>Revenue breakdown for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#84cc16" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings vs Enquiries</CardTitle>
            <CardDescription>Conversion performance by listing type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enquiries" fill="#0ea5e9" name="Enquiries" />
                <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listing Performance</CardTitle>
            <CardDescription>Active vs total listings by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#65a30d" name="Total Listings" />
                <Bar dataKey="active" fill="#84cc16" name="Active Listings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Occupancy percentage by listing type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : value}%`} />
                <Legend />
                <Bar dataKey="occupancy" fill="#0ea5e9" name="Occupancy %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
