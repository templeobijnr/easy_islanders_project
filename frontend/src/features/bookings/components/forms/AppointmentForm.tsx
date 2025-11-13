/**
 * AppointmentForm Component
 * Form for booking appointments (hair, beauty, medical, etc.)
 */

import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { AppointmentBooking } from '../../types';

interface AppointmentFormProps {
  data: Partial<AppointmentBooking>;
  onChange: (field: keyof AppointmentBooking, value: any) => void;
  errors?: Partial<Record<keyof AppointmentBooking, string>>;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          📅 Appointment Details
        </h3>
        <p className="text-sm text-slate-600">
          Schedule your appointment
        </p>
      </div>

      {/* Appointment Type */}
      <div className="space-y-2">
        <Label htmlFor="appointment_type">
          Appointment Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.appointment_type || ''}
          onValueChange={(value) => onChange('appointment_type', value as AppointmentBooking['appointment_type'])}
        >
          <SelectTrigger className={errors.appointment_type ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select appointment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hair">💇 Hair Salon</SelectItem>
            <SelectItem value="beauty">💅 Beauty & Spa</SelectItem>
            <SelectItem value="medical">🏥 Medical</SelectItem>
            <SelectItem value="dental">🦷 Dental</SelectItem>
            <SelectItem value="consultation">👔 Consultation</SelectItem>
            <SelectItem value="fitness">💪 Fitness/Training</SelectItem>
            <SelectItem value="legal">⚖️ Legal</SelectItem>
            <SelectItem value="other">📋 Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.appointment_type && (
          <p className="text-sm text-red-500">{errors.appointment_type}</p>
        )}
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration_minutes">
          Duration (minutes) <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.duration_minutes?.toString() || ''}
          onValueChange={(value) => onChange('duration_minutes', parseInt(value))}
        >
          <SelectTrigger className={errors.duration_minutes ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
            <SelectItem value="120">2 hours</SelectItem>
            <SelectItem value="180">3 hours</SelectItem>
          </SelectContent>
        </Select>
        {errors.duration_minutes && (
          <p className="text-sm text-red-500">{errors.duration_minutes}</p>
        )}
      </div>

      {/* Recurring Appointments */}
      <div className="space-y-4">
        <h4 className="font-medium text-slate-900">Recurring Appointment</h4>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_recurring"
            checked={data.is_recurring || false}
            onChange={(e) => onChange('is_recurring', e.target.checked)}
            className="w-4 h-4 text-lime-600 border-slate-300 rounded focus:ring-lime-500"
          />
          <Label htmlFor="is_recurring" className="cursor-pointer">
            This is a recurring appointment
          </Label>
        </div>

        {data.is_recurring && (
          <div className="space-y-2">
            <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
            <Select
              value={data.recurrence_pattern || ''}
              onValueChange={(value) => onChange('recurrence_pattern', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Service Provider Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> The service provider will be selected based on availability
          and will be confirmed after booking submission.
        </p>
      </div>
    </div>
  );
};

export default AppointmentForm;
