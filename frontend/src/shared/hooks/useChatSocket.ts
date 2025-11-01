/**
 * WebSocket hook for real-time chat updates.
 *
 * Connects to backend WebSocket endpoint and listens for:
 * - assistant_message: New message from agent
 * - task_failed: Error during message processing
 * - typing/processing: Status updates
 *
 * Usage:
 *   const { threadId } = useChat();
 *   useChatSocket(threadId);
 */
import { useEffect, useRef } from 'react';
import { getAccessToken, onAccessTokenChange } from '../../auth/tokenStore';
import { ready } from '../auth/auth';
import config from '../../config';

export interface ChatSocketMessage {
  type: 'chat_message' | 'chat_error' | 'chat_status';
  event: string;
  value?: any;
  message?: {
    id: number;
    role: string;
    content: string;
    meta: Record<string, any>;
    ts: string;
  };
  error?: string;
  detail?: string;
}

export interface ChatSocketOptions {
  onMessage?: (message: ChatSocketMessage) => void;
  onStatus?: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
  onError?: (error: string) => void;
  onTyping?: (value: boolean) => void;
  correlationId?: string;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_RECONNECT_DELAY = 10000; // 10 seconds

export function useChatSocket(threadId: string | null | undefined, options: ChatSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const onMessageRef = useRef<ChatSocketOptions['onMessage']>();
  const onStatusRef = useRef<ChatSocketOptions['onStatus']>();
  const onErrorRef = useRef<ChatSocketOptions['onError']>();
  const onTypingRef = useRef<ChatSocketOptions['onTyping']>();

  onTypingRef.current = options.onTyping;

  // Keep latest callbacks without retriggering the connection effect
  onMessageRef.current = options.onMessage;
  onStatusRef.current = options.onStatus;
  onErrorRef.current = options.onError;

  useEffect(() => {
    let pingTimer: any = null;
    if (!threadId) return;

    // Get WebSocket base URL from config
    const wsBase = config.WEBSOCKET.URL?.replace(/^http/, 'ws').replace(/\/$/, '')
      || config.API_BASE_URL.replace(/^http/, 'ws');

    // Ensure auth module had a chance to hydrate
    ready();

    // Build WebSocket URL with token
    const correlationId = options.correlationId;
    function buildUrl() {
      const token = getAccessToken();
      const qp: string[] = [];
      if (token) qp.push(`token=${encodeURIComponent(token)}`);
      if (correlationId) qp.push(`cid=${encodeURIComponent(correlationId)}`);
      const qs = qp.length ? `?${qp.join('&')}` : '';
      return `${wsBase}/ws/chat/${threadId}/${qs}`;
    }

    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      onStatusRef.current?.('connecting');

      const ws = new WebSocket(buildUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', threadId);
        reconnectAttemptsRef.current = 0;
        onStatusRef.current?.('connected');
        // Keep-alive ping every 30s
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          } catch {}
        }, 30000);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        onStatusRef.current?.('disconnected');
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }

        // Attempt reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms ` +
            `(attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
          onErrorRef.current?.('Connection failed after ' + MAX_RECONNECT_ATTEMPTS + ' attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        onStatusRef.current?.('error');
        onErrorRef.current?.('Connection error');
      };

      ws.onmessage = (evt) => {
        try {
          const data: ChatSocketMessage = JSON.parse(evt.data);
          console.log('[WebSocket] Message received:', data);

          // Notify caller
          onMessageRef.current?.(data);

          // Handle specific event types
          if (data.type === 'chat_message' && data.event === 'assistant_message' && data.message) {
            // Message will be handled by onMessage callback
          } else if (data.type === 'chat_error') {
            const errorMsg = data.error || data.detail || 'Task failed';
            onErrorRef.current?.(errorMsg);
          } else if (data.type === 'chat_status') {
            if (data.event === 'typing') {
              onTypingRef.current?.(Boolean(data.value));
            } else {
              onStatusRef.current?.(data.event as any);
            }
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', evt.data, e);
        }
      };
    }

    // Subscribe to token changes to reconnect with fresh token
    const off = onAccessTokenChange(() => {
      try {
        if (wsRef.current) wsRef.current.close();
      } catch {}
      connect();
    });

    // Initial connection only if token present
    if (getAccessToken()) {
      connect();
    }

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      off();
      if (pingTimer) {
        clearInterval(pingTimer);
      }
    };
  }, [threadId, options.correlationId]);

  return wsRef;
}
