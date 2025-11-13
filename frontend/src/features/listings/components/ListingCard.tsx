/**
 * Generic listing card that renders category-specific components
 */

import React from 'react';
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
 */
const GenericListingCard: React.FC<{
  listing: Listing;
  onBook?: (listingId: string) => void;
  variant?: 'compact' | 'full';
}> = ({ listing, onBook, variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="aspect-video overflow-hidden bg-gray-100">
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="h-full w-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {listing.title}
          </h3>

          {listing.price && (
            <div className="mt-2">
              <span className="text-xl font-bold text-blue-600">
                {listing.currency} {listing.price}
              </span>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>

          {onBook && (
            <button
              onClick={() => onBook(listing.id)}
              className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md">
      {listing.image_urls && listing.image_urls.length > 0 && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={listing.image_urls[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>

        {listing.category_name && (
          <p className="mt-1 text-sm text-gray-600">{listing.category_name}</p>
        )}

        {listing.price && (
          <div className="mt-4 text-2xl font-bold text-blue-600">
            {listing.currency} {listing.price}
          </div>
        )}

        <div className="mt-4 text-gray-600">
          <p>{listing.description}</p>
        </div>

        {onBook && (
          <button
            onClick={() => onBook(listing.id)}
            className="mt-6 w-full rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
