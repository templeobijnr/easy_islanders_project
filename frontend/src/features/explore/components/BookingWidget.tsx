import React, { useState, useMemo } from 'react';
import { Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

interface BookingWidgetProps {
    listing: {
        id: number | string;
        title: string;
        base_price: number;
        currency: string;
    };
    onBookingComplete?: (booking: any) => void;
}

interface BookingFormData {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCount: number;
    specialRequests: string;
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({ listing, onBookingComplete }) => {
    const queryClient = useQueryClient();

    // Date selection state
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [showBookingForm, setShowBookingForm] = useState(false);

    // Guest form state
    const [formData, setFormData] = useState<BookingFormData>({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        guestCount: 1,
        specialRequests: ''
    });

    // Fetch blocked dates
    const { data: blockedDatesData } = useQuery({
        queryKey: ['blockedDates', listing.id],
        queryFn: async () => {
            const response = await apiClient.get(
                `/api/v1/real_estate/listings/${listing.id}/blocked-dates/`
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const blockedDates = blockedDatesData?.blocked_dates || [];

    // Calculate nights and total price
    const { nights, totalPrice, serviceFee, grandTotal } = useMemo(() => {
        if (!checkIn || !checkOut) {
            return { nights: 0, totalPrice: 0, serviceFee: 0, grandTotal: 0 };
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nightsCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        if (nightsCount <= 0) {
            return { nights: 0, totalPrice: 0, serviceFee: 0, grandTotal: 0 };
        }

        const total = nightsCount * listing.base_price;
        const fee = total * 0.05; // 5% service fee
        const grand = total + fee;

        return {
            nights: nightsCount,
            totalPrice: total,
            serviceFee: fee,
            grandTotal: grand
        };
    }, [checkIn, checkOut, listing.base_price]);

    // Check if selected dates are valid
    const isDateRangeValid = useMemo(() => {
        if (!checkIn || !checkOut) return false;

        const start = new Date(checkIn);
        const end = new Date(checkOut);

        // Check if any date in range is blocked
        const current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            if (blockedDates.includes(dateStr)) {
                return false;
            }
            current.setDate(current.getDate() + 1);
        }

        return true;
    }, [checkIn, checkOut, blockedDates]);

    // Create booking mutation
    const createBookingMutation = useMutation({
        mutationFn: async (bookingData: any) => {
            const response = await apiClient.post('/api/v1/real_estate/bookings/', bookingData);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['blockedDates', listing.id] });
            if (onBookingComplete) {
                onBookingComplete(data);
            }
            // Reset form
            setShowBookingForm(false);
            setCheckIn('');
            setCheckOut('');
            setFormData({
                guestName: '',
                guestEmail: '',
                guestPhone: '',
                guestCount: 1,
                specialRequests: ''
            });
        }
    });

    const handleReserve = () => {
        if (!isDateRangeValid || nights === 0) return;
        setShowBookingForm(true);
    };

    const handleSubmitBooking = async (e: React.FormEvent) => {
        e.preventDefault();

        await createBookingMutation.mutateAsync({
            listing_id: listing.id,
            check_in: checkIn,
            check_out: checkOut,
            guest_name: formData.guestName,
            guest_email: formData.guestEmail,
            guest_phone: formData.guestPhone,
            guest_count: formData.guestCount,
            special_requests: formData.specialRequests
        });
    };

    // Get min date (today)
    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div className="sticky top-24 bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-6">
            {/* Price Header */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                        {listing.currency} {listing.base_price}
                    </span>
                    <span className="text-slate-600">/ night</span>
                </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Check-in
                    </label>
                    <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={minDate}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Check-out
                    </label>
                    <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || minDate}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Users className="inline h-4 w-4 mr-1" />
                        Guests
                    </label>
                    <select
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Validation Messages */}
            {checkIn && checkOut && !isDateRangeValid && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                        Selected dates are not available. Please choose different dates.
                    </p>
                </div>
            )}

            {/* Price Breakdown */}
            {nights > 0 && isDateRangeValid && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{listing.currency} {listing.base_price} × {nights} nights</span>
                        <span className="font-medium">{listing.currency} {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Service fee (5%)</span>
                        <span className="font-medium">{listing.currency} {serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-lime-600">{listing.currency} {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Reserve Button */}
            {!showBookingForm ? (
                <button
                    onClick={handleReserve}
                    disabled={!isDateRangeValid || nights === 0}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${isDateRangeValid && nights > 0
                            ? 'bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                >
                    Reserve Now
                </button>
            ) : (
                /* Booking Form */
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                    <div className="p-4 bg-lime-50 border border-lime-200 rounded-lg">
                        <h3 className="font-semibold text-lime-900 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Complete Your Booking
                        </h3>
                        <p className="text-sm text-lime-800">
                            {nights} nights • {listing.currency} {grandTotal.toFixed(2)} total
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.guestName}
                            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.guestEmail}
                            onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Phone *
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.guestPhone}
                            onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500"
                            placeholder="+90 533 123 4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Special Requests (Optional)
                        </label>
                        <textarea
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500"
                            placeholder="Late check-in, extra towels, etc."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowBookingForm(false)}
                            className="flex-1 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={createBookingMutation.isPending}
                            className="flex-1 py-3 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-700 hover:to-emerald-700 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            {createBookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </div>

                    {createBookingMutation.isError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                Failed to create booking. Please try again.
                            </p>
                        </div>
                    )}
                </form>
            )}

            {/* Success Message */}
            {createBookingMutation.isSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-green-900">Booking Confirmed!</p>
                            <p className="text-sm text-green-800 mt-1">
                                Reference: {createBookingMutation.data?.booking_reference}
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                Check your email for confirmation details.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-500 text-center mt-4">
                You won't be charged yet
            </p>
        </div>
    );
};
