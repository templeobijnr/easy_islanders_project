/**
 * HotelBookingForm Component
 * Form for hotel booking reservations
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { HotelBooking } from '../../types';

interface HotelBookingFormProps {
  data: Partial<HotelBooking>;
  onChange: (field: keyof HotelBooking, value: any) => void;
  errors?: Partial<Record<keyof HotelBooking, string>>;
}

const HotelBookingForm: React.FC<HotelBookingFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          🏨 Hotel Booking Details
        </h3>
        <p className="text-sm text-slate-600">
          Configure your hotel reservation
        </p>
      </div>

      {/* Room Details */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Room Details</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="room_type">
              Room Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.room_type || ''}
              onValueChange={(value) => onChange('room_type', value as HotelBooking['room_type'])}
            >
              <SelectTrigger className={errors.room_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Room</SelectItem>
                <SelectItem value="double">Double Room</SelectItem>
                <SelectItem value="twin">Twin Room</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="deluxe">Deluxe Room</SelectItem>
              </SelectContent>
            </Select>
            {errors.room_type && (
              <p className="text-sm text-red-500">{errors.room_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal_plan">
              Meal Plan <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.meal_plan || ''}
              onValueChange={(value) => onChange('meal_plan', value as HotelBooking['meal_plan'])}
            >
              <SelectTrigger className={errors.meal_plan ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select meal plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast Only</SelectItem>
                <SelectItem value="half_board">Half Board (Breakfast + Dinner)</SelectItem>
                <SelectItem value="full_board">Full Board (All Meals)</SelectItem>
                <SelectItem value="all_inclusive">All Inclusive</SelectItem>
              </SelectContent>
            </Select>
            {errors.meal_plan && (
              <p className="text-sm text-red-500">{errors.meal_plan}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_rooms">
              Number of Rooms <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="number_of_rooms"
              min="1"
              value={data.number_of_rooms || ''}
              onChange={(e) => onChange('number_of_rooms', parseInt(e.target.value))}
              className={errors.number_of_rooms ? 'border-red-500' : ''}
              required
            />
            {errors.number_of_rooms && (
              <p className="text-sm text-red-500">{errors.number_of_rooms}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_guests">
              Number of Guests <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="number_of_guests"
              min="1"
              value={data.number_of_guests || ''}
              onChange={(e) => onChange('number_of_guests', parseInt(e.target.value))}
              className={errors.number_of_guests ? 'border-red-500' : ''}
              required
            />
            {errors.number_of_guests && (
              <p className="text-sm text-red-500">{errors.number_of_guests}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Room Preferences</h4>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smoking_preference"
              checked={data.smoking_preference || false}
              onChange={(e) => onChange('smoking_preference', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="smoking_preference" className="cursor-pointer">
              Smoking Room
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor_preference">Floor Preference</Label>
            <Input
              type="text"
              id="floor_preference"
              placeholder="e.g., High floor, Ground floor"
              value={data.floor_preference || ''}
              onChange={(e) => onChange('floor_preference', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bed_type_preference">Bed Type Preference</Label>
            <Input
              type="text"
              id="bed_type_preference"
              placeholder="e.g., King bed, Twin beds"
              value={data.bed_type_preference || ''}
              onChange={(e) => onChange('bed_type_preference', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Additional Services</h4>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="early_checkin_requested"
              checked={data.early_checkin_requested || false}
              onChange={(e) => onChange('early_checkin_requested', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="early_checkin_requested" className="cursor-pointer">
              Early Check-in (subject to availability)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="late_checkout_requested"
              checked={data.late_checkout_requested || false}
              onChange={(e) => onChange('late_checkout_requested', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="late_checkout_requested" className="cursor-pointer">
              Late Check-out (subject to availability)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="airport_transfer_needed"
              checked={data.airport_transfer_needed || false}
              onChange={(e) => onChange('airport_transfer_needed', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="airport_transfer_needed" className="cursor-pointer">
              Airport Transfer Service
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBookingForm;
