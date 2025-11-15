/**
 * ExploreSpotlight - Auto-rotating carousel for featured listings
 * Desktop-first, with manual navigation controls
 */

import React, { useState, useEffect } from 'react';
import { Listing } from '../types';
import { formatPrice, getPlaceholderImage } from '../constants';

interface ExploreSpotlightProps {
  listings: Listing[];
  intervalMs?: number;
  onListingClick?: (listing: Listing) => void;
}

const ExploreSpotlight: React.FC<ExploreSpotlightProps> = ({
  listings,
  intervalMs = 4000,
  onListingClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate effect
  useEffect(() => {
    if (!listings || listings.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [listings, intervalMs]);

  // Handle manual navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!listings || listings.length === 0) {
    return null;
  }

  const currentListing = listings[currentIndex];
  const imageUrl =
    currentListing.images && currentListing.images.length > 0
      ? currentListing.images[0].image
      : getPlaceholderImage(currentListing.category.slug, parseInt(currentListing.id.slice(-2), 16));

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-lime-50 to-emerald-50 border border-slate-200">
      {/* Main content */}
      <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-6 p-6 md:p-8">
        {/* Left: Text content */}
        <div className="flex-1 space-y-3 md:space-y-4 text-center md:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-600 text-white text-sm font-semibold shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Listing
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 line-clamp-2">
            {currentListing.title}
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-sm md:text-base line-clamp-3">
            {currentListing.description}
          </p>

          {/* Features row */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-slate-700">
            {currentListing.location && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium">{currentListing.location}</span>
              </div>
            )}

            {currentListing.subcategory && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200">
                <span className="font-medium">{currentListing.subcategory.name}</span>
              </div>
            )}
          </div>

          {/* Price and CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div className="text-3xl md:text-4xl font-bold text-lime-600">
              {formatPrice(currentListing.price, currentListing.currency)}
            </div>

            <button
              onClick={() => onListingClick && onListingClick(currentListing)}
              className="px-6 md:px-8 py-3 md:py-3.5 rounded-xl bg-lime-600 text-white font-semibold text-sm md:text-base hover:bg-lime-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              View Details →
            </button>
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative w-full md:w-96 lg:w-1/3 h-64 md:h-80 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <img
            src={imageUrl}
            alt={currentListing.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Navigation controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-lime-600 transition-all shadow-lg hover:shadow-xl"
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-lime-600 transition-all shadow-lg hover:shadow-xl"
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot indicators */}
      {listings.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {listings.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-8 bg-lime-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreSpotlight;
