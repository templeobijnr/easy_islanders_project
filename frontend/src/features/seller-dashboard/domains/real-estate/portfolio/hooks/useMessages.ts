/**
 * useMessages Hook
 *
 * Fetches messages/threads for a specific listing
 */

import { useState, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'owner';
  sender_name: string;
  sender_avatar?: string;
  timestamp: string;
  is_read: boolean;
}

interface MessageThread {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  last_message: Message;
  unread_count: number;
  messages: Message[];
}

interface UseMessagesResult {
  threads: MessageThread[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (threadId: string, message: string) => Promise<void>;
  refetch: () => void;
}

export const useMessages = (listingId: string | null): UseMessagesResult => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!listingId) {
      setThreads([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/messages/listing/${listingId}/`);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  const sendMessage = useCallback(async (threadId: string, message: string) => {
    try {
      const response = await fetch(`/api/v1/messages/threads/${threadId}/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Refetch messages after sending
      await fetchMessages();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to send message');
    }
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    threads,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
};

/**
 * Example usage:
 *
 * const { threads, isLoading, sendMessage } = useMessages('listing-123');
 *
 * // Send a message
 * await sendMessage('thread-456', 'Hello, the property is available!');
 */
