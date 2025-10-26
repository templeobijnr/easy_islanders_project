import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

/**
 * useThreadManager Hook
 * 
 * Manages conversation thread ID state with:
 * - localStorage caching (non-authoritative)
 * - Cross-device sync via backend
 * - Automatic thread creation on first message
 * 
 * Usage:
 * const { threadId, isLoading, error, refreshThread, createNewThread } = useThreadManager(isAuthenticated);
 */
export const useThreadManager = (isAuthenticated) => {
  const [threadId, setThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch current thread from backend (cross-device sync)
   */
  const refreshThread = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping thread refresh');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/conversations/current/`,
        { withCredentials: true }
      );

      if (response.data.thread_id) {
        setThreadId(response.data.thread_id);
        localStorage.setItem('threadId', response.data.thread_id);
        console.log('✅ Thread synced from backend:', response.data.thread_id);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // No existing thread, will be created on first message
        console.log('ℹ️  No existing thread, will create on first message');
      } else {
        console.error('Error refreshing thread:', err);
        setError('Failed to sync conversation');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Create a new conversation thread
   */
  const createNewThread = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, cannot create thread');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/api/conversations/`,
        {},
        { withCredentials: true }
      );

      if (response.data.thread_id) {
        setThreadId(response.data.thread_id);
        localStorage.setItem('threadId', response.data.thread_id);
        console.log('✅ New thread created:', response.data.thread_id);
        return response.data.thread_id;
      }
    } catch (err) {
      console.error('Error creating new thread:', err);
      setError('Failed to create new conversation');
    } finally {
      setIsLoading(false);
    }

    return null;
  }, [isAuthenticated]);

  /**
   * Initialize thread on component mount
   * - Check localStorage first
   * - If not found, fetch from backend
   * - If backend has no thread, wait for first message to create one
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setThreadId(null);
      localStorage.removeItem('threadId');
      return;
    }

    // Try to get from localStorage first (fast path)
    const cachedThreadId = localStorage.getItem('threadId');
    if (cachedThreadId) {
      console.log('📌 Using cached thread ID:', cachedThreadId);
      setThreadId(cachedThreadId);
      // Still refresh in background to ensure sync
      refreshThread();
    } else {
      // No cache, try to get from backend (cross-device sync)
      console.log('🔄 No cached thread, syncing from backend...');
      refreshThread();
    }
  }, [isAuthenticated, refreshThread]);

  return {
    threadId,
    isLoading,
    error,
    refreshThread,
    createNewThread,
    setThreadId: (id) => {
      setThreadId(id);
      if (id) {
        localStorage.setItem('threadId', id);
      }
    },
  };
};

export default useThreadManager;

