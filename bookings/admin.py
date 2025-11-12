"""
Easy Islanders Booking System - Django Admin Interface

Admin panels for managing bookings, booking types, availability, and reviews.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
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
# INLINE ADMINS
# =============================================================================

class BookingHistoryInline(admin.TabularInline):
    """Inline display of booking history"""
    model = BookingHistory
    extra = 0
    readonly_fields = ['change_type', 'changed_by', 'old_values', 'new_values', 'notes', 'created_at']
    fields = ['created_at', 'change_type', 'changed_by', 'notes']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class ApartmentRentalInline(admin.StackedInline):
    """Inline for apartment rental details"""
    model = ApartmentRentalBooking
    extra = 0
    fieldsets = (
        ('Guest Information', {
            'fields': ('number_of_guests', 'number_of_adults', 'number_of_children', 'number_of_infants')
        }),
        ('Preferences', {
            'fields': ('pets_allowed', 'bringing_pets', 'pet_details', 'smoking_allowed')
        }),
        ('Access & Amenities', {
            'fields': ('check_in_instructions', 'wifi_password', 'parking_info', 'amenities_requested')
        }),
        ('Services', {
            'fields': ('cleaning_service', 'cleaning_frequency')
        }),
    )


class ViewingInline(admin.StackedInline):
    """Inline for viewing details"""
    model = ApartmentViewingBooking
    extra = 0


class ServiceInline(admin.StackedInline):
    """Inline for service booking details"""
    model = ServiceBooking
    extra = 0


class CarRentalInline(admin.StackedInline):
    """Inline for car rental details"""
    model = CarRentalBooking
    extra = 0


class HotelInline(admin.StackedInline):
    """Inline for hotel booking details"""
    model = HotelBooking
    extra = 0


class AppointmentInline(admin.StackedInline):
    """Inline for appointment details"""
    model = AppointmentBooking
    extra = 0


# =============================================================================
# MAIN ADMIN CLASSES
# =============================================================================

@admin.register(BookingType)
class BookingTypeAdmin(admin.ModelAdmin):
    """Admin for booking types"""
    list_display = [
        'name',
        'slug',
        'colored_icon',
        'requires_dates',
        'requires_time_slot',
        'requires_guests',
        'is_active',
        'booking_count'
    ]
    list_filter = ['is_active', 'requires_dates', 'requires_time_slot', 'requires_guests']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'icon', 'color')
        }),
        ('Capabilities', {
            'fields': ('requires_dates', 'requires_time_slot', 'requires_guests', 'requires_vehicle_info')
        }),
        ('Schema', {
            'fields': ('schema',),
            'classes': ('collapse',),
            'description': 'JSON schema for type-specific form fields'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def colored_icon(self, obj):
        """Display icon with color"""
        return format_html(
            '<span style="color: {};">● {}</span>',
            obj.color,
            obj.icon or 'no icon'
        )
    colored_icon.short_description = 'Icon'

    def booking_count(self, obj):
        """Count of bookings for this type"""
        count = obj.bookings.count()
        url = reverse('admin:bookings_booking_changelist') + f'?booking_type__id__exact={obj.id}'
        return format_html('<a href="{}">{} bookings</a>', url, count)
    booking_count.short_description = 'Bookings'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin for bookings with comprehensive features"""
    list_display = [
        'reference_number',
        'booking_type',
        'user_link',
        'listing_link',
        'start_date',
        'end_date',
        'colored_status',
        'total_price_display',
        'payment_status_badge',
        'created_at',
    ]
    list_filter = [
        'status',
        'payment_status',
        'booking_type',
        'cancellation_policy',
        'created_at',
        'start_date',
    ]
    search_fields = [
        'reference_number',
        'user__username',
        'user__email',
        'contact_name',
        'contact_email',
        'contact_phone',
    ]
    readonly_fields = [
        'id',
        'reference_number',
        'created_at',
        'updated_at',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
        'duration_days',
        'is_active_status',
        'can_cancel_status',
    ]
    date_hierarchy = 'start_date'
    actions = ['confirm_bookings', 'cancel_bookings', 'mark_completed']

    fieldsets = (
        ('Booking Information', {
            'fields': ('reference_number', 'booking_type', 'user', 'listing', 'status')
        }),
        ('Dates & Timing', {
            'fields': ('start_date', 'end_date', 'check_in_time', 'check_out_time', 'duration_days')
        }),
        ('Pricing', {
            'fields': ('base_price', 'service_fees', 'taxes', 'discount', 'total_price', 'currency')
        }),
        ('Contact Information', {
            'fields': ('contact_name', 'contact_phone', 'contact_email')
        }),
        ('Guest & Booking Details', {
            'fields': ('guests_count', 'special_requests', 'booking_data'),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': ('cancellation_policy', 'can_cancel_status', 'cancelled_at', 'cancelled_by', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Payment', {
            'fields': ('payment_status', 'payment_method', 'paid_amount', 'payment_date')
        }),
        ('Internal Notes', {
            'fields': ('internal_notes',),
            'classes': ('collapse',)
        }),
        ('Status & Timestamps', {
            'fields': ('is_active_status', 'created_at', 'updated_at', 'confirmed_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('System', {
            'fields': ('id',),
            'classes': ('collapse',)
        }),
    )

    inlines = [BookingHistoryInline]

    def get_inlines(self, request, obj):
        """Dynamically add type-specific inlines"""
        inlines = [BookingHistoryInline]

        if obj:
            if obj.booking_type.slug == 'apartment-rental':
                inlines.append(ApartmentRentalInline)
            elif obj.booking_type.slug == 'viewing':
                inlines.append(ViewingInline)
            elif obj.booking_type.slug == 'service':
                inlines.append(ServiceInline)
            elif obj.booking_type.slug == 'car-rental':
                inlines.append(CarRentalInline)
            elif obj.booking_type.slug == 'hotel':
                inlines.append(HotelInline)
            elif obj.booking_type.slug == 'appointment':
                inlines.append(AppointmentInline)

        return inlines

    def user_link(self, obj):
        """Link to user admin"""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'

    def listing_link(self, obj):
        """Link to listing admin"""
        if obj.listing:
            url = reverse('admin:listings_listing_change', args=[obj.listing.id])
            return format_html('<a href="{}">{}</a>', url, obj.listing.title[:30])
        return '-'
    listing_link.short_description = 'Listing'

    def colored_status(self, obj):
        """Display status with color coding"""
        colors = {
            'draft': '#9CA3AF',
            'pending': '#F59E0B',
            'confirmed': '#10B981',
            'in_progress': '#3B82F6',
            'completed': '#6B7280',
            'cancelled': '#EF4444',
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">● {}</span>',
            colors.get(obj.status, '#000'),
            obj.get_status_display()
        )
    colored_status.short_description = 'Status'

    def total_price_display(self, obj):
        """Display formatted total price"""
        return f'{obj.currency} {obj.total_price:,.2f}'
    total_price_display.short_description = 'Total Price'

    def payment_status_badge(self, obj):
        """Display payment status as badge"""
        colors = {
            'unpaid': '#EF4444',
            'partial': '#F59E0B',
            'paid': '#10B981',
            'refunded': '#6B7280',
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            colors.get(obj.payment_status, '#000'),
            obj.get_payment_status_display().upper()
        )
    payment_status_badge.short_description = 'Payment'

    def duration_days(self, obj):
        """Display booking duration"""
        if obj.end_date:
            days = obj.duration_days
            return f'{days} day{"s" if days != 1 else ""}'
        return 'Single date'
    duration_days.short_description = 'Duration'

    def is_active_status(self, obj):
        """Display if booking is currently active"""
        return '✓' if obj.is_active else '✗'
    is_active_status.short_description = 'Active Now'
    is_active_status.boolean = True

    def can_cancel_status(self, obj):
        """Display if booking can be cancelled"""
        return '✓' if obj.can_cancel else '✗'
    can_cancel_status.short_description = 'Can Cancel'
    can_cancel_status.boolean = True

    # Admin actions
    def confirm_bookings(self, request, queryset):
        """Bulk confirm bookings"""
        count = 0
        for booking in queryset.filter(status='pending'):
            booking.confirm()
            count += 1
        self.message_user(request, f'{count} booking(s) confirmed.')
    confirm_bookings.short_description = 'Confirm selected bookings'

    def cancel_bookings(self, request, queryset):
        """Bulk cancel bookings"""
        count = 0
        for booking in queryset.exclude(status__in=['cancelled', 'completed']):
            booking.cancel(request.user, reason='Cancelled by admin')
            count += 1
        self.message_user(request, f'{count} booking(s) cancelled.')
    cancel_bookings.short_description = 'Cancel selected bookings'

    def mark_completed(self, request, queryset):
        """Mark bookings as completed"""
        count = queryset.filter(status='in_progress').update(
            status='completed',
            completed_at=timezone.now()
        )
        self.message_user(request, f'{count} booking(s) marked as completed.')
    mark_completed.short_description = 'Mark as completed'


@admin.register(BookingAvailability)
class BookingAvailabilityAdmin(admin.ModelAdmin):
    """Admin for booking availability"""
    list_display = [
        'date',
        'listing_link',
        'service_provider_link',
        'time_slot',
        'availability_status',
        'bookings_ratio',
    ]
    list_filter = ['is_available', 'date']
    search_fields = ['listing__title', 'service_provider__business_name', 'blocked_reason']
    date_hierarchy = 'date'
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Availability For', {
            'fields': ('listing', 'service_provider')
        }),
        ('Date & Time', {
            'fields': ('date', 'start_time', 'end_time')
        }),
        ('Availability', {
            'fields': ('is_available', 'max_bookings', 'current_bookings', 'blocked_reason')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def listing_link(self, obj):
        """Link to listing"""
        if obj.listing:
            url = reverse('admin:listings_listing_change', args=[obj.listing.id])
            return format_html('<a href="{}">{}</a>', url, obj.listing.title[:30])
        return '-'
    listing_link.short_description = 'Listing'

    def service_provider_link(self, obj):
        """Link to service provider"""
        if obj.service_provider:
            url = reverse('admin:users_businessprofile_change', args=[obj.service_provider.id])
            return format_html('<a href="{}">{}</a>', url, obj.service_provider.business_name)
        return '-'
    service_provider_link.short_description = 'Provider'

    def time_slot(self, obj):
        """Display time slot"""
        if obj.start_time and obj.end_time:
            return f'{obj.start_time.strftime("%H:%M")} - {obj.end_time.strftime("%H:%M")}'
        return 'All day'
    time_slot.short_description = 'Time Slot'

    def availability_status(self, obj):
        """Display availability with color"""
        if obj.is_available:
            return format_html('<span style="color: #10B981;">● Available</span>')
        return format_html('<span style="color: #EF4444;">● Unavailable</span>')
    availability_status.short_description = 'Status'

    def bookings_ratio(self, obj):
        """Display bookings ratio"""
        return f'{obj.current_bookings}/{obj.max_bookings}'
    bookings_ratio.short_description = 'Bookings'


@admin.register(BookingHistory)
class BookingHistoryAdmin(admin.ModelAdmin):
    """Admin for booking history (read-only)"""
    list_display = ['created_at', 'booking_link', 'change_type', 'changed_by']
    list_filter = ['change_type', 'created_at']
    search_fields = ['booking__reference_number', 'notes']
    readonly_fields = ['booking', 'changed_by', 'change_type', 'old_values', 'new_values', 'notes', 'created_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def booking_link(self, obj):
        """Link to booking"""
        url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
        return format_html('<a href="{}">{}</a>', url, obj.booking.reference_number)
    booking_link.short_description = 'Booking'


@admin.register(BookingReview)
class BookingReviewAdmin(admin.ModelAdmin):
    """Admin for booking reviews"""
    list_display = [
        'booking_link',
        'reviewer_link',
        'rating_stars',
        'average_rating',
        'is_verified',
        'created_at',
        'has_response',
    ]
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['booking__reference_number', 'reviewer__username', 'review_text']
    readonly_fields = ['id', 'booking', 'reviewer', 'created_at', 'updated_at', 'average_detailed_rating']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Review Information', {
            'fields': ('booking', 'reviewer', 'is_verified')
        }),
        ('Ratings', {
            'fields': (
                'rating',
                'cleanliness_rating',
                'communication_rating',
                'value_rating',
                'location_rating',
                'average_detailed_rating'
            )
        }),
        ('Review Content', {
            'fields': ('review_text',)
        }),
        ('Seller Response', {
            'fields': ('response', 'response_date'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def booking_link(self, obj):
        """Link to booking"""
        url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
        return format_html('<a href="{}">{}</a>', url, obj.booking.reference_number)
    booking_link.short_description = 'Booking'

    def reviewer_link(self, obj):
        """Link to reviewer"""
        url = reverse('admin:users_user_change', args=[obj.reviewer.id])
        return format_html('<a href="{}">{}</a>', url, obj.reviewer.username)
    reviewer_link.short_description = 'Reviewer'

    def rating_stars(self, obj):
        """Display rating as stars"""
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        return format_html('<span style="color: #F59E0B; font-size: 16px;">{}</span>', stars)
    rating_stars.short_description = 'Rating'

    def average_rating(self, obj):
        """Display average of detailed ratings"""
        avg = obj.average_detailed_rating
        return f'{avg:.1f}'
    average_rating.short_description = 'Avg Rating'

    def has_response(self, obj):
        """Check if seller has responded"""
        return bool(obj.response)
    has_response.short_description = 'Response'
    has_response.boolean = True
