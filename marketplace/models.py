"""
Marketplace models for unified multi-domain seller and listing management.
"""
from django.db import models
from django.conf import settings
import uuid


class SellerProfile(models.Model):
    """
    Unified seller profile for all marketplace categories.
    Links users to their business presence across multiple domains.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_profile'
    )
    business_name = models.CharField(max_length=255)
    categories = models.JSONField(
        default=list,
        help_text='List of categories this seller operates in, e.g. ["real_estate", "vehicles"]'
    )
    verified = models.BooleanField(
        default=False,
        help_text='Whether this seller has been verified by admins'
    )
    rating = models.FloatField(
        default=0.0,
        help_text='Average rating from 0.0 to 5.0'
    )
    total_listings = models.PositiveIntegerField(
        default=0,
        help_text='Total number of active listings across all categories'
    )
    ai_agent_enabled = models.BooleanField(
        default=True,
        help_text='Whether AI agent can auto-respond to buyer requests'
    )

    # Contact information
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    # Metadata
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['verified', '-rating']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.business_name} ({self.user.username})"

    def increment_listing_count(self):
        """Increment total listings counter"""
        self.total_listings += 1
        self.save(update_fields=['total_listings'])

    def decrement_listing_count(self):
        """Decrement total listings counter"""
        if self.total_listings > 0:
            self.total_listings -= 1
            self.save(update_fields=['total_listings'])

    def update_rating(self, new_rating):
        """Update seller rating (simplified - in production use weighted average)"""
        self.rating = new_rating
        self.save(update_fields=['rating'])


class GenericListing(models.Model):
    """
    General-purpose listing model for vehicles, events, services, activities, etc.
    Uses JSON metadata for category-specific fields to maintain flexibility.
    """

    CATEGORY_CHOICES = [
        ('marketplace', 'Marketplace'),
        ('vehicles', 'Vehicles'),
        ('services', 'Services'),
        ('events', 'Events'),
        ('activities', 'Activities'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Verification'),
        ('sold', 'Sold/Completed'),
    ]

    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='listings'
    )

    # Basic information
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES)

    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Price in specified currency'
    )
    currency = models.CharField(max_length=10, default='EUR')

    # Location
    location = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Media
    image_url = models.URLField(blank=True, null=True)

    # Dynamic fields for category-specific data
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Category-specific fields stored as JSON'
    )

    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['location']),
        ]
        verbose_name = 'Generic Listing'
        verbose_name_plural = 'Generic Listings'

    def __str__(self):
        return f"{self.category}: {self.title}"

    def increment_views(self):
        """Increment view counter"""
        self.views_count += 1
        self.save(update_fields=['views_count'])

    @property
    def price_display(self):
        """Format price for display"""
        if self.price:
            return f"{self.currency} {self.price:,.2f}"
        return "Price not set"

    def save(self, *args, **kwargs):
        """Override save to update seller listing count"""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            self.seller.increment_listing_count()

    def delete(self, *args, **kwargs):
        """Override delete to update seller listing count"""
        seller = self.seller
        super().delete(*args, **kwargs)
        seller.decrement_listing_count()


class ListingImage(models.Model):
    """
    Multiple images for a listing.
    """
    listing = models.ForeignKey(
        GenericListing,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField()
    caption = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-uploaded_at']

    def __str__(self):
        return f"Image for {self.listing.title}"
