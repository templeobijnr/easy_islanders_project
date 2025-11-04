import React, { createContext, useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Message, Role } from '../types';
import config from '../../config';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

type AssistantFrame = {
  type: 'chat_message';
  event: 'assistant_message';
  thread_id: string;
  payload: {
    text: string;
    rich?: Record<string, unknown>;
  };
  meta: Record<string, any> & { in_reply_to: string };
};

interface ChatState {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  send: () => void;
  canSend: boolean;
  isLoading: boolean;
  typing: boolean;
  setTyping: (v: boolean) => void;
  results: any[];
  bottomRef: React.RefObject<HTMLDivElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: (text: string, role?: Role) => void;

  // Realtime additions expected by ChatPage
  threadId: string | null;
  setConnectionStatus: (s: ConnectionStatus) => void;
  pushAssistantMessage: (frame: AssistantFrame) => void;
  wsCorrelationId: string | null;
  handleAssistantError: (data: any) => void;

  // Dev HUD (debug-only) fields
  dev_lastMemoryTrace: any | null;
  dev_lastCorrelationId: string | null;
}

const ChatCtx = createContext<ChatState | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', role: 'agent', text: "Hi! Tell me what you need and I'll build a shortlist you can approve.", ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [results] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatusState] = useState<ConnectionStatus>('disconnected');
  const [threadId, setThreadId] = useState<string | null>(() => localStorage.getItem('threadId'));
  const [wsCorrelationId] = useState<string | null>(null);
  const [lastMemoryTrace, setLastMemoryTrace] = useState<any | null>(null);
  const [lastCorrelationId, setLastCorrelationId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingTraceRef = useRef<any | null>(null);
  const pendingCorrRef = useRef<string | null>(null);

  const connectionStatusRef = useRef<ConnectionStatus>(connectionStatus);
  const pendingRepliesRef = useRef<Set<string>>(new Set());
  const handledRepliesRef = useRef<Set<string>>(new Set());
  const fallbackRepliesRef = useRef<Map<string, string>>(new Map());

  // keeps an always-up-to-date bottom ref for smooth autoscroll
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  const canSend = useMemo(() => !!input.trim() && !isLoading, [input, isLoading]);

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatusState(status);
    connectionStatusRef.current = status;
  }, []);

  const markPendingResolved = useCallback((clientId: string) => {
    if (!clientId) return;
    pendingRepliesRef.current.delete(clientId);
    setMessages((prev) => prev.map((m) => (m.id === clientId ? { ...m, pending: false } : m)));
  }, []);

  const sendMessage = (text: string, role: Role = 'user') => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text, ts: Date.now() }]);
  };

  const pushAssistantMessage = useCallback((frame: AssistantFrame) => {
    if (!frame || frame.type !== 'chat_message' || frame.event !== 'assistant_message') return;
    const inReplyTo = frame.meta?.in_reply_to;
    if (!inReplyTo) return;

    // Capture latest memory trace + correlation for Dev HUD
    try {
      const mem = (frame as any)?.meta?.traces?.memory ?? null;
      const corr = (frame as any)?.meta?.correlation_id ?? null;
      if (mem && typeof mem === 'object') pendingTraceRef.current = mem;
      if (corr) pendingCorrRef.current = corr;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingTraceRef.current) setLastMemoryTrace(pendingTraceRef.current);
          if (pendingCorrRef.current) setLastCorrelationId(pendingCorrRef.current);
          pendingTraceRef.current = null;
          pendingCorrRef.current = null;
          rafRef.current = null;
        });
      }
    } catch (e) {
      // best-effort only
    }

    const fallbackId = fallbackRepliesRef.current.get(inReplyTo);
    const text = typeof frame.payload?.text === 'string' ? frame.payload.text : '';
    const ts = Date.now();

    if (fallbackId) {
      setMessages((prev) => prev.map((m) => (
        m.id === fallbackId
          ? { ...m, text, ts, pending: false, inReplyTo }
          : m
      )));
      fallbackRepliesRef.current.delete(inReplyTo);
      handledRepliesRef.current.add(inReplyTo);
    } else {
      if (handledRepliesRef.current.has(inReplyTo)) {
        return;
      }
      handledRepliesRef.current.add(inReplyTo);
      const assistantMessage: Message = {
        id: typeof frame.meta?.queued_message_id === 'string' && frame.meta.queued_message_id
          ? frame.meta.queued_message_id
          : `a-${ts}`,
        role: 'agent',
        text,
        ts,
        inReplyTo,
        pending: false,
      };
    setMessages((prev) => [...prev, assistantMessage]);
    }

    markPendingResolved(inReplyTo);
  }, [markPendingResolved]);

  const handleAssistantError = useCallback((data: any) => {
    const inReplyTo: string | undefined = data?.message?.in_reply_to || data?.meta?.in_reply_to;
    const text = data?.error || data?.message || 'There was an error handling your request.';
    const ts = Date.now();

    if (inReplyTo) {
      const fallbackId = fallbackRepliesRef.current.get(inReplyTo);
      handledRepliesRef.current.add(inReplyTo);
      markPendingResolved(inReplyTo);
      if (fallbackId) {
        setMessages((prev) => prev.map((m) => (
          m.id === fallbackId
            ? { ...m, text, ts, role: 'system', pending: false, inReplyTo }
            : m
        )));
        fallbackRepliesRef.current.delete(inReplyTo);
        return;
      }
    }

    setMessages((prev) => [...prev, {
      id: `err-${ts}`,
      role: 'system',
      text,
      ts,
      inReplyTo,
    }]);
  }, [markPendingResolved]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const clientMsgId = crypto.randomUUID();
    const timestamp = Date.now();

    const optimisticUser: Message = {
      id: clientMsgId,
      role: 'user',
      text,
      ts: timestamp,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticUser]);
    pendingRepliesRef.current.add(clientMsgId);
    setIsLoading(true);

    const authToken = localStorage.getItem('token') || localStorage.getItem('access_token') || '';

    const requestBody = {
      message: text,
      language: 'en',
      conversation_id: `conv-${timestamp}`,
      thread_id: threadId || null,
      client_msg_id: clientMsgId,
    };

    const shouldUseHttpFallback = async () => {
      const wsEnabled = config.WEBSOCKET?.ENABLED !== false;
      if (!wsEnabled) return true;
      const status = connectionStatusRef.current;
      // Only use HTTP fallback when WS is disabled or not healthy
      return status === 'error' || status === 'disconnected';
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${config.API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.thread_id) {
        localStorage.setItem('threadId', data.thread_id);
        setThreadId(data.thread_id);
      }

      if (await shouldUseHttpFallback()) {
        const replyText = data.response || data.message || "Got it. I'll search options that match.";
        const fallbackMessageId = `a-${Date.now()}`;
        handledRepliesRef.current.add(clientMsgId);
        fallbackRepliesRef.current.set(clientMsgId, fallbackMessageId);
        markPendingResolved(clientMsgId);
        setMessages((prev) => [
          ...prev,
          {
            id: fallbackMessageId,
            role: 'agent',
            text: replyText,
            ts: Date.now(),
            inReplyTo: clientMsgId,
            pending: false,
          },
        ]);
      }

    } catch (e) {
      pendingRepliesRef.current.delete(clientMsgId);
      const errorTs = Date.now();
      setMessages((prev) => {
        const updated = prev.map((m) => (m.id === clientMsgId ? { ...m, pending: false } : m));
        return [
          ...updated,
          {
            id: `err-${errorTs}`,
            role: 'agent',
            text: 'Hmm, something went wrong. Please try again.',
            ts: errorTs,
            inReplyTo: clientMsgId,
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
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
        results,
        bottomRef,
        onKeyDown,
        sendMessage,
        // realtime additions
        threadId,
        setConnectionStatus,
        pushAssistantMessage,
        wsCorrelationId,
        handleAssistantError,
        // dev hud
        dev_lastMemoryTrace: lastMemoryTrace,
        dev_lastCorrelationId: lastCorrelationId,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
