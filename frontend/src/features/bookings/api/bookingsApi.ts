/**
 * Bookings API Service
 * Handles all API calls for the booking system
 */

import axios from 'axios';
import config from '../../../config';
import type {
  Booking,
  BookingDetail,
  BookingType,
  BookingCreateRequest,
  BookingUpdateRequest,
  BookingConfirmRequest,
  BookingCancelRequest,
  BookingCompleteRequest,
  BookingStatistics,
  BookingHistory,
  BookingReview,
  BookingAvailability,
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  CalendarDay,
  BookingFilters,
  PaginatedResponse,
} from '../types';

const API_BASE = `${config.API_BASE_URL}/api/v1/bookings`;

// ============================================================================
// Booking Types
// ============================================================================

export const bookingTypesApi = {
  /**
   * Get all active booking types
   */
  list: async (): Promise<BookingType[]> => {
    const response = await axios.get<BookingType[]>(`${API_BASE}/types/`);
    return response.data;
  },

  /**
   * Get booking type by slug
   */
  get: async (slug: string): Promise<BookingType> => {
    const response = await axios.get<BookingType>(`${API_BASE}/types/${slug}/`);
    return response.data;
  },
};

// ============================================================================
// Bookings
// ============================================================================

export const bookingsApi = {
  /**
   * List user's bookings with optional filters
   */
  list: async (filters?: BookingFilters): Promise<PaginatedResponse<Booking>> => {
    const response = await axios.get<PaginatedResponse<Booking>>(
      `${API_BASE}/bookings/`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get current user's bookings
   */
  myBookings: async (filters?: BookingFilters): Promise<PaginatedResponse<Booking>> => {
    const response = await axios.get<PaginatedResponse<Booking>>(
      `${API_BASE}/bookings/my_bookings/`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get upcoming bookings
   */
  upcoming: async (): Promise<Booking[]> => {
    const response = await axios.get<Booking[]>(`${API_BASE}/bookings/upcoming/`);
    return response.data;
  },

  /**
   * Get past bookings
   */
  past: async (): Promise<Booking[]> => {
    const response = await axios.get<Booking[]>(`${API_BASE}/bookings/past/`);
    return response.data;
  },

  /**
   * Get booking statistics
   */
  statistics: async (): Promise<BookingStatistics> => {
    const response = await axios.get<BookingStatistics>(`${API_BASE}/bookings/statistics/`);
    return response.data;
  },

  /**
   * Get booking details by ID
   */
  get: async (id: string): Promise<BookingDetail> => {
    const response = await axios.get<BookingDetail>(`${API_BASE}/bookings/${id}/`);
    return response.data;
  },

  /**
   * Create a new booking
   */
  create: async (data: BookingCreateRequest): Promise<BookingDetail> => {
    const response = await axios.post<BookingDetail>(`${API_BASE}/bookings/`, data);
    return response.data;
  },

  /**
   * Update booking
   */
  update: async (id: string, data: BookingUpdateRequest): Promise<BookingDetail> => {
    const response = await axios.patch<BookingDetail>(`${API_BASE}/bookings/${id}/`, data);
    return response.data;
  },

  /**
   * Cancel booking (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/bookings/${id}/`);
  },

  /**
   * Confirm booking (seller only)
   */
  confirm: async (id: string, data: BookingConfirmRequest): Promise<BookingDetail> => {
    const response = await axios.post<BookingDetail>(
      `${API_BASE}/bookings/${id}/confirm/`,
      data
    );
    return response.data;
  },

  /**
   * Cancel booking with reason
   */
  cancel: async (id: string, data: BookingCancelRequest): Promise<BookingDetail> => {
    const response = await axios.post<BookingDetail>(
      `${API_BASE}/bookings/${id}/cancel/`,
      data
    );
    return response.data;
  },

  /**
   * Mark booking as completed
   */
  complete: async (id: string, data: BookingCompleteRequest): Promise<BookingDetail> => {
    const response = await axios.post<BookingDetail>(
      `${API_BASE}/bookings/${id}/complete/`,
      data
    );
    return response.data;
  },

  /**
   * Get booking history (audit trail)
   */
  history: async (id: string): Promise<BookingHistory[]> => {
    const response = await axios.get<BookingHistory[]>(`${API_BASE}/bookings/${id}/history/`);
    return response.data;
  },
};

// ============================================================================
// Availability
// ============================================================================

export const availabilityApi = {
  /**
   * List availability for listing or service provider
   */
  list: async (params: {
    listing_id?: string;
    service_provider_id?: string;
    date_after?: string;
    date_before?: string;
  }): Promise<BookingAvailability[]> => {
    const response = await axios.get<BookingAvailability[]>(
      `${API_BASE}/availability/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get availability details
   */
  get: async (id: string): Promise<BookingAvailability> => {
    const response = await axios.get<BookingAvailability>(`${API_BASE}/availability/${id}/`);
    return response.data;
  },

  /**
   * Create availability
   */
  create: async (data: Partial<BookingAvailability>): Promise<BookingAvailability> => {
    const response = await axios.post<BookingAvailability>(`${API_BASE}/availability/`, data);
    return response.data;
  },

  /**
   * Update availability
   */
  update: async (id: string, data: Partial<BookingAvailability>): Promise<BookingAvailability> => {
    const response = await axios.patch<BookingAvailability>(
      `${API_BASE}/availability/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Check if dates are available
   */
  check: async (data: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> => {
    const response = await axios.post<AvailabilityCheckResponse>(
      `${API_BASE}/availability/check/`,
      data
    );
    return response.data;
  },

  /**
   * Get calendar view for a month
   */
  calendar: async (params: {
    listing_id?: string;
    service_provider_id?: string;
    year: number;
    month: number;
  }): Promise<CalendarDay[]> => {
    const response = await axios.get<CalendarDay[]>(
      `${API_BASE}/availability/calendar/`,
      { params }
    );
    return response.data;
  },

  /**
   * Block dates (seller/staff only)
   */
  block: async (data: {
    listing_id?: string;
    service_provider_id?: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<BookingAvailability[]> => {
    const response = await axios.post<BookingAvailability[]>(
      `${API_BASE}/availability/block/`,
      data
    );
    return response.data;
  },

  /**
   * Unblock dates
   */
  unblock: async (data: {
    listing_id?: string;
    service_provider_id?: string;
    start_date: string;
    end_date: string;
  }): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(
      `${API_BASE}/availability/unblock/`,
      data
    );
    return response.data;
  },
};

// ============================================================================
// Reviews
// ============================================================================

export const reviewsApi = {
  /**
   * List reviews with optional filters
   */
  list: async (params?: {
    booking?: string;
    listing?: string;
    rating?: number;
    is_verified?: boolean;
  }): Promise<PaginatedResponse<BookingReview>> => {
    const response = await axios.get<PaginatedResponse<BookingReview>>(
      `${API_BASE}/reviews/`,
      { params }
    );
    return response.data;
  },

  /**
   * Get user's reviews
   */
  myReviews: async (): Promise<BookingReview[]> => {
    const response = await axios.get<BookingReview[]>(`${API_BASE}/reviews/my_reviews/`);
    return response.data;
  },

  /**
   * Get review details
   */
  get: async (id: string): Promise<BookingReview> => {
    const response = await axios.get<BookingReview>(`${API_BASE}/reviews/${id}/`);
    return response.data;
  },

  /**
   * Create review (completed bookings only)
   */
  create: async (data: {
    booking: string;
    rating: number;
    review_text: string;
    cleanliness_rating?: number;
    communication_rating?: number;
    value_rating?: number;
    location_rating?: number;
  }): Promise<BookingReview> => {
    const response = await axios.post<BookingReview>(`${API_BASE}/reviews/`, data);
    return response.data;
  },

  /**
   * Update review
   */
  update: async (id: string, data: Partial<BookingReview>): Promise<BookingReview> => {
    const response = await axios.patch<BookingReview>(`${API_BASE}/reviews/${id}/`, data);
    return response.data;
  },

  /**
   * Delete review
   */
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/reviews/${id}/`);
  },

  /**
   * Add seller response to review
   */
  respond: async (id: string, seller_response: string): Promise<BookingReview> => {
    const response = await axios.post<BookingReview>(
      `${API_BASE}/reviews/${id}/respond/`,
      { seller_response }
    );
    return response.data;
  },
};

// ============================================================================
// Export combined API
// ============================================================================

export const bookingApi = {
  types: bookingTypesApi,
  bookings: bookingsApi,
  availability: availabilityApi,
  reviews: reviewsApi,
};

export default bookingApi;
