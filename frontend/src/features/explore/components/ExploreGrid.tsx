/**
 * ExploreGrid - Responsive grid of listing cards
 * Desktop: 4-5 columns, Tablet: 3 columns, Mobile: 1-2 columns
 * Airbnb-style layout with more cards per row
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
  // Empty state
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24">
        <div className="text-6xl md:text-8xl mb-4">🔍</div>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Try adjusting your filters or check back later for new listings.
        </p>
      </div>
    );
  }

  // Grid of listings - Airbnb style with more columns
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} onClick={onListingClick} />
      ))}
    </div>
  );
};

export default ExploreGrid;
