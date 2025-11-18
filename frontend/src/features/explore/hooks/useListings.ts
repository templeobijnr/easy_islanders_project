/**
 * Hook to fetch and manage listings from the API
 */

import { useState, useEffect } from 'react';
import { Listing, ListingsResponse } from '../types';
import {
  searchRealEstateListings,
  getRealEstateListingImages,
  ListingSearchParams,
  ListingSearchResult,
} from '../../../services/realEstateApi';

interface UseListingsOptions {
  category?: string | null;
  subcategory?: string | null;
  status?: string;
  is_featured?: boolean;
  limit?: number;
  autoFetch?: boolean;
  search?: string;
  ordering?: string;
}

interface UseListingsResult {
  listings: Listing[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  fetchListings: (filters?: Partial<UseListingsOptions>) => Promise<void>;
  refetch: () => void;
}

// Placeholder listings to display when API fails
const PLACEHOLDER_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Luxury Beach Villa in Kyrenia',
    description: 'Beautiful 3-bedroom villa with stunning sea views',
    price: 500000,
    currency: 'EUR',
    location: 'Kyrenia',
    category: { id: '1', slug: 'real-estate', name: 'Real Estate' },
    owner: { id: '1', username: 'demo' },
    dynamic_fields: {},
    listing_kind: 'offer',
    transaction_type: 'sale',
    status: 'active',
    views: 125,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Modern Apartment in Famagusta',
    description: 'Fully furnished 2-bedroom apartment in city center',
    price: 1200,
    currency: 'EUR',
    location: 'Famagusta',
    category: { id: '1', slug: 'real-estate', name: 'Real Estate' },
    owner: { id: '1', username: 'demo' },
    dynamic_fields: {},
    listing_kind: 'offer',
    transaction_type: 'rent_short',
    status: 'active',
    views: 89,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: '2020 Toyota Corolla',
    description: 'Excellent condition, low mileage',
    price: 15000,
    currency: 'EUR',
    location: 'Nicosia',
    category: { id: '2', slug: 'vehicles', name: 'Vehicles' },
    owner: { id: '1', username: 'demo' },
    dynamic_fields: {},
    listing_kind: 'offer',
    transaction_type: 'sale',
    status: 'active',
    views: 67,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useListings(options: UseListingsOptions = {}): UseListingsResult {
  const {
    category = null,
    subcategory = null,
    status = 'active',
    is_featured,
    limit,
    autoFetch = true,
    search,
    ordering,
  } = options;

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  /**
   * Map real estate v1 search results into the generic Explore Listing shape.
   * This lets the Explore UI reuse the same card/grid components for
   * real_estate listings.
   */
  const mapRealEstateListingToExploreListing = (
    item: ListingSearchResult,
    categorySlug: string
  ): Listing => {
    // Map listing type → transaction_type + subcategory slug/name
    let transaction_type: Listing['transaction_type'] = 'sale';
    let subcategorySlug: string | null = null;
    let subcategoryName: string | null = null;

    switch (item.listing_type_code) {
      case 'DAILY_RENTAL':
        transaction_type = 'rent_short';
        subcategorySlug = 'daily-rental';
        subcategoryName = 'Daily Rental';
        break;
      case 'LONG_TERM_RENTAL':
        transaction_type = 'rent_long';
        subcategorySlug = 'long-term';
        subcategoryName = 'Long-term Rental';
        break;
      case 'SALE':
        transaction_type = 'sale';
        subcategorySlug = 'sale';
        subcategoryName = 'For Sale';
        break;
      case 'PROJECT':
        transaction_type = 'project';
        subcategorySlug = 'projects';
        subcategoryName = 'Projects';
        break;
      default:
        transaction_type = 'sale';
    }

    // Basic location label
    const locationParts: string[] = [];
    if (item.city) locationParts.push(item.city);
    if (item.area) locationParts.push(item.area);
    const location = locationParts.join(', ');

    // Dynamic fields for property-style features used by Explore cards/modal
    const dynamic_fields: Record<string, any> = {
      bedrooms: item.bedrooms ?? undefined,
      bathrooms: item.bathrooms ?? undefined,
      square_meters: item.total_area_sqm ? Number(item.total_area_sqm) : undefined,
      furnished: item.furnished_status && item.furnished_status !== 'UNFURNISHED',
      parking: item.has_parking,
      pool: item.has_private_pool || item.has_shared_pool,
      sea_view: item.view_sea,
    };

    return {
      id: String(item.listing_id),
      title: item.title,
      description: item.description,
      price: Number(item.base_price),
      currency: item.currency,
      location,
      latitude: item.latitude ? Number(item.latitude) : undefined,
      longitude: item.longitude ? Number(item.longitude) : undefined,
      category: {
        id: 'real-estate',
        slug: categorySlug,
        name: categorySlug === 'properties' ? 'Properties' : 'Real Estate',
      },
      subcategory:
        subcategorySlug && subcategoryName
          ? {
            id: 0,
            slug: subcategorySlug,
            name: subcategoryName,
          }
          : undefined,
      owner: {
        id: 'real-estate',
        username: 'Real Estate',
      },
      dynamic_fields,
      listing_kind: 'offer',
      transaction_type,
      // Map v1 status into the simplified Explore status enum
      status:
        item.status === 'DRAFT'
          ? 'draft'
          : ['SOLD', 'RENTED'].includes(item.status)
            ? 'sold'
            : 'active',
      views: 0,
      is_featured: false,
      images: [],
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  };

  const fetchListings = async (overrides: Partial<UseListingsOptions> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const finalCategory = overrides.category !== undefined ? overrides.category : category;
      const finalSubcategory =
        overrides.subcategory !== undefined ? overrides.subcategory : subcategory;
      const finalStatus = overrides.status !== undefined ? overrides.status : status;
      const finalFeatured =
        overrides.is_featured !== undefined ? overrides.is_featured : is_featured;
      const finalLimit = overrides.limit !== undefined ? overrides.limit : limit;
      const finalSearch = overrides.search !== undefined ? overrides.search : search;
      const finalOrdering =
        overrides.ordering !== undefined ? overrides.ordering : ordering;

      const isRealEstateCategory =
        finalCategory === 'properties' || finalCategory === 'real-estate';

      // Use the real estate v1 search API for the Properties / Real Estate section
      if (isRealEstateCategory) {
        const reParams: ListingSearchParams = {
          limit: finalLimit ?? 50,
        };

        // Map Explore subcategory → listing_type filter
        if (finalSubcategory) {
          if (finalSubcategory === 'daily-rental') {
            reParams.listing_type = 'DAILY_RENTAL';
          } else if (finalSubcategory === 'long-term') {
            reParams.listing_type = 'LONG_TERM_RENTAL';
          } else if (finalSubcategory === 'sale') {
            reParams.listing_type = 'SALE';
          } else if (finalSubcategory === 'projects') {
            reParams.listing_type = 'PROJECT';
          }
        }

        // Basic sort mapping: created_at desc vs price asc/desc vs views (fallback)
        if (finalOrdering === 'price') {
          reParams.sort_by = 'price_asc';
        } else if (finalOrdering === '-price') {
          reParams.sort_by = 'price_desc';
        } else if (finalOrdering === 'created_at' || finalOrdering === '-created_at') {
          reParams.sort_by = 'created_at_desc';
        }

        const response = await searchRealEstateListings(reParams);

        // Map results to Explore listings, using cover_image from search results
        const listingsWithImages = response.results.map((item) => {
          const base = mapRealEstateListingToExploreListing(
            item,
            finalCategory || 'properties'
          );

          // If the search result has a cover_image, add it to the listing
          if (item.cover_image) {
            // Prepend API base URL if the image path is relative
            const imageUrl = item.cover_image.startsWith('http')
              ? item.cover_image
              : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.cover_image}`;

            return {
              ...base,
              images: [
                {
                  id: '0',
                  image: imageUrl,
                  uploaded_at: item.created_at,
                },
              ],
            } as Listing;
          }

          return base;
        });

        setListings(listingsWithImages);
        setHasMore(false);
        return;
      }

      const params = new URLSearchParams();

      if (finalCategory) params.append('category__slug', finalCategory);
      if (finalSubcategory) params.append('subcategory__slug', finalSubcategory);
      if (finalStatus) params.append('status', finalStatus);
      if (finalFeatured !== undefined) params.append('is_featured', String(finalFeatured));
      if (finalLimit) params.append('limit', String(finalLimit));
      if (finalSearch) params.append('search', finalSearch);
      if (finalOrdering) params.append('ordering', finalOrdering);

      const url = `/api/listings/?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data: ListingsResponse = await response.json();

      setListings(data.results || []);
      setHasMore(!!data.next);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Use placeholder listings filtered by category on error
      const fallbackCategory =
        overrides.category !== undefined ? overrides.category : category;
      if (fallbackCategory) {
        const filtered = PLACEHOLDER_LISTINGS.filter(
          (l) => l.category.slug === fallbackCategory
        );
        setListings(filtered);
      } else {
        setListings(PLACEHOLDER_LISTINGS);
      }
      console.warn('Using placeholder listings due to API error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchListings();
    }
  }, [category, subcategory, status, is_featured, limit, search, ordering, autoFetch]);

  return {
    listings,
    loading,
    error,
    hasMore,
    fetchListings,
    refetch: () => fetchListings(),
  };
}
