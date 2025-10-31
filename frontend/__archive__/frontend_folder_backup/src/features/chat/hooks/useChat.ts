import React, { useState, useCallback } from 'react';
import { postChat, ChatRequest, ChatResponse, Recommendation } from '../api';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  recommendations?: Recommendation[];
}

export interface UseChatReturn {
  messages: Message[];
  threadId: string | null;
  isTyping: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with welcome message
  React.useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: "Hello! I'm your AI assistant for Cyprus real estate. How can I help you today?",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setError(null);

    // Create optimistic user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: text,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const request: ChatRequest = {
        message: text,
        thread_id: threadId || undefined,
      };

      const response: ChatResponse = await postChat(request);

      // Update thread ID if provided
      if (response.thread_id) {
        setThreadId(response.thread_id);
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.response,
        sender: 'assistant',
        timestamp: new Date(),
        recommendations: response.recommendations,
      };

      // Replace optimistic message with real response
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');

      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }, [threadId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    threadId,
    isTyping,
    error,
    sendMessage,
    clearError,
  };
};