/**
 * ListingDetailModal - Full-screen listing detail view with booking capability
 * Displays complete listing information with image gallery, reviews, host profile, and booking form
 */

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  X,
  MapPin,
  Star,
  Heart,
  Calendar,
  Users,
  Bed,
  Bath,
  Home,
  Wifi,
  Car,
  Utensils,
  Wind,
  Tv,
  Check,
} from 'lucide-react';
import { Listing } from '../types';
import ImageGallery from './ImageGallery';
import ReviewsList, { Review } from './ReviewsList';
import HostProfile, { Host } from './HostProfile';
import ShareButton from './ShareButton';

interface ListingDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (listingId: string, dates: { checkIn: string; checkOut: string; guests: number }) => void;
}

// Amenities icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  kitchen: <Utensils className="w-5 h-5" />,
  'air conditioning': <Wind className="w-5 h-5" />,
  tv: <Tv className="w-5 h-5" />,
  pool: <Home className="w-5 h-5" />,
  default: <Check className="w-5 h-5" />,
};

// Mock host data generator (TODO: Replace with API call)
const generateMockHost = (owner: { id: string; username: string }): Host => {
  return {
    id: owner.id,
    username: owner.username,
    full_name: owner.username,
    bio: 'Experienced host passionate about providing exceptional stays in North Cyprus. I love sharing my knowledge of the local area and ensuring my guests have memorable experiences.',
    joined_date: '2023-01-15T00:00:00Z',
    is_verified: true,
    is_superhost: true,
    stats: {
      total_listings: 8,
      completed_bookings: 156,
      response_rate: 98,
      response_time: 'within 1 hour',
      rating: 4.8,
      reviews_count: 127,
    },
    location: 'Kyrenia, North Cyprus',
    languages: ['English', 'Turkish', 'Russian'],
  };
};

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onBook,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);

  if (!listing) return null;

  const host = generateMockHost(listing.owner);
  const shareUrl = `${window.location.origin}/listing/${listing.id}`;

  // Extract amenities from dynamic_fields (Real Estate example)
  const amenities = listing.dynamic_fields?.amenities || [
    'WiFi',
    'Parking',
    'Kitchen',
    'Air Conditioning',
    'TV',
  ];

  // Extract property details
  const bedrooms = listing.dynamic_fields?.bedrooms || 2;
  const bathrooms = listing.dynamic_fields?.bathrooms || 2;
  const propertyType = listing.dynamic_fields?.property_type || 'Apartment';

  // Calculate nights and total (mock)
  const calculateNights = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();
  const pricePerNight = typeof listing.price === 'number' ? listing.price : parseFloat(listing.price.toString().replace(/[^0-9.]/g, ''));
  const totalPrice = nights * pricePerNight;
  const serviceFee = totalPrice * 0.1; // 10% service fee
  const grandTotal = totalPrice + serviceFee;

  const handleBooking = () => {
    if (onBook && checkInDate && checkOutDate) {
      onBook(listing.id, {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
      });
    }
  };

  const handleContactHost = () => {
    // TODO: Open chat with host
    console.log('Contact host:', host.id);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: API call to save favorite
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-full h-full p-0 bg-gradient-to-br from-lime-50/50 via-emerald-50/50 to-sky-50/50 overflow-y-auto">
        {/* Fixed Header Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition"
              title="Close"
            >
              <X className="w-6 h-6 text-slate-700" />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ShareButton
                url={shareUrl}
                title={listing.title}
                description={listing.description}
              />
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm ${
                  isFavorite
                    ? 'bg-pink-100 border border-pink-300 text-pink-600'
                    : 'bg-white/80 backdrop-blur-sm border border-white/60 text-slate-700 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-600' : ''}`} />
                <span className="hidden md:inline">{isFavorite ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Image Gallery */}
          <div className="mb-8">
            <ImageGallery
              images={listing.images || []}
              title={listing.title}
              className="w-full"
            />
          </div>

          {/* Two-Column Layout: Content + Booking Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Main Content */}
            <div className="flex-1 space-y-8">
              {/* Header Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6">
                {/* Title & Location */}
                <div className="mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-slate-900">4.8</span>
                      <span className="text-sm">(127 reviews)</span>
                    </div>
                    {listing.location && (
                      <>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-5 h-5 text-slate-500" />
                          <span>{listing.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Property Details (for Real Estate) */}
                {listing.category.slug === 'real-estate' && (
                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Bed className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">{bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Bath className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">{bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Home className="w-5 h-5 text-slate-500" />
                      <span className="font-medium">{propertyType}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">About this place</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity: string, idx: number) => {
                      const key = amenity.toLowerCase();
                      const icon = amenityIcons[key] || amenityIcons.default;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-lime-100 text-lime-600">
                            {icon}
                          </div>
                          <span className="text-slate-700 font-medium">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Reviews</h2>
                <ReviewsList listingId={listing.id} averageRating={4.8} totalReviews={127} />
              </div>

              {/* Host Profile */}
              <HostProfile host={host} onContactHost={handleContactHost} />
            </div>

            {/* Right Column: Booking Sidebar (Sticky) */}
            <div className="lg:w-96">
              <div className="sticky top-24">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl p-6">
                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {listing.currency === 'USD' ? '$' : '€'}
                        {pricePerNight.toLocaleString()}
                      </span>
                      <span className="text-slate-600">/ night</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-slate-900">4.8</span>
                      <span>(127 reviews)</span>
                    </div>
                  </div>

                  {/* Booking Form */}
                  <div className="space-y-4">
                    {/* Dates */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Check-in / Check-out
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent"
                        />
                        <input
                          type="date"
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          min={checkInDate || new Date().toISOString().split('T')[0]}
                          className="px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Guests
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          value={guests}
                          onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                          min={1}
                          max={10}
                          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-600 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    {nights > 0 && (
                      <div className="pt-4 border-t border-slate-200 space-y-2">
                        <div className="flex justify-between text-slate-700">
                          <span>
                            {listing.currency === 'USD' ? '$' : '€'}
                            {pricePerNight.toLocaleString()} × {nights} nights
                          </span>
                          <span>
                            {listing.currency === 'USD' ? '$' : '€'}
                            {totalPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Service fee</span>
                          <span>
                            {listing.currency === 'USD' ? '$' : '€'}
                            {serviceFee.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                          <span>Total</span>
                          <span>
                            {listing.currency === 'USD' ? '$' : '€'}
                            {grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Book Button */}
                    <button
                      onClick={handleBooking}
                      disabled={!checkInDate || !checkOutDate || nights === 0}
                      className="w-full px-6 py-4 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl hover:from-lime-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-lime-500 disabled:hover:to-emerald-500"
                    >
                      {nights > 0 ? `Book ${nights} ${nights === 1 ? 'Night' : 'Nights'}` : 'Select Dates'}
                    </button>

                    {/* Free Cancellation Notice */}
                    <p className="text-xs text-center text-slate-600">
                      Free cancellation up to 48 hours before check-in
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetailModal;
