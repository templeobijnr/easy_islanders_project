import React from 'react';
import { motion } from 'framer-motion';
import { getMotionProps, cardHover } from '../motion/variants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, className = '', onClick }: CardProps) => {
  const baseClasses = 'bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-soft p-6 focus-visible:ring-2 focus-visible:ring-brand-500';

  const motionProps = getMotionProps(cardHover, "rest", undefined, "hover", undefined);

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      {...motionProps}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </motion.div>
  );
};

export default Card;