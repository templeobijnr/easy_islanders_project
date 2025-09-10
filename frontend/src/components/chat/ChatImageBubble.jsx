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
}) => {
  const [open, setOpen] = useState(false);
  const images = (message.image_urls || []).map(resolveUrl).filter(Boolean);
  const verified = !!message.verified_with_photos;
  const listingId = message.listing_id;
  const text = message.message || 'New images received';

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-white border rounded-r-xl rounded-tl-xl shadow-sm px-4 py-3">
        <div className="text-sm text-gray-800 mb-2">{text}</div>
        {images.length > 0 ? (
          <div>
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((src, idx) => (
                <div key={`${src}-${idx}`} className="relative w-24 h-24 md:w-28 md:h-28 bg-gray-100 rounded overflow-hidden">
                  <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 5 && images.length > 6 && (
                    <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm">+{images.length - 6}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Open Gallery
              </button>
              {verified && (
                <span className="text-xs text-green-600">Verified</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No images found.</div>
        )}
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

