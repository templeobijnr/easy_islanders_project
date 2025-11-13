/**
 * ServiceBookingForm Component
 * Form for service bookings (cleaning, repairs, maintenance)
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { ServiceBooking } from '../../types';

interface ServiceBookingFormProps {
  data: Partial<ServiceBooking>;
  onChange: (field: keyof ServiceBooking, value: any) => void;
  errors?: Partial<Record<keyof ServiceBooking, string>>;
}

const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          🔧 Service Booking Details
        </h3>
        <p className="text-sm text-slate-600">
          Provide details for the service you need
        </p>
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type">
          Service Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.service_type || ''}
          onValueChange={(value) => onChange('service_type', value as ServiceBooking['service_type'])}
        >
          <SelectTrigger className={errors.service_type ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cleaning">🧹 Cleaning</SelectItem>
            <SelectItem value="repair">🔨 Repair</SelectItem>
            <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
            <SelectItem value="plumbing">🚰 Plumbing</SelectItem>
            <SelectItem value="electrical">⚡ Electrical</SelectItem>
            <SelectItem value="other">📋 Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.service_type && (
          <p className="text-sm text-red-500">{errors.service_type}</p>
        )}
      </div>

      {/* Service Description */}
      <div className="space-y-2">
        <Label htmlFor="service_description">
          Service Description <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="service_description"
          rows={5}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none ${
            errors.service_description ? 'border-red-500' : 'border-slate-300'
          }`}
          placeholder="Please describe the service you need in detail..."
          value={data.service_description || ''}
          onChange={(e) => onChange('service_description', e.target.value)}
          required
        />
        {errors.service_description && (
          <p className="text-sm text-red-500">{errors.service_description}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location_address">
          Service Location <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="location_address"
          placeholder="Full address where service is needed"
          value={data.location_address || ''}
          onChange={(e) => onChange('location_address', e.target.value)}
          className={errors.location_address ? 'border-red-500' : ''}
          required
        />
        {errors.location_address && (
          <p className="text-sm text-red-500">{errors.location_address}</p>
        )}
      </div>

      {/* Access Instructions */}
      <div className="space-y-2">
        <Label htmlFor="access_instructions">Access Instructions</Label>
        <textarea
          id="access_instructions"
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
          placeholder="How should the service provider access the location? Gate codes, keys, etc."
          value={data.access_instructions || ''}
          onChange={(e) => onChange('access_instructions', e.target.value)}
        />
      </div>

      {/* Equipment Needed */}
      <div className="space-y-2">
        <Label>Equipment/Materials Needed</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Tools', 'Ladder', 'Paint', 'Cleaning Supplies', 'Parts', 'Other'].map((equipment) => {
            const currentEquipment = data.equipment_needed || [];
            const isChecked = currentEquipment.includes(equipment);

            return (
              <div key={equipment} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`equipment_${equipment}`}
                  checked={isChecked}
                  onChange={(e) => {
                    const newEquipment = e.target.checked
                      ? [...currentEquipment, equipment]
                      : currentEquipment.filter((eq) => eq !== equipment);
                    onChange('equipment_needed', newEquipment);
                  }}
                  className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
                />
                <Label htmlFor={`equipment_${equipment}`} className="cursor-pointer text-sm">
                  {equipment}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated Duration */}
      <div className="space-y-2">
        <Label htmlFor="estimated_duration_hours">Estimated Duration (hours)</Label>
        <Input
          type="number"
          id="estimated_duration_hours"
          min="0.5"
          step="0.5"
          value={data.estimated_duration_hours || ''}
          onChange={(e) => onChange('estimated_duration_hours', parseFloat(e.target.value))}
          placeholder="How long do you expect this service to take?"
        />
      </div>
    </div>
  );
};

export default ServiceBookingForm;
