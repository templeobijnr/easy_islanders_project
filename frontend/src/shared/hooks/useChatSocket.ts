import { useEffect, useRef, useState } from 'react';
import config from '../../config';
import { getAccessToken, refreshAccessToken } from '../../auth/tokenStore';
import { wsMetrics } from '../utils/wsMetrics';

type Status = 'connected' | 'disconnected' | 'connecting' | 'error';

type AssistantFrame = {
  type: 'chat_message';
  event: 'assistant_message';
  thread_id: string;
  payload: {
    text: string;
    rich?: Record<string, unknown>;
  };
  meta: Record<string, unknown> & { in_reply_to: string };
};

type Options = {
  onMessage?: (m: any) => void;
  onStatus?: (s: Status) => void;
  onError?: (e: string) => void;
  onTyping?: (v: boolean) => void;
  correlationId?: string;
};

const toWebSocketUrl = async (threadId: string, correlationId?: string): Promise<string> => {
  const baseCandidate = (config.getWebSocketUrl?.() || config.WEBSOCKET?.URL || window.location.origin).replace(/\/$/, '');
  const base = baseCandidate.startsWith('ws') ? baseCandidate : baseCandidate.replace(/^http/i, 'ws');
  const params = new URLSearchParams();
  if (correlationId) params.set('cid', correlationId);

  // P0 FIX #3: Always get fresh token to prevent 403 errors
  let token = getAccessToken();

  // Try to refresh if token exists but might be stale
  if (token && typeof refreshAccessToken === 'function') {
    try {
      const freshToken = await refreshAccessToken();
      if (freshToken) token = freshToken;
    } catch (err) {
      // Fallback to existing token if refresh fails
      console.warn('[WebSocket] Token refresh failed, using existing token:', err);
    }
  }

  const allowQueryToken = process.env.NODE_ENV !== 'production';
  if (allowQueryToken && token) {
    params.set('token', token);
  }
  const suffix = params.toString();
  return `${base}/ws/chat/${threadId}/${suffix ? `?${suffix}` : ''}`;
};

const parseAssistantFrame = (raw: unknown): AssistantFrame | null => {
  if (!raw || typeof raw !== 'object') return null;
  const frame = raw as Record<string, unknown>;
  if (frame.type !== 'chat_message' || frame.event !== 'assistant_message') {
    return null;
  }
  if (typeof frame.thread_id !== 'string') return null;
  const payload = frame.payload;
  if (!payload || typeof payload !== 'object') return null;
  const text = (payload as Record<string, unknown>).text;
  if (typeof text !== 'string' || !text.trim()) return null;
  const meta = frame.meta;
  if (!meta || typeof meta !== 'object') return null;
  const inReplyTo = (meta as Record<string, unknown>).in_reply_to;
  if (typeof inReplyTo !== 'string' || !inReplyTo.trim()) return null;
  if (!('rich' in (payload as Record<string, unknown>))) {
    (payload as Record<string, unknown>).rich = {};
  } else if (typeof (payload as Record<string, unknown>).rich !== 'object' || (payload as Record<string, unknown>).rich === null) {
    (payload as Record<string, unknown>).rich = {};
  }
  return frame as AssistantFrame;
};

