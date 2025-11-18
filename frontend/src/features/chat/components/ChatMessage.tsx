import React from 'react';
import { MotionDiv } from '../../../components/ui/motion-wrapper';
import { User, MessageCircle } from '../../../shared/icons';

interface ChatMessageProps {
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

const ChatMessage = ({ content, sender, timestamp, isTyping = false }: ChatMessageProps) => {
  const isUser = sender === 'user';

  return (
    <MotionDiv
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div
          className={`w-8 h-8 rounded-2xl flex items-center justify-center ${
            isUser
              ? 'bg-primary-500 text-primary-foreground'
              : 'bg-card text-foreground border border-border'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary-500 text-primary-foreground'
              : 'bg-card text-foreground border border-border'
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
          <span className="text-xs text-muted-foreground mt-2 block">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </MotionDiv>
  );
};

export default ChatMessage;
