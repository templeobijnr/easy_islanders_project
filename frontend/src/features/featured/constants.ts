// Featured data constants for the featured panel
// These are prototype constants that can be replaced with backend data when available

export const SPOTLIGHT_ITEMS = [
  {
    id: '1',
    title: 'Discover Cyprus Paradise',
    description: 'Find your dream property in the Mediterranean sunshine with our expert guidance.',
    image: '/api/placeholder/600/400',
    ctaText: 'Start Exploring',
    onCtaClick: () => console.log('Start exploring clicked'),
  },
  {
    id: '2',
    title: 'Investment Opportunities',
    description: 'Prime real estate investments with guaranteed returns in growing Cyprus markets.',
    image: '/api/placeholder/600/400',
    ctaText: 'Learn More',
    onCtaClick: () => console.log('Learn more clicked'),
  },
];

export const FEATURED_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury Beachfront Villa',
    description: 'Stunning 5-bedroom villa with infinity pool and panoramic sea views in Paphos.',
    image: '/api/placeholder/400/300',
    badge: 'Featured',
  },
  {
    id: '2',
    title: 'Modern City Apartment',
    description: 'Contemporary 3-bedroom apartment in the heart of Limassol with city views.',
    image: '/api/placeholder/400/300',
    badge: 'New',
  },
  {
    id: '3',
    title: 'Traditional Village House',
    description: 'Charming restored stone house in a peaceful village setting near Nicosia.',
    image: '/api/placeholder/400/300',
    badge: 'Historic',
  },
];

export const POPULAR_AREAS = [
  { id: '1', title: 'Paphos', image: '/api/placeholder/300/200' },
  { id: '2', title: 'Limassol', image: '/api/placeholder/300/200' },
  { id: '3', title: 'Nicosia', image: '/api/placeholder/300/200' },
  { id: '4', title: 'Larnaca', image: '/api/placeholder/300/200' },
  { id: '5', title: 'Ayia Napa', image: '/api/placeholder/300/200' },
];

// Adapter function to transform backend data when available
export const transformSpotlightData = (backendData: any[]) => {
  return backendData.map(item => ({
    id: item.id || item.pk,
    title: item.title,
    description: item.description,
    image: item.image_url || item.image,
    ctaText: item.cta_text || 'Learn More',
    onCtaClick: () => console.log(`${item.title} clicked`),
  }));
};

export const transformPropertiesData = (backendData: any[]) => {
  return backendData.map(item => ({
    id: item.id || item.pk,
    title: item.title,
    description: item.description,
    image: item.image_url || item.image,
    badge: item.badge || item.status,
  }));
};

export const transformAreasData = (backendData: any[]) => {
  return backendData.map(item => ({
    id: item.id || item.pk,
    title: item.name || item.title,
    image: item.image_url || item.image,
  }));
};