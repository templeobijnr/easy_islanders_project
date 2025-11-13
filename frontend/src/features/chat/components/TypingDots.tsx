import React from 'react';
import { motion } from 'framer-motion';

const TypingDots: React.FC = () => {
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
    <div className="bg-slate-100 text-slate-800 max-w-[80%] md:max-w-[70%] p-3 rounded-2xl">
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((index) => (
          <div key={index} className="w-2 h-2 bg-slate-400 rounded-full">
            <motion.div
              variants={dotVariants}
              animate="animate"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-600 ml-1">Thinking...</span>
    </div>
  );
};

export default TypingDots;