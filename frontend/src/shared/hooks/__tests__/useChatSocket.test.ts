/**
 * Unit tests for useChatSocket hook
 *
 * Tests cover:
 * - Ref stability (no reconnection on callback changes)
 * - Token refresh before connect
 * - Close code handling (4401 = no retry, 1013 = retry)
 * - Backoff jitter (within expected range)
 * - Network awareness (online/offline events)
 * - Cleanup (timers, listeners, socket closed)
 * - Deduplication (same dedupKey filtered)
 * - Single writer guarantee (stale sockets ignored)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatSocket } from '../useChatSocket';
import * as tokenStore from '../../../auth/tokenStore';
import { wsMetrics } from '../../utils/wsMetrics';

// Mock dependencies
jest.mock('../../../auth/tokenStore');
jest.mock('../../utils/wsMetrics');
jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    WEBSOCKET: {
      ENABLED: true,
      URL: 'ws://localhost:8000',
    },
    getWebSocketUrl: jest.fn(() => 'ws://localhost:8000'),
  },
}));

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    const event = new CloseEvent('close', { code, reason });
    this.onclose?.(event);
  }
}

global.WebSocket = MockWebSocket as any;

describe('useChatSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock implementations
    (tokenStore.getAccessToken as jest.Mock).mockReturnValue('mock-token');
    (tokenStore.refreshAccessToken as jest.Mock).mockResolvedValue('fresh-token');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('P0-1: Ref Stability (No Reconnection on Callback Changes)', () => {
    it('should not reconnect when onMessage callback changes', async () => {
      const threadId = 'thread-123';
      let connectCount = 0;

      // Mock WebSocket to count connections
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          connectCount++;
        }
      } as any;

      const { rerender } = renderHook(
        ({ onMessage }) => useChatSocket(threadId, { onMessage }),
        {
          initialProps: { onMessage: jest.fn() },
        }
      );

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      expect(connectCount).toBe(1); // Initial connection

      // Change callback (should NOT trigger reconnection)
      rerender({ onMessage: jest.fn() });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(connectCount).toBe(1); // Still only 1 connection

      global.WebSocket = originalWebSocket;
    });

    it('should use latest callback ref when message arrives', async () => {
      const threadId = 'thread-123';
      const onMessage1 = jest.fn();
      const onMessage2 = jest.fn();

      const { rerender } = renderHook(
        ({ onMessage }) => useChatSocket(threadId, { onMessage }),
        {
          initialProps: { onMessage: onMessage1 },
        }
      );

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // Change callback
      rerender({ onMessage: onMessage2 });

      // Simulate message
      const ws = (global.WebSocket as any).instances[0];
      await act(async () => {
        ws.onmessage?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'chat_message',
              event: 'assistant_message',
              thread_id: threadId,
              payload: { text: 'Hello' },
              meta: { in_reply_to: 'msg-1' },
            }),
          })
        );
      });

      // Latest callback should be called, not the old one
      expect(onMessage1).not.toHaveBeenCalled();
      expect(onMessage2).toHaveBeenCalled();
    });
  });

  describe('P0-3: Token Refresh Before Connect', () => {
    it('should call refreshAccessToken before connecting', async () => {
      const threadId = 'thread-123';

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      expect(tokenStore.refreshAccessToken).toHaveBeenCalled();
    });

    it('should use fresh token in WebSocket URL', async () => {
      const threadId = 'thread-123';
      (tokenStore.refreshAccessToken as jest.Mock).mockResolvedValue('fresh-token');

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // In development, token should be in query params
      const ws = (global.WebSocket as any).instances?.[0];
      expect(ws?.url).toContain('token=fresh-token');
    });

    it('should fallback to existing token if refresh fails', async () => {
      const threadId = 'thread-123';
      (tokenStore.getAccessToken as jest.Mock).mockReturnValue('existing-token');
      (tokenStore.refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Token refresh failed'),
        expect.any(Error)
      );

      consoleWarn.mockRestore();
    });
  });

  describe('P1-3: Close Code Hygiene', () => {
    it('should NOT retry on auth failure (4401)', async () => {
      const threadId = 'thread-123';
      const onError = jest.fn();

      renderHook(() => useChatSocket(threadId, { onError }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Simulate auth failure
      await act(async () => {
        ws?.close(4401, 'auth_required');
      });

      // Should show error
      expect(onError).toHaveBeenCalledWith('Authentication failed. Please refresh the page.');

      // Should NOT schedule reconnection
      await act(async () => {
        jest.advanceTimersByTime(20000); // 20s should be enough for any retry
      });

      expect((global.WebSocket as any).instances?.length).toBe(1); // No new connection
    });

    it('should retry on transient errors (1013)', async () => {
      const threadId = 'thread-123';

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const initialCount = (global.WebSocket as any).instances?.length || 0;
      const ws = (global.WebSocket as any).instances?.[initialCount - 1];

      // Simulate transient error
      await act(async () => {
        ws?.close(1013, 'try_again_later');
      });

      // Should schedule reconnection with backoff
      await act(async () => {
        jest.advanceTimersByTime(2000); // First retry: ~1s
      });

      expect((global.WebSocket as any).instances?.length).toBeGreaterThan(initialCount);
    });

    it('should retry on abnormal closure (1006)', async () => {
      const threadId = 'thread-123';

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const initialCount = (global.WebSocket as any).instances?.length || 0;
      const ws = (global.WebSocket as any).instances?.[initialCount - 1];

      await act(async () => {
        ws?.close(1006, 'abnormal_closure');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect((global.WebSocket as any).instances?.length).toBeGreaterThan(initialCount);
    });
  });

  describe('P1-4: Backoff Jitter', () => {
    it('should add ±20% jitter to backoff delay', async () => {
      const threadId = 'thread-123';

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Trigger reconnection
      await act(async () => {
        ws?.close(1013, 'try_again_later');
      });

      // First retry base delay: 1000ms
      // Jitter range: 800ms - 1200ms
      const [timerId] = jest.getTimerCount() > 0 ? [jest.getTimers()[0]] : [null];

      if (timerId) {
        const delay = (timerId as any)._idleTimeout;
        expect(delay).toBeGreaterThanOrEqual(800);
        expect(delay).toBeLessThanOrEqual(1200);
      }
    });
  });

  describe('P1-5: Network Awareness', () => {
    it('should reconnect immediately on online event', async () => {
      const threadId = 'thread-123';

      renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Disconnect
      await act(async () => {
        ws?.close(1006, 'abnormal_closure');
      });

      const initialCount = (global.WebSocket as any).instances?.length || 0;

      // Simulate network coming back online
      await act(async () => {
        window.dispatchEvent(new Event('online'));
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Should reconnect immediately (no long backoff wait)
      expect((global.WebSocket as any).instances?.length).toBeGreaterThan(initialCount);
    });

    it('should update status to disconnected on offline event', async () => {
      const threadId = 'thread-123';
      const onStatus = jest.fn();

      renderHook(() => useChatSocket(threadId, { onStatus }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // Simulate network going offline
      await act(async () => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(onStatus).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('P1-1: Cleanup (Memory Leak Prevention)', () => {
    it('should clear timers on unmount', async () => {
      const threadId = 'thread-123';

      const { unmount } = renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Trigger reconnection to start timer
      await act(async () => {
        ws?.close(1013, 'try_again_later');
      });

      const timerCount = jest.getTimerCount();
      expect(timerCount).toBeGreaterThan(0);

      // Unmount should clear timers
      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('should remove event listeners on unmount', async () => {
      const threadId = 'thread-123';
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should close WebSocket on unmount', async () => {
      const threadId = 'thread-123';

      const { unmount } = renderHook(() => useChatSocket(threadId, {}));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];
      const closeSpy = jest.spyOn(ws, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalledWith(1000, 'Component unmounting');
    });
  });

  describe('P1-2: Message Deduplication', () => {
    it('should drop duplicate messages with same dedupKey', async () => {
      const threadId = 'thread-123';
      const onMessage = jest.fn();

      renderHook(() => useChatSocket(threadId, { onMessage }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      const message = {
        type: 'chat_message',
        event: 'assistant_message',
        thread_id: threadId,
        payload: { text: 'Hello' },
        meta: { in_reply_to: 'msg-1', trace: 'trace-1' },
      };

      // Send message twice
      await act(async () => {
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
      });

      await act(async () => {
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
      });

      // Should only call onMessage once
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('should maintain LRU cache of last 200 messages', async () => {
      const threadId = 'thread-123';
      const onMessage = jest.fn();

      renderHook(() => useChatSocket(threadId, { onMessage }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Send 201 unique messages
      for (let i = 0; i < 201; i++) {
        const message = {
          type: 'chat_message',
          event: 'assistant_message',
          thread_id: threadId,
          payload: { text: `Message ${i}` },
          meta: { in_reply_to: `msg-${i}`, trace: `trace-${i}` },
        };

        await act(async () => {
          ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
        });
      }

      // Send first message again (should NOT be deduplicated - evicted from cache)
      const firstMessage = {
        type: 'chat_message',
        event: 'assistant_message',
        thread_id: threadId,
        payload: { text: 'Message 0' },
        meta: { in_reply_to: 'msg-0', trace: 'trace-0' },
      };

      const callCountBefore = onMessage.mock.calls.length;

      await act(async () => {
        ws.onmessage?.(new MessageEvent('message', { data: JSON.stringify(firstMessage) }));
      });

      // Should have been called again (not in cache anymore)
      expect(onMessage.mock.calls.length).toBe(callCountBefore + 1);
    });
  });

  describe('P1-1: Single Writer Guarantee', () => {
    it('should ignore messages from stale sockets', async () => {
      const threadId = 'thread-123';
      const onMessage = jest.fn();

      const { rerender } = renderHook(() => useChatSocket(threadId, { onMessage }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const firstWs = (global.WebSocket as any).instances?.[0];

      // Trigger reconnection (creates new socket)
      await act(async () => {
        firstWs?.close(1013, 'try_again_later');
        jest.advanceTimersByTime(2000);
      });

      const secondWs = (global.WebSocket as any).instances?.[1];

      // Send message from stale (first) socket
      await act(async () => {
        firstWs.onmessage?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'chat_message',
              event: 'assistant_message',
              thread_id: threadId,
              payload: { text: 'From stale socket' },
              meta: { in_reply_to: 'msg-stale' },
            }),
          })
        );
      });

      // Should be ignored (not call onMessage)
      expect(onMessage).not.toHaveBeenCalled();

      // Send message from new socket
      await act(async () => {
        secondWs.onmessage?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'chat_message',
              event: 'assistant_message',
              thread_id: threadId,
              payload: { text: 'From new socket' },
              meta: { in_reply_to: 'msg-new' },
            }),
          })
        );
      });

      // Should be delivered
      expect(onMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null threadId gracefully', () => {
      expect(() => {
        renderHook(() => useChatSocket(null, {}));
      }).not.toThrow();
    });

    it('should handle invalid JSON gracefully', async () => {
      const threadId = 'thread-123';
      const onError = jest.fn();

      renderHook(() => useChatSocket(threadId, { onError }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      await act(async () => {
        ws.onmessage?.(new MessageEvent('message', { data: 'invalid json {' }));
      });

      expect(onError).toHaveBeenCalledWith('invalid_json');
    });

    it('should handle messages without required fields', async () => {
      const threadId = 'thread-123';
      const onError = jest.fn();
      const onMessage = jest.fn();

      renderHook(() => useChatSocket(threadId, { onError, onMessage }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      const ws = (global.WebSocket as any).instances?.[0];

      // Message without in_reply_to (required for dedup)
      await act(async () => {
        ws.onmessage?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              type: 'chat_message',
              event: 'assistant_message',
              thread_id: threadId,
              payload: { text: 'Hello' },
              meta: {}, // No in_reply_to
            }),
          })
        );
      });

      expect(onError).toHaveBeenCalledWith('invalid_frame');
    });

    it('should handle max reconnection attempts', async () => {
      const threadId = 'thread-123';
      const onError = jest.fn();

      renderHook(() => useChatSocket(threadId, { onError }));

      await act(async () => {
        jest.advanceTimersByTime(10);
      });

      // Simulate 10 failed reconnections
      for (let i = 0; i < 10; i++) {
        const ws = (global.WebSocket as any).instances?.[i];
        await act(async () => {
          ws?.close(1013, 'try_again_later');
          jest.advanceTimersByTime(20000); // More than max backoff
        });
      }

      // Should show max attempts error
      expect(onError).toHaveBeenCalledWith('Connection lost. Please refresh the page.');
    });
  });
});
