/**
 * Category Design System
 * Defines visual identity for all marketplace categories and subcategories
 * Used across dashboard pages for consistent multi-domain representation
 */

import {
  Car,
  Building2,
  Sparkles,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryDesign {
  name: string;
  slug: string;
  icon: LucideIcon;
  gradient: string;
  gradientLight: string;
  gradientDark: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  subcategories?: SubcategoryDesign[];
}

export interface SubcategoryDesign {
  name: string;
  slug: string;
  description?: string;
}

export const CATEGORY_DESIGN: Record<string, CategoryDesign> = {
  'car-rental': {
    name: 'Car Rental',
    slug: 'car-rental',
    icon: Car,
    gradient: 'from-orange-500 via-pink-500 to-pink-600',
    gradientLight: 'from-orange-50 via-pink-50 to-pink-100',
    gradientDark: 'from-orange-600 via-pink-600 to-pink-700',
    accentColor: 'orange-500',
    borderColor: 'border-orange-200',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    description: 'List your vehicles, boats, or equipment for rent',
    subcategories: [
      { name: 'Economy Cars', slug: 'economy-cars', description: 'Budget-friendly vehicles' },
      { name: 'Luxury Cars', slug: 'luxury-cars', description: 'Premium and high-end vehicles' },
      { name: 'SUVs & Vans', slug: 'suvs-vans', description: 'Family and group transport' },
      { name: 'Motorcycles & Scooters', slug: 'motorcycles-scooters', description: 'Two-wheelers' },
      { name: 'Boats & Yachts', slug: 'boats-yachts', description: 'Marine vessels' },
      { name: 'Bicycles & E-bikes', slug: 'bicycles-ebikes', description: 'Pedal and electric bikes' },
    ],
  },
  'accommodation': {
    name: 'Accommodation',
    slug: 'accommodation',
    icon: Building2,
    gradient: 'from-violet-500 via-purple-500 to-purple-600',
    gradientLight: 'from-violet-50 via-purple-50 to-purple-100',
    gradientDark: 'from-violet-600 via-purple-600 to-purple-700',
    accentColor: 'violet-500',
    borderColor: 'border-violet-200',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-700',
    description: 'Rent out your property, rooms, or vacation homes',
    subcategories: [
      { name: 'Hotels & Resorts', slug: 'hotels-resorts', description: 'Full-service accommodations' },
      { name: 'Villas & Houses', slug: 'villas-houses', description: 'Private vacation homes' },
      { name: 'Apartments', slug: 'apartments', description: 'Rental apartments and flats' },
      { name: 'Hostels & Dorms', slug: 'hostels-dorms', description: 'Budget shared accommodations' },
      { name: 'Boutique Hotels', slug: 'boutique-hotels', description: 'Unique themed stays' },
      { name: 'Camping & Glamping', slug: 'camping-glamping', description: 'Outdoor accommodations' },
    ],
  },
  'activities': {
    name: 'Activities',
    slug: 'activities',
    icon: Sparkles,
    gradient: 'from-cyan-500 via-blue-500 to-blue-600',
    gradientLight: 'from-cyan-50 via-blue-50 to-blue-100',
    gradientDark: 'from-cyan-600 via-blue-600 to-blue-700',
    accentColor: 'cyan-500',
    borderColor: 'border-cyan-200',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-700',
    description: 'Offer tours, experiences, and entertainment',
    subcategories: [
      { name: 'Water Sports', slug: 'water-sports', description: 'Diving, surfing, kayaking' },
      { name: 'Tours & Excursions', slug: 'tours-excursions', description: 'Guided tours and trips' },
      { name: 'Adventure Activities', slug: 'adventure-activities', description: 'Hiking, climbing, zip-lining' },
      { name: 'Cultural Experiences', slug: 'cultural-experiences', description: 'Museums, workshops, classes' },
      { name: 'Nightlife & Entertainment', slug: 'nightlife-entertainment', description: 'Clubs, shows, events' },
      { name: 'Wellness & Spa', slug: 'wellness-spa', description: 'Massage, yoga, wellness' },
    ],
  },
  'dining': {
    name: 'Dining',
    slug: 'dining',
    icon: UtensilsCrossed,
    gradient: 'from-emerald-500 via-teal-500 to-teal-600',
    gradientLight: 'from-emerald-50 via-teal-50 to-teal-100',
    gradientDark: 'from-emerald-600 via-teal-600 to-teal-700',
    accentColor: 'emerald-500',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    description: 'Showcase your restaurant, café, or catering services',
    subcategories: [
      { name: 'Restaurants', slug: 'restaurants', description: 'Full-service dining' },
      { name: 'Cafés & Coffee Shops', slug: 'cafes-coffee', description: 'Casual café experiences' },
      { name: 'Bars & Pubs', slug: 'bars-pubs', description: 'Drink establishments' },
      { name: 'Fine Dining', slug: 'fine-dining', description: 'Upscale restaurants' },
      { name: 'Street Food & Markets', slug: 'street-food-markets', description: 'Casual outdoor food' },
      { name: 'Catering Services', slug: 'catering-services', description: 'Event catering' },
    ],
  },
  'beaches': {
    name: 'Beaches',
    slug: 'beaches',
    icon: Waves,
    gradient: 'from-yellow-500 via-amber-500 to-amber-600',
    gradientLight: 'from-yellow-50 via-amber-50 to-amber-100',
    gradientDark: 'from-yellow-600 via-amber-600 to-amber-700',
    accentColor: 'yellow-500',
    borderColor: 'border-yellow-200',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
    description: 'List beach clubs, sunbed rentals, and coastal services',
    subcategories: [
      { name: 'Beach Clubs', slug: 'beach-clubs', description: 'Private beach club access' },
      { name: 'Sunbed Rentals', slug: 'sunbed-rentals', description: 'Beach lounger rentals' },
      { name: 'Water Equipment', slug: 'water-equipment', description: 'Snorkeling, paddle boards' },
      { name: 'Beach Bars', slug: 'beach-bars', description: 'Beachside refreshments' },
      { name: 'Beach Activities', slug: 'beach-activities', description: 'Beach volleyball, yoga' },
      { name: 'Boat Services', slug: 'boat-services', description: 'Boat trips from beach' },
    ],
  },
};

/**
 * Get category design by slug
 */
export function getCategoryDesign(slug: string): CategoryDesign | undefined {
  return CATEGORY_DESIGN[slug];
}

/**
 * Get all categories as array
 */
export function getAllCategories(): CategoryDesign[] {
  return Object.values(CATEGORY_DESIGN);
}

/**
 * Get category icon component
 */
export function getCategoryIcon(slug: string): LucideIcon {
  const category = getCategoryDesign(slug);
  return category?.icon || Building2;
}

/**
 * Get subcategories for a category
 */
export function getSubcategories(categorySlug: string): SubcategoryDesign[] {
  const category = getCategoryDesign(categorySlug);
  return category?.subcategories || [];
}

/**
 * Get full gradient class for a category
 */
export function getCategoryGradient(slug: string, variant: 'default' | 'light' | 'dark' = 'default'): string {
  const category = getCategoryDesign(slug);
  if (!category) return 'from-gray-500 to-gray-600';

  switch (variant) {
    case 'light':
      return category.gradientLight;
    case 'dark':
      return category.gradientDark;
    default:
      return category.gradient;
  }
}

/**
 * Get category badge classes
 */
export function getCategoryBadgeClasses(slug: string): string {
  const category = getCategoryDesign(slug);
  if (!category) return 'bg-gray-100 text-gray-700 border-gray-200';

  return `${category.badgeBg} ${category.badgeText} ${category.borderColor}`;
}
