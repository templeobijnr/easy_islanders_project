import React, { useEffect, useState } from 'react';
import config from '../../config';

// Normalize a possibly relative media URL using API base
const resolveUrl = (u) => {
  if (!u) return '';
  const s = String(u).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  // Ensure leading slash
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${config.API_BASE_URL}${path}`;
};

const ImageGallery = ({
  images = [],
  listingId,
  verified = false,
  initialIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex || 0);
  }, [initialIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % Math.max(images.length, 1));
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % Math.max(images.length, 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  const safeImages = (images || []).map(resolveUrl).filter(Boolean);
  const current = safeImages[index] || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white w-full max-w-4xl mx-4 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm text-gray-600">
            {listingId ? `Listing ${listingId}` : 'Photos'} {verified && (
              <span className="ml-2 text-green-600 font-medium">Verified</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <div className="p-4">
          {current ? (
            <div className="w-full">
              <div className="relative w-full h-80 md:h-[28rem] bg-black/5 flex items-center justify-center rounded-md overflow-hidden">
                <img src={current} alt={`Photo ${index + 1}`} className="max-h-full max-w-full object-contain" />
                {safeImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow"
                      onClick={() => setIndex((i) => (i - 1 + safeImages.length) % safeImages.length)}
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow"
                      onClick={() => setIndex((i) => (i + 1) % safeImages.length)}
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {safeImages.length > 1 && (
                <div className="mt-3 grid grid-cols-6 md:grid-cols-8 gap-2 max-h-28 overflow-y-auto pr-1">
                  {safeImages.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      className={`border rounded overflow-hidden ${i === index ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setIndex(i)}
                    >
                      <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-14 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">No images available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;

