"""
Django admin configuration for marketplace models.
"""
from django.contrib import admin
from .models import SellerProfile, GenericListing, ListingImage


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    """Admin interface for seller profiles"""

    list_display = [
        'business_name',
        'user',
        'verified',
        'rating',
        'total_listings',
        'ai_agent_enabled',
        'created_at',
    ]
    list_filter = ['verified', 'ai_agent_enabled', 'created_at']
    search_fields = ['business_name', 'user__username', 'user__email', 'description']
    readonly_fields = ['user', 'total_listings', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'business_name', 'categories', 'description')
        }),
        ('Status & Verification', {
            'fields': ('verified', 'rating', 'total_listings', 'ai_agent_enabled')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website', 'logo_url')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('user')


class ListingImageInline(admin.TabularInline):
    """Inline admin for listing images"""
    model = ListingImage
    extra = 1
    fields = ['image_url', 'caption', 'display_order']


@admin.register(GenericListing)
class GenericListingAdmin(admin.ModelAdmin):
    """Admin interface for generic listings"""

    list_display = [
        'title',
        'category',
        'seller',
        'price_display',
        'location',
        'status',
        'is_featured',
        'views_count',
        'created_at',
    ]
    list_filter = ['category', 'status', 'is_featured', 'created_at']
    search_fields = ['title', 'description', 'location', 'seller__business_name']
    readonly_fields = ['id', 'views_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    inlines = [ListingImageInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'seller', 'title', 'description', 'category')
        }),
        ('Pricing & Location', {
            'fields': ('price', 'currency', 'location', 'latitude', 'longitude')
        }),
        ('Media', {
            'fields': ('image_url',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Status & Visibility', {
            'fields': ('status', 'is_featured', 'views_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('seller', 'seller__user')

    actions = ['mark_as_active', 'mark_as_inactive', 'mark_as_featured']

    @admin.action(description='Mark selected listings as active')
    def mark_as_active(self, request, queryset):
        """Mark listings as active"""
        updated = queryset.update(status='active')
        self.message_user(request, f'{updated} listing(s) marked as active.')

    @admin.action(description='Mark selected listings as inactive')
    def mark_as_inactive(self, request, queryset):
        """Mark listings as inactive"""
        updated = queryset.update(status='inactive')
        self.message_user(request, f'{updated} listing(s) marked as inactive.')

    @admin.action(description='Mark selected listings as featured')
    def mark_as_featured(self, request, queryset):
        """Mark listings as featured"""
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} listing(s) marked as featured.')


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    """Admin interface for listing images"""

    list_display = ['listing', 'caption', 'display_order', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['listing__title', 'caption']
    readonly_fields = ['uploaded_at']

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('listing', 'listing__seller')
