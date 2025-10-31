import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from '@/shared/icons';
import IconButton from '@/shared/components';

interface ComposerProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Composer = ({ onSendMessage, placeholder = "Type your message...", disabled = false }: ComposerProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-200/50 px-6 py-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <label htmlFor="composer-textarea" className="sr-only">Message input</label>
          <textarea
            id="composer-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-transparent disabled:opacity-50"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            aria-describedby="composer-helper-text"
          />
          <div id="composer-helper-text" className="sr-only">Press Enter to send, Shift+Enter for new line</div>
        </div>
        <IconButton
          disabled={!message.trim() || disabled}
          children={<Send className="w-5 h-5" />}
        />
      </form>
    </motion.div>
  );
};

export default Composer;