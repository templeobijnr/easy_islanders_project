/**
 * BookingDetail Component
 * Detailed view of a single booking with actions
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import StatusBadge from './StatusBadge';
import PaymentBadge from './PaymentBadge';
import BookingTypeIcon from './BookingTypeIcon';
import type { BookingDetail as BookingDetailType, BookingHistory } from '../types';
import { bookingApi } from '../api/bookingsApi';
import { bookingUtils } from '../utils/bookingUtils';

interface BookingDetailProps {
  bookingId: string;
  isOwner?: boolean;
  isSeller?: boolean;
  onUpdate?: (booking: BookingDetailType) => void;
}

const BookingDetail: React.FC<BookingDetailProps> = ({
  bookingId,
  isOwner = true,
  isSeller = false,
  onUpdate,
}) => {
  const [booking, setBooking] = useState<BookingDetailType | null>(null);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookingData, historyData] = await Promise.all([
        bookingApi.bookings.get(bookingId),
        bookingApi.bookings.history(bookingId).catch(() => []),
      ]);
      setBooking(bookingData);
      setHistory(historyData);
    } catch (err: any) {
      console.error('Failed to load booking details:', err);
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;

    try {
      setActionLoading(true);
      const updated = await bookingApi.bookings.confirm(booking.id, { notes: confirmNotes });
      setBooking(updated);
      setShowConfirmDialog(false);
      setConfirmNotes('');
      if (onUpdate) onUpdate(updated);
      await loadBookingDetails(); // Reload to get history
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await bookingApi.bookings.cancel(booking.id, { reason: cancelReason });
      setBooking(updated);
      setShowCancelDialog(false);
      setCancelReason('');
      if (onUpdate) onUpdate(updated);
      await loadBookingDetails(); // Reload to get history
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!booking) return;

    if (!confirm('Mark this booking as completed?')) return;

    try {
      setActionLoading(true);
      const updated = await bookingApi.bookings.complete(booking.id, {});
      setBooking(updated);
      if (onUpdate) onUpdate(updated);
      await loadBookingDetails(); // Reload to get history
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
        <Button onClick={loadBookingDetails} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const actions = bookingUtils.getAvailableActions(booking, isOwner, isSeller);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {booking.booking_type_details && (
              <BookingTypeIcon bookingType={booking.booking_type_details} size="lg" />
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {booking.booking_type_details?.name || 'Booking Details'}
                  </h1>
                  <p className="text-slate-500">
                    Ref: {bookingUtils.formatReferenceNumber(booking.reference_number)}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <StatusBadge status={booking.status} />
                  <PaymentBadge paymentStatus={booking.payment_status} />
                </div>
              </div>

              {/* Action Buttons */}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.action}
                      onClick={() => {
                        if (action.action === 'confirm') setShowConfirmDialog(true);
                        else if (action.action === 'cancel') setShowCancelDialog(true);
                        else if (action.action === 'complete') handleComplete();
                      }}
                      variant={action.variant === 'danger' ? 'destructive' : 'default'}
                      disabled={actionLoading}
                      className={action.variant === 'primary' ? 'bg-lime-600 hover:bg-lime-700' : ''}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dates & Times */}
        {booking.start_date && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Dates & Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Start:</span>
                <p className="font-medium">{bookingUtils.formatDateTime(booking.start_date)}</p>
              </div>
              {booking.end_date && (
                <div>
                  <span className="text-slate-500">End:</span>
                  <p className="font-medium">{bookingUtils.formatDateTime(booking.end_date)}</p>
                </div>
              )}
              {booking.duration_days && (
                <div>
                  <span className="text-slate-500">Duration:</span>
                  <p className="font-medium">{booking.duration_days} days</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👤 Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <p className="font-medium">{booking.contact_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>
              <p className="font-medium">{booking.contact_phone}</p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-medium">{booking.contact_email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💰 Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Price:</span>
              <span className="font-medium">{bookingUtils.formatPrice(booking.base_price, booking.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Fees:</span>
              <span className="font-medium">{bookingUtils.formatPrice(booking.service_fees, booking.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Taxes:</span>
              <span className="font-medium">{bookingUtils.formatPrice(booking.taxes, booking.currency)}</span>
            </div>
            {parseFloat(booking.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{bookingUtils.formatPrice(booking.discount, booking.currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold text-lg">
              <span>Total:</span>
              <span className="text-lime-600">{bookingUtils.formatPrice(booking.total_price, booking.currency)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Guests */}
        {booking.guests_count && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👥 Guests</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Special Requests */}
      {booking.special_requests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Special Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.special_requests}</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📜 Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 bg-lime-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-slate-900 capitalize">{event.change_type.replace('_', ' ')}</p>
                      <span className="text-xs text-slate-500">{bookingUtils.getRelativeTime(event.created_at)}</span>
                    </div>
                    {event.changed_by_name && (
                      <p className="text-sm text-slate-600">by {event.changed_by_name}</p>
                    )}
                    {event.notes && (
                      <p className="text-sm text-slate-600 mt-1">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm this booking for {booking.contact_name}?
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Notes (optional)</label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                placeholder="Add any notes..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={actionLoading} className="bg-lime-600 hover:bg-lime-700">
                {actionLoading ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel this booking?
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                placeholder="Please provide a reason for cancellation..."
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={actionLoading || !cancelReason.trim()}>
                {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingDetail;
