/**
 * Vehicles specific listing card and display component
 * Premium version with Framer Motion animations and enhanced styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Listing } from '../../../types/schema';
import { Gauge, Fuel, Users, DollarSign, Calendar, Star, Settings } from 'lucide-react';

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
      <motion.div
        className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Premium Image with Overlay */}
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
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-sky-500 to-lime-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </div>
            )}

            {/* Year Badge */}
            {year && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                <span className="text-xs font-semibold">{year}</span>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold font-display text-neutral-900 line-clamp-1">
            {make} {model}
          </h3>

          {/* Price with Gradient */}
          <div className="mt-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-lime-600 bg-clip-text text-transparent">
              {listing.currency} {listing.price}
            </span>
          </div>

          {/* Premium Key Features */}
          <div className="mt-4 flex flex-wrap gap-2">
            {mileage && (
              <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl px-3 py-2 text-neutral-700 font-medium border border-neutral-200">
                <Gauge className="h-3.5 w-3.5 text-sky-600" />
                <span>{mileage} km</span>
              </div>
            )}
            {fuelType && (
              <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl px-3 py-2 text-neutral-700 font-medium border border-neutral-200">
                <Fuel className="h-3.5 w-3.5 text-emerald-600" />
                <span>{fuelType}</span>
              </div>
            )}
            {seats && (
              <div className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl px-3 py-2 text-neutral-700 font-medium border border-neutral-200">
                <Users className="h-3.5 w-3.5 text-lime-600" />
                <span>{seats} seats</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-neutral-600 line-clamp-2">
            {listing.description}
          </p>

          {/* Premium Action Button */}
          {onBook && (
            <motion.button
              onClick={() => onBook(listing.id)}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-lime-500 shadow-lg hover:shadow-xl transition-shadow"
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
      {/* Premium Image Gallery */}
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
            <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-sky-500 to-lime-500 text-white text-sm font-semibold rounded-full shadow-2xl">
              Featured Vehicle
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        {/* Title */}
        <h2 className="text-3xl font-bold font-display text-neutral-900">
          {year && <span className="text-neutral-600">{year} </span>}
          {make} {model}
        </h2>

        {/* Premium Price Card */}
        <motion.div
          className="mt-6 rounded-2xl bg-gradient-to-r from-sky-50 to-lime-50 p-6 border border-sky-200"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-medium text-neutral-600">Asking Price</p>
          <p className="mt-1 text-4xl font-bold bg-gradient-to-r from-sky-600 to-lime-600 bg-clip-text text-transparent">
            {listing.currency} {listing.price}
          </p>
        </motion.div>

        {/* Premium Key Specifications */}
        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-neutral-200 py-8 sm:grid-cols-3">
          {mileage && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-50">
                <Gauge className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Mileage</p>
                <p className="text-lg font-semibold text-neutral-900">{mileage} km</p>
              </div>
            </div>
          )}
          {year && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Year</p>
                <p className="text-lg font-semibold text-neutral-900">{year}</p>
              </div>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-lime-50">
                <Settings className="h-6 w-6 text-lime-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Transmission</p>
                <p className="text-lg font-semibold text-neutral-900">{transmission}</p>
              </div>
            </div>
          )}
          {fuelType && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Fuel className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Fuel Type</p>
                <p className="text-lg font-semibold text-neutral-900">{fuelType}</p>
              </div>
            </div>
          )}
          {seats && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-50">
                <Users className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Seats</p>
                <p className="text-lg font-semibold text-neutral-900">{seats}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className="text-xl font-bold font-display text-neutral-900">Vehicle Details</h3>
          <p className="mt-3 text-neutral-600 leading-relaxed">{listing.description}</p>
        </div>

        {/* Premium Features */}
        {dynamicFields.features && Array.isArray(dynamicFields.features) && (
          <div className="mt-8">
            <h3 className="text-xl font-bold font-display text-neutral-900">Features & Options</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {dynamicFields.features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-sky-500 to-lime-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Action Button */}
        {onBook && (
          <motion.button
            onClick={() => onBook(listing.id)}
            className="mt-10 w-full rounded-xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-sky-500 to-lime-500 shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Contact Seller
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default VehiclesListing;
