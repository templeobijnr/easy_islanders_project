"""
Real Estate models - unified Listing with optional ST/LT fields.

Design: One Listing table supports both short-term (nightly) and long-term (monthly)
rentals. A separate ShortTermBlock table tracks unavailable dates for ST listings.
"""
import uuid
from django.db import models


# NOTE: We intentionally keep real_estate.Listing independent and link it to
# the cross-domain listings.Listing via a nullable OneToOne. This allows
# existing real estate flows to continue while enabling unified dashboards,
# storefronts, and bookings through listings.Listing.


class Listing(models.Model):
    """Property listing supporting short-term, long-term, or both rental types."""

    RENT_CHOICES = (
        ("short_term", "short_term"),
        ("long_term", "long_term"),
        ("both", "both")
    )

    # Identity (UUID primary key for external stability)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic info
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")

    # Location
    city = models.CharField(
        max_length=80,
        db_index=True,
        help_text="City name (e.g., 'Girne', 'Kyrenia', 'Lefkoşa')"
    )
    district = models.CharField(
        max_length=80,
        blank=True,
        default="",
        help_text="District or neighborhood (e.g., 'Karakum', 'Alsancak')"
    )
    lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Latitude (WGS84)"
    )
    lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Longitude (WGS84)"
    )

    # Property specs
    bedrooms = models.IntegerField(db_index=True)
    bathrooms = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=1.0,
        help_text="Number of bathrooms (supports .5 for half-bath)"
    )
    property_type = models.CharField(
        max_length=40,
        default="apartment",
        help_text="apartment, villa, studio, house, penthouse"
    )

    # Rental type (CRITICAL: determines which price fields apply)
    rent_type = models.CharField(
        max_length=10,
        choices=RENT_CHOICES,
        default="both",
        db_index=True,
        help_text="short_term (nightly), long_term (monthly), or both"
    )

    # Currency (applies to both ST and LT prices)
    currency = models.CharField(
        max_length=3,
        default="GBP",
        help_text="ISO 4217: GBP, EUR, USD, TRY"
    )

    # Long-term pricing and requirements
    monthly_price = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Monthly rent (applicable if rent_type=long_term or both)"
    )
    available_from = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Earliest move-in date for long-term (ISO 8601)"
    )
    min_term_months = models.IntegerField(
        null=True,
        blank=True,
        help_text="Minimum lease duration in months"
    )
    deposit = models.IntegerField(
        null=True,
        blank=True,
        help_text="Security deposit amount (typically 1-2 months rent)"
    )

    # Short-term pricing and requirements
    nightly_price = models.IntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Nightly rate (applicable if rent_type=short_term or both)"
    )
    min_nights = models.IntegerField(
        null=True,
        blank=True,
        help_text="Minimum stay in nights"
    )

    # Amenities (JSON array for flexibility)
    amenities = models.JSONField(
        default=list,
        blank=True,
        help_text='List of amenity codes: ["ac", "wifi", "sea_view", "pool", "parking"]'
    )

    # Images (JSON array of URLs)
    images = models.JSONField(
        default=list,
        blank=True,
        help_text='List of image URLs: ["https://.../1.jpg", "https://.../2.jpg"]'
    )

    # Agency info
    agency_name = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Name of listing agency or landlord"
    )

    # Quality signal
    rating = models.FloatField(
        null=True,
        blank=True,
        help_text="User rating (0.0-5.0)"
    )

    # Bridge to cross-domain aggregate
    listing = models.OneToOneField(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='real_estate_property',
        help_text="Generic listing used for cross-domain features (dashboard, storefront, bookings)"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            # Main search index (rent_type + location + bedrooms + price)
            models.Index(
                fields=['rent_type', 'city', 'bedrooms', 'monthly_price'],
                name='re_lt_search_idx'
            ),
            models.Index(
                fields=['rent_type', 'city', 'bedrooms', 'nightly_price'],
                name='re_st_search_idx'
            ),
        ]
        ordering = ['city', 'bedrooms', 'monthly_price']
        verbose_name = "Listing"
        verbose_name_plural = "Listings"

    def __str__(self):
        return f"{self.title} ({self.rent_type}, {self.city})"


class ShortTermBlock(models.Model):
    """
    Blocked/unavailable date ranges for short-term listings.

    Approach: Store unavailable ranges (bookings, maintenance) rather than
    available dates. Default assumption: all dates are available unless blocked.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="st_blocks",
        help_text="Short-term listing this block applies to"
    )
    start_date = models.DateField(
        db_index=True,
        help_text="Start date of blocked range (inclusive)"
    )
    end_date = models.DateField(
        db_index=True,
        help_text="End date of blocked range (inclusive)"
    )

    class Meta:
        indexes = [
            models.Index(
                fields=['listing', 'start_date', 'end_date'],
                name='re_stblock_lookup_idx'
            ),
        ]
        ordering = ['start_date']
        verbose_name = "Short-Term Block"
        verbose_name_plural = "Short-Term Blocks"

    def __str__(self):
        return f"{self.listing.title}: {self.start_date} to {self.end_date} (blocked)"
