/**
 * Custom hook for seller dashboard data
 * Fetches analytics, buyer requests, and broadcasts
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useSellerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, requestsData, broadcastsData] = await Promise.all([
        api.getSellerAnalytics().catch(err => {
          console.error('Analytics fetch error:', err);
          return null;
        }),
        api.getBuyerRequests({ is_fulfilled: false }).catch(err => {
          console.error('Requests fetch error:', err);
          return [];
        }),
        api.getMyBroadcasts().catch(err => {
          console.error('Broadcasts fetch error:', err);
          return [];
        }),
      ]);

      setAnalytics(analyticsData);
      setRequests(requestsData);
      setBroadcasts(broadcastsData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    analytics,
    requests,
    broadcasts,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

export function useSellerProfile() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSeller() {
      try {
        setLoading(true);
        const data = await api.getSellerProfile();
        setSeller(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch seller profile:', err);
        setError(err.message || 'Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
  }, []);

  return { seller, loading, error };
}

export function useSellerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSellerAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

export function useBuyerRequests(filters = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBuyerRequests(filters);
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch buyer requests:', err);
      setError(err.message || 'Failed to load buyer requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests };
}

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getMyBroadcasts();
      setBroadcasts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
      setError(err.message || 'Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const createBroadcast = async (data) => {
    try {
      const newBroadcast = await api.createBroadcast(data);
      setBroadcasts(prev => [newBroadcast, ...prev]);
      return newBroadcast;
    } catch (err) {
      console.error('Failed to create broadcast:', err);
      throw err;
    }
  };

  const publishBroadcast = async (id) => {
    try {
      const updated = await api.publishBroadcast(id);
      setBroadcasts(prev =>
        prev.map(b => (b.id === id ? updated : b))
      );
      return updated;
    } catch (err) {
      console.error('Failed to publish broadcast:', err);
      throw err;
    }
  };

  const deleteBroadcast = async (id) => {
    try {
      await api.deleteBroadcast(id);
      setBroadcasts(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete broadcast:', err);
      throw err;
    }
  };

  return {
    broadcasts,
    loading,
    error,
    refetch: fetchBroadcasts,
    createBroadcast,
    publishBroadcast,
    deleteBroadcast,
  };
}
