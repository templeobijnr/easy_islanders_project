export type Role = 'user' | 'agent';
export type JobId = 'place' | 'car' | 'night' | 'help' | 'transfer' | 'weekend';
export type Tab = 'Hotels' | 'Car Rentals' | 'Restaurants' | 'Beaches';

export type Message = { id: string; role: Role; text: string; ts: number };

export type RecItem = {
  id: string;
  title: string;
  reason?: string;
  price?: string;
  rating?: number;
  distanceMins?: number;
  badges?: string[];
  imageUrl?: string;
};

export type FeaturedItem = { id: string; title: string; blurb: string; emoji?: string; imageUrl?: string };
export type LaneCard = { id: string; title: string; meta: string; emoji?: string; imageUrl?: string };