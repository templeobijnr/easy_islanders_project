/**
 * Real Estate specific listing card and display component
 * Premium version with Framer Motion animations and enhanced styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Listing } from '../../../types/schema';
import { MapPin, Bed, Bath, DollarSign, Calendar, Star } from 'lucide-react';

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
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </div>
            )}

            {/* Rating Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">4.9</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold font-display text-neutral-900 line-clamp-1">
            {listing.title}
          </h3>

          {/* Location */}
          {listing.location && (
            <div className="mt-3 flex items-center gap-2 text-neutral-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{listing.location}</span>
            </div>
          )}

          {/* Bedrooms and Bathrooms */}
          <div className="mt-4 flex gap-6">
            {bedrooms > 0 && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Bed className="h-4 w-4" />
                <span className="text-sm font-medium">{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-2 text-neutral-600">
                <Bath className="h-4 w-4" />
                <span className="text-sm font-medium">{bathrooms} bath</span>
              </div>
            )}
          </div>

          {/* Pricing with Gradient */}
          <div className="mt-5 space-y-2">
            {nightlyPrice && (rentType === 'short_term' || rentType === 'both') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Per night:</span>
                <span className="text-lg font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  {listing.currency} {nightlyPrice}
                </span>
              </div>
            )}
            {monthlyPrice && (rentType === 'long_term' || rentType === 'both') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Per month:</span>
                <span className="text-lg font-bold bg-gradient-to-r from-sky-600 to-lime-600 bg-clip-text text-transparent">
                  {listing.currency} {monthlyPrice}
                </span>
              </div>
            )}
          </div>

          {/* Premium Action Button */}
          {onBook && (
            <motion.button
              onClick={() => onBook(listing.id)}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-lime-500 to-emerald-500 shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Details & Book
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
            <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-2xl">
              Featured Property
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        {/* Title and Location */}
        <h2 className="text-3xl font-bold font-display text-neutral-900">{listing.title}</h2>

        {listing.location && (
          <div className="mt-3 flex items-center gap-3 text-lg text-neutral-600">
            <MapPin className="h-5 w-5" />
            <span>{listing.location}</span>
          </div>
        )}

        {/* Key Features */}
        <div className="mt-8 grid grid-cols-2 gap-6 border-y border-neutral-200 py-8">
          {bedrooms > 0 && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-lime-50">
                <Bed className="h-6 w-6 text-lime-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Bedrooms</p>
                <p className="text-lg font-semibold text-neutral-900">{bedrooms}</p>
              </div>
            </div>
          )}
          {bathrooms > 0 && (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-50">
                <Bath className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Bathrooms</p>
                <p className="text-lg font-semibold text-neutral-900">{bathrooms}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className="text-xl font-bold font-display text-neutral-900">About This Property</h3>
          <p className="mt-3 text-neutral-600 leading-relaxed">{listing.description}</p>
        </div>

        {/* Premium Pricing Cards */}
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold font-display text-neutral-900">Pricing Options</h3>
          {nightlyPrice && (rentType === 'short_term' || rentType === 'both') && (
            <motion.div
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-lime-50 to-emerald-50 p-6 border border-lime-200"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="text-sm font-medium text-neutral-600">Short-term Rental</p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  {listing.currency} {nightlyPrice}
                </p>
                <p className="text-sm text-neutral-500">per night</p>
              </div>
              <Calendar className="h-8 w-8 text-lime-600" />
            </motion.div>
          )}
          {monthlyPrice && (rentType === 'long_term' || rentType === 'both') && (
            <motion.div
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 p-6 border border-sky-200"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="text-sm font-medium text-neutral-600">Long-term Rental</p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  {listing.currency} {monthlyPrice}
                </p>
                <p className="text-sm text-neutral-500">per month</p>
              </div>
              <DollarSign className="h-8 w-8 text-sky-600" />
            </motion.div>
          )}
        </div>

        {/* Premium Amenities */}
        {dynamicFields.amenities && Array.isArray(dynamicFields.amenities) && (
          <div className="mt-8">
            <h3 className="text-xl font-bold font-display text-neutral-900">Amenities</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {dynamicFields.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="inline-flex items-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Premium Action Button */}
        {onBook && (
          <motion.button
            onClick={() => onBook(listing.id)}
            className="mt-10 w-full rounded-xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-lime-500 to-emerald-500 shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Book This Property
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default RealEstateListing;
