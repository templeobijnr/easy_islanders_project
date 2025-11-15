/**
 * BookingWizard Component
 * Multi-step booking wizard that orchestrates the entire booking flow
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence as FMAnimatePresence } from 'framer-motion';
import { MotionDiv } from '../../../components/ui/motion-wrapper';

// Type-safe wrapper for AnimatePresence to fix TypeScript issues with framer-motion v11
const AnimatePresence = FMAnimatePresence as React.ComponentType<React.PropsWithChildren<{ mode?: "wait" | "sync" }>>;
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import BookingTypeSelector from './BookingTypeSelector';
import {
  BookingFormCommon,
  ApartmentRentalForm,
  ApartmentViewingForm,
  ServiceBookingForm,
  CarRentalForm,
  HotelBookingForm,
  AppointmentForm,
  type CommonFieldsData,
} from './forms';
import type {
  BookingType,
  BookingCreateRequest,
  BookingDetail,
  ApartmentRentalBooking,
  ApartmentViewingBooking,
  ServiceBooking,
  CarRentalBooking,
  HotelBooking,
  AppointmentBooking,
} from '../types';
import { bookingApi } from '../api/bookingsApi';
import { bookingUtils } from '../utils/bookingUtils';

type BookingStep = 'type-selection' | 'details' | 'pricing' | 'review' | 'confirmation';

interface BookingWizardProps {
  listingId?: string;
  onComplete?: (booking: BookingDetail) => void;
  onCancel?: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({
  listingId,
  onComplete,
  onCancel,
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<BookingStep>('type-selection');
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);

  // Common fields
  const [commonData, setCommonData] = useState<CommonFieldsData>({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  // Type-specific data
  const [typeSpecificData, setTypeSpecificData] = useState<any>({});

  // Pricing
  const [pricing, setPricing] = useState({
    base_price: '0.00',
    service_fees: '0.00',
    taxes: '0.00',
    discount: '0.00',
    currency: 'EUR',
  });

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingDetail | null>(null);

  // Steps configuration
  const steps: { id: BookingStep; label: string; number: number }[] = [
    { id: 'type-selection', label: 'Select Type', number: 1 },
    { id: 'details', label: 'Booking Details', number: 2 },
    { id: 'pricing', label: 'Pricing', number: 3 },
    { id: 'review', label: 'Review', number: 4 },
    { id: 'confirmation', label: 'Confirmation', number: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const AnimatePresence = FMAnimatePresence as any;

  // Handlers
  const handleTypeSelect = (type: BookingType) => {
    setSelectedType(type);
    setCurrentStep('details');
  };

  const handleCommonFieldChange = (field: keyof CommonFieldsData, value: any) => {
    setCommonData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeSpecificFieldChange = (field: string, value: any) => {
    setTypeSpecificData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCommonFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate contact name
    if (!commonData.contact_name.trim()) {
      newErrors.contact_name = 'Name is required';
    }

    // Validate phone
    if (!commonData.contact_phone.trim()) {
      newErrors.contact_phone = 'Phone is required';
    } else if (!bookingUtils.isValidPhone(commonData.contact_phone)) {
      newErrors.contact_phone = 'Invalid phone number';
    }

    // Validate email
    if (!commonData.contact_email.trim()) {
      newErrors.contact_email = 'Email is required';
    } else if (!bookingUtils.isValidEmail(commonData.contact_email)) {
      newErrors.contact_email = 'Invalid email address';
    }

    // Validate dates if required
    if (selectedType?.requires_dates) {
      if (!commonData.start_date) {
        newErrors.start_date = 'Start date is required';
      } else if (!bookingUtils.isValidFutureDate(commonData.start_date)) {
        newErrors.start_date = 'Start date must be in the future';
      }

      if (!commonData.end_date) {
        newErrors.end_date = 'End date is required';
      } else if (commonData.start_date && !bookingUtils.isValidDateRange(commonData.start_date, commonData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    // Validate time if required
    if (selectedType?.requires_time_slot && !commonData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    // Validate guests if required
    if (selectedType?.requires_guests && !commonData.guests_count) {
      newErrors.guests_count = 'Number of guests is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePricing = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!bookingUtils.isValidPrice(pricing.base_price)) {
      newErrors.base_price = 'Base price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 'details') {
      if (!validateCommonFields()) {
        return;
      }
      setCurrentStep('pricing');
    } else if (currentStep === 'pricing') {
      if (!validatePricing()) {
        return;
      }
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('type-selection');
    } else if (currentStep === 'pricing') {
      setCurrentStep('details');
    } else if (currentStep === 'review') {
      setCurrentStep('pricing');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Calculate total price
      const total = bookingUtils.calculateTotalPrice(
        parseFloat(pricing.base_price),
        parseFloat(pricing.service_fees),
        parseFloat(pricing.taxes),
        parseFloat(pricing.discount)
      );

      // Build request payload
      const payload: BookingCreateRequest = {
        booking_type: selectedType!.id,
        listing: listingId,
        start_date: commonData.start_date,
        end_date: commonData.end_date,
        start_time: commonData.start_time,
        end_time: commonData.end_time,
        base_price: pricing.base_price,
        service_fees: pricing.service_fees,
        taxes: pricing.taxes,
        discount: pricing.discount,
        total_price: total.toFixed(2),
        currency: pricing.currency,
        contact_name: commonData.contact_name,
        contact_phone: commonData.contact_phone,
        contact_email: commonData.contact_email,
        guests_count: commonData.guests_count,
        special_requests: commonData.special_requests,
        cancellation_policy: 'flexible', // Default policy
        booking_data: typeSpecificData,
      };

      // Create booking
      const booking = await bookingApi.bookings.create(payload);
      setCreatedBooking(booking);
      setCurrentStep('confirmation');

      if (onComplete) {
        onComplete(booking);
      }
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      setSubmitError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render type-specific form
  const renderTypeSpecificForm = () => {
    if (!selectedType) return null;

    const slug = selectedType.slug;

    if (slug === 'apartment-rental') {
      return (
        <AnimatePresence>
          <ApartmentRentalForm
            data={typeSpecificData}
            onChange={handleTypeSpecificFieldChange}
            errors={errors}
          />
        </AnimatePresence>
      );
    } else if (slug === 'apartment-viewing') {
      return (
        <ApartmentViewingForm
          data={typeSpecificData}
          onChange={handleTypeSpecificFieldChange}
          errors={errors}
        />
      );
    } else if (slug === 'service-booking') {
      return (
        <ServiceBookingForm
          data={typeSpecificData}
          onChange={handleTypeSpecificFieldChange}
          errors={errors}
        />
      );
    } else if (slug === 'car-rental') {
      return (
        <CarRentalForm
          data={typeSpecificData}
          onChange={handleTypeSpecificFieldChange}
          errors={errors}
        />
      );
    } else if (slug === 'hotel-booking') {
      return (
        <HotelBookingForm
          data={typeSpecificData}
          onChange={handleTypeSpecificFieldChange}
          errors={errors}
        />
      );
    } else if (slug === 'appointment') {
      return (
        <AppointmentForm
          data={typeSpecificData}
          onChange={handleTypeSpecificFieldChange}
          errors={errors}
        />
      );
    }

    return null;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'type-selection':
        return (
          <BookingTypeSelector
            onSelect={handleTypeSelect}
            selectedType={selectedType || undefined}
            listingId={listingId}
          />
        );

      case 'details':
        return (
          <div className="space-y-8">
            <BookingFormCommon
              bookingType={selectedType!}
              data={commonData}
              onChange={handleCommonFieldChange}
              errors={errors}
            />
            {renderTypeSpecificForm()}
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pricing Details</h2>
              <p className="text-slate-600">Configure booking pricing</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Base Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.base_price}
                    onChange={(e) => setPricing({ ...pricing, base_price: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                      errors.base_price ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.base_price && (
                    <p className="text-sm text-red-500">{errors.base_price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">Service Fees</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.service_fees}
                    onChange={(e) => setPricing({ ...pricing, service_fees: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">Taxes</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.taxes}
                    onChange={(e) => setPricing({ ...pricing, taxes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">Discount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.discount}
                    onChange={(e) => setPricing({ ...pricing, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Price:</span>
                    <span className="text-lime-600">
                      {bookingUtils.formatPrice(
                        bookingUtils.calculateTotalPrice(
                          parseFloat(pricing.base_price) || 0,
                          parseFloat(pricing.service_fees) || 0,
                          parseFloat(pricing.taxes) || 0,
                          parseFloat(pricing.discount) || 0
                        ),
                        pricing.currency
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Booking</h2>
              <p className="text-slate-600">Please review all details before submitting</p>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Booking Type</h4>
                  <p className="text-slate-600">{selectedType?.name}</p>
                </div>

                {commonData.start_date && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Dates</h4>
                    <p className="text-slate-600">
                      {bookingUtils.formatDate(commonData.start_date)} - {bookingUtils.formatDate(commonData.end_date || commonData.start_date)}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Contact Information</h4>
                  <p className="text-slate-600">{commonData.contact_name}</p>
                  <p className="text-slate-600">{commonData.contact_phone}</p>
                  <p className="text-slate-600">{commonData.contact_email}</p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Pricing</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>{bookingUtils.formatPrice(pricing.base_price, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fees:</span>
                      <span>{bookingUtils.formatPrice(pricing.service_fees, pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span>{bookingUtils.formatPrice(pricing.taxes, pricing.currency)}</span>
                    </div>
                    {parseFloat(pricing.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{bookingUtils.formatPrice(pricing.discount, pricing.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-lime-600">
                        {bookingUtils.formatPrice(
                          bookingUtils.calculateTotalPrice(
                            parseFloat(pricing.base_price) || 0,
                            parseFloat(pricing.service_fees) || 0,
                            parseFloat(pricing.taxes) || 0,
                            parseFloat(pricing.discount) || 0
                          ),
                          pricing.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'confirmation':
        return (
          <div className="text-center space-y-6 max-w-2xl mx-auto py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MotionDiv
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <span className="text-5xl">✓</span>
              </MotionDiv>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Booking Confirmed!</h2>
            <p className="text-lg text-slate-600">
              Your booking has been successfully created.
            </p>

            {createdBooking && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3 text-left">
                    <div>
                      <span className="text-sm text-slate-500">Reference Number:</span>
                      <p className="text-lg font-semibold text-lime-600">
                        {createdBooking.reference_number}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">Status:</span>
                      <p className="text-slate-900">{createdBooking.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4">
              <Button
                onClick={() => window.location.href = '/dashboard/bookings'}
                className="bg-lime-600 hover:bg-lime-700"
              >
                View My Bookings
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.slice(0, -1).map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-lime-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 transition-colors ${
                        index < currentStepIndex ? 'bg-lime-600' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <MotionDiv
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </MotionDiv>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep !== 'type-selection' && currentStep !== 'confirmation' && (
          <div className="flex justify-between mt-8 max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>

            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-lime-600 hover:bg-lime-700"
              >
                {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-lime-600 hover:bg-lime-700"
              >
                Next
              </Button>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && currentStep !== 'confirmation' && (
          <div className="text-center mt-4">
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700 text-sm"
              disabled={isSubmitting}
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
