/**
 * BentoGrid - Asymmetric responsive grid layout
 * Featured items are larger, standard items are smaller
 * HIMS-inspired bento box layout
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface BentoGridItem {
  id: string;
  featured?: boolean;
  content: React.ReactNode;
}

export interface BentoGridProps {
  items: BentoGridItem[];
  className?: string;
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ items, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Responsive grid with auto-flow
          'grid gap-4 md:gap-6',
          // Mobile: 1 column
          'grid-cols-1',
          // Tablet: 2 columns
          'md:grid-cols-2',
          // Desktop: 4 columns for more flexibility
          'lg:grid-cols-4',

          className
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              // Base styles
              'animate-fade-in-up',

              // Featured items span more columns
              item.featured && [
                // On tablet and up, featured items span 2 columns
                'md:col-span-2',
                // On desktop, large featured items span 2x2
                'lg:col-span-2 lg:row-span-2',
              ],

              // Standard items
              !item.featured && [
                'col-span-1',
              ]
            )}
          >
            {item.content}
          </div>
        ))}
      </div>
    );
  }
);

BentoGrid.displayName = 'BentoGrid';

export { BentoGrid };
export default BentoGrid;
