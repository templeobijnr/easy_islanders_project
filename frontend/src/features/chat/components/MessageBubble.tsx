import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  role: 'user' | 'agent';
  text: string;
  typing?: boolean;
}

export const MessageBubble: React.FC<Props> = ({ role, text, typing }) => {
  const isAgent = role === 'agent';

  return (
    <motion.div
      className={`w-full flex ${isAgent ? 'justify-start' : 'justify-end'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div
        className={`max-w-[85%] text-sm p-3 rounded-2xl shadow-sm ${
          isAgent
            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {typing ? (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:-0.2s]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
            <span className="text-slate-500 dark:text-slate-400 ml-2">Thinking…</span>
          </span>
        ) : (
          text
        )}
      </motion.div>
    </motion.div>
  );
};