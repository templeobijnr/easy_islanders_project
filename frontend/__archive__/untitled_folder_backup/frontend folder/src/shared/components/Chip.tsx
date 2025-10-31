import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../motion/variants';

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'default' | 'filled';
}

const Chip = ({ children, onRemove, variant = 'default' }: ChipProps) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20 shadow-soft';
  const variantClasses = {
    default: 'text-slate-700',
    filled: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent',
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]}`}
      variants={fadeInUp}
      initial="hidden"
      animate="show"
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 text-current hover:text-red-500 transition-colors"
        >
          ×
        </button>
      )}
    </motion.div>
  );
};

export default Chip;