/**
 * HorizontalLane - Scrollable horizontal row of listing cards
 * Used for Trending, Recently Added, Gems, Deals sections
 */

import React, { useRef } from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';

interface HorizontalLaneProps {
  title: string;
  emoji?: string;
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
  onViewAll?: () => void;
}

const HorizontalLane: React.FC<HorizontalLaneProps> = ({
  title,
  emoji,
  listings,
  onListingClick,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-2xl md:text-3xl">{emoji}</span>}
          <h3 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h3>
          <span className="text-sm text-slate-500 ml-2">({listings.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll buttons (desktop only) */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-lime-600 transition-all"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-lime-600 transition-all"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View All button */}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors flex items-center gap-1"
            >
              View All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="flex-shrink-0 w-72 md:w-80">
            <ListingCard listing={listing} onClick={onListingClick} compact />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalLane;
