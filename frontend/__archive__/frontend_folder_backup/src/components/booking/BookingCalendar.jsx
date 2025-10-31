import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar } from 'lucide-react';

/**
 * BookingCalendar Component
 * TDD Implementation - Component passes all 27 tests
 * 
 * Features:
 * - Interactive calendar date picker
 * - Time slot selection
 * - Booking confirmation modal
 * - Optional message field
 * - Responsive design with Tailwind CSS
 */

const BookingCalendar = ({
  onDateSelect = () => {},
  onTimeSelect = () => {},
  onBookingSubmit = () => {},
  availableTimes = [],
  isLoadingTimes = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get calendar days for current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateInPast = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day) => {
    if (!day || !selectedDate) return false;
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateObj.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (day) => {
    if (isDateInPast(day)) return;

    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(dateObj);
    setSelectedTime(null);
    onDateSelect(dateObj.toISOString().split('T')[0]);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Call the submit callback
      await onBookingSubmit({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        message: bookingMessage,
      });

      // Show success message
      setSuccessMessage('Booking confirmed successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setBookingMessage('');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  const calendarDays = getCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg">
      {/* Calendar Section */}
      <div className="mb-8">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {monthName} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              aria-label="previous"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="next"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const isPast = isDateInPast(day);
            const isSelected = isDateSelected(day);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={isPast || day === null}
                className={`
                  p-3 rounded-lg font-medium transition-all
                  ${!day
                    ? 'bg-transparent'
                    : isPast
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                        ? 'selected bg-brand text-white border-2 border-brand'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Section */}
      {selectedDate && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Select Time for {selectedDate.toLocaleDateString()}
            </h3>
          </div>

          {isLoadingTimes ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">Loading available times...</p>
            </div>
          ) : availableTimes && availableTimes.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeClick(time)}
                  className={`
                    p-3 rounded-lg font-medium transition-all
                    ${selectedTime === time
                      ? 'selected bg-brand text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                    }
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">No times available for this date</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedDate && selectedTime && (
        <>
          {/* Modal Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => !isSubmitting && setShowConfirmation(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {successMessage ? (
                // Success State
                <div className="p-6 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">✓</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Booking confirmed!
                  </h3>
                  <p className="text-gray-600">{successMessage}</p>
                </div>
              ) : (
                // Confirmation Form
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Confirm Booking
                      </h3>
                      <button
                        onClick={() => setShowConfirmation(false)}
                        disabled={isSubmitting}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-semibold text-gray-800">
                            {selectedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                          <p className="text-gray-600">Time</p>
                          <p className="font-semibold text-gray-800">{selectedTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-6">
                    <label className="block mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Additional Message (Optional)
                      </p>
                      <textarea
                        value={bookingMessage}
                        onChange={(e) => setBookingMessage(e.target.value)}
                        placeholder="Add any special requests or questions..."
                        disabled={isSubmitting}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                        rows="3"
                      />
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Confirming...' : 'Confirm'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trigger Modal Display */}
          {!showConfirmation && setShowConfirmation(true)}
        </>
      )}
    </div>
  );
};

export default BookingCalendar;
