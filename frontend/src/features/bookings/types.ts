/**
 * TypeScript types for Easy Islanders Booking System
 * Matches backend Django models and API contracts
 */

// ============================================================================
// Booking Types
// ============================================================================

export type BookingStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CancellationPolicy =
  | 'flexible'
  | 'moderate'
  | 'strict'
  | 'non_refundable';

export type PaymentStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'refunded';

export type PaymentMethod =
  | 'credit_card'
  | 'bank_transfer'
  | 'cash'
  | 'paypal'
  | 'other';

// ============================================================================
// Booking Type (Category)
// ============================================================================

export interface BookingType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;

  // Capabilities
  requires_dates: boolean;
  requires_time_slot: boolean;
  requires_guests: boolean;
  requires_vehicle_info: boolean;

  // Flexible schema for dynamic fields
  schema: {
    fields: Array<{
      name: string;
      type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'time';
      label: string;
      required?: boolean;
      choices?: string[];
      default?: any;
    }>;
  };

  is_active: boolean;
  created_at: string;
}

// ============================================================================
// Base Booking Model
// ============================================================================

export interface Booking {
  id: string;
  reference_number: string;
  booking_type: string; // UUID
  booking_type_details?: BookingType;
  user: string; // UUID
  listing?: string; // UUID
  listing_details?: {
    id: string;
    title: string;
    address: string;
    image?: string;
  };

  // Status & Workflow
  status: BookingStatus;

  // Dates & Times
  start_date?: string; // ISO datetime
  end_date?: string; // ISO datetime
  start_time?: string; // HH:MM:SS
  end_time?: string; // HH:MM:SS
  duration_days?: number;

  // Pricing
  base_price: string; // Decimal as string
  service_fees: string;
  taxes: string;
  discount: string;
  total_price: string;
  currency: string;

  // Contact Information
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Guest Information
  guests_count?: number;
  special_requests?: string;

  // Cancellation
  cancellation_policy: CancellationPolicy;
  cancellation_deadline?: string;
  cancellation_reason?: string;
  cancelled_by?: string;

  // Payment
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_amount?: string;
  payment_date?: string;

  // Metadata
  booking_data: Record<string, any>; // Flexible JSON data
  notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;

  // Computed properties
  is_active?: boolean;
  can_cancel?: boolean;
}

// ============================================================================
// Type-Specific Booking Extensions
// ============================================================================

export interface ApartmentRentalBooking {
  booking: string;
  apartment: string;
  number_of_adults: number;
  number_of_children: number;
  number_of_infants: number;
  pets_allowed: boolean;
  pet_details?: string;
  check_in_instructions?: string;
  wifi_password?: string;
  parking_info?: string;
  amenities_requested?: string[];
  cleaning_service_requested: boolean;
  cleaning_fee?: string;
}

export interface ApartmentViewingBooking {
  booking: string;
  apartment: string;
  viewing_date: string;
  viewing_time: string;
  duration_minutes: number;
  is_buyer: boolean;
  is_renter: boolean;
  budget_min?: string;
  budget_max?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_company?: string;
  viewing_outcome?: string;
}

export interface ServiceBooking {
  booking: string;
  service_type: 'cleaning' | 'repair' | 'maintenance' | 'plumbing' | 'electrical' | 'other';
  service_provider?: string; // BusinessProfile UUID
  service_provider_details?: {
    name: string;
    phone: string;
    rating?: number;
  };
  service_description: string;
  location_address: string;
  access_instructions?: string;
  equipment_needed?: string[];
  estimated_duration_hours?: number;
  completion_notes?: string;
}

export interface CarRentalBooking {
  booking: string;
  vehicle: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  driver_name: string;
  driver_license_number: string;
  driver_age: number;
  driver_license_country: string;
  insurance_type: 'basic' | 'standard' | 'premium';
  additional_drivers: number;
  fuel_policy: 'full_to_full' | 'same_to_same' | 'prepaid';
  mileage_limit?: number;
  current_mileage?: number;
  add_gps: boolean;
  add_child_seat: boolean;
}

export interface HotelBooking {
  booking: string;
  hotel: string;
  room_type: 'single' | 'double' | 'twin' | 'suite' | 'deluxe';
  number_of_rooms: number;
  number_of_guests: number;
  meal_plan: 'none' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  smoking_preference: boolean;
  floor_preference?: string;
  bed_type_preference?: string;
  early_checkin_requested: boolean;
  late_checkout_requested: boolean;
  airport_transfer_needed: boolean;
}

