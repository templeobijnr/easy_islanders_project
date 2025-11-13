import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../motion/variants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20 shadow-soft';
  const variantClasses = {
    default: 'text-slate-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      <motion.span
        variants={fadeInUp}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.span>
    </span>
  );
};

export default Badge;