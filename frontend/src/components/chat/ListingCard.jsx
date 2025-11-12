import React from 'react';
import ChatImageBubble from './ChatImageBubble';
import api from '../../api'; // Import the centralized API
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const ListingCard = ({ listing, conversationId, onAgentResponse, onRequestPhotos, onViewPhotos }) => {
  if (!listing) {
    return <div className="p-4 my-2 bg-gray-200 rounded-lg animate-pulse">Loading Details...</div>;
  }

  const hasImages = Array.isArray(listing.image_urls) && listing.image_urls.length > 0;

  const handleViewPhotos = () => {
    if (typeof onViewPhotos === 'function') {
      onViewPhotos(listing.image_urls, listing.id, !!listing.verified_with_photos);
    }
  };

  const handleRequestPhotosClick = async () => {
    try {
      const result = await api.sendChatEvent(conversationId, 'request_photos', { listing_id: listing.id });
      if (typeof onAgentResponse === 'function') {
        onAgentResponse(result);
      }
      // Also call the original prop for polling if it exists
      if (typeof onRequestPhotos === 'function') {
        onRequestPhotos(listing.id);
      }
    } catch (error) {
      console.error("Failed to send request_photos event:", error);
    }
  };

  const handleContactAgentClick = async () => {
    try {
      const result = await api.sendChatEvent(conversationId, 'contact_agent', { listing_id: listing.id });
      if (typeof onAgentResponse === 'function') {
        onAgentResponse(result);
      }
    } catch (error) {
      console.error("Failed to send contact_agent event:", error);
    }
  };

  const handleViewDetails = () => {
    const url = listing.details_url || listing.bookingLink || listing.url;
    if (url) window.open(url, '_blank');
  };

  return (
    <>
      <Card className="max-w-md mx-auto md:max-w-2xl my-4">
        <CardHeader>
          <CardTitle>{listing.title}</CardTitle>
          {listing.location && (
            <p className="text-sm text-muted-foreground mt-1">{listing.location}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <ChatImageBubble 
              message={{
                image_urls: listing.image_urls,
                photos_requested: listing.photos_requested,
                verified_with_photos: listing.verified_with_photos,
                listing_id: listing.id,
                message: ''
              }} 
              onRequestPhotos={onRequestPhotos}
              variant="card"
              showActions={false}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {hasImages ? (
              <Button
                onClick={handleViewPhotos}
                variant="default"
                className="w-full"
                aria-label={`View photos for listing ${listing.id}`}
              >
                View Photos ({listing.image_urls.length})
              </Button>
            ) : (
              <Button
                onClick={handleRequestPhotosClick}
                variant="secondary"
                className="w-full"
                aria-label={`Request photos for listing ${listing.id}`}
              >
                Request Photos
              </Button>
            )}
            <Button
              onClick={handleContactAgentClick}
              variant="premium"
              className="w-full"
              aria-label={`Contact agent for listing ${listing.id}`}
            >
              Contact Agent
            </Button>
            <Button
              onClick={handleViewDetails}
              variant="outline"
              className="w-full"
              aria-label={`View details for listing ${listing.id}`}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ListingCard;