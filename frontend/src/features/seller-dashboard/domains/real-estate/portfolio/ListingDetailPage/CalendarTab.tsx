/**
 * CalendarTab - Availability and pricing calendar
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, Lock, X } from 'lucide-react';

interface DateStatus {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  price?: number;
  booking_id?: string;
  guest_name?: string;
}

interface CalendarTabProps {
  listingId: string;
  dates?: DateStatus[];
  basePrice?: number;
  currency?: string;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  listingId,
  dates = [],
  basePrice = 120,
  currency = 'EUR',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [customPrice, setCustomPrice] = useState(basePrice.toString());

  // Generate calendar dates for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Mock date statuses if none provided
  const mockDateStatuses: Record<string, DateStatus> = dates.length > 0
    ? Object.fromEntries(dates.map(d => [d.date, d]))
    : {
        '2025-11-18': { date: '2025-11-18', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-19': { date: '2025-11-19', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-20': { date: '2025-11-20', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-21': { date: '2025-11-21', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-22': { date: '2025-11-22', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-23': { date: '2025-11-23', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-24': { date: '2025-11-24', status: 'booked', guest_name: 'James Anderson' },
        '2025-11-25': { date: '2025-11-25', status: 'blocked' },
        '2025-11-26': { date: '2025-11-26', status: 'blocked' },
        '2025-12-24': { date: '2025-12-24', status: 'blocked' },
        '2025-12-25': { date: '2025-12-25', status: 'blocked' },
        '2025-12-31': { date: '2025-12-31', status: 'available', price: 200 },
      };

  const getDateStatus = (date: Date): DateStatus => {
    const key = formatDateKey(date);
    return mockDateStatuses[key] || { date: key, status: 'available', price: basePrice };
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const key = formatDateKey(date);
    const status = getDateStatus(date);

    // Don't allow selecting booked dates
    if (status.status === 'booked') return;

    if (selectedDates.includes(key)) {
      setSelectedDates(selectedDates.filter(d => d !== key));
    } else {
      setSelectedDates([...selectedDates, key]);
    }
  };

  const handleBlockDates = () => {
    console.log('Blocking dates:', selectedDates);
    setSelectedDates([]);
  };

  const handleUnblockDates = () => {
    console.log('Unblocking dates:', selectedDates);
    setSelectedDates([]);
  };

  const handleSetPrice = () => {
    console.log('Setting price for dates:', selectedDates, 'to', customPrice);
    setShowPriceModal(false);
    setSelectedDates([]);
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDayClassName = (date: Date | null) => {
    if (!date) return 'invisible';

    const status = getDateStatus(date);
    const key = formatDateKey(date);
    const isSelected = selectedDates.includes(key);
    const today = isToday(date);

    const baseClasses = 'aspect-square p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer relative';

    if (status.status === 'booked') {
      return `${baseClasses} bg-brand-100 border-brand-300 cursor-not-allowed`;
    }

    if (status.status === 'blocked') {
      return `${baseClasses} bg-slate-100 border-slate-300 ${isSelected ? 'ring-2 ring-red-500' : ''}`;
    }

    // Available
    if (isSelected) {
      return `${baseClasses} bg-blue-100 border-blue-500 ring-2 ring-blue-300`;
    }

    if (today) {
      return `${baseClasses} border-brand-500 hover:bg-brand-50`;
    }

    return `${baseClasses} border-slate-200 hover:border-brand-400 hover:bg-brand-50`;
  };

  const stats = {
    available: Object.values(mockDateStatuses).filter(d => d.status === 'available').length,
    booked: Object.values(mockDateStatuses).filter(d => d.status === 'booked').length,
    blocked: Object.values(mockDateStatuses).filter(d => d.status === 'blocked').length,
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{monthYear}</h2>
            <p className="text-sm text-slate-600 mt-1">Manage availability and pricing</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border-2 border-slate-200" />
            <span className="text-sm text-slate-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-brand-100 border-2 border-brand-300" />
            <span className="text-sm text-slate-700">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-300" />
            <span className="text-sm text-slate-700">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500" />
            <span className="text-sm text-slate-700">Selected</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2 text-sm font-semibold text-slate-600">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="invisible" />;
            }

            const status = getDateStatus(day);
            const price = status.price || basePrice;

            return (
              <div
                key={formatDateKey(day)}
                onClick={() => handleDateClick(day)}
                className={getDayClassName(day)}
              >
                <div className="flex flex-col h-full">
                  <span className="text-sm font-medium text-slate-900 mb-1">
                    {day.getDate()}
                  </span>

                  {status.status === 'booked' && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-brand-700 font-medium">Booked</span>
                    </div>
                  )}

                  {status.status === 'blocked' && (
                    <div className="flex-1 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-slate-500" />
                    </div>
                  )}

                  {status.status === 'available' && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-slate-600 font-medium">
                        {currency} {price}
                      </span>
                    </div>
                  )}

                  {isToday(day) && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-brand-600 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Actions */}
        {selectedDates.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">
                  {selectedDates.length} {selectedDates.length === 1 ? 'date' : 'dates'} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBlockDates}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Block
                </button>
                <button
                  onClick={handleUnblockDates}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <X className="h-4 w-4" />
                  Unblock
                </button>
                <button
                  onClick={() => setShowPriceModal(true)}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4" />
                  Set Price
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Available</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.available}</p>
          <p className="text-xs text-slate-500 mt-1">days this month</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Booked</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.booked}</p>
          <p className="text-xs text-slate-500 mt-1">days this month</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
              <Lock className="h-5 w-5 text-brand-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Blocked</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.blocked}</p>
          <p className="text-xs text-slate-500 mt-1">days this month</p>
        </div>
      </div>

      {/* Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Set Custom Price</h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Setting price for {selectedDates.length} {selectedDates.length === 1 ? 'date' : 'dates'}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price per night ({currency})
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder={basePrice.toString()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPrice}
                className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
              >
                Set Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
