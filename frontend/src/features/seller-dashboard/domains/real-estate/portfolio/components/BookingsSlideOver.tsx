/**
 * BookingsSlideOver Component
 *
 * Slide-over panel for viewing all bookings (past, current, upcoming) for a specific listing
 */

import React, { useState } from 'react';
import { X, User, Calendar, Users, DollarSign, MessageSquare, Eye } from 'lucide-react';

type BookingStatus = 'upcoming' | 'current' | 'completed' | 'cancelled';
type FilterStatus = 'all' | BookingStatus;
type SortOption = 'date-asc' | 'date-desc' | 'guest-name';

interface Booking {
  id: string;
  guest: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
  };
  total_price: number;
  currency: string;
  status: BookingStatus;
  booked_at: string;
  special_requests?: string;
  payment_status: 'paid' | 'pending' | 'refunded';
}

interface BookingsSlideOverProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  bookings?: Booking[];
  isLoading?: boolean;
  onViewDetails?: (bookingId: string) => void;
  onMessageGuest?: (bookingId: string) => void;
}

export const BookingsSlideOver: React.FC<BookingsSlideOverProps> = ({
  listingId,
  listingTitle,
  isOpen,
  onClose,
  bookings = [],
  isLoading = false,
  onViewDetails,
  onMessageGuest,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.check_in).getTime() - new Date(b.check_in).getTime();
      case 'date-desc':
        return new Date(b.check_in).getTime() - new Date(a.check_in).getTime();
      case 'guest-name':
        return a.guest.name.localeCompare(b.guest.name);
      default:
        return 0;
    }
  });

  // Group bookings by status
  const groupedBookings = {
    upcoming: sortedBookings.filter(b => b.status === 'upcoming'),
    current: sortedBookings.filter(b => b.status === 'current'),
    completed: sortedBookings.filter(b => b.status === 'completed'),
    cancelled: sortedBookings.filter(b => b.status === 'cancelled'),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (checkIn: string, checkOut: string, nights: number) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const formatShort = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return `${formatShort(start)}-${formatShort(end)}, ${start.getFullYear()} (${nights} night${nights !== 1 ? 's' : ''})`;
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', color: 'bg-sky-100 text-sky-700', icon: '📅' };
      case 'current':
        return { label: 'Current', color: 'bg-emerald-100 text-emerald-700', icon: '🏠' };
      case 'completed':
        return { label: 'Completed', color: 'bg-slate-100 text-slate-700', icon: '✓' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-rose-100 text-rose-700', icon: '✕' };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Paid', color: 'text-emerald-600' };
      case 'pending':
        return { label: 'Pending', color: 'text-amber-600' };
      case 'refunded':
        return { label: 'Refunded', color: 'text-slate-600' };
      default:
        return { label: status, color: 'text-slate-600' };
    }
  };

  const renderBookingCard = (booking: Booking) => {
    const statusConfig = getStatusConfig(booking.status);
    const paymentConfig = getPaymentStatusConfig(booking.payment_status);

    return (
      <div key={booking.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-lime-300 transition-colors">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
          <span className={`text-xs font-medium ${paymentConfig.color}`}>
            {paymentConfig.label}
          </span>
        </div>

        {/* Guest info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
            {booking.guest.avatar ? (
              <img src={booking.guest.avatar} alt={booking.guest.name} className="w-full h-full rounded-full" />
            ) : (
              <User className="h-5 w-5 text-slate-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{booking.guest.name}</h3>
            <p className="text-xs text-slate-500">{booking.guest.email}</p>
          </div>
        </div>

        {/* Booking details */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{formatDateRange(booking.check_in, booking.check_out, booking.nights)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            <span>
              {booking.guests.adults} adult{booking.guests.adults !== 1 ? 's' : ''}
              {booking.guests.children > 0 && ` • ${booking.guests.children} child${booking.guests.children !== 1 ? 'ren' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-lime-600">
              {formatCurrency(booking.total_price, booking.currency)}
            </span>
          </div>
        </div>

        {/* Special requests */}
        {booking.special_requests && (
          <div className="mb-3 p-2 bg-slate-50 rounded text-xs">
            <p className="font-medium text-slate-700 mb-0.5">Special Requests:</p>
            <p className="text-slate-600">{booking.special_requests}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(booking.id)}
              className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          )}
          {onMessageGuest && booking.status !== 'cancelled' && (
            <button
              onClick={() => onMessageGuest(booking.id)}
              className="flex-1 px-3 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-lime-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <button
                onClick={onClose}
                className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2 text-sm"
              >
                <span>←</span>
                <span>Back</span>
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                Bookings ({bookings.length})
              </h2>
              <p className="text-xs text-slate-600 truncate">{listingTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="current">Current</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="date-asc">Date: Earliest</option>
              <option value="date-desc">Date: Latest</option>
              <option value="guest-name">Guest Name</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-slate-500">Loading bookings...</div>
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">📊</div>
              <p className="text-sm text-slate-600">
                {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBookings.map(renderBookingCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example usage:
 *
 * <BookingsSlideOver
 *   listingId="listing-123"
 *   listingTitle="Kyrenia Beach Villa"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   bookings={[
 *     {
 *       id: 'booking-1',
 *       guest: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+90...' },
 *       check_in: '2024-12-15',
 *       check_out: '2024-12-20',
 *       nights: 5,
 *       guests: { adults: 4, children: 0 },
 *       total_price: 600,
 *       currency: 'EUR',
 *       status: 'upcoming',
 *       booked_at: '2024-11-14T15:20:00Z',
 *       payment_status: 'paid'
 *     }
 *   ]}
 *   onViewDetails={(id) => console.log('View:', id)}
 *   onMessageGuest={(id) => console.log('Message:', id)}
 * />
 */
