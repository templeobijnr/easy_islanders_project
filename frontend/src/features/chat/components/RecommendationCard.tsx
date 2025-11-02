import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { http } from '../../../api';

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
}

export interface RecommendationCardProps {
  item: RecItem;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item }) => {
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="w-72 text-left shrink-0 rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden transition">
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

        {/* Action Buttons */}
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
    </div>
  );
};

export default RecommendationCard;
