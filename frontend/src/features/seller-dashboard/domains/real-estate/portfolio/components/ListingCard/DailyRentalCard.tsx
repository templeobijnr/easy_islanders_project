/**
 * DailyRentalCard - Card for daily rental listings
 *
 * Displays metrics like bookings, messages, occupancy, next booking
 */

import React from 'react';
import { Calendar, DollarSign, TrendingUp, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import { ListingCard, ListingCardAction } from './ListingCard';

interface DailyRentalData {
  id: string;
  title: string;
  reference_code?: string;
  image_url?: string;
  base_price: number;
  currency: string;
  status: 'available' | 'booked' | 'unavailable';

  // Metrics
  new_messages: number;
  booking_requests: number;
  bookings_this_month: number;
  views_30d: number;
  occupancy_rate?: number;

  // Next booking
  next_booking?: {
    check_in: string;
    check_out: string;
    guest_name?: string;
  };
}

interface DailyRentalCardProps {
  listing: DailyRentalData;
  onMessageClick: () => void;
  onRequestClick: () => void;
  onBookingsClick: () => void;
  onCalendarClick: () => void;
  onPricingClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBoost?: () => void;
  onDiscount?: () => void;
  onViewAnalytics?: () => void;
}

export const DailyRentalCard: React.FC<DailyRentalCardProps> = ({
  listing,
  onMessageClick,
  onRequestClick,
  onBookingsClick,
  onCalendarClick,
  onPricingClick,
  onEdit,
  onDelete,
  onBoost,
  onDiscount,
  onViewAnalytics,
}) => {
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.base_price);

  // Format next booking
  const formatNextBooking = () => {
    if (!listing.next_booking) return null;

    const checkIn = new Date(listing.next_booking.check_in);
    const checkOut = new Date(listing.next_booking.check_out);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return `${formatDate(checkIn)}-${formatDate(checkOut)}`;
  };

  // Status mapping
  const statusConfig = {
    available: { label: 'Available', variant: 'active' as const },
    booked: { label: 'Booked', variant: 'info' as const },
    unavailable: { label: 'Unavailable', variant: 'inactive' as const },
  };

  // Metrics
  const metrics = [
    {
      icon: '💬',
      label: listing.new_messages > 0
        ? `${listing.new_messages} new message${listing.new_messages !== 1 ? 's' : ''}`
        : 'No new messages',
      onClick: onMessageClick,
      highlight: listing.new_messages > 0,
    },
    {
      icon: '📩',
      label: listing.booking_requests > 0
        ? `${listing.booking_requests} booking request${listing.booking_requests !== 1 ? 's' : ''}`
        : 'No pending requests',
      onClick: onRequestClick,
      highlight: listing.booking_requests > 0,
    },
    {
      icon: '📊',
      label: `${listing.bookings_this_month} booking${listing.bookings_this_month !== 1 ? 's' : ''} this month`,
      onClick: onBookingsClick,
    },
    {
      icon: '👁',
      label: `${listing.views_30d} views (30 days)`,
    },
  ];

  // Add next booking if exists
  if (listing.next_booking) {
    metrics.push({
      icon: '📅',
      label: `Next: ${formatNextBooking()}`,
    });
  }

  // Add occupancy if available
  if (listing.occupancy_rate !== undefined) {
    metrics.push({
      icon: '📈',
      label: `${listing.occupancy_rate.toFixed(1)}% occupancy`,
    });
  }

  // Primary actions
  const primaryActions: ListingCardAction[] = [
    {
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      onClick: onCalendarClick,
      variant: 'primary',
    },
    {
      label: 'Pricing',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onPricingClick,
    },
  ];

  // Menu actions
  const menuActions: ListingCardAction[] = [
    {
      label: 'Edit Listing',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    },
  ];

  if (onViewAnalytics) {
    menuActions.push({
      label: 'View Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: onViewAnalytics,
    });
  }

  if (onBoost) {
    menuActions.push({
      label: 'Boost Listing',
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: onBoost,
    });
  }

  if (onDiscount) {
    menuActions.push({
      label: 'Apply Discount',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onDiscount,
    });
  }

  menuActions.push({
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'danger',
  });

  return (
    <ListingCard
      imageUrl={listing.image_url}
      imageFallback="No Image"
      title={listing.title}
      subtitle={listing.reference_code}
      price={formattedPrice}
      priceLabel="per night"
      status={statusConfig[listing.status]}
      metrics={metrics}
      primaryActions={primaryActions}
      menuActions={menuActions}
    />
  );
};

/**
 * Example usage:
 *
 * <DailyRentalCard
 *   listing={{
 *     id: '123',
 *     title: 'Kyrenia Beach Villa',
 *     reference_code: 'KYR-001',
 *     base_price: 120,
 *     currency: 'EUR',
 *     status: 'available',
 *     new_messages: 3,
 *     booking_requests: 2,
 *     bookings_this_month: 12,
 *     views_30d: 45,
 *     occupancy_rate: 78.5,
 *     next_booking: {
 *       check_in: '2024-12-15',
 *       check_out: '2024-12-20'
 *     }
 *   }}
 *   onMessageClick={() => console.log('Open messages')}
 *   onRequestClick={() => console.log('Open requests')}
 *   onBookingsClick={() => console.log('Open bookings')}
 *   onCalendarClick={() => console.log('Open calendar')}
 *   onPricingClick={() => console.log('Open pricing')}
 *   onEdit={() => console.log('Edit listing')}
 *   onDelete={() => console.log('Delete listing')}
 * />
 */
