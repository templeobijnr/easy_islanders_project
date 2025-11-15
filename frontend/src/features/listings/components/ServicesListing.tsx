/**
 * Services specific listing card and display component
 * Premium version with Framer Motion animations and enhanced styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Listing } from '../../../types/schema';
import { DollarSign, MapPin, Clock, Star, Award, Calendar } from 'lucide-react';

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
      <motion.div
        className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Premium Image with Overlay */}
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="relative aspect-square overflow-hidden bg-neutral-100">
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
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </div>
            )}

            {/* Rating Badge */}
            {rating > 0 && (
              <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold font-display text-neutral-900 line-clamp-1">
            {listing.title}
          </h3>

          {/* Service Type */}
          {serviceType && (
            <div className="mt-3 flex items-center gap-2 text-neutral-600">
              <Award className="h-4 w-4" />
              <span className="text-sm">{serviceType}</span>
            </div>
          )}

          {/* Experience Badge */}
          {experience && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 border border-emerald-200">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-neutral-700">{experience}</span>
            </div>
          )}

          {/* Pricing with Gradient */}
          {listing.price && (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-neutral-600">Starting at:</span>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {listing.currency} {listing.price}
              </span>
            </div>
          )}

          {/* Premium Action Button */}
          {onBook && (
            <motion.button
              onClick={() => onBook(listing.id)}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Request Service
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
      <div className="flex gap-8 p-8">
        {/* Premium Image */}
        {listing.image_urls && listing.image_urls.length > 0 && (
          <div className="flex-shrink-0 relative">
            <motion.img
              src={listing.image_urls[0]}
              alt={listing.title}
              className="h-48 w-48 rounded-2xl object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.4 }}
            />
            {listing.is_featured && (
              <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Featured
              </div>
            )}
          </div>
        )}

        <div className="flex-1">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold font-display text-neutral-900">
              {listing.title}
            </h2>
            {serviceType && (
              <div className="mt-3 flex items-center gap-2 text-lg text-neutral-600">
                <Award className="h-5 w-5" />
                <span>{serviceType}</span>
              </div>
            )}
          </div>

          {/* Rating and Price Row */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              {rating > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-neutral-200 text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-neutral-700">{rating.toFixed(1)}/5</span>
                </div>
              )}
            </div>
            {listing.price && (
              <motion.div
                className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-200"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-medium text-neutral-600">Starting at</p>
                <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {listing.currency} {listing.price}
                </p>
              </motion.div>
            )}
          </div>

          {/* Details Grid */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            {experience && (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Experience</p>
                  <p className="text-lg font-semibold text-neutral-900">{experience}</p>
                </div>
              </div>
            )}
            {availability && (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-50">
                  <Clock className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Availability</p>
                  <p className="text-lg font-semibold text-neutral-900">{availability}</p>
                </div>
              </div>
            )}
            {listing.location && (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-50">
                  <MapPin className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Location</p>
                  <p className="text-lg font-semibold text-neutral-900">{listing.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border-t border-neutral-200 p-8">
        <h3 className="text-xl font-bold font-display text-neutral-900">About This Service</h3>
        <p className="mt-3 text-neutral-600 leading-relaxed">{listing.description}</p>
      </div>

      {/* Premium Skills/Services */}
      {dynamicFields.skills && Array.isArray(dynamicFields.skills) && (
        <div className="border-t border-neutral-200 p-8">
          <h3 className="text-xl font-bold font-display text-neutral-900">Skills & Expertise</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {dynamicFields.skills.map((skill: string) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 text-sm font-medium text-neutral-700 border border-emerald-200 hover:shadow-md transition-shadow"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Premium Action Button */}
      {onBook && (
        <div className="border-t border-neutral-200 p-8">
          <motion.button
            onClick={() => onBook(listing.id)}
            className="w-full rounded-xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Request This Service
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default ServicesListing;
