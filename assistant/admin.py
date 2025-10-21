from locale import currency
from django.contrib import admin
from .models import DemandLead, ServiceProvider, ServiceFeature, Booking, KnowledgeBase, LinkSource

# Register your models here.
class ServiceFeatureInline(admin.TabularInline):
    """
    Allows editing features directly within the ServiceProvider admin page.
    """
    model = ServiceFeature
    extra = 3


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ['contact_info', 'location', 'service_type', 'verified', 'created_at']
    list_filter = ['verified', 'created_at']
    search_fields = ['contact_info', 'description']
    inlines = [ServiceFeatureInline]


@admin.register(ServiceFeature)
class ServiceFeatureAdmin(admin.ModelAdmin):
    list_display = ['name_en', 'name_tr', 'provider']
    search_fields = ['name_en']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'listing', 'user', 'preferred_date', 'status', 'created_at']
    list_filter = ['status', 'preferred_date']
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


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'language', 'updated_at']
    list_filter = ['language', 'category']
    search_fields = ['title', 'content']


@admin.register(LinkSource)
class LinkSourceAdmin(admin.ModelAdmin):
    list_display = ['url', 'title', 'kb_article']
    search_fields = ['url', 'title']


@admin.register(DemandLead)
class DemandLeadAdmin(admin.ModelAdmin):
    list_display = ('contact_info', 'category', 'location', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('contact_info', 'description')
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Lead Information', {
            'fields': ('contact_info', 'category', 'location', 'description')
        }),
        ('User', {
            'fields': ('user',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

        



