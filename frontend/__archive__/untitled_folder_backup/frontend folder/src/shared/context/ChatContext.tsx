import React, { createContext, useContext, useState } from 'react';
import type { Message, Role } from '../types';

interface ChatState {
  messages: Message[];
  typing: boolean;
  send: (text: string, role?: Role) => void;
  setTyping: (v: boolean) => void;
}

const ChatCtx = createContext<ChatState | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm0', role: 'agent', text: 'Hi! Tell me what you need and I’ll build a shortlist you can approve.', ts: Date.now() },
  ]);
  const [typing, setTyping] = useState(false);

  const send = (text: string, role: Role = 'user') => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text, ts: Date.now() }]);
  };

  return <ChatCtx.Provider value={{ messages, typing, setTyping, send }}>{children}</ChatCtx.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};