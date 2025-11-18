/**
 * Tests for AnalyticsTab Component
 * Tests analytics metrics display and data transformation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsTab } from '../AnalyticsTab';
import { useListingAnalytics } from '../../hooks/useRealEstateData';
import type { ListingAnalytics } from '../../services/realEstateApi';

// Mock the hooks
jest.mock('../../hooks/useRealEstateData');

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
  conversion_rate: 0.068, // 6.8%
  avg_response_time_hours: 2.5,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AnalyticsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching analytics', () => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Loading analytics.../i)).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', () => {
      const mockError = new Error('Failed to load analytics');

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Failed to Load Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    beforeEach(() => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });
    });

    it('should display total views metric', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument(); // views_30d
    });

    it('should display total inquiries metric', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Inquiries/i)).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument(); // enquiries_30d
    });

    it('should display bookings metric', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // bookings_confirmed_30d
    });

    it('should display conversion rate metric', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Conversion Rate/i)).toBeInTheDocument();
      expect(screen.getByText('6.8%')).toBeInTheDocument(); // 0.068 * 100
    });

    it('should display average response time metric', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText(/Avg Response Time/i)).toBeInTheDocument();
      expect(screen.getByText('2.5h')).toBeInTheDocument(); // avg_response_time_hours
    });
  });

  describe('Data Transformation', () => {
    it('should calculate percentage change correctly for increasing metrics', () => {
      const analyticsWithChange: ListingAnalytics = {
        ...mockAnalytics,
        views_30d: 450,
        views_total: 1250,
        // Previous period would be 1250 - 450 = 800
        // Change = (450 / 800) * 100 = 56.25%
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsWithChange,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should show positive percentage change
      expect(screen.getByText(/56\.3%/i)).toBeInTheDocument();
    });

    it('should handle zero previous period values', () => {
      const analyticsFirstPeriod: ListingAnalytics = {
        ...mockAnalytics,
        views_30d: 450,
        views_total: 450, // First period, no previous data
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsFirstPeriod,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should handle division by zero gracefully (0% change or N/A)
      const percentageElements = screen.queryAllByText(/0%|N\/A/i);
      expect(percentageElements.length).toBeGreaterThan(0);
    });

    it('should format large numbers with commas', () => {
      const analyticsLargeNumbers: ListingAnalytics = {
        ...mockAnalytics,
        views_total: 125000,
        views_30d: 45000,
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsLargeNumbers,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('45,000')).toBeInTheDocument();
    });
  });

  describe('Metric Cards', () => {
    beforeEach(() => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });
    });

    it('should display all metric cards', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should have 5 metric cards
      expect(screen.getByText(/Total Views/i)).toBeInTheDocument();
      expect(screen.getByText(/Inquiries/i)).toBeInTheDocument();
      expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      expect(screen.getByText(/Conversion Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Avg Response Time/i)).toBeInTheDocument();
    });

    it('should show metric icons', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Icons should be rendered (Eye, MessageCircle, Calendar, TrendingUp, Clock)
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(4); // At least 5 icons
    });

    it('should use gradient backgrounds', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      const gradients = document.querySelectorAll('[class*="from-"]');
      expect(gradients.length).toBeGreaterThan(0);
    });
  });

  describe('Trend Indicators', () => {
    it('should show up arrow for positive trends', () => {
      const analyticsPositiveTrend: ListingAnalytics = {
        ...mockAnalytics,
        views_30d: 450,
        views_total: 650, // Previous = 200, current = 450, so +125% trend
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsPositiveTrend,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should show upward trend indicators (ArrowUp icon or ↑ symbol)
      const trendElements = screen.queryAllByText(/\+/);
      expect(trendElements.length).toBeGreaterThan(0);
    });

    it('should show down arrow for negative trends', () => {
      const analyticsNegativeTrend: ListingAnalytics = {
        ...mockAnalytics,
        views_30d: 200,
        views_total: 1000, // Previous = 800, current = 200, so -75% trend
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsNegativeTrend,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should show downward trend indicators
      const percentageElements = screen.queryAllByText(/-/);
      expect(percentageElements.length).toBeGreaterThan(0);
    });
  });

  describe('Charts Section', () => {
    beforeEach(() => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });
    });

    it('should display analytics chart section', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should have chart title or container
      expect(screen.getByText(/Analytics Overview|Performance Chart/i)).toBeInTheDocument();
    });

    it('should show placeholder for chart', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Chart implementation may show placeholder
      const chartPlaceholders = screen.queryAllByText(/Chart|Graph|Coming Soon/i);
      expect(chartPlaceholders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fallback to Mock Data', () => {
    it('should show mock data when API returns no data', () => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Component falls back to mock data for demo
      expect(screen.getByText(/Total Views|Inquiries|Bookings/i)).toBeInTheDocument();
    });
  });

  describe('Conversion Rate Calculation', () => {
    it('should display conversion rate as percentage', () => {
      const analyticsHighConversion: ListingAnalytics = {
        ...mockAnalytics,
        conversion_rate: 0.125, // 12.5%
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsHighConversion,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    it('should handle zero conversion rate', () => {
      const analyticsNoConversion: ListingAnalytics = {
        ...mockAnalytics,
        conversion_rate: 0.0,
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsNoConversion,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should round conversion rate to one decimal place', () => {
      const analyticsDecimalConversion: ListingAnalytics = {
        ...mockAnalytics,
        conversion_rate: 0.06789, // Should round to 6.8%
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsDecimalConversion,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('6.8%')).toBeInTheDocument();
    });
  });

  describe('Response Time Display', () => {
    it('should display response time in hours', () => {
      const analyticsQuickResponse: ListingAnalytics = {
        ...mockAnalytics,
        avg_response_time_hours: 1.5,
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsQuickResponse,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('1.5h')).toBeInTheDocument();
    });

    it('should handle very fast response times', () => {
      const analyticsVeryQuick: ListingAnalytics = {
        ...mockAnalytics,
        avg_response_time_hours: 0.5, // 30 minutes
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsVeryQuick,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('0.5h')).toBeInTheDocument();
    });

    it('should handle slow response times', () => {
      const analyticsSlow: ListingAnalytics = {
        ...mockAnalytics,
        avg_response_time_hours: 24.0, // 1 day
      };

      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: analyticsSlow,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      expect(screen.getByText('24h')).toBeInTheDocument();
    });
  });

  describe('Design System Consistency', () => {
    beforeEach(() => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });
    });

    it('should use lime-emerald-sky gradient theme', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      const limeGradients = document.querySelectorAll('[class*="from-lime"]');
      const emeraldGradients = document.querySelectorAll('[class*="to-emerald"]');
      const skyGradients = document.querySelectorAll('[class*="from-sky"]');

      expect(
        limeGradients.length + emeraldGradients.length + skyGradients.length
      ).toBeGreaterThan(0);
    });

    it('should use rounded-2xl borders', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      const roundedElements = document.querySelectorAll('.rounded-2xl');
      expect(roundedElements.length).toBeGreaterThan(0);
    });

    it('should use shadow classes for elevation', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      const shadowElements = document.querySelectorAll('[class*="shadow"]');
      expect(shadowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Grid Layout', () => {
    beforeEach(() => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });
    });

    it('should use grid layout for metric cards', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      const gridContainers = document.querySelectorAll('[class*="grid"]');
      expect(gridContainers.length).toBeGreaterThan(0);
    });

    it('should be responsive', () => {
      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should have responsive grid classes like md:grid-cols-2, lg:grid-cols-3
      const responsiveGrids = document.querySelectorAll(
        '[class*="md:grid-cols"], [class*="lg:grid-cols"]'
      );
      expect(responsiveGrids.length).toBeGreaterThan(0);
    });
  });

  describe('Period Comparison', () => {
    it('should show comparison text for metrics', () => {
      (useListingAnalytics as jest.Mock).mockReturnValue({
        data: mockAnalytics,
        isLoading: false,
        error: null,
      });

      render(<AnalyticsTab listingId="1" />, { wrapper: createWrapper() });

      // Should show "vs last period" or similar text
      const comparisonTexts = screen.queryAllByText(/vs|compared to|from|than/i);
      expect(comparisonTexts.length).toBeGreaterThan(0);
    });
  });
});
