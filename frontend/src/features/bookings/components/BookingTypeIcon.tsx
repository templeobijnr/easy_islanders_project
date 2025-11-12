/**
 * BookingTypeIcon Component
 * Display booking type icon with custom styling
 */

import React from 'react';
import type { BookingType } from '../types';
import { getBookingTypeIcon, getBookingTypeColor } from '../utils/bookingUtils';

interface BookingTypeIconProps {
  bookingType: BookingType;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const BookingTypeIcon: React.FC<BookingTypeIconProps> = ({
  bookingType,
  size = 'md',
  showBackground = true,
  className = '',
}) => {
  const icon = bookingType.icon || getBookingTypeIcon(bookingType);
  const color = getBookingTypeColor(bookingType);

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  if (showBackground) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center ${className}`}
        style={{ backgroundColor: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
    );
  }

  return (
    <span
      className={`${sizeClasses[size]} inline-flex items-center justify-center ${className}`}
      style={{ color }}
    >
      {icon}
    </span>
  );
};

export default BookingTypeIcon;
