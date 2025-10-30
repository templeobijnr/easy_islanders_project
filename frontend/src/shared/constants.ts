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

// Mock data for recommendations
export const MOCK_RESULTS: Record<JobId, Array<any>> = {
  place: [
    { id: "apt-1", title: "2+1 • Kyrenia Center • Furnished", reason: "400m from Harbor • ₺19,800 • Available Fri 18:00", price: "₺19,800/mo", location: "Kyrenia Center" },
    { id: "apt-2", title: "1+1 • Near EMU • New Build", reason: "1.1km • ₺16,500 • No prepay", price: "₺16,500/mo", location: "Near EMU" },
    { id: "apt-3", title: "2+1 • Zeytinlik", reason: "8 min walk • ₺20,200 • Pets OK", price: "₺20,200/mo", location: "Zeytinlik" },
  ],
  car: [
    { id: "car-1", title: "Compact • Automatic", reason: "Pickup Fri 10:00 • 1.2km • Deposit ₺0", price: "₺1,100/day", location: "Kyrenia Center" },
    { id: "car-2", title: "SUV 5-seat", reason: "Airport pickup • Sat 09:00", price: "₺1,800/day", location: "Airport" },
  ],
  night: [
    { id: "n1", title: "Harbor Jazz Bar", reason: "Live jazz 20:30 • 450m • Avg ₺2,100 for two", price: "Table 20:00", location: "Harbor" },
    { id: "n2", title: "Seaview Meze House", reason: "Quiet terrace • 650m • Avg ₺1,600", price: "Table 20:15", location: "Harbor" },
  ],
  help: [
    { id: "h1", title: "Deep Clean (2 cleaners)", reason: "Tomorrow 09:00 • Brings supplies • 2h", price: "₺850", location: "Kyrenia" },
  ],
  transfer: [
    { id: "t1", title: "Airport → Kyrenia (Sedan)", reason: "Meet at arrivals • 2 bags • 35min", price: "₺750", location: "Airport" },
  ],
  weekend: [
    { id: "w1", title: "Karpaz Guesthouse", reason: "Breakfast • Free cancel • 28km", price: "₺1,900/night", location: "Karpaz" },
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