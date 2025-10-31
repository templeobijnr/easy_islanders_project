import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

const ChatMessage = ({
  message,
  isUser = false,
  showAvatar = true,
  className = '',
  ...props
}) => {
  const motionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      variants={motionVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3 }}
      {...props}
    >
      {!isUser && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isUser
          ? 'bg-blue-600 text-white rounded-br-md'
          : 'bg-gray-100 text-gray-800 rounded-bl-md'
      }`}>
        <p className="text-sm leading-relaxed">{message}</p>
      </div>

      {isUser && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;