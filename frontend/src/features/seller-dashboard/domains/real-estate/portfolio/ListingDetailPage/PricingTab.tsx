/**
 * PricingTab - Pricing management and special offers
 */

import React, { useState } from 'react';
import { DollarSign, Calendar, Percent, TrendingUp, Plus, Edit2, Trash2, Tag } from 'lucide-react';

interface SeasonalRate {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  is_active: boolean;
}

interface Discount {
  id: string;
  name: string;
  type: 'weekly' | 'monthly' | 'early_bird' | 'last_minute';
  percentage: number;
  is_active: boolean;
  conditions?: string;
}

interface PricingTabProps {
  listingId: string;
  basePrice?: number;
  currency?: string;
  seasonalRates?: SeasonalRate[];
  discounts?: Discount[];
}

export const PricingTab: React.FC<PricingTabProps> = ({
  listingId,
  basePrice = 120,
  currency = 'EUR',
  seasonalRates = [],
  discounts = [],
}) => {
  const [editingBasePrice, setEditingBasePrice] = useState(false);
  const [newBasePrice, setNewBasePrice] = useState(basePrice.toString());

  // Mock data if none provided
  const displaySeasonalRates: SeasonalRate[] = seasonalRates.length > 0 ? seasonalRates : [
    {
      id: 'rate-1',
      name: 'Summer Peak Season',
      start_date: '2025-06-01',
      end_date: '2025-08-31',
      price_per_night: 180,
      is_active: true,
    },
    {
      id: 'rate-2',
      name: 'Christmas & New Year',
      start_date: '2025-12-20',
      end_date: '2026-01-05',
      price_per_night: 200,
      is_active: true,
    },
    {
      id: 'rate-3',
      name: 'Spring Season',
      start_date: '2025-04-01',
      end_date: '2025-05-31',
      price_per_night: 150,
      is_active: true,
    },
  ];

  const displayDiscounts: Discount[] = discounts.length > 0 ? discounts : [
    {
      id: 'disc-1',
      name: 'Weekly Discount',
      type: 'weekly',
      percentage: 10,
      is_active: true,
      conditions: '7+ nights',
    },
    {
      id: 'disc-2',
      name: 'Monthly Discount',
      type: 'monthly',
      percentage: 20,
      is_active: true,
      conditions: '28+ nights',
    },
    {
      id: 'disc-3',
      name: 'Early Bird Special',
      type: 'early_bird',
      percentage: 15,
      is_active: true,
      conditions: 'Book 60+ days in advance',
    },
    {
      id: 'disc-4',
      name: 'Last Minute Deal',
      type: 'last_minute',
      percentage: 25,
      is_active: false,
      conditions: 'Book within 3 days of check-in',
    },
  ];

  const handleSaveBasePrice = () => {
    console.log('Saving base price:', newBasePrice);
    setEditingBasePrice(false);
  };

  const handleAddSeasonalRate = () => {
    console.log('Adding new seasonal rate');
  };

  const handleEditSeasonalRate = (rateId: string) => {
    console.log('Editing seasonal rate:', rateId);
  };

  const handleDeleteSeasonalRate = (rateId: string) => {
    console.log('Deleting seasonal rate:', rateId);
  };

  const handleToggleDiscount = (discountId: string) => {
    console.log('Toggling discount:', discountId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDiscountIcon = (type: Discount['type']) => {
    switch (type) {
      case 'weekly':
        return <Calendar className="h-5 w-5" />;
      case 'monthly':
        return <Calendar className="h-5 w-5" />;
      case 'early_bird':
        return <TrendingUp className="h-5 w-5" />;
      case 'last_minute':
        return <Tag className="h-5 w-5" />;
      default:
        return <Percent className="h-5 w-5" />;
    }
  };

  const calculatePriceWithDiscount = (price: number, discountPercentage: number) => {
    return price - (price * discountPercentage / 100);
  };

  return (
    <div className="space-y-6">
      {/* Base Price Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Base Price</h2>
              <p className="text-sm text-slate-600">Default price per night</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="p-6">
          {editingBasePrice ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price per night ({currency})
                </label>
                <input
                  type="number"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNewBasePrice(basePrice.toString());
                    setEditingBasePrice(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBasePrice}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {currency} {basePrice}
                  <span className="text-lg text-slate-600 font-normal ml-2">/night</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Weekly: {currency} {calculatePriceWithDiscount(basePrice, 10).toFixed(0)}/night •
                  Monthly: {currency} {calculatePriceWithDiscount(basePrice, 20).toFixed(0)}/night
                </p>
              </div>
              <button
                onClick={() => setEditingBasePrice(true)}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seasonal Rates */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Seasonal Rates</h2>
              <p className="text-sm text-slate-600">Special pricing for specific periods</p>
            </div>
            <button
              onClick={handleAddSeasonalRate}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Rate
            </button>
          </div>
        </div>

        <div className="p-6">
          {displaySeasonalRates.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900">No seasonal rates</p>
              <p className="text-xs text-slate-500 mt-1">Add rates for peak seasons or special periods</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displaySeasonalRates.map((rate) => (
                <div
                  key={rate.id}
                  className="p-4 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-xl border border-brand-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{rate.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rate.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(rate.start_date)} - {formatDate(rate.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-brand-700">
                          <DollarSign className="h-4 w-4" />
                          <span>{currency} {rate.price_per_night}/night</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        {((rate.price_per_night - basePrice) / basePrice * 100).toFixed(0)}%
                        {rate.price_per_night > basePrice ? ' higher' : ' lower'} than base price
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSeasonalRate(rate.id)}
                        className="p-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeasonalRate(rate.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discounts & Promotions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-50 to-emerald-50 p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Discounts & Promotions</h2>
              <p className="text-sm text-slate-600">Automatic discounts for longer stays</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-emerald-100 flex items-center justify-center">
              <Percent className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayDiscounts.map((discount) => (
              <div
                key={discount.id}
                className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                  discount.is_active
                    ? 'bg-gradient-to-br from-brand-50 to-emerald-50 border-brand-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    discount.is_active
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    {getDiscountIcon(discount.type)}
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={discount.is_active}
                      onChange={() => handleToggleDiscount(discount.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <h3 className="font-semibold text-slate-900 mb-1">{discount.name}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-brand-600">{discount.percentage}%</span>
                  <span className="text-sm text-slate-600">off</span>
                </div>
                {discount.conditions && (
                  <p className="text-xs text-slate-600">{discount.conditions}</p>
                )}

                {/* Example calculation */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Example:</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Base: {currency} {basePrice}</span>
                    <span className="font-semibold text-brand-700">
                      {currency} {calculatePriceWithDiscount(basePrice, discount.percentage).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Pricing Tips</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Set higher rates during peak seasons to maximize revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Offer weekly and monthly discounts to attract longer stays</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Use last-minute discounts to fill gaps in your calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Early bird discounts can help you plan ahead and secure bookings</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
