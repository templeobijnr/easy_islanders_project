import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

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

  if (!listing) return null;

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          // Success State
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-success" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Request Sent!
            </h3>
            <p className="text-muted-foreground">
              The property owner will respond to your booking request shortly.
            </p>
            <Button onClick={handleClose} variant="premium" className="mt-6 w-full">
              Close
            </Button>
          </div>
        ) : (
          // Booking Form
          <>
            {/* Header */}
            <DialogHeader>
              <DialogTitle>Book Now</DialogTitle>
              {/* Listing Details */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Listing image"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {listing.title}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        €{listing.price}
                      </span>
                      {listing.currency && ` ${listing.currency}`}
                    </p>
                    <p>{listing.location}</p>
                  </div>
                </CardContent>
              </Card>
            </DialogHeader>

            {/* Form */}
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <Label htmlFor="date">Select date</Label>
                <Input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Selection */}
              <div>
                <Label htmlFor="time">Select time</Label>
                <Input
                  type="time"
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Message Field */}
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any special requests or questions..."
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <DialogFooter className="flex gap-3">
              <Button onClick={handleClose} disabled={isSubmitting} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDate || !selectedTime}
                variant="premium"
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Request Booking'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
