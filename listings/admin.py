from django.contrib import admin
from .models import Category, SubCategory, Listing, ListingImage, SellerProfile

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_bookable', 'is_active', 'is_featured_category')
    list_editable = ('is_bookable', 'is_active', 'is_featured_category')
    list_filter = ('is_bookable', 'is_active', 'is_featured_category')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category')
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

@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ('listing', 'image', 'uploaded_at')
    list_filter = ('listing',)


# Booking admin is now registered in bookings/admin.py


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


