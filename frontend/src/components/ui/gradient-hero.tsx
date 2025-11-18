/**
 * GradientHero - Animated gradient background for hero sections
 * HIMS-inspired warm gradient (peach → rose → yellow)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface GradientHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  colors?: string[];
  children: React.ReactNode;
}

const GradientHero = React.forwardRef<HTMLDivElement, GradientHeroProps>(
  ({ colors, className, children, ...props }, ref) => {
    // Use custom colors or default warm gradient
    const gradientStyle = colors
      ? {
          background: `linear-gradient(135deg, ${colors.join(', ')})`,
          backgroundSize: '400% 400%',
        }
      : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          // Base gradient from theme.css
          !colors && 'hero-gradient',

          // Common styles
          'relative overflow-hidden',

          className
        )}
        style={gradientStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GradientHero.displayName = 'GradientHero';

export { GradientHero };
export default GradientHero;
