/**
 * Overview Tab Component
 *
 * Displays portfolio summary with composition and performance charts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioSummaryResponse } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface OverviewTabProps {
  summary: PortfolioSummaryResponse | undefined;
  timePeriod: '30d' | '90d' | '1y';
  isLoading: boolean;
}

const COLORS = ['#84cc16', '#10b981', '#0ea5e9', '#65a30d']; // Lime, Emerald, Sky, Lime-dark

const LISTING_TYPE_LABELS: Record<string, string> = {
  DAILY_RENTAL: 'Daily Rental',
  LONG_TERM_RENTAL: 'Long-term Rental',
  SALE: 'For Sale',
  PROJECT: 'Project',
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  summary,
  timePeriod,
  isLoading,
}) => {
  // Prepare composition data for pie chart
  const compositionData = React.useMemo(() => {
    if (!summary || !Array.isArray(summary)) return [];

    return summary.map((item) => ({
      name: LISTING_TYPE_LABELS[item.listing_type] || item.listing_type,
      value: item.total_listings,
      active: item.active_listings,
    }));
  }, [summary]);

  // Prepare performance data for bar chart
  const performanceData = React.useMemo(() => {
    if (!summary || !Array.isArray(summary)) return [];

    return summary.map((item) => ({
      name: LISTING_TYPE_LABELS[item.listing_type] || item.listing_type,
      views: item.views_30d,
      enquiries: item.enquiries_30d,
      bookings: item.bookings_30d,
    }));
  }, [summary]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Composition */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Composition</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown by listing type</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Active vs total listings</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {compositionData.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.active}/{item.value} active
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.active / item.value) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Metrics (Last 30 Days)</CardTitle>
            <p className="text-sm text-muted-foreground">Views, enquiries, and bookings by listing type</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name="Views" />
                  <Bar dataKey="enquiries" fill="#8b5cf6" name="Enquiries" />
                  <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
