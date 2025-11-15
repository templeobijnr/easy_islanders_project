/**
 * TypeScript interfaces matching Django real_estate models
 * Auto-generated based on real_estate/models.py
 */

// ============================================================================
// 1. CORE REFERENCE TYPES
// ============================================================================

export interface Location {
  id: number;
  country: string;
  region: string;
  city: string;
  area: string;
  address_line: string;
  latitude: string | null;
  longitude: string | null;
}

export interface PropertyType {
  id: number;
  code: string;
  label: string;
  category: 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND';
}

export interface FeatureCategory {
  id: number;
  code: string;
  label: string;
  sort_order: number;
}

export interface Feature {
  id: number;
  code: string;
  label: string;
  category: FeatureCategory;
  group: 'INTERNAL' | 'EXTERNAL' | 'LOCATION' | 'SAFETY' | 'BUILDING' | 'OTHER';
  is_filterable: boolean;
  sort_order: number;
  is_required_for_daily_rental: boolean;
}

export interface TitleDeedType {
  id: number;
  code: string;
  label: string;
}

export interface UtilityType {
  id: number;
  code: string;
  label: string;
}

export interface TaxType {
  id: number;
  code: string;
  label: string;
}

// ============================================================================
// 2. PEOPLE / CRM TYPES
// ============================================================================

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  nationality: string;
  notes: string;
}

export interface ContactRole {
  id: number;
  contact: Contact;
  role: 'LEAD' | 'CLIENT' | 'OWNER' | 'TENANT' | 'AGENT';
  active_from: string;
  active_to: string | null;
}

export interface Lead {
  id: number;
  contact: Contact;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';
  created_at: string;
  assigned_agent: number | null;
}

export interface Client {
  id: number;
  contact: Contact;
  created_at: string;
}

// ============================================================================
// 3. PROJECT TYPES
// ============================================================================

export interface Project {
  id: number;
  name: string;
  developer: Contact | null;
  location: Location;
  total_units: number | null;
  completion_date_estimate: string | null;
  min_unit_area_sqm: string | null;
  max_unit_area_sqm: string | null;
  min_price: string | null;
  max_price: string | null;
  currency: string;
  payment_plan_json: Record<string, any>;
  description: string;
  created_at: string;
  analytics_metadata: Record<string, any>;
}

export interface ProjectUnitType {
  id: number;
  project: Project;
  name: string;
  property_type: PropertyType | null;
  bedrooms: number;
  living_rooms: number;
  bathrooms: number;
  room_configuration_label: string;
  area_sqm: string;
  price: string;
  currency: string;
  features: Feature[];
}

// ============================================================================
// 4. PROPERTY TYPES
// ============================================================================

export interface Property {
  id: number;
  reference_code: string;
  title: string;
  description: string;
  location: Location;
  property_type: PropertyType;
  building_name: string;
  flat_number: string;
  floor_number: number | null;
  total_area_sqm: string | null;
  net_area_sqm: string | null;
  bedrooms: number;
  living_rooms: number;
  bathrooms: number;
  room_configuration_label: string;
  furnished_status: 'UNFURNISHED' | 'PARTLY_FURNISHED' | 'FULLY_FURNISHED';
  floor_of_building: number | null;
  total_floors: number | null;
  year_built: number | null;
  is_gated_community: boolean;
  title_deed_type: TitleDeedType | null;
  project: Project | null;
  features: Feature[];
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PropertyOwner {
  id: number;
  property: Property;
  contact: Contact;
  ownership_percentage: string;
  is_primary: boolean;
}

export interface PropertyUtilityAccount {
  id: number;
  property: Property;
  utility_type: UtilityType;
  provider_name: string;
  account_number: string;
  meter_number: string;
  notes: string;
}

export interface PropertyTax {
  id: number;
  property: Property;
  tax_type: TaxType;
  amount: string | null;
  currency: string;
  billing_period: string;
}

// ============================================================================
// 5. LISTING TYPES
// ============================================================================

export interface ListingType {
  id: number;
  code: 'DAILY_RENTAL' | 'LONG_TERM_RENTAL' | 'SALE' | 'PROJECT';
  label: string;
}

export interface Listing {
  id: number;
  reference_code: string;
  listing_type: ListingType;
  property: Property | null;
  project: Project | null;
  owner: Contact | null;
  title: string;
  description: string;
  base_price: string;
  currency: string;
  price_period: 'PER_DAY' | 'PER_MONTH' | 'TOTAL' | 'STARTING_FROM';
  available_from: string | null;
  available_to: string | null;
  is_active: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'UNDER_OFFER' | 'SOLD' | 'RENTED';
  created_by: number | null;
  created_at: string;
  updated_at: string;

