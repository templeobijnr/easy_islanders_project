/**
 * OverviewTab - Listing overview with description, amenities, photos, location
 */

import React from 'react';
import { MapPin, Bed, Bath, Maximize, Wifi, Waves, Eye, Mountain, Car, Utensils } from 'lucide-react';

interface OverviewTabProps {
  listing: {
    description: string;
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    city?: string;
    area?: string;
    amenities?: string[];
    photos?: string[];
  };
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="h-4 w-4" />,
  'Pool': <Waves className="h-4 w-4" />,
  'Sea View': <Eye className="h-4 w-4" />,
  'Mountain View': <Mountain className="h-4 w-4" />,
  'Parking': <Car className="h-4 w-4" />,
  'Kitchen': <Utensils className="h-4 w-4" />,
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ listing }) => {
  const defaultAmenities = ['WiFi', 'Pool', 'Sea View', 'Kitchen', 'Air Conditioning', 'Parking'];
  const amenities = listing.amenities || defaultAmenities;

  return (
    <div className="space-y-6">
      {/* Property Features */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listing.bedrooms && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Bed className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{listing.bedrooms}</p>
                <p className="text-xs text-slate-600">Bedrooms</p>
              </div>
            </div>
          )}
          {listing.bathrooms && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Bath className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{listing.bathrooms}</p>
                <p className="text-xs text-slate-600">Bathrooms</p>
              </div>
            </div>
          )}
          {listing.size_sqm && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Maximize className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{listing.size_sqm}</p>
                <p className="text-xs text-slate-600">m²</p>
              </div>
            </div>
          )}
          {listing.city && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{listing.city}</p>
                <p className="text-xs text-slate-600">{listing.area || 'Location'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {listing.description}
        </p>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200 transition-all hover:shadow-md hover:scale-105"
            >
              <div className="text-brand-600">
                {AMENITY_ICONS[amenity] || <span className="text-xl">✓</span>}
              </div>
              <span className="text-sm font-medium text-slate-700">{amenity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Gallery */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Photos</h2>
          <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
            View all ({listing.photos?.length || 8})
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: listing.photos?.length || 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
            >
              {listing.photos?.[i] ? (
                <img
                  src={listing.photos[i]}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs group-hover:bg-slate-400/10 transition-colors">
                  Photo {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
        <div className="aspect-video bg-slate-200 rounded-xl overflow-hidden">
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <MapPin className="h-12 w-12 mb-2 text-brand-500" />
            <p className="text-sm font-medium">{listing.city}</p>
            <p className="text-xs">{listing.area}</p>
            <p className="text-xs mt-2 text-slate-400">Map will be integrated here</p>
          </div>
        </div>
      </div>
    </div>
  );
};
