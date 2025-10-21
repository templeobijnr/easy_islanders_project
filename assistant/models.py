from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class DemandLead(models.Model):
    """Demand leads from users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contact_info = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Demand - {self.contact_info}"


class ServiceProvider(models.Model):
    """Service providers in the system"""
    contact_info = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    service_type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"ServiceProvider - {self.contact_info}"


class ServiceFeature(models.Model):
    """Features that service providers offer"""
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='features')
    name_en = models.CharField(max_length=255)
    name_tr = models.CharField(max_length=255, blank=True)
    name_ru = models.CharField(max_length=255, blank=True)
    
    def get_name(self, language='en'):
        if language == 'tr':
            return self.name_tr or self.name_en
        elif language == 'ru':
            return self.name_ru or self.name_en
        return self.name_en
    
    def __str__(self):
        return self.name_en


class KnowledgeBase(models.Model):
    """Knowledge base articles"""
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    language = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title


class LinkSource(models.Model):
    """Links/sources for knowledge base"""
    kb_article = models.ForeignKey(KnowledgeBase, on_delete=models.CASCADE, related_name='sources')
    url = models.URLField()
    title = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return self.url


class Conversation(models.Model):
    """Chat conversations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(auto_now=True)
    language = models.CharField(max_length=5, default='en')
    
    class Meta:
        ordering = ['-last_message_at']
    
    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    """Chat messages within conversations"""
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='user')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message in {self.conversation.id} - {self.message_type}"


class ContactIndex(models.Model):
    """Index for contact information related to listings"""
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='contact_indexes')
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    telegram_handle = models.CharField(max_length=255, blank=True)
    last_contacted = models.DateTimeField(null=True, blank=True)
    contact_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"ContactIndex for Listing {self.listing.id}"


class Booking(models.Model):
    """Bookings for listings"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    preferred_date = models.DateTimeField()
    preferred_time = models.TimeField()
    message = models.TextField(blank=True, help_text='Additional message for the agent')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    agent_response = models.TextField(blank=True)
    agent_available_times = models.JSONField(default=list, help_text='Available time slots from agent')
    agent_notes = models.TextField(blank=True, help_text='Additional notes from agent')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Booking for {self.listing.title} - {self.status}"


class UserProfile(models.Model):
    """Legacy user profile model - kept for compatibility"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile of {self.user.username}"
