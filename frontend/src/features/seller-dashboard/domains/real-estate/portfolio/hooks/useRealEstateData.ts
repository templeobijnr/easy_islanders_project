/**
 * Custom React hooks for Real Estate data fetching
 * Uses React Query for caching, loading states, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPortfolioStats,
  getPortfolioStats,
  getListingSummaries,
  getListingById,
  updateListing,
  deleteListing,
  getListingAnalytics,
  getListingEvents,
  getListingMessages,
  getUnreadMessageCount,
  getCurrentTenancy,
  getListingDeals,
  uploadListingImages,
  getListingTypes,
  getPropertyTypes,
  getLocations,
  getFeatures,
} from '../services/realEstateApi';
import type {
  Listing,
  ListingSummary,
  PortfolioStats,
} from '../types/realEstateModels';

// ============================================================================
// PORTFOLIO HOOKS
// ============================================================================

/**
 * Hook to fetch all portfolio statistics
 */
export const useAllPortfolioStats = () => {
  return useQuery({
    queryKey: ['portfolio', 'stats', 'all'],
    queryFn: getAllPortfolioStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch portfolio statistics for a specific listing type
 */
export const usePortfolioStats = (listingTypeCode: string) => {
  return useQuery({
    queryKey: ['portfolio', 'stats', listingTypeCode],
    queryFn: () => getPortfolioStats(listingTypeCode),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!listingTypeCode,
  });
};

/**
 * Hook to fetch listing summaries with filters
 */
export const useListingSummaries = (params?: {
  listing_type?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['listings', 'summaries', params],
    queryFn: () => getListingSummaries(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// ============================================================================
// LISTING DETAIL HOOKS
// ============================================================================

/**
 * Hook to fetch a single listing by ID
 */
export const useListing = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => getListingById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook to update a listing
 */
export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Partial<Listing> }) =>
      updateListing(id, data),
    onSuccess: (updatedListing) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['listings', updatedListing.id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'summaries'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'stats'] });
    },
  });
};

/**
 * Hook to delete a listing
 */
export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteListing(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['listings', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'summaries'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'stats'] });
    },
  });
};

/**
 * Hook to upload images for a listing
 */
export const useUploadListingImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, files }: { listingId: number | string; files: File[] }) =>
      uploadListingImages(listingId, files),
    onSuccess: (_, { listingId }) => {
      queryClient.invalidateQueries({ queryKey: ['listings', listingId] });
    },
  });
};

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Hook to fetch listing analytics
 */
export const useListingAnalytics = (listingId: number | string | undefined) => {
  return useQuery({
    queryKey: ['listings', listingId, 'analytics'],
    queryFn: () => getListingAnalytics(listingId!),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch listing events
 */
export const useListingEvents = (
  listingId: number | string | undefined,
  params?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['listings', listingId, 'events', params],
    queryFn: () => getListingEvents(listingId!, params),
    enabled: !!listingId,
    staleTime: 1 * 60 * 1000, // 1 minute
    keepPreviousData: true,
  });
};

// ============================================================================
// MESSAGES HOOKS
// ============================================================================

/**
 * Hook to fetch listing messages
 */
export const useListingMessages = (
  listingId: number | string | undefined,
  params?: {
    is_unread?: boolean;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['listings', listingId, 'messages', params],
    queryFn: () => getListingMessages(listingId!, params),
    enabled: !!listingId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for new messages
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch unread message count
 */
export const useUnreadMessageCount = (listingId: number | string | undefined) => {
  return useQuery({
    queryKey: ['listings', listingId, 'messages', 'unread-count'],
    queryFn: () => getUnreadMessageCount(listingId!),
    enabled: !!listingId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// ============================================================================
// TENANCY HOOKS
// ============================================================================

/**
 * Hook to fetch current tenancy for a listing
 */
export const useCurrentTenancy = (listingId: number | string | undefined) => {
  return useQuery({
    queryKey: ['listings', listingId, 'tenancy', 'current'],
    queryFn: () => getCurrentTenancy(listingId!),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// DEAL HOOKS
// ============================================================================

/**
 * Hook to fetch deals for a listing
 */
export const useListingDeals = (listingId: number | string | undefined) => {
  return useQuery({
    queryKey: ['listings', listingId, 'deals'],
    queryFn: () => getListingDeals(listingId!),
    enabled: !!listingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ============================================================================
// REFERENCE DATA HOOKS
// ============================================================================

/**
 * Hook to fetch all listing types
 */
export const useListingTypes = () => {
  return useQuery({
    queryKey: ['reference', 'listing-types'],
    queryFn: getListingTypes,
    staleTime: Infinity, // Reference data rarely changes
  });
};

/**
 * Hook to fetch all property types
 */
export const usePropertyTypes = () => {
  return useQuery({
    queryKey: ['reference', 'property-types'],
    queryFn: getPropertyTypes,
    staleTime: Infinity,
  });
};

/**
 * Hook to fetch all locations
 */
export const useLocations = () => {
  return useQuery({
    queryKey: ['reference', 'locations'],
    queryFn: getLocations,
    staleTime: Infinity,
  });
};

/**
 * Hook to fetch all features
 */
export const useFeatures = () => {
  return useQuery({
    queryKey: ['reference', 'features'],
    queryFn: getFeatures,
    staleTime: Infinity,
  });
};
