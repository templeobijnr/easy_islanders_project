import React from 'react';
import ChatImageBubble from './ChatImageBubble';
import api from '../../api'; // Import the centralized API

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
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl my-4 p-6">
        <h3 className="text-xl font-bold text-gray-900">{listing.title}</h3>
        {listing.location && (
          <div className="text-sm text-gray-600 mt-1">{listing.location}</div>
        )}
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
            <button
              onClick={handleViewPhotos}
              className="w-full bg-indigo-600 text-white py-2.5 px-2 rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              aria-label={`View photos for listing ${listing.id}`}
            >
              View Photos ({listing.image_urls.length})
            </button>
          ) : (
            <button
              onClick={handleRequestPhotosClick}
              className="w-full bg-orange-600 text-white py-2.5 px-2 rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              aria-label={`Request photos for listing ${listing.id}`}
            >
              Request Photos
            </button>
          )}
          <button
            onClick={handleContactAgentClick}
            className="w-full bg-green-600 text-white py-2.5 px-2 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            aria-label={`Contact agent for listing ${listing.id}`}
          >
            Contact Agent
          </button>
          <button
            onClick={handleViewDetails}
            className="w-full bg-blue-600 text-white py-2.5 px-2 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`View details for listing ${listing.id}`}
          >
            View Details
          </button>
        </div>
      </div>
    </>
  );
};

export default ListingCard;
