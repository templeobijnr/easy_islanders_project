import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

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

  const fetchUnreadCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(config.getApiUrl(config.ENDPOINTS.MESSAGES.UNREAD_COUNT));
      setUnreadCount(response.data.unread_count || 0);
      setError(null);
    } catch (err) {
      setError(err);
      // Don't reset count on error, might be a temporary network issue
      console.error("Failed to fetch unread count:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchUnreadCount();

    // Set up polling every 5 seconds
    const intervalId = setInterval(fetchUnreadCount, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

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
      const response = await axios.get(config.getApiUrl(config.ENDPOINTS.MESSAGES.GET_MESSAGES), {
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

 
