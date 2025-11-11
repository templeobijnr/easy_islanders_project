import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  // Only show when not connected (reduce noise)
  if (status === 'connected') {
    return null;
  }

  const statusConfig = {
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      icon: '🔄',
    },
    disconnected: {
      color: 'bg-orange-500',
      text: 'Disconnected',
      icon: '⚠️',
    },
    error: {
      color: 'bg-red-500',
      text: 'Connection Error',
      icon: '❌',
    },
  }[status] || {
    color: 'bg-gray-500',
    text: 'Unknown',
    icon: '❓',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-xs"
      >
        <motion.div
          className={`w-2 h-2 rounded-full ${statusConfig.color}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-slate-700 font-medium">{statusConfig.text}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConnectionStatus;
