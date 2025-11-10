from django.contrib import admin
from .models import Category, Subcategory, Listing, Image, Booking, SellerProfile, BuyerRequest, BroadcastMessage

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_featured_category', 'display_order')
    list_editable = ('is_featured_category', 'display_order')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'display_order')
    list_filter = ('category',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'location', 'price_with_currency', 'status', 'is_featured', 'created_at')
    list_filter = ('category', 'status', 'is_featured', 'currency')
    search_fields = ('title', 'description', 'location')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Listing Status', {
            'fields': ('status', 'is_featured')
        }),
        ('Key Information',{
        'fields': ('title', 'category', 'subcategory', 'location', 'price', 'currency')
        }),
        ('Details', {
            'fields': ('description', 'dynamic_fields')
        }),
        ('Ownership', {
            'fields': ('owner',)
        }),
    )

    @admin.display(description='Price')
    def price_with_currency(self, obj):
        """
        Formats the price and currency for a cleaner display in the list views
        """
        if obj.price and obj.currency:
            return f"{obj.price} {obj.currency}"
        elif obj.price:
            return obj.price
        return "N/A"

@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('listing', 'image', 'uploaded_at')
    list_filter = ('listing',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'user', 'booking_type', 'check_in', 'check_out', 'status', 'total_price_display', 'created_at')
    list_filter = ('booking_type', 'status', 'created_at')
    search_fields = ('user__username', 'listing__title', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'duration_days')
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Booking Information', {
            'fields': ('user', 'listing', 'booking_type', 'status')
        }),
        ('Dates', {
            'fields': ('check_in', 'check_out', 'duration_days')
        }),
        ('Payment', {
            'fields': ('total_price', 'currency')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='Total Price')
    def total_price_display(self, obj):
        if obj.total_price and obj.currency:
            return f"{obj.total_price} {obj.currency}"
        return "N/A"


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
            'fields': ('user', 'business_name', 'description')
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


@admin.register(BuyerRequest)
class BuyerRequestAdmin(admin.ModelAdmin):
    """Admin interface for buyer requests"""

    list_display = [
        'id',
        'buyer',
        'category',
        'location',
        'budget_display',
        'is_fulfilled',
        'response_count',
        'created_at',
    ]
    list_filter = ['category', 'is_fulfilled', 'created_at', 'currency']
    search_fields = ['buyer__username', 'buyer__email', 'message', 'location']
    readonly_fields = ['buyer', 'response_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Request Information', {
            'fields': ('buyer', 'category', 'message', 'location')
        }),
        ('Budget', {
            'fields': ('budget', 'currency')
        }),
        ('Status', {
            'fields': ('is_fulfilled', 'response_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='Budget')
    def budget_display(self, obj):
        if obj.budget and obj.currency:
            return f"{obj.budget} {obj.currency}"
        return "N/A"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('buyer', 'category')


@admin.register(BroadcastMessage)
class BroadcastMessageAdmin(admin.ModelAdmin):
    """Admin interface for broadcast messages"""

    list_display = [
        'title',
        'seller',
        'category',
        'status',
        'views_count',
        'response_count',
        'published_at',
        'created_at',
    ]
    list_filter = ['status', 'category', 'created_at', 'published_at']
    search_fields = ['title', 'message', 'seller__business_name']
    readonly_fields = ['seller', 'views_count', 'response_count', 'created_at', 'updated_at', 'published_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Broadcast Information', {
            'fields': ('seller', 'title', 'message', 'category')
        }),
        ('Targeting', {
            'fields': ('target_audience',),
            'description': 'JSON filters for targeting, e.g. {"city": "Kyrenia", "budget_min": 500}'
        }),
        ('Status & Metrics', {
            'fields': ('status', 'views_count', 'response_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('seller', 'category')
