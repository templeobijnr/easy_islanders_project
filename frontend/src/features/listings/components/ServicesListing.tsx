/**
 * Services specific listing card and display component
 */

import React from 'react';
import { Listing } from '../../../types/schema';
import { DollarSign, MapPin, Clock, Star } from 'lucide-react';

interface ServicesListingProps {
  listing: Listing;
  onBook?: (listingId: string) => void;
  variant?: 'compact' | 'full';
}

const ServicesListing: React.FC<ServicesListingProps> = ({
  listing,
  onBook,
  variant = 'compact',
}) => {
  const dynamicFields = listing.dynamic_fields || {};
  const serviceType = dynamicFields.service_type || '';
  const experience = dynamicFields.experience || '';
  const availability = dynamicFields.availability || '';
  const rating = listing.dynamic_fields?.rating || 0;

  if (variant === 'compact') {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="aspect-square overflow-hidden bg-gray-100">
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="h-full w-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}

        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">
            {listing.title}
          </h3>

          {/* Service Type */}
          {serviceType && (
            <p className="mt-1 text-sm text-gray-600">{serviceType}</p>
          )}

          {/* Rating */}
          {rating > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({rating})</span>
            </div>
          )}

          {/* Price */}
          {listing.price && (
            <div className="mt-3 flex items-center gap-1 text-lg font-semibold text-blue-600">
              <DollarSign className="h-5 w-5" />
              <span>{listing.price} {listing.currency}</span>
            </div>
          )}

          {/* Experience */}
          {experience && (
            <p className="mt-2 text-xs text-gray-600">
              Experience: {experience}
            </p>
          )}

          {/* Action Button */}
          {onBook && (
            <button
              onClick={() => onBook(listing.id)}
              className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Request Service
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md">
      <div className="flex gap-6 p-6">
        {/* Image */}
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="flex-shrink-0">
            <img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="h-40 w-40 rounded-lg object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {listing.title}
            </h2>
            {serviceType && (
              <p className="mt-1 text-lg text-gray-600">{serviceType}</p>
            )}
          </div>

          {/* Rating and Price Row */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              {rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({rating})</span>
                </div>
              )}
            </div>
            {listing.price && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  {listing.currency} {listing.price}
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {experience && (
              <div>
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-semibold text-gray-900">{experience}</p>
              </div>
            )}
            {availability && (
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="font-semibold text-gray-900">{availability}</p>
                </div>
              </div>
            )}
            {listing.location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{listing.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900">About</h3>
        <p className="mt-2 text-gray-600">{listing.description}</p>
      </div>

      {/* Skills/Services */}
      {dynamicFields.skills && Array.isArray(dynamicFields.skills) && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Skills & Services</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dynamicFields.skills.map((skill: string) => (
              <span
                key={skill}
                className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {onBook && (
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={() => onBook(listing.id)}
            className="w-full rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
          >
            Request This Service
          </button>
        </div>
      )}
    </div>
  );
};

export default ServicesListing;
