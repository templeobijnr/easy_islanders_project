/**
 * Vehicles specific listing card and display component
 */

import React from 'react';
import { Listing } from '../../../types/schema';
import { Gauge, Fuel, Users, DollarSign, Calendar } from 'lucide-react';

interface VehiclesListingProps {
  listing: Listing;
  onBook?: (listingId: string) => void;
  variant?: 'compact' | 'full';
}

const VehiclesListing: React.FC<VehiclesListingProps> = ({
  listing,
  onBook,
  variant = 'compact',
}) => {
  const dynamicFields = listing.dynamic_fields || {};
  const make = dynamicFields.make || '';
  const model = dynamicFields.model || '';
  const year = dynamicFields.year || '';
  const mileage = dynamicFields.mileage || '';
  const fuelType = dynamicFields.fuel_type || '';
  const transmission = dynamicFields.transmission || '';
  const seats = dynamicFields.seats || '';

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
          <h3 className="text-lg font-semibold text-gray-900">
            {year && <span>{year} </span>}
            {make} {model}
          </h3>

          {/* Price */}
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600">
              {listing.currency} {listing.price}
            </span>
          </div>

          {/* Key Features */}
          <div className="mt-3 flex flex-wrap gap-2">
            {mileage && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1 text-gray-700">
                <Gauge className="h-3 w-3" />
                <span>{mileage} km</span>
              </div>
            )}
            {fuelType && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1 text-gray-700">
                <Fuel className="h-3 w-3" />
                <span>{fuelType}</span>
              </div>
            )}
            {seats && (
              <div className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1 text-gray-700">
                <Users className="h-3 w-3" />
                <span>{seats} seats</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>

          {/* Action Button */}
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
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900">
          {year && <span>{year} </span>}
          {make} {model}
        </h2>

        {/* Price */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Price</p>
          <p className="text-3xl font-bold text-blue-600">
            {listing.currency} {listing.price}
          </p>
        </div>

        {/* Key Specifications */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-200 py-6 sm:grid-cols-3">
          {mileage && (
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Mileage</p>
                  <p className="font-semibold text-gray-900">{mileage} km</p>
                </div>
              </div>
            </div>
          )}
          {year && (
            <div>
              <div>
                <p className="text-xs text-gray-600">Year</p>
                <p className="font-semibold text-gray-900">{year}</p>
              </div>
            </div>
          )}
          {transmission && (
            <div>
              <div>
                <p className="text-xs text-gray-600">Transmission</p>
                <p className="font-semibold text-gray-900">{transmission}</p>
              </div>
            </div>
          )}
          {fuelType && (
            <div>
              <div className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Fuel Type</p>
                  <p className="font-semibold text-gray-900">{fuelType}</p>
                </div>
              </div>
            </div>
          )}
          {seats && (
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Seats</p>
                  <p className="font-semibold text-gray-900">{seats}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">Details</h3>
          <p className="mt-2 text-gray-600">{listing.description}</p>
        </div>

        {/* Features */}
        {dynamicFields.features && Array.isArray(dynamicFields.features) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {dynamicFields.features.map((feature: string) => (
                <label key={feature} className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="h-4 w-4" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
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
            Contact Seller
          </button>
        )}
      </div>
    </div>
  );
};

export default VehiclesListing;
