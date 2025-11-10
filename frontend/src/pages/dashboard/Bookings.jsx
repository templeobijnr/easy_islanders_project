import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, CheckCircle, Trash2, Star, Filter, Search, Eye, CalendarCheck, XCircle } from 'lucide-react';
import config from '../../config';
import { format, parseISO } from 'date-fns';

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
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

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
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch =
      !searchQuery ||
      booking.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.listing?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };


  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bookings</h1>
        <p className="text-slate-600 mb-8">Manage reservations and bookings</p>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <CalendarCheck className="w-8 h-8 text-lime-600" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bookings</h1>
        <p className="text-slate-600 mb-8">Manage reservations and bookings</p>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bookings</h1>
        <p className="text-slate-600">Manage reservations and bookings</p>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <span className="text-2xl font-bold text-yellow-700">{stats.pending}</span>
          </div>
          <h3 className="text-sm font-medium text-yellow-900">Pending</h3>
          <p className="text-xs text-yellow-700 mt-1">Awaiting confirmation</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <span className="text-2xl font-bold text-green-700">{stats.confirmed}</span>
          </div>
          <h3 className="text-sm font-medium text-green-900">Confirmed</h3>
          <p className="text-xs text-green-700 mt-1">Ready to go</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-200 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-2xl font-bold text-blue-700">{stats.completed}</span>
          </div>
          <h3 className="text-sm font-medium text-blue-900">Completed</h3>
          <p className="text-xs text-blue-700 mt-1">Successfully finished</p>
        </div>

        <div className="bg-gradient-to-br from-lime-50 to-lime-100 border border-lime-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-lime-200 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-lime-700" />
            </div>
            <span className="text-2xl font-bold text-lime-700">{stats.total}</span>
          </div>
          <h3 className="text-sm font-medium text-lime-900">Total</h3>
          <p className="text-xs text-lime-700 mt-1">All bookings</p>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by listing or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-600 text-sm"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchQuery || filter !== 'all' ? 'No matching bookings' : 'No bookings yet'}
          </h3>
          <p className="text-slate-600">
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your filters'
              : 'Bookings will appear here when customers reserve your listings'}
          </p>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 && (
        <div className="space-y-4">
          {filteredBookings.map((booking, index) => {
            const statusColors = {
              pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              confirmed: 'bg-green-100 text-green-700 border-green-200',
              completed: 'bg-blue-100 text-blue-700 border-blue-200',
              cancelled: 'bg-red-100 text-red-700 border-red-200',
            };

            const StatusIcon = booking.status === 'pending' ? Clock :
              booking.status === 'confirmed' ? CheckCircle :
              booking.status === 'completed' ? CalendarCheck : XCircle;

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {booking.listing?.title || 'Untitled Listing'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status] || statusColors.pending}`}>
                        <StatusIcon className="inline w-3 h-3 mr-1" />
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                      {booking.listing?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.listing.location}</span>
                        </div>
                      )}
                      {(booking.preferred_date || booking.check_in) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {booking.check_in && booking.check_out
                              ? `${format(parseISO(booking.check_in), 'MMM d')} - ${format(parseISO(booking.check_out), 'MMM d, yyyy')}`
                              : booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Date TBD'
                            }
                          </span>
                        </div>
                      )}
                      {booking.preferred_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.preferred_time}</span>
                        </div>
                      )}
                      {booking.listing?.price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-lime-600">€{booking.listing.price}</span>
                        </div>
                      )}
                    </div>

                    {booking.message && (
                      <p className="text-sm text-slate-600 italic">
                        "{booking.message}"
                      </p>
                    )}

                    {booking.agent_response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Agent Response:</p>
                        <p className="text-sm text-blue-800">{booking.agent_response}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {booking.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Leave Review"
                      >
                        <Star className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Listing</label>
                <p className="text-slate-900">{selectedBooking.listing?.title || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                  selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>

              {selectedBooking.message && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Message</label>
                  <p className="text-slate-900 bg-slate-50 p-4 rounded-lg">{selectedBooking.message}</p>
                </div>
              )}

              {selectedBooking.agent_response && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Agent Response</label>
                  <p className="text-slate-900 bg-blue-50 p-4 rounded-lg">{selectedBooking.agent_response}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
