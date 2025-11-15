/**
 * FilterChips Component
 *
 * Displays active filters as removable chips with a "Clear all" button
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PortfolioFilters, FilterListingType, FilterStatus } from '../types';

interface FilterChipsProps {
  filters: PortfolioFilters;
  onRemoveFilter: (key: keyof PortfolioFilters) => void;
  onClearAll: () => void;
  className?: string;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  'DAILY_RENTAL': 'Daily Rental',
  'LONG_TERM_RENTAL': 'Long-term Rental',
  'SALE': 'For Sale',
  'PROJECT': 'Project',
};

const STATUS_LABELS: Record<string, string> = {
  'ACTIVE': 'Active',
  'INACTIVE': 'Inactive',
  'DRAFT': 'Draft',
  'UNDER_OFFER': 'Under Offer',
  'SOLD': 'Sold',
  'RENTED': 'Rented',
};

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  className = "",
}) => {
  const activeFilters: Array<{ key: keyof PortfolioFilters; label: string; value: string }> = [];

  // Add listing type filter if not "ALL"
  if (filters.listing_type && filters.listing_type !== 'ALL') {
    activeFilters.push({
      key: 'listing_type',
      label: 'Type',
      value: LISTING_TYPE_LABELS[filters.listing_type] || filters.listing_type,
    });
  }

  // Add status filter if not "ALL"
  if (filters.status && filters.status !== 'ALL') {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: STATUS_LABELS[filters.status] || filters.status,
    });
  }

  // Add city filter
  if (filters.city && filters.city.trim()) {
    activeFilters.push({
      key: 'city',
      label: 'City',
      value: filters.city,
    });
  }

  // Add area filter
  if (filters.area && filters.area.trim()) {
    activeFilters.push({
      key: 'area',
      label: 'Area',
      value: filters.area,
    });
  }

  // Add search filter
  if (filters.search && filters.search.trim()) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: filters.search,
    });
  }

  // Don't show anything if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        Active filters:
      </span>

      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-100 border border-lime-300 rounded-full text-sm text-slate-900"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="ml-1 hover:bg-lime-200 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-slate-600 hover:text-slate-900 h-7 px-2"
      >
        Clear all
      </Button>
    </div>
  );
};
