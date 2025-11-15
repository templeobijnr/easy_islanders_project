/**
 * Generic listing card that renders category-specific components
 * Premium version with Framer Motion animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Listing } from '../../../types/schema';
import RealEstateListing from './RealEstateListing';
import VehiclesListing from './VehiclesListing';
import ServicesListing from './ServicesListing';

interface ListingCardProps {
  listing: Listing;
  onBook?: (listingId: string) => void;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
  variant?: 'compact' | 'full';
}

/**
 * Router component that renders the appropriate listing component
 * based on the category slug
 */
const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onBook,
  onEdit,
  onDelete,
  variant = 'compact',
}) => {
  const categorySlug = listing.category_slug?.toLowerCase() || '';

  // Route to category-specific component
  const renderCategoryComponent = () => {
    switch (categorySlug) {
      case 'real-estate':
      case 'realestate':
      case 'property':
        return (
          <RealEstateListing
            listing={listing}
            onBook={onBook}
            variant={variant}
          />
        );

      case 'vehicles':
      case 'cars':
      case 'motorcycles':
        return (
          <VehiclesListing
            listing={listing}
            onBook={onBook}
            variant={variant}
          />
        );

      case 'services':
      case 'service':
        return (
          <ServicesListing
            listing={listing}
            onBook={onBook}
            variant={variant}
          />
        );

      default:
        // Generic listing card
        return <GenericListingCard listing={listing} onBook={onBook} variant={variant} />;
    }
  };

  return <div>{renderCategoryComponent()}</div>;
};

/**
 * Generic listing card for categories without specific renderers
 * Premium version with Framer Motion animations
 */
const GenericListingCard: React.FC<{
  listing: Listing;
  onBook?: (listingId: string) => void;
  variant?: 'compact' | 'full';
}> = ({ listing, onBook, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <motion.div
        className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="relative aspect-video overflow-hidden bg-neutral-100">
            <motion.img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Featured Badge */}
            {listing.is_featured && (
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <h3 className="text-xl font-bold font-display text-neutral-900 line-clamp-2">
            {listing.title}
          </h3>

          {listing.category_name && (
            <p className="mt-2 text-sm text-neutral-600">{listing.category_name}</p>
          )}

          {listing.price && (
            <div className="mt-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                {listing.currency} {listing.price}
              </span>
            </div>
          )}

          <p className="mt-3 text-sm text-neutral-600 line-clamp-2">
            {listing.description}
          </p>

          {onBook && (
            <motion.button
              onClick={() => onBook(listing.id)}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-lime-500 to-emerald-500 shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Details
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      className="rounded-2xl border border-neutral-200 bg-white shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {listing.image_urls && listing.image_urls.length > 0 && (
        <div className="relative aspect-video overflow-hidden bg-neutral-100 rounded-t-2xl">
          <motion.img
            src={listing.image_urls[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4 }}
          />
          {listing.is_featured && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-2xl">
              Featured
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        <h2 className="text-3xl font-bold font-display text-neutral-900">{listing.title}</h2>

        {listing.category_name && (
          <p className="mt-2 text-lg text-neutral-600">{listing.category_name}</p>
        )}

        {listing.price && (
          <div className="mt-6">
            <p className="text-sm text-neutral-600">Price</p>
            <p className="mt-1 text-3xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
              {listing.currency} {listing.price}
            </p>
          </div>
        )}

        <div className="mt-6 text-neutral-600 leading-relaxed">
          <p>{listing.description}</p>
        </div>

        {onBook && (
          <motion.button
            onClick={() => onBook(listing.id)}
            className="mt-8 w-full rounded-xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-lime-500 to-emerald-500 shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Details
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ListingCard;
