/**
 * Canonical recommendation card item interface.
 *
 * ⚠️ **RecItem v1 — DO NOT RENAME/REMOVE FIELDS WITHOUT A VERSION BUMP**
 *
 * This is the single source of truth for all real estate recommendation cards
 * from the AI agent. Every property search result (daily rental, long-term,
 * sale, project) must be serialized as a RecItem.
 *
 * Wire format: WebSocket message.recommendations = RecItem[]
 *
 * Components consuming this:
 * - RecommendationCard (generic card)
 * - ShortTermRecommendationCard (enhanced card for daily rentals)
 *
 * @version 1.0.0
 * @see docs/RECITEM_CONTRACT.md for versioning policy
 */
export interface RecItem {
  /** Listing ID (maps to backend Listing.id) */
  id: string;

  /** Main title (e.g., "2+1 Sea View Apartment") */
  title: string;

  /** Optional subtitle (e.g., "Near Long Beach · İskele") */
  subtitle?: string;

  /** Legacy reason field (backwards compatibility) */
  reason?: string;

  /** Formatted price string (e.g., "£750 / month", "€120 / night") */
  price?: string;

  /** Rating out of 5 (e.g., 4.5) */
  rating?: number;

  /** Distance in minutes (e.g., 12) */
  distanceMins?: number;

  /** Short curated badges (3-6 items, e.g., ["WiFi", "Pool", "Sea View"]) */
  badges?: string[];

  /** Hero image URL */
  imageUrl?: string;

  /** Short area label (e.g., "Kyrenia · Catalkoy") */
  area?: string;

  /** Gallery image URLs for photo viewer */
  galleryImages?: string[];

  /** Extended metadata for detailed views */
  metadata?: RecItemMetadata;
}

/**
 * Extended metadata for RecItem.
 * Used in info modals and detailed views.
 */
export interface RecItemMetadata {
  /** Number of bedrooms */
  bedrooms?: number;

  /** Number of bathrooms */
  bathrooms?: number;

  /** Full amenities/features list */
  amenities?: string[];

  /** Total area in square meters */
  sqm?: number;

  /** Full property description */
  description?: string;

  /** Rental type: "daily" | "long_term" | "sale" | "project" */
  rent_type?: 'daily' | 'long_term' | 'sale' | 'project';

  /** Contact information (optional) */
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };

  /** Additional location info (optional) */
  location?: string;
}

/**
 * Type guard to check if a RecItem is for daily rental
 */
export function isDailyRental(item: RecItem): boolean {
  return item.metadata?.rent_type === 'daily';
}

/**
 * Type guard to check if a RecItem is for long-term rental
 */
export function isLongTermRental(item: RecItem): boolean {
  return item.metadata?.rent_type === 'long_term';
}

/**
 * Type guard to check if a RecItem is for sale
 */
export function isForSale(item: RecItem): boolean {
  return item.metadata?.rent_type === 'sale';
}

/**
 * Type guard to check if a RecItem is a project
 */
export function isProject(item: RecItem): boolean {
  return item.metadata?.rent_type === 'project';
}
