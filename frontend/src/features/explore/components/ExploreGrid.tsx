/**
 * ExploreGrid - Responsive grid of listing cards
 * Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column
 */

import React from 'react';
import { Listing } from '../types';
import ListingCard from './ListingCard';

interface ExploreGridProps {
  listings: Listing[];
  loading?: boolean;
  onListingClick?: (listing: Listing) => void;
  emptyMessage?: string;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({
  listings,
  loading = false,
  onListingClick,
  emptyMessage = 'No listings found',
}) => {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
          >
            <div className="h-56 bg-slate-200" />
            <div className="p-5 space-y-3">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded w-16" />
                <div className="h-6 bg-slate-200 rounded w-16" />
                <div className="h-6 bg-slate-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24">
        <div className="text-6xl md:text-8xl mb-4">🔍</div>
        <h3 className="text-xl md:text-2xl font-semibold text-slate-700 mb-2">{emptyMessage}</h3>
        <p className="text-slate-500 text-center max-w-md">
          Try adjusting your filters or check back later for new listings.
        </p>
      </div>
    );
  }

  // Grid of listings
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} onClick={onListingClick} />
      ))}
    </div>
  );
};

export default ExploreGrid;
