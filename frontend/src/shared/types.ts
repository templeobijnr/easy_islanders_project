export type Role = 'user' | 'agent' | 'system';
export type JobId = 'place' | 'car' | 'night' | 'help' | 'transfer' | 'weekend';
export type Tab = 'Hotels' | 'Car Rentals' | 'Restaurants' | 'Beaches';

export type JobStatus = 'idle' | 'active' | 'completed' | 'error';

export type Job = {
  id: JobId;
  status: JobStatus;
  label: string;
  icon: string;
};

export type Message = {
  id: string;
  role: Role;
  text: string;
  ts: number;
  pending?: boolean;
  inReplyTo?: string | null;
};

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
