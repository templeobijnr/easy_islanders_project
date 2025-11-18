/**
 * CategoryPill - Category chip/pill button
 * Used for category navigation with active states
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface CategoryPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: string | React.ReactNode;
  active?: boolean;
}

const CategoryPill = React.forwardRef<HTMLButtonElement, CategoryPillProps>(
  ({ label, icon, active = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center gap-2',
          'px-4 py-2',
          'rounded-[20px]',
          'font-medium text-sm font-[family:var(--font-body)]',
          'transition-all duration-200',
          'border',
          'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2',

          // Default state
          !active && [
            'bg-white',
            'text-sand-700',
            'border-sand-200',
            'hover:border-ocean-500',
            'hover:bg-ocean-50',
            'hover:text-ocean-600',
          ],

          // Active state
          active && [
            'bg-ocean-500',
            'text-white',
            'border-ocean-500',
            'shadow-sm',
          ],

          // Hover scale
          'hover:scale-[1.02]',
          'active:scale-[0.98]',

          className
        )}
        {...props}
      >
        {typeof icon === 'string' ? (
          <span className="text-base">{icon}</span>
        ) : (
          icon
        )}
        <span>{label}</span>
      </button>
    );
  }
);

CategoryPill.displayName = 'CategoryPill';

export { CategoryPill };
export default CategoryPill;
