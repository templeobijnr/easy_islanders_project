/**
 * Listings Tab Component
 *
 * Enhanced listing management with advanced filters, search, and table
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PortfolioFilters, PortfolioListing } from '../types';
import { PortfolioListingsTable } from './PortfolioListingsTable';
import { PortfolioFiltersBar } from './PortfolioFiltersBar';
import { FilterChips } from './FilterChips';
import { BulkActionsBar } from './BulkActionsBar';
import { EmptyState } from './EmptyState';
import { TabContextHeader } from './TabContextHeader';

interface ListingsTabProps {
  filters: PortfolioFilters;
  onFiltersChange: (filters: PortfolioFilters) => void;
  listings: PortfolioListing[];
  total: number;
  isLoading: boolean;
  onRefetch: () => void;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({
  filters,
  onFiltersChange,
  listings,
  total,
  isLoading,
  onRefetch,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showBulkHint, setShowBulkHint] = useState(() => {
    return localStorage.getItem('portfolio-bulk-hint-dismissed') !== 'true';
  });
  const advancedFiltersRef = React.useRef<HTMLDivElement>(null);

  const handleDismissBulkHint = () => {
    setShowBulkHint(false);
    localStorage.setItem('portfolio-bulk-hint-dismissed', 'true');
  };

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRemoveFilter = useCallback((key: keyof PortfolioFilters) => {
    const newFilters: PortfolioFilters = { ...filters, page: 1 };
    if (key === 'listing_type') {
      newFilters.listing_type = 'ALL';
    } else if (key === 'status') {
      newFilters.status = 'ALL';
    } else if (key === 'city' || key === 'area' || key === 'search') {
      newFilters[key] = '';
    }
    onFiltersChange(newFilters);

    // Clear search input if search filter is removed
    if (key === 'search') {
      setSearchInput('');
    }
  }, [filters, onFiltersChange]);

  const handleClearAllFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({
      listing_type: 'ALL',
      status: 'ALL',
      city: '',
      area: '',
      search: '',
      page: 1,
      page_size: filters.page_size,
    });
  }, [filters.page_size, onFiltersChange]);

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const handleToggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);

    // Scroll advanced filters into view when opening
    if (!showAdvancedFilters) {
      setTimeout(() => {
        advancedFiltersRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    }
  };

  const totalPages = Math.ceil(total / (filters.page_size || 20));

  // Count active filters for microcopy
  const activeFilterCount = [
    filters.listing_type !== 'ALL' ? 1 : 0,
    filters.status !== 'ALL' ? 1 : 0,
    filters.city ? 1 : 0,
    filters.area ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      <TabContextHeader
        title="Property Listings"
        description="All your properties. Use filters to narrow results and bulk select to edit multiple listings at once."
      />

      {/* Filter Summary */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{total}</strong> {total === 1 ? 'listing' : 'listings'}
            {activeFilterCount > 0 && (
              <span> · <strong className="text-slate-900">{activeFilterCount}</strong> {activeFilterCount === 1 ? 'filter' : 'filters'} active</span>
            )}
          </span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, reference code, or location..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Select
                value={filters.listing_type}
                onValueChange={(value: any) =>
                  onFiltersChange({ ...filters, listing_type: value, page: 1 })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Listing Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="DAILY_RENTAL">Daily Rental</SelectItem>
                  <SelectItem value="LONG_TERM_RENTAL">Long-term Rental</SelectItem>
                  <SelectItem value="SALE">For Sale</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value: any) =>
                  onFiltersChange({ ...filters, status: value, page: 1 })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="UNDER_OFFER">Under Offer</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="RENTED">Rented</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleAdvancedFilters}
                title="Advanced filters"
                aria-label="Toggle advanced filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div ref={advancedFiltersRef} className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Input
                  placeholder="Enter city..."
                  value={filters.city || ''}
                  onChange={(e) => onFiltersChange({ ...filters, city: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Area</label>
                <Input
                  placeholder="Enter area..."
                  value={filters.area || ''}
                  onChange={(e) => onFiltersChange({ ...filters, area: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Results per page</label>
                <Select
                  value={String(filters.page_size || 20)}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, page_size: Number(value), page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            className="mt-4 pt-4 border-t"
          />
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onChangeStatus={() => {
          // TODO: Implement bulk status change
          console.log('Change status for:', selectedIds);
        }}
        onUpdatePrice={() => {
          // TODO: Implement bulk price update
          console.log('Update price for:', selectedIds);
        }}
        onSetAvailability={() => {
          // TODO: Implement bulk availability update
          console.log('Set availability for:', selectedIds);
        }}
        onDelete={() => {
          // TODO: Implement bulk delete
          console.log('Delete:', selectedIds);
        }}
      />

      {/* Legacy Bulk Actions (remove this after testing) */}
      {false && selectedIds.length > 0 && (
        <Card className="bg-lime-50 border-lime-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">
                  {selectedIds.length} {selectedIds.length === 1 ? 'listing' : 'listings'} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Change Status
                </Button>
                <Button variant="outline" size="sm">
                  Update Price
                </Button>
                <Button variant="outline" size="sm">
                  Set Availability
                </Button>
                <Button variant="destructive" size="sm">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Select Discovery Hint */}
      {showBulkHint && total > 10 && selectedIds.length === 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900">
              <strong>Tip:</strong> Select multiple listings to change status or adjust prices in bulk.
            </p>
          </div>
          <button
            onClick={handleDismissBulkHint}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss hint"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Listings Table or Empty State */}
      <Card>
        <CardContent className="p-0">
          {!isLoading && listings.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No listings found"
              message="No listings match your current filters. Try adjusting your search criteria or add a new listing."
              primaryAction={{
                label: "Add listing",
                onClick: () => {
                  // TODO: Open create listing modal
                  window.location.href = '/dashboard/home/real-estate/upload';
                },
              }}
              secondaryAction={{
                label: "Clear filters",
                onClick: handleClearAllFilters,
              }}
            />
          ) : (
            <PortfolioListingsTable
              listings={listings}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={(listing) => {
                // TODO: Implement edit functionality
                console.log('Edit listing:', listing);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((filters.page - 1) * (filters.page_size || 20)) + 1} to{' '}
            {Math.min(filters.page * (filters.page_size || 20), total)} of {total} listings
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = filters.page <= 3
                  ? i + 1
                  : filters.page >= totalPages - 2
                  ? totalPages - 4 + i
                  : filters.page - 2 + i;

                return (
                  <Button
                    key={pageNum}
                    variant={filters.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
