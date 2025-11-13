/**
 * React Query hooks for Real Estate Dashboard data
 */
import { useQuery } from '@tanstack/react-query';
import { realEstateDashboardApi } from '../api/realEstateDashboardApi';

/**
 * Hook to fetch overview dashboard data
 */
export const useRealEstateOverview = () =>
  useQuery({
    queryKey: ['real-estate', 'overview'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getOverview();
      return response.data;
    },
  });

/**
 * Hook to fetch portfolio data
 */
export const useRealEstatePortfolio = () =>
  useQuery({
    queryKey: ['real-estate', 'portfolio'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getPortfolio();
      return response.data;
    },
  });

/**
 * Hook to fetch location performance data
 */
export const useRealEstateLocation = () =>
  useQuery({
    queryKey: ['real-estate', 'location'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getLocation();
      return response.data;
    },
  });

/**
 * Hook to fetch occupancy data
 */
export const useRealEstateOccupancy = () =>
  useQuery({
    queryKey: ['real-estate', 'occupancy'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getOccupancy();
      return response.data;
    },
  });

/**
 * Hook to fetch earnings data
 */
export const useRealEstateEarnings = () =>
  useQuery({
    queryKey: ['real-estate', 'earnings'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getEarnings();
      return response.data;
    },
  });

/**
 * Hook to fetch sales pipeline data
 */
export const useRealEstateSalesPipeline = () =>
  useQuery({
    queryKey: ['real-estate', 'sales-pipeline'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getSalesPipeline();
      return response.data;
    },
  });

/**
 * Hook to fetch requests data
 */
export const useRealEstateRequests = () =>
  useQuery({
    queryKey: ['real-estate', 'requests'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getRequests();
      return response.data;
    },
  });

/**
 * Hook to fetch calendar events
 * @param start - Start date (YYYY-MM-DD)
 * @param end - End date (YYYY-MM-DD)
 */
export const useRealEstateCalendar = (start: string, end: string) =>
  useQuery({
    queryKey: ['real-estate', 'calendar', start, end],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getCalendar({ start, end });
      return response.data;
    },
    enabled: !!start && !!end,
  });

/**
 * Hook to fetch maintenance data
 */
export const useRealEstateMaintenance = () =>
  useQuery({
    queryKey: ['real-estate', 'maintenance'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getMaintenance();
      return response.data;
    },
  });

/**
 * Hook to fetch owners and tenants data
 */
export const useRealEstateOwnersAndTenants = () =>
  useQuery({
    queryKey: ['real-estate', 'owners-and-tenants'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getOwnersAndTenants();
      return response.data;
    },
  });

/**
 * Hook to fetch pricing and promotions data
 */
export const useRealEstatePricingAndPromotions = () =>
  useQuery({
    queryKey: ['real-estate', 'pricing-and-promotions'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getPricingAndPromotions();
      return response.data;
    },
  });

/**
 * Hook to fetch channels and distribution data
 */
export const useRealEstateChannelsAndDistribution = () =>
  useQuery({
    queryKey: ['real-estate', 'channels-and-distribution'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getChannelsAndDistribution();
      return response.data;
    },
  });

/**
 * Hook to fetch projects data
 */
export const useRealEstateProjects = () =>
  useQuery({
    queryKey: ['real-estate', 'projects'],
    queryFn: async () => {
      const response = await realEstateDashboardApi.getProjects();
      return response.data;
    },
  });
