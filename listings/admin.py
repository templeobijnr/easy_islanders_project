from django.contrib import admin
from .models import Category, Subcategory, Listing, Image

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
