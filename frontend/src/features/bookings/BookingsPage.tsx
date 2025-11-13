/**
 * BookingsPage Component
 * Main bookings page for the dashboard
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import {
  BookingList,
  BookingDetail,
  BookingWizard,
} from './components';
import type { Booking, BookingDetail as BookingDetailType } from './types';
import { bookingApi } from './api/bookingsApi';

type ViewMode = 'list' | 'detail' | 'create';

const BookingsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  // Load statistics on mount
  React.useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await bookingApi.bookings.statistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBookingId(booking.id);
    setViewMode('detail');
  };

  const handleBookingUpdate = (booking: BookingDetailType) => {
    // Refresh statistics and list
    loadStatistics();
  };

  const handleCreateClick = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = (booking: BookingDetailType) => {
    setShowWizard(false);
    setSelectedBookingId(booking.id);
    setViewMode('detail');
    loadStatistics();
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedBookingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
              <p className="text-slate-600 mt-1">Manage your bookings and reservations</p>
            </div>
            {viewMode === 'list' && (
              <Button
                onClick={handleCreateClick}
                className="bg-lime-600 hover:bg-lime-700"
                size="lg"
              >
                + Create Booking
              </Button>
            )}
            {viewMode === 'detail' && (
              <Button
                onClick={handleBackToList}
                variant="outline"
              >
                ← Back to List
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {statistics && viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold text-slate-900">{statistics.total_bookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Active Bookings</p>
                      <p className="text-2xl font-bold text-green-600">{statistics.active_bookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-purple-600">{statistics.completed_bookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎉</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-lime-600">€{parseFloat(statistics.total_spent || '0').toFixed(2)}</p>
                    </div>
                    <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingList
                    onBookingClick={handleBookingClick}
                    showFilters={true}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {viewMode === 'detail' && selectedBookingId && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BookingDetail
                bookingId={selectedBookingId}
                isOwner={true}
                isSeller={false}
                onUpdate={handleBookingUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Booking Wizard Dialog */}
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="max-w-none w-full h-full p-0 overflow-y-auto">
            <BookingWizard
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BookingsPage;
