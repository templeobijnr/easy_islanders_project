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
        group cursor-pointer
        ${compact ? 'w-64' : 'w-full'}
      `}
      onClick={handleClick}
    >
      {/* Airbnb-style clean card */}
      <div className="relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Image Container - Airbnb aspect ratio */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Favorite heart button - Airbnb style */}
          <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg
              className="w-6 h-6 fill-none stroke-white stroke-2 hover:fill-white/20"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>

          {/* Featured badge - subtle */}
          {listing.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background text-foreground text-xs font-semibold shadow-sm">
                Guest favorite
              </span>
            </div>
          )}

          {/* Category badge - bottom left, subtle */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm text-muted-foreground text-xs font-medium">
              {listing.category.name}
            </span>
          </div>
        </div>

        {/* Info section - lean by default, richer on hover */}
        <div className="space-y-2 px-3 pb-4 pt-3">
          {/* Location */}
          {listing.location && (
            <p className="text-xs font-medium text-muted-foreground truncate">
              {listing.location}
            </p>
          )}

          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
            {listing.title}
          </h3>

          {/* Hover-only extra details: description + key features */}
          {(features.length > 0 || (listing.description && !compact)) && (
            <div className="space-y-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!compact && listing.description && (
                <p className="line-clamp-2 leading-relaxed">
                  {listing.description}
                </p>
              )}

              {features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {features.slice(0, 3).map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-neutral-50 border border-neutral-200"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price + meta */}
          <div className="flex items-baseline justify-between pt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-foreground">
                {formatPrice(listing.price, listing.currency)}
              </span>
              {(listing.transaction_type === 'rent_short' || listing.transaction_type === 'rent_long') && (
                <span className="text-xs font-normal text-muted-foreground">
                  {listing.transaction_type === 'rent_short' ? '/night' : '/month'}
                </span>
              )}
            </div>

            {listing.subcategory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-50 text-muted-foreground text-xs">
                {listing.subcategory.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
