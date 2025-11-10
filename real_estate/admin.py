from django.contrib import admin
from .models import Listing, ShortTermBlock


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'city', 'district', 'bedrooms', 'bathrooms', 'rent_type', 'monthly_price', 'nightly_price', 'created_at')
    list_filter = ('rent_type', 'city', 'bedrooms', 'property_type', 'created_at')
    search_fields = ('title', 'description', 'city', 'district', 'agency_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Location', {
            'fields': ('city', 'district', 'lat', 'lng')
        }),
        ('Property Details', {
            'fields': ('bedrooms', 'bathrooms', 'property_type')
        }),
        ('Rental Configuration', {
            'fields': ('rent_type', 'currency')
        }),
        ('Long-term Pricing', {
            'fields': ('monthly_price', 'available_from', 'min_term_months', 'deposit'),
            'classes': ('collapse',)
        }),
        ('Short-term Pricing', {
            'fields': ('nightly_price', 'min_nights'),
            'classes': ('collapse',)
        }),
        ('Amenities & Images', {
            'fields': ('amenities', 'images'),
            'classes': ('collapse',)
        }),
        ('Agency & Quality', {
            'fields': ('agency_name', 'rating'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ShortTermBlock)
class ShortTermBlockAdmin(admin.ModelAdmin):
    list_display = ('listing', 'start_date', 'end_date')
    list_filter = ('start_date', 'end_date')
    search_fields = ('listing__title',)
    ordering = ('start_date',)
    raw_id_fields = ('listing',)
