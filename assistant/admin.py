from locale import currency
from django.contrib import admin
from .models import (
    DemandLead, ServiceProvider, ServiceFeature, KnowledgeBase, LinkSource,
    Request, AgentBroadcast, AgentBroadcastV2, FeatureFlag, Conversation,
    Message, ContactIndex, UserProfile, ConversationThread, ApproveBroadcast,
    FailedTask, PreferenceExtractionEvent
)

# ============================================================================
# INLINE ADMINS
# ============================================================================

class ServiceFeatureInline(admin.TabularInline):
    """
    Allows editing features directly within the ServiceProvider admin page.
    """
    model = ServiceFeature
    extra = 3


class LinkSourceInline(admin.TabularInline):
    """Inline for knowledge base sources."""
    model = LinkSource
    extra = 1


class AgentBroadcastInline(admin.TabularInline):
    """Inline for demand lead broadcasts."""
    model = AgentBroadcast
    extra = 0
    readonly_fields = ['created_at', 'updated_at']
    fields = ['seller_id', 'medium', 'status', 'sent_at']


class AgentBroadcastV2Inline(admin.TabularInline):
    """Inline for request broadcasts V2."""
    model = AgentBroadcastV2
    extra = 0
    readonly_fields = ['created_at', 'updated_at']
    fields = ['seller_id', 'medium', 'status', 'sent_at']


# ============================================================================
# MAIN ADMIN CLASSES
# ============================================================================

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


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'language', 'updated_at']
    list_filter = ['language', 'category']
    search_fields = ['title', 'content']
    inlines = [LinkSourceInline]


@admin.register(LinkSource)
class LinkSourceAdmin(admin.ModelAdmin):
    list_display = ['url', 'title', 'kb_article']
    search_fields = ['url', 'title']


@admin.register(DemandLead)
class DemandLeadAdmin(admin.ModelAdmin):
    list_display = ('contact_info', 'category', 'location', 'status', 'intent_type', 'created_at')
    list_filter = ('category', 'status', 'intent_type', 'created_at')
    search_fields = ('contact_info', 'description')
    readonly_fields = ('created_at', 'id')
    inlines = [AgentBroadcastInline]

    fieldsets = (
        ('Lead Information', {
            'fields': ('id', 'contact_info', 'category', 'location', 'description')
        }),
        ('User & Status', {
            'fields': ('user', 'status', 'intent_type')
        }),
        ('Source Information', {
            'fields': ('source_provider', 'source_id', 'source_url', 'author_name'),
            'classes': ('collapse',)
        }),
        ('Processing', {
            'fields': ('is_processed', 'extracted_criteria', 'sellers_contacted', 'handle_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_by', 'category', 'location', 'status', 'created_at')
    list_filter = ('category', 'status', 'created_at')
    search_fields = ('contact', 'subcategory')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [AgentBroadcastV2Inline]

    fieldsets = (
        ('Request Information', {
            'fields': ('id', 'created_by', 'category', 'subcategory', 'location')
        }),
        ('Budget & Attributes', {
            'fields': ('budget_amount', 'budget_currency', 'attributes'),
            'classes': ('collapse',)
        }),
        ('Contact & Status', {
            'fields': ('contact', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(AgentBroadcast)
class AgentBroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'seller_id', 'medium', 'status', 'sent_at')
    list_filter = ('status', 'medium', 'created_at')
    search_fields = ('request__contact_info', 'seller_id')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(AgentBroadcastV2)
class AgentBroadcastV2Admin(admin.ModelAdmin):
    list_display = ('id', 'request', 'seller_id', 'medium', 'status', 'sent_at')
    list_filter = ('status', 'medium', 'created_at')
    search_fields = ('request__contact', 'seller_id')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('name', 'enabled', 'updated_at')
    list_filter = ('enabled', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'language', 'started_at', 'last_message_at')
    list_filter = ('language', 'started_at', 'last_message_at')
    search_fields = ('user__username',)
    readonly_fields = ('id', 'last_message_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_id', 'sender', 'type', 'created_at')
    list_filter = ('type', 'created_at', 'is_unread')
    search_fields = ('conversation_id', 'content')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(ContactIndex)
class ContactIndexAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'contact_phone', 'contact_email', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('contact_email', 'contact_phone', 'listing__title')
    readonly_fields = ('id', 'created_at')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'location', 'preferred_language', 'created_at')
    list_filter = ('preferred_language', 'theme_preference', 'created_at')
    search_fields = ('user__username', 'user__email', 'location')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(ConversationThread)
class ConversationThreadAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'thread_id', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'thread_id')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(ApproveBroadcast)
class ApproveBroadcastAdmin(admin.ModelAdmin):
    list_display = ('id', 'reviewer', 'status', 'target_seller_count', 'approved_at', 'created_at')
    list_filter = ('status', 'approved_at', 'created_at')
    search_fields = ('demand_lead__contact_info', 'request_fk__contact')
    readonly_fields = ('id', 'created_at', 'approved_at', 'rejected_at')


@admin.register(FailedTask)
class FailedTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'task_name', 'failed_at', 'resolved')
    list_filter = ('task_name', 'resolved', 'failed_at')
    search_fields = ('task_name', 'exception')
    readonly_fields = ('id', 'failed_at', 'retried_at')


@admin.register(PreferenceExtractionEvent)
class PreferenceExtractionEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'extraction_method', 'created_at', 'processing_time_ms')
    list_filter = ('extraction_method', 'created_at')
    search_fields = ('user__username', 'thread_id')
    readonly_fields = ('id', 'created_at')

        



