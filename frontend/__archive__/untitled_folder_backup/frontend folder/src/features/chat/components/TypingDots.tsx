import React from 'react';
import { motion } from 'framer-motion';

const TypingDots = () => {
  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-xs" aria-live="polite">
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-slate-400 rounded-full"
            variants={dotVariants}
            animate="animate"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-600 ml-2">Typing...</span>
    </div>
  );
};

export default TypingDots;