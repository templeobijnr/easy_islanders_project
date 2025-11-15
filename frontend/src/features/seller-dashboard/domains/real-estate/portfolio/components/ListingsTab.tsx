/**
 * Listings Tab Component
 *
 * Enhanced listing management with advanced filters, search, and table
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { PortfolioFilters, PortfolioListing } from '../types';
import { PortfolioListingsTable } from './PortfolioListingsTable';
import { PortfolioFiltersBar } from './PortfolioFiltersBar';

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

  const handleSearch = (search: string) => {
    onFiltersChange({ ...filters, search, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const totalPages = Math.ceil(total / (filters.page_size || 20));

  return (
    <div className="space-y-6">
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
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
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
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
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

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          <PortfolioListingsTable
            listings={listings}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={(listing) => {
              // TODO: Implement edit functionality
              console.log('Edit listing:', listing);
            }}
          />
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
