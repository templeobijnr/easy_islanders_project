/**
 * AnalyticsTab - Performance analytics and metrics
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  Users,
  Star,
  BarChart3,
} from 'lucide-react';

interface AnalyticsTabProps {
  listingId: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ listingId }) => {
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data - replace with actual API data
  const metrics = {
    revenue: {
      current: 8400,
      previous: 7200,
      change: 16.7,
      currency: 'EUR',
    },
    bookings: {
      current: 12,
      previous: 10,
      change: 20,
    },
    occupancy: {
      current: 78,
      previous: 65,
      change: 13,
    },
    avgNightlyRate: {
      current: 140,
      previous: 135,
      change: 3.7,
      currency: 'EUR',
    },
    views: {
      current: 450,
      previous: 380,
      change: 18.4,
    },
    inquiries: {
      current: 28,
      previous: 22,
      change: 27.3,
    },
    rating: {
      current: 4.8,
      previous: 4.6,
      change: 4.3,
    },
    reviewCount: {
      current: 24,
      previous: 18,
      change: 33.3,
    },
  };

  // Mock chart data for bookings over time
  const chartData = [
    { label: 'Week 1', value: 2, revenue: 1680 },
    { label: 'Week 2', value: 3, revenue: 2520 },
    { label: 'Week 3', value: 4, revenue: 2800 },
    { label: 'Week 4', value: 3, revenue: 2100 },
  ];

  const maxChartValue = Math.max(...chartData.map(d => d.value));

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getChangeBgColor = (change: number) => {
    return change >= 0 ? 'bg-emerald-100' : 'bg-red-100';
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    change,
    suffix = '',
    prefix = '',
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    change: number;
    suffix?: string;
    prefix?: string;
  }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
          <Icon className="h-6 w-6 text-brand-600" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${getChangeBgColor(change)} ${getChangeColor(change)}`}>
          {getChangeIcon(change)}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>

      <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">
        {prefix}{value.toLocaleString()}{suffix}
      </p>

      <p className="text-xs text-slate-500 mt-2">
        vs. previous period
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimePeriod('7d')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              timePeriod === '7d'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimePeriod('30d')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              timePeriod === '30d'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimePeriod('90d')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              timePeriod === '90d'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setTimePeriod('1y')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              timePeriod === '1y'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={metrics.revenue.current}
          change={metrics.revenue.change}
          prefix={`${metrics.revenue.currency} `}
        />

        <MetricCard
          icon={Calendar}
          label="Bookings"
          value={metrics.bookings.current}
          change={metrics.bookings.change}
        />

        <MetricCard
          icon={BarChart3}
          label="Occupancy Rate"
          value={metrics.occupancy.current}
          change={metrics.occupancy.change}
          suffix="%"
        />

        <MetricCard
          icon={DollarSign}
          label="Avg Nightly Rate"
          value={metrics.avgNightlyRate.current}
          change={metrics.avgNightlyRate.change}
          prefix={`${metrics.avgNightlyRate.currency} `}
        />

        <MetricCard
          icon={Eye}
          label="Total Views"
          value={metrics.views.current}
          change={metrics.views.change}
        />

        <MetricCard
          icon={MessageSquare}
          label="Inquiries"
          value={metrics.inquiries.current}
          change={metrics.inquiries.change}
        />

        <MetricCard
          icon={Star}
          label="Average Rating"
          value={metrics.rating.current}
          change={metrics.rating.change}
          suffix=" ★"
        />

        <MetricCard
          icon={Users}
          label="Reviews"
          value={metrics.reviewCount.current}
          change={metrics.reviewCount.change}
        />
      </div>

      {/* Bookings Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Bookings Over Time</h2>
          <p className="text-sm text-slate-600">Weekly breakdown for the selected period</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-brand-600">
                      {item.value} {item.value === 1 ? 'booking' : 'bookings'}
                    </span>
                    <span className="text-sm text-slate-600">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(item.value / maxChartValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Revenue Breakdown</h2>
            <p className="text-sm text-slate-600">Sources of income</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
              <div>
                <p className="text-sm font-medium text-slate-700">Nightly Bookings</p>
                <p className="text-xs text-slate-500 mt-1">Main revenue stream</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-brand-700">{formatCurrency(7200)}</p>
                <p className="text-xs text-slate-600">86%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div>
                <p className="text-sm font-medium text-slate-700">Cleaning Fees</p>
                <p className="text-xs text-slate-500 mt-1">Per booking</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-700">{formatCurrency(840)}</p>
                <p className="text-xs text-slate-600">10%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div>
                <p className="text-sm font-medium text-slate-700">Extra Services</p>
                <p className="text-xs text-slate-500 mt-1">Add-ons & upgrades</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-700">{formatCurrency(360)}</p>
                <p className="text-xs text-slate-600">4%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Top Performance Metrics</h2>
            <p className="text-sm text-slate-600">Key highlights this period</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">High Demand</p>
                <p className="text-sm text-slate-600 mt-1">
                  78% occupancy rate, 13% above average
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Excellent Reviews</p>
                <p className="text-sm text-slate-600 mt-1">
                  4.8★ average rating from 24 reviews
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Strong Interest</p>
                <p className="text-sm text-slate-600 mt-1">
                  28 inquiries, 27% increase
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with Market */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Market Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                <p className="text-xs font-medium text-slate-700 mb-1">Your Occupancy</p>
                <p className="text-2xl font-bold text-blue-700">78%</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>8% above market avg</span>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                <p className="text-xs font-medium text-slate-700 mb-1">Your Avg Rate</p>
                <p className="text-2xl font-bold text-blue-700">EUR 140</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>12% above market avg</span>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                <p className="text-xs font-medium text-slate-700 mb-1">Your Rating</p>
                <p className="text-2xl font-bold text-blue-700">4.8 ★</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>Top 10% in area</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
