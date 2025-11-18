/**
 * ImageGallery - Listing image gallery with lightbox functionality
 * Displays main image with thumbnail navigation and full-screen lightbox
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ListingImage } from '../types';

interface ImageGalleryProps {
  images: ListingImage[];
  title: string;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={`relative bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-500">
          <div className="text-6xl mb-3">🖼️</div>
          <p className="text-sm font-medium">No images available</p>
        </div>
      </div>
    );
  }

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <>
      {/* Main Gallery */}
      <div className={`relative ${className}`}>
        {/* Main Image */}
        <div className="relative aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden group">
          <img
            src={images[currentIndex].image}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Image Counter Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full z-10">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          {/* Expand/Lightbox Button */}
          <button
            onClick={openLightbox}
            className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full transition z-10 opacity-0 group-hover:opacity-100"
            title="View full screen"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>

          {/* Navigation Arrows (show if multiple images) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full transition z-10 opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full transition z-10 opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => handleThumbnailClick(idx)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition ${
                  idx === currentIndex
                    ? 'ring-2 ring-lime-600 shadow-md'
                    : 'opacity-60 hover:opacity-100 border border-slate-200'
                }`}
              >
                <img
                  src={img.image}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <Dialog open={lightboxOpen} onOpenChange={closeLightbox}>
          <DialogContent
            className="max-w-none w-full h-full p-0 bg-black/95 border-none"
            onKeyDown={handleKeyDown}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition z-20"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full z-20">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>

            {/* Title */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg z-20 max-w-md text-center">
              <span className="text-white text-sm font-medium">{title}</span>
            </div>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={images[currentIndex].image}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip at Bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg max-w-full overflow-x-auto z-20">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition ${
                      idx === currentIndex
                        ? 'ring-2 ring-white shadow-lg'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ImageGallery;
