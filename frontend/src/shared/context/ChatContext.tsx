import React, { createContext, useContext, useState, useMemo, useRef, useEffect } from 'react';
import type { Message, Role } from '../types';
import config from '../../config';

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
}

const ChatCtx = createContext<ChatState | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', role: 'agent', text: "Hi! Tell me what you need and I'll build a shortlist you can approve.", ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typing, setTyping] = useState(false);

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
    const optimisticUser: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setIsLoading(true);

    try {
      // Call the real API
      const response = await fetch(`${config.API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('access_token') || ''}`,
        },
        body: JSON.stringify({
          message: text,
          language: 'en',
          conversation_id: `conv-${Date.now()}`,
          thread_id: localStorage.getItem('threadId') || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: 'agent',
        text: data.response || data.message || 'Got it. I\'ll search options that match.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);

      // Store thread_id if provided
      if (data.thread_id) {
        localStorage.setItem('threadId', data.thread_id);
      }
    } catch (e) {
      const err: Message = {
        id: `err-${Date.now()}`,
        role: 'agent',
        text: 'Hmm, something went wrong. Please try again.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, err]);
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
        bottomRef,
        onKeyDown,
        sendMessage,
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