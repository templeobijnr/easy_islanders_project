/**
 * ExploreSpotlight - Horizontal scrollable carousel for featured listings
 * Glass morphism design, fits whole screen
 */

import React, { useRef } from 'react';
import { Listing } from '../types';
import { formatPrice, getPlaceholderImage } from '../constants';

interface ExploreSpotlightProps {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

const ExploreSpotlight: React.FC<ExploreSpotlightProps> = ({
  listings,
  onListingClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full backdrop-blur-sm bg-white/50 rounded-3xl border border-white/60 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-3xl">⭐</span>
          Featured Listings
        </h2>

        {/* Navigation buttons */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-xl backdrop-blur-sm bg-white/70 text-slate-700 hover:bg-white hover:text-lime-600 transition-all shadow-lg border border-white/60"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-xl backdrop-blur-sm bg-white/70 text-slate-700 hover:bg-white hover:text-lime-600 transition-all shadow-lg border border-white/60"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {listings.map((listing) => {
          const imageUrl =
            listing.images && listing.images.length > 0
              ? listing.images[0].image
              : getPlaceholderImage(listing.category.slug, parseInt(listing.id.slice(-2), 16));

          return (
            <div
              key={listing.id}
              className="flex-shrink-0 w-full md:w-[500px] lg:w-[600px] backdrop-blur-sm bg-gradient-to-r from-lime-200/40 via-emerald-200/40 to-sky-200/40 rounded-2xl border border-white overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => onListingClick && onListingClick(listing)}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Featured badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-lime-600 text-white text-xs font-bold shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Featured
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between backdrop-blur-sm bg-white/60">
                  <div className="space-y-3">
                    {/* Category */}
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/70 text-slate-700 text-xs font-semibold border border-white/60">
                      {listing.category.name}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 line-clamp-2">
                      {listing.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Location & Subcategory */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {listing.location && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 text-slate-700 font-semibold">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {listing.location}
                        </div>
                      )}
                      {listing.subcategory && (
                        <div className="px-2 py-1 rounded-lg bg-white/60 text-slate-700 font-semibold">
                          {listing.subcategory.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-lime-600">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      {listing.transaction_type === 'rent_short' && (
                        <span className="text-xs text-slate-600">/night</span>
                      )}
                      {listing.transaction_type === 'rent_long' && (
                        <span className="text-xs text-slate-600">/month</span>
                      )}
                    </div>

                    <button className="px-6 py-3 rounded-xl bg-lime-600 text-white font-bold hover:bg-lime-700 transition-all shadow-lg hover:shadow-xl">
                      View →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExploreSpotlight;
