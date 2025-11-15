/**
 * CalendarModal Component
 *
 * Modal for managing listing availability and pricing calendar
 */

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

type DayStatus = 'available' | 'booked' | 'blocked';

interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  price?: number;
  booking_id?: string;
  guest_name?: string;
  reason?: string; // For blocked dates
}

interface CalendarModalProps {
  listingId: string;
  listingTitle: string;
  listingType: 'daily-rental' | 'long-term';
  isOpen: boolean;
  onClose: () => void;
  calendar?: Record<string, CalendarDay>;
  isLoading?: boolean;
  baseCurrency?: string;
  onBlockDates?: (startDate: string, endDate: string, reason?: string) => Promise<void>;
  onSetCustomPricing?: (startDate: string, endDate: string, price: number) => Promise<void>;
  onUnblockDates?: (startDate: string, endDate: string) => Promise<void>;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  listingId,
  listingTitle,
  listingType,
  isOpen,
  onClose,
  calendar = {},
  isLoading = false,
  baseCurrency = 'EUR',
  onBlockDates,
  onSetCustomPricing,
  onUnblockDates,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mode, setMode] = useState<'view' | 'block' | 'price'>('view');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get days in month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (CalendarDay | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendar[dateStr] || {
        date: dateStr,
        status: 'available' as DayStatus,
      };
      days.push(dayData);
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Handle date selection
  const handleDayClick = (day: CalendarDay | null) => {
    if (!day || mode === 'view') return;
    if (day.status === 'booked') return; // Can't modify booked dates

    const isSelected = selectedDates.includes(day.date);
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => d !== day.date));
    } else {
      setSelectedDates([...selectedDates, day.date]);
    }
  };

  // Handle block dates
  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !onBlockDates) return;

    const sortedDates = [...selectedDates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    try {
      await onBlockDates(startDate, endDate, blockReason || undefined);
      setSelectedDates([]);
      setBlockReason('');
      setMode('view');
    } catch (error) {
      console.error('Failed to block dates:', error);
    }
  };

  // Handle custom pricing
  const handleSetPricing = async () => {
    if (selectedDates.length === 0 || !customPrice || !onSetCustomPricing) return;

    const sortedDates = [...selectedDates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    const price = parseFloat(customPrice);

    if (isNaN(price) || price <= 0) return;

    try {
      await onSetCustomPricing(startDate, endDate, price);
      setSelectedDates([]);
      setCustomPrice('');
      setMode('view');
    } catch (error) {
      console.error('Failed to set custom pricing:', error);
    }
  };

  // Get day style
  const getDayStyle = (day: CalendarDay | null) => {
    if (!day) return 'bg-transparent cursor-default';

    const isSelected = selectedDates.includes(day.date);
    const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0));

    if (isSelected) {
      return 'bg-lime-600 text-white cursor-pointer';
    }

    switch (day.status) {
      case 'booked':
        return 'bg-sky-100 text-sky-700 cursor-not-allowed';
      case 'blocked':
        return 'bg-slate-200 text-slate-500 cursor-pointer hover:bg-slate-300';
      case 'available':
        return isPast
          ? 'bg-slate-50 text-slate-300 cursor-default'
          : 'bg-white text-slate-700 cursor-pointer hover:bg-lime-50 hover:border-lime-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  // Long-term rental calendar (simplified)
  if (listingType === 'long-term') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Current Status</p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">● Rented</p>
                <p className="text-xs text-slate-600 mt-1">Lease until: Dec 31, 2024</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Available From
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Daily rental calendar
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
            <p className="text-xs text-slate-600 truncate">{listingTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="p-4 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => {
              setMode('view');
              setSelectedDates([]);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'view'
                ? 'bg-lime-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            View
          </button>
          <button
            onClick={() => {
              setMode('block');
              setSelectedDates([]);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'block'
                ? 'bg-lime-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Block Dates
          </button>
          <button
            onClick={() => {
              setMode('price');
              setSelectedDates([]);
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'price'
                ? 'bg-lime-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="h-4 w-4 inline mr-1" />
            Custom Pricing
          </button>
        </div>

        {/* Calendar */}
        <div className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h3 className="text-base font-semibold text-slate-900">{monthName}</h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
                {day}
              </div>
            ))}
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                disabled={!day || day.status === 'booked'}
                className={`aspect-square p-1 text-sm font-medium border border-slate-200 rounded-lg transition-all ${getDayStyle(day)}`}
              >
                {day && (
                  <>
                    <div>{new Date(day.date).getDate()}</div>
                    {day.price && (
                      <div className="text-[10px] font-normal">{formatCurrency(day.price)}</div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-sky-100 border border-sky-200 rounded" />
              <span className="text-slate-600">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded" />
              <span className="text-slate-600">Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-white border border-slate-200 rounded" />
              <span className="text-slate-600">Available</span>
            </div>
          </div>

          {/* Action panel */}
          {mode === 'block' && selectedDates.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Block {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}
              </p>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3
                         focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDates([]);
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockDates}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  Block Dates
                </button>
              </div>
            </div>
          )}

          {mode === 'price' && selectedDates.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Set custom price for {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}
              </p>
              <input
                type="number"
                placeholder="Price per night"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3
                         focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDates([]);
                    setCustomPrice('');
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPricing}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  Set Price
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
