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
    seller = models.ForeignKey(
        'SellerProfile',
        on_delete=models.CASCADE,
        related_name='listings',
        null=True,
        blank=True,
        help_text='Business seller (if applicable)'
    )

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


class Booking(models.Model):
    """
    Unified booking model supporting both short-term and long-term bookings.
    Short-term: vacation rentals, hotel-style bookings with specific dates
    Long-term: rental agreements, property reservations
    """

    BOOKING_TYPE_CHOICES = [
        ('short_term', 'Short Term'),
        ('long_term', 'Long Term'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    # Booking type and dates
    booking_type = models.CharField(
        max_length=20,
        choices=BOOKING_TYPE_CHOICES,
        default='short_term'
    )
    check_in = models.DateField(null=True, blank=True)
    check_out = models.DateField(null=True, blank=True)

    # Pricing
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total booking price"
    )
    currency = models.CharField(max_length=10, default='EUR')

    # Status and metadata
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(blank=True, help_text="Additional booking notes")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['listing', 'booking_type', 'status']),
            models.Index(fields=['check_in', 'check_out']),
        ]

    def __str__(self):
        return f"{self.listing.title} - {self.booking_type} ({self.user.username})"

    @property
    def is_short_term(self):
        """Check if this is a short-term booking"""
        return self.booking_type == 'short_term'

    @property
    def is_long_term(self):
        """Check if this is a long-term booking"""
        return self.booking_type == 'long_term'

    @property
    def duration_days(self):
        """Calculate booking duration in days"""
        if self.check_in and self.check_out:
            return (self.check_out - self.check_in).days
        return None

    def clean(self):
        """Validate booking dates"""
        from django.core.exceptions import ValidationError

        if self.check_in and self.check_out:
            if self.check_in >= self.check_out:
                raise ValidationError("Check-out date must be after check-in date.")

        if self.is_short_term and (not self.check_in or not self.check_out):
            raise ValidationError("Short-term bookings require check-in and check-out dates.")


class SellerProfile(models.Model):
    """
    Business seller profile for marketplace listings.
    Enables verified businesses to manage multiple listings across categories.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_profile'
    )
    business_name = models.CharField(max_length=255)
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
        help_text='Total number of active listings'
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


class BuyerRequest(models.Model):
    """
    A request from a buyer for specific property/service requirements.
    Example: "Looking for 2BR apartment in Kyrenia under €500/month"

    Sellers can view and respond to relevant requests based on their categories.
    """
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_requests'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Category of request (real estate, services, etc.)'
    )
    message = models.TextField(help_text='Detailed request description')
    location = models.CharField(max_length=128, blank=True)
    budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Maximum budget'
    )
    currency = models.CharField(max_length=10, default='EUR')

    # Status tracking
    is_fulfilled = models.BooleanField(
        default=False,
        help_text='Whether buyer found what they needed'
    )
    response_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of seller responses received'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['buyer', '-created_at']),
            models.Index(fields=['is_fulfilled']),
        ]

    def __str__(self):
        preview = self.message[:50] + '...' if len(self.message) > 50 else self.message
        return f"Request by {self.buyer.username}: {preview}"


class BroadcastMessage(models.Model):
    """
    Promotional or informational broadcast created by sellers.
    Can target specific audiences based on location, category, etc.

    Example: "New luxury apartments available in Kyrenia Marina"
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    seller = models.ForeignKey(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name='broadcasts'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Category this broadcast relates to'
    )

    # Targeting
    target_audience = models.JSONField(
        default=dict,
        blank=True,
        help_text='Filters for targeting, e.g. {"city": "Kyrenia", "budget_min": 500}'
    )

    # Status and metrics
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='draft'
    )
    views_count = models.PositiveIntegerField(default=0)
    response_count = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['-published_at']),
        ]

    def __str__(self):
        return f"Broadcast by {self.seller.business_name}: {self.title}"

    def publish(self):
        """Publish the broadcast"""
        from django.utils import timezone
        self.status = 'active'
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at'])

    def increment_views(self):
        """Increment view counter"""
        self.views_count += 1
        self.save(update_fields=['views_count'])

    def increment_responses(self):
        """Increment response counter"""
        self.response_count += 1
        self.save(update_fields=['response_count'])
