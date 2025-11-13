/**
 * BookingTypeSelector Component
 * First step in booking wizard - select booking category
 */

import React, { useEffect, useState } from 'react';
import { MotionDiv } from '../../../components/ui/motion-wrapper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import BookingTypeIcon from './BookingTypeIcon';
import type { BookingType } from '../types';
import { bookingApi } from '../api/bookingsApi';

interface BookingTypeSelectorProps {
  onSelect: (bookingType: BookingType) => void;
  selectedType?: BookingType;
  listingId?: string; // Optional: pre-filter by listing type
}

const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  onSelect,
  selectedType,
  listingId,
}) => {
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookingTypes();
  }, []);

  const loadBookingTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await bookingApi.types.list();
      setBookingTypes(types.filter((t) => t.is_active));
    } catch (err) {
      console.error('Failed to load booking types:', err);
      setError('Failed to load booking types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadBookingTypes}
          className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bookingTypes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No booking types available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          What would you like to book?
        </h2>
        <p className="text-slate-600">
          Choose a booking category to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookingTypes.map((type) => {
          const isSelected = selectedType?.id === type.id;

          return (
            <MotionDiv
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-lime-500 border-2 shadow-lg'
                    : 'border-slate-200 hover:border-lime-300 hover:shadow-md'
                }`}
                onClick={() => onSelect(type)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <BookingTypeIcon bookingType={type} size="lg" />

                    {/* Name */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {type.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {type.description}
                      </p>
                    </div>

                    {/* Requirements */}
                    <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500">
                      {type.requires_dates && (
                        <span className="px-2 py-1 bg-slate-100 rounded-full">
                          📅 Dates
                        </span>
                      )}
                      {type.requires_time_slot && (
                        <span className="px-2 py-1 bg-slate-100 rounded-full">
                          ⏰ Time
                        </span>
                      )}
                      {type.requires_guests && (
                        <span className="px-2 py-1 bg-slate-100 rounded-full">
                          👥 Guests
                        </span>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-full py-2 bg-lime-100 text-lime-700 rounded-lg font-medium text-sm">
                        <MotionDiv
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          ✓ Selected
                        </MotionDiv>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTypeSelector;
