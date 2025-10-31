import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const Chip = ({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';

  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const motionVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <motion.span
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      variants={motionVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
      {removable && (
        <motion.button
          onClick={onRemove}
          className="ml-1.5 hover:bg-black/10 rounded-full p-0.5"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}
    </motion.span>
  );
};

export default Chip;