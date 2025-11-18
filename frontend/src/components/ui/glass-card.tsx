/**
 * GlassCard - Glass morphism card component
 * HIMS-inspired design with backdrop blur and elevation
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  hoverable?: boolean;
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', hoverable = false, className, children, ...props }, ref) => {
    // Variant styles
    const variants = {
      default: 'glass-card',
      bordered: 'glass-card border-2 border-[hsl(var(--sand-300))]',
      elevated: 'glass-card shadow-[var(--shadow-card-hover)]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base glass morphism styles (from theme.css)
          variants[variant],

          // Hoverable state
          hoverable && 'hover:translate-y-[-4px] hover:shadow-[var(--shadow-card-hover)] cursor-pointer',

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
export default GlassCard;
