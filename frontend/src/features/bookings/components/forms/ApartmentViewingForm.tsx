/**
 * ApartmentViewingForm Component
 * Form for scheduling property viewings
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import type { ApartmentViewingBooking } from '../../types';

interface ApartmentViewingFormProps {
  data: Partial<ApartmentViewingBooking>;
  onChange: (field: keyof ApartmentViewingBooking, value: any) => void;
  errors?: Partial<Record<keyof ApartmentViewingBooking, string>>;
}

const ApartmentViewingForm: React.FC<ApartmentViewingFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          👁️ Apartment Viewing Details
        </h3>
        <p className="text-sm text-slate-600">
          Schedule a viewing for this property
        </p>
      </div>

      {/* Viewing Details */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Viewing Schedule</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="viewing_date">
              Viewing Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              id="viewing_date"
              value={data.viewing_date || ''}
              onChange={(e) => onChange('viewing_date', e.target.value)}
              className={errors.viewing_date ? 'border-red-500' : ''}
              required
            />
            {errors.viewing_date && (
              <p className="text-sm text-red-500">{errors.viewing_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="viewing_time">
              Viewing Time <span className="text-red-500">*</span>
            </Label>
            <Input
              type="time"
              id="viewing_time"
              value={data.viewing_time || ''}
              onChange={(e) => onChange('viewing_time', e.target.value)}
              className={errors.viewing_time ? 'border-red-500' : ''}
              required
            />
            {errors.viewing_time && (
              <p className="text-sm text-red-500">{errors.viewing_time}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            type="number"
            id="duration_minutes"
            min="15"
            step="15"
            value={data.duration_minutes || 30}
            onChange={(e) => onChange('duration_minutes', parseInt(e.target.value))}
            placeholder="30"
          />
          <p className="text-sm text-slate-500">
            Typical viewings last 30-45 minutes
          </p>
        </div>
      </div>

      {/* Intent */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Your Interest</h4>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_buyer"
              checked={data.is_buyer || false}
              onChange={(e) => onChange('is_buyer', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="is_buyer" className="cursor-pointer">
              Interested in buying
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_renter"
              checked={data.is_renter || false}
              onChange={(e) => onChange('is_renter', e.target.checked)}
              className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
            />
            <Label htmlFor="is_renter" className="cursor-pointer">
              Interested in renting
            </Label>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Budget Range</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_min">Minimum Budget</Label>
            <Input
              type="number"
              id="budget_min"
              min="0"
              step="1000"
              value={data.budget_min || ''}
              onChange={(e) => onChange('budget_min', e.target.value)}
              placeholder="Min. price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_max">Maximum Budget</Label>
            <Input
              type="number"
              id="budget_max"
              min="0"
              step="1000"
              value={data.budget_max || ''}
              onChange={(e) => onChange('budget_max', e.target.value)}
              placeholder="Max. price"
            />
          </div>
        </div>
      </div>

      {/* Agent Information (Optional) */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Agent Information (Optional)</h4>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Agent Name</Label>
            <Input
              type="text"
              id="agent_name"
              placeholder="If you're working with an agent"
              value={data.agent_name || ''}
              onChange={(e) => onChange('agent_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_phone">Agent Phone</Label>
            <Input
              type="tel"
              id="agent_phone"
              placeholder="Agent's contact number"
              value={data.agent_phone || ''}
              onChange={(e) => onChange('agent_phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_company">Agent Company</Label>
            <Input
              type="text"
              id="agent_company"
              placeholder="Real estate agency"
              value={data.agent_company || ''}
              onChange={(e) => onChange('agent_company', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentViewingForm;
