/**
 * EditListingPage - Comprehensive Listing Editor
 * Full-featured editing page with map integration, images, and all property details
 *
 * Route: /dashboard/home/real-estate/portfolio/listing/:id/edit
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X, MapPin, Home, DollarSign, Calendar, Image as ImageIcon } from 'lucide-react';
import { useListing, useUpdateListing } from './hooks/useRealEstateData';
import { Listing } from './types/realEstateModels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import LocationMapPicker from '@/components/ui/LocationMapPicker';
import LocationAutocompleteInput from '@/components/ui/LocationAutocompleteInput';
import axios from 'axios';
import config from '@/config';

export const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateListingMutation = useUpdateListing();

  // Fetch listing data
  const {
    data: listing,
    isLoading,
    error,
  } = useListing(id);

  const [formData, setFormData] = useState<Partial<Listing>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [locationData, setLocationData] = useState({
    lat: 0,
    lng: 0,
    city: '',
    district: '',
    address: '',
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Initialize form data when listing loads
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title,
        description: listing.description,
        base_price: listing.base_price,
        currency: listing.currency,
        price_period: listing.price_period,
        status: listing.status,
        available_from: listing.available_from || undefined,
        available_to: listing.available_to || undefined,
      });

      if (listing.property?.location) {
        const loc = listing.property.location;
        setLocationData({
          lat: loc.latitude ? parseFloat(loc.latitude) : 0,
          lng: loc.longitude ? parseFloat(loc.longitude) : 0,
          city: loc.city || '',
          district: loc.area || '',
          address: loc.address_line || '',
        });
      }

      if (listing.image_urls) {
        setExistingImages(listing.image_urls);
      }
    }
  }, [listing]);

  const handleBack = () => {
    navigate(`/dashboard/home/real-estate/portfolio/listing/${id}`);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...filesArray]);

      // Create previews
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      // Revoke the URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    address?: string;
  }) => {
    setLocationData({
      lat: location.lat,
      lng: location.lng,
      city: location.city || '',
      district: location.district || '',
      address: location.address || '',
    });
  };

  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      // eslint-disable-next-line no-console
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setLocationData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
        }));

        try {
          const resp = await axios.get(
            `${config.API_BASE_URL}/api/v1/real_estate/geo/reverse/`,
            {
              params: {
                lat: latitude,
                lng: longitude,
              },
            }
          );
          const data = resp.data || {};
          setLocationData((prev) => ({
            ...prev,
            city: typeof data.city === 'string' && data.city ? data.city : prev.city,
            district:
              typeof data.district === 'string' && data.district
                ? data.district
                : prev.district,
            address:
              typeof data.address === 'string' && data.address ? data.address : prev.address,
          }));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to reverse geocode current location:', e);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error('Geolocation error:', err);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleSubmit = async () => {
    if (!listing) return;

    setSaving(true);
    try {
      // Build update payload with optional location override
      const data: Partial<Listing> = {
        ...formData,
      };

      if (listing.property && listing.property.location) {
        const loc = listing.property.location;
        data.property = {
          ...listing.property,
          location: {
            ...loc,
            latitude: locationData.lat ? locationData.lat.toString() : loc.latitude,
            longitude: locationData.lng ? locationData.lng.toString() : loc.longitude,
            city: locationData.city || loc.city,
            area: locationData.district || loc.area,
            address_line: locationData.address || loc.address_line,
          },
        };
      }

      // Update listing basic info
      await updateListingMutation.mutateAsync({
        id: listing.id,
        data,
      });

      // Upload new images
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      for (const file of selectedImages) {
        const fd = new FormData();
        fd.append('image', file);
        await axios.post(
          `${config.API_BASE_URL}/api/listings/${listing.id}/upload-image/`,
          fd,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      // Navigate back to listing detail
      navigate(`/dashboard/home/real-estate/portfolio/listing/${id}`);
    } catch (error) {
      console.error('Failed to update listing:', error);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lime-600 mx-auto" />
          <p className="mt-4 text-slate-700 font-medium">Loading listing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Listing</h2>
          <p className="text-slate-600 mb-6">
            {error instanceof Error ? error.message : 'Listing not found'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Listing
          </button>
        </div>
      </div>
    );
  }

  const isDirty =
    JSON.stringify(formData) !==
    JSON.stringify({
      title: listing.title,
      description: listing.description,
      base_price: listing.base_price,
      currency: listing.currency,
      price_period: listing.price_period,
      status: listing.status,
      available_from: listing.available_from || undefined,
      available_to: listing.available_to || undefined,
    }) ||
    selectedImages.length > 0 ||
    existingImages.length !== listing.image_urls?.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Edit Listing</h1>
                <p className="text-sm text-slate-600">{listing.reference_code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isDirty || saving}
                className="bg-gradient-to-r from-lime-500 to-emerald-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="basic">
              <Home className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="location">
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="availability">
              <Calendar className="h-4 w-4 mr-2" />
              Availability
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Luxury 2BR Apartment in Kyrenia"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property in detail..."
                    rows={8}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Highlight key features, amenities, and what makes this property special
                  </p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status || 'DRAFT'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as Listing['status'] })
                    }
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="UNDER_OFFER">Under Offer</option>
                    <option value="SOLD">Sold</option>
                    <option value="RENTED">Rented</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="base_price">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price || ''}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="Enter price"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={formData.currency || 'EUR'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="price_period">Price Period</Label>
                    <select
                      id="price_period"
                      value={formData.price_period || 'TOTAL'}
                      onChange={(e) =>
                        setFormData({ ...formData, price_period: e.target.value as Listing['price_period'] })
                      }
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="PER_DAY">Per Day</option>
                      <option value="PER_MONTH">Per Month</option>
                      <option value="TOTAL">Total</option>
                      <option value="STARTING_FROM">Starting From</option>
                    </select>
                  </div>
                </div>

                {/* Price Preview */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-lime-50 to-emerald-50 border border-lime-200">
                  <div className="font-semibold text-sm text-lime-900 mb-1">Price Preview</div>
                  <div className="text-2xl font-bold text-lime-700">
                    {formData.price_period === 'STARTING_FROM' && 'From '}
                    {formData.currency === 'EUR' && '€'}
                    {formData.currency === 'GBP' && '£'}
                    {formData.currency === 'USD' && '$'}
                    {formData.currency === 'TRY' && '₺'}
                    {formData.base_price ? parseFloat(formData.base_price).toLocaleString() : '0'}
                    {formData.price_period === 'PER_DAY' && '/day'}
                    {formData.price_period === 'PER_MONTH' && '/month'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>

              <div className="space-y-6">
                {/* Location Autocomplete Search */}
                <div>
                  <Label htmlFor="location-search">Search Location</Label>
                  <div className="mt-2">
                    <LocationAutocompleteInput
                      value={locationData.address}
                      onLocationSelect={(loc) => {
                        setLocationData({
                          lat: loc.latitude,
                          lng: loc.longitude,
                          city: loc.city,
                          district: loc.district,
                          address: loc.address,
                        });
                      }}
                      placeholder="Type to search for address, city, or area..."
                      showUseMyLocation={true}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Search for a location or use your current position. You can also click on the map below.
                  </p>
                </div>

                {/* Location Info Display */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">City</p>
                    <p className="font-medium text-slate-900">{locationData.city || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">District/Area</p>
                    <p className="font-medium text-slate-900">{locationData.district || 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-600 mb-1">Coordinates</p>
                    <p className="font-mono text-sm text-slate-900">
                      {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Map Picker */}
                <div>
                  <Label>Adjust Pin on Map</Label>
                  <div className="mt-2">
                    <LocationMapPicker
                      initialPosition={{ lat: locationData.lat || 35.3368, lng: locationData.lng || 33.3173 }}
                      onLocationSelect={handleLocationSelect}
                      height="500px"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
                  <strong>Tip:</strong> Use the search box above for quick location lookup, click "Use my location" to auto-detect, or click directly on the map to set the exact position.
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Images</h2>

              <div className="space-y-6">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Current Images</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {imagePreviews.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">New Images (Not Uploaded Yet)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`New ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-lime-200"
                          />
                          <button
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-lime-600 text-white text-xs font-semibold rounded">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-lime-500 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Click to upload images
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, WEBP up to 10MB each
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Availability</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="available_from">Available From</Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from || ''}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value || null })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty if available immediately
                  </p>
                </div>

                <div>
                  <Label htmlFor="available_to">Available To</Label>
                  <Input
                    id="available_to"
                    type="date"
                    value={formData.available_to || ''}
                    onChange={(e) => setFormData({ ...formData, available_to: e.target.value || null })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty if available indefinitely
                  </p>
                </div>

                {/* Availability Preview */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                  <div className="font-semibold text-sm text-emerald-900 mb-1">Current Availability</div>
                  <div className="text-sm text-emerald-700">
                    {formData.available_from && formData.available_to
                      ? `${new Date(formData.available_from).toLocaleDateString()} - ${new Date(formData.available_to).toLocaleDateString()}`
                      : formData.available_from
                        ? `From ${new Date(formData.available_from).toLocaleDateString()}`
                        : formData.available_to
                          ? `Until ${new Date(formData.available_to).toLocaleDateString()}`
                          : 'Available now, indefinitely'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditListingPage;
