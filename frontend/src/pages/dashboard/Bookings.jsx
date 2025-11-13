import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, CheckCircle, Trash2, Star, Filter, Search, Eye, CalendarCheck, XCircle } from 'lucide-react';
import { CATEGORY_DESIGN, getAllCategories } from '../../lib/categoryDesign';
import config from '../../config';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

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
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or category slug
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

    const matchesCategory =
      categoryFilter === 'all' ||
      booking.listing?.category?.slug === categoryFilter ||
      booking.listing?.category?.name?.toLowerCase().replace(/\s+/g, '-') === categoryFilter;

    const matchesSearch =
      !searchQuery ||
      booking.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.listing?.location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
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
            <CalendarCheck className="w-8 h-8 text-primary" />
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
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button className="bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 text-white" onClick={fetchBookings}>Try Again</Button>
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
        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-warning/30 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-2xl font-bold text-warning">{stats.pending}</span>
            </div>
            <h3 className="text-sm font-medium text-foreground">Pending</h3>
            <p className="text-xs text-warning mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-success/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <span className="text-2xl font-bold text-success">{stats.confirmed}</span>
            </div>
            <h3 className="text-sm font-medium text-foreground">Confirmed</h3>
            <p className="text-xs text-success mt-1">Ready to go</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <CalendarCheck className="w-5 h-5 text-blue-700" />
              </div>
              <span className="text-2xl font-bold text-blue-700">{stats.completed}</span>
            </div>
            <h3 className="text-sm font-medium text-foreground">Completed</h3>
            <p className="text-xs text-blue-700 mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/30 rounded-lg">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-primary">{stats.total}</span>
            </div>
            <h3 className="text-sm font-medium text-foreground">Total</h3>
            <p className="text-xs text-primary mt-1">All bookings</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <Card className="shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by listing or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-[140px]"
              >
                <option value="all">All Categories</option>
                {getAllCategories().map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || filter !== 'all' ? 'No matching bookings' : 'No bookings yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Bookings will appear here when customers reserve your listings'}
            </p>
          </CardContent>
        </Card>
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

            // Get category design
            const categorySlug = booking.listing?.category?.slug ||
                                 booking.listing?.category?.name?.toLowerCase().replace(/\s+/g, '-');
            const categoryDesign = categorySlug ? Object.values(CATEGORY_DESIGN).find(
              cat => cat.slug === categorySlug || cat.name.toLowerCase() === booking.listing?.category?.name?.toLowerCase()
            ) : null;

            const CategoryIcon = categoryDesign?.icon;
            const gradient = categoryDesign?.gradient || 'from-gray-500 to-gray-600';
            const badgeBg = categoryDesign?.badgeBg || 'bg-gray-100';
            const badgeText = categoryDesign?.badgeText || 'text-gray-700';

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="relative hover:shadow-lg transition-all cursor-pointer overflow-hidden" onClick={() => setSelectedBooking(booking)}>
                  <CardContent className="p-6">
                {/* Category gradient accent strip */}
                {categoryDesign && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient}`} />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 ml-2">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">
                        {booking.listing?.title || 'Untitled Listing'}
                      </h3>

                      {/* Category Badge */}
                      {categoryDesign && CategoryIcon && (
                        <Badge variant="secondary" className={`${badgeBg} ${badgeText}`}>
                          <CategoryIcon className="w-3 h-3" />
                          {booking.listing?.category?.name || categoryDesign.name}
                        </Badge>
                      )}

                      {/* Status Badge */}
                      <Badge variant={
                        booking.status === 'pending' ? 'warning' :
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'completed' ? 'default' :
                        'destructive'
                      } className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
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
                          <span className="font-semibold text-primary">€{booking.listing.price}</span>
                        </div>
                      )}
                    </div>

                    {booking.message && (
                      <p className="text-sm text-muted-foreground italic">
                        "{booking.message}"
                      </p>
                    )}

                    {booking.agent_response && (
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 mb-1">Agent Response:</p>
                        <p className="text-sm text-blue-700">{booking.agent_response}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {booking.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                        title="Cancel"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                    {booking.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="text-warning hover:bg-warning/10"
                        title="Leave Review"
                      >
                        <Star className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {(() => {
              const StatusIcon = selectedBooking.status === 'pending' ? Clock :
                selectedBooking.status === 'confirmed' ? CheckCircle :
                selectedBooking.status === 'completed' ? CalendarCheck : XCircle;
              return (<>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Listing</label>
              <p className="text-foreground">{selectedBooking.listing?.title || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Status</label>
              <Badge variant={
                selectedBooking.status === 'pending' ? 'warning' :
                selectedBooking.status === 'confirmed' ? 'success' :
                selectedBooking.status === 'completed' ? 'default' :
                'destructive'
              } className="gap-1">
                <StatusIcon className="w-3 h-3" />
                {selectedBooking.status}
              </Badge>
            </div>

            {selectedBooking.message && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Message</label>
                <p className="text-foreground bg-muted p-4 rounded-lg">{selectedBooking.message}</p>
              </div>
            )}

            {selectedBooking.agent_response && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Agent Response</label>
                <p className="text-foreground bg-blue-500/10 p-4 rounded-lg">{selectedBooking.agent_response}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="default"
                onClick={() => setSelectedBooking(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
              </>)
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
