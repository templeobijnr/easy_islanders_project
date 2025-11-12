/**
 * BookingCard Component
 * Displays individual booking as a card
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';
import StatusBadge from './StatusBadge';
import PaymentBadge from './PaymentBadge';
import BookingTypeIcon from './BookingTypeIcon';
import type { Booking } from '../types';
import { bookingUtils } from '../utils/bookingUtils';

interface BookingCardProps {
  booking: Booking;
  onClick?: (booking: Booking) => void;
  className?: string;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(booking);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={`${
          onClick ? 'cursor-pointer hover:shadow-lg' : ''
        } transition-shadow duration-200`}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Booking Type Icon */}
            {booking.booking_type_details && (
              <BookingTypeIcon
                bookingType={booking.booking_type_details}
                size="md"
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {booking.booking_type_details?.name || 'Booking'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Ref: {bookingUtils.formatReferenceNumber(booking.reference_number)}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <StatusBadge status={booking.status} />
                  <PaymentBadge paymentStatus={booking.payment_status} />
                </div>
              </div>

              {/* Listing Info */}
              {booking.listing_details && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700">
                    {booking.listing_details.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.listing_details.address}
                  </p>
                </div>
              )}

              {/* Dates */}
              {booking.start_date && (
                <div className="flex items-center text-sm text-slate-600 mb-3">
                  <span className="mr-2">📅</span>
                  {booking.end_date ? (
                    <span>
                      {bookingUtils.formatDateShort(booking.start_date)} -{' '}
                      {bookingUtils.formatDateShort(booking.end_date)}
                      {booking.duration_days && (
                        <span className="text-slate-500 ml-2">
                          ({booking.duration_days} {booking.duration_days === 1 ? 'day' : 'days'})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>{bookingUtils.formatDateShort(booking.start_date)}</span>
                  )}
                </div>
              )}

              {/* Contact & Guests */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                {booking.contact_name && (
                  <div className="flex items-center">
                    <span className="mr-1">👤</span>
                    <span>{booking.contact_name}</span>
                  </div>
                )}
                {booking.guests_count && (
                  <div className="flex items-center">
                    <span className="mr-1">👥</span>
                    <span>{booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  {bookingUtils.getRelativeTime(booking.created_at)}
                </div>
                <div className="text-lg font-semibold text-lime-600">
                  {bookingUtils.formatPrice(booking.total_price, booking.currency)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BookingCard;
