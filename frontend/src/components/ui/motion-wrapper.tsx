import React from 'react';
import { motion, MotionProps } from 'framer-motion';

// TypeScript-safe motion div wrapper
interface MotionDivProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  [key: string]: any;
}

export const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, className, ...motionProps }, ref) => {
    const Component = motion.div as any;
    return (
      <Component ref={ref} className={className} {...motionProps}>
        {children}
      </Component>
    );
  }
);

MotionDiv.displayName = 'MotionDiv';

// TypeScript-safe motion span wrapper
interface MotionSpanProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const MotionSpan = React.forwardRef<HTMLSpanElement, MotionSpanProps>(
  ({ children, className, ...motionProps }, ref) => {
    const Component = motion.span as any;
    return (
      <Component ref={ref} className={className} {...motionProps}>
        {children}
      </Component>
    );
  }
);

MotionSpan.displayName = 'MotionSpan';

// TypeScript-safe motion button wrapper
interface MotionButtonProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  [key: string]: any;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, onClick, ...motionProps }, ref) => {
    const Component = motion.button as any;
    return (
      <Component ref={ref} className={className} onClick={onClick} {...motionProps}>
        {children}
      </Component>
    );
  }
);

MotionButton.displayName = 'MotionButton';
