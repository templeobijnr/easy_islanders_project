/**
 * Dynamic form for creating/editing listings based on category schema
 */

import React, { useState, useEffect } from 'react';
import { Category, FormFieldState, SchemaField, CreateListingRequest } from '../../../types/schema';
import { FormSubmissionState } from '../../../types/schema';
import DynamicFieldRenderer from './DynamicFieldRenderer';

interface DynamicListingFormProps {
  category: Category;
  initialValues?: Partial<CreateListingRequest>;
  onSubmit: (values: CreateListingRequest) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const DynamicListingForm: React.FC<DynamicListingFormProps> = ({
  category,
  initialValues,
  onSubmit,
  isLoading = false,
  readOnly = false,
}) => {
  const [formData, setFormData] = useState<FormFieldState>({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    price: initialValues?.price || '',
    currency: initialValues?.currency || 'EUR',
    location: initialValues?.location || '',
    dynamic_fields: initialValues?.dynamic_fields || {},
  });

  const [formState, setFormState] = useState<FormSubmissionState>({
    isLoading: false,
    errors: [],
  });

  // Initialize dynamic fields
  useEffect(() => {
    if (category.schema && category.schema.fields) {
      const dynamicFields: FormFieldState = {};
      category.schema.fields.forEach((field) => {
        if (formData.dynamic_fields && field.name in formData.dynamic_fields) {
          dynamicFields[field.name] = formData.dynamic_fields[field.name];
        } else {
          dynamicFields[field.name] = getDefaultValue(field);
        }
      });
      setFormData((prev) => ({
        ...prev,
        dynamic_fields: dynamicFields,
      }));
    }
  }, [category]);

  const getDefaultValue = (field: SchemaField): any => {
    switch (field.type) {
      case 'boolean':
        return false;
      case 'number':
        return '';
      case 'multi-select':
        return [];
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDynamicFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      dynamic_fields: {
        ...prev.dynamic_fields,
        [fieldName]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate basic fields
    if (!formData.title?.trim()) {
      errors.push({ field: 'title', message: 'Title is required' });
    }
    if (!formData.description?.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    // Validate dynamic fields
    if (category.schema && category.schema.fields) {
      category.schema.fields.forEach((field) => {
        if (field.required && !formData.dynamic_fields[field.name]) {
          errors.push({
            field: field.name,
            message: `${field.label} is required`,
          });
        }
      });
    }

    setFormState((prev) => ({
      ...prev,
      errors,
    }));

    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isLoading: true,
      generalError: undefined,
    }));

    try {
      const payload: CreateListingRequest = {
        title: formData.title,
        description: formData.description,
        category: category.id,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency,
        location: formData.location,
        dynamic_fields: formData.dynamic_fields,
        status: 'active',
      };

      await onSubmit(payload);

      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        success: true,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit form';
      setFormState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: message,
      }));
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formState.errors.find((e) => e.field === fieldName)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {formState.generalError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{formState.generalError}</p>
        </div>
      )}

      {/* Basic Fields Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={readOnly || isLoading || formState.isLoading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter listing title"
          />
          {getFieldError('title') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('title')}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            disabled={readOnly || isLoading || formState.isLoading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter listing description"
          />
          {getFieldError('description') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('description')}</p>
          )}
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={readOnly || isLoading || formState.isLoading}
              step="0.01"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={(e) => handleSelectChange('currency', e.target.value)}
              disabled={readOnly || isLoading || formState.isLoading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
              <option value="TRY">TRY</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            disabled={readOnly || isLoading || formState.isLoading}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter location"
          />
        </div>
      </div>

      {/* Dynamic Fields Section */}
      {category.schema && category.schema.fields && category.schema.fields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {category.name} Details
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {category.schema.fields.map((field) => (
              <div key={field.name}>
                <DynamicFieldRenderer
                  field={field}
                  value={formData.dynamic_fields[field.name]}
                  onChange={(value: any) => handleDynamicFieldChange(field.name, value)}
                  error={getFieldError(field.name)}
                  disabled={readOnly || isLoading || formState.isLoading}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={readOnly || isLoading || formState.isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:opacity-50 transition-all"
        >
          {formState.isLoading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {formState.isLoading ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
};

export default DynamicListingForm;
