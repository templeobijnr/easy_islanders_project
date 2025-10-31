import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

/**
 * BookingModal Component
 * TDD Implementation - Component passes all 6 tests
 * 
 * Features:
 * - Displays listing details (image, title, price, location)
 * - Date and time selection
 * - Optional message field
 * - Booking submission
 * - Success feedback
 * - Modal controls (open/close)
 */

const BookingModal = ({
  isOpen = false,
  listing = null,
  onClose = () => {},
  onSubmit = () => {},
  success = false,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !listing) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        listingId: listing.id,
        date: selectedDate,
        time: selectedTime,
        message: message,
      });
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedDate('');
      setSelectedTime('');
      setMessage('');
      onClose();
    }
  };

  const imageUrl = listing.image_urls?.[0] || listing.image_url || '';

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        role="dialog"
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {success ? (
            // Success State
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Request Sent!
              </h3>
              <p className="text-gray-600">
                The property owner will respond to your booking request shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            // Booking Form
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Book Now
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Listing Details */}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Listing image"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {listing.title}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">
                      €{listing.price}
                    </span>
                    {listing.currency && ` ${listing.currency}`}
                  </p>
                  <p>{listing.location}</p>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add any special requests or questions..."
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none disabled:opacity-50"
                    rows="3"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Request Booking'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingModal;
