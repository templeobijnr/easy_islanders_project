from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, BusinessProfile, UserPreference


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for extended User model with business support"""
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {'fields': ('user_type', 'phone', 'is_verified')}),
    )
    list_display = ('username', 'email', 'user_type', 'is_verified')
    list_filter = ('user_type', 'is_verified', 'date_joined')
    search_fields = ('username', 'email', 'phone')


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    """Admin interface for business user profiles"""
    list_display = ('business_name', 'user', 'is_verified_by_admin', 'created_at')
    list_filter = ('is_verified_by_admin', 'created_at')
    search_fields = ('business_name', 'user__username')
    readonly_fields = ('created_at', 'updated_at', 'verified_at')
    fieldsets = (
        ('Business Info', {
            'fields': ('user', 'business_name', 'category', 'subcategory', 'description', 'contact_phone', 'website', 'location')
        }),
        ('Verification', {
            'fields': ('is_verified_by_admin', 'verification_notes', 'verified_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for unified user preferences (UI settings + extracted preferences)"""
    list_display = ('user', 'preference_type', 'confidence', 'source', 'created_at')
    list_filter = ('preference_type', 'source', 'confidence', 'created_at')
    search_fields = ('user__username', 'user__email', 'preference_type')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('User', {
            'fields': ('id', 'user')
        }),
        ('Preference Details', {
            'fields': ('preference_type', 'value', 'raw_value')
        }),
        ('Confidence & Source', {
            'fields': ('confidence', 'source', 'use_count', 'last_used_at')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
