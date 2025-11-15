import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence as FMAnimatePresence } from 'framer-motion';
import { MotionDiv } from '../../../components/ui/motion-wrapper';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;
import type { ChatMessage } from "../types";
import { BubbleAgent } from "../../../shared/components";
import TypingDots from "./TypingDots";
import { Message } from "../../../shared/types";

export function ChatThread({ messages }: { messages: ChatMessage[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 32;
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isAtBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isAtBottom]);

  function convertToMessage(msg: ChatMessage): Message {
    return {
      id: msg.id,
      role: msg.role === 'assistant' ? 'agent' : msg.role,
      text: msg.content || '',
      ts: msg.ts || Date.now(),
    };
  }

  const convertedMessages = messages.map(convertToMessage);
  const isTyping = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content;

  const AnimatePresence = FMAnimatePresence as any;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-3 px-4 pt-2 max-h-[58vh] md:max-h-[60vh]"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.04 }}
      >
        <AnimatePresence>
          {convertedMessages.map((m) => (
            <MotionDiv
              key={m.id}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "agent" ? (
                <div className="group relative">
                  <BubbleAgent>{m.text}</BubbleAgent>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-1 left-3 text-[10px] text-slate-400">
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : m.role === "system" ? (
                <div className="text-[11px] text-slate-500 text-center my-2">
                  {m.text}
                </div>
              ) : (
                <div className="group relative ml-auto">
                  <div className="max-w-[80%] md:max-w-[70%] text-sm p-3 rounded-2xl bg-lime-100 text-slate-900 rounded-br-none focus-within:ring-1 focus-within:ring-lime-200/60">
                    {m.text}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-1 right-3 text-[10px] text-slate-400">
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </MotionDiv>
          ))}
        </AnimatePresence>
        {isTyping && (
          <MotionDiv
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-start"
          >
            <TypingDots />
          </MotionDiv>
        )}
      </MotionDiv>
      <div className="h-2" />
    </div>
  );
}