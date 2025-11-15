/**
 * BookingsTab - Confirmed bookings management
 */

import React, { useState } from 'react';
import { Calendar, User, MessageSquare, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

interface Booking {
  id: string;
  guest: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    country?: string;
  };
  check_in: string;
  check_out: string;
  guests_count: number;
  status: 'upcoming' | 'current' | 'past' | 'cancelled';
  total_price: number;
  currency: string;
  payment_status: 'paid' | 'partial' | 'pending';
  booking_reference: string;
  created_at: string;
  special_requests?: string;
}

interface BookingsTabProps {
  listingId: string;
  bookings?: Booking[];
}

export const BookingsTab: React.FC<BookingsTabProps> = ({ listingId, bookings = [] }) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'current' | 'past' | 'cancelled'>('all');

  // Mock data if no bookings provided
  const displayBookings: Booking[] = bookings.length > 0 ? bookings : [
    {
      id: 'book-1',
      guest: {
        name: 'James Anderson',
        email: 'james@example.com',
        phone: '+44 7700 900123',
        country: 'United Kingdom',
      },
      check_in: '2025-11-18',
      check_out: '2025-11-25',
      guests_count: 3,
      status: 'current',
      total_price: 840,
      currency: 'EUR',
      payment_status: 'paid',
      booking_reference: 'BK-2025-001',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      special_requests: 'Early check-in if possible',
    },
    {
      id: 'book-2',
      guest: {
        name: 'Lisa Thompson',
        email: 'lisa@example.com',
        phone: '+1 555 123 4567',
        country: 'United States',
      },
      check_in: '2025-12-05',
      check_out: '2025-12-12',
      guests_count: 2,
      status: 'upcoming',
      total_price: 840,
      currency: 'EUR',
      payment_status: 'paid',
      booking_reference: 'BK-2025-002',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'book-3',
      guest: {
        name: 'Thomas Schmidt',
        email: 'thomas@example.com',
        country: 'Germany',
      },
      check_in: '2025-12-20',
      check_out: '2025-12-27',
      guests_count: 4,
      status: 'upcoming',
      total_price: 840,
      currency: 'EUR',
      payment_status: 'partial',
      booking_reference: 'BK-2025-003',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      special_requests: 'Baby crib needed',
    },
    {
      id: 'book-4',
      guest: {
        name: 'Maria Garcia',
        email: 'maria@example.com',
        country: 'Spain',
      },
      check_in: '2025-10-15',
      check_out: '2025-10-22',
      guests_count: 2,
      status: 'past',
      total_price: 840,
      currency: 'EUR',
      payment_status: 'paid',
      booking_reference: 'BK-2025-004',
      created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'book-5',
      guest: {
        name: 'Robert Johnson',
        email: 'robert@example.com',
        country: 'Canada',
      },
      check_in: '2025-11-28',
      check_out: '2025-12-03',
      guests_count: 2,
      status: 'cancelled',
      total_price: 600,
      currency: 'EUR',
      payment_status: 'pending',
      booking_reference: 'BK-2025-005',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredBookings = filter === 'all'
    ? displayBookings
    : displayBookings.filter(booking => booking.status === filter);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMessage = (bookingId: string) => {
    console.log('Messaging guest for booking:', bookingId);
  };

  const handleViewDetails = (bookingId: string) => {
    console.log('Viewing booking details:', bookingId);
  };

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = {
      upcoming: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Upcoming',
        dot: 'bg-blue-600',
      },
      current: {
        bg: 'bg-brand-100',
        text: 'text-brand-700',
        border: 'border-brand-200',
        label: 'Current',
        dot: 'bg-brand-600',
      },
      past: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        label: 'Past',
        dot: 'bg-slate-600',
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Cancelled',
        dot: 'bg-red-600',
      },
    };

    const config = statusConfig[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: Booking['payment_status']) => {
    const paymentConfig = {
      paid: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        label: 'Paid',
      },
      partial: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        label: 'Partial',
      },
      pending: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        label: 'Pending',
      },
    };

    const config = paymentConfig[paymentStatus];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const stats = {
    all: displayBookings.length,
    upcoming: displayBookings.filter(b => b.status === 'upcoming').length,
    current: displayBookings.filter(b => b.status === 'current').length,
    past: displayBookings.filter(b => b.status === 'past').length,
    cancelled: displayBookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Bookings
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'all' ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {stats.all}
            </span>
          </button>
          <button
            onClick={() => setFilter('current')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'current'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Current
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'current' ? 'bg-white/20' : 'bg-brand-100 text-brand-700'
            }`}>
              {stats.current}
            </span>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Upcoming
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'upcoming' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
            }`}>
              {stats.upcoming}
            </span>
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'past'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Past
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'past' ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {stats.past}
            </span>
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'cancelled'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancelled
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === 'cancelled' ? 'bg-white/20' : 'bg-red-100 text-red-700'
            }`}>
              {stats.cancelled}
            </span>
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-900">No {filter !== 'all' ? filter : ''} bookings</p>
          <p className="text-xs text-slate-500 mt-1">Confirmed bookings will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {/* Guest Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-200 to-emerald-200 flex items-center justify-center flex-shrink-0">
                      {booking.guest.avatar ? (
                        <img
                          src={booking.guest.avatar}
                          alt={booking.guest.name}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-brand-600" />
                      )}
                    </div>

                    {/* Guest Info */}
                    <div>
                      <h3 className="font-semibold text-slate-900">{booking.guest.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <p className="text-sm text-slate-600">{booking.guest.email}</p>
                      </div>
                      {booking.guest.phone && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <p className="text-sm text-slate-600">{booking.guest.phone}</p>
                        </div>
                      )}
                      {booking.guest.country && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <p className="text-xs text-slate-500">{booking.guest.country}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Payment Badges */}
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.payment_status)}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">Stay Period</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-600" />
                        <p className="text-sm font-semibold text-slate-900">{formatDate(booking.check_in)}</p>
                      </div>
                      <p className="text-xs text-slate-500 ml-6">to</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-600" />
                        <p className="text-sm font-semibold text-slate-900">{formatDate(booking.check_out)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-brand-600 font-medium mt-2">
                      {calculateNights(booking.check_in, booking.check_out)} nights
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">Booking Details</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Reference:</span>
                        <span className="text-xs font-semibold text-slate-900">{booking.booking_reference}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Guests:</span>
                        <span className="text-xs font-semibold text-slate-900">
                          {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">Payment</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {booking.currency} {booking.total_price}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {booking.currency} {(booking.total_price / calculateNights(booking.check_in, booking.check_out)).toFixed(0)}/night
                    </p>
                  </div>
                </div>

                {/* Special Requests */}
                {booking.special_requests && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs font-medium text-amber-900 mb-1">Special Requests</p>
                    <p className="text-sm text-amber-700">{booking.special_requests}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewDetails(booking.id)}
                    className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleMessage(booking.id)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Guest
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
