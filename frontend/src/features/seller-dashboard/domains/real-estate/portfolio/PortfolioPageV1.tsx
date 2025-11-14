/**
 * Portfolio Page v1 - Complete portfolio management with data contract
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PortfolioSummaryRow } from './components/PortfolioSummaryRow';
import { PortfolioFiltersBar } from './components/PortfolioFiltersBar';
import { PortfolioListingsTable } from './components/PortfolioListingsTable';
import { EditListingModal } from './components/EditListingModal';
import { fetchPortfolioListings, fetchPortfolioSummary, updateListing } from './api';
import { PortfolioFilters, PortfolioListing, ListingUpdatePayload } from './types';

export const PortfolioPageV1: React.FC = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<PortfolioFilters>({
    listing_type: 'ALL',
    status: 'ALL',
    city: '',
    area: '',
    search: '',
    page: 1,
    page_size: 20,
  });

  const [editingListing, setEditingListing] = useState<PortfolioListing | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch portfolio summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['portfolioSummary'],
    queryFn: fetchPortfolioSummary,
  });

  // Fetch portfolio listings
  const {
    data: listingsData,
    isLoading: listingsLoading,
    refetch: refetchListings,
  } = useQuery({
    queryKey: ['portfolioListings', filters],
    queryFn: () => fetchPortfolioListings(filters),
  });

  // Update listing mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ListingUpdatePayload }) =>
      updateListing(id, payload),
    onSuccess: () => {
      // Invalidate and refetch both summary and listings
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioListings'] });
    },
  });

  const handleEditListing = (listing: PortfolioListing) => {
    setEditingListing(listing);
    setIsEditModalOpen(true);
  };

  const handleSaveListing = async (id: number, payload: ListingUpdatePayload) => {
    await updateMutation.mutateAsync({ id, payload });
  };

  const handleCreateListing = () => {
    // Navigate to create listing page
    console.log('Navigate to create listing page');
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const totalPages = (listingsData as any)
    ? Math.ceil((listingsData as any).total / (filters.page_size || 20))
    : 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Portfolio
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your property listings and performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8">
        {summaryLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading summary...</p>
          </div>
        ) : (
          <PortfolioSummaryRow summary={summary} />
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <PortfolioFiltersBar
            filters={filters}
            onChange={setFilters}
            onCreateListing={handleCreateListing}
          />
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardContent className="pt-6">
          {listingsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading listings...</p>
            </div>
          ) : (
            <>
              <PortfolioListingsTable
                listings={(listingsData as any)?.results || []}
                onEdit={handleEditListing}
              />

              {/* Pagination */}
              {(listingsData as any) && (listingsData as any).total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(filters.page - 1) * (filters.page_size || 20) + 1} to{' '}
                    {Math.min(filters.page * (filters.page_size || 20), (listingsData as any).total)} of{' '}
                    {(listingsData as any).total} listings
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, current, and adjacent pages
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - filters.page) <= 1
                          );
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis
                          const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                size="sm"
                                variant={page === filters.page ? 'default' : 'outline'}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditListingModal
        listing={editingListing}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingListing(null);
        }}
        onSave={handleSaveListing}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
};

export default PortfolioPageV1;
