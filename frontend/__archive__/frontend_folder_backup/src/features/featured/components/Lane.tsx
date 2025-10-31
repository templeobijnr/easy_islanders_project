import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@/shared/icons';
import IconButton from '@/shared/components';
import Card from '@/shared/components';

interface LaneItem {
  id: string;
  title: string;
  image: string;
  onClick?: () => void;
}

interface LaneProps {
  title: string;
  items: LaneItem[];
  onViewAll?: () => void;
}

const Lane = ({ title, items, onViewAll }: LaneProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !isLoaded) {
          setIsLoaded(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoaded]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </button>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="list"
        >
          {isLoaded && items.map((item) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 w-64"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              role="listitem"
            >
              <Card onClick={item.onClick} className="cursor-pointer overflow-hidden" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.onClick?.(); } }}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {items.length > 3 && (
          <>
            <IconButton
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md shadow-soft hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </IconButton>
            <IconButton
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md shadow-soft hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronRight className="w-5 h-5" />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
};

export default Lane;