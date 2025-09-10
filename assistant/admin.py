from locale import currency
from django.contrib import admin
from .models import DemandLead, UserRequest, ServiceProvider, ServiceFeature, Booking, KnowledgeBase, LinkSource, Listing
# Register your models here.
class ServiceFeatureInline(admin.TabularInline):
  """
  Allos editing features directly within the ServiceProvider admin page.
  """
  model = ServiceFeature
  extra = 3 # Provides 3 empty slots for new features


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
  list_display = ['name', 'category', 'location', 'rating', 'is_active', 'is_featured']
  list_filter = ['category', 'location', 'is_active', 'is_featured']
  search_fields = ['name', 'description']
  inlines = [ServiceFeatureInline]

  fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'location', 'rating', 'price_range')
        }),
        ('Content (Multilingual)', {
            'fields': ('description', 'description_ru', 'description_pl', 'description_de')
        }),
        ('Links & Media', {
            'fields': ('website', 'booking_url', 'image_url')
        }),
        ('Contact', {
            'fields': ('contact_phone', 'contact_email')
        }),
        ('Settings', {
            'fields': ('is_active', 'is_featured')
        }),
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
  list_display = ['id', 'listing', 'user', 'preferred_date', 'preferred_time', 'status', 'created_at']
  list_filter = ['status', 'preferred_date', 'listing__listing_type']
  search_fields = ['id', 'user__username', 'listing__title', 'contact_phone']
  readonly_fields = ['id', 'created_at', 'updated_at', 'confirmed_at']

  fieldsets = (
        ('Booking Details', {
            'fields': ('id', 'listing', 'user', 'status')
        }),
        ('Viewing Information', {
            'fields': ('preferred_date', 'preferred_time', 'message')
        }),
        ('Contact Information', {
            'fields': ('contact_phone', 'contact_email')
        }),
        ('Agent Response', {
            'fields': ('agent_response', 'agent_available_times', 'agent_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at')
        }),
    )

@admin.register(UserRequest)
class UserRequestAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'request_type', 'status', 'preferred_language', 'created_at']
    list_filter = ['request_type', 'status', 'preferred_language', 'created_at']
    search_fields = ['name', 'phone_number', 'message']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'updated_at']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'keywords']

@admin.register(LinkSource)
class LinkSourceAdmin(admin.ModelAdmin):
    list_display = ['url', 'category', 'language', 'is_active', 'last_ingested']
    list_filter = ['category', 'language', 'is_active']
    search_fields = ['url']


@admin.register(DemandLead)
class DemandLeadAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'source_provider', 'status', 'posted_at', 'is_processed')
    list_filter = ('source_provider', 'status', 'is_processed', 'posted_at')
    search_fields = ('author_name', 'raw_content', 'structured_lead')
    readonly_fields = ('created_at', 'updated_at', 'posted_at', 'source_id', 'source_url', 'author_profile_url')

    # Reordering fields for better workflow in the admin panel
    fieldsets = (
        ('Lead Status & Management', {
            'fields':('status','is_processed')
        }),
        ('Structured Data (AI Processed)', {
            'description': 'This is the clean, structured data extracted by the AI from the raw post.', 'fields':('structured_lead',)
        }),
        ('Source Information (from Webhook)', {
            'description': 'This is the original, raw data received from the external source',
            'fields': ('source_provider', 'author_name', 'raw_content', 'keywords_detected', 'posted_at', 'source_url', 'source_id'),
            'classes': ('collapse',) # This section will be collapsed by default to keep the view clean

        })
    )

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('get_title', 'listing_type', 'location', 'price_with_currency', 'source_name', 'last_seen_at', 'is_active')
    list_filter = ('source_name', 'listing_type', 'location', 'is_active','currency')
    search_fields = ('raw_text', 'structured_data__title', 'structured_data__location') # Allows searching inside the JSON field
    readonly_fields = ('created_at', 'last_seen_at', 'source_id', 'source_url')

    fieldsets = (
        ('Listing Status', {
            'fields': ('is_active',)
        }),
        ('Key Information (Extracted by AI)',{
        'description': "These are the most important fields, promoted from the structured JSON data for fast searching. ",
        'fields': ('listing_type', 'location', 'price', 'currency')
        }),
        ('Structured Data (Full JSON)', {
            'description': "This is the complete, clean JSON object created by the AI from the raw post.",
            'fields':('structured_data',)
        }),
        ('Source Information', {
            'description': "Original, raw data from the scraper.",
            'fields': ('source_name', 'raw_text', 'source_url', 'source_id'),
            'classes': ('collapse',) # Collapse this section by default
        }),
    )

    @admin.display(description='Title')
    def get_title(self, obj):
        """
        A helper function to safely get the title from the structured_data JSON field for display.
        """
        if obj.structured_data and 'title' in obj.structured_data:
            return obj.structured_data['title']
        return "Untitled Listing"

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

        



