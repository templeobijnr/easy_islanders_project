import React from 'react';
import { motion } from 'framer-motion';
import { User, MessageCircle } from '@/shared/icons';

interface ChatMessageProps {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

const ChatMessage = ({ content, sender, timestamp, isTyping = false }: ChatMessageProps) => {
  const isUser = sender === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
            : 'bg-white/10 backdrop-blur-md border border-white/20'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <MessageCircle className="w-4 h-4 text-slate-600" />
          )}
        </div>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              : 'bg-white/10 backdrop-blur-md text-slate-900 border border-white/20'
          }`}
        >
          {isTyping ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{content}</p>
          )}
          <span className="text-xs opacity-70 mt-2 block">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;