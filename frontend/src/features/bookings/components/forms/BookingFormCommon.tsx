/**
 * BookingFormCommon Component
 * Common fields shared across all booking types
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Calendar } from '../../../../components/ui/calendar';
import type { BookingType } from '../../types';

interface CommonFieldsData {
  // Dates
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;

  // Contact
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Guests
  guests_count?: number;

  // Special requests
  special_requests?: string;
}

interface BookingFormCommonProps {
  bookingType: BookingType;
  data: CommonFieldsData;
  onChange: (field: keyof CommonFieldsData, value: any) => void;
  errors?: Partial<Record<keyof CommonFieldsData, string>>;
  className?: string;
}

const BookingFormCommon: React.FC<BookingFormCommonProps> = ({
  bookingType,
  data,
  onChange,
  errors = {},
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dates Section */}
      {bookingType.requires_dates && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Dates & Times</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="start_date"
                value={data.start_date || ''}
                onChange={(e) => onChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
                required
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="end_date"
                value={data.end_date || ''}
                onChange={(e) => onChange('end_date', e.target.value)}
                className={errors.end_date ? 'border-red-500' : ''}
                required
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Time Slots (if required) */}
          {bookingType.requires_time_slot && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  id="start_time"
                  value={data.start_time || ''}
                  onChange={(e) => onChange('start_time', e.target.value)}
                  className={errors.start_time ? 'border-red-500' : ''}
                  required
                />
                {errors.start_time && (
                  <p className="text-sm text-red-500">{errors.start_time}</p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  type="time"
                  id="end_time"
                  value={data.end_time || ''}
                  onChange={(e) => onChange('end_time', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guests Section */}
      {bookingType.requires_guests && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Guest Information</h3>

          <div className="space-y-2">
            <Label htmlFor="guests_count">
              Number of Guests <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="guests_count"
              min="1"
              value={data.guests_count || ''}
              onChange={(e) => onChange('guests_count', parseInt(e.target.value))}
              className={errors.guests_count ? 'border-red-500' : ''}
              required
            />
            {errors.guests_count && (
              <p className="text-sm text-red-500">{errors.guests_count}</p>
            )}
          </div>
        </div>
      )}

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contact_name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="contact_name"
              placeholder="John Doe"
              value={data.contact_name}
              onChange={(e) => onChange('contact_name', e.target.value)}
              className={errors.contact_name ? 'border-red-500' : ''}
              required
            />
            {errors.contact_name && (
              <p className="text-sm text-red-500">{errors.contact_name}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              type="tel"
              id="contact_phone"
              placeholder="+357 99 123456"
              value={data.contact_phone}
              onChange={(e) => onChange('contact_phone', e.target.value)}
              className={errors.contact_phone ? 'border-red-500' : ''}
              required
            />
            {errors.contact_phone && (
              <p className="text-sm text-red-500">{errors.contact_phone}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              id="contact_email"
              placeholder="john@example.com"
              value={data.contact_email}
              onChange={(e) => onChange('contact_email', e.target.value)}
              className={errors.contact_email ? 'border-red-500' : ''}
              required
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500">{errors.contact_email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Special Requests Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>

        <div className="space-y-2">
          <Label htmlFor="special_requests">Special Requests (Optional)</Label>
          <textarea
            id="special_requests"
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
            placeholder="Any special requests or notes..."
            value={data.special_requests || ''}
            onChange={(e) => onChange('special_requests', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingFormCommon;
export type { CommonFieldsData };
