/**
 * Constants for Explore North Cyprus
 */

import { LaneConfig, Listing } from './types';

// Category display metadata (synced with backend but with frontend-specific additions)
export const CATEGORY_METADATA = {
  properties: {
    slug: 'properties',
    name: 'Properties',
    icon: '🏠',
    color: '#6CC24A',
    description: 'Find your perfect place',
  },
  cars: {
    slug: 'cars',
    name: 'Cars',
    icon: '🚗',
    color: '#3B82F6',
    description: 'Buy or rent vehicles',
  },
  marketplace: {
    slug: 'marketplace',
    name: 'Marketplace',
    icon: '🛍️',
    color: '#F59E0B',
    description: 'Buy and sell locally',
  },
  events: {
    slug: 'events',
    name: 'Events',
    icon: '📅',
    color: '#EC4899',
    description: 'Discover happenings',
  },
  activities: {
    slug: 'activities',
    name: 'Activities',
    icon: '🎯',
    color: '#8B5CF6',
    description: 'Explore things to do',
  },
  services: {
    slug: 'services',
    name: 'Services',
    icon: '🔧',
    color: '#10B981',
    description: 'Professional help',
  },
  beaches: {
    slug: 'beaches',
    name: 'Beaches',
    icon: '🏖️',
    color: '#06B6D4',
    description: 'Beach experiences',
  },
  p2p: {
    slug: 'p2p',
    name: 'P2P',
    icon: '🤝',
    color: '#F97316',
    description: 'Community sharing',
  },
} as const;

// Horizontal lanes configuration
export const EXPLORE_LANES: LaneConfig[] = [
  {
    id: 'trending',
    title: 'Trending',
    emoji: '🔥',
    filter: (listings: Listing[]) => {
      // Sort by views (most viewed)
      return [...listings]
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);
    },
  },
  {
    id: 'recent',
    title: 'Recently Added',
    emoji: '✨',
    filter: (listings: Listing[]) => {
      // Sort by created_at (newest)
      return [...listings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);
    },
  },
  {
    id: 'gems',
    title: 'Hidden Gems',
    emoji: '💎',
    filter: (listings: Listing[]) => {
      // Low views but high quality (featured or good price)
      return [...listings]
        .filter(l => l.views < 50 && (l.is_featured || parseFloat(String(l.price)) < 100))
        .slice(0, 8);
    },
  },
  {
    id: 'deals',
    title: 'Best Deals',
    emoji: '💰',
    filter: (listings: Listing[]) => {
      // Featured items with good prices
      return [...listings]
        .filter(l => l.is_featured)
        .sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)))
        .slice(0, 8);
    },
  },
];

// Placeholder image generator (using Unsplash)
export const getPlaceholderImage = (category: string, index: number = 0): string => {
  const seeds = {
    properties: ['house', 'apartment', 'villa', 'home', 'real-estate'],
    cars: ['car', 'vehicle', 'automobile', 'sedan', 'suv'],
    marketplace: ['product', 'shopping', 'commerce', 'goods'],
    events: ['event', 'concert', 'party', 'festival', 'celebration'],
    activities: ['activity', 'adventure', 'tour', 'experience', 'fun'],
    services: ['service', 'professional', 'work', 'business'],
    beaches: ['beach', 'ocean', 'sea', 'sand', 'coast'],
    p2p: ['community', 'people', 'sharing', 'together'],
  };

  const categorySeeds = seeds[category as keyof typeof seeds] || ['cyprus', 'landscape'];
  const seed = categorySeeds[index % categorySeeds.length];

  return `https://source.unsplash.com/800x600/?${seed},cyprus&${index}`;
};

// Format price for display
export const formatPrice = (price: string | number, currency: string = 'EUR'): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) return 'Price on request';

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;

  if (numPrice === 0) return 'Free';

  // Format with commas
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);

  return `${currencySymbol}${formatted}`;
};

// Extract amenities/features from dynamic_fields
export const extractFeatures = (listing: Listing): string[] => {
  const features: string[] = [];
  const fields = listing.dynamic_fields || {};

  // Properties
  if (fields.bedrooms) features.push(`${fields.bedrooms} bed`);
  if (fields.bathrooms) features.push(`${fields.bathrooms} bath`);
  if (fields.square_meters) features.push(`${fields.square_meters}m²`);
  if (fields.furnished) features.push('Furnished');
  if (fields.parking) features.push('Parking');
  if (fields.pool) features.push('Pool');
  if (fields.sea_view) features.push('Sea view');
  if (fields.pet_friendly) features.push('Pet friendly');

  // Cars
  if (fields.year) features.push(String(fields.year));
  if (fields.transmission) features.push(fields.transmission);
  if (fields.fuel_type) features.push(fields.fuel_type);
  if (fields.mileage) features.push(`${fields.mileage}km`);

  // Events/Activities
  if (fields.duration) features.push(fields.duration);
  if (fields.difficulty) features.push(fields.difficulty);
  if (fields.capacity) features.push(`Max ${fields.capacity}`);

  // Marketplace
  if (fields.condition) features.push(fields.condition);
  if (fields.brand) features.push(fields.brand);

  return features.slice(0, 4); // Limit to 4 features for UI
};