export interface AppointmentBooking {
  booking: string;
  service_provider: string; // BusinessProfile UUID
  service_provider_details?: {
    name: string;
    specialty: string;
    rating?: number;
  };
  appointment_type: 'hair' | 'beauty' | 'medical' | 'dental' | 'consultation' | 'fitness' | 'legal' | 'other';
  duration_minutes: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  reminder_sent: boolean;
  no_show: boolean;
  reschedule_count: number;
}

// ============================================================================
// Booking with Type-Specific Details
// ============================================================================

export interface BookingDetail extends Booking {
  apartment_rental?: ApartmentRentalBooking;
  viewing?: ApartmentViewingBooking;
  service?: ServiceBooking;
  car_rental?: CarRentalBooking;
  hotel?: HotelBooking;
  appointment?: AppointmentBooking;
}

// ============================================================================
// Booking History (Audit Trail)
// ============================================================================

export interface BookingHistory {
  id: string;
  booking: string;
  changed_by: string;
  changed_by_name?: string;
  change_type: 'created' | 'updated' | 'confirmed' | 'cancelled' | 'completed' | 'payment_received' | 'refunded';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  notes?: string;
  created_at: string;
}

// ============================================================================
// Booking Review
// ============================================================================

export interface BookingReview {
  id: string;
  booking: string;
  reviewer: string;
  reviewer_name?: string;
  rating: number; // 1-5
  review_text: string;

  // Detailed ratings
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  location_rating?: number;
  average_detailed_rating?: number;

  // Seller response
  seller_response?: string;
  seller_response_date?: string;

  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Booking Availability
// ============================================================================

export interface BookingAvailability {
  id: string;
  listing?: string;
  service_provider?: string;
  date: string; // YYYY-MM-DD
  start_time?: string;
  end_time?: string;
  max_bookings: number;
  current_bookings: number;
  is_blocked: boolean;
  blocked_reason?: string;
  price_override?: string;
}

export interface AvailabilityCheckRequest {
  listing_id?: string;
  service_provider_id?: string;
  start_date: string;
  end_date: string;
}

export interface AvailabilityCheckResponse {
  is_available: boolean;
  unavailable_dates: string[];
  checked_dates: string[];
  message: string;
}

export interface CalendarDay {
  date: string;
  is_available: boolean;
  price?: string;
  is_blocked: boolean;
  current_bookings: number;
  max_bookings: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface BookingCreateRequest {
  booking_type: string; // UUID
  listing?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  base_price: string;
  service_fees: string;
  taxes: string;
  discount?: string;
  total_price: string;
  currency: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  guests_count?: number;
  special_requests?: string;
  cancellation_policy: CancellationPolicy;
  booking_data?: Record<string, any>;

  // Type-specific data
  type_specific_data?: Partial<
    ApartmentRentalBooking |
    ApartmentViewingBooking |
    ServiceBooking |
    CarRentalBooking |
    HotelBooking |
    AppointmentBooking
  >;
}

export interface BookingUpdateRequest {
  special_requests?: string;
  notes?: string;
  booking_data?: Record<string, any>;
}

export interface BookingConfirmRequest {
  notes?: string;
}

export interface BookingCancelRequest {
  reason: string;
}

export interface BookingCompleteRequest {
  completion_notes?: string;
}

export interface BookingStatistics {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spent: string;
  upcoming_bookings: number;
  by_type: Record<string, number>;
  by_status: Record<BookingStatus, number>;
}

// ============================================================================
// API Response Types (Paginated)
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];
  booking_type?: string; // UUID or slug
  start_date_after?: string;
  start_date_before?: string;
  payment_status?: PaymentStatus;
  search?: string; // Reference number, contact info
  ordering?: string; // e.g., '-created_at', 'start_date'
  page?: number;
  page_size?: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface BookingFormData extends Omit<BookingCreateRequest, 'booking_type'> {
  booking_type: BookingType;
}

export type BookingFormStep =
  | 'type-selection'
  | 'details'
  | 'dates'
  | 'pricing'
  | 'contact'
  | 'review'
  | 'confirmation';

export interface BookingWizardState {
  currentStep: BookingFormStep;
  steps: BookingFormStep[];
  data: Partial<BookingFormData>;
  errors: Record<string, string>;
  isLoading: boolean;
}
