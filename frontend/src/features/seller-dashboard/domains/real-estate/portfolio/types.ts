/**
 * Portfolio data types and contracts
 */

export type ListingTypeCode = "DAILY_RENTAL" | "LONG_TERM_RENTAL" | "SALE" | "PROJECT";

export type ListingStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "UNDER_OFFER"
  | "SOLD"
  | "RENTED";

export type PricePeriod = "PER_DAY" | "PER_MONTH" | "TOTAL" | "STARTING_FROM";

export type FilterListingType = "ALL" | ListingTypeCode;
export type FilterStatus = "ALL" | ListingStatus;

export interface PortfolioListing {
  id: number;
  reference_code: string;
  listing_type: ListingTypeCode;
  status: ListingStatus;

  title: string;
  city: string | null;
  area: string | null;

  bedrooms: number | null;
  bathrooms: number | null;
  room_configuration_label: string | null;

  base_price: string;
  currency: string;
  price_period: PricePeriod;

  available_from: string | null;
  available_to: string | null;

  availability_label: string;

  views_30d: number;
  enquiries_30d: number;
  bookings_30d: number;

  created_at: string;
  updated_at: string;

  has_wifi: boolean;
  has_kitchen: boolean;
  has_pool: boolean;
  has_private_pool: boolean;
  has_sea_view: boolean;
}

export interface PortfolioListingsResponse {
  results: PortfolioListing[];
  page: number;
  page_size: number;
  total: number;
}

export interface PortfolioSummaryItem {
  listing_type: ListingTypeCode;
  total_listings: number;
  active_listings: number;

  occupied_units?: number;
  vacant_units?: number;

  avg_price: string | null;
  views_30d: number;
  enquiries_30d: number;
  bookings_30d: number;
}

export type PortfolioSummaryResponse = PortfolioSummaryItem[];

export interface PortfolioFilters {
  listing_type: FilterListingType;
  status: FilterStatus;
  city?: string;
  area?: string;
  search?: string;
  page: number;
  page_size?: number;
}

export interface ListingUpdatePayload {
  title?: string;
  description?: string;
  base_price?: number;
  currency?: string;
  price_period?: PricePeriod;
  status?: ListingStatus;
  available_from?: string | null;
  available_to?: string | null;
}
