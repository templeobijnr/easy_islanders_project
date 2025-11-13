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
  ShoppingBag,
  Wrench,
  Briefcase,
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
  'products': {
    name: 'Products',
    slug: 'products',
    icon: ShoppingBag,
    gradient: 'from-indigo-500 via-blue-500 to-blue-600',
    gradientLight: 'from-indigo-50 via-blue-50 to-blue-100',
    gradientDark: 'from-indigo-600 via-blue-600 to-blue-700',
    accentColor: 'indigo-500',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    description: 'Buy and sell goods, electronics, and merchandise',
    subcategories: [
      { name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, gadgets' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
      { name: 'Home & Living', slug: 'home-living', description: 'Furniture and decor' },
      { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Equipment and apparel' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Cosmetics and wellness' },
      { name: 'Vehicles & Parts', slug: 'vehicles-parts', description: 'Auto accessories' },
    ],
  },
  'vehicles': {
    name: 'Vehicles',
    slug: 'vehicles',
    icon: Car,
    gradient: 'from-slate-500 via-gray-500 to-gray-600',
    gradientLight: 'from-slate-50 via-gray-50 to-gray-100',
    gradientDark: 'from-slate-600 via-gray-600 to-gray-700',
    accentColor: 'slate-500',
    borderColor: 'border-slate-200',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    description: 'Cars, motorcycles, boats, and vehicle rentals',
    subcategories: [
      { name: 'Cars', slug: 'cars', description: 'Sedans, SUVs, trucks' },
      { name: 'Motorcycles', slug: 'motorcycles', description: 'Bikes and scooters' },
      { name: 'Boats', slug: 'boats', description: 'Watercraft and yachts' },
      { name: 'Bicycles', slug: 'bicycles', description: 'Pedal and electric bikes' },
      { name: 'Vehicle Parts', slug: 'vehicle-parts', description: 'Accessories and components' },
    ],
  },
  'services': {
    name: 'Services',
    slug: 'services',
    icon: Wrench,
    gradient: 'from-rose-500 via-pink-500 to-pink-600',
    gradientLight: 'from-rose-50 via-pink-50 to-pink-100',
    gradientDark: 'from-rose-600 via-pink-600 to-pink-700',
    accentColor: 'rose-500',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    description: 'Professional services and freelance work',
    subcategories: [
      { name: 'Cleaning', slug: 'cleaning', description: 'Home and office cleaning' },
      { name: 'Maintenance', slug: 'maintenance', description: 'Repairs and upkeep' },
      { name: 'Transportation', slug: 'transportation', description: 'Taxi and delivery' },
      { name: 'Photography', slug: 'photography', description: 'Events and portraits' },
      { name: 'Tutoring', slug: 'tutoring', description: 'Education and training' },
      { name: 'Digital Services', slug: 'digital-services', description: 'Web and IT services' },
    ],
  },
  'local_businesses': {
    name: 'Local Businesses',
    slug: 'local_businesses',
    icon: Briefcase,
    gradient: 'from-lime-500 via-green-500 to-green-600',
    gradientLight: 'from-lime-50 via-green-50 to-green-100',
    gradientDark: 'from-lime-600 via-green-600 to-green-700',
    accentColor: 'lime-500',
    borderColor: 'border-lime-200',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-700',
    description: 'Restaurants, shops, and local establishments',
    subcategories: [
      { name: 'Restaurants', slug: 'restaurants', description: 'Dining establishments' },
      { name: 'Cafes', slug: 'cafes', description: 'Coffee shops and cafes' },
      { name: 'Shops', slug: 'shops', description: 'Retail stores' },
      { name: 'Salons', slug: 'salons', description: 'Beauty and grooming' },
      { name: 'Clinics', slug: 'clinics', description: 'Medical services' },
      { name: 'Gyms', slug: 'gyms', description: 'Fitness centers' },
    ],
  },
  'experiences': {
    name: 'Experiences & Entertainment',
    slug: 'experiences',
    icon: Sparkles,
    gradient: 'from-fuchsia-500 via-purple-500 to-purple-600',
    gradientLight: 'from-fuchsia-50 via-purple-50 to-purple-100',
    gradientDark: 'from-fuchsia-600 via-purple-600 to-purple-700',
    accentColor: 'fuchsia-500',
    borderColor: 'border-fuchsia-200',
    badgeBg: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-700',
    description: 'Tours, events, and entertainment experiences',
    subcategories: [
      { name: 'Tours', slug: 'tours', description: 'Guided tours and excursions' },
      { name: 'Water Sports', slug: 'water-sports', description: 'Diving and boating' },
      { name: 'Cultural Events', slug: 'cultural-events', description: 'Museums and shows' },
      { name: 'Nightlife', slug: 'nightlife', description: 'Clubs and entertainment' },
      { name: 'Workshops', slug: 'workshops', description: 'Classes and learning' },
      { name: 'Art & Music', slug: 'art-music', description: 'Creative experiences' },
    ],
  },
  'jobs': {
    name: 'Jobs & Gigs',
    slug: 'jobs',
    icon: Briefcase,
    gradient: 'from-amber-500 via-orange-500 to-orange-600',
    gradientLight: 'from-amber-50 via-orange-50 to-orange-100',
    gradientDark: 'from-amber-600 via-orange-600 to-orange-700',
    accentColor: 'amber-500',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    description: 'Job opportunities and freelance gigs',
    subcategories: [
      { name: 'Full-time Jobs', slug: 'full-time-jobs', description: 'Permanent positions' },
      { name: 'Part-time Jobs', slug: 'part-time-jobs', description: 'Flexible work' },
      { name: 'Freelance Gigs', slug: 'freelance-gigs', description: 'Project-based work' },
      { name: 'Remote Work', slug: 'remote-work', description: 'Work from anywhere' },
    ],
  },
  'miscellaneous': {
    name: 'Miscellaneous',
    slug: 'miscellaneous',
    icon: ShoppingBag,
    gradient: 'from-stone-500 via-neutral-500 to-neutral-600',
    gradientLight: 'from-stone-50 via-neutral-50 to-neutral-100',
    gradientDark: 'from-stone-600 via-neutral-600 to-neutral-700',
    accentColor: 'stone-500',
    borderColor: 'border-stone-200',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    description: 'Community posts, lost & found, and more',
    subcategories: [
      { name: 'Lost & Found', slug: 'lost-found', description: 'Missing items' },
      { name: 'Community Posts', slug: 'community-posts', description: 'Local announcements' },
      { name: 'Donations', slug: 'donations', description: 'Giveaways and charity' },
    ],
  },
  'real_estate': {
    name: 'Real Estate',
    slug: 'real_estate',
    icon: Building2,
    gradient: 'from-blue-500 via-indigo-500 to-indigo-600',
    gradientLight: 'from-blue-50 via-indigo-50 to-indigo-100',
    gradientDark: 'from-blue-600 via-indigo-600 to-indigo-700',
    accentColor: 'blue-500',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    description: 'Buy, sell, or rent properties',
    subcategories: [
      { name: 'Houses', slug: 'houses', description: 'Single-family homes' },
      { name: 'Apartments', slug: 'apartments', description: 'Multi-unit buildings' },
      { name: 'Commercial', slug: 'commercial', description: 'Office and retail spaces' },
      { name: 'Land', slug: 'land', description: 'Vacant lots and plots' },
    ],
  },
  'general': {
    name: 'General',
    slug: 'general',
    icon: ShoppingBag,
    gradient: 'from-gray-500 via-slate-500 to-slate-600',
    gradientLight: 'from-gray-50 via-slate-50 to-slate-100',
    gradientDark: 'from-gray-600 via-slate-600 to-slate-700',
    accentColor: 'gray-500',
    borderColor: 'border-gray-200',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    description: 'General listings and services',
    subcategories: [
      { name: 'Services', slug: 'services', description: 'Professional services' },
      { name: 'Products', slug: 'products', description: 'General merchandise' },
      { name: 'Other', slug: 'other', description: 'Miscellaneous items' },
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
