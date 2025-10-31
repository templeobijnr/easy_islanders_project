import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@/shared/icons';
import IconButton from '@/shared/components';
import Card from '@/shared/components';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  image?: string;
}

interface InlineRecsCarouselProps {
  recommendations: Recommendation[];
  onSelectRecommendation: (rec: Recommendation) => void;
}

const InlineRecsCarousel = ({ recommendations, onSelectRecommendation }: InlineRecsCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (scrollRef.current) {
        const scrollAmount = 300;
        scrollRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    }, 150);
  }, []);

  return (
    <div className="relative px-6 py-4">
      <div className="flex items-center space-x-3">
        <IconButton onClick={() => scroll('left')} children={<ChevronLeft className="w-5 h-5" />} />

        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex space-x-4 pb-2" role="list">
            {recommendations.map((rec) => (
              <motion.div
                key={rec.id}
                className="flex-shrink-0 w-64"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                role="listitem"
              >
                <Card onClick={() => onSelectRecommendation(rec)} className="cursor-pointer">
                  {rec.image && (
                    <img
                      src={rec.image}
                      alt={rec.title}
                      className="w-full h-32 object-cover rounded-t-2xl mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-slate-900 mb-1">{rec.title}</h3>
                  <p className="text-sm text-slate-600">{rec.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <IconButton onClick={() => scroll('right')} children={<ChevronRight className="w-5 h-5" />} />
      </div>
    </div>
  );
};

export default InlineRecsCarousel;