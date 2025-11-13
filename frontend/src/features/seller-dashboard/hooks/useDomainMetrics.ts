/**
 * Hook for fetching unified seller metrics across all domains
 */

import { useQuery } from '@tanstack/react-query';
import { api } from "../../../lib/axios";

export interface DomainMetrics {
  domain: string;
  total_listings: number;
  active_listings: number;
  total_bookings: number;
  confirmed_bookings: number;
  revenue: number;
  booking_rate: number;
  avg_rating?: number;
}

export interface SellerOverview {
  business_id: string;
  business_name: string;
  total_listings: number;
  total_bookings: number;
  total_revenue: number;
  domains: DomainMetrics[];
}

/**
 * Fetch unified seller overview across all domains
 */
export const useSummarizedMetrics = () => {
  return useQuery({
    queryKey: ['seller-overview'],
    queryFn: async () => {
      const response = await api.get<SellerOverview>('/api/seller/overview/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Fetch all listings across domains, optionally filtered by domain
 */
export const useUnifiedListings = (domain?: string) => {
  return useQuery({
    queryKey: ['seller-listings', domain],
    queryFn: async () => {
      const params = domain ? { domain } : {};
      const response = await api.get('/api/seller/listings/', { params });
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
};

/**
 * Fetch all bookings across domains, optionally filtered by status
 */
export const useUnifiedBookings = (status?: string) => {
  return useQuery({
    queryKey: ['seller-bookings', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await api.get('/api/seller/bookings/', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

/**
 * Fetch detailed information for a specific listing
 */
export const useListingDetail = (listingId: string, domain: string = 'real_estate') => {
  return useQuery({
    queryKey: ['listing-detail', listingId, domain],
    queryFn: async () => {
      const response = await api.get(`/api/seller/listings/${listingId}/`, {
        params: { domain },
      });
      return response.data;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
