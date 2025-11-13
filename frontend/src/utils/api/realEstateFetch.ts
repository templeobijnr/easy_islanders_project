import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface RealEstateApiEndpoints {
  overview: '/api/dashboard/real-estate/overview';
  portfolio: '/api/dashboard/real-estate/portfolio';
  location: '/api/dashboard/real-estate/location';
  occupancy: '/api/dashboard/real-estate/occupancy';
  earnings: '/api/dashboard/real-estate/earnings';
  salesPipeline: '/api/dashboard/real-estate/sales-pipeline';
  requests: '/api/dashboard/real-estate/requests';
  calendar: '/api/dashboard/real-estate/calendar';
  maintenance: '/api/dashboard/real-estate/maintenance';
  ownersTenants: '/api/dashboard/real-estate/owners-tenants';
  pricingPromotions: '/api/dashboard/real-estate/pricing-promotions';
  channels: '/api/dashboard/real-estate/channels';
  projects: '/api/dashboard/real-estate/projects';
}

/**
 * Generic fetch function for real estate dashboard endpoints
 * @param endpoint - The API endpoint to fetch from
 * @param params - Optional query parameters
 * @returns Promise with the response data
 */
export const fetchRealEstateData = async <T = any>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Handle unauthorized - token expired
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch data');
  }
};

/**
 * Usage examples:
 *
 * import React from 'react';
 * import { fetchRealEstateData } from '@/utils/api/realEstateFetch';
 *
 * const PortfolioPage = () => {
 *   const [data, setData] = React.useState(null);
 *   const [loading, setLoading] = React.useState(true);
 *   const [error, setError] = React.useState(null);
 *
 *   React.useEffect(() => {
 *     fetchRealEstateData('/api/dashboard/real-estate/portfolio')
 *       .then(result => {
 *         setData(result);
 *         setLoading(false);
 *       })
 *       .catch(err => {
 *         setError(err.message);
 *         setLoading(false);
 *       });
 *   }, []);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>...render components with {data}</div>;
 * };
 *
 * Or use the useRealEstateData hook from '@/hooks/useRealEstateData':
 *
 * import { useRealEstateData } from '@/hooks/useRealEstateData';
 *
 * const PortfolioPage = () => {
 *   const { data, loading, error } = useRealEstateData('/api/dashboard/real-estate/portfolio');
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>...render components with {data}</div>;
 * };
 */

export default fetchRealEstateData;
