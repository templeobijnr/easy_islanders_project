/**
 * Real Estate specific listing card and display component
 */

import React from 'react';
import { Listing } from '../../../types/schema';
import { MapPin, Bed, Bath, DollarSign, Calendar } from 'lucide-react';

interface RealEstateListingProps {
  listing: Listing;
  onBook?: (listingId: string) => void;
  variant?: 'compact' | 'full';
}

const RealEstateListing: React.FC<RealEstateListingProps> = ({
  listing,
  onBook,
  variant = 'compact',
}) => {
  const dynamicFields = listing.dynamic_fields || {};
  const bedrooms = dynamicFields.bedrooms || 0;
  const bathrooms = dynamicFields.bathrooms || 0;
  const rentType = dynamicFields.rent_type || 'both';
  const nightlyPrice = dynamicFields.nightly_price;
  const monthlyPrice = dynamicFields.monthly_price;

  if (variant === 'compact') {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
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
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {listing.title}
          </h3>

          {/* Location */}
          {listing.location && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{listing.location}</span>
            </div>
          )}

          {/* Bedrooms and Bathrooms */}
          <div className="mt-3 flex gap-4">
            {bedrooms > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Bed className="h-4 w-4" />
                <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Bath className="h-4 w-4" />
                <span>{bathrooms} bath</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="mt-4 space-y-2">
            {nightlyPrice && (rentType === 'short_term' || rentType === 'both') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Per night:</span>
                <span className="font-semibold text-gray-900">
                  {listing.currency} {nightlyPrice}
                </span>
              </div>
            )}
            {monthlyPrice && (rentType === 'long_term' || rentType === 'both') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Per month:</span>
                <span className="font-semibold text-gray-900">
                  {listing.currency} {monthlyPrice}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {onBook && (
            <button
              onClick={() => onBook(listing.id)}
              className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Details & Book
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md">
      {/* Image Gallery */}
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
        {/* Title and Location */}
        <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>

        {listing.location && (
          <div className="mt-2 flex items-center gap-2 text-lg text-gray-600">
            <MapPin className="h-5 w-5" />
            <span>{listing.location}</span>
          </div>
        )}

        {/* Key Features */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-200 py-6">
          {bedrooms > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-600">
                <Bed className="h-5 w-5" />
                <span className="font-semibold">{bedrooms} Bedrooms</span>
              </div>
            </div>
          )}
          {bathrooms > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-600">
                <Bath className="h-5 w-5" />
                <span className="font-semibold">{bathrooms} Bathrooms</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
          <p className="mt-2 text-gray-600">{listing.description}</p>
        </div>

        {/* Pricing */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
          {nightlyPrice && (rentType === 'short_term' || rentType === 'both') && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
              <div>
                <p className="text-sm text-gray-600">Short-term (Nightly)</p>
                <p className="font-semibold text-gray-900">
                  {listing.currency} {nightlyPrice}/night
                </p>
              </div>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          )}
          {monthlyPrice && (rentType === 'long_term' || rentType === 'both') && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
              <div>
                <p className="text-sm text-gray-600">Long-term (Monthly)</p>
                <p className="font-semibold text-gray-900">
                  {listing.currency} {monthlyPrice}/month
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          )}
        </div>

        {/* Amenities */}
        {dynamicFields.amenities && Array.isArray(dynamicFields.amenities) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {dynamicFields.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onBook && (
          <button
            onClick={() => onBook(listing.id)}
            className="mt-8 w-full rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
};

export default RealEstateListing;
