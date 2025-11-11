import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _


# --------------------------------------------------------------------
# CATEGORY SYSTEM
# --------------------------------------------------------------------

class Category(models.Model):
    """
    A top-level category (Real Estate, Vehicles, Services, Electronics, etc.)
    Each category defines its own schema via JSON.
    This schema determines what dynamic fields listings will have.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    # JSON schema defines fields rendered on frontend for this category
    # Example:
    # {
    #   "fields": [
    #       {"name": "bedrooms", "type": "number", "label": "Bedrooms"},
    #       {"name": "furnished", "type": "boolean", "label": "Furnished"},
    #       {"name": "rental_type", "type": "select", "choices": ["short_term","long_term"]}
    #   ]
    # }
    schema = models.JSONField(default=dict, blank=True)

    is_bookable = models.BooleanField(default=False, help_text="Whether this category supports booking (e.g. Rentals, Events, Services)")
    is_active = models.BooleanField(default=True)

    icon = models.CharField(max_length=100, blank=True, help_text="Frontend icon name (Lucide or custom icon reference)")
    color = models.CharField(max_length=50, default="#6CC24A", help_text="Category theme color")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    """Optional subcategories (Apartment, SUV, Laptop, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, related_name="subcategories", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("category", "slug")
        ordering = ["name"]

    def __str__(self):
        return f"{self.category.name} → {self.name}"


# --------------------------------------------------------------------
# SELLER PROFILE
# --------------------------------------------------------------------

class SellerProfile(models.Model):
    """Profile for business sellers and verified professionals."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile")

    business_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    total_listings = models.PositiveIntegerField(default=0)
    ai_agent_enabled = models.BooleanField(default=True)
    logo_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


# --------------------------------------------------------------------
# LISTING MODEL (Dynamic Core)
# --------------------------------------------------------------------

class Listing(models.Model):
    """
    Core listing model — one table to rule all categories.
    Dynamic fields are stored as JSON (category-specific).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name="listings", null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="listings", null=True, blank=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.PROTECT, related_name="listings", null=True, blank=True)

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EUR")
    location = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    dynamic_fields = models.JSONField(default=dict, blank=True, help_text="Flexible metadata based on category schema")

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("paused", "Paused"),
        ("sold", "Sold / Completed"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    views = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.category.name})"


# --------------------------------------------------------------------
# BOOKING MODEL (shared for bookable listings)
# --------------------------------------------------------------------

class Booking(models.Model):
    """
    Handles bookings for listings that are marked as bookable.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bookings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")

    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ], default="pending")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} → {self.listing.title}"


# --------------------------------------------------------------------
# IMAGES
# --------------------------------------------------------------------

class ListingImage(models.Model):
    """Attach multiple images to a listing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listing_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.listing.title}"
