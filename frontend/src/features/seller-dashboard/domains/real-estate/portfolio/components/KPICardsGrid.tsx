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
  MoreVertical,
  BarChart3,
  Filter,
  Download,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimeScopeIndicator } from './TimeScopeIndicator';
import { HelpTooltip } from './HelpTooltip';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

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
  helpText?: string;
  benchmark?: string;
  quickActions?: QuickAction[];
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
  onViewAnalytics?: (metric: string) => void;
  onFilterBy?: (filter: string) => void;
  onExportData?: (metric: string) => void;
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
  onViewAnalytics,
  onFilterBy,
  onExportData,
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
      helpText: 'Total estimated market value of all your active property listings combined.',
      benchmark: 'Aim for steady growth aligned with market appreciation (3-5% annually).',
      quickActions: [
        { label: 'View value trends', icon: BarChart3, onClick: () => onViewAnalytics?.('portfolio-value') },
        { label: 'Export valuation report', icon: Download, onClick: () => onExportData?.('valuation') },
      ],
    },
    {
      title: 'Active Listings',
      value: activeListings,
      trend: { value: 2, isPositive: true },
      icon: <Home className="h-6 w-6" />,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'Currently published',
      helpText: 'Number of properties currently published and accepting bookings or inquiries.',
      benchmark: 'Maintain at least 80% of your total inventory as active for optimal revenue.',
      quickActions: [
        { label: 'View active listings', icon: Filter, onClick: () => onFilterBy?.('active') },
        { label: 'Manage inactive', icon: Settings, onClick: () => onFilterBy?.('inactive') },
      ],
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      trend: { value: 12.5, isPositive: true },
      icon: <Activity className="h-6 w-6" />,
      color: 'from-sky-500 to-sky-600',
      subtitle: 'Last 30 days',
      helpText: 'Total income generated from bookings and rentals in the last 30 days.',
      benchmark: 'Top hosts average €2,000-€5,000 per property per month in peak season.',
      quickActions: [
        { label: 'View revenue breakdown', icon: BarChart3, onClick: () => onViewAnalytics?.('revenue') },
        { label: 'Export financial report', icon: Download, onClick: () => onExportData?.('revenue') },
      ],
    },
    {
      title: 'Occupancy Rate',
      value: formatPercent(occupancyRate),
      trend: { value: 3.1, isPositive: true },
      icon: <Calendar className="h-6 w-6" />,
      color: 'from-lime-500 to-emerald-500',
      subtitle: 'Short-term rentals',
      helpText: 'Percentage of time your properties are booked vs. available for short-term rentals.',
      benchmark: 'Industry average: 60-70%. Top performers: 75-85%.',
      quickActions: [
        { label: 'View occupancy trends', icon: BarChart3, onClick: () => onViewAnalytics?.('occupancy') },
        { label: 'Show low performers', icon: Filter, onClick: () => onFilterBy?.('low-occupancy') },
      ],
    },
    {
      title: 'Average Daily Rate',
      value: formatCurrency(avgDailyRate),
      trend: { value: 8.3, isPositive: true },
      icon: <DollarSign className="h-6 w-6" />,
      color: 'from-emerald-500 to-sky-500',
      subtitle: 'Daily rental average',
      helpText: 'Average price earned per booked night across all your short-term rental properties.',
      benchmark: 'Coastal properties: €80-€150/night. City apartments: €50-€100/night.',
      quickActions: [
        { label: 'View pricing trends', icon: BarChart3, onClick: () => onViewAnalytics?.('pricing') },
        { label: 'Adjust pricing', icon: Settings, onClick: () => onFilterBy?.('adjust-pricing') },
      ],
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(conversionRate),
      trend: { value: 1.2, isPositive: false },
      icon: <Target className="h-6 w-6" />,
      color: 'from-sky-500 to-lime-500',
      subtitle: 'Inquiries to bookings',
      helpText: 'Percentage of inquiries that convert to confirmed bookings. Higher is better.',
      benchmark: 'Target: 15-25%. Below 10% may indicate pricing or listing quality issues.',
      quickActions: [
        { label: 'View conversion funnel', icon: BarChart3, onClick: () => onViewAnalytics?.('conversion') },
        { label: 'Show low converters', icon: Filter, onClick: () => onFilterBy?.('low-conversion') },
      ],
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

              <div className="flex items-start gap-2">
                {card.trend && (
                  <div className="flex flex-col items-end gap-0.5">
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
                    <span className="text-[10px] text-slate-600">vs last period</span>
                  </div>
                )}

                {/* Quick Actions Dropdown */}
                {card.quickActions && card.quickActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-white/50 transition-colors">
                        <MoreVertical className="h-4 w-4 text-slate-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {card.quickActions.map((action, actionIndex) => {
                        const ActionIcon = action.icon;
                        return (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={action.onClick}
                            className="cursor-pointer"
                          >
                            <ActionIcon className="h-4 w-4 mr-2 text-slate-500" />
                            <span className="text-sm">{action.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-medium text-slate-700">{card.title}</p>
                {card.helpText && (
                  <HelpTooltip
                    title={card.title}
                    description={card.helpText}
                    benchmark={card.benchmark}
                  />
                )}
              </div>
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
