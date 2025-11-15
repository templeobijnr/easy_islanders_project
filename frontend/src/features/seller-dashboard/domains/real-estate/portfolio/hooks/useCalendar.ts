/**
 * useCalendar Hook
 *
 * Fetches and manages calendar data for a specific listing
 */

import { useState, useEffect, useCallback } from 'react';

type DayStatus = 'available' | 'booked' | 'blocked';

interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  price?: number;
  booking_id?: string;
  guest_name?: string;
  reason?: string; // For blocked dates
}

interface CalendarData {
  listing_id: string;
  month: string; // YYYY-MM
  days: Record<string, CalendarDay>;
  bookings: Array<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
  }>;
}

interface UseCalendarResult {
  calendar: Record<string, CalendarDay>;
  isLoading: boolean;
  error: Error | null;
  blockDates: (startDate: string, endDate: string, reason?: string) => Promise<void>;
  unblockDates: (startDate: string, endDate: string) => Promise<void>;
  setCustomPricing: (startDate: string, endDate: string, price: number) => Promise<void>;
  refetch: () => void;
}

export const useCalendar = (
  listingId: string | null,
  month: string // YYYY-MM format
): UseCalendarResult => {
  const [calendar, setCalendar] = useState<Record<string, CalendarDay>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalendar = useCallback(async () => {
    if (!listingId) {
      setCalendar({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/real_estate/listing/${listingId}/calendar/?month=${month}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.statusText}`);
      }

      const data: CalendarData = await response.json();
      setCalendar(data.days || {});
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setCalendar({});
    } finally {
      setIsLoading(false);
    }
  }, [listingId, month]);

  const blockDates = useCallback(
    async (startDate: string, endDate: string, reason?: string) => {
      if (!listingId) return;

      try {
        const response = await fetch(
          `/api/v1/real_estate/listing/${listingId}/calendar/block/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate,
              reason,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to block dates: ${response.statusText}`);
        }

        // Refetch calendar after blocking
        await fetchCalendar();
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to block dates');
      }
    },
    [listingId, fetchCalendar]
  );

  const unblockDates = useCallback(
    async (startDate: string, endDate: string) => {
      if (!listingId) return;

      try {
        const response = await fetch(
          `/api/v1/real_estate/listing/${listingId}/calendar/unblock/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start_date: startDate,
              end_date: endDate,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to unblock dates: ${response.statusText}`);
        }

        // Refetch calendar after unblocking
        await fetchCalendar();
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to unblock dates');
      }
    },
    [listingId, fetchCalendar]
  );

  const setCustomPricing = useCallback(
    async (startDate: string, endDate: string, price: number) => {
      if (!listingId) return;

      try {
        const response = await fetch(
          `/api/v1/real_estate/listing/${listingId}/pricing/custom/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date_range: {
                start: startDate,
                end: endDate,
              },
              price,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to set custom pricing: ${response.statusText}`);
        }

        // Refetch calendar after setting pricing
        await fetchCalendar();
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to set custom pricing');
      }
    },
    [listingId, fetchCalendar]
  );

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return {
    calendar,
    isLoading,
    error,
    blockDates,
    unblockDates,
    setCustomPricing,
    refetch: fetchCalendar,
  };
};

/**
 * Example usage:
 *
 * const { calendar, blockDates, setCustomPricing } = useCalendar(
 *   'listing-123',
 *   '2024-12'
 * );
 *
 * // Block dates
 * await blockDates('2024-12-24', '2024-12-26', 'Holiday closure');
 *
 * // Set custom pricing
 * await setCustomPricing('2024-07-01', '2024-08-31', 180);
 */
