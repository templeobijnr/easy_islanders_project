from django.db import models
from django.conf import settings
import uuid

# Create your models here.

class Category(models.Model):
    """Product/Service category"""
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    # icon = models.CharField(max_length=50, blank=True, help_text="Icon name for UI display")
    # description = models.TextField(blank=True, help_text="Category description")
    is_featured_category = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['display_order', 'name']
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return self.name


class Subcategory(models.Model):
    """Subcategories within each category"""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    slug = models.SlugField(max_length=100)
    name = models.CharField(max_length=255)
    display_order = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ('category', 'slug')
        ordering = ['display_order', 'name']
        verbose_name_plural = "Subcategories"
    
    def __str__(self):
        return f"{self.category.name} → {self.name}"


class Listing(models.Model):
    """Universal listing model for all product categories"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending_verification', 'Pending Verification'),
        ('sold', 'Sold'),
    ]
    
    PURPOSE_CHOICES = [
        ('sale', 'For Sale'),
        ('rental', 'For Rent'),
        ('both', 'Sale or Rent'),
        ('not_applicable', 'Not Applicable'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings', null=True, blank=True)
    
    # Basic info
    title = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(Subcategory, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Purpose (mainly for real estate)
    # purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='not_applicable')
    
    # Pricing and location
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='EUR')
    location = models.CharField(max_length=255, blank=True)
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    
    # Dynamic fields (stored as JSON for flexibility)
    dynamic_fields = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['owner', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.category.name})" if self.category else self.title


# A new model to store the images for each listing.
class Image(models.Model):
    listing = models.ForeignKey(Listing, related_name='images', on_delete=models.CASCADE)
    # The 'upload_to' path will automatically create folders per listing ID.
    image = models.ImageField(upload_to='listings/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.listing.title} uploaded at {self.uploaded_at.strftime('%Y-%m-%d')}"
