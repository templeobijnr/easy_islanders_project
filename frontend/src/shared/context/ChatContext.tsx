import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import type { Message, Role } from '../types';
import config from '../../config';
import { fetchJsonWithAuth } from '../http/fetchAuth';
import { AuthExpiredError } from '../auth/auth';
import { onAccessTokenChange } from '../../auth/tokenStore';
import AuthExpiredModal from '../components/AuthExpiredModal';

interface ChatState {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  send: () => void;
  canSend: boolean;
  isLoading: boolean;
  typing: boolean;
  setTyping: (v: boolean) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: (text: string, role?: Role) => void;
  results: any[]; // Recommendations/results from agent
  threadId: string | null; // Current conversation thread ID
  pushAssistantMessage: (message: any) => void; // Add message from WebSocket
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
  wsCorrelationId: string | null;
  handleAssistantError: (event: any) => void;
}

const ChatCtx = createContext<ChatState | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', role: 'agent', text: "Hi! Tell me what you need and I'll build a shortlist you can approve.", ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [results, setResults] = useState<any[]>([]); // Agent recommendations
  const [threadId, setThreadId] = useState<string | null>(
    () => localStorage.getItem('threadId') || null
  );
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const pendingRepliesRef = useRef<Map<string, { placeholderId: string; queuedMessageId?: string }>>(new Map());
  const sessionCorrelationIdRef = useRef<string>(crypto.randomUUID());
  const wsCorrelationId = sessionCorrelationIdRef.current;

  const [authExpired, setAuthExpired] = useState(false);
  const [outbox, setOutbox] = useState<Array<{ message: string; clientMsgId: string }>>([]);

  // keeps an always-up-to-date bottom ref for smooth autoscroll
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const canSend = useMemo(() => !!input.trim() && !isLoading, [input, isLoading]);

  const sendMessage = (text: string, role: Role = 'user') => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text, ts: Date.now() }]);
  };

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const now = Date.now();
    const clientMsgId = crypto.randomUUID();
    const correlationId = crypto.randomUUID();
    const optimisticUser: Message = {
      id: clientMsgId,
      role: 'user',
      text,
      ts: now,
    };
    const placeholderId = `pending-${clientMsgId}`;
    const optimisticAssistant: Message = {
      id: placeholderId,
      role: 'agent',
      text: "Working on it...",
      ts: now,
      pending: true,
      inReplyTo: clientMsgId,
    };
    setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);
    pendingRepliesRef.current.set(clientMsgId, { placeholderId });
    setIsLoading(true);

    try {
      // Call the real API
      const data = await fetchJsonWithAuth(
        `${config.API_BASE_URL}/api/chat/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Correlation-ID': correlationId },
          body: JSON.stringify({
            message: text,
            language: 'en',
            conversation_id: `conv-${Date.now()}`,
            thread_id: localStorage.getItem('threadId') || null,
            client_msg_id: clientMsgId,
          }),
        }
      );

      // Store thread_id if provided
      if (data.thread_id) {
        localStorage.setItem('threadId', data.thread_id);
        setThreadId(data.thread_id);
      }

      if (data.queued_message_id) {
        const entry = pendingRepliesRef.current.get(clientMsgId);
        if (entry) {
          pendingRepliesRef.current.set(clientMsgId, { ...entry, queuedMessageId: data.queued_message_id });
        }
      }

      // Do NOT append an HTTP reply when backend returns 202 (enqueue-only).
      // Let WebSocket deliver the assistant message to avoid duplicates.
      // If backend returns a synchronous reply (non-WS fallback), only display when WS is disabled
      if (data && data.response && (connectionStatus === 'error' || connectionStatus === 'disconnected')) {
        const replyText = data.response || data.message || "Got it. I'll search options that match.";
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.pending && m.inReplyTo === clientMsgId);
          if (idx === -1) {
            return [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'agent',
                text: replyText,
                ts: Date.now(),
                pending: false,
                inReplyTo: clientMsgId,
              },
            ];
          }
          const next = [...prev];
          next[idx] = {
            id: `a-${Date.now()}`,
            role: 'agent',
            text: replyText,
            ts: Date.now(),
            pending: false,
            inReplyTo: clientMsgId,
          };
          return next;
        });
        pendingRepliesRef.current.delete(clientMsgId);
      }

      // Update results if agent provides recommendations
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setResults(data.recommendations);
      } else if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
      }
    } catch (e: any) {
      if (e instanceof AuthExpiredError) {
        // Queue for resume after re-login; keep placeholder pending
        setOutbox((q) => [...q, { message: text, clientMsgId }]);
        setAuthExpired(true);
        return;
      }
      const fallbackText = 'Hmm, something went wrong. Please try again.';
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.pending && m.inReplyTo === clientMsgId);
        if (idx === -1) {
          return [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'agent',
              text: fallbackText,
              ts: Date.now(),
              pending: false,
              inReplyTo: clientMsgId,
            },
          ];
        }
        const next = [...prev];
        next[idx] = {
          id: `err-${Date.now()}`,
          role: 'agent',
          text: fallbackText,
          ts: Date.now(),
          pending: false,
          inReplyTo: clientMsgId,
        };
        return next;
      });
      pendingRepliesRef.current.delete(clientMsgId);
    } finally {
      setIsLoading(false);
    }
  }

  // Resume queued messages after a new access token is set
  useEffect(() => {
    const unsubscribe = onAccessTokenChange(async (token) => {
      if (!authExpired || !token || outbox.length === 0) return;
      const toSend = [...outbox];
      setOutbox([]);
      for (const item of toSend) {
        try {
          await fetchJsonWithAuth(`${config.API_BASE_URL}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Correlation-ID': crypto.randomUUID() },
            body: JSON.stringify({
              message: item.message,
              language: 'en',
              conversation_id: `conv-${Date.now()}`,
              thread_id: localStorage.getItem('threadId') || null,
              client_msg_id: item.clientMsgId,
            }),
          });
        } catch (err) {
          // Leave placeholder; WS or next send can recover
          console.error('Resume send failed', err);
        }
      }
      setAuthExpired(false);
    });
    return unsubscribe;
  }, [authExpired, outbox]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Push assistant message from WebSocket
  const pushAssistantMessage = (message: any) => {
    const inReplyTo: string | undefined =
      message.meta?.in_reply_to || message.message?.in_reply_to || undefined;
    const queuedMessageId: string | undefined =
      message.meta?.queued_message_id || message.message?.queued_message_id || undefined;
    const wsTs = message.ts ? new Date(message.ts).getTime() : Date.now();
    const resolvedId = message.id?.toString() || `ws-${Date.now()}`;

    setMessages((prev) => {
      if (inReplyTo) {
        const idx = prev.findIndex((m) => m.pending && m.inReplyTo === inReplyTo);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            id: resolvedId,
            text: message.content || message.text || next[idx].text,
            ts: wsTs,
            pending: false,
          };
          return next;
        }
      }

      let clientIdFromQueued: string | undefined;
      if (!inReplyTo && queuedMessageId) {
        for (const [clientId, meta] of Array.from(pendingRepliesRef.current.entries())) {
          if (meta.queuedMessageId === queuedMessageId) {
            clientIdFromQueued = clientId;
            break;
          }
        }
      }

      if (clientIdFromQueued) {
        const idx = prev.findIndex((m) => m.pending && m.inReplyTo === clientIdFromQueued);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            id: resolvedId,
            text: message.content || message.text || next[idx].text,
            ts: wsTs,
            pending: false,
          };
          return next;
        }
      }

      return [
        ...prev,
        {
          id: resolvedId,
          role: 'agent',
          text: message.content || message.text,
          ts: wsTs,
          pending: false,
          inReplyTo: inReplyTo ?? null,
        },
      ];
    });

    if (inReplyTo) {
      pendingRepliesRef.current.delete(inReplyTo);
    } else if (queuedMessageId) {
      for (const [clientId, meta] of Array.from(pendingRepliesRef.current.entries())) {
        if (meta.queuedMessageId === queuedMessageId) {
          pendingRepliesRef.current.delete(clientId);
          break;
        }
      }
    }

    // Update results if included in message meta
    if (message.meta?.recommendations) {
      setResults(message.meta.recommendations);
    } else if (message.meta?.results) {
      setResults(message.meta.results);
    }
  };

  const handleAssistantError = useCallback((event: any) => {
    const payload = event?.message || {};
    const inReplyTo: string | undefined = payload.in_reply_to || payload.client_msg_id;
    const queuedMessageId: string | undefined = payload.queued_message_id;
    const errorText: string =
      event?.error || "Hmm, something went wrong. Please try again.";

    let targetClientId = inReplyTo;
    if (!targetClientId && queuedMessageId) {
      for (const [clientId, meta] of Array.from(pendingRepliesRef.current.entries())) {
        if (meta.queuedMessageId === queuedMessageId) {
          targetClientId = clientId;
          break;
        }
      }
    }

    setMessages((prev) => {
      if (!targetClientId) {
        return [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'agent',
            text: errorText,
            ts: Date.now(),
            pending: false,
            inReplyTo: null,
          },
        ];
      }

      const idx = prev.findIndex((m) => m.pending && m.inReplyTo === targetClientId);
      if (idx === -1) {
        return [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'agent',
            text: errorText,
            ts: Date.now(),
            pending: false,
            inReplyTo: targetClientId,
          },
        ];
      }

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        id: `err-${Date.now()}`,
        text: errorText,
        ts: Date.now(),
        pending: false,
      };
      return next;
    });

    if (targetClientId) {
      pendingRepliesRef.current.delete(targetClientId);
    }
  }, []);

  return (
    <>
    <ChatCtx.Provider
      value={{
        messages,
        input,
        setInput,
        send,
        canSend,
        isLoading,
        typing,
        setTyping,
        bottomRef,
        onKeyDown,
        sendMessage,
        results,
        threadId,
        pushAssistantMessage,
        connectionStatus,
        setConnectionStatus,
        wsCorrelationId,
        handleAssistantError,
      }}
    >
      {children}
    </ChatCtx.Provider>
    <AuthExpiredModal open={authExpired} onClose={() => setAuthExpired(false)} />
    </>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
