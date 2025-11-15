/**
 * KPI Cards Grid Component
 *
 * Displays 6 key portfolio metrics with trend indicators
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  Home,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';
import { TimeScopeIndicator } from './TimeScopeIndicator';

interface KPICard {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface KPICardsGridProps {
  totalValue: number;
  activeListings: number;
  monthlyRevenue: number;
  occupancyRate: number;
  avgDailyRate: number;
  conversionRate: number;
  timePeriod: '30d' | '90d' | '1y';
  isLoading?: boolean;
}

export const KPICardsGrid: React.FC<KPICardsGridProps> = ({
  totalValue,
  activeListings,
  monthlyRevenue,
  occupancyRate,
  avgDailyRate,
  conversionRate,
  timePeriod,
  isLoading = false,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards: KPICard[] = [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      trend: { value: 5.2, isPositive: true },
      icon: <DollarSign className="h-6 w-6" />,
      color: 'from-lime-500 to-lime-600',
      subtitle: 'Across all active listings',
    },
    {
      title: 'Active Listings',
      value: activeListings,
      trend: { value: 2, isPositive: true },
      icon: <Home className="h-6 w-6" />,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'Currently published',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      trend: { value: 12.5, isPositive: true },
      icon: <Activity className="h-6 w-6" />,
      color: 'from-sky-500 to-sky-600',
      subtitle: 'Last 30 days',
    },
    {
      title: 'Occupancy Rate',
      value: formatPercent(occupancyRate),
      trend: { value: 3.1, isPositive: true },
      icon: <Calendar className="h-6 w-6" />,
      color: 'from-lime-500 to-emerald-500',
      subtitle: 'Short-term rentals',
    },
    {
      title: 'Average Daily Rate',
      value: formatCurrency(avgDailyRate),
      trend: { value: 8.3, isPositive: true },
      icon: <DollarSign className="h-6 w-6" />,
      color: 'from-emerald-500 to-sky-500',
      subtitle: 'Daily rental average',
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(conversionRate),
      trend: { value: 1.2, isPositive: false },
      icon: <Target className="h-6 w-6" />,
      color: 'from-sky-500 to-lime-500',
      subtitle: 'Inquiries to bookings',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Key Metrics</h2>
        <TimeScopeIndicator timePeriod={timePeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {cards.map((card, index) => (
        <Card
          key={index}
          className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-200 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 rounded-2xl"
        >
          {/* Decorative circle like in sidebar */}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />

          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-lime-600 text-white shadow-inner">
                {card.icon}
              </div>

              {card.trend && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    card.trend.isPositive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {card.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{card.trend.value}%</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">{card.title}</p>
              <p className="text-3xl font-bold font-display text-slate-900 mb-1">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-slate-700">{card.subtitle}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
};