  // Relations (populated via API)
  rental_details?: RentalDetails;
  sale_details?: SaleDetails;
  project_details?: ProjectListingDetails;
  image_urls?: string[];
  tenancies?: Tenancy[];
  deals?: Deal[];
  events?: ListingEvent[];
}

export interface RentalDetails {
  id: number;
  listing: number;
  rental_kind: 'DAILY' | 'LONG_TERM';
  min_days: number | null;
  min_months: number | null;
  deposit_amount: string | null;
  deposit_currency: string;
  utilities_included: Record<string, boolean>;
  notes: string;
}

export interface SaleDetails {
  id: number;
  listing: number;
  is_swap_possible: boolean;
  negotiable: boolean;
}

export interface ProjectListingDetails {
  id: number;
  listing: number;
  completion_date: string | null;
  min_unit_area_sqm: string | null;
  max_unit_area_sqm: string | null;
  payment_plan_json: Record<string, any>;
}

// ============================================================================
// 6. TENANCY AND BOOKING TYPES
// ============================================================================

export interface Tenancy {
  id: number;
  property: Property;
  listing: Listing | null;
  tenant: Contact;
  tenancy_kind: 'DAILY' | 'LONG_TERM';
  start_date: string;
  end_date: string;
  rent_amount: string;
  rent_currency: string;
  deposit_amount: string | null;
  status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  created_at: string;
}

// ============================================================================
// 7. DEAL TYPES
// ============================================================================

export interface Deal {
  id: number;
  client: Client;
  listing: Listing | null;
  property: Property | null;
  deal_type: 'RENTAL' | 'SALE' | 'PROJECT_SALE';
  stage: 'NEW' | 'NEGOTIATION' | 'RESERVATION' | 'CONTRACT_SIGNED' | 'CLOSED_WON' | 'CLOSED_LOST';
  expected_close_date: string | null;
  actual_close_date: string | null;
  agreed_price: string | null;
  currency: string;
  commission_amount: string | null;
  created_at: string;
}

// ============================================================================
// 8. ANALYTICS TYPES
// ============================================================================

export interface ListingEvent {
  id: number;
  listing: number;
  occurred_at: string;
  event_type: 'VIEW' | 'ENQUIRY' | 'BOOKING_REQUEST' | 'BOOKING_CONFIRMED' | 'WHATSAPP_CLICK';
  source: string;
  metadata: Record<string, any>;
}

export interface AreaMarketStats {
  id: number;
  location: Location;
  property_type: PropertyType | null;
  metric: 'RENT_PRICE_PER_SQM' | 'SALE_PRICE_PER_SQM';
  data: {
    points: Array<{
      date: string;
      value: number;
    }>;
  };
}

export interface AreaDemographics {
  id: number;
  location: Location;
  socio_economic_grade: string;
  data: {
    age?: Record<string, number>;
    education?: Record<string, number>;
    occupation?: Record<string, number>;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListingSummary {
  listing_id: number;
  reference_code: string;
  title: string;
  listing_type_code: string;
  status: string;
  base_price: string;
  currency: string;
  location_city: string;
  location_area: string;
  bedrooms: number;
  bathrooms: number;
  property_type_label: string;
  image_url: string | null;

  // Stats
  new_messages_count: number;
  pending_requests_count: number;
  bookings_30d_count: number;
  occupancy_rate_30d: number;

  // Ownership
  managed_for_others: boolean;
  owner_name: string | null;

  // Current tenancy
  current_tenant_name: string | null;
  current_lease_end_date: string | null;
}

export interface PortfolioStats {
  listing_type_code: string;
  active_count: number;
  total_count: number;

  // Daily rental specific
  booked_this_month?: number;
  pending_requests?: number;

  // Long-term specific
  rented_count?: number;
  pending_applications?: number;

  // Sale specific
  under_offer_count?: number;
  viewing_requests_count?: number;
  offers_received_count?: number;

  // Project specific
  total_units?: number;
  available_units?: number;
  enquiries_count?: number;
}
