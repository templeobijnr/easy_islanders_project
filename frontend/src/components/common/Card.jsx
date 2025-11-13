import React from 'react';
import { motion } from 'framer-motion';

/**
 * @deprecated This component is deprecated. Use @/components/ui/card instead.
 *
 * Migration guide:
 * - Import Card, CardHeader, CardTitle, CardContent, CardFooter from @/components/ui/card
 * - Replace variant="default" with standard Card component
 * - Replace variant="elevated" with Card + className="shadow-lg"
 * - Use semantic theme colors (bg-card, text-card-foreground) instead of hardcoded colors
 *
 * Example:
 * Old: <Card variant="elevated"><div>Content</div></Card>
 * New: <Card><CardContent>Content</CardContent></Card>
 */
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

  React.useEffect(() => {
    console.warn('Card from components/common/Card.jsx is deprecated. Please use @/components/ui/card instead.');
  }, []);

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
