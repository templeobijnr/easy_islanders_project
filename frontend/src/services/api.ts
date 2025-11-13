import type { RecItem, LaneCard, FeaturedItem, Tab, JobId } from '../shared/types';
export { apiClient } from './apiClient';

export async function getRecs(job: JobId): Promise<RecItem[]> {
  const res = await fetch(`/api/${job}/recs`);
  return res.json();
}

export async function getFeatured(tab: Tab): Promise<FeaturedItem[]> {
  const res = await fetch(`/api/featured?tab=${encodeURIComponent(tab)}`);
  return res.json();
}

export async function getEvents(): Promise<LaneCard[]> {
  const res = await fetch('/api/events');
  return res.json();
}

export async function getDeals(): Promise<LaneCard[]> {
  const res = await fetch('/api/deals');
  return res.json();
}