"""
Easy Islanders Booking System - DRF Serializers

Serializers for booking API endpoints with comprehensive validation.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    BookingType,
    Booking,
    ApartmentRentalBooking,
    ApartmentViewingBooking,
    ServiceBooking,
    CarRentalBooking,
    HotelBooking,
    AppointmentBooking,
    BookingAvailability,
    BookingHistory,
    BookingReview,
)


# =============================================================================
# BOOKING TYPE SERIALIZERS
# =============================================================================

class BookingTypeSerializer(serializers.ModelSerializer):
    """Serializer for booking types"""
    booking_count = serializers.SerializerMethodField()

    class Meta:
        model = BookingType
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'color',
            'requires_dates', 'requires_time_slot', 'requires_guests',
            'requires_vehicle_info', 'schema', 'is_active',
            'booking_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'booking_count']

    def get_booking_count(self, obj):
        """Get total bookings for this type"""
        return obj.bookings.count()


class BookingTypeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing booking types"""
    class Meta:
        model = BookingType
        fields = ['id', 'name', 'slug', 'icon', 'color', 'is_active']


# =============================================================================
# TYPE-SPECIFIC DETAIL SERIALIZERS
# =============================================================================

class ApartmentRentalDetailSerializer(serializers.ModelSerializer):
    """Serializer for apartment rental booking details"""
    class Meta:
        model = ApartmentRentalBooking
        fields = [
            'number_of_guests', 'number_of_adults', 'number_of_children',
            'number_of_infants', 'pets_allowed', 'bringing_pets', 'pet_details',
            'smoking_allowed', 'check_in_instructions', 'wifi_password',
            'parking_info', 'amenities_requested', 'cleaning_service',
            'cleaning_frequency'
        ]
        extra_kwargs = {
            'wifi_password': {'write_only': True},  # Don't expose in responses
        }


class ApartmentViewingDetailSerializer(serializers.ModelSerializer):
    """Serializer for viewing booking details"""
    class Meta:
        model = ApartmentViewingBooking
        fields = [
            'viewing_date', 'viewing_time', 'viewing_duration_minutes',
            'interested_in_buying', 'interested_in_renting',
            'budget_min', 'budget_max', 'agent_name', 'agent_contact',
            'agent_company', 'viewing_completed', 'feedback_notes'
        ]


class ServiceBookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for service booking details"""
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    provider_name = serializers.CharField(source='service_provider.business_name', read_only=True)

    class Meta:
        model = ServiceBooking
        fields = [
            'service_type', 'service_type_display', 'service_category',
            'service_provider', 'provider_name', 'service_location_address',
            'service_location_access_instructions', 'equipment_needed',
            'estimated_duration_hours', 'service_started_at',
            'service_completed_at', 'service_completed', 'completion_notes'
        ]


class CarRentalDetailSerializer(serializers.ModelSerializer):
    """Serializer for car rental booking details"""
    insurance_display = serializers.CharField(source='get_insurance_selected_display', read_only=True)
    fuel_policy_display = serializers.CharField(source='get_fuel_policy_display', read_only=True)

    class Meta:
        model = CarRentalBooking
        fields = [
            'vehicle', 'pickup_location', 'dropoff_location',
            'pickup_datetime', 'dropoff_datetime', 'driver_license_number',
            'driver_age', 'driver_country', 'insurance_selected',
            'insurance_display', 'additional_drivers', 'additional_driver_names',
            'fuel_policy', 'fuel_policy_display', 'mileage_limit',
            'gps_requested', 'child_seat_requested', 'number_of_child_seats',
            'fuel_level_pickup', 'fuel_level_return', 'mileage_at_pickup',
            'mileage_at_return'
        ]
        extra_kwargs = {
            'driver_license_number': {'write_only': True},  # Sensitive data
        }


class HotelBookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for hotel booking details"""
    meal_plan_display = serializers.CharField(source='get_meal_plan_display', read_only=True)

    class Meta:
        model = HotelBooking
        fields = [
            'hotel', 'room_type', 'number_of_rooms', 'number_of_guests',
            'meal_plan', 'meal_plan_display', 'smoking_preference',
            'floor_preference', 'bed_type', 'early_checkin_requested',
            'late_checkout_requested', 'airport_transfer_requested'
        ]


