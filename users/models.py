import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.conf import settings
from django.utils import timezone


class User(AbstractUser):
    """Extended user model with business profile support"""
    
    USER_TYPE_CHOICES = [
        ('consumer', 'Consumer'),
        ('business', 'Business'),
    ]
    
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='consumer'
    )
    
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    
    objects = DjangoUserManager()
    
    class Meta:
        ordering = ['-date_joined']
        swappable = 'AUTH_USER_MODEL'
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"


class BusinessProfile(models.Model):
    """Business profile for business users"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business_profile')
    business_name = models.CharField(max_length=255)
    category = models.ForeignKey('listings.Category', on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey('listings.Subcategory', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_verified_by_admin = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Business Profile"
        verbose_name_plural = "Business Profiles"

    def __str__(self):
        return f"{self.business_name} (verified: {self.is_verified_by_admin})"


class UserPreference(models.Model):
    """
    Unified user preferences supporting both UI settings and extracted ML preferences.
    
    Consolidates:
    - UI settings (language, currency, timezone, notifications)
    - Extracted preferences from conversations (real estate, services, lifestyle)
    """
    
    PREFERENCE_TYPES = [
        ('ui_language', 'UI Language'),
        ('ui_currency', 'UI Currency'),
        ('ui_timezone', 'UI Timezone'),
        ('ui_email_notifications', 'Email Notifications'),
        ('ui_push_notifications', 'Push Notifications'),
        ('ui_marketing_notifications', 'Marketing Notifications'),
        ('extracted_real_estate', 'Real Estate Preferences'),
        ('extracted_services', 'Services Preferences'),
        ('extracted_lifestyle', 'Lifestyle Preferences'),
        ('extracted_general', 'General Preferences'),
    ]
    
    SOURCE_CHOICES = [
        ('explicit', 'Explicitly Stated'),
        ('inferred', 'Inferred from Context'),
        ('behavior', 'Learned from Behavior'),
        ('system_default', 'System Default'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferences')
    
    # Categorization
    preference_type = models.CharField(max_length=50, choices=PREFERENCE_TYPES, db_index=True)
    
    # Value storage
    value = models.JSONField(help_text="Normalized structured value")
    raw_value = models.TextField(blank=True, help_text="Original utterance (PII-redacted)")
    
    # Confidence & tracking
    confidence = models.FloatField(default=1.0, help_text="Confidence score (0.0-1.0)")
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='explicit')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    use_count = models.IntegerField(default=0)
    
    # Versioning & metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        verbose_name = "User Preference"
        verbose_name_plural = "User Preferences"
        unique_together = [['user', 'preference_type']]
        indexes = [
            models.Index(fields=['user', 'preference_type'], name="user_pref_user_type_idx"),
            models.Index(fields=['user', '-confidence'], name="user_pref_confidence_idx"),
            models.Index(fields=['-confidence', '-last_used_at'], name="user_pref_conf_lastused_idx"),
        ]
        ordering = ['-confidence', '-last_used_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_preference_type_display()}"
    
    @property
    def is_stale(self):
        """Check if preference is stale (30+ days since last use)."""
        if not self.last_used_at:
            return False
        return (timezone.now() - self.last_used_at).days > 30
    
    def calculate_decay(self) -> float:
        """
        Calculate confidence decay based on time since last use.
        
        Decay schedule:
        - 0-7 days: no decay
        - 7-30 days: -0.01 per day
        - 30-90 days: -0.02 per day
        - 90+ days: -0.05 per day
        """
        if not self.last_used_at:
            return 0.0
        
        days = (timezone.now() - self.last_used_at).days
        
        if days <= 7:
            return 0.0
        elif days <= 30:
            return (days - 7) * 0.01
        elif days <= 90:
            return 0.23 + (days - 30) * 0.02
        else:
            return 1.43 + (days - 90) * 0.05
    
    def to_dict(self):
        """Serialize to dict for API responses."""
        return {
            'id': str(self.id),
            'preference_type': self.preference_type,
            'value': self.value,
            'confidence': round(self.confidence, 2),
            'source': self.source,
            'created_at': self.created_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'use_count': self.use_count,
            'is_stale': self.is_stale,
        }


class BusinessDomain(models.Model):
    """
    Tracks which business domains/industries a business user operates in.
    This enables personalized dashboard experience based on their actual business.
    """
    
    DOMAIN_CHOICES = [
        ('real_estate', 'Real Estate'),
        ('events', 'Events & Entertainment'),
        ('activities', 'Activities & Tours'),
        ('appointments', 'Appointments & Services'),
        ('vehicles', 'Vehicle Rentals'),
        ('hospitality', 'Hospitality & Accommodation'),
        ('food_beverage', 'Food & Beverage'),
        ('health_wellness', 'Health & Wellness'),
        ('education', 'Education & Training'),
        ('professional_services', 'Professional Services'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='business_domains')
    domain = models.CharField(max_length=50, choices=DOMAIN_CHOICES, db_index=True)
    
    # Business details for this domain
    is_primary = models.BooleanField(default=False, help_text="Primary business domain selected during onboarding")
    is_active = models.BooleanField(default=True, help_text="Whether this domain is currently active")
    
    # Onboarding & setup
    onboarded_at = models.DateTimeField(auto_now_add=True)
    setup_completed = models.BooleanField(default=False, help_text="Has completed domain-specific setup")
    
    # Performance tracking
    total_listings = models.IntegerField(default=0)
    total_bookings = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True, help_text="Domain-specific settings and preferences")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Business Domain"
        verbose_name_plural = "Business Domains"
        unique_together = [['user', 'domain']]
        indexes = [
            models.Index(fields=['user', 'is_active'], name="biz_dom_user_active_idx"),
            models.Index(fields=['user', 'is_primary'], name="biz_dom_user_primary_idx"),
            models.Index(fields=['domain', 'is_active'], name="biz_dom_domain_active_idx"),
        ]
        ordering = ['-is_primary', '-total_revenue', 'domain']
    
    def __str__(self):
        primary_indicator = " (Primary)" if self.is_primary else ""
        return f"{self.user.username} - {self.get_domain_display()}{primary_indicator}"
    
    @property
    def domain_display_name(self):
        """Get human-readable domain name."""
        return self.get_domain_display()
    
    @property
    def dashboard_config(self):
        """Get dashboard configuration for this domain."""
        base_config = {
            'domain': self.domain,
            'name': self.domain_display_name,
            'is_primary': self.is_primary,
            'is_active': self.is_active,
            'setup_completed': self.setup_completed,
            'stats': {
                'listings': self.total_listings,
                'bookings': self.total_bookings,
                'revenue': float(self.total_revenue),
            }
        }
        
        # Add domain-specific configuration
        domain_configs = {
            'real_estate': {
                'icon': '🏠',
                'color': 'blue',
                'description': 'Properties, rentals & sales',
                'features': ['property_management', 'rental_calendar', 'tenant_screening']
            },
            'events': {
                'icon': '🎉',
                'color': 'purple',
                'description': 'Conferences, parties & gatherings',
                'features': ['event_planning', 'ticket_sales', 'venue_management']
            },
            'activities': {
                'icon': '🎯',
                'color': 'green',
                'description': 'Tours, experiences & adventures',
                'features': ['tour_scheduling', 'group_bookings', 'equipment_rental']
            },
            'appointments': {
                'icon': '📅',
                'color': 'red',
                'description': 'Services, consultations & bookings',
                'features': ['appointment_scheduling', 'service_catalog', 'client_management']
            },
            'vehicles': {
                'icon': '🚗',
                'color': 'orange',
                'description': 'Car, bike & vehicle rentals',
                'features': ['fleet_management', 'rental_tracking', 'maintenance_scheduling']
            },
        }
        
        base_config.update(domain_configs.get(self.domain, {
            'icon': '💼',
            'color': 'gray',
            'description': 'Business services',
            'features': []
        }))
        
        return base_config
    
    def to_dict(self):
        """Serialize to dict for API responses."""
        return {
            'id': str(self.id),
            'domain': self.domain,
            'domain_display_name': self.domain_display_name,
            'is_primary': self.is_primary,
            'is_active': self.is_active,
            'setup_completed': self.setup_completed,
            'stats': {
                'listings': self.total_listings,
                'bookings': self.total_bookings,
                'revenue': float(self.total_revenue),
            },
            'config': self.dashboard_config,
            'onboarded_at': self.onboarded_at.isoformat(),
            'created_at': self.created_at.isoformat(),
        }
