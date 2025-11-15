/**
 * useBookings Hook
 *
 * Fetches all bookings for a specific listing with filtering
 */

import { useState, useEffect, useCallback } from 'react';

type BookingStatus = 'upcoming' | 'current' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  listing_id: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
  };
  total_price: number;
  currency: string;
  status: BookingStatus;
  booked_at: string;
  special_requests?: string;
  payment_status: 'paid' | 'pending' | 'refunded';
}

interface UseBookingsParams {
  listingId: string | null;
  status?: 'all' | BookingStatus;
  page?: number;
  pageSize?: number;
}

interface UseBookingsResult {
  bookings: Booking[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useBookings = ({
  listingId,
  status = 'all',
  page = 1,
  pageSize = 20,
}: UseBookingsParams): UseBookingsResult => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!listingId) {
      setBookings([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        listing_id: listingId,
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/v1/bookings/?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }

      const data = await response.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setBookings([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, status, page, pageSize]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    total,
    isLoading,
    error,
    refetch: fetchBookings,
  };
};

/**
 * Example usage:
 *
 * const { bookings, total, isLoading } = useBookings({
 *   listingId: 'listing-123',
 *   status: 'upcoming',
 *   page: 1,
 *   pageSize: 20
 * });
 */
