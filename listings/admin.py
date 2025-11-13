from django.contrib import admin
from django.utils.html import format_html
from .models import Category, SubCategory, Listing, ListingImage, SellerProfile, CarListing, ServiceListing, EventListing, ProductListing

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_bookable', 'is_active', 'is_featured_category', 'display_order', 'subcategory_count', 'listing_count', 'color_preview')
    list_editable = ('is_bookable', 'is_active', 'is_featured_category', 'display_order')
    list_filter = ('is_bookable', 'is_active', 'is_featured_category', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order', 'name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'icon', 'color')
        }),
        ('Settings', {
            'fields': ('is_bookable', 'is_active', 'is_featured_category', 'display_order')
        }),
        ('Schema Configuration', {
            'fields': ('schema',),
            'classes': ('collapse',),
            'description': 'JSON schema for dynamic fields. Example: {"fields": [{"name": "bedrooms", "type": "number", "label": "Bedrooms"}]}'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    @admin.display(description='Subcategories')
    def subcategory_count(self, obj):
        count = obj.subcategories.count()
        if count > 0:
            return format_html('<a href="/admin/listings/subcategory/?category__id__exact={}">{} subcategories</a>', obj.id, count)
        return '0 subcategories'
    
    @admin.display(description='Listings')
    def listing_count(self, obj):
        count = obj.listing_set.count()
        if count > 0:
            return format_html('<a href="/admin/listings/listing/?category__id__exact={}">{} listings</a>', obj.id, count)
        return '0 listings'
    
    @admin.display(description='Color')
    def color_preview(self, obj):
        if obj.color:
            return format_html(
                '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 3px;"></div>',
                obj.color
            )
        return '-'

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'display_order', 'listing_count')
    list_editable = ('display_order',)
    list_filter = ('category', 'category__is_bookable')
    search_fields = ('name', 'slug', 'description', 'category__name')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('category__display_order', 'category__name', 'display_order', 'name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'slug', 'description', 'display_order')
        }),
    )
    
    @admin.display(description='Listings')
    def listing_count(self, obj):
        count = obj.listing_set.count()
        if count > 0:
            return format_html('<a href="/admin/listings/listing/?subcategory__id__exact={}">{} listings</a>', obj.id, count)
        return '0 listings'

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'subcategory', 'owner', 'location', 'price_with_currency', 'status', 'is_featured', 'views', 'created_at')
    list_filter = ('category', 'subcategory', 'status', 'is_featured', 'currency', 'created_at')
    search_fields = ('title', 'description', 'location', 'owner__username', 'owner__business_profile__business_name')
    readonly_fields = ('created_at', 'updated_at', 'views')
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = (
        ('Listing Status', {
            'fields': ('status', 'is_featured')
        }),
        ('Key Information', {
            'fields': ('title', 'category', 'subcategory', 'location', 'price', 'currency')
        }),
        ('Details', {
            'fields': ('description', 'dynamic_fields')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Ownership & Stats', {
            'fields': ('owner', 'views')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('category', 'subcategory', 'owner', 'owner__business_profile')

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
    list_display = ('listing', 'image_preview', 'image', 'uploaded_at')
    list_filter = ('uploaded_at', 'listing__category')
    search_fields = ('listing__title',)
    readonly_fields = ('uploaded_at', 'image_preview')
    
    @admin.display(description='Preview')
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return 'No image'


# Booking admin is now registered in bookings/admin.py


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    """Admin interface for seller profiles"""

    list_display = [
        'business_name',
        'slug',
        'user',
        'verified',
        'rating',
        'total_listings',
        'ai_agent_enabled',
        'created_at',
    ]
    list_filter = ['verified', 'ai_agent_enabled', 'storefront_published', 'created_at']
    search_fields = ['business_name', 'slug', 'user__username', 'user__email', 'description']
    readonly_fields = ['user', 'total_listings', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'business_name', 'slug', 'description')
        }),
        ('Status & Verification', {
            'fields': ('verified', 'rating', 'total_listings', 'ai_agent_enabled')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website', 'logo_url')
        }),
        ('Storefront', {
            'fields': ('storefront_published', 'storefront_config')
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
    
    actions = ['mark_as_verified', 'mark_as_unverified']
    
    @admin.action(description='Mark selected profiles as verified')
    def mark_as_verified(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f'{updated} seller profiles marked as verified.')
    
    @admin.action(description='Mark selected profiles as unverified')
    def mark_as_unverified(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f'{updated} seller profiles marked as unverified.')


@admin.register(CarListing)
class CarListingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'vehicle_type', 'make', 'model', 'year', 'is_for_sale', 'is_for_rent', 'updated_at')
    search_fields = ('listing__title', 'make', 'model')
    list_filter = ('vehicle_type', 'is_for_sale', 'is_for_rent', 'year')


@admin.register(ServiceListing)
class ServiceListingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'service_subcategory', 'pricing_model', 'base_price', 'supports_online', 'supports_on_site', 'updated_at')
    search_fields = ('listing__title',)
    list_filter = ('pricing_model', 'supports_online', 'supports_on_site')


@admin.register(EventListing)
class EventListingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'start_datetime', 'end_datetime', 'venue_name', 'max_capacity', 'has_tickets', 'updated_at')
    search_fields = ('listing__title', 'venue_name')
    list_filter = ('has_tickets',)


@admin.register(ProductListing)
class ProductListingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'brand', 'sku', 'stock_quantity', 'is_new', 'updated_at')
    search_fields = ('listing__title', 'brand', 'sku')
    list_filter = ('is_new',)
