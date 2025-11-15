import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

/**
 * BookingModal Component - Premium Version
 * TDD Implementation - Component passes all 6 tests
 *
 * Features:
 * - Premium animations with Framer Motion
 * - Spring-based entrance animations
 * - Enhanced backdrop blur
 * - Gradient accents and luxury styling
 * - Displays listing details (image, title, price, location)
 * - Date and time selection
 * - Optional message field
 * - Booking submission
 * - Premium success feedback
 * - Modal controls (open/close)
 */

interface Listing {
  id: string;
  title: string;
  price: number | string;
  currency?: string;
  location?: string;
  image_urls?: string[];
  image_url?: string;
}

interface BookingModalProps {
  isOpen?: boolean;
  listing?: Listing | null;
  onClose?: () => void;
  onSubmit?: (data: any) => void | Promise<void>;
  success?: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-neutral-200 shadow-2xl">
        <AnimatePresence mode="wait">
          {success ? (
            // Premium Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-center py-6"
            >
              <motion.div
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="relative w-24 h-24 mx-auto">
                  {/* Animated gradient background */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 opacity-20"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Icon container */}
                  <div className="relative w-full h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 flex items-center justify-center shadow-xl">
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </div>
                  {/* Sparkle effect */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.h3
                className="text-2xl font-bold font-display bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Request Sent Successfully!
              </motion.h3>

              <motion.p
                className="text-neutral-600 leading-relaxed mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                The property owner will respond to your booking request shortly. Check your messages for updates.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={handleClose} variant="luxury" size="lg" className="w-full">
                  Close
                </Button>
              </motion.div>
            </motion.div>
          ) : (
          // Premium Booking Form
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-display bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                Book Your Stay
              </DialogTitle>

              {/* Premium Listing Image */}
              {imageUrl && (
                <motion.div
                  className="relative mt-4 overflow-hidden rounded-2xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={imageUrl}
                    alt="Listing image"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </motion.div>
              )}

              {/* Premium Listing Details Card */}
              <Card className="mt-4 border-2 border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                <CardContent className="p-6 bg-gradient-to-br from-lime-50 to-emerald-50">
                  <h3 className="text-xl font-bold font-display text-neutral-900 mb-3">
                    {listing.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                        €{listing.price}
                      </span>
                      {listing.currency && (
                        <span className="text-sm text-neutral-600">{listing.currency}</span>
                      )}
                    </div>
                    {listing.location && (
                      <p className="text-neutral-600 flex items-center gap-2">
                        <span className="text-lime-600">📍</span> {listing.location}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DialogHeader>

            {/* Premium Form */}
            <div className="space-y-5 mt-6">
              {/* Date Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="date" className="text-sm font-semibold text-neutral-700">
                  Select date
                </Label>
                <Input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2 rounded-xl border-2 border-neutral-200 focus:border-lime-500 transition-colors"
                />
              </motion.div>

              {/* Time Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="time" className="text-sm font-semibold text-neutral-700">
                  Select time
                </Label>
                <Input
                  type="time"
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-2 rounded-xl border-2 border-neutral-200 focus:border-lime-500 transition-colors"
                />
              </motion.div>

              {/* Message Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="message" className="text-sm font-semibold text-neutral-700">
                  Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any special requests or questions..."
                  disabled={isSubmitting}
                  rows={3}
                  className="mt-2 rounded-xl border-2 border-neutral-200 focus:border-lime-500 transition-colors resize-none"
                />
              </motion.div>
            </div>

            {/* Premium Actions */}
            <DialogFooter className="flex gap-3 mt-8">
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDate || !selectedTime}
                variant="luxury"
                size="lg"
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
          </motion.div>
        )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
