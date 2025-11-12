"""
Easy Islanders - Multi-Category Booking System Models

Supports:
- Short-term apartment rentals
- Apartment viewings
- Services (cleaning, repairs, maintenance)
- Car rentals
- Hotel bookings
- Appointments (hair, consultation, medical, etc.)
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class BookingType(models.Model):
    """
    Defines different types of bookings available in the system.
    Extensible design allows easy addition of new booking types.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, help_text="Display name (e.g., 'Apartment Rental')")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Lucide icon name")
    color = models.CharField(max_length=50, default="#6CC24A", help_text="Brand color for this type")

    # Booking type capabilities
    requires_dates = models.BooleanField(default=True, help_text="Requires start/end dates")
    requires_time_slot = models.BooleanField(default=False, help_text="Requires specific time slots")
    requires_guests = models.BooleanField(default=True, help_text="Requires guest count")
    requires_vehicle_info = models.BooleanField(default=False, help_text="Requires vehicle/driver info")

    # Schema for type-specific fields (flexible metadata)
    schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON schema defining type-specific form fields"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Booking Type"
        verbose_name_plural = "Booking Types"

    def __str__(self):
        return self.name


class Booking(models.Model):
    """
    Enhanced base booking model with comprehensive fields for all booking types.
    Polymorphic design: type-specific details are in related models.
    """

    # Status choices
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('pending', _('Pending Confirmation')),
        ('confirmed', _('Confirmed')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', _('Unpaid')),
        ('partial', _('Partially Paid')),
        ('paid', _('Paid in Full')),
        ('refunded', _('Refunded')),
    ]

    CANCELLATION_POLICY_CHOICES = [
        ('flexible', _('Flexible: Full refund up to 24h before')),
        ('moderate', _('Moderate: 50% refund up to 5 days before')),
        ('strict', _('Strict: 50% refund up to 30 days before')),
        ('non_refundable', _('Non-refundable')),
    ]

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Auto-generated booking reference (e.g., BK-2024-0001)"
    )
    booking_type = models.ForeignKey(
        BookingType,
        on_delete=models.PROTECT,
        related_name='bookings'
    )

    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='bookings',
        null=True,
        blank=True,
        help_text="Listing being booked (nullable for appointments)"
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Dates & Timing
    start_date = models.DateTimeField(help_text="Booking start date/time")
    end_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Booking end date/time (nullable for appointments)"
    )
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)

    # Pricing
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    service_fees = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    taxes = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(max_length=10, default='EUR')

    # Contact & Communication
    contact_name = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=50)
    contact_email = models.EmailField()
    special_requests = models.TextField(blank=True, help_text="Customer special requests")
    internal_notes = models.TextField(blank=True, help_text="Internal staff notes (not visible to customer)")

    # Guest Information
    guests_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        help_text="Total number of guests"
    )

    # Flexible metadata for booking type-specific data
    booking_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Type-specific flexible data (amenities, preferences, etc.)"
    )

    # Cancellation
    cancellation_policy = models.CharField(
        max_length=20,
        choices=CANCELLATION_POLICY_CHOICES,
        default='flexible'
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_bookings'
    )
    cancellation_reason = models.TextField(blank=True)

    # Payment
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='unpaid'
    )
    payment_method = models.CharField(max_length=50, blank=True)
    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    payment_date = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['listing', 'start_date', 'end_date']),
            models.Index(fields=['booking_type', 'status']),
            models.Index(fields=['reference_number']),
        ]
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"

    def __str__(self):
        return f"{self.reference_number} - {self.booking_type.name} ({self.status})"

    def save(self, *args, **kwargs):
        # Auto-generate reference number on first save
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()

        # Auto-calculate total price if not set
        if not self.total_price or self.total_price == 0:
            self.calculate_total()

        super().save(*args, **kwargs)

    def generate_reference_number(self):
        """Generate unique booking reference number"""
        from datetime import datetime
        year = datetime.now().year
        # Get count of bookings this year
        count = Booking.objects.filter(
            reference_number__startswith=f'BK-{year}'
        ).count() + 1
        return f'BK-{year}-{count:05d}'

    def calculate_total(self):
        """Calculate total price from components"""
        self.total_price = (
            self.base_price +
            self.service_fees +
            self.taxes -
            self.discount
        )
        return self.total_price

    @property
    def duration_days(self):
        """Calculate booking duration in days"""
        if self.end_date:
            return (self.end_date - self.start_date).days
        return 0

    @property
    def is_active(self):
        """Check if booking is currently active"""
        now = timezone.now()
        return (
            self.status in ['confirmed', 'in_progress'] and
            self.start_date <= now <= (self.end_date or now)
        )

    @property
    def can_cancel(self):
        """Check if booking can be cancelled based on policy"""
        if self.status in ['cancelled', 'completed']:
            return False

        now = timezone.now()
        hours_until_start = (self.start_date - now).total_seconds() / 3600

        if self.cancellation_policy == 'flexible':
            return hours_until_start >= 24
        elif self.cancellation_policy == 'moderate':
            return hours_until_start >= 120  # 5 days
        elif self.cancellation_policy == 'strict':
            return hours_until_start >= 720  # 30 days
        else:  # non_refundable
            return False

    def confirm(self):
        """Confirm the booking"""
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()

    def cancel(self, user, reason=''):
        """Cancel the booking"""
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.cancelled_by = user
        self.cancellation_reason = reason
        self.save()

    def complete(self):
        """Mark booking as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


# ============================================================================
# BOOKING TYPE-SPECIFIC MODELS
# ============================================================================

class ApartmentRentalBooking(models.Model):
    """Extended fields for apartment/property rentals"""
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='apartment_rental'
    )

    # Guest details
    number_of_guests = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    number_of_adults = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    number_of_children = models.PositiveIntegerField(default=0)
    number_of_infants = models.PositiveIntegerField(default=0)

    # Property preferences
    pets_allowed = models.BooleanField(default=False)
    bringing_pets = models.BooleanField(default=False)
    pet_details = models.TextField(blank=True)
    smoking_allowed = models.BooleanField(default=False)

    # Access information
    check_in_instructions = models.TextField(blank=True)
    wifi_password = models.CharField(max_length=100, blank=True)
    parking_info = models.TextField(blank=True)

    # Amenities requested/included
    amenities_requested = models.JSONField(
        default=list,
        blank=True,
        help_text="List of requested amenities"
    )

    # Additional services
    cleaning_service = models.BooleanField(default=False)
    cleaning_frequency = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name = "Apartment Rental Booking"
        verbose_name_plural = "Apartment Rental Bookings"

    def __str__(self):
        return f"Apartment Rental - {self.booking.reference_number}"


class ApartmentViewingBooking(models.Model):
    """Extended fields for property viewings"""
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='viewing'
    )

    viewing_date = models.DateField()
    viewing_time = models.TimeField()
    viewing_duration_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Duration in minutes"
    )

    # Buyer/renter intent
    interested_in_buying = models.BooleanField(default=False)
    interested_in_renting = models.BooleanField(default=False)
    budget_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Agent information
    agent_name = models.CharField(max_length=255, blank=True)
    agent_contact = models.CharField(max_length=50, blank=True)
    agent_company = models.CharField(max_length=255, blank=True)

    # Viewing outcome
    viewing_completed = models.BooleanField(default=False)
    feedback_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Viewing Booking"
        verbose_name_plural = "Viewing Bookings"

    def __str__(self):
        return f"Viewing - {self.booking.reference_number}"


class ServiceBooking(models.Model):
    """Extended fields for service bookings (cleaning, repairs, etc.)"""

    SERVICE_TYPE_CHOICES = [
        ('cleaning', _('Cleaning')),
        ('repair', _('Repair')),
        ('maintenance', _('Maintenance')),
        ('plumbing', _('Plumbing')),
        ('electrical', _('Electrical')),
        ('painting', _('Painting')),
        ('gardening', _('Gardening')),
        ('moving', _('Moving')),
        ('other', _('Other')),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='service'
    )

    service_type = models.CharField(max_length=50, choices=SERVICE_TYPE_CHOICES)
    service_category = models.ForeignKey(
        'listings.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    service_provider = models.ForeignKey(
        'users.BusinessProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='service_bookings'
    )

    # Location details
    service_location_address = models.CharField(max_length=500)
    service_location_access_instructions = models.TextField(blank=True)

    # Service details
    equipment_needed = models.JSONField(
        default=list,
        blank=True,
        help_text="List of equipment provider should bring"
    )
    estimated_duration_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Service completion
    service_started_at = models.DateTimeField(null=True, blank=True)
    service_completed_at = models.DateTimeField(null=True, blank=True)
    service_completed = models.BooleanField(default=False)
    completion_notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Service Booking"
        verbose_name_plural = "Service Bookings"

    def __str__(self):
        return f"Service ({self.get_service_type_display()}) - {self.booking.reference_number}"


class CarRentalBooking(models.Model):
    """Extended fields for car/vehicle rentals"""

    INSURANCE_CHOICES = [
        ('basic', _('Basic Coverage')),
        ('standard', _('Standard Coverage')),
        ('premium', _('Premium Full Coverage')),
    ]

    FUEL_POLICY_CHOICES = [
        ('full_to_full', _('Full to Full')),
        ('same_to_same', _('Same to Same')),
        ('prepaid', _('Prepaid Fuel')),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='car_rental'
    )

    vehicle = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='car_rental_bookings'
    )

    # Pickup & Dropoff
    pickup_location = models.CharField(max_length=500)
    dropoff_location = models.CharField(max_length=500)
    pickup_datetime = models.DateTimeField()
    dropoff_datetime = models.DateTimeField()

    # Driver information (encrypted in production)
    driver_license_number = models.CharField(max_length=100)
    driver_age = models.PositiveIntegerField(validators=[MinValueValidator(18), MaxValueValidator(100)])
    driver_country = models.CharField(max_length=100, blank=True)

    # Insurance & Coverage
    insurance_selected = models.CharField(max_length=20, choices=INSURANCE_CHOICES)
    additional_drivers = models.PositiveIntegerField(default=0)
    additional_driver_names = models.TextField(blank=True)

    # Fuel & Mileage
    fuel_policy = models.CharField(max_length=20, choices=FUEL_POLICY_CHOICES, default='full_to_full')
    mileage_limit = models.PositiveIntegerField(
        help_text="Km per day limit (0 for unlimited)",
        default=200
    )

    # Add-ons
    gps_requested = models.BooleanField(default=False)
    child_seat_requested = models.BooleanField(default=False)
    number_of_child_seats = models.PositiveIntegerField(default=0)

    # Return condition
    fuel_level_pickup = models.CharField(max_length=20, blank=True)
    fuel_level_return = models.CharField(max_length=20, blank=True)
    mileage_at_pickup = models.PositiveIntegerField(null=True, blank=True)
    mileage_at_return = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Car Rental Booking"
        verbose_name_plural = "Car Rental Bookings"

    def __str__(self):
        return f"Car Rental - {self.booking.reference_number}"


class HotelBooking(models.Model):
    """Extended fields for hotel/accommodation bookings"""

    MEAL_PLAN_CHOICES = [
        ('none', _('No Meals')),
        ('breakfast', _('Breakfast Only')),
        ('half_board', _('Half Board (Breakfast + Dinner)')),
        ('full_board', _('Full Board (All Meals)')),
        ('all_inclusive', _('All Inclusive')),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='hotel'
    )

    hotel = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='hotel_bookings'
    )

    # Room details
    room_type = models.CharField(max_length=100)
    number_of_rooms = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    number_of_guests = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # Meal plan
    meal_plan = models.CharField(max_length=20, choices=MEAL_PLAN_CHOICES, default='none')

    # Preferences
    smoking_preference = models.CharField(
        max_length=20,
        choices=[('non_smoking', 'Non-Smoking'), ('smoking', 'Smoking')],
        default='non_smoking'
    )
    floor_preference = models.CharField(max_length=50, blank=True)
    bed_type = models.CharField(max_length=50, blank=True)  # king, queen, twin, etc.

    # Special requests
    early_checkin_requested = models.BooleanField(default=False)
    late_checkout_requested = models.BooleanField(default=False)
    airport_transfer_requested = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Hotel Booking"
        verbose_name_plural = "Hotel Bookings"

    def __str__(self):
        return f"Hotel - {self.booking.reference_number}"


class AppointmentBooking(models.Model):
    """Extended fields for appointment bookings (hair, medical, consultation, etc.)"""

    APPOINTMENT_TYPE_CHOICES = [
        ('hair', _('Hair Salon')),
        ('beauty', _('Beauty/Spa')),
        ('medical', _('Medical')),
        ('dental', _('Dental')),
        ('consultation', _('Consultation')),
        ('fitness', _('Fitness/Training')),
        ('legal', _('Legal')),
        ('financial', _('Financial')),
        ('other', _('Other')),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='appointment'
    )

    service_provider = models.ForeignKey(
        'users.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='appointments'
    )

    appointment_type = models.CharField(max_length=50, choices=APPOINTMENT_TYPE_CHOICES)
    duration_minutes = models.PositiveIntegerField(default=30)

    # Recurring appointments
    recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=50,
        blank=True,
        help_text="daily, weekly, monthly, etc."
    )
    recurrence_end_date = models.DateField(null=True, blank=True)

    # Notes
    appointment_notes = models.TextField(blank=True)

    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    # Attendance
    no_show = models.BooleanField(default=False)
    rescheduled_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_appointments'
    )

    class Meta:
        verbose_name = "Appointment Booking"
        verbose_name_plural = "Appointment Bookings"

    def __str__(self):
        return f"Appointment ({self.get_appointment_type_display()}) - {self.booking.reference_number}"


# ============================================================================
# SUPPORTING MODELS
# ============================================================================

class BookingAvailability(models.Model):
    """Manages availability for listings and service providers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='availabilities',
        null=True,
        blank=True
    )
    service_provider = models.ForeignKey(
        'users.BusinessProfile',
        on_delete=models.CASCADE,
        related_name='availabilities',
        null=True,
        blank=True
    )

    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    is_available = models.BooleanField(default=True)
    max_bookings = models.PositiveIntegerField(default=1)
    current_bookings = models.PositiveIntegerField(default=0)

    blocked_reason = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['listing', 'service_provider', 'date', 'start_time']
        indexes = [
            models.Index(fields=['listing', 'date']),
            models.Index(fields=['service_provider', 'date']),
        ]
        verbose_name = "Booking Availability"
        verbose_name_plural = "Booking Availabilities"

    def __str__(self):
        if self.listing:
            return f"{self.listing.title} - {self.date}"
        return f"{self.service_provider.business_name} - {self.date}"


