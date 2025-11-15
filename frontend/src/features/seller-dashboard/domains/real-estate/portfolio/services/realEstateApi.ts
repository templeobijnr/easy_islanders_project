/**
 * Real Estate API Service
 * Handles all API calls for real estate listings, properties, and portfolio data
 */

import axios from 'axios';
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

/**
 * Get portfolio statistics for a specific listing type
 */
export const getPortfolioStats = async (
  listingTypeCode: string
): Promise<PortfolioStats> => {
  const response = await api.get<PortfolioStats>(
    `/real-estate/portfolio/stats/${listingTypeCode}/`
  );
  return response.data;
};

/**
 * Get all portfolio statistics (all listing types)
 */
export const getAllPortfolioStats = async (): Promise<PortfolioStats[]> => {
  const response = await api.get<PortfolioStats[]>(
    '/real-estate/portfolio/stats/'
  );
  return response.data;
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
  const response = await api.get<PaginatedResponse<ListingSummary>>(
    '/real-estate/listings/summaries/',
    { params }
  );
  return response.data;
};

// ============================================================================
// LISTING DETAIL APIs
// ============================================================================

/**
 * Get full listing details by ID
 */
export const getListingById = async (id: number | string): Promise<Listing> => {
  const response = await api.get<Listing>(`/real-estate/listings/${id}/`);
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
 * Upload images for a listing
 */
export const uploadListingImages = async (
  listingId: number | string,
  files: File[]
): Promise<{ image_urls: string[] }> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post<{ image_urls: string[] }>(
    `/real-estate/listings/${listingId}/images/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Delete a listing image
 */
export const deleteListingImage = async (
  listingId: number | string,
  imageUrl: string
): Promise<void> => {
  await api.delete(`/real-estate/listings/${listingId}/images/`, {
    data: { image_url: imageUrl },
  });
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
