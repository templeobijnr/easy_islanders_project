import React from 'react';
import { useUi } from '../../../shared/context/UiContext';
import { useChat } from '../../../shared/context/ChatContext';

interface Category {
  id: string;
  emoji: string;
  label: string;
  message: string; // Message to auto-send when clicked
  domain: string; // Domain/job to set as active
}

const CATEGORIES: Category[] = [
  {
    id: 'real_estate',
    emoji: '🏠',
    label: 'Real Estate',
    message: 'Show me real estate options',
    domain: 'real_estate',
  },
  {
    id: 'cars',
    emoji: '🚗',
    label: 'Cars',
    message: 'Show me available cars',
    domain: 'general',
  },
  {
    id: 'marketplace',
    emoji: '🛍️',
    label: 'Marketplace',
    message: 'Show me marketplace listings',
    domain: 'general',
  },
  {
    id: 'events',
    emoji: '📅',
    label: 'Events',
    message: 'Show me upcoming events',
    domain: 'general',
  },
  {
    id: 'restaurants',
    emoji: '🍽️',
    label: 'Restaurants',
    message: 'Show me restaurant options',
    domain: 'general',
  },
  {
    id: 'services',
    emoji: '🔧',
    label: 'Services',
    message: 'Show me available services',
    domain: 'services',
  },
  {
    id: 'experiences',
    emoji: '🌴',
    label: 'Experiences',
    message: 'Show me experiences and activities',
    domain: 'general',
  },
  {
    id: 'p2p',
    emoji: '👥',
    label: 'P2P',
    message: 'Show me peer-to-peer options',
    domain: 'general',
  },
];

/**
 * Horizontal scrolling category carousel
 * Clicking a category auto-sends a message and sets context
 */
const CategoryCarousel: React.FC = () => {
  const { activeJob, setActiveJob } = useUi();
  const { send } = useChat();

  const handleCategoryClick = (category: Category) => {
    console.log('[CategoryCarousel] Category clicked:', {
      category: category.id,
      domain: category.domain,
      message: category.message,
    });

    // 1. Set active job context
    setActiveJob(category.domain as any);

    // 2. Auto-send message
    send(category.message);
  };

  return (
    <div className="px-8">
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-4">
          {CATEGORIES.map((category) => {
            const isActive = activeJob === category.domain;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-center text-sm font-medium transition-all duration-200 hover-scale-102 ${
                  isActive
                    ? 'border-ocean-500 bg-ocean-500 text-white'
                    : 'border-sand-200 bg-white text-sand-700 hover:border-ocean-500'
                }`}
              >
                <span className="mr-1 text-base">{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;
