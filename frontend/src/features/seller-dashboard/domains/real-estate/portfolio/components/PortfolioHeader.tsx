/**
 * Portfolio Header Component
 *
 * Displays portfolio title, total value, and quick action buttons
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Edit, TrendingUp } from 'lucide-react';
import { PurposeSubtitle } from './PurposeSubtitle';

interface PortfolioHeaderProps {
  totalValue: number;
  activeListings: number;
  timePeriod: '30d' | '90d' | '1y';
  onTimePeriodChange: (period: '30d' | '90d' | '1y') => void;
  onCreateListing: () => void;
  onExportData: () => void;
  onBulkEdit: () => void;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  totalValue,
  activeListings,
  timePeriod,
  onTimePeriodChange,
  onCreateListing,
  onExportData,
  onBulkEdit,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Portfolio Title & Value */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold font-display text-slate-900 leading-tight">
                  My Portfolio
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-600 rounded-full text-sm font-medium text-white shadow-inner whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span>{activeListings} Active</span>
                </div>
              </div>
              <PurposeSubtitle />
            </div>

            {/* Value Section */}
            <div className="flex flex-col">
              <p className="text-slate-700 text-sm font-medium mb-1.5">Total Portfolio Value</p>
              <p className="text-4xl lg:text-5xl font-bold font-display text-slate-900 leading-none">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>

          {/* Right: Actions & Time Period */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 lg:flex-shrink-0">
            {/* Time Period Selector */}
            <div className="flex items-center">
              <Select value={timePeriod} onValueChange={(value: any) => onTimePeriodChange(value)}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white/90 border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportData}
                className="h-10 bg-white/90 border-slate-200 text-slate-900 hover:bg-white px-4"
                title="Exports current filters"
              >
                <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEdit}
                className="h-10 bg-white/90 border-slate-200 text-slate-900 hover:bg-white px-4"
              >
                <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Bulk select</span>
                <span className="sm:hidden">Select</span>
              </Button>

              <Button
                onClick={onCreateListing}
                size="sm"
                className="h-10 bg-lime-600 text-white hover:bg-lime-700 font-semibold shadow-sm px-4"
              >
                <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Add listing</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative circle like in sidebar */}
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40" />
      </div>
    </div>
  );
};
