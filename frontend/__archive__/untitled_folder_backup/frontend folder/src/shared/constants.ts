import { JobId, Tab, FeaturedItem, RecItem } from './types';

export const JOB_CHIPS: Array<{ id: JobId; label: string; icon: string; hint: string }> = [
  { id: 'place', label: 'Find a place', icon: '🏠', hint: '2+1 near EMU under ₺20k' },
  { id: 'car', label: 'Book a car', icon: '🚗', hint: 'Compact Fri→Mon, pickup Kyrenia' },
  { id: 'night', label: 'Plan a night out', icon: '🎶', hint: 'Live music near harbor 20:00' },
  { id: 'help', label: 'Get help at home', icon: '🧹', hint: 'Deep clean tomorrow 09:00' },
  { id: 'transfer', label: 'Airport transfer', icon: '🛬', hint: 'ERCAN → Kyrenia tonight 18:30' },
  { id: 'weekend', label: 'Weekend in Karpaz', icon: '🏖️', hint: 'Sat→Sun, budget ₺3,500' },
];

export const REFINERS: Record<JobId, string[]> = {
  place: ['closer', 'cheaper', 'newer', 'furnished', 'no prepay'],
  car: ['automatic', 'child seat', 'near me', 'no deposit'],
  night: ['near harbor', 'live music', 'quiet', '8pm', '₺2,500'],
  help: ['tomorrow', 'morning', 'bring supplies', 'one‑time'],
  transfer: ['tonight', '4 pax', '2 bags', 'meet at arrivals'],
  weekend: ['sea view', 'breakfast', 'free cancel', '<30km'],
};

export const FEATURED_TABS: Tab[] = ['Hotels', 'Car Rentals', 'Restaurants', 'Beaches'];

export const SPOTLIGHT_BY_TAB: Record<Tab, FeaturedItem[]> = {
  Hotels: [
    { id: 'fh1', title: 'Harbor Boutique', blurb: 'Sea view · Late checkout', emoji: '🏨' },
    { id: 'fh2', title: 'Olive Grove Suites', blurb: 'Breakfast included', emoji: '🫒' },
    { id: 'fh3', title: 'Zeytinlik Stay', blurb: 'Walk to old town', emoji: '🌿' },
  ],
  'Car Rentals': [
    { id: 'fc1', title: 'Compact Automatic', blurb: 'Deposit ₺0 · Airport pickup', emoji: '🚗' },
    { id: 'fc2', title: 'SUV 5‑seat', blurb: 'Child seat on request', emoji: '🚙' },
    { id: 'fc3', title: 'Convertible', blurb: 'Weekend special', emoji: '🕶️' },
  ],
  Restaurants: [
    { id: 'fr1', title: 'Harbor Jazz Bar', blurb: 'Live jazz 20:30', emoji: '🎷' },
    { id: 'fr2', title: 'Meze House', blurb: 'Quiet terrace', emoji: '🥗' },
    { id: 'fr3', title: 'Rooftop Lounge', blurb: 'Sunset views', emoji: '🌇' },
  ],
  Beaches: [
    { id: 'fb1', title: 'Karpaz Golden', blurb: 'Dunes · Turtles', emoji: '🏖️' },
    { id: 'fb2', title: 'Alagadi', blurb: 'Family friendly', emoji: '🦀' },
    { id: 'fb3', title: 'Escape Beach', blurb: 'Clubs · Water sports', emoji: '🏄' },
  ],
};

export const MOCK_RESULTS: Record<JobId, RecItem[]> = {
  place: [
    { id: 'p1', title: '2+1 near EMU', reason: 'Walk 7 min · Furnished', price: '₺18,500' },
    { id: 'p2', title: 'New build in Zeytinlik', reason: 'Sea view · Balcony', price: '₺21,000' },
  ],
  car: [
    { id: 'c1', title: 'Compact Auto', reason: 'Airport pickup · No deposit', price: '₺1,250/d' },
    { id: 'c2', title: 'SUV 5‑seat', reason: 'Child seat available', price: '₺1,950/d' },
  ],
  night: [
    { id: 'n1', title: 'Harbor Jazz Bar', reason: 'Live · 20:30 · Near harbor' },
    { id: 'n2', title: 'Rooftop Lounge', reason: 'Sunset · Quiet' },
  ],
  help: [
    { id: 'h1', title: 'Deep Clean (3h)', reason: 'Tomorrow 09:00', price: '₺950' },
  ],
  transfer: [
    { id: 't1', title: 'ERCAN → Kyrenia', reason: '4 pax · 2 bags', price: '₺700' },
  ],
  weekend: [
    { id: 'w1', title: 'Karpaz Bungalow', reason: 'Sea view · Breakfast', price: '₺3,200' },
  ],
};