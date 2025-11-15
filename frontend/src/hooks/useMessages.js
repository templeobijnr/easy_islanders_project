import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
import { http } from '../api';
import { useAuth } from '../shared/context/AuthContext';

/**
 * Custom hook to fetch and manage the unread message count.
 * Polls the API at a regular interval to keep the count fresh.
 *
 * Architectural Mandate (F.3.2):
 * - Provides real-time unread count for the global UserMenu badge.
 * - Aligns with Airbnb pattern by making transactional states globally visible.
 * - Uses a 5-second polling interval as decided for the MVP.
 *
 * @returns {{
 *   unreadCount: number;
 *   isLoading: boolean;
 *   error: any;
 *   fetchUnreadCount: () => Promise<void>;
 * }}
 */
export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(10000);
  const { isAuthenticated } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        setError(null);
        return;
      }

      const response = await http.get(config.ENDPOINTS.MESSAGES.UNREAD_COUNT);
      setUnreadCount(response.data.unread_count || 0);
      setError(null);

      if (pollInterval !== 10000) {
        setPollInterval(10000);
      }
    } catch (err) {
      setError(err);
      if (err?.response?.status === 429) {
        setPollInterval((prev) => {
          const next = prev * 2;
          return next > 60000 ? 60000 : next;
        });
      }
      console.error("Failed to fetch unread count:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, pollInterval]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setError(null);
      return;
    }

    fetchUnreadCount();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(fetchUnreadCount, pollInterval);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount, isAuthenticated, pollInterval]);

  return { unreadCount, isLoading, error, fetchUnreadCount };
};

/**
 * Custom hook to fetch and manage messages for a specific conversation thread.
 * Supports pagination to load more messages on demand.
 *
 * Architectural Mandate (F.3.2):
 * - Fetches conversation history from the durable backend store.
 * - Supports infinite scroll/lazy loading for efficient history traversal.
 * - Aligns with the thin-client model where state is managed server-side.
 *
 * @param {string | null} threadId The ID of the conversation thread.
 * @returns {{
 *   messages: any[];
 *   isLoading: boolean;
 *   error: any;
 *   hasMore: boolean;
 *   loadMoreMessages: () => void;
 * }}
 */
export const useMessages = (threadId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = useCallback(async (pageNum) => {
    if (!threadId || !hasMore) return;

    setIsLoading(true);
    try {
      // Use centralized axios client to include Authorization header
      const response = await http.get(config.ENDPOINTS.MESSAGES.GET_MESSAGES, {
        params: { thread_id: threadId, page: pageNum },
      });
      
      const newMessages = response.data.results || [];
      
      setMessages(prev => (pageNum === 1 ? newMessages : [...prev, ...newMessages]));
      setHasMore(!!response.data.next);
      setError(null);
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch messages for thread ${threadId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, hasMore]);

  useEffect(() => {
    // Reset and fetch messages when threadId changes
    setMessages([]);
    setPage(1);
    setHasMore(true);
    if (threadId) {
      fetchMessages(1);
    }
  }, [threadId, fetchMessages]);

  const loadMoreMessages = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  };

  return { messages, isLoading, error, hasMore, loadMoreMessages };
};


/**
 * Custom hook to provide a function for marking a conversation thread as read.
 *
 * Architectural Mandate (F.3.2):
 * - Provides a transactional way to update the unread status.
 * - Triggers a side-effect (refetching unread count) to ensure UI consistency.
 *
 * @returns {{
 *   markThreadAsRead: (threadId: string) => Promise<void>;
 *   isMarking: boolean;
 * }}
 */
export const useMarkAsRead = (fetchUnreadCount) => {
    const [isMarking, setIsMarking] = useState(false);

    const markThreadAsRead = useCallback(async (threadId) => {
        if (!threadId) return;
        setIsMarking(true);
        try {
            await axios.post(config.getApiUrl(config.ENDPOINTS.MESSAGES.MARK_READ(threadId)));
            // After marking as read, trigger a refetch of the global unread count
            if (fetchUnreadCount) {
              fetchUnreadCount();
            }
        } catch (err) {
            console.error(`Failed to mark thread ${threadId} as read:`, err);
        } finally {
            setIsMarking(false);
        }
    }, [fetchUnreadCount]);

    return { markThreadAsRead, isMarking };
};

 
