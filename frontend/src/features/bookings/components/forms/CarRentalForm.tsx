/**
 * CarRentalForm Component
 * Form for car rental bookings
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { CarRentalBooking } from '../../types';

interface CarRentalFormProps {
  data: Partial<CarRentalBooking>;
  onChange: (field: keyof CarRentalBooking, value: any) => void;
  errors?: Partial<Record<keyof CarRentalBooking, string>>;
}

const CarRentalForm: React.FC<CarRentalFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          🚗 Car Rental Details
        </h3>
        <p className="text-sm text-slate-600">
          Provide rental and driver information
        </p>
      </div>

      {/* Pickup & Dropoff */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Pickup & Dropoff</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_location">
              Pickup Location <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="pickup_location"
              placeholder="Address or location"
              value={data.pickup_location || ''}
              onChange={(e) => onChange('pickup_location', e.target.value)}
              className={errors.pickup_location ? 'border-red-500' : ''}
              required
            />
            {errors.pickup_location && (
              <p className="text-sm text-red-500">{errors.pickup_location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoff_location">
              Dropoff Location <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="dropoff_location"
              placeholder="Address or location"
              value={data.dropoff_location || ''}
              onChange={(e) => onChange('dropoff_location', e.target.value)}
              className={errors.dropoff_location ? 'border-red-500' : ''}
              required
            />
            {errors.dropoff_location && (
              <p className="text-sm text-red-500">{errors.dropoff_location}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_datetime">
              Pickup Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              id="pickup_datetime"
              value={data.pickup_datetime || ''}
              onChange={(e) => onChange('pickup_datetime', e.target.value)}
              className={errors.pickup_datetime ? 'border-red-500' : ''}
              required
            />
            {errors.pickup_datetime && (
              <p className="text-sm text-red-500">{errors.pickup_datetime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoff_datetime">
              Dropoff Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              id="dropoff_datetime"
              value={data.dropoff_datetime || ''}
              onChange={(e) => onChange('dropoff_datetime', e.target.value)}
              className={errors.dropoff_datetime ? 'border-red-500' : ''}
              required
            />
            {errors.dropoff_datetime && (
              <p className="text-sm text-red-500">{errors.dropoff_datetime}</p>
            )}
          </div>
        </div>
      </div>

      {/* Driver Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Driver Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="driver_name">
              Driver Name <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="driver_name"
              placeholder="Full name as on license"
              value={data.driver_name || ''}
              onChange={(e) => onChange('driver_name', e.target.value)}
              className={errors.driver_name ? 'border-red-500' : ''}
              required
            />
            {errors.driver_name && (
              <p className="text-sm text-red-500">{errors.driver_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_age">
              Driver Age <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="driver_age"
              min="18"
              max="100"
              value={data.driver_age || ''}
              onChange={(e) => onChange('driver_age', parseInt(e.target.value))}
              className={errors.driver_age ? 'border-red-500' : ''}
              required
            />
            {errors.driver_age && (
              <p className="text-sm text-red-500">{errors.driver_age}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_license_number">
              License Number <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="driver_license_number"
              placeholder="Driver's license number"
              value={data.driver_license_number || ''}
              onChange={(e) => onChange('driver_license_number', e.target.value)}
              className={errors.driver_license_number ? 'border-red-500' : ''}
              required
            />
            {errors.driver_license_number && (
              <p className="text-sm text-red-500">{errors.driver_license_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_license_country">
              License Country <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="driver_license_country"
              placeholder="Country of issuance"
              value={data.driver_license_country || ''}
              onChange={(e) => onChange('driver_license_country', e.target.value)}
              className={errors.driver_license_country ? 'border-red-500' : ''}
              required
            />
            {errors.driver_license_country && (
              <p className="text-sm text-red-500">{errors.driver_license_country}</p>
            )}
          </div>
        </div>
      </div>

      {/* Insurance & Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Insurance & Options</h4>

        <div className="space-y-2">
          <Label htmlFor="insurance_type">
            Insurance Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.insurance_type || ''}
            onValueChange={(value) => onChange('insurance_type', value as CarRentalBooking['insurance_type'])}
          >
            <SelectTrigger className={errors.insurance_type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select insurance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic Coverage</SelectItem>
              <SelectItem value="standard">Standard Coverage</SelectItem>
              <SelectItem value="premium">Premium Coverage</SelectItem>
            </SelectContent>
          </Select>
          {errors.insurance_type && (
            <p className="text-sm text-red-500">{errors.insurance_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuel_policy">
            Fuel Policy <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.fuel_policy || ''}
            onValueChange={(value) => onChange('fuel_policy', value as CarRentalBooking['fuel_policy'])}
          >
            <SelectTrigger className={errors.fuel_policy ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select fuel policy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_to_full">Full to Full</SelectItem>
              <SelectItem value="same_to_same">Same to Same</SelectItem>
              <SelectItem value="prepaid">Prepaid Fuel</SelectItem>
            </SelectContent>
          </Select>
          {errors.fuel_policy && (
            <p className="text-sm text-red-500">{errors.fuel_policy}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional_drivers">Number of Additional Drivers</Label>
          <Input
            type="number"
            id="additional_drivers"
            min="0"
            max="5"
            value={data.additional_drivers || 0}
            onChange={(e) => onChange('additional_drivers', parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mileage_limit">Mileage Limit (km, optional)</Label>
          <Input
            type="number"
            id="mileage_limit"
            min="0"
            value={data.mileage_limit || ''}
            onChange={(e) => onChange('mileage_limit', parseInt(e.target.value))}
            placeholder="Leave blank for unlimited"
          />
        </div>
      </div>

      {/* Add-ons */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Add-ons</h4>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="add_gps"
              checked={data.add_gps || false}
              onChange={(e) => onChange('add_gps', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="add_gps" className="cursor-pointer">
              GPS Navigation System
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="add_child_seat"
              checked={data.add_child_seat || false}
              onChange={(e) => onChange('add_child_seat', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="add_child_seat" className="cursor-pointer">
              Child Safety Seat
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarRentalForm;
