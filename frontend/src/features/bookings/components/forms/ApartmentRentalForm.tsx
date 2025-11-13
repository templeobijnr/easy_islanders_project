/**
 * ApartmentRentalForm Component
 * Form for short-term apartment rental bookings
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import type { ApartmentRentalBooking } from '../../types';

interface ApartmentRentalFormProps {
  data: Partial<ApartmentRentalBooking>;
  onChange: (field: keyof ApartmentRentalBooking, value: any) => void;
  errors?: Partial<Record<keyof ApartmentRentalBooking, string>>;
}

const ApartmentRentalForm: React.FC<ApartmentRentalFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          🏠 Apartment Rental Details
        </h3>
        <p className="text-sm text-slate-600">
          Provide details for your short-term apartment rental
        </p>
      </div>

      {/* Guest Breakdown */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Guest Breakdown</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number_of_adults">
              Adults <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              id="number_of_adults"
              min="1"
              value={data.number_of_adults || ''}
              onChange={(e) => onChange('number_of_adults', parseInt(e.target.value))}
              className={errors.number_of_adults ? 'border-red-500' : ''}
              required
            />
            {errors.number_of_adults && (
              <p className="text-sm text-red-500">{errors.number_of_adults}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_children">Children</Label>
            <Input
              type="number"
              id="number_of_children"
              min="0"
              value={data.number_of_children || 0}
              onChange={(e) => onChange('number_of_children', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_infants">Infants</Label>
            <Input
              type="number"
              id="number_of_infants"
              min="0"
              value={data.number_of_infants || 0}
              onChange={(e) => onChange('number_of_infants', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Pets */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Pets</h4>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="pets_allowed"
            checked={data.pets_allowed || false}
            onChange={(e) => onChange('pets_allowed', e.target.checked)}
            className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
          />
          <Label htmlFor="pets_allowed" className="cursor-pointer">
            I will be bringing pets
          </Label>
        </div>

        {data.pets_allowed && (
          <div className="space-y-2">
            <Label htmlFor="pet_details">Pet Details</Label>
            <textarea
              id="pet_details"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
              placeholder="Please describe your pet(s) - type, breed, size, etc."
              value={data.pet_details || ''}
              onChange={(e) => onChange('pet_details', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Requested Amenities</h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['WiFi', 'Parking', 'Air Conditioning', 'Heating', 'TV', 'Kitchen', 'Washer', 'Dryer', 'Balcony'].map((amenity) => {
            const currentAmenities = data.amenities_requested || [];
            const isChecked = currentAmenities.includes(amenity);

            return (
              <div key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`amenity_${amenity}`}
                  checked={isChecked}
                  onChange={(e) => {
                    const newAmenities = e.target.checked
                      ? [...currentAmenities, amenity]
                      : currentAmenities.filter((a) => a !== amenity);
                    onChange('amenities_requested', newAmenities);
                  }}
                  className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
                />
                <Label htmlFor={`amenity_${amenity}`} className="cursor-pointer text-sm">
                  {amenity}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cleaning Service */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Additional Services</h4>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="cleaning_service_requested"
            checked={data.cleaning_service_requested || false}
            onChange={(e) => onChange('cleaning_service_requested', e.target.checked)}
            className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
          />
          <Label htmlFor="cleaning_service_requested" className="cursor-pointer">
            Request cleaning service during stay
          </Label>
        </div>

        {data.cleaning_service_requested && (
          <div className="space-y-2">
            <Label htmlFor="cleaning_fee">Cleaning Fee (if applicable)</Label>
            <Input
              type="number"
              id="cleaning_fee"
              min="0"
              step="0.01"
              value={data.cleaning_fee || ''}
              onChange={(e) => onChange('cleaning_fee', e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      {/* Check-in Instructions */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Additional Information</h4>

        <div className="space-y-2">
          <Label htmlFor="check_in_instructions">Special Check-in Requirements</Label>
          <textarea
            id="check_in_instructions"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
            placeholder="Any special requirements for check-in?"
            value={data.check_in_instructions || ''}
            onChange={(e) => onChange('check_in_instructions', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ApartmentRentalForm;
