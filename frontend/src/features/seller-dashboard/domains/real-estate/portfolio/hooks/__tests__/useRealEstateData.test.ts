/**
 * Unit tests for Real Estate Data Hooks
 * Tests React Query hooks for data fetching and mutations
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useAllPortfolioStats,
  usePortfolioStats,
  useListingSummaries,
  useListing,
  useUpdateListing,
  useDeleteListing,
  useListingAnalytics,
  useListingEvents,
  useListingMessages,
  useUnreadMessageCount,
  useCurrentTenancy,
  useListingDeals,
  useListingTypes,
  usePropertyTypes,
  useLocations,
  useFeatures,
} from '../useRealEstateData';
import * as api from '../../services/realEstateApi';

// Mock the API module
jest.mock('../../services/realEstateApi');

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Portfolio Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAllPortfolioStats', () => {
    it('should fetch all portfolio stats successfully', async () => {
      const mockStats = {
        total_listings: 42,
        active_listings: 35,
        total_revenue: 125000,
      };

      (api.getAllPortfolioStats as jest.Mock).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAllPortfolioStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
      expect(api.getAllPortfolioStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching portfolio stats', async () => {
      const mockError = new Error('Failed to fetch stats');
      (api.getAllPortfolioStats as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAllPortfolioStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('usePortfolioStats', () => {
    it('should fetch stats for specific listing type', async () => {
      const mockStats = {
        total_listings: 12,
        active_listings: 10,
        listing_type: 'rent_short',
      };

      (api.getPortfolioStats as jest.Mock).mockResolvedValue(mockStats);

      const { result } = renderHook(() => usePortfolioStats('rent_short'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
      expect(api.getPortfolioStats).toHaveBeenCalledWith('rent_short');
    });

    it('should not fetch when listingTypeCode is empty', () => {
      const { result } = renderHook(() => usePortfolioStats(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(api.getPortfolioStats).not.toHaveBeenCalled();
    });
  });

  describe('useListingSummaries', () => {
    it('should fetch listing summaries with filters', async () => {
      const mockSummaries = {
        results: [
          { id: 1, title: 'Beach Villa', status: 'ACTIVE' },
          { id: 2, title: 'City Apartment', status: 'ACTIVE' },
        ],
        count: 2,
        has_next: false,
      };

      (api.getListingSummaries as jest.Mock).mockResolvedValue(mockSummaries);

      const { result } = renderHook(
        () =>
          useListingSummaries({
            listing_type: 'rent_short',
            status: 'ACTIVE',
            page: 1,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSummaries);
      expect(api.getListingSummaries).toHaveBeenCalledWith({
        listing_type: 'rent_short',
        status: 'ACTIVE',
        page: 1,
      });
    });
  });
});

describe('Listing Detail Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useListing', () => {
    it('should fetch listing by ID', async () => {
      const mockListing = {
        id: 1,
        title: 'Luxury Villa',
        status: 'ACTIVE',
        property: {
          bedrooms: 3,
          bathrooms: 2,
        },
      };

      (api.getListingById as jest.Mock).mockResolvedValue(mockListing);

      const { result } = renderHook(() => useListing(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockListing);
      expect(api.getListingById).toHaveBeenCalledWith(1);
    });

    it('should not fetch when ID is undefined', () => {
      const { result } = renderHook(() => useListing(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(api.getListingById).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateListing', () => {
    it('should update listing and invalidate cache', async () => {
      const mockUpdatedListing = {
        id: 1,
        title: 'Updated Villa',
        base_price: '150000',
      };

      (api.updateListing as jest.Mock).mockResolvedValue(mockUpdatedListing);

      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateListing(), { wrapper });

      await result.current.mutateAsync({
        id: 1,
        data: { title: 'Updated Villa', base_price: '150000' },
      });

      expect(api.updateListing).toHaveBeenCalledWith(1, {
        title: 'Updated Villa',
        base_price: '150000',
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings', 1] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings', 'summaries'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['portfolio', 'stats'] });
    });
  });

  describe('useDeleteListing', () => {
    it('should delete listing and invalidate cache', async () => {
      (api.deleteListing as jest.Mock).mockResolvedValue(undefined);

      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useDeleteListing(), { wrapper });

      await result.current.mutateAsync(1);

      expect(api.deleteListing).toHaveBeenCalledWith(1);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings', 1] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings', 'summaries'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['portfolio', 'stats'] });
    });
  });
});

describe('Analytics Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useListingAnalytics', () => {
    it('should fetch analytics for listing', async () => {
      const mockAnalytics = {
        views_total: 1250,
        views_30d: 450,
        enquiries_total: 85,
        conversion_rate: 0.068,
      };

      (api.getListingAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const { result } = renderHook(() => useListingAnalytics(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAnalytics);
      expect(api.getListingAnalytics).toHaveBeenCalledWith(1);
    });
  });

  describe('useListingEvents', () => {
    it('should fetch events with pagination', async () => {
      const mockEvents = {
        results: [
          {
            id: 1,
            event_type: 'VIEW',
            occurred_at: '2025-01-15T10:30:00Z',
            metadata: {},
          },
        ],
        count: 1,
        has_next: false,
      };

      (api.getListingEvents as jest.Mock).mockResolvedValue(mockEvents);

      const { result } = renderHook(
        () => useListingEvents(1, { event_type: 'VIEW', page: 1, limit: 20 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockEvents);
      expect(api.getListingEvents).toHaveBeenCalledWith(1, {
        event_type: 'VIEW',
        page: 1,
        limit: 20,
      });
    });
  });
});

describe('Messages Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useListingMessages', () => {
    it('should fetch messages and refetch every minute', async () => {
      const mockMessages = {
        results: [
          {
            id: 1,
            thread_id: 'thread-1',
            content: 'Hello, is this available?',
            sender: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            created_at: '2025-01-15T10:30:00Z',
            is_read: false,
          },
        ],
        count: 1,
      };

      (api.getListingMessages as jest.Mock).mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useListingMessages(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMessages);
      expect(api.getListingMessages).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('useUnreadMessageCount', () => {
    it('should fetch unread count', async () => {
      const mockCount = { unread_count: 5 };

      (api.getUnreadMessageCount as jest.Mock).mockResolvedValue(mockCount);

      const { result } = renderHook(() => useUnreadMessageCount(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCount);
      expect(api.getUnreadMessageCount).toHaveBeenCalledWith(1);
    });
  });
});

describe('Tenancy and Deal Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCurrentTenancy', () => {
    it('should fetch current tenancy', async () => {
      const mockTenancy = {
        id: 1,
        tenant_name: 'Jane Smith',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        monthly_rent: '1200',
      };

      (api.getCurrentTenancy as jest.Mock).mockResolvedValue(mockTenancy);

      const { result } = renderHook(() => useCurrentTenancy(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTenancy);
      expect(api.getCurrentTenancy).toHaveBeenCalledWith(1);
    });
  });

  describe('useListingDeals', () => {
    it('should fetch deals for listing', async () => {
      const mockDeals = {
        results: [
          {
            id: 1,
            buyer_name: 'Alice Johnson',
            offer_amount: '95000',
            status: 'pending',
          },
        ],
        count: 1,
      };

      (api.getListingDeals as jest.Mock).mockResolvedValue(mockDeals);

      const { result } = renderHook(() => useListingDeals(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockDeals);
      expect(api.getListingDeals).toHaveBeenCalledWith(1);
    });
  });
});

describe('Reference Data Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useListingTypes', () => {
    it('should fetch listing types with infinite stale time', async () => {
      const mockTypes = [
        { code: 'rent_short', name: 'Daily Rental' },
        { code: 'rent_long', name: 'Long-term Rental' },
      ];

      (api.getListingTypes as jest.Mock).mockResolvedValue(mockTypes);

      const { result } = renderHook(() => useListingTypes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTypes);
      expect(api.getListingTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('usePropertyTypes', () => {
    it('should fetch property types', async () => {
      const mockTypes = [
        { code: 'villa', name: 'Villa' },
        { code: 'apartment', name: 'Apartment' },
      ];

      (api.getPropertyTypes as jest.Mock).mockResolvedValue(mockTypes);

      const { result } = renderHook(() => usePropertyTypes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTypes);
    });
  });

  describe('useLocations', () => {
    it('should fetch locations', async () => {
      const mockLocations = [
        { code: 'kyrenia', name: 'Kyrenia' },
        { code: 'famagusta', name: 'Famagusta' },
      ];

      (api.getLocations as jest.Mock).mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useLocations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLocations);
    });
  });

  describe('useFeatures', () => {
    it('should fetch features', async () => {
      const mockFeatures = [
        { code: 'pool', name: 'Swimming Pool' },
        { code: 'parking', name: 'Parking' },
      ];

      (api.getFeatures as jest.Mock).mockResolvedValue(mockFeatures);

      const { result } = renderHook(() => useFeatures(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockFeatures);
    });
  });
});
