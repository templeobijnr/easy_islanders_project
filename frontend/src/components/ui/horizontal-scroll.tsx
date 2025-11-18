/**
 * HorizontalScroll - Horizontal scroll container with snap behavior
 * Optional fade edges and arrow navigation
 * Perfect for recommendation carousels
 */

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HorizontalScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  itemWidth?: number;
  showArrows?: boolean;
  children: React.ReactNode;
}

const HorizontalScroll = React.forwardRef<HTMLDivElement, HorizontalScrollProps>(
  ({ itemWidth, showArrows = true, className, children, ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
      const container = scrollRef.current;
      if (!container) return;

      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    const scroll = (direction: 'left' | 'right') => {
      const container = scrollRef.current;
      if (!container) return;

      const scrollAmount = itemWidth || container.clientWidth * 0.8;
      const targetScroll =
        direction === 'left'
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    };

    return (
      <div className={cn('relative group', className)} ref={ref}>
        {/* Left arrow */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-[hsl(var(--sand-200))] hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-[hsl(var(--sand-700))]" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={cn(
            'flex gap-4 overflow-x-auto snap-x snap-mandatory',
            'scrollbar-hide', // Hide scrollbar
            'pb-2' // Padding for shadows
          )}
          {...props}
        >
          {children}
        </div>

        {/* Right arrow */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-[hsl(var(--sand-200))] hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-[hsl(var(--sand-700))]" />
          </button>
        )}

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    );
  }
);

HorizontalScroll.displayName = 'HorizontalScroll';

export { HorizontalScroll };
export default HorizontalScroll;
