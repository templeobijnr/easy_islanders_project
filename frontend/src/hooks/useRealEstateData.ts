import { useState, useEffect } from 'react';
import { fetchRealEstateData, ApiState } from '../utils/api/realEstateFetch';

/**
 * React hook for fetching real estate data with loading and error states
 *
 * @param endpoint - The API endpoint to fetch from
 * @param params - Optional query parameters
 * @returns Object with data, loading, and error states
 *
 * @example
 * const { data, loading, error } = useRealEstateData('/api/dashboard/real-estate/portfolio');
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage message={error} />;
 * return <PortfolioContent data={data} />;
 */
export const useRealEstateData = <T = any>(
  endpoint: string,
  params?: Record<string, any>
): ApiState<T> => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await fetchRealEstateData<T>(endpoint, params);
        if (mounted) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err: any) {
        if (mounted) {
          setState({ data: null, loading: false, error: err.message });
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [endpoint, JSON.stringify(params)]);

  return state;
};

export default useRealEstateData;
