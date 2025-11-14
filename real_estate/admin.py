from django.contrib import admin
from .models import (
    Location, PropertyType, FeatureCategory, Feature, TitleDeedType, UtilityType, TaxType,
    Contact, ContactRole,
    Project,
    Property, PropertyFeature, PropertyOwner, PropertyUtilityAccount, PropertyTax,
    ListingType, Listing, RentalDetails, SaleDetails, ProjectListingDetails,
    Tenancy,
    Lead, Client, Deal,
    ListingEvent,
)


# Core Reference Tables
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('country', 'region', 'city', 'area')
    list_filter = ('country', 'region', 'city')
    search_fields = ('city', 'area')


@admin.register(PropertyType)
class PropertyTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label', 'category')
    list_filter = ('category',)
    search_fields = ('code', 'label')


@admin.register(FeatureCategory)
class FeatureCategoryAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('code', 'label', 'category', 'is_required_for_daily_rental')
    list_filter = ('category', 'is_required_for_daily_rental')
    search_fields = ('code', 'label')


@admin.register(TitleDeedType)
class TitleDeedTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')


@admin.register(UtilityType)
class UtilityTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')


@admin.register(TaxType)
class TaxTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')


# People/CRM
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'phone', 'email')
    search_fields = ('first_name', 'last_name', 'phone', 'email')


@admin.register(ContactRole)
class ContactRoleAdmin(admin.ModelAdmin):
    list_display = ('contact', 'role', 'active_from', 'active_to')
    list_filter = ('role', 'active_from')
    search_fields = ('contact__first_name', 'contact__last_name')
    raw_id_fields = ('contact',)


# Projects
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'developer', 'location', 'total_units', 'completion_date_estimate')
    list_filter = ('location__city',)
    search_fields = ('name',)
    raw_id_fields = ('location', 'developer')


# Property
class PropertyFeatureInline(admin.TabularInline):
    model = PropertyFeature
    extra = 1


class PropertyUtilityInline(admin.TabularInline):
    model = PropertyUtilityAccount
    extra = 1


class PropertyTaxInline(admin.TabularInline):
    model = PropertyTax
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('reference_code', 'property_type', 'location', 'room_configuration_label', 'furnished_status', 'title_deed_type')
    list_filter = ('property_type', 'furnished_status', 'title_deed_type', 'location__city')
    search_fields = ('reference_code', 'description')
    raw_id_fields = ('location', 'project')
    inlines = [PropertyFeatureInline, PropertyUtilityInline, PropertyTaxInline]


# Listings
class RentalDetailsInline(admin.StackedInline):
    model = RentalDetails
    extra = 0


class SaleDetailsInline(admin.StackedInline):
    model = SaleDetails
    extra = 0


class ProjectListingDetailsInline(admin.StackedInline):
    model = ProjectListingDetails
    extra = 0


@admin.register(ListingType)
class ListingTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'label')


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('reference_code', 'listing_type', 'status', 'base_price', 'currency', 'price_period', 'available_from', 'created_at')
    list_filter = ('listing_type', 'status', 'currency', 'created_at')
    search_fields = ('reference_code', 'title', 'description')
    raw_id_fields = ('property', 'project')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [RentalDetailsInline, SaleDetailsInline, ProjectListingDetailsInline]


# Tenancies & Deals
@admin.register(Tenancy)
class TenancyAdmin(admin.ModelAdmin):
    list_display = ('property', 'tenant', 'start_date', 'end_date', 'rent_amount', 'status')
    list_filter = ('status', 'start_date', 'end_date')
    raw_id_fields = ('property', 'tenant', 'listing')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('contact', 'source', 'status', 'assigned_agent', 'created_at')
    list_filter = ('status', 'source', 'created_at')
    search_fields = ('contact__first_name', 'contact__last_name', 'notes')
    raw_id_fields = ('contact', 'assigned_agent')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('contact', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('contact__first_name', 'contact__last_name')
    raw_id_fields = ('contact',)


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'deal_type', 'stage', 'agreed_price', 'currency', 'created_at')
    list_filter = ('deal_type', 'stage', 'created_at')
    search_fields = ('client__contact__first_name', 'client__contact__last_name', 'notes')
    raw_id_fields = ('listing', 'property', 'client')


# Analytics
@admin.register(ListingEvent)
class ListingEventAdmin(admin.ModelAdmin):
    list_display = ('listing', 'event_type', 'occurred_at', 'source')
    list_filter = ('event_type', 'occurred_at')
    raw_id_fields = ('listing',)
    readonly_fields = ('occurred_at',)