class BookingHistory(models.Model):
    """Audit trail for booking changes"""

    CHANGE_TYPE_CHOICES = [
        ('created', _('Created')),
        ('updated', _('Updated')),
        ('confirmed', _('Confirmed')),
        ('cancelled', _('Cancelled')),
        ('completed', _('Completed')),
        ('payment_received', _('Payment Received')),
        ('refunded', _('Refunded')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    change_type = models.CharField(max_length=50, choices=CHANGE_TYPE_CHOICES)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Booking History"
        verbose_name_plural = "Booking Histories"

    def __str__(self):
        return f"{self.booking.reference_number} - {self.get_change_type_display()}"


class BookingReview(models.Model):
    """Customer reviews for completed bookings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Overall rating
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Overall rating (1-5 stars)"
    )
    review_text = models.TextField()

    # Detailed ratings
    cleanliness_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    communication_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    value_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    location_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )

    # Seller response
    response = models.TextField(blank=True, help_text="Seller response to review")
    response_date = models.DateTimeField(null=True, blank=True)

    # Verification
    is_verified = models.BooleanField(default=False, help_text="Verified booking review")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Booking Review"
        verbose_name_plural = "Booking Reviews"

    def __str__(self):
        return f"Review for {self.booking.reference_number} - {self.rating}⭐"

    @property
    def average_detailed_rating(self):
        """Calculate average of detailed ratings"""
        ratings = [
            r for r in [
                self.cleanliness_rating,
                self.communication_rating,
                self.value_rating,
                self.location_rating
            ] if r is not None
        ]
        return sum(ratings) / len(ratings) if ratings else self.rating
