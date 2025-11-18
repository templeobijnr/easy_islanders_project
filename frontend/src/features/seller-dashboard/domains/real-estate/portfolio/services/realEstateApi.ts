/**
 * Real Estate API Service
 * Handles all API calls for real estate listings, properties, and portfolio data
 */

import axios from 'axios';
import type { PortfolioListingsResponse, PortfolioSummaryResponse } from '../types';
import type {
  Listing,
  ListingSummary,
  PortfolioStats,
  Property,
  Contact,
  Tenancy,
  Deal,
  ListingEvent,
  PaginatedResponse,
} from '../types/realEstateModels';

// Base API URL from config
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// PORTFOLIO & LISTING SUMMARY APIs
// ============================================================================

 const mapSummaryItemToPortfolioStats = (
  item: PortfolioSummaryResponse[number]
): PortfolioStats => ({
  listing_type_code: item.listing_type,
  active_count: item.active_listings,
  total_count: item.total_listings,
  // Map 30-day bookings/enquiries to monthly-style metrics for now
  booked_this_month: item.bookings_30d,
  enquiries_count: item.enquiries_30d,
  total_units: item.total_listings,
  available_units: item.vacant_units ?? undefined,
});

/**
 * Get portfolio statistics for a specific listing type
 */
export const getPortfolioStats = async (
  listingTypeCode: string
): Promise<PortfolioStats> => {
  const response = await api.get<PortfolioSummaryResponse>(
    '/v1/real_estate/portfolio/summary/'
  );
  const summaryItem = response.data.find(
    (item) => item.listing_type === listingTypeCode
  );

  if (!summaryItem) {
    return {
      listing_type_code: listingTypeCode,
      active_count: 0,
      total_count: 0,
    };
  }

  return mapSummaryItemToPortfolioStats(summaryItem);
};

/**
 * Get all portfolio statistics (all listing types)
 */
export const getAllPortfolioStats = async (): Promise<PortfolioStats[]> => {
  const response = await api.get<PortfolioSummaryResponse>(
    '/v1/real_estate/portfolio/summary/'
  );
  return response.data.map(mapSummaryItemToPortfolioStats);
};

/**
 * Get listing summaries for portfolio view
 */
