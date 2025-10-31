import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listStagger } from '@/shared/motion/variants';
import { scrollToBottom } from '@/shared/utils/scroll';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatThreadProps {
  messages: Message[];
  className?: string;
}

const ChatThread = ({ messages, className = '' }: ChatThreadProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom(messagesEndRef.current!);
  }, [messages]);

  // TODO: Implement virtualization for long chat threads if performance becomes an issue
  // Consider using react-window or react-virtualized for rendering only visible messages

  return (
    <motion.div
      className={`flex-1 overflow-y-auto px-6 py-4 space-y-4 ${className}`}
      variants={listStagger}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white/10 backdrop-blur-md text-slate-900 border border-white/20'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </motion.div>
  );
};

export default ChatThread;