/**
 * Real Estate API Client - V1 Schema
 *
 * API functions for searching and managing real estate listings
 * using the v1 data model.
 */

import { apiClient } from './apiClient';

/**
 * Search query parameters for real estate listings
 */
export interface ListingSearchParams {
  listing_type?: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT';
  city?: string;
  area?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  property_type?: string;
  furnished_status?: 'UNFURNISHED' | 'PARTLY_FURNISHED' | 'FULLY_FURNISHED';

  // Feature flags
  has_wifi?: boolean;
  has_kitchen?: boolean;
  has_private_pool?: boolean;
  has_shared_pool?: boolean;
  has_parking?: boolean;
  has_air_conditioning?: boolean;
  view_sea?: boolean;
  view_mountain?: boolean;

  // Availability dates (ISO 8601)
  available_from?: string;
  available_to?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sort_by?: 'price_asc' | 'price_desc' | 'bedrooms_asc' | 'bedrooms_desc' | 'created_at_desc';
}

/**
 * Real estate listing result from v1 API
 */
export interface ListingSearchResult {
  listing_id: number;
  listing_reference_code: string;
  listing_type_code: string;
  status: string;
  title: string;
  description: string;
  base_price: string;
  currency: string;
  price_period: string;
  available_from: string | null;
  available_to: string | null;
  created_at: string;
  updated_at: string;

  // Property details
  property_id: number | null;
  property_reference_code: string | null;

  // Project details
  project_id: number | null;
  project_name: string | null;

  // Location
  location_id: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  area: string | null;
  latitude: string | null;
  longitude: string | null;

  // Property type
  property_type_code: string | null;
  property_type_label: string | null;
  property_category: string | null;

  // Room configuration
  bedrooms: number | null;
  living_rooms: number | null;
  bathrooms: number | null;
  room_configuration_label: string | null;

  // Property details
  total_area_sqm: string | null;
  net_area_sqm: string | null;
  furnished_status: string | null;
  floor_number: number | null;
  total_floors: number | null;
  year_built: number | null;
  is_gated_community: boolean;

  // Feature flags
  has_wifi: boolean;
  has_kitchen: boolean;
  has_private_pool: boolean;
  has_shared_pool: boolean;
  view_sea: boolean;
  view_mountain: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_garden: boolean;
  has_parking: boolean;
  has_air_conditioning: boolean;
  has_central_heating: boolean;
}

/**
 * Search response from API
 */
export interface ListingSearchResponse {
  count: number;
  results: ListingSearchResult[];
  limit: number;
  offset: number;
}

/**
 * Search real estate listings
 *
 * @param params Search parameters
 * @returns Promise with search results
 *
 * @example
 * ```typescript
 * const results = await searchRealEstateListings({
 *   listing_type: 'DAILY_RENTAL',
 *   city: 'Kyrenia',
 *   min_bedrooms: 2,
 *   has_wifi: true,
 *   has_kitchen: true,
 *   limit: 20
 * });
 * ```
 */
export async function searchRealEstateListings(
  params: ListingSearchParams
): Promise<ListingSearchResponse> {
  const response = await apiClient.get<ListingSearchResponse>(
    '/api/v1/real_estate/listings/search/',
    { params }
  );
  return response.data;
}

/**
 * Card item compatible format (for UI components)
 */
export interface PropertyCardItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  imageUrl?: string;
  rating?: number;
  area?: string;
  badges: string[];
  metadata: {
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number;
    listing_type?: string;
    property_type?: string;
    furnished_status?: string;
    features?: Record<string, boolean>;
  };
}

/**
 * Convert API listing result to card item format for UI
 *
 * @param listing Listing from API
 * @returns Card item for UI display
 */
export function formatListingAsCard(listing: ListingSearchResult): PropertyCardItem {
  // Build subtitle
  const subtitleParts: string[] = [];
  if (listing.city) subtitleParts.push(listing.city);
  if (listing.area) subtitleParts.push(listing.area);
  const subtitle = subtitleParts.join(', ');

  // Format price
  const currencySymbols: Record<string, string> = {
    EUR: '€',
    GBP: '£',
    USD: '$',
    TRY: '₺',
  };
  const symbol = currencySymbols[listing.currency] || listing.currency;
  const periodSuffixes: Record<string, string> = {
    PER_DAY: '/day',
    PER_MONTH: '/mo',
    TOTAL: '',
    STARTING_FROM: '+ (from)',
  };
  const suffix = periodSuffixes[listing.price_period] || '';
  const price = `${symbol}${listing.base_price}${suffix}`;

  // Generate badges
  const badges: string[] = [];
  if (listing.has_wifi) badges.push('WiFi');
  if (listing.has_private_pool) badges.push('Private Pool');
  else if (listing.has_shared_pool) badges.push('Pool');
  if (listing.view_sea) badges.push('Sea View');
  if (listing.has_parking) badges.push('Parking');

  return {
    id: String(listing.listing_id),
    title: listing.title,
    subtitle,
    price,
    area: listing.area || undefined,
    badges: badges.slice(0, 3), // Max 3 badges
    metadata: {
      bedrooms: listing.bedrooms || undefined,
      bathrooms: listing.bathrooms || undefined,
      sqm: listing.total_area_sqm ? parseFloat(listing.total_area_sqm) : undefined,
      listing_type: listing.listing_type_code,
      property_type: listing.property_type_label || undefined,
      furnished_status: listing.furnished_status || undefined,
      features: {
        wifi: listing.has_wifi,
        kitchen: listing.has_kitchen,
        private_pool: listing.has_private_pool,
        shared_pool: listing.has_shared_pool,
        parking: listing.has_parking,
        air_conditioning: listing.has_air_conditioning,
        sea_view: listing.view_sea,
        mountain_view: listing.view_mountain,
      },
    },
  };
}

/**
 * Search and format listings as cards in one call
 *
 * @param params Search parameters
 * @returns Promise with formatted card items
 */
export async function searchListingsAsCards(
  params: ListingSearchParams
): Promise<PropertyCardItem[]> {
  const response = await searchRealEstateListings(params);
  return response.results.map(formatListingAsCard);
}