class AppointmentDetailSerializer(serializers.ModelSerializer):
    """Serializer for appointment booking details"""
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    provider_name = serializers.CharField(source='service_provider.business_name', read_only=True)

    class Meta:
        model = AppointmentBooking
        fields = [
            'service_provider', 'provider_name', 'appointment_type',
            'appointment_type_display', 'duration_minutes', 'recurring',
            'recurrence_pattern', 'recurrence_end_date', 'appointment_notes',
            'reminder_sent', 'reminder_sent_at', 'no_show', 'rescheduled_from'
        ]


# =============================================================================
# MAIN BOOKING SERIALIZERS
# =============================================================================

class BookingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing bookings"""
    booking_type_name = serializers.CharField(source='booking_type.name', read_only=True)
    booking_type_icon = serializers.CharField(source='booking_type.icon', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'reference_number', 'booking_type', 'booking_type_name',
            'booking_type_icon', 'listing', 'listing_title', 'status',
            'status_display', 'payment_status', 'payment_status_display',
            'start_date', 'end_date', 'total_price', 'currency',
            'duration_days', 'is_active', 'created_at'
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for booking details"""
    booking_type_name = serializers.CharField(source='booking_type.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    cancellation_policy_display = serializers.CharField(source='get_cancellation_policy_display', read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)

    # Type-specific details (dynamic)
    apartment_rental = ApartmentRentalDetailSerializer(read_only=True)
    viewing = ApartmentViewingDetailSerializer(read_only=True)
    service = ServiceBookingDetailSerializer(read_only=True)
    car_rental = CarRentalDetailSerializer(read_only=True)
    hotel = HotelBookingDetailSerializer(read_only=True)
    appointment = AppointmentDetailSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'reference_number', 'booking_type', 'booking_type_name',
            'user', 'user_username', 'listing', 'listing_title',
            'status', 'status_display', 'start_date', 'end_date',
            'check_in_time', 'check_out_time', 'base_price', 'service_fees',
            'taxes', 'discount', 'total_price', 'currency', 'contact_name',
            'contact_phone', 'contact_email', 'special_requests',
            'guests_count', 'booking_data', 'cancellation_policy',
            'cancellation_policy_display', 'cancelled_at', 'cancelled_by',
            'cancellation_reason', 'payment_status', 'payment_status_display',
            'payment_method', 'paid_amount', 'payment_date',
            'duration_days', 'is_active', 'can_cancel',
            'created_at', 'updated_at', 'confirmed_at', 'completed_at',
            # Type-specific details
            'apartment_rental', 'viewing', 'service', 'car_rental',
            'hotel', 'appointment'
        ]
        read_only_fields = [
            'id', 'reference_number', 'user', 'cancelled_at',
            'cancelled_by', 'confirmed_at', 'completed_at',
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate booking data"""
        # Validate date range
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })

        # Validate start date is in future (for new bookings)
        if not self.instance and start_date:
            if start_date < timezone.now():
                raise serializers.ValidationError({
                    'start_date': 'Start date must be in the future.'
                })

        # Validate price components
        base_price = data.get('base_price', 0)
        if base_price <= 0:
            raise serializers.ValidationError({
                'base_price': 'Base price must be greater than 0.'
            })

        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new bookings"""

    class Meta:
        model = Booking
        fields = [
            'booking_type', 'listing', 'start_date', 'end_date',
            'check_in_time', 'check_out_time', 'base_price',
            'service_fees', 'taxes', 'discount', 'total_price',
            'currency', 'contact_name', 'contact_phone',
            'contact_email', 'special_requests', 'guests_count',
            'booking_data', 'cancellation_policy'
        ]

    def validate(self, data):
        """Validate booking creation"""
        # Check availability
        listing = data.get('listing')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if listing and start_date:
            # Check if dates are available
            if end_date:
                # Check date range availability
                unavailable_dates = BookingAvailability.objects.filter(
                    listing=listing,
                    date__gte=start_date.date(),
                    date__lte=end_date.date(),
                    is_available=False
                )
                if unavailable_dates.exists():
                    raise serializers.ValidationError({
                        'start_date': 'Selected dates are not available.'
                    })
            else:
                # Check single date availability
                availability = BookingAvailability.objects.filter(
                    listing=listing,
                    date=start_date.date()
                ).first()

                if availability and not availability.is_available:
                    raise serializers.ValidationError({
                        'start_date': 'Selected date is not available.'
                    })

        # Validate dates
        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date.'
                })

        # Must be future booking
        if start_date < timezone.now():
            raise serializers.ValidationError({
                'start_date': 'Booking must be for a future date.'
            })

        return data

    def create(self, validated_data):
        """Create booking with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# =============================================================================
# SUPPORTING MODEL SERIALIZERS
# =============================================================================

class BookingAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for booking availability"""
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    provider_name = serializers.CharField(source='service_provider.business_name', read_only=True)

    class Meta:
        model = BookingAvailability
        fields = [
            'id', 'listing', 'listing_title', 'service_provider',
            'provider_name', 'date', 'start_time', 'end_time',
            'is_available', 'max_bookings', 'current_bookings',
            'blocked_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_bookings', 'created_at', 'updated_at']


