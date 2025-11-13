/**
 * Listing types - define the structure of listings
 */

export interface ListingImage {
  id: string;
  image: string;
  uploaded_at?: string;
}

export interface BaseListing {
  id: string; // UUID
  title: string;
  description: string;
  category: string | null;
  category_name?: string;
  category_slug?: string;
  subcategory?: string | null;
  subcategory_name?: string | null;
  subcategory_slug?: string | null;
  price: number | null;
  currency: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: 'draft' | 'active' | 'paused' | 'sold';
  is_featured: boolean;
  views: number;
  dynamic_fields: Record<string, any>; // Category-specific fields
  owner?: string | number;
  owner_username?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Listing extends BaseListing {
  images?: ListingImage[];
  image_urls?: string[];
}

export interface ListingDetail extends BaseListing {
  category_is_bookable?: boolean;
  images: ListingImage[];
}

export interface CreateListingRequest {
  title: string;
  description: string;
  category: string; // UUID
  subcategory?: string | null; // Optional
  price?: number | null;
  currency?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  dynamic_fields: Record<string, any>;
  status?: 'draft' | 'active';
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  dynamic_fields?: Record<string, any>;
  status?: 'draft' | 'active' | 'paused' | 'sold';
  is_featured?: boolean;
}

export interface ListingsResponse {
  results?: Listing[];
  listings?: Listing[];
  count: number;
  next?: string;
  previous?: string;
}

export interface ListingFilters {
  category?: string;
  subcategory?: string;
  status?: string;
  search?: string;
  ordering?: string;
  price_min?: number;
  price_max?: number;
  is_featured?: boolean;
  my_listings?: boolean;
  limit?: number;
  offset?: number;
}
