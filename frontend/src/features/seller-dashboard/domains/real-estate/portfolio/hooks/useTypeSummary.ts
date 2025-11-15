/**
 * useTypeSummary Hook
 *
 * Fetches summary metrics for a specific listing type
 */

import { useState, useEffect } from 'react';
import { ListingTypeCode } from '../types';

interface TypeSummaryData {
  active: number;
  total: number;
  inactive: number;

  // Daily Rental specific
  booked_this_month?: number;
  pending_requests?: number;
  total_revenue_this_month?: number;
  avg_occupancy?: number;

  // Long-term specific
  rented?: number;
  pending_applications?: number;

  // Sale specific
  under_offer?: number;
  offers_received?: number;
  viewing_requests?: number;

  // Project specific
  total_units?: number;
  available_units?: number;
  enquiries?: number;
}

interface UseTypeSummaryResult {
  data: TypeSummaryData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useTypeSummary = (type: ListingTypeCode): UseTypeSummaryResult => {
  const [data, setData] = useState<TypeSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/real_estate/portfolio/type-summary/?type=${type}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch type summary: ${response.statusText}`);
      }

      const summaryData = await response.json();
      setData(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [type]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSummary,
  };
};

/**
 * Example usage:
 *
 * const { data, isLoading, error } = useTypeSummary('DAILY_RENTAL');
 *
 * // data will contain:
 * // {
 * //   active: 24,
 * //   total: 28,
 * //   inactive: 4,
 * //   booked_this_month: 18,
 * //   pending_requests: 5,
 * //   total_revenue_this_month: 2160,
 * //   avg_occupancy: 75.5
 * // }
 */
