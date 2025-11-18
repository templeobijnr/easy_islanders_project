/**
 * Type definitions for Explore North Cyprus feature
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_bookable: boolean;
  is_active: boolean;
  is_featured_category: boolean;
  display_order: number;
  schema: CategorySchema;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  slug: string;
  name: string;
  display_order: number;
  category?: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface CategorySchema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'datetime';
  label: string;
  choices?: string[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string | number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  subcategory?: {
    id: number;
    slug: string;
    name: string;
  };
  owner: {
    id: string;
    username: string;
  };
  dynamic_fields: Record<string, any>;
  listing_kind: 'offer' | 'request';
  transaction_type: 'sale' | 'rent_short' | 'rent_long' | 'booking' | 'project';
  status: 'draft' | 'active' | 'paused' | 'sold';
  views: number;
  is_featured: boolean;
  images?: ListingImage[];
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  image: string;
  uploaded_at: string;
}

export interface ListingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Listing[];
}

export interface CategoriesResponse {
  categories: Category[];
  count: number;
}

// UI State types
export interface ExploreFilters {
  category: string | null;
  subcategory: string | null;
  search: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  sortBy: 'created_at' | '-created_at' | 'price' | '-price' | 'views';

  // Optional category-specific filters (not yet wired to backend)
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string[];
  amenities?: string[];

  vehicleTypes?: string[];
  vehicleTransmission?: string[];
  vehicleFuelTypes?: string[];

  serviceTypes?: string[];
  serviceAvailability?: string;
}

export interface LaneConfig {
  id: string;
  title: string;
  emoji: string;
  filter: (listings: Listing[]) => Listing[];
}
