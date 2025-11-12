import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Clock, DollarSign, FileText,
  Loader2, AlertCircle, CheckCircle, XCircle, Calendar
} from 'lucide-react';
import Page from '../shared/components/Page';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';

const Bookings = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${config.API_BASE_URL}/api/bookings/my-bookings/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showMessage('error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem('token');

      // Note: This endpoint might not exist yet in the backend
      await axios.patch(
        `${config.API_BASE_URL}/api/bookings/${bookingId}/`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Booking cancelled successfully');
      setShowCancelConfirm(null);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showMessage('error', error.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const today = new Date();
      const checkIn = new Date(booking.check_in);
      return booking.status !== 'cancelled' && booking.status !== 'completed' && checkIn >= today;
    }
    if (filter === 'past') {
      const today = new Date();
      const checkOut = new Date(booking.check_out);
      return booking.status === 'completed' || checkOut < today;
    }
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '✕';
      case 'completed':
        return '✔';
      default:
        return '•';
    }
  };

  const getBookingTypeColor = (type) => {
    return type === 'short_term'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  if (!isAuthenticated) {
    return (
      <Page title="My Bookings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] bg-white/90 backdrop-blur p-8 rounded-2xl border border-border shadow-sm"
        >
          <AlertCircle className="w-16 h-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground text-center">
            Please log in to view and manage your bookings.
          </p>
        </motion.div>
      </Page>
    );
  }

  return (
    <Page title="My Bookings">
      {/* Success/Error Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground text-sm">Manage your property and vehicle bookings</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {[
          { id: 'all', label: 'All Bookings' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            variant={filter === tab.id ? 'default' : 'outline'}
          >
            {tab.label}
          </Button>
        ))}
      </motion.div>

      {/* Bookings List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white/90 backdrop-blur rounded-2xl border border-border">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/90 backdrop-blur rounded-2xl border border-border">
            <CalendarDays className="w-16 h-16 text-muted mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Bookings Found</h2>
            <p className="text-muted-foreground text-center">
              {filter === 'all'
                ? "You haven't made any bookings yet."
                : `No ${filter} bookings found.`}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {booking.listing_title || 'Booking'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBookingTypeColor(booking.booking_type)}`}>
                          {booking.booking_type === 'short_term' ? '📅 Short Term' : '🏠 Long Term'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {booking.check_in && booking.check_out && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                          </span>
                        )}
                        {booking.duration_days && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {booking.duration_days} {booking.duration_days === 1 ? 'day' : 'days'}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  {/* Pricing and Notes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {booking.total_price && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {booking.currency} {parseFloat(booking.total_price).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700">Has notes</span>
                        </div>
                      )}
                    </div>

                    {/* Cancel Button */}
                    {booking.status === 'pending' && (
                      <Button
                        onClick={() => setShowCancelConfirm(booking.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    )}
                  </div>

                  {/* Notes Section */}
                  {booking.notes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <p className="text-sm text-foreground">
                        <span className="font-semibold text-foreground">Notes: </span>
                        {booking.notes}
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !cancellingId && setShowCancelConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Cancel Booking?</h3>
                <p className="text-muted-foreground">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => !cancellingId && setShowCancelConfirm(null)}
                  disabled={!!cancellingId}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Booking
                </Button>
                <Button
                  onClick={() => handleCancelBooking(showCancelConfirm)}
                  disabled={!!cancellingId}
                  variant="destructive"
                  className="flex-1"
                >
                  {cancellingId ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      Cancel Booking
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default Bookings;