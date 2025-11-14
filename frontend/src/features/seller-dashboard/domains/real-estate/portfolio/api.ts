/**
 * Portfolio API service
 */

import axios from 'axios';
import {
  PortfolioFilters,
  PortfolioListingsResponse,
  PortfolioSummaryResponse,
  PortfolioListing,
  ListingUpdatePayload,
} from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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

  const response = await axios.get(`${API_BASE_URL}/api/v1/real_estate/portfolio/listings/`, {
    params,
  });

  return response.data;
}

/**
 * Fetch portfolio summary (aggregated stats by listing type)
 */
export async function fetchPortfolioSummary(): Promise<PortfolioSummaryResponse> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/real_estate/portfolio/summary/`);
  return response.data;
}

/**
 * Update a listing
 */
export async function updateListing(
  id: number,
  payload: ListingUpdatePayload
): Promise<PortfolioListing> {
  const response = await axios.patch(
    `${API_BASE_URL}/api/v1/real_estate/listings/${id}/`,
    payload
  );
  return response.data;
}
