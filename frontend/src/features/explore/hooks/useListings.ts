/**
 * Hook to fetch and manage listings from the API
 */

import { useState, useEffect } from 'react';
import { Listing, ListingsResponse, ExploreFilters } from '../types';

interface UseListingsOptions {
  category?: string | null;
  subcategory?: string | null;
  status?: string;
  is_featured?: boolean;
  limit?: number;
  autoFetch?: boolean;
}

interface UseListingsResult {
  listings: Listing[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  fetchListings: (filters?: Partial<UseListingsOptions>) => Promise<void>;
  refetch: () => void;
}

export function useListings(options: UseListingsOptions = {}): UseListingsResult {
  const {
    category = null,
    subcategory = null,
    status = 'active',
    is_featured,
    limit,
    autoFetch = true,
  } = options;

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchListings = async (overrides: Partial<UseListingsOptions> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      const finalCategory = overrides.category !== undefined ? overrides.category : category;
      const finalSubcategory = overrides.subcategory !== undefined ? overrides.subcategory : subcategory;
      const finalStatus = overrides.status !== undefined ? overrides.status : status;
      const finalFeatured = overrides.is_featured !== undefined ? overrides.is_featured : is_featured;
      const finalLimit = overrides.limit !== undefined ? overrides.limit : limit;

      if (finalCategory) params.append('category__slug', finalCategory);
      if (finalSubcategory) params.append('subcategory__slug', finalSubcategory);
      if (finalStatus) params.append('status', finalStatus);
      if (finalFeatured !== undefined) params.append('is_featured', String(finalFeatured));
      if (finalLimit) params.append('limit', String(finalLimit));

      const url = `/api/listings/?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data: ListingsResponse = await response.json();

      setListings(data.results || []);
      setHasMore(!!data.next);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [category, subcategory, status, is_featured, limit, autoFetch]);

  return {
    listings,
    loading,
    error,
    hasMore,
    fetchListings,
    refetch: () => fetchListings(),
  };
}
