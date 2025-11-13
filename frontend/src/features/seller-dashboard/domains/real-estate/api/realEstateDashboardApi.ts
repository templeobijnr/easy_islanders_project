/**
 * API client for Real Estate Dashboard endpoints
 */
import { apiClient } from '@/services/apiClient';

export const realEstateDashboardApi = {
  /**
   * GET /api/dashboard/real-estate/overview
   * Returns key metrics for the overview dashboard
   */
  getOverview: () =>
    apiClient.get('/api/dashboard/real-estate/overview'),

  /**
   * GET /api/dashboard/real-estate/portfolio
   * Returns portfolio breakdown by property
   */
  getPortfolio: () =>
    apiClient.get('/api/dashboard/real-estate/portfolio'),

  /**
   * GET /api/dashboard/real-estate/location
   * Returns location-based performance data
   */
  getLocation: () =>
    apiClient.get('/api/dashboard/real-estate/location'),

  /**
   * GET /api/dashboard/real-estate/occupancy
   * Returns occupancy time-series data
   */
  getOccupancy: () =>
    apiClient.get('/api/dashboard/real-estate/occupancy'),

  /**
   * GET /api/dashboard/real-estate/earnings
   * Returns revenue and expense data
   */
  getEarnings: () =>
    apiClient.get('/api/dashboard/real-estate/earnings'),

  /**
   * GET /api/dashboard/real-estate/sales-pipeline
   * Returns sales pipeline funnel data
   */
  getSalesPipeline: () =>
    apiClient.get('/api/dashboard/real-estate/sales-pipeline'),

  /**
   * GET /api/dashboard/real-estate/requests
   * Returns user inquiries and requests
   */
  getRequests: () =>
    apiClient.get('/api/dashboard/real-estate/requests'),

  /**
   * GET /api/dashboard/real-estate/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
   * Returns calendar events (bookings, inspections, etc.)
   */
  getCalendar: (params: { start: string; end: string }) =>
    apiClient.get('/api/dashboard/real-estate/calendar', { params }),

  /**
   * GET /api/dashboard/real-estate/maintenance
   * Returns maintenance tickets and scheduled work
   */
  getMaintenance: () =>
    apiClient.get('/api/dashboard/real-estate/maintenance'),

  /**
   * GET /api/dashboard/real-estate/owners-and-tenants
   * Returns owners and tenants directory
   */
  getOwnersAndTenants: () =>
    apiClient.get('/api/dashboard/real-estate/owners-and-tenants'),

  /**
   * GET /api/dashboard/real-estate/pricing-and-promotions
   * Returns smart pricing suggestions and active promotions
   */
  getPricingAndPromotions: () =>
    apiClient.get('/api/dashboard/real-estate/pricing-and-promotions'),

  /**
   * GET /api/dashboard/real-estate/channels-and-distribution
   * Returns performance by distribution channel
   */
  getChannelsAndDistribution: () =>
    apiClient.get('/api/dashboard/real-estate/channels-and-distribution'),

  /**
   * GET /api/dashboard/real-estate/projects
   * Returns real estate projects (off-plan developments)
   */
  getProjects: () =>
    apiClient.get('/api/dashboard/real-estate/projects'),
};
