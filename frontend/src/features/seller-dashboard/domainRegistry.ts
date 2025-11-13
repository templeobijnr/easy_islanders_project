import {
  Building2,
  Car,
  Calendar,
  Wrench,
  UtensilsCrossed,
  Package,
  Stethoscope,
  MapPin,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DomainId =
  | 'real_estate'
  | 'cars'
  | 'events'
  | 'services'
  | 'restaurants'
  | 'p2p'
  | 'appointments'
  | 'health_beauty'
  | 'activities'
  | 'products';

export type DashboardSectionId =
  | 'home'
  | 'my_listings'
  | 'bookings'
  | 'seller_inbox'
  | 'broadcasts'
  | 'sales'
  | 'messages'
  | 'analytics'
  | 'profile'
  | 'help';

export interface DomainConfig {
  id: DomainId;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  gradientClass: string;
  defaultSection: DashboardSectionId;
  enabledSections: DashboardSectionId[];
  homePath: string;
  description: string;
}

export const DOMAIN_CONFIGS: Record<DomainId, DomainConfig> = {
  real_estate: {
    id: 'real_estate',
    label: 'Real Estate',
    icon: Building2,
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    gradientClass: 'from-blue-500 to-cyan-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/real-estate',
    description: 'Properties, rentals & sales',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'broadcasts',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  cars: {
    id: 'cars',
    label: 'Cars',
    icon: Car,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    gradientClass: 'from-amber-500 to-orange-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/cars',
    description: 'Vehicles, rentals & sales',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  events: {
    id: 'events',
    label: 'Events',
    icon: Calendar,
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
    gradientClass: 'from-purple-500 to-pink-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/events',
    description: 'Conferences, parties & gatherings',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'broadcasts',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  services: {
    id: 'services',
    label: 'Services',
    icon: Wrench,
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    gradientClass: 'from-indigo-500 to-blue-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/services',
    description: 'Professional & trade services',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  restaurants: {
    id: 'restaurants',
    label: 'Restaurants',
    icon: UtensilsCrossed,
    colorClass: 'bg-red-100 text-red-800 border-red-200',
    gradientClass: 'from-red-500 to-orange-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/restaurants',
    description: 'Dining, catering & food services',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'broadcasts',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  p2p: {
    id: 'p2p',
    label: 'P2P Marketplace',
    icon: Users,
    colorClass: 'bg-green-100 text-green-800 border-green-200',
    gradientClass: 'from-green-500 to-emerald-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/p2p',
    description: 'Peer-to-peer marketplace',
    enabledSections: [
      'home',
      'my_listings',
      'seller_inbox',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  appointments: {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    colorClass: 'bg-teal-100 text-teal-800 border-teal-200',
    gradientClass: 'from-teal-500 to-cyan-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/appointments',
    description: 'Appointment scheduling & management',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  health_beauty: {
    id: 'health_beauty',
    label: 'Health & Beauty',
    icon: Stethoscope,
    colorClass: 'bg-pink-100 text-pink-800 border-pink-200',
    gradientClass: 'from-pink-500 to-rose-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/health-beauty',
    description: 'Health, wellness & beauty services',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  activities: {
    id: 'activities',
    label: 'Activities',
    icon: MapPin,
    colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    gradientClass: 'from-cyan-500 to-blue-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/activities',
    description: 'Tours, experiences & activities',
    enabledSections: [
      'home',
      'my_listings',
      'bookings',
      'seller_inbox',
      'broadcasts',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
  products: {
    id: 'products',
    label: 'Products',
    icon: Package,
    colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gradientClass: 'from-yellow-500 to-amber-500',
    defaultSection: 'home',
    homePath: '/dashboard/home/products',
    description: 'Physical products & retail',
    enabledSections: [
      'home',
      'my_listings',
      'seller_inbox',
      'sales',
      'messages',
      'analytics',
      'profile',
      'help',
    ],
  },
};

export const SECTION_LABELS: Record<DashboardSectionId, string> = {
  home: 'Home',
  my_listings: 'My Listings',
  bookings: 'Bookings',
  seller_inbox: 'Seller Inbox',
  broadcasts: 'Broadcasts',
  sales: 'Sales',
  messages: 'Messages',
  analytics: 'Analytics',
  profile: 'Business Profile',
  help: 'Help & Support',
};

/**
 * Get domain configuration by ID
 */
export function getDomainConfig(domainId: DomainId): DomainConfig {
  const config = DOMAIN_CONFIGS[domainId];
  if (!config) {
    throw new Error(`Unknown domain: ${domainId}`);
  }
  return config;
}

/**
 * Get all available domains
 */
export function getAllDomains(): DomainConfig[] {
  return Object.values(DOMAIN_CONFIGS);
}

/**
 * Check if a section is enabled for a domain
 */
export function isSectionEnabled(
  domainId: DomainId,
  sectionId: DashboardSectionId
): boolean {
  const config = getDomainConfig(domainId);
  return config.enabledSections.includes(sectionId);
}

/**
 * Get enabled sections for a domain
 */
export function getEnabledSections(domainId: DomainId): DashboardSectionId[] {
  const config = getDomainConfig(domainId);
  return config.enabledSections;
}
