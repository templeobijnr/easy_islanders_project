import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages, useUnreadCount } from '../useMessages';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock the http client
jest.mock('../../api', () => ({
  http: {
    get: jest.fn(),
  },
}));

import { http } from '../../api';

describe('useMessages hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches messages for a thread', async () => {
    const mockMessages = [
      { id: 1, content: 'Test message', type: 'assistant' },
    ];

    http.get.mockResolvedValue({
      data: { results: mockMessages, next: null },
    });

    const { result } = renderHook(() => useMessages('thread-123'));

    await waitFor(() => {
      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasMore).toBe(false);
    });

    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('messages'),
      expect.objectContaining({
        params: { thread_id: 'thread-123', page: 1 },
      })
    );
  });

  test('loads more messages', async () => {
    const initialMessages = [{ id: 1, content: 'First message' }];
    const moreMessages = [{ id: 2, content: 'Second message' }];

    http.get
      .mockResolvedValueOnce({
        data: { results: initialMessages, next: 'next-page-url' },
      })
      .mockResolvedValueOnce({
        data: { results: moreMessages, next: null },
      });

    const { result } = renderHook(() => useMessages('thread-123'));

    await waitFor(() => {
      expect(result.current.messages).toEqual(initialMessages);
    });

    act(() => {
      result.current.loadMoreMessages();
    });

    await waitFor(() => {
      expect(result.current.messages).toEqual([...initialMessages, ...moreMessages]);
      expect(result.current.hasMore).toBe(false);
    });
  });

  test('handles fetch errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    http.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMessages('thread-123'));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isLoading).toBe(false);
    });

    consoleSpy.mockRestore();
  });
});

describe('useUnreadCount hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  test('fetches unread count when authenticated', async () => {
    // Mock authenticated state
    localStorage.setItem('token', 'fake-token');

    http.get.mockResolvedValue({
      data: { unread_count: 5 },
    });

    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(5);
      expect(result.current.isLoading).toBe(false);
    });

    expect(http.get).toHaveBeenCalledWith(
      expect.stringContaining('unread_count')
    );
  });

  test('returns 0 when not authenticated', async () => {
    // No token in localStorage
    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });

    expect(http.get).not.toHaveBeenCalled();
  });

  test('handles fetch errors gracefully', async () => {
    localStorage.setItem('token', 'fake-token');
    http.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUnreadCount());

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isLoading).toBe(false);
      // Should maintain previous count on error
    });
  });
});