export function useChatSocket(threadId: string | null, opts: Options = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const { correlationId } = opts;

  // P0 FIX #1: Use refs to avoid reconnection on every render
  // Store callbacks in refs so they don't trigger useEffect when they change
  const onMessageRef = useRef(opts.onMessage);
  const onStatusRef = useRef(opts.onStatus);
  const onErrorRef = useRef(opts.onError);
  const onTypingRef = useRef(opts.onTyping);

  // P0 FIX #2: Automatic reconnection with exponential backoff
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const manuallyClosedRef = useRef(false);

  // P1 FIX #1: Single writer guarantee - track latest socket ID
  const latestSocketIdRef = useRef(0);

  // P1 FIX #2: Message deduplication - track last 200 messages
  const seenMessagesRef = useRef<Set<string>>(new Set());
  const seenMessagesOrderRef = useRef<string[]>([]);

  // Update callback refs when props change (but don't trigger reconnection)
  useEffect(() => {
    onMessageRef.current = opts.onMessage;
    onStatusRef.current = opts.onStatus;
    onErrorRef.current = opts.onError;
    onTypingRef.current = opts.onTyping;
  }, [opts.onMessage, opts.onStatus, opts.onError, opts.onTyping]);

  useEffect(() => {
    if (!threadId) return;
    if (config.WEBSOCKET?.ENABLED === false) return;

    // P1 FIX #1: Clear any pending reconnection attempts on new connection
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    manuallyClosedRef.current = false;

    // P1 FIX #3: Helper to schedule reconnection with jitter
    const scheduleReconnect = () => {
      if (manuallyClosedRef.current) return;
      if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current);

      const maxAttempts = 10;
      if (reconnectAttemptsRef.current >= maxAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        onErrorRef.current?.('Connection lost. Please refresh the page.');
        return;
      }

      // P1 FIX #4: Exponential backoff with jitter to prevent thundering herd
      const base = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
      const jitter = base * (0.8 + Math.random() * 0.4); // ±20% jitter
      console.log(`[WebSocket] Reconnecting in ${Math.round(jitter)}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);

      // P1 FIX #6: Track reconnection metrics
      wsMetrics.trackReconnect(reconnectAttemptsRef.current + 1, Math.round(jitter));

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current++;
        setReconnectTrigger(Date.now());
      }, jitter);
    };

    // Async function to handle token refresh
    const connect = async () => {
      try {
        onStatusRef.current?.('connecting');
        const url = await toWebSocketUrl(threadId, correlationId);
        console.log('[WebSocket] Connecting to:', { url, threadId, correlationId });

        // P1 FIX #1: Track socket ID for single writer guarantee
        const socketId = ++latestSocketIdRef.current;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          // P1 FIX #1: Drop events from stale sockets
          if (socketId !== latestSocketIdRef.current) {
            console.log('[WebSocket] Stale socket opened, closing it');
            ws.close();
            return;
          }
          console.log('[WebSocket] Opened:', { socketId, threadId, ts: new Date().toISOString() });
          console.log('[WebSocket] Connected successfully');
          reconnectAttemptsRef.current = 0; // Reset reconnection counter
          onStatusRef.current?.('connected');

          // P1 FIX #6: Track connection metrics
          wsMetrics.trackConnectionStart(threadId);

          // P1 FIX #5: Send client_hello for typing state recovery
          try {
            ws.send(JSON.stringify({ type: 'client_hello', thread_id: threadId }));
          } catch (err) {
            console.warn('[WebSocket] Failed to send client_hello:', err);
          }
        };

        ws.onclose = (event) => {
          // P1 FIX #1: Ignore events from stale sockets
          if (socketId !== latestSocketIdRef.current) {
            console.log('[WebSocket] Stale socket closed, ignoring');
            return;
          }

          console.log('[WebSocket] Closed:', event.code, event.reason);
          onStatusRef.current?.('disconnected');

          // P1 FIX #6: Track close code metrics
          wsMetrics.trackCloseCode(event.code, event.reason);
          wsMetrics.trackConnectionEnd();

          // Don't reconnect if manually closed or component unmounting
          if (manuallyClosedRef.current) {
            console.log('[WebSocket] Manual close, not reconnecting');
            return;
          }

          // P1 FIX #3: Close-code hygiene - categorize transient vs permanent errors
          // Don't retry on policy/auth codes
          if (event.code === 4401 || event.code === 1008 || event.code === 1003) {
            console.error('[WebSocket] Policy/auth error, not retrying:', event.code);
            onErrorRef.current?.('Authentication failed. Please refresh the page.');
            return;
          }

          // Do retry on transient codes (service restart, try again later, abnormal)
          const transientCodes = [1006, 1012, 1013];
          const shouldRetry = transientCodes.includes(event.code) || event.code === 1001 || !event.code;

          if (shouldRetry) {
            scheduleReconnect();
          } else {
            console.warn('[WebSocket] Non-transient close code, not retrying:', event.code);
            onErrorRef.current?.('Connection closed. Please refresh the page.');
          }
        };

        ws.onerror = (error) => {
          // P1 FIX #1: Ignore events from stale sockets
          if (socketId !== latestSocketIdRef.current) return;
          const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'] as const;
          const stateLabel = readyStates[ws.readyState] || String(ws.readyState);
          console.error('[WebSocket] Error:', error, { readyState: ws.readyState, state: stateLabel, socketId });
          onStatusRef.current?.('error');
          onErrorRef.current?.('WebSocket connection error');
        };

        ws.onmessage = (evt: MessageEvent) => {
          // P1 FIX #1: Drop events from stale sockets (single writer guarantee)
          if (socketId !== latestSocketIdRef.current) {
            console.log('[WebSocket] Dropping message from stale socket');
            return;
          }

          let parsed: any;
          try {
            parsed = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
          } catch (err) {
            console.error('[WebSocket] Invalid JSON:', err);
            onErrorRef.current?.('invalid_json');
            return;
          }

          if (!parsed || typeof parsed !== 'object') {
            return;
          }

          // Enhanced logging: show raw message envelope
          try {
            console.log('[WebSocket] Raw message received:', {
              type: parsed.type,
              event: parsed.event,
              thread_id: parsed.thread_id,
              payloadKeys: parsed?.payload ? Object.keys(parsed.payload) : [],
            });
          } catch (_) {
            // best-effort logging only
          }

          // P1 FIX #2: Message deduplication (LRU with max 200 entries)
          if (parsed.type === 'chat_message' && parsed.event === 'assistant_message') {
            const meta = parsed.meta || {};
            const dedupKey = `${parsed.thread_id}:${meta.trace || meta.in_reply_to || parsed.payload?.id || ''}`;

            if (dedupKey && dedupKey !== `${parsed.thread_id}:`) {
              if (seenMessagesRef.current.has(dedupKey)) {
                console.log('[WebSocket] Duplicate message detected, dropping:', dedupKey);
                return;
              }

              // Add to dedup cache (LRU: max 200 entries)
              seenMessagesRef.current.add(dedupKey);
              seenMessagesOrderRef.current.push(dedupKey);

              if (seenMessagesOrderRef.current.length > 200) {
                const oldest = seenMessagesOrderRef.current.shift();
                if (oldest) seenMessagesRef.current.delete(oldest);
              }
            }
          }

          // Handle rehydration (server-side push on reconnect)
          if (parsed.type === 'rehydration') {
            console.log('[WebSocket] Received rehydration data:', {
              rehydrated: parsed.rehydrated,
              active_domain: parsed.active_domain,
              turn_count: parsed.turn_count,
            });
            onMessageRef.current?.(parsed);
            return;
          }

          // Handle typing status
          if (parsed.type === 'chat_status' && parsed.event === 'typing') {
            if (typeof parsed.value === 'boolean') {
              onTypingRef.current?.(parsed.value);
            } else if (parsed.payload && typeof parsed.payload.value === 'boolean') {
              onTypingRef.current?.(parsed.payload.value);
            }
            onMessageRef.current?.(parsed);
            return;
          }

          // Handle assistant messages
          if (parsed.type === 'chat_message' && parsed.event === 'assistant_message') {
            const frame = parseAssistantFrame(parsed);
            if (!frame) {
              console.error('[WebSocket] Invalid assistant frame:', parsed);
              onErrorRef.current?.('invalid_frame');
              return;
            }
            onMessageRef.current?.(frame);
            return;
          }

          // Handle other message types
          onMessageRef.current?.(parsed);
        };
      } catch (err) {
        console.error('[WebSocket] Connection setup failed:', err);
        onErrorRef.current?.('Failed to establish connection');
      }
    };

    connect();

    // P1 FIX #2: Network awareness - reset backoff on reconnect
    const handleOnline = () => {
      console.log('[WebSocket] Network online, resetting backoff and reconnecting');
      reconnectAttemptsRef.current = 0;
      setReconnectTrigger(Date.now());
    };

    const handleOffline = () => {
      console.log('[WebSocket] Network offline');
      onStatusRef.current?.('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // P1 FIX #1: Remove network listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // P1 FIX #1: Clear any pending reconnection attempts (prevent memory leaks)
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Mark as manually closed to prevent reconnection
      manuallyClosedRef.current = true;

      // Close existing connection
      if (wsRef.current) {
        try {
          // Use normal close code (1000 = normal closure)
          wsRef.current.close(1000, 'Component unmounting');
        } catch (err) {
          console.error('[WebSocket] Error during cleanup:', err);
        }
        wsRef.current = null;
      }
    };
  }, [threadId, correlationId, reconnectTrigger]);
  // ^^ P0 FIX #1: ONLY reconnect when threadId, correlationId, or reconnectTrigger changes
  // Callbacks are NOT in dependency array - they use refs instead

  return wsRef;
}
