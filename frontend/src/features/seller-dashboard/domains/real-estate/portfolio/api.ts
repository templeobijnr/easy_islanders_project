/**
 * Portfolio API service
 */

import { api } from '@/lib/axios';
import {
  PortfolioFilters,
  PortfolioListingsResponse,
  PortfolioSummaryResponse,
  PortfolioListing,
  ListingUpdatePayload,
} from './types';

/**
 * Fetch portfolio listings with filters
 */
export async function fetchPortfolioListings(
  filters: PortfolioFilters
): Promise<PortfolioListingsResponse> {
  const params: Record<string, any> = {
    page: filters.page,
    page_size: filters.page_size || 20,
  };

  if (filters.listing_type && filters.listing_type !== 'ALL') {
    params.listing_type = filters.listing_type;
  }

  if (filters.status && filters.status !== 'ALL') {
    params.status = filters.status;
  }

  if (filters.city) {
    params.city = filters.city;
  }

  if (filters.area) {
    params.area = filters.area;
  }

  if (filters.search) {
    params.search = filters.search;
  }

  const response = await api.get('/v1/real_estate/portfolio/listings/', {
    params,
  });

  return response.data;
}

/**
 * Fetch portfolio summary (aggregated stats by listing type)
 */
export async function fetchPortfolioSummary(
  timePeriod?: '30d' | '90d' | '1y'
): Promise<PortfolioSummaryResponse> {
  const params: Record<string, any> = {};

  if (timePeriod) {
    params.time_period = timePeriod;
  }

  const response = await api.get('/v1/real_estate/portfolio/summary/', {
    params,
  });
  return response.data;
}

/**
 * Update a listing
 */
export async function updateListing(
  id: number,
  payload: ListingUpdatePayload
): Promise<PortfolioListing> {
  const response = await api.patch(
    `/v1/real_estate/listings/${id}/`,
    payload
  );
  return response.data;
}
