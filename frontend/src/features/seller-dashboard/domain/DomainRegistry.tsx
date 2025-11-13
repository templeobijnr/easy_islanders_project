import { Home, Building2, Wrench, CalendarDays, Car, Store } from 'lucide-react';
import React from 'react';

// Lightweight domain registry to drive labels, icons and default nav
export type DomainKey = 'real-estate' | 'services' | 'events' | 'cars' | 'products' | 'p2p' | string;

export interface DomainNavItem {
  name: string;
  path: (domain: string) => string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface DomainConfig {
  key: DomainKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  nav: DomainNavItem[];
}

export const domainRegistry: Record<string, DomainConfig> = {
  'real-estate': {
    key: 'real-estate',
    label: 'Real Estate',
    icon: Building2,
    nav: [
      { name: 'Overview', path: (d) => `/dashboard/${d}/overview`, icon: Home },
      { name: 'Listings', path: (d) => `/dashboard/${d}/listings`, icon: Store },
      { name: 'Bookings', path: (d) => `/dashboard/${d}/bookings`, icon: CalendarDays },
      { name: 'Services', path: (d) => `/dashboard/${d}/services`, icon: Wrench },
      { name: 'Analytics', path: (d) => `/dashboard/${d}/analytics`, icon: Home },
    ],
  },
  services: {
    key: 'services',
    label: 'Services',
    icon: Wrench,
    nav: [
      { name: 'Overview', path: (d) => `/dashboard/${d}/overview`, icon: Home },
      { name: 'Offerings', path: (d) => `/dashboard/${d}/offerings`, icon: Store },
      { name: 'Bookings', path: (d) => `/dashboard/${d}/bookings`, icon: CalendarDays },
      { name: 'Analytics', path: (d) => `/dashboard/${d}/analytics`, icon: Home },
    ],
  },
  events: {
    key: 'events',
    label: 'Events',
    icon: CalendarDays,
    nav: [
      { name: 'Overview', path: (d) => `/dashboard/${d}/overview`, icon: Home },
      { name: 'Events', path: (d) => `/dashboard/${d}/events`, icon: CalendarDays },
      { name: 'Tickets', path: (d) => `/dashboard/${d}/tickets`, icon: Store },
      { name: 'Analytics', path: (d) => `/dashboard/${d}/analytics`, icon: Home },
    ],
  },
  cars: {
    key: 'cars',
    label: 'Vehicles',
    icon: Car,
    nav: [
      { name: 'Overview', path: (d) => `/dashboard/${d}/overview`, icon: Home },
      { name: 'Fleet', path: (d) => `/dashboard/${d}/fleet`, icon: Store },
      { name: 'Bookings', path: (d) => `/dashboard/${d}/bookings`, icon: CalendarDays },
      { name: 'Analytics', path: (d) => `/dashboard/${d}/analytics`, icon: Home },
    ],
  },
  products: {
    key: 'products',
    label: 'Products',
    icon: Store,
    nav: [
      { name: 'Overview', path: (d) => `/dashboard/${d}/overview`, icon: Home },
      { name: 'Inventory', path: (d) => `/dashboard/${d}/inventory`, icon: Store },
      { name: 'Sales', path: (d) => `/dashboard/${d}/sales`, icon: Store },
      { name: 'Analytics', path: (d) => `/dashboard/${d}/analytics`, icon: Home },
    ],
  },
};

export function getDomainConfig(domain: string): DomainConfig | undefined {
  return domainRegistry[domain];
}

