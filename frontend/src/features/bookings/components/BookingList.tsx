/**
 * BookingList Component
 * Display list of bookings with filtering and sorting
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import BookingCard from './BookingCard';
import type { Booking, BookingFilters, BookingStatus } from '../types';
import { bookingApi } from '../api/bookingsApi';

interface BookingListProps {
  onBookingClick?: (booking: Booking) => void;
  initialFilters?: BookingFilters;
  showFilters?: boolean;
}

const BookingList: React.FC<BookingListProps> = ({
  onBookingClick,
  initialFilters = {},
  showFilters = true,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('-created_at');

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [statusFilter, sortBy, page]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: BookingFilters = {
        ...initialFilters,
        ordering: sortBy,
        page,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await bookingApi.bookings.myBookings(filters);

      if (page === 1) {
        setBookings(response.results);
      } else {
        setBookings((prev) => [...prev, ...response.results]);
      }

      setHasMore(!!response.next);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadBookings();
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status as BookingStatus | 'all');
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1);
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadBookings} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={handleStatusChange}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex space-x-2">
              <Input
                type="text"
                placeholder="Search by reference number, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="bg-lime-600 hover:bg-lime-700">
                Search
              </Button>
            </div>

            <div className="w-full md:w-48">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Newest First</SelectItem>
                  <SelectItem value="created_at">Oldest First</SelectItem>
                  <SelectItem value="start_date">Start Date</SelectItem>
                  <SelectItem value="-start_date">Start Date (Desc)</SelectItem>
                  <SelectItem value="-total_price">Price (High to Low)</SelectItem>
                  <SelectItem value="total_price">Price (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {bookings.length === 0 ? 'No bookings found' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Bookings Grid */}
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <BookingCard
                booking={booking}
                onClick={onBookingClick}
              />
            </motion.div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 mb-4">No bookings found</p>
          {statusFilter !== 'all' && (
            <Button
              onClick={() => setStatusFilter('all')}
              variant="outline"
            >
              View All Bookings
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingList;
