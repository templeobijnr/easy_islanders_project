import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, CheckCircle, Trash2, Star } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import config from '../../config';

/**
 * Bookings Dashboard Page
 * TDD Implementation - Component passes all 6 tests
 * 
 * Features:
 * - Load user's bookings on mount
 * - Display booking list with status
 * - Show seller responses
 * - Cancel pending bookings
 * - Display confirmation dates
 * - Completed bookings with review option
 */

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  // Load bookings on mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/bookings/user/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${config.API_BASE_URL}/bookings/${bookingId}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Remove from list
      setBookings(bookings.filter(b => b.id !== bookingId));
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const pendingBookings = filteredBookings.filter(b => b.status === 'pending');
  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
  const completedBookings = filteredBookings.filter(b => b.status === 'completed');

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="My Bookings" subtitle="View and manage your bookings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="My Bookings" subtitle="View and manage your bookings" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="My Bookings" subtitle="View and manage your bookings" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No bookings yet</h3>
            <p className="text-gray-600">Start by booking a property or service</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="My Bookings" subtitle="View and manage your bookings" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === status
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status} ({
                bookings.filter(b => status === 'all' || b.status === status).length
              })
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {[
          { title: 'Pending Confirmation', items: pendingBookings, icon: AlertCircle, color: 'yellow' },
          { title: 'Confirmed', items: confirmedBookings, icon: CheckCircle, color: 'green' },
          { title: 'Completed', items: completedBookings, icon: CheckCircle, color: 'blue' },
        ].map(
          section =>
            (filter === 'all' || section.items.length > 0) && section.items.length > 0 && (
              <div key={section.title} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </h3>

                <div className="space-y-4">
                  {section.items.map(booking => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row gap-4 p-4">
                        {/* Image */}
                        {booking.listing?.image_url && (
                          <img
                            src={booking.listing.image_url}
                            alt={booking.listing.title}
                            className="w-full md:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                          />
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {booking.listing?.title}
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>{booking.listing?.location}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4 flex-shrink-0" />
                              <span>€{booking.listing?.price}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{new Date(booking.preferred_date).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{booking.preferred_time}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          {/* Agent Response */}
                          {booking.agent_response && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">Agent Response:</p>
                              <p className="text-sm text-blue-800">{booking.agent_response}</p>
                              {booking.agent_notes && (
                                <p className="text-sm text-blue-700 mt-2">📝 {booking.agent_notes}</p>
                              )}
                              {booking.agent_available_times?.length > 0 && (
                                <p className="text-sm text-blue-700 mt-2">
                                  Available: {booking.agent_available_times.join(', ')}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Message */}
                          {booking.message && (
                            <div className="text-sm text-gray-600 mb-4">
                              <p className="font-medium">Your message:</p>
                              <p className="italic">"{booking.message}"</p>
                            </div>
                          )}

                          {/* Confirmation Date */}
                          {booking.confirmed_at && (
                            <p className="text-sm text-green-600 mb-4">
                              Confirmed on {new Date(booking.confirmed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 md:w-32">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Cancel
                            </button>
                          )}

                          {booking.status === 'completed' && (
                            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                              <Star className="w-4 h-4" />
                              Review
                            </button>
                          )}

                          <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default Bookings;
