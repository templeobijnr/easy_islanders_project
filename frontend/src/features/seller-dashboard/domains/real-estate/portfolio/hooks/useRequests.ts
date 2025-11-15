/**
 * useRequests Hook
 *
 * Fetches booking requests, applications, viewings, or offers for a specific listing
 */

import { useState, useEffect, useCallback } from 'react';

type RequestType = 'booking' | 'application' | 'viewing' | 'offer';

interface BookingRequest {
  id: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  check_in: string;
  check_out: string;
  guests: {
    adults: number;
    children: number;
  };
  total_price: number;
  currency: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  special_requests?: string;
}

type Request = BookingRequest; // Can be extended for other request types

interface UseRequestsResult {
  requests: Request[];
  isLoading: boolean;
  error: Error | null;
  approveRequest: (requestId: string, notes?: string) => Promise<void>;
  declineRequest: (requestId: string, reason?: string) => Promise<void>;
  refetch: () => void;
}

export const useRequests = (
  listingId: string | null,
  requestType: RequestType
): UseRequestsResult => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!listingId) {
      setRequests([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = getEndpointForType(requestType);
      const response = await fetch(`${endpoint}?listing_id=${listingId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.statusText}`);
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, requestType]);

  const approveRequest = useCallback(async (requestId: string, notes?: string) => {
    try {
      const endpoint = getApproveEndpointForType(requestType);
      const response = await fetch(`${endpoint}${requestId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve request: ${response.statusText}`);
      }

      // Refetch requests after approval
      await fetchRequests();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to approve request');
    }
  }, [requestType, fetchRequests]);

  const declineRequest = useCallback(async (requestId: string, reason?: string) => {
    try {
      const endpoint = getApproveEndpointForType(requestType);
      const response = await fetch(`${endpoint}${requestId}/decline/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to decline request: ${response.statusText}`);
      }

      // Refetch requests after declining
      await fetchRequests();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to decline request');
    }
  }, [requestType, fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    isLoading,
    error,
    approveRequest,
    declineRequest,
    refetch: fetchRequests,
  };
};

// Helper functions to get endpoints based on request type
function getEndpointForType(type: RequestType): string {
  switch (type) {
    case 'booking':
      return '/api/v1/bookings/requests/';
    case 'application':
      return '/api/v1/rentals/applications/';
    case 'viewing':
      return '/api/v1/viewings/requests/';
    case 'offer':
      return '/api/v1/sales/offers/';
  }
}

function getApproveEndpointForType(type: RequestType): string {
  switch (type) {
    case 'booking':
      return '/api/v1/bookings/requests/';
    case 'application':
      return '/api/v1/rentals/applications/';
    case 'viewing':
      return '/api/v1/viewings/requests/';
    case 'offer':
      return '/api/v1/sales/offers/';
  }
}

/**
 * Example usage:
 *
 * const { requests, approveRequest, declineRequest } = useRequests(
 *   'listing-123',
 *   'booking'
 * );
 *
 * // Approve a booking request
 * await approveRequest('request-456', 'Looking forward to hosting you!');
 *
 * // Decline a booking request
 * await declineRequest('request-789', 'Dates no longer available');
 */
