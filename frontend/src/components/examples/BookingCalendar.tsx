/**
 * Booking Calendar - Easy Islanders
 *
 * A date picker for booking rentals, services, or appointments.
 * Customized for Easy Islanders with:
 * - Blocked dates (already booked)
 * - Available dates highlighting
 * - Date range selection
 * - Price display per selected range
 */

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Euro } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";

interface BookingCalendarProps {
  /** Daily price for the listing */
  pricePerDay?: number;
  /** Array of dates that are already booked */
  bookedDates?: Date[];
  /** Minimum number of nights */
  minNights?: number;
  /** Maximum number of nights */
  maxNights?: number;
  /** Callback when dates are selected */
  onSelect?: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

export function BookingCalendar({
  pricePerDay = 100,
  bookedDates = [],
  minNights = 1,
  maxNights = 30,
  onSelect
}: BookingCalendarProps) {
  const [checkIn, setCheckIn] = React.useState<Date>();
  const [checkOut, setCheckOut] = React.useState<Date>();

  // Calculate total nights and price
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * pricePerDay;

  // Disable booked dates
  const disabledDays = [
    { before: new Date() }, // Past dates
    ...bookedDates.map(date => ({ from: date, to: date }))
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (!checkIn || (checkIn && checkOut)) {
      // First selection or reset
      setCheckIn(date);
      setCheckOut(undefined);
      onSelect?.(date, undefined);
    } else {
      // Second selection
      if (date && date > checkIn) {
        setCheckOut(date);
        onSelect?.(checkIn, date);
      } else {
        // Selected date is before check-in, swap them
        setCheckOut(checkIn);
        setCheckIn(date);
        onSelect?.(date, checkIn);
      }
    }
  };

  const clearDates = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    onSelect?.(undefined, undefined);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Select Dates
            </CardTitle>
            <CardDescription className="mt-1">
              Choose your check-in and check-out dates
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg font-semibold">
            <Euro className="h-4 w-4 mr-1" />
            {pricePerDay}/day
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={checkIn}
          onSelect={handleDateSelect}
          disabled={disabledDays}
          className="rounded-xl border shadow-sm"
          captionLayout="dropdown"
          fromYear={2024}
          toYear={2025}
        />

        {/* Selected dates display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Check-in</label>
            <div className="flex items-center justify-center h-10 rounded-lg border bg-muted/50 text-sm font-medium">
              {checkIn ? format(checkIn, 'MMM dd') : '—'}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Check-out</label>
            <div className="flex items-center justify-center h-10 rounded-lg border bg-muted/50 text-sm font-medium">
              {checkOut ? format(checkOut, 'MMM dd') : '—'}
            </div>
          </div>
        </div>

        {/* Price calculation */}
        {nights > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                €{pricePerDay} × {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="font-medium">€{totalPrice}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">€{totalPrice}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {(checkIn || checkOut) && (
            <Button variant="outline" className="flex-1" onClick={clearDates}>
              Clear
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!checkIn || !checkOut || nights < minNights || nights > maxNights}
          >
            {nights < minNights && checkIn && checkOut
              ? `Minimum ${minNights} nights`
              : 'Reserve'}
          </Button>
        </div>

        {/* Info note */}
        <p className="text-xs text-center text-muted-foreground">
          You won't be charged yet
        </p>
      </CardContent>
    </Card>
  );
}

export default BookingCalendar;
