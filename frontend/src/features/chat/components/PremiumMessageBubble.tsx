import React from 'react';
import { motion } from 'framer-motion';

interface PremiumMessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    ts?: number;
  };
  isLast?: boolean;
}

const PremiumMessageBubble: React.FC<PremiumMessageBubbleProps> = ({ message, isLast }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
        delay: isLast ? 0.1 : 0
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Premium User Message */}
        {isUser && (
          <motion.div
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-2xl shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium leading-relaxed">{message.content}</p>
            {message.ts && (
              <div className="text-xs text-white/70 mt-2">
                {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </motion.div>
        )}
        
        {/* Premium Assistant Message */}
        {!isUser && (
          <motion.div
            className="bg-white/90 backdrop-blur-sm border border-gray-200 px-6 py-4 rounded-2xl shadow-lg"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              {/* Premium Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              
              <div className="flex-1">
                <p className="text-gray-800 text-sm leading-relaxed">{message.content}</p>
                {message.ts && (
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface PremiumChatThreadProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    ts?: number;
  }>;
}

const PremiumChatThread: React.FC<PremiumChatThreadProps> = ({ messages }) => {
  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <PremiumMessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
      
      {/* Welcome message when no messages */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hello! How can I help you?</h3>
          <p className="text-gray-600">Ask me about properties, experiences, or anything about North Cyprus</p>
        </motion.div>
      )}
    </div>
  );
};

export { PremiumMessageBubble, PremiumChatThread };