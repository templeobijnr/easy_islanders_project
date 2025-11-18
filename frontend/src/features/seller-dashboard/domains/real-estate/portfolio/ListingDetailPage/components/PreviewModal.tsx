/**
 * PreviewModal - Property preview modal for listing detail page
 * Shows how the listing will appear to potential customers
 */

import React from 'react';
import { X, MapPin, Bed, Bath, Maximize, Calendar, Eye, Share2, Heart } from 'lucide-react';
import PropertyLocationMap from '../../../../../../../components/ui/PropertyLocationMap';

interface PreviewModalProps {
  listing: {
    id?: number;
    title: string;
    description: string;
    base_price: string;
    currency: string;
    price_period?: string;
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    city?: string;
    area?: string;
    location?: {
      latitude?: string | null;
      longitude?: string | null;
      address_line?: string;
    };
    property?: {
      location?: {
        latitude?: string | null;
        longitude?: string | null;
        address_line?: string;
      };
    };
    image_urls?: string[];
    amenities?: string[];
    reference_code?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ listing, isOpen, onClose }) => {
  if (!isOpen || !listing) return null;

  const locationData = listing.location || listing.property?.location || {};
  const latitude = locationData.latitude ? parseFloat(locationData.latitude) : null;
  const longitude = locationData.longitude ? parseFloat(locationData.longitude) : null;

  const getPriceDisplay = () => {
    const price = `${listing.currency} ${listing.base_price}`;
    if (listing.price_period === 'PER_DAY') return `${price}/night`;
    if (listing.price_period === 'PER_MONTH') return `${price}/month`;
    return price;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Property Preview</h2>
            <p className="text-sm text-slate-600">See how your listing appears to customers</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Hero Section */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-video">
              {listing.image_urls?.[0] ? (
                <img
                  src={listing.image_urls[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">No Image Available</p>
                  </div>
                </div>
              )}
              
              {/* Preview Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-opacity-100 transition-all">
                  <Heart className="h-4 w-4 text-slate-600" />
                </button>
                <button className="p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-opacity-100 transition-all">
                  <Share2 className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              {/* Price Badge */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                <p className="text-2xl font-bold text-slate-900">{getPriceDisplay()}</p>
              </div>
            </div>

            {/* Property Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{listing.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.city}{listing.area && `, ${listing.area}`}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{listing.description}</p>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-3 gap-4">
                  {listing.bedrooms && (
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Bed className="h-5 w-5 text-brand-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{listing.bedrooms}</p>
                      <p className="text-xs text-slate-600">Bedrooms</p>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Bath className="h-5 w-5 text-sky-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{listing.bathrooms}</p>
                      <p className="text-xs text-slate-600">Bathrooms</p>
                    </div>
                  )}
                  {listing.size_sqm && (
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Maximize className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{listing.size_sqm}</p>
                      <p className="text-xs text-slate-600">m²</p>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {listing.amenities.slice(0, 6).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="text-green-600">✓</span>
                          <span>{amenity}</span>
                        </div>
                      ))}
                      {listing.amenities.length > 6 && (
                        <div className="text-sm text-slate-500">
                          +{listing.amenities.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Map */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Location</h4>
                <PropertyLocationMap
                  latitude={latitude}
                  longitude={longitude}
                  city={listing.city}
                  area={listing.area}
                  address={locationData.address_line}
                  height="250px"
                />
              </div>
            </div>

            {/* Image Gallery Preview */}
            {listing.image_urls && listing.image_urls.length > 1 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-3">More Photos</h4>
                <div className="grid grid-cols-4 gap-2">
                  {listing.image_urls.slice(1, 5).map((url, index) => (
                    <div key={index} className="aspect-video bg-slate-200 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Photo ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {listing.image_urls.length > 5 && (
                    <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center text-sm text-slate-600">
                      +{listing.image_urls.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <p>Reference: {listing.reference_code || 'N/A'}</p>
              <p className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                Listed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  // Copy link to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  // Could add toast notification here
                }}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Copy Listing Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;