from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.conf import settings


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
