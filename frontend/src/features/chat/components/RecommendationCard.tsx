import React, { useState } from 'react';
import { Heart, Image as ImageIcon, Info, Calendar } from 'lucide-react';
import { http } from '../../../api';
import GalleryModal from './GalleryModal';
import InfoModal from './InfoModal';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

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
    <Card className="w-72 text-left shrink-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="h-28 bg-muted flex items-center justify-center text-muted-foreground relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            'image'
          )}
          <button
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 hover:bg-background transition"
            aria-label="Add to favorites"
          >
            <Heart className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-2">
          <div className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</div>

          {/* Subtitle or Reason */}
          {(item.subtitle || item.reason) && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {item.subtitle || item.reason}
            </div>
          )}

          {/* Area and Rating */}
          <div className="flex items-center justify-between text-xs">
            {item.area && <span className="text-muted-foreground">{item.area}</span>}
            {item.rating && (
              <span className="px-2 py-0.5 rounded-full border border-border bg-muted">
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
                <Badge key={idx} variant="secondary" className="text-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Distance Info */}
          {item.distanceMins !== undefined && (
            <div className="text-[10px] text-muted-foreground">
              {item.distanceMins} min away
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            <Button variant="ghost" size="sm" onClick={handleViewGallery} className="flex-1">
              <ImageIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Photos</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleViewInfo} className="flex-1">
                    <Info className="h-3 w-3" />
                    <span className="hidden sm:inline">Info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View property details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="sm" onClick={handleCheckAvailability} disabled={isLoading} className="flex-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Check</span>
            </Button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="premium" onClick={handleReserve} disabled={isLoading} className="flex-1">
              {isLoading ? 'Loading...' : 'Reserve'}
            </Button>
            <Button variant="outline" onClick={handleContact} disabled={isLoading} className="flex-1">
              Contact
            </Button>
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
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
