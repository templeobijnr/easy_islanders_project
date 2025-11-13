/**
 * Unified schema types for the application
 */

import { Category, SubCategory, SchemaField, CategorySchema } from './category';
import { Listing, ListingDetail, CreateListingRequest, UpdateListingRequest } from './listing';

// Re-export for convenience
export type { Category, SubCategory, SchemaField, CategorySchema };
export type { Listing, ListingDetail, CreateListingRequest, UpdateListingRequest };

/**
 * API Response types
 */
export interface CategoriesResponse {
  categories?: Category[];
  results?: Category[];
  count?: number;
  next?: string;
  previous?: string;
}

export interface SubCategoriesResponse {
  subcategories?: SubCategory[];
  results?: SubCategory[];
  count?: number;
  next?: string;
  previous?: string;
}

export interface ListingsResponse {
  listings?: Listing[];
  results?: Listing[];
  count?: number;
  limit?: number;
  offset?: number;
  next?: string;
  previous?: string;
}

/**
 * Listing filter options
 */
export interface ListingFilters {
  category?: string;
  categoryId?: string;
  categorySlug?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Form field state during creation/editing
 */
export interface FormFieldState {
  [fieldName: string]: any;
}

/**
 * Validation error for a field
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Form state during submission
 */
export interface FormSubmissionState {
  isLoading: boolean;
  errors: FieldError[];
  generalError?: string;
  success?: boolean;
}

/**
 * Hook return type for data fetching
 */
export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook return type for mutation (create/update/delete)
 */
export interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (payload: any) => Promise<T>;
  reset: () => void;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  limit: number;
  offset: number;
}

/**
 * Category-specific field renderer props
 */
export interface FieldRendererProps {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Listing card display props
 */
export interface ListingCardProps {
  listing: Listing;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (listing: Listing) => void;
  variant?: 'compact' | 'full';
}

/**
 * Dynamic form component props
 */
export interface DynamicFormProps {
  category: Category;
  initialValues?: FormFieldState;
  onSubmit: (values: FormFieldState) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

/**
 * Booking-related types
 */
export interface Booking {
  id: string;
  listing: string;
  listing_title?: string;
  booking_type: 'short_term' | 'long_term';
  check_in?: string; // ISO date
  check_out?: string; // ISO date
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price?: number;
  currency?: string;
  notes?: string;
  duration_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BookingRequest {
  listing_id: string;
  check_in?: string;
  check_out?: string;
  booking_type: 'short_term' | 'long_term';
  notes?: string;
}

export interface AvailabilityCheckRequest {
  listing_id: string;
  check_in: string;
  check_out: string;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  conflicts: Array<{
    id: string;
    check_in: string;
    check_out: string;
    status: string;
  }>;
}
