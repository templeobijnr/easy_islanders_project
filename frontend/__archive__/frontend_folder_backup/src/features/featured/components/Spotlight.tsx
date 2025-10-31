import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spotlightSwap } from '@/shared/motion/variants';
import { ChevronLeft, ChevronRight } from '@/shared/icons';
import IconButton from '@/shared/components';

interface SpotlightItem {
  id: string;
  title: string;
  description: string;
  image: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

interface SpotlightProps {
  items: SpotlightItem[];
  autoPlay?: boolean;
  interval?: number;
}

const Spotlight = ({ items, autoPlay = true, interval = 5000 }: SpotlightProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          variants={spotlightSwap}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex items-center justify-between"
        >
          <div className="flex-1 pr-8">
            <h2 className="text-3xl font-bold mb-4">{currentItem.title}</h2>
            <p className="text-lg opacity-90 mb-6">{currentItem.description}</p>
            {currentItem.ctaText && currentItem.onCtaClick && (
              <button
                onClick={currentItem.onCtaClick}
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-semibold hover:bg-opacity-90 transition-colors"
              >
                {currentItem.ctaText}
              </button>
            )}
          </div>
          <div className="flex-shrink-0">
            <img
              src={currentItem.image}
              alt={currentItem.title}
              className="w-64 h-64 object-cover rounded-2xl"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <>
          <IconButton
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30"
          >
            <ChevronLeft className="w-6 h-6" />
          </IconButton>
          <IconButton
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30"
          >
            <ChevronRight className="w-6 h-6" />
          </IconButton>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Spotlight;