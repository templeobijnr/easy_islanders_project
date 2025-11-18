/**
 * Integration Tests for ListingDetailPage
 * Tests complete listing detail flow with all tabs and real data
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ListingDetailPage from '../ListingDetailPage';
import {
  useListing,
  useListingAnalytics,
  useListingEvents,
  useListingMessages,
  useUpdateListing,
} from '../hooks/useRealEstateData';
import type { Listing } from '../types/realEstateModels';
import type {
  ListingAnalytics,
  ListingEvent,
  Message,
} from '../services/realEstateApi';

// Mock all hooks
jest.mock('../hooks/useRealEstateData');

const mockListing: Listing = {
  id: 1,
  reference_code: 'RE-2025-001',
  title: 'Luxury Beach Villa',
  description: 'Beautiful 3-bedroom villa with stunning sea views',
  base_price: '250000',
  currency: 'EUR',
  price_period: 'TOTAL',
  status: 'ACTIVE',
  available_from: '2025-02-01',
  available_to: null,
  property: {
    id: 1,
    bedrooms: 3,
    bathrooms: 2,
    area_sqm: 180,
    property_type: 'villa',
    location: {
      city: 'Kyrenia',
      district: 'Esentepe',
      country: 'Cyprus',
      latitude: 35.3213,
      longitude: 33.3224,
    },
  },
  image_urls: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
  ],
  listing_type_code: 'sale',
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
};

const mockAnalytics: ListingAnalytics = {
  views_total: 1250,
  views_7d: 180,
  views_30d: 450,
  enquiries_total: 85,
  enquiries_7d: 12,
  enquiries_30d: 35,
  bookings_total: 15,
  bookings_confirmed_total: 12,
  bookings_confirmed_30d: 5,
  conversion_rate: 0.068,
  avg_response_time_hours: 2.5,
};

const mockEvents: ListingEvent[] = [
  {
    id: 1,
    event_type: 'VIEW',
    occurred_at: '2025-01-15T10:00:00Z',
    metadata: { user_name: 'John Doe' },
  },
  {
    id: 2,
    event_type: 'ENQUIRY',
    occurred_at: '2025-01-15T11:00:00Z',
    metadata: { user_name: 'Jane Smith' },
  },
];

const mockMessages: Message[] = [
  {
    id: 1,
    thread_id: 'thread-1',
    content: 'Is this property still available?',
    sender: {
      id: 101,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    created_at: '2025-01-15T10:00:00Z',
    is_read: false,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/listings/1']}>
        <Routes>
          <Route path="/listings/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ListingDetailPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useListing as jest.Mock).mockReturnValue({
      data: mockListing,
      isLoading: false,
      error: null,
    });

    (useListingAnalytics as jest.Mock).mockReturnValue({
      data: mockAnalytics,
      isLoading: false,
      error: null,
    });

    (useListingEvents as jest.Mock).mockReturnValue({
      data: { results: mockEvents },
      isLoading: false,
      error: null,
    });

    (useListingMessages as jest.Mock).mockReturnValue({
      data: { results: mockMessages },
      isLoading: false,
      error: null,
    });

    (useUpdateListing as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(mockListing),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  describe('Page Load and Header', () => {
    it('should load and display listing details', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
        expect(screen.getByText('RE-2025-001')).toBeInTheDocument();
      });
    });

    it('should display property details in header', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/3 bed/i)).toBeInTheDocument();
        expect(screen.getByText(/2 bath/i)).toBeInTheDocument();
        expect(screen.getByText(/180 m²/i)).toBeInTheDocument();
      });
    });

    it('should display location information', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Esentepe, Kyrenia/i)).toBeInTheDocument();
      });
    });

    it('should display price information', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/EUR 250,000/i)).toBeInTheDocument();
      });
    });

    it('should display status badge', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should show listing image', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Activity/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Analytics/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Messages/i })).toBeInTheDocument();
      });
    });

    it('should switch to Activity tab when clicked', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Activity/i })).toBeInTheDocument();
      });

      const activityTab = screen.getByRole('tab', { name: /Activity/i });
      await user.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText('Listing Viewed')).toBeInTheDocument();
      });
    });

    it('should switch to Analytics tab when clicked', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
        expect(screen.getByText('450')).toBeInTheDocument();
      });
    });

    it('should switch to Messages tab when clicked', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const messagesTab = screen.getByRole('tab', { name: /Messages/i });
      await user.click(messagesTab);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Is this property still available/i)).toBeInTheDocument();
      });
    });

    it('should preserve tab state when switching between tabs', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      // Go to Analytics
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('450')).toBeInTheDocument();
      });

      // Go to Activity
      const activityTab = screen.getByRole('tab', { name: /Activity/i });
      await user.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText('Listing Viewed')).toBeInTheDocument();
      });

      // Go back to Analytics - data should still be there
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('450')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Functionality', () => {
    it('should open edit modal when edit button clicked', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit Listing|Edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/Edit Listing: RE-2025-001/i)).toBeInTheDocument();
      });
    });

    it('should close edit modal when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /Edit Listing|Edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/Edit Listing: RE-2025-001/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Edit Listing: RE-2025-001/i)).not.toBeInTheDocument();
      });
    });

    it('should update listing when edit is saved', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = jest.fn().mockResolvedValue({
        ...mockListing,
        base_price: '300000',
      });

      (useUpdateListing as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /Edit Listing|Edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Base Price/i)).toBeInTheDocument();
      });

      const priceInput = screen.getByLabelText(/Base Price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '300000');

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 1,
          data: expect.objectContaining({
            base_price: '300000',
          }),
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching listing', () => {
      (useListing as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading listing details.../i)).toBeInTheDocument();
    });

    it('should show loading in Activity tab', async () => {
      const user = userEvent.setup();

      (useListingEvents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const activityTab = screen.getByRole('tab', { name: /Activity/i });
      await user.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText(/Loading activities.../i)).toBeInTheDocument();
      });
    });

    it('should show loading in Analytics tab', async () => {
      const user = userEvent.setup();

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText(/Loading analytics.../i)).toBeInTheDocument();
      });
    });

    it('should show loading in Messages tab', async () => {
      const user = userEvent.setup();

      (useListingMessages as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const messagesTab = screen.getByRole('tab', { name: /Messages/i });
      await user.click(messagesTab);

      await waitFor(() => {
        expect(screen.getByText(/Loading messages.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should show error when listing fails to load', () => {
      const mockError = new Error('Failed to fetch listing');

      (useListing as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/Listing Not Found/i)).toBeInTheDocument();
    });

    it('should show error in Activity tab when events fail to load', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Failed to fetch events');

      (useListingEvents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const activityTab = screen.getByRole('tab', { name: /Activity/i });
      await user.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Activities/i)).toBeInTheDocument();
      });
    });

    it('should show error in Analytics tab when analytics fail to load', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Failed to fetch analytics');

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Analytics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete User Flow', () => {
    it('should handle complete viewing and editing flow', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = jest.fn().mockResolvedValue(mockListing);

      (useUpdateListing as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      // 1. Page loads with listing details
      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
      });

      // 2. View analytics
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('450')).toBeInTheDocument(); // views_30d
      });

      // 3. View activity
      const activityTab = screen.getByRole('tab', { name: /Activity/i });
      await user.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText('Listing Viewed')).toBeInTheDocument();
      });

      // 4. View messages
      const messagesTab = screen.getByRole('tab', { name: /Messages/i });
      await user.click(messagesTab);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // 5. Go back to overview
      const overviewTab = screen.getByRole('tab', { name: /Overview/i });
      await user.click(overviewTab);

      // 6. Edit the listing
      const editButton = screen.getByRole('button', { name: /Edit Listing|Edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Base Price/i)).toBeInTheDocument();
      });

      // 7. Change price
      const priceInput = screen.getByLabelText(/Base Price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '275000');

      // 8. Save changes
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Nested Data Handling', () => {
    it('should handle listing without property data gracefully', async () => {
      const listingWithoutProperty = {
        ...mockListing,
        property: null,
      };

      (useListing as jest.Mock).mockReturnValue({
        data: listingWithoutProperty,
        isLoading: false,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
      });

      // Should not crash, should handle missing nested data
      expect(screen.queryByText(/bed/i)).not.toBeInTheDocument();
    });

    it('should handle listing without location data gracefully', async () => {
      const listingWithoutLocation = {
        ...mockListing,
        property: {
          ...mockListing.property,
          location: null,
        },
      };

      (useListing as jest.Mock).mockReturnValue({
        data: listingWithoutLocation,
        isLoading: false,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
      });

      // Should not crash
      expect(screen.queryByText(/Kyrenia/i)).not.toBeInTheDocument();
    });

    it('should handle listing without images gracefully', async () => {
      const listingWithoutImages = {
        ...mockListing,
        image_urls: [],
      };

      (useListing as jest.Mock).mockReturnValue({
        data: listingWithoutImages,
        isLoading: false,
        error: null,
      });

      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Luxury Beach Villa')).toBeInTheDocument();
      });

      // Should show placeholder or handle missing images
      // Component should not crash
    });
  });

  describe('Design System Consistency', () => {
    it('should use lime-emerald gradient theme', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const gradients = document.querySelectorAll('[class*="from-lime"], [class*="to-emerald"]');
        expect(gradients.length).toBeGreaterThan(0);
      });
    });

    it('should use rounded-2xl borders', async () => {
      render(<ListingDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        const roundedElements = document.querySelectorAll('.rounded-2xl');
        expect(roundedElements.length).toBeGreaterThan(0);
      });
    });
  });
});
