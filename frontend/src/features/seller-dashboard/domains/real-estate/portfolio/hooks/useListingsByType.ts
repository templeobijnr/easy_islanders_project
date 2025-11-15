/**
 * useListingsByType Hook
 *
 * Fetches listings filtered by type with search, status, and sort options
 */

import { useState, useEffect } from 'react';
import { ListingTypeCode, PortfolioListing } from '../types';

interface UseListingsByTypeParams {
  type: ListingTypeCode;
  search?: string;
  status?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

interface UseListingsByTypeResult {
  listings: PortfolioListing[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useListingsByType = ({
  type,
  search = '',
  status = 'all',
  sortBy = 'recent',
  page = 1,
  pageSize = 20,
}: UseListingsByTypeParams): UseListingsByTypeResult => {
  const [listings, setListings] = useState<PortfolioListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type,
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/v1/real_estate/portfolio/by-type/?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();
      setListings(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setListings([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [type, search, status, sortBy, page, pageSize]);

  return {
    listings,
    total,
    isLoading,
    error,
    refetch: fetchListings,
  };
};

/**
 * Example usage:
 *
 * const { listings, total, isLoading, error } = useListingsByType({
 *   type: 'DAILY_RENTAL',
 *   search: 'beach',
 *   status: 'active',
 *   sortBy: 'recent',
 *   page: 1,
 *   pageSize: 20
 * });
 */
