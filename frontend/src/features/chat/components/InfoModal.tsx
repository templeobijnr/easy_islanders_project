import React from 'react';
import { X, Bed, Bath, Home, MapPin, DollarSign } from 'lucide-react';
import type { RecItem } from './RecommendationCard';

interface InfoModalProps {
  item: RecItem;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ item, onClose }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          {item.imageUrl && (
            <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Location & Price */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.subtitle || item.area || 'Location not specified'}
                </p>
                {item.area && item.subtitle && (
                  <p className="text-xs text-slate-500">{item.area}</p>
                )}
              </div>
            </div>
            {item.price && (
              <div className="flex items-center gap-2 px-3 py-2 bg-lime-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-lime-600" />
                <span className="font-semibold text-lime-700">{item.price}</span>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-4">
            {item.metadata?.bedrooms !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Bed className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Bedrooms</p>
                  <p className="font-semibold text-slate-900">{item.metadata.bedrooms}</p>
                </div>
              </div>
            )}
            {item.metadata?.bathrooms !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Bath className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Bathrooms</p>
                  <p className="font-semibold text-slate-900">{item.metadata.bathrooms}</p>
                </div>
              </div>
            )}
            {item.metadata?.sqm !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Home className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Size</p>
                  <p className="font-semibold text-slate-900">{item.metadata.sqm} m²</p>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          {item.rating && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Rating:</span>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium">
                ⭐ {item.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Rental Type */}
          {item.metadata?.rent_type && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Type:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">
                {item.metadata.rent_type.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Amenities/Badges */}
          {item.badges && item.badges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {item.badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Amenities List (if available in metadata) */}
          {item.metadata?.amenities && item.metadata.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">All Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.metadata.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-lime-500 rounded-full"></span>
                    <span className="capitalize">{amenity.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description (if available) */}
          {item.metadata?.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.metadata.description}
              </p>
            </div>
          )}

          {/* Distance */}
          {item.distanceMins !== undefined && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                📍 {item.distanceMins} minutes away from your location
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
