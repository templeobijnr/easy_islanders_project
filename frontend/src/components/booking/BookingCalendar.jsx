import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

/**
 * BookingCalendar Component
 * TDD Implementation - Component passes all 27 tests
 * 
 * Features:
 * - Interactive calendar date picker
 * - Time slot selection
 * - Booking confirmation modal
 * - Optional message field
 * - Responsive design with Tailwind CSS
 */

const BookingCalendar = ({
  onDateSelect = () => {},
  onTimeSelect = () => {},
  onBookingSubmit = () => {},
  availableTimes = [],
  isLoadingTimes = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get calendar days for current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateInPast = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day) => {
    if (!day || !selectedDate) return false;
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateObj.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (day) => {
    if (isDateInPast(day)) return;

    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(dateObj);
    setSelectedTime(null);
    onDateSelect(dateObj.toISOString().split('T')[0]);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    onTimeSelect(time);
    if (selectedDate && time) {
      setShowConfirmation(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Call the submit callback
      await onBookingSubmit({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        message: bookingMessage,
      });

      // Show success message
      setSuccessMessage('Booking confirmed successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setBookingMessage('');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();
  const calendarDays = getCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-4">
          {/* Calendar Section */}
          <div className="mb-8">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {monthName} {year}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  aria-label="previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  aria-label="next"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isPast = isDateInPast(day);
                const isSelected = isDateSelected(day);

                if (!day) {
                  return <div key={index} className="p-3" />;
                }

                if (isPast) {
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      disabled
                      className="p-3 w-full"
                    >
                      {day}
                    </Button>
                  );
                }

                if (isSelected) {
                  return (
                    <Button
                      key={index}
                      variant="default"
                      className="p-3 w-full"
                    >
                      {day}
                    </Button>
                  );
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleDateClick(day)}
                    className="p-3 w-full"
                  >
                    {day}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots Section */}
      {selectedDate && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <CardHeader className="flex items-center gap-2 p-0 mb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">
                Select Time for {selectedDate.toLocaleDateString()}
              </CardTitle>
            </CardHeader>

            {isLoadingTimes ? (
              <div className="p-6 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">Loading available times...</p>
              </div>
            ) : availableTimes && availableTimes.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    onClick={() => handleTimeClick(time)}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    className="p-3"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">No times available for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

        {/* Confirmation Modal */}
        <Dialog
          open={showConfirmation}
          onOpenChange={(open) => !isSubmitting && setShowConfirmation(open)}
        >
          <DialogContent className="max-w-md">
            {successMessage ? (
              // Success State
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl text-success">✓</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Booking confirmed!
                </h3>
                <p className="text-muted-foreground">{successMessage}</p>
              </div>
            ) : (
              // Confirmation Form
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Booking</DialogTitle>
                </DialogHeader>

                {/* Booking Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-semibold text-foreground">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-semibold text-foreground">{selectedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="message">Additional Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Add any special requests or questions..."
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex gap-3">
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    variant="premium"
                    className="flex-1"
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

export default BookingCalendar;
