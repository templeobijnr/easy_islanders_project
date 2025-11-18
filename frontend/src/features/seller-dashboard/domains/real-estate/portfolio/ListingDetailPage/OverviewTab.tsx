/**
 * OverviewTab - Listing overview with description, amenities, photos, location
 */

import React, { useState, useRef } from 'react';
import { MapPin, Bed, Bath, Maximize, Wifi, Waves, Eye, Mountain, Car, Utensils, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import PropertyLocationMap from '../../../../../../components/ui/PropertyLocationMap';
import { useUploadListingImages } from '../hooks/useRealEstateData';
import type { Listing, ListingImage } from '@/types/listing';

interface OverviewTabProps {
  listing: Listing;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="h-4 w-4" />,
  'Pool': <Waves className="h-4 w-4" />,
  'Sea View': <Eye className="h-4 w-4" />,
  'Mountain View': <Mountain className="h-4 w-4" />,
  'Parking': <Car className="h-4 w-4" />,
  'Kitchen': <Utensils className="h-4 w-4" />,
  'Air Conditioning': <span className="text-sm">❄️</span>,
  'Balcony': <span className="text-sm">🏠</span>,
  'Garden': <span className="text-sm">🌳</span>,
  'Gym': <span className="text-sm">💪</span>,
  'Security': <span className="text-sm">🔒</span>,
  'Pet Friendly': <span className="text-sm">🐕</span>,
};

const COMMON_AMENITIES = [
  'WiFi', 'Pool', 'Sea View', 'Mountain View', 'Parking', 'Kitchen', 
  'Air Conditioning', 'Balcony', 'Garden', 'Gym', 'Security', 'Pet Friendly'
];

export const OverviewTab: React.FC<OverviewTabProps> = ({ listing }) => {
  const [amenities, setAmenities] = useState<string[]>(listing.dynamic_fields?.amenities || []);
  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    amenities: true,
    photos: true,
    location: true,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadImagesMutation = useUploadListingImages();

  // Get location data from dynamic_fields
  const locationData = listing.dynamic_fields?.location || {};
  const latitude = listing.latitude;
  const longitude = listing.longitude;
  const bedrooms = listing.dynamic_fields?.bedrooms;
  const bathrooms = listing.dynamic_fields?.bathrooms;
  const size_sqm = listing.dynamic_fields?.size_sqm;

  const addAmenity = (amenity: string) => {
    if (amenity && !amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const handleAddCustomAmenity = () => {
    if (newAmenity.trim()) {
      addAmenity(newAmenity.trim());
      setNewAmenity('');
      setShowAddAmenity(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    uploadImagesMutation.mutate({
      listingId: listing.id,
      files: fileArray,
    });

    // Clear value so the same file can be selected again if needed
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Property Features */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bedrooms && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Bed className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{bedrooms}</p>
                <p className="text-xs text-slate-600">Bedrooms</p>
              </div>
            </div>
          )}
          {bathrooms && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Bath className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{bathrooms}</p>
                <p className="text-xs text-slate-600">Bathrooms</p>
              </div>
            </div>
          )}
          {size_sqm && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Maximize className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{size_sqm}</p>
                <p className="text-xs text-slate-600">m²</p>
              </div>
            </div>
          )}
          {listing.location && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{listing.location}</p>
                <p className="text-xs text-slate-600">Location</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {listing.description || 'No description available for this property.'}
        </p>
      </div>

      {/* Amenities with Management */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddAmenity(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button
                onClick={() => toggleSection('amenities')}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {expandedSections.amenities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {expandedSections.amenities && (
            <>
              {/* Add Amenity Section */}
              {showAddAmenity && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Add Amenity</h3>
                  
                  {/* Common Amenities Quick Add */}
                  <div className="mb-3">
                    <p className="text-xs text-slate-600 mb-2">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_AMENITIES.filter(amenity => !amenities.includes(amenity)).map(amenity => (
                        <button
                          key={amenity}
                          onClick={() => addAmenity(amenity)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-brand-300 transition-colors"
                        >
                          + {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amenity Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter custom amenity..."
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    <button
                      onClick={handleAddCustomAmenity}
                      disabled={!newAmenity.trim()}
                      className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAmenity(false);
                        setNewAmenity('');
                      }}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Current Amenities */}
              {amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-3 p-3 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200 hover:shadow-md transition-all"
                    >
                      <div className="text-brand-600">
                        {AMENITY_ICONS[amenity] || <span className="text-xl">✓</span>}
                      </div>
                      <span className="text-sm font-medium text-slate-700 flex-1">{amenity}</span>
                      <button
                        onClick={() => removeAmenity(amenity)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No amenities added yet</p>
                  <button
                    onClick={() => setShowAddAmenity(true)}
                    className="mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Add your first amenity
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Photos Gallery */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Photos</h2>
            <div className="flex items-center gap-2">
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                View all ({listing.images?.length || 0})
              </button>
              <button
                onClick={() => toggleSection('photos')}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {expandedSections.photos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {expandedSections.photos && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.images?.map((image: ListingImage, i: number) => (
                  <div
                    key={image.id}
                    className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all relative"
                  >
                    <img
                      src={image.image}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs bg-white text-slate-900 rounded-lg shadow-lg hover:bg-slate-100 transition-all">
                        View
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Photo Button */}
                <div
                  className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">
                    {uploadImagesMutation.isPending ? 'Uploading…' : 'Add Photo'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Click to upload</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location with Map */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Location</h2>
            <button
              onClick={() => toggleSection('location')}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {expandedSections.location ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {expandedSections.location && (
            <PropertyLocationMap
              latitude={latitude}
              longitude={longitude}
              city={listing.location}
              address={locationData.address}
              height="400px"
            />
          )}
        </div>
      </div>
    </div>
  );
};
