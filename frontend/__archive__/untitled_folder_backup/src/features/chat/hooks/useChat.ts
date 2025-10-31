import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import config from "../../../config";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Hi! I can help you find stays, activities, or create a full itinerary. What are you planning?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // keeps an always-up-to-date bottom ref for smooth autoscroll
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const canSend = useMemo(() => !!input.trim() && !isLoading, [input, isLoading]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const optimisticUser: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
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
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.response || data.message || "Got it. I'll search options that match.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);

      // Store thread_id if provided
      if (data.thread_id) {
        localStorage.setItem('threadId', data.thread_id);
      }
    } catch (e) {
      const err: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Hmm, something went wrong. Please try again.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, err]);
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return { messages, input, setInput, send, canSend, isLoading, bottomRef, onKeyDown };
}