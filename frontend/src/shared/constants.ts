import { JobId, Tab, FeaturedItem } from './types';

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
    { id: 'fh1', title: 'Harbor Boutique', blurb: 'Sea view • Late checkout', emoji: '🏨' },
    { id: 'fh2', title: 'Olive Grove Suites', blurb: 'Breakfast included', emoji: '🫒' },
    { id: 'fh3', title: 'Zeytinlik Stay', blurb: 'Walk to old town', emoji: '🌿' },
  ],
  'Car Rentals': [
    { id: 'fc1', title: 'Compact Automatic', blurb: 'Deposit ₺0 • Airport pickup', emoji: '🚗' },
    { id: 'fc2', title: 'SUV 5‑seat', blurb: 'Child seat on request', emoji: '🚙' },
    { id: 'fc3', title: 'Convertible', blurb: 'Weekend special', emoji: '🕶️' },
  ],
  Restaurants: [
    { id: 'fr1', title: 'Harbor Jazz Bar', blurb: 'Live jazz 20:30', emoji: '🎷' },
    { id: 'fr2', title: 'Meze House', blurb: 'Quiet terrace', emoji: '🥗' },
    { id: 'fr3', title: 'Rooftop Lounge', blurb: 'Sunset views', emoji: '🌇' },
  ],
  Beaches: [
    { id: 'fb1', title: 'Karpaz Golden', blurb: 'Dunes • Turtles', emoji: '🏖️' },
    { id: 'fb2', title: 'Alagadi', blurb: 'Family friendly', emoji: '🦀' },
    { id: 'fb3', title: 'Escape Beach', blurb: 'Clubs • Water sports', emoji: '🏄' },
  ],
};

// Lane data
export const EVENTS = [
  { id: "e1", title: "Live Jazz Night", meta: "Harbor • Thu 20:30", emoji: "🎷" },
  { id: "e2", title: "Beach Sunset Party", meta: "Escape • Sat 19:00", emoji: "🌅" },
  { id: "e3", title: "Farmers Market", meta: "Old Town • Sun 10:00", emoji: "🧺" },
];

export const TODO = [
  { id: "td1", title: "Kyrenia Castle + Harbor Walk", meta: "2h • Easy • Great photos", emoji: "🏰" },
  { id: "td2", title: "Alagadi Turtle Spotting", meta: "Family • 40min drive", emoji: "🐢" },
  { id: "td3", title: "Karpaz Day Trip", meta: "Beaches + meze", emoji: "🗺️" },
];

export const DEALS = [
  { id: "d1", title: "Compact Car Weekend", meta: "Fri→Mon • −15% • Airport pickup", emoji: "🚗" },
  { id: "d2", title: "Harbor Boutique — 2 nights", meta: "Late checkout • Breakfast", emoji: "🏨" },
  { id: "d3", title: "Meze Tasting for 2", meta: "Near harbor • Set menu", emoji: "🥗" },
];

// Mock recommendation results for each job type
export const MOCK_RESULTS: Record<JobId, Array<{id:string; title:string; reason?:string; price?:string; rating?:number; location?:string}>> = {
  place: [
    { id: 'p1', title: 'Harbor Boutique — 2 nights', reason: 'Late checkout • Breakfast', price: '₺2,300', rating: 4.8, location: 'Kyrenia Harbor' },
    { id: 'p2', title: 'Olive Grove Suites', reason: 'Walk to old town', price: '₺1,950', rating: 4.6, location: 'Zeytinlik' },
    { id: 'p3', title: 'Seaside Villa', reason: 'Private beach access', price: '₺3,500', rating: 4.9, location: 'Escape Beach' },
  ],
  car: [
    { id: 'c1', title: 'Compact Automatic', reason: 'Deposit ₺0 • Airport pickup', price: '₺900/day', rating: 4.7 },
    { id: 'c2', title: 'SUV 5-seat', reason: 'Child seat on request', price: '₺1,450/day', rating: 4.5 },
    { id: 'c3', title: 'Convertible Special', reason: 'Weekend rates available', price: '₺1,200/day', rating: 4.8 },
  ],
  night: [
    { id: 'n1', title: 'Harbor Jazz Bar', reason: 'Live at 20:30', price: 'Table ₺2,100', rating: 4.6, location: 'Harbor' },
    { id: 'n2', title: 'Meze House', reason: 'Quiet terrace', price: 'Avg ₺1,600', rating: 4.7, location: 'Old Town' },
    { id: 'n3', title: 'Rooftop Lounge', reason: 'Sunset views', price: 'Entry free', rating: 4.5, location: 'Kyrenia Center' },
  ],
  help: [
    { id: 'h1', title: 'Deep clean (2 cleaners)', reason: 'Tomorrow 09:00 • Brings supplies', price: '₺850', rating: 4.8 },
    { id: 'h2', title: 'Handyman Service', reason: 'Same day available', price: '₺600/hour', rating: 4.6 },
  ],
  transfer: [
    { id: 't1', title: 'Airport → Kyrenia (Sedan)', reason: 'Meet at arrivals • 2 bags', price: '₺600', rating: 4.9 },
    { id: 't2', title: 'Airport → Kyrenia (Van)', reason: '6 passengers • 4 bags', price: '₺900', rating: 4.7 },
  ],
  weekend: [
    { id: 'w1', title: 'Karpaz Guesthouse', reason: 'Breakfast • Free cancel', price: '₺1,900/night', rating: 4.7, location: 'Karpaz' },
    { id: 'w2', title: 'Beach Resort Package', reason: 'All meals included', price: '₺3,200', rating: 4.8, location: 'Golden Beach' },
  ],
};