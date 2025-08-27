from django.contrib import admin
from .models import UserRequest, ServiceProvider, ServiceFeature, Booking, KnowledgeBase, LinkSource
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
  list_display = ['booking_reference', 'service_provider', 'customer_name', 'customer_phone', 'booking_date', 'status']
  list_filter = ['status','booking_date', 'service_provider__category']
  search_fields = ['booking_reference', 'customer_name', 'customer_phone']
  readonly_fields = ['booking_reference', 'created_at', 'updated_at']

  fieldsets = (
        ('Booking Details', {
            'fields': ('booking_reference', 'service_provider', 'status')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_phone', 'customer_email')
        }),
        ('Booking Information', {
            'fields': ('booking_date', 'booking_time', 'number_of_people', 'duration_days', 'total_price')
        }),
        ('Additional', {
            'fields': ('special_requests',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
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



