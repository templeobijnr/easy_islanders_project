import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default',
  hover = true,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-xl border transition-all duration-200';

  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-lg',
    outlined: 'bg-transparent border-gray-300',
    filled: 'bg-gray-50 border-gray-200',
  };

  const motionVariants = {
    idle: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: hover ? { y: -2, boxShadow: '0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)' } : {},
  };

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      variants={motionVariants}
      initial="idle"
      whileHover="hover"
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;