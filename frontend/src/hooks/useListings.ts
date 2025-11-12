/**
 * Hook for fetching and managing listings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Listing,
  ListingDetail,
  CreateListingRequest,
  UpdateListingRequest,
  ListingsResponse,
  ListingFilters,
} from '../types/schema';
import { apiClient } from '../services/api';

interface UseListingsOptions {
  filters?: ListingFilters;
  autoFetch?: boolean;
}

export function useListings(options: UseListingsOptions = {}) {
  const { filters = {}, autoFetch = true } = options;
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({ count: 0, limit: 20, offset: 0 });

  const fetchListings = useCallback(
    async (appliedFilters = filters) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();

        // Add filters
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });

        const response = await apiClient.get<ListingsResponse>(
          `/api/listings/?${queryParams.toString()}`
        );

        const data = response.data;
        setListings(data.results || data.listings || []);
        setPagination({
          count: data.count || 0,
          limit: appliedFilters.limit || 20,
          offset: appliedFilters.offset || 0,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch listings');
        setError(error);
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [autoFetch, fetchListings]);

  const createListing = useCallback(async (data: CreateListingRequest) => {
    try {
      const response = await apiClient.post<Listing>('/api/listings/', data);
      const newListing = response.data;
      setListings((prev) => [newListing, ...prev]);
      return newListing;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create listing');
      console.error('Error creating listing:', error);
      throw error;
    }
  }, []);

  const updateListing = useCallback(async (id: string, data: UpdateListingRequest) => {
    try {
      const response = await apiClient.patch<Listing>(`/api/listings/${id}/`, data);
      const updated = response.data;
      setListings((prev) =>
        prev.map((listing) => (listing.id === id ? updated : listing))
      );
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update listing');
      console.error('Error updating listing:', error);
      throw error;
    }
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/listings/${id}/`);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete listing');
      console.error('Error deleting listing:', error);
      throw error;
    }
  }, []);

  const getListingById = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get<ListingDetail>(`/api/listings/${id}/`);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch listing');
      console.error('Error fetching listing:', error);
      throw error;
    }
  }, []);

  const searchListings = useCallback(
    async (query: string, appliedFilters: ListingFilters = {}) => {
      return fetchListings({
        ...appliedFilters,
        search: query,
      });
    },
    [fetchListings]
  );

  const filterListings = useCallback(
    async (appliedFilters: ListingFilters) => {
      return fetchListings({
        ...filters,
        ...appliedFilters,
      });
    },
    [filters, fetchListings]
  );

  return {
    listings,
    isLoading,
    error,
    pagination,
    refetch: fetchListings,
    createListing,
    updateListing,
    deleteListing,
    getListingById,
    searchListings,
    filterListings,
  };
}

/**
 * Hook for managing user's own listings
 */
export function useMyListings(options: UseListingsOptions = {}) {
  const { filters = {}, autoFetch = true } = options;
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMyListings = useCallback(
    async (appliedFilters = filters) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({ my_listings: 'true' });

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });

        const response = await apiClient.get<ListingsResponse>(
          `/api/listings/?${queryParams.toString()}`
        );

        setListings(response.data.results || response.data.listings || []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch your listings');
        setError(error);
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchMyListings();
    }
  }, [autoFetch, fetchMyListings]);

  const createListing = useCallback(async (data: CreateListingRequest) => {
    try {
      const response = await apiClient.post<Listing>('/api/listings/', data);
      const newListing = response.data;
      setListings((prev) => [newListing, ...prev]);
      return newListing;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create listing');
      throw error;
    }
  }, []);

  const updateListing = useCallback(async (id: string, data: UpdateListingRequest) => {
    try {
      const response = await apiClient.patch<Listing>(`/api/listings/${id}/`, data);
      const updated = response.data;
      setListings((prev) =>
        prev.map((listing) => (listing.id === id ? updated : listing))
      );
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update listing');
      throw error;
    }
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/listings/${id}/`);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete listing');
      throw error;
    }
  }, []);

  return {
    listings,
    isLoading,
    error,
    refetch: fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
  };
}
