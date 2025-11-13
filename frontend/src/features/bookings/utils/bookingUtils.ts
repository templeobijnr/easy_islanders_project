/**
 * Booking System Utility Functions
 * Formatting, validation, and helper functions
 */

import type {
  BookingStatus,
  CancellationPolicy,
  PaymentStatus,
  Booking,
  BookingType,
} from '../types';

// Export types for consumer use
export type { BookingStatus, CancellationPolicy, PaymentStatus, Booking, BookingType };

// ============================================================================
// Status Formatting & Colors
// ============================================================================

export const statusConfig: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '📝',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '⏳',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🔄',
  },
  completed: {
    label: 'Completed',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '🎉',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌',
  },
};

export const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'Payment Pending',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  partial: {
    label: 'Partially Paid',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  paid: {
    label: 'Paid',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export const cancellationPolicyConfig: Record<
  CancellationPolicy,
  { label: string; description: string; color: string }
> = {
  flexible: {
    label: 'Flexible',
    description: 'Full refund up to 24 hours before start',
    color: 'text-green-600',
  },
  moderate: {
    label: 'Moderate',
    description: '50% refund up to 5 days before start',
    color: 'text-yellow-600',
  },
  strict: {
    label: 'Strict',
    description: '50% refund up to 30 days before start',
    color: 'text-orange-600',
  },
  non_refundable: {
    label: 'Non-refundable',
    description: 'No refunds allowed',
    color: 'text-red-600',
  },
};

// ============================================================================
// Date & Time Formatting
// ============================================================================

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format date to short string
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Format time to readable string
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format datetime to readable string
 */
export const formatDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Calculate duration in days between two dates
 */
export const calculateDurationDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date < new Date();
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date > new Date();
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.abs(Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffDay > 0) {
    return `${prefix}${diffDay} day${diffDay > 1 ? 's' : ''}${suffix}`;
  } else if (diffHour > 0) {
    return `${prefix}${diffHour} hour${diffHour > 1 ? 's' : ''}${suffix}`;
  } else if (diffMin > 0) {
    return `${prefix}${diffMin} minute${diffMin > 1 ? 's' : ''}${suffix}`;
  } else {
    return 'just now';
  }
};

// ============================================================================
// Price Formatting
// ============================================================================

/**
 * Format price with currency symbol
 */
export const formatPrice = (amount: string | number, currency: string = 'EUR'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const currencySymbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    TRY: '₺',
    RUB: '₽',
    PLN: 'zł',
  };

  const symbol = currencySymbols[currency] || currency;

  return `${symbol}${numAmount.toFixed(2)}`;
};

/**
 * Calculate total price from components
 */
export const calculateTotalPrice = (
  basePrice: number,
  serviceFees: number,
  taxes: number,
  discount: number = 0
): number => {
  return basePrice + serviceFees + taxes - discount;
};

/**
 * Parse price string to number
 */
export const parsePrice = (priceString: string): number => {
  return parseFloat(priceString) || 0;
};

// ============================================================================
// Booking Type Helpers
// ============================================================================

/**
 * Get icon component name or emoji for booking type
 */
export const getBookingTypeIcon = (bookingType: BookingType): string => {
  const iconMap: Record<string, string> = {
    'apartment-rental': '🏠',
    'apartment-viewing': '👁️',
    'service-booking': '🔧',
    'car-rental': '🚗',
    'hotel-booking': '🏨',
    'appointment': '📅',
  };
  return iconMap[bookingType.slug] || '📋';
};

/**
 * Get booking type color with fallback
 */
export const getBookingTypeColor = (bookingType: BookingType | string): string => {
  if (typeof bookingType === 'string') return bookingType;
  return bookingType.color || '#6CC24A';
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (international)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date range (end must be after start)
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end > start;
};

/**
 * Validate future date (must be in the future)
 */
export const isValidFutureDate = (dateString: string): boolean => {
  return isFutureDate(dateString);
};

/**
 * Validate price (must be positive)
 */
