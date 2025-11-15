/**
 * ListingCard - Premium card design for listings
 * Desktop-first, responsive, with image, price, features, and CTA
 */

import React from 'react';
import { Listing } from '../types';
import { formatPrice, extractFeatures, getPlaceholderImage } from '../constants';

interface ListingCardProps {
  listing: Listing;
  onClick?: (listing: Listing) => void;
  compact?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, compact = false }) => {
  // Get image URL (use first image or placeholder)
  const imageUrl =
    listing.images && listing.images.length > 0
      ? listing.images[0].image
      : getPlaceholderImage(listing.category.slug, parseInt(listing.id.slice(-2), 16));

  // Extract features from dynamic fields
  const features = extractFeatures(listing);

  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick(listing);
    }
  };

  return (
    <div
      className={`
        group relative backdrop-blur-sm bg-white/80 rounded-3xl border border-white/60 overflow-hidden
        transition-all duration-300 cursor-pointer shadow-lg
        hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 hover:bg-white/95 hover:border-lime-600/40
        ${compact ? 'w-64' : 'w-full'}
      `}
      onClick={handleClick}
    >
      {/* Image with gradient overlay */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Featured badge */}
        {listing.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold shadow-lg">
              ⭐ Featured
            </span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-medium shadow-md">
            {listing.category.name}
          </span>
        </div>

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-base md:text-lg line-clamp-2 drop-shadow-lg">
            {listing.title}
          </h3>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 md:p-5 space-y-3">
        {/* Price and location */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-bold text-lime-600">
              {formatPrice(listing.price, listing.currency)}
            </span>
            {listing.transaction_type === 'rent_short' && (
              <span className="text-xs text-slate-500">/night</span>
            )}
            {listing.transaction_type === 'rent_long' && (
              <span className="text-xs text-slate-500">/month</span>
            )}
          </div>

          {listing.location && (
            <div className="flex items-center gap-1 text-slate-600 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              <span className="font-medium">{listing.location}</span>
            </div>
          )}
        </div>

        {/* Description (truncated) */}
        {!compact && (
          <p className="text-sm text-slate-600 line-clamp-2">{listing.description}</p>
        )}

        {/* Features/Amenities */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-xl backdrop-blur-sm bg-white/70 text-slate-700 text-xs font-semibold border border-white/60 shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Subcategory tag */}
        {listing.subcategory && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">{listing.subcategory.name}</span>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl backdrop-blur-sm bg-lime-600/10 text-lime-600 font-bold text-sm hover:bg-lime-600 hover:text-white transition-all duration-300 border border-lime-600/30 hover:border-lime-600 shadow-md hover:shadow-xl">
            View Details
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
