import React, { useState } from 'react';
import { Heart, Image as ImageIcon, Info, Calendar } from 'lucide-react';
import { http } from '../../../api';
import { useChat } from '../../../shared/context/ChatContext';
import GalleryModal from './GalleryModal';
import InfoModal from './InfoModal';

/**
 * Standardized recommendation card component
 * Used in: InlineRecsCarousel, Featured, and search results
 */
export interface RecItem {
  id: string;
  title: string;
  subtitle?: string;
  reason?: string; // Legacy support
  price?: string;
  rating?: number;
  distanceMins?: number;
  badges?: string[];
  imageUrl?: string;
  area?: string;
  galleryImages?: string[]; // Array of image URLs for gallery
  metadata?: {
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    sqm?: number;
    description?: string;
    rent_type?: string;
  };
}

export interface RecommendationCardProps {
  item: RecItem;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { sendUserEvent } = useChat();

  // Send listing selection event to backend for agent awareness
  const handleCardClick = () => {
    console.log('[RecCard] User clicked on listing:', item.id);
    sendUserEvent?.({
      type: 'select_listing',
      payload: {
        listing_id: item.id,
        title: item.title,
        price: item.price,
        area: item.area,
        imageUrl: item.imageUrl,
        metadata: item.metadata,
      },
    });
  };

  const handleViewGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGalleryOpen(true);
  };

  const handleViewInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInfoOpen(true);
  };

  const handleCheckAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await http.post('/api/v1/availability/check/', { listing_id: item.id });
      console.log('Availability check request sent');
      // User will see response in chat automatically
    } catch (error) {
      console.error('Availability check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await http.post('/api/bookings/', { listing_id: item.id });
      // TODO: Show success toast
      console.log('Reservation successful');
    } catch (error) {
      console.error('Reservation failed:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await http.post('/api/v1/requests/', {
        subject: `Interest in listing ${item.id}`,
        listing_id: item.id,
        channel: 'chat'
      });
      // TODO: Show success toast
      console.log('Contact request sent');
    } catch (error) {
      console.error('Contact request failed:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-72 text-left shrink-0 rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden transition cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-400 relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          'image'
        )}
        <button
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition"
          aria-label="Add to favorites"
        >
          <Heart className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        <div className="text-sm font-semibold line-clamp-1">{item.title}</div>

        {/* Subtitle or Reason */}
        {(item.subtitle || item.reason) && (
          <div className="text-xs text-slate-600 line-clamp-2">
            {item.subtitle || item.reason}
          </div>
        )}

        {/* Area and Rating */}
        <div className="flex items-center justify-between text-xs">
          {item.area && <span className="text-slate-600">{item.area}</span>}
          {item.rating && (
            <span className="px-2 py-0.5 rounded-full border border-slate-200">
              ⭐ {item.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Price */}
        {item.price && <div className="font-semibold text-sm">{item.price}</div>}

        {/* Optional Badges */}
        {item.badges && item.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.badges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Distance Info */}
        {item.distanceMins !== undefined && (
          <div className="text-[10px] text-slate-500">
            {item.distanceMins} min away
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            onClick={handleViewGallery}
            className="p-2 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
            title="View Photos"
          >
            <ImageIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Photos</span>
          </button>
          <button
            onClick={handleViewInfo}
            className="p-2 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
            title="View Details"
          >
            <Info className="h-3 w-3" />
            <span className="hidden sm:inline">Info</span>
          </button>
          <button
            onClick={handleCheckAvailability}
            disabled={isLoading}
            className="p-2 text-xs bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-1"
            title="Check Availability"
          >
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">Check</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleReserve}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-lime-600 text-white text-sm rounded-lg hover:bg-lime-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Reserve'}
          </button>
          <button
            onClick={handleContact}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
          >
            Contact
          </button>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <GalleryModal
          images={item.galleryImages || (item.imageUrl ? [item.imageUrl] : [])}
          title={item.title}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}

      {/* Info Modal */}
      {isInfoOpen && (
        <InfoModal
          item={item}
          onClose={() => setIsInfoOpen(false)}
        />
      )}
    </div>
  );
};

export default RecommendationCard;
