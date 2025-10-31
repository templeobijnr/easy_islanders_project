import { renderHook, act, waitFor } from '@testing-library/react';
import { useThreadManager } from '../useThreadManager';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('useThreadManager hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('initializes with cached thread ID', () => {
    localStorage.setItem('threadId', 'cached-thread-123');

    const { result } = renderHook(() => useThreadManager(true));

    expect(result.current.threadId).toBe('cached-thread-123');
  });

  test('refreshes thread from backend when authenticated', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { thread_id: 'backend-thread-456' },
    });

    const { result } = renderHook(() => useThreadManager(true));

    await act(async () => {
      await result.current.refreshThread();
    });

    expect(result.current.threadId).toBe('backend-thread-456');
    expect(localStorage.getItem('threadId')).toBe('backend-thread-456');
  });

  test('does not refresh thread when not authenticated', async () => {
    const { result } = renderHook(() => useThreadManager(false));

    await act(async () => {
      await result.current.refreshThread();
    });

    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  test('creates new thread when authenticated', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { thread_id: 'new-thread-789' },
    });

    const { result } = renderHook(() => useThreadManager(true));

    let newThreadId;
    await act(async () => {
      newThreadId = await result.current.createNewThread();
    });

    expect(newThreadId).toBe('new-thread-789');
    expect(result.current.threadId).toBe('new-thread-789');
    expect(localStorage.getItem('threadId')).toBe('new-thread-789');
  });

  test('handles thread creation failure', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() => useThreadManager(true));

    let newThreadId;
    await act(async () => {
      newThreadId = await result.current.createNewThread();
    });

    expect(newThreadId).toBeNull();
    expect(result.current.error).toBe('Failed to create new conversation');
  });

  test('clears thread when authentication is lost', () => {
    localStorage.setItem('threadId', 'some-thread');

    const { result, rerender } = renderHook(
      (isAuthenticated) => useThreadManager(isAuthenticated),
      { initialProps: true }
    );

    expect(result.current.threadId).toBe('some-thread');

    rerender(false);

    expect(result.current.threadId).toBeNull();
    expect(localStorage.getItem('threadId')).toBeNull();
  });

  test('sets thread ID manually', () => {
    const { result } = renderHook(() => useThreadManager(true));

    act(() => {
      result.current.setThreadId('manual-thread-999');
    });

    expect(result.current.threadId).toBe('manual-thread-999');
    expect(localStorage.getItem('threadId')).toBe('manual-thread-999');
  });
});