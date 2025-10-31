import React, { useState } from 'react';
import ImageGallery from '../common/ImageGallery';
import config from '../../config';

const resolveUrl = (u) => {
  if (!u) return '';
  const s = String(u).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${config.API_BASE_URL}${s.startsWith('/') ? s : `/${s}`}`;
};

const ChatImageBubble = ({
  message,
  onRequestPhotos,
  variant = 'bubble',  // New prop: 'bubble' or 'card'
  showActions = true,
}) => {
  const [open, setOpen] = useState(false);
  const images = (message.image_urls || []).map(resolveUrl).filter(Boolean);
  const verified = !!message.verified_with_photos;
  const listingId = message.listing_id;
  const text = message.message || 'New images received';
  
  const hasImages = images.length > 0;
  const photosRequested = message.photos_requested || false;
  
  const isCardVariant = variant === 'card';
  
  const renderContent = () => {
    if (!showActions) return null;
    if (hasImages) {
      return (
        <button 
          onClick={() => setOpen(true)} 
          className={`bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm ${isCardVariant ? 'w-full' : ''}`}
        >
          View Photos ({images.length})
        </button>
      );
    } else if (photosRequested) {
      return <p className={`text-gray-500 italic ${isCardVariant ? 'text-xs' : ''}`}>Waiting for photos from agent...</p>;
    } else {
      return (
        <button 
          onClick={() => onRequestPhotos(listingId)} 
          className={`bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm ${isCardVariant ? 'w-full' : ''}`}
        >
          Request Photos
        </button>
      );
    }
  };
  
  return (
    <div className={`flex justify-start ${isCardVariant ? 'w-full' : ''}`}>
      <div className={`max-w-2xl bg-white border rounded-r-xl rounded-tl-xl shadow-sm px-4 py-3 ${isCardVariant ? 'p-2' : ''}`}>
        {!isCardVariant && <div className="text-sm text-gray-800 mb-2">{text}</div>}
        {images.length > 0 ? (
          <div className={`${isCardVariant ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-3 gap-2'}`}>
            {images.slice(0, isCardVariant ? 4 : 6).map((src, idx) => (
              <div key={`${src}-${idx}`} className={`relative ${isCardVariant ? 'w-16 h-16' : 'w-24 h-24 md:w-28 md:h-28'} bg-gray-100 rounded overflow-hidden`}>
                <img src={src} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === (isCardVariant ? 3 : 5) && images.length > (isCardVariant ? 4 : 6) && (
                  <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs">+{images.length - (isCardVariant ? 4 : 6)}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-sm text-gray-500 ${isCardVariant ? 'text-center' : ''}`}>No images found.</div>
        )}
        <div className={`mt-3 flex items-center gap-2 ${isCardVariant ? 'justify-center' : ''}`}>
          {renderContent()}
          {verified && (
            <span className={`text-xs text-green-600 ${isCardVariant ? 'ml-2' : ''}`}>Verified</span>
          )}
        </div>
      </div>
      {open && (
        <ImageGallery
          images={images}
          listingId={listingId}
          verified={verified}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatImageBubble;