export const isValidPrice = (price: number | string): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice > 0;
};

// ============================================================================
// Booking Status Helpers
// ============================================================================

/**
 * Check if booking can be cancelled
 */
export const canCancelBooking = (booking: Booking): boolean => {
  // Cannot cancel if already completed or cancelled
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return false;
  }

  // Check cancellation deadline if set
  if (booking.cancellation_deadline) {
    const deadline = new Date(booking.cancellation_deadline);
    const now = new Date();
    return now < deadline;
  }

  // Use backend's can_cancel property if available
  if (booking.can_cancel !== undefined) {
    return booking.can_cancel;
  }

  return true;
};

/**
 * Check if booking can be confirmed (seller action)
 */
export const canConfirmBooking = (booking: Booking): boolean => {
  return booking.status === 'pending';
};

/**
 * Check if booking can be completed
 */
export const canCompleteBooking = (booking: Booking): boolean => {
  return booking.status === 'in_progress' || booking.status === 'confirmed';
};

/**
 * Check if booking can be reviewed
 */
export const canReviewBooking = (booking: Booking): boolean => {
  return booking.status === 'completed';
};

/**
 * Get available actions for booking based on status
 */
export const getAvailableActions = (booking: Booking, isOwner: boolean, isSeller: boolean) => {
  const actions: Array<{ action: string; label: string; variant: 'primary' | 'secondary' | 'danger' }> = [];

  if (isSeller && canConfirmBooking(booking)) {
    actions.push({ action: 'confirm', label: 'Confirm Booking', variant: 'primary' });
  }

  if ((isOwner || isSeller) && canCancelBooking(booking)) {
    actions.push({ action: 'cancel', label: 'Cancel Booking', variant: 'danger' });
  }

  if (isSeller && canCompleteBooking(booking)) {
    actions.push({ action: 'complete', label: 'Mark as Completed', variant: 'primary' });
  }

  if (isOwner && canReviewBooking(booking)) {
    actions.push({ action: 'review', label: 'Leave Review', variant: 'secondary' });
  }

  return actions;
};

// ============================================================================
// Reference Number Helpers
// ============================================================================

/**
 * Format reference number for display
 */
export const formatReferenceNumber = (refNumber: string): string => {
  return refNumber.toUpperCase();
};

/**
 * Extract year from reference number
 */
export const extractYearFromReference = (refNumber: string): string | null => {
  const match = refNumber.match(/BK-(\d{4})-\d+/);
  return match ? match[1] : null;
};

// ============================================================================
// Guest Count Helpers
// ============================================================================

/**
 * Format guest count string (e.g., "2 adults, 1 child")
 */
export const formatGuestCount = (
  adults?: number,
  children?: number,
  infants?: number
): string => {
  const parts: string[] = [];

  if (adults && adults > 0) {
    parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
  }
  if (children && children > 0) {
    parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
  }
  if (infants && infants > 0) {
    parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
  }

  return parts.join(', ') || 'No guests specified';
};

// ============================================================================
// Export all utilities
// ============================================================================

export const bookingUtils = {
  // Status
  statusConfig,
  paymentStatusConfig,
  cancellationPolicyConfig,

  // Date & Time
  formatDate,
  formatDateShort,
  formatTime,
  formatDateTime,
  calculateDurationDays,
  isPastDate,
  isFutureDate,
  getRelativeTime,

  // Price
  formatPrice,
  calculateTotalPrice,
  parsePrice,

  // Booking Type
  getBookingTypeIcon,
  getBookingTypeColor,

  // Validation
  isValidEmail,
  isValidPhone,
  isValidDateRange,
  isValidFutureDate,
  isValidPrice,

  // Status Helpers
  canCancelBooking,
  canConfirmBooking,
  canCompleteBooking,
  canReviewBooking,
  getAvailableActions,

  // Reference Number
  formatReferenceNumber,
  extractYearFromReference,

  // Guest Count
  formatGuestCount,
};

export default bookingUtils;
