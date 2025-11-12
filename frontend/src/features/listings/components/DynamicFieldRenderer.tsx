/**
 * Renders form fields dynamically based on schema configuration
 */

import React from 'react';
import { SchemaField } from '../../../types/schema';

interface DynamicFieldRendererProps {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}) => {
  const baseInputClasses =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100';
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.min}
            max={field.max}
            step="0.01"
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'tel':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            pattern={field.pattern}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );

      case 'select':
        const options = Array.isArray(field.choices)
          ? field.choices.map((choice) =>
              typeof choice === 'string' ? { value: choice, label: choice } : choice
            )
          : [];

        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          >
            <option value="">Select {field.label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        const multiOptions = Array.isArray(field.choices)
          ? field.choices.map((choice) =>
              typeof choice === 'string' ? { value: choice, label: choice } : choice
            )
          : [];

        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) =>
              onChange(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          >
            {multiOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} ${errorClasses} ${className}`}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {field.type !== 'boolean' && (
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>
      )}

      {renderField()}

      {field.help_text && (
        <p className="text-xs text-gray-500">{field.help_text}</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default DynamicFieldRenderer;
