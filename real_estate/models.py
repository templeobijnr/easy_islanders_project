"""
Real Estate models with explicit tenure support.

Tenure Types:
- short_term: Nightly rentals (per_night pricing, availability calendar)
- long_term: Monthly rentals (per_month pricing, move-in dates)
"""
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator


class Listing(models.Model):
    """
    Property listing with tenure-aware pricing and availability.

    Indexes:
    - Composite: (tenure, city, bedrooms, price_amount) for main search query
    - Individual: external_id, tenure, price_amount, bedrooms, city
    """

    TENURE_CHOICES = [
        ("short_term", "Short Term (Nightly)"),
        ("long_term", "Long Term (Monthly)"),
    ]

    PRICE_UNIT_CHOICES = [
        ("per_night", "Per Night"),
        ("per_month", "Per Month"),
    ]

    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("villa", "Villa"),
        ("studio", "Studio"),
        ("house", "House"),
        ("penthouse", "Penthouse"),
    ]

    # Identity
    external_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="External ID (e.g., 'prop-001')"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")

    # Tenure (CRITICAL FIELD)
    tenure = models.CharField(
        max_length=16,
        choices=TENURE_CHOICES,
        db_index=True,
        help_text="Rental mode: short_term (nightly) or long_term (monthly)"
    )

    # Pricing
    price_amount = models.IntegerField(
        validators=[MinValueValidator(0)],
        db_index=True,
        help_text="Price in smallest currency unit (e.g., £120 = 120)"
    )
    price_unit = models.CharField(
        max_length=16,
        choices=PRICE_UNIT_CHOICES,
        db_index=True,
        help_text="per_night or per_month"
    )
    currency = models.CharField(
        max_length=3,
        default="GBP",
        help_text="ISO 4217 currency code"
    )

    # Property specifications
    bedrooms = models.IntegerField(
        default=1,
        db_index=True,
        validators=[MinValueValidator(1)],
        help_text="Number of bedrooms"
    )
    bathrooms = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Number of bathrooms"
    )
    max_guests = models.IntegerField(
        default=2,
        validators=[MinValueValidator(1)],
        help_text="Maximum occupancy (relevant for short-term)"
    )
    property_type = models.CharField(
        max_length=32,
        choices=PROPERTY_TYPE_CHOICES,
        default="apartment",
        db_index=True,
        help_text="Type of property"
    )
    square_meters = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Property size in square meters"
    )

    # Amenities (PostgreSQL ArrayField)
    amenities = ArrayField(
        models.CharField(max_length=32),
        default=list,
        blank=True,
        help_text="List of amenities: wifi, pool, parking, air_conditioning, etc."
    )

    # Location
    city = models.CharField(
        max_length=64,
        db_index=True,
        help_text="City (e.g., 'Kyrenia', 'Famagusta')"
    )
    area = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="Neighborhood or area (optional)"
    )
    address = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Full address (optional, for display only)"
    )

    # Tenure-specific requirements
    min_stay_nights = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Minimum stay for short-term rentals (nights)"
    )
    min_lease_months = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Minimum lease duration for long-term rentals (months)"
    )
    available_from = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Earliest move-in date for long-term rentals (ISO 8601)"
    )

    # Media
    image_url = models.URLField(
        blank=True,
        default="",
        help_text="Primary image URL"
    )
    additional_images = ArrayField(
        models.URLField(),
        default=list,
        blank=True,
        help_text="Additional image URLs"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether listing is currently active"
    )

    class Meta:
        indexes = [
            # Composite index for main search query
            models.Index(
                fields=['tenure', 'city', 'bedrooms', 'price_amount'],
                name='re_main_search_idx'
            ),
            # Composite index for long-term move-in queries
            models.Index(
                fields=['tenure', 'available_from', 'city'],
                name='re_movein_idx'
            ),
        ]
        ordering = ['price_amount', 'title']
        verbose_name = "Real Estate Listing"
        verbose_name_plural = "Real Estate Listings"

    def __str__(self):
        return f"{self.title} ({self.tenure}, {self.city}, {self.currency}{self.price_amount}/{self.price_unit})"

    def get_photos(self):
        """Return list of all photo URLs."""
        photos = []
        if self.image_url:
            photos.append(self.image_url)
        photos.extend(self.additional_images)
        return photos

    def is_available_for_move_in(self, move_in_date):
        """Check if listing is available for given move-in date (long-term only)."""
        if self.tenure != "long_term":
            return False
        if not self.available_from:
            return True  # Available immediately
        return self.available_from <= move_in_date


class Availability(models.Model):
    """
    Nightly availability calendar for short-term rentals.

    Long-term rentals use available_from field on Listing instead.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="availability_calendar",
        limit_choices_to={'tenure': 'short_term'},
        help_text="Short-term listing this availability belongs to"
    )
    date = models.DateField(
        db_index=True,
        help_text="Date (ISO 8601: YYYY-MM-DD)"
    )
    is_available = models.BooleanField(
        default=True,
        help_text="Whether the property is available on this date"
    )
    price_override = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Optional price override for this specific date (e.g., peak season)"
    )

    class Meta:
        unique_together = [['listing', 'date']]
        indexes = [
            models.Index(
                fields=['listing', 'date', 'is_available'],
                name='re_avail_lookup_idx'
            ),
        ]
        ordering = ['date']
        verbose_name = "Availability"
        verbose_name_plural = "Availability Calendar"

    def __str__(self):
        status = "Available" if self.is_available else "Booked"
        return f"{self.listing.external_id} on {self.date}: {status}"

    def get_effective_price(self):
        """Return effective price for this date (override or listing price)."""
        if self.price_override is not None:
            return self.price_override
        return self.listing.price_amount
