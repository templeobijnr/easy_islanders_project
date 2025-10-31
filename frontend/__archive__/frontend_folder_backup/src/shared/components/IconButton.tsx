import React from 'react';
import { motion } from 'framer-motion';
import { getMotionProps } from '../motion/variants';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const IconButton = ({
  children,
  onClick,
  disabled = false,
  size = 'md'
}: IconButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-soft hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const motionProps = getMotionProps({}, undefined, undefined, { scale: 1.05 }, { scale: 0.95 });

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]}`}
      onClick={onClick}
      disabled={disabled}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
};

export default IconButton;