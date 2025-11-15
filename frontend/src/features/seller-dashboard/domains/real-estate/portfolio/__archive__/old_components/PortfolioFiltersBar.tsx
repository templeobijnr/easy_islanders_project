/**
 * Portfolio Filters Bar - Tabs, filters, search, and actions
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { PortfolioFilters, FilterListingType, FilterStatus } from '../types';

interface PortfolioFiltersBarProps {
  filters: PortfolioFilters;
  onChange: (filters: PortfolioFilters) => void;
  onCreateListing?: () => void;
}

export const PortfolioFiltersBar: React.FC<PortfolioFiltersBarProps> = ({
  filters,
  onChange,
  onCreateListing,
}) => {
  const handleListingTypeChange = (value: string) => {
    onChange({
      ...filters,
      listing_type: value as FilterListingType,
      page: 1, // Reset to page 1 when filtering
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      status: e.target.value as FilterStatus,
      page: 1,
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      city: e.target.value,
      page: 1,
    });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      area: e.target.value,
      page: 1,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      search: e.target.value,
      page: 1,
    });
  };

  return (
    <div className="space-y-4">
      {/* Listing Type Tabs */}
      <Tabs value={filters.listing_type} onValueChange={handleListingTypeChange}>
        <TabsList>
          <TabsTrigger value="ALL">All Listings</TabsTrigger>
          <TabsTrigger value="DAILY_RENTAL">Daily Rentals</TabsTrigger>
          <TabsTrigger value="LONG_TERM_RENTAL">Long-Term</TabsTrigger>
          <TabsTrigger value="SALE">Sales</TabsTrigger>
          <TabsTrigger value="PROJECT">Projects</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_OFFER">Under Offer</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
          </select>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">City:</label>
          <Input
            placeholder="e.g., Kyrenia"
            value={filters.city || ''}
            onChange={handleCityChange}
            className="w-40"
          />
        </div>

        {/* Area Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Area:</label>
          <Input
            placeholder="e.g., Esentepe"
            value={filters.area || ''}
            onChange={handleAreaChange}
            className="w-40"
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or reference..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Listing Button */}
        {onCreateListing && (
          <Button onClick={onCreateListing} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
        )}
      </div>
    </div>
  );
};