export const getListingSummaries = async (params?: {
  listing_type?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ListingSummary>> => {
  const apiParams: Record<string, any> = {};

  if (params?.listing_type) {
    apiParams.listing_type = params.listing_type;
  }
  if (params?.status) {
    apiParams.status = params.status;
  }
  if (params?.search) {
    apiParams.search = params.search;
  }
  if (typeof params?.page === 'number') {
    apiParams.page = params.page;
  }
  if (typeof params?.limit === 'number') {
    apiParams.page_size = params.limit;
  }

  const response = await api.get<PortfolioListingsResponse>(
    '/v1/real_estate/portfolio/listings/',
    { params: apiParams }
  );

  const listingSummaries: ListingSummary[] = response.data.results.map(
    (item) => ({
      listing_id: item.id,
      reference_code: item.reference_code,
      title: item.title,
      listing_type_code: item.listing_type,
      status: item.status,
      base_price: item.base_price,
      currency: item.currency,
      location_city: item.city ?? '',
      location_area: item.area ?? '',
      bedrooms: item.bedrooms ?? 0,
      bathrooms: item.bathrooms ?? 0,
      // Use room configuration as a simple label placeholder
      property_type_label: item.room_configuration_label ?? '',
      image_url: null,
      // Metrics not yet provided by backend - default to zero
      new_messages_count: 0,
      pending_requests_count: 0,
      bookings_30d_count: item.bookings_30d,
      occupancy_rate_30d: 0,
      managed_for_others: false,
      owner_name: null,
      current_tenant_name: null,
      current_lease_end_date: null,
    })
  );

  return {
    count: response.data.total,
    next: null,
    previous: null,
    results: listingSummaries,
  };
};

// ============================================================================
// LISTING DETAIL APIs
// ============================================================================

/**
 * Get full listing details by ID
 */
export const getListingById = async (id: number | string): Promise<Listing> => {
  const response = await api.get<Listing>(`/v1/real_estate/listings/${id}/`);
  return response.data;
};

/**
 * Create a new listing
 */
export const createListing = async (data: Partial<Listing>): Promise<Listing> => {
  const response = await api.post<Listing>('/real-estate/listings/', data);
  return response.data;
};

/**
 * Update an existing listing
 */
export const updateListing = async (
  id: number | string,
  data: Partial<Listing>
): Promise<Listing> => {
  const response = await api.patch<Listing>(
    `/real-estate/listings/${id}/`,
    data
  );
  return response.data;
};

/**
 * Delete a listing
 */
export const deleteListing = async (id: number | string): Promise<void> => {
  await api.delete(`/real-estate/listings/${id}/`);
};

/**
 * Update listing status
 */
export const updateListingStatus = async (
  id: number | string,
  status: string
): Promise<Listing> => {
  const response = await api.patch<Listing>(
    `/real-estate/listings/${id}/status/`,
    { status }
  );
  return response.data;
};

// ============================================================================
// PROPERTY APIs
// ============================================================================

/**
 * Get property details by ID
 */
export const getPropertyById = async (id: number | string): Promise<Property> => {
  const response = await api.get<Property>(`/real-estate/properties/${id}/`);
  return response.data;
};

/**
 * Create a new property
 */
export const createProperty = async (
  data: Partial<Property>
): Promise<Property> => {
  const response = await api.post<Property>('/real-estate/properties/', data);
  return response.data;
};

/**
 * Update an existing property
 */
export const updateProperty = async (
  id: number | string,
  data: Partial<Property>
): Promise<Property> => {
  const response = await api.patch<Property>(
    `/real-estate/properties/${id}/`,
    data
  );
  return response.data;
};

// ============================================================================
// TENANCY APIs
// ============================================================================

/**
 * Get tenancies for a listing
 */
export const getListingTenancies = async (
  listingId: number | string
): Promise<Tenancy[]> => {
  const response = await api.get<Tenancy[]>(
    `/real-estate/listings/${listingId}/tenancies/`
  );
  return response.data;
};

/**
 * Get current active tenancy for a listing
 */
export const getCurrentTenancy = async (
  listingId: number | string
): Promise<Tenancy | null> => {
  const response = await api.get<Tenancy | null>(
    `/real-estate/listings/${listingId}/tenancies/current/`
  );
  return response.data;
};

/**
 * Create a new tenancy/booking
 */
export const createTenancy = async (data: Partial<Tenancy>): Promise<Tenancy> => {
  const response = await api.post<Tenancy>('/real-estate/tenancies/', data);
  return response.data;
};

// ============================================================================
// DEAL APIs
// ============================================================================

/**
 * Get deals for a listing
 */
export const getListingDeals = async (
  listingId: number | string
): Promise<Deal[]> => {
  const response = await api.get<Deal[]>(
    `/real-estate/listings/${listingId}/deals/`
  );
  return response.data;
};

/**
 * Create a new deal
 */
export const createDeal = async (data: Partial<Deal>): Promise<Deal> => {
  const response = await api.post<Deal>('/real-estate/deals/', data);
  return response.data;
};

/**
 * Update deal stage
 */
export const updateDealStage = async (
  id: number | string,
  stage: string
): Promise<Deal> => {
  const response = await api.patch<Deal>(`/real-estate/deals/${id}/stage/`, {
    stage,
  });
  return response.data;
};

// ============================================================================
// ANALYTICS & EVENTS APIs
// ============================================================================

/**
 * Get listing events
 */
export const getListingEvents = async (
  listingId: number | string,
  params?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<ListingEvent>> => {
  const response = await api.get<PaginatedResponse<ListingEvent>>(
    `/real-estate/listings/${listingId}/events/`,
    { params }
  );
  return response.data;
};

/**
 * Track a new listing event
 */
export const trackListingEvent = async (
  listingId: number | string,
  eventType: string,
  metadata?: Record<string, any>
): Promise<ListingEvent> => {
  const response = await api.post<ListingEvent>(
    `/real-estate/listings/${listingId}/events/`,
    {
      event_type: eventType,
      metadata: metadata || {},
    }
  );
  return response.data;
};

/**
 * Get listing analytics summary
 */
export interface ListingAnalytics {
  views_total: number;
  views_30d: number;
  views_7d: number;
  enquiries_total: number;
  enquiries_30d: number;
  booking_requests_total: number;
  booking_requests_30d: number;
  bookings_confirmed_total: number;
  bookings_confirmed_30d: number;
  conversion_rate: number;
  avg_response_time_hours: number;
}

export const getListingAnalytics = async (
  listingId: number | string
): Promise<ListingAnalytics> => {
  const response = await api.get<ListingAnalytics>(
    `/real-estate/listings/${listingId}/analytics/`
  );
  return response.data;
};

// ============================================================================
// MESSAGES & COMMUNICATION APIs
// ============================================================================

export interface Message {
  id: number;
  thread_id: string;
  listing: number | null;
  sender: Contact;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get messages for a listing
 */
export const getListingMessages = async (
  listingId: number | string,
  params?: {
    is_unread?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<Message>> => {
  const response = await api.get<PaginatedResponse<Message>>(
    `/real-estate/listings/${listingId}/messages/`,
    { params }
  );
  return response.data;
};

/**
 * Get unread message count for a listing
 */
export const getUnreadMessageCount = async (
  listingId: number | string
): Promise<number> => {
  const response = await api.get<{ count: number }>(
    `/real-estate/listings/${listingId}/messages/unread-count/`
  );
  return response.data.count;
};

/**
 * Mark messages as read for a listing
 */
export const markMessagesAsRead = async (
  listingId: number | string
): Promise<void> => {
  await api.post(`/real-estate/listings/${listingId}/messages/mark-read/`);
};

// ============================================================================
// IMAGE UPLOAD APIs
// ============================================================================

/**
 * Upload images for a listing.
 *
 * Uses the v1 Real Estate upload endpoint which accepts a single
 * `image` file per request. We iterate through the provided files
 * and return the collected image URLs for convenience.
 */
export const uploadListingImages = async (
  listingId: number | string,
  files: File[]
): Promise<{ image_urls: string[] }> => {
  const uploadedUrls: string[] = [];

  // Upload each file sequentially so we can aggregate URLs
  for (const file of files) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<any>(
      `/v1/real_estate/listings/${listingId}/upload-image/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    let url =
      response?.data?.url ||
      response?.data?.image ||
      response?.data?.image_url ||
      response?.data?.path;
    if (url) {
      const isAbsolute = /^https?:\/\//i.test(url);
      const normalized = isAbsolute
        ? url
        : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      uploadedUrls.push(normalized);
    }
  }

  return { image_urls: uploadedUrls };
};

/**
 * Delete a listing image
 */
export const deleteListingImage = async (
  listingId: number | string,
  imageUrl: string
): Promise<void> => {
  await api.delete(`/v1/real_estate/listings/${listingId}/images/`, {
    data: { image_url: imageUrl },
  });
};

export const getListingImageUrls = async (
  listingId: number | string
): Promise<{ image_urls: string[]; image_count?: number }> => {
  const response = await api.get(`/listings/${listingId}/images/`);
  return response.data;
};

export const getRealEstateListingImages = async (
  listingId: number | string
): Promise<{ images: Array<{ url?: string; image?: string }>; image_count: number }> => {
  const response = await api.get(`/v1/real_estate/listings/${listingId}/images/`);
  return response.data;
};

// ============================================================================
// REFERENCE DATA APIs
// ============================================================================

/**
 * Get all listing types
 */
export const getListingTypes = async () => {
  const response = await api.get('/real-estate/listing-types/');
  return response.data;
};

/**
 * Get all property types
 */
export const getPropertyTypes = async () => {
  const response = await api.get('/real-estate/property-types/');
  return response.data;
};

/**
 * Get all locations
 */
export const getLocations = async () => {
  const response = await api.get('/real-estate/locations/');
  return response.data;
};

/**
 * Get all features
 */
export const getFeatures = async () => {
  const response = await api.get('/real-estate/features/');
  return response.data;
};

export default api;