class BookingHistorySerializer(serializers.ModelSerializer):
    """Serializer for booking history"""
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)

    class Meta:
        model = BookingHistory
        fields = [
            'id', 'booking', 'changed_by', 'changed_by_username',
            'change_type', 'change_type_display', 'old_values',
            'new_values', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BookingReviewSerializer(serializers.ModelSerializer):
    """Serializer for booking reviews"""
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    booking_reference = serializers.CharField(source='booking.reference_number', read_only=True)
    average_detailed_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = BookingReview
        fields = [
            'id', 'booking', 'booking_reference', 'reviewer',
            'reviewer_username', 'rating', 'review_text',
            'cleanliness_rating', 'communication_rating', 'value_rating',
            'location_rating', 'average_detailed_rating', 'response',
            'response_date', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'reviewer', 'response', 'response_date',
            'is_verified', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate review creation"""
        # Must be booking owner
        booking = data.get('booking')
        request = self.context.get('request')

        if booking.user != request.user:
            raise serializers.ValidationError({
                'booking': 'You can only review your own bookings.'
            })

        # Booking must be completed
        if booking.status != 'completed':
            raise serializers.ValidationError({
                'booking': 'You can only review completed bookings.'
            })

        # Can't review twice
        if hasattr(booking, 'review'):
            raise serializers.ValidationError({
                'booking': 'This booking has already been reviewed.'
            })

        return data

    def create(self, validated_data):
        """Create review with reviewer from request"""
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class BookingReviewResponseSerializer(serializers.Serializer):
    """Serializer for seller response to review"""
    response = serializers.CharField(required=True, max_length=2000)

    def update(self, instance, validated_data):
        """Add seller response to review"""
        instance.response = validated_data['response']
        instance.response_date = timezone.now()
        instance.save()
        return instance


# =============================================================================
# ACTION SERIALIZERS
# =============================================================================

class BookingConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a booking"""
    notes = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        """Confirm the booking"""
        instance.confirm()
        return instance


class BookingCancelSerializer(serializers.Serializer):
    """Serializer for cancelling a booking"""
    reason = serializers.CharField(required=True, max_length=1000)

    def validate(self, data):
        """Validate cancellation"""
        booking = self.instance

        if booking.status in ['cancelled', 'completed']:
            raise serializers.ValidationError(
                f'Cannot cancel a booking that is already {booking.status}.'
            )

        if not booking.can_cancel:
            raise serializers.ValidationError(
                'This booking cannot be cancelled based on the cancellation policy.'
            )

        return data

    def update(self, instance, validated_data):
        """Cancel the booking"""
        instance.cancel(
            user=self.context['request'].user,
            reason=validated_data['reason']
        )
        return instance


class BookingCompleteSerializer(serializers.Serializer):
    """Serializer for completing a booking"""
    completion_notes = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        """Complete the booking"""
        instance.complete()
        if validated_data.get('completion_notes'):
            instance.internal_notes = validated_data['completion_notes']
            instance.save()
        return instance


# =============================================================================
# AVAILABILITY CHECK SERIALIZER
# =============================================================================

class AvailabilityCheckSerializer(serializers.Serializer):
    """Serializer for checking availability"""
    listing_id = serializers.UUIDField(required=False)
    service_provider_id = serializers.UUIDField(required=False)
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=False)

    def validate(self, data):
        """Validate availability check request"""
        if not data.get('listing_id') and not data.get('service_provider_id'):
            raise serializers.ValidationError(
                'Either listing_id or service_provider_id must be provided.'
            )

        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if end_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })

        return data
