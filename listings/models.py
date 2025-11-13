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
    is_featured_category = models.BooleanField(default=False, help_text="Featured on homepage")
    display_order = models.PositiveIntegerField(default=0, help_text="Order for display")

    icon = models.CharField(max_length=100, blank=True, help_text="Frontend icon name (Lucide or custom icon reference)")
    color = models.CharField(max_length=50, default="#6CC24A", help_text="Category theme color")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    """Optional subcategories (Apartment, SUV, Laptop, etc.)"""

    id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Category, related_name="subcategories", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("category", "slug")
        ordering = ["name"]
        verbose_name = "Sub Category"
        verbose_name_plural = "Sub Categories"

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
    slug = models.SlugField(max_length=64, unique=True, help_text="Public storefront handle", default="")
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    verified = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    total_listings = models.PositiveIntegerField(default=0)
    ai_agent_enabled = models.BooleanField(default=True)
    logo_url = models.URLField(blank=True, null=True)
    storefront_published = models.BooleanField(default=True)
    storefront_config = models.JSONField(default=dict, blank=True, help_text="Theme, hero, socials, hours, policy links")

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
    
    Ownership model: All listings have an owner (User). Optional seller_profile
    for business sellers. The constraint ensures seller_profile.user == owner.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings",
                              help_text="Always required. User who created/owns this listing")

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="listings", null=True, blank=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.PROTECT, related_name="listings", null=True, blank=True)

    # Domain slug (optional, aligns with top-level Category slug)
    domain = models.SlugField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Top-level domain slug, e.g. 'real-estate', 'vehicles', 'services'"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="EUR")
    location = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    dynamic_fields = models.JSONField(default=dict, blank=True, help_text="Flexible metadata based on category schema")

    LISTING_KIND_CHOICES = [
        ("offer", "Offer"),
        ("request", "Request"),
    ]
    listing_kind = models.CharField(max_length=20, choices=LISTING_KIND_CHOICES, default="offer")

    TRANSACTION_TYPE_CHOICES = [
        ("sale", "For Sale"),
        ("rent_short", "Short-Term Rent"),
        ("rent_long", "Long-Term Rent"),
        ("booking", "Bookable"),
        ("project", "Project/Off-plan"),
    ]
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default="sale")

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
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['category', 'location', 'status']),
            models.Index(fields=['status', 'is_featured', '-created_at']),
            models.Index(fields=['price']),
        ]



    def __str__(self):
        return f"{self.title} ({self.category.name if self.category else 'Unknown'})"


# --------------------------------------------------------------------
# BOOKING MODEL (shared for bookable listings)
# --------------------------------------------------------------------

# DEPRECATED: Booking moved to bookings.models.Booking
# This was consolidated to use the unified booking model from the bookings app.
# See DJANGO_DIAGNOSTIC_REPORT.md for details on the consolidation.


# --------------------------------------------------------------------
# IMAGES
# --------------------------------------------------------------------

class ListingImage(models.Model):
    """Attach multiple images to a listing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listing_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Listing Image"
        verbose_name_plural = "Listing Images"

    def __str__(self):
        return f"Image for {self.listing.title}"


# --------------------------------------------------------------------
# DOMAIN DETAIL MODELS (OneToOne → Listing)
# --------------------------------------------------------------------


class CarListing(models.Model):
    """Domain-specific details for vehicle listings."""
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name="car",
        primary_key=True,
    )

    is_for_sale = models.BooleanField(default=False)
    is_for_rent = models.BooleanField(default=False)

    VEHICLE_TYPE_CHOICES = [
        ("car", "Car"),
        ("suv", "SUV"),
        ("van", "Van"),
        ("truck", "Truck"),
        ("motorcycle", "Motorcycle"),
        ("other", "Other"),
    ]
    vehicle_type = models.CharField(max_length=30, choices=VEHICLE_TYPE_CHOICES, default="car")

    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    mileage_km = models.PositiveIntegerField(null=True, blank=True)
    transmission = models.CharField(max_length=20, choices=[("manual", "Manual"), ("automatic", "Automatic")], default="automatic")
    fuel_type = models.CharField(max_length=20, choices=[("petrol", "Petrol"), ("diesel", "Diesel"), ("electric", "Electric"), ("hybrid", "Hybrid"), ("other", "Other")], default="petrol")

    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rental_price_per_day = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rental_price_per_month = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ServiceListing(models.Model):
    """Domain-specific details for services and appointments."""
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name="service",
        primary_key=True,
    )

    # Optional fine-grained service type
    service_subcategory = models.ForeignKey(
        SubCategory,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="service_listings",
    )

    PRICING_MODEL_CHOICES = [
        ("fixed", "Fixed Price"),
        ("per_hour", "Per Hour"),
        ("per_session", "Per Session"),
        ("quote", "Quote Based"),
    ]
    pricing_model = models.CharField(max_length=20, choices=PRICING_MODEL_CHOICES, default="per_hour")
    base_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    supports_online = models.BooleanField(default=False)
    supports_on_site = models.BooleanField(default=True)
    max_group_size = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class EventListing(models.Model):
    """Domain-specific details for events and activities."""
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name="event",
        primary_key=True,
    )

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    venue_name = models.CharField(max_length=255, blank=True)
    max_capacity = models.PositiveIntegerField(null=True, blank=True)

    has_tickets = models.BooleanField(default=True)
    base_ticket_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ProductListing(models.Model):
    """Domain-specific details for products/P2P goods."""
    listing = models.OneToOneField(
        Listing,
        on_delete=models.CASCADE,
        related_name="product",
        primary_key=True,
    )

    brand = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    stock_quantity = models.PositiveIntegerField(default=1)
    is_new = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
