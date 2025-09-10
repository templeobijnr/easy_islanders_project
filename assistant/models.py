from email.policy import default
from django.db import models
import uuid

# ----------------------------
# Shared constants
# ----------------------------

LANGUAGE_CHOICES = [
    ("en", "English"),
    ("tr", "Turkish"),
    ("ru", "Russian"),
    ("pl", "Polish"),
    ("de", "German"),
]

REQUEST_TYPES = [
    ("car_rental", "Car Rental"),
    ("accommodation", "Accommodation"),
    ("activities", "Things to Do"),
    ("dining", "Restaurants & Dining"),
    ("transportation", "Transportation"),
    ("legal", "Legal Services"),
    ("medical", "Medical Services"),
    ("shopping", "Shopping"),
    ("human_assistance", "Human Assistance"),
    ("other", "Other"),
]

SOURCE_CHOICES = [
    ("website", "Website"),
    ("facebook", "Facebook"),
    ("telegram", "Telegram"),
    ("whatsapp", "Whatsapp"),
    ("other", "Other"),
]

# ----------------------------
# Core Models
# ----------------------------

class UserRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    # User Information
    name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")

    # Request Details
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    message = models.TextField()
    original_message = models.TextField()

    # Additional Context from AI
    location_preference = models.CharField(max_length=100, blank=True)
    budget_range = models.CharField(max_length=50, blank=True)
    dates_needed = models.CharField(max_length=100, blank=True)
    number_of_people = models.IntegerField(default=1)

    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.IntegerField(default=3)  # 1=High, 2=Medium, 3=Low

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Admin
    admin_notes = models.TextField(blank=True)
    assigned_to = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name or 'Anonymous'} - {self.get_request_type_display()} ({self.phone_number})"


class ServiceProvider(models.Model):
    CATEGORY_CHOICES = [
        ("car_rental", "Car Rental"),
        ("accommodation", "Accommodation"),
        ("activities", "Activities & Tours"),
        ("dining", "Restaurants"),
        ("transportation", "Transportation"),
        ("legal", "Legal Services"),
        ("medical", "Medical Services"),
        ("shopping", "Shopping"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True)
    location = models.CharField(max_length=100)
    description = models.TextField()
    website = models.URLField(blank=True)
    booking_url = models.URLField(blank=True, help_text="Direct link for booking/reservations")
    image_url = models.URLField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    price_range = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # Multilingual
    description_tr = models.TextField(blank=True)
    description_ru = models.TextField(blank=True)
    description_pl = models.TextField(blank=True)
    description_de = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.get_category_display()}"

    def get_description(self, language="en"):
        return getattr(self, f"description_{language}", None) or self.description


class ServiceFeature(models.Model):
    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name="features")
    feature_name = models.CharField(max_length=100, blank=True)

    # Multilingual
    feature_name_tr = models.CharField(max_length=100, blank=True)
    feature_name_ru = models.CharField(max_length=100, blank=True)
    feature_name_pl = models.CharField(max_length=100, blank=True)
    feature_name_de = models.CharField(max_length=100, blank=True)

    def get_name(self, language="en"):
        return getattr(self, f"feature_name_{language}", None) or self.feature_name


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending Confirmation"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)

    booking_date = models.DateField()
    booking_time = models.TimeField(blank=True, null=True)
    number_of_people = models.IntegerField(default=1)
    duration_days = models.IntegerField(default=1)

    special_requests = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    booking_reference = models.CharField(max_length=20, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.booking_reference} - {self.service_provider.name}"


class LinkSource(models.Model):
    url = models.URLField(unique=True)
    category = models.CharField(max_length=50, help_text="e.g., Residency, Banking, Car Imports")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")
    last_ingested = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.url


class KnowledgeBase(models.Model):
    CATEGORY_CHOICES = [
        ("general", "General Information"),
        ("legal", "Legal Information"),
    ]

    source_link = models.ForeignKey(LinkSource, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    # Multilingual
    content_en = models.TextField(help_text="Content in English")
    content_tr = models.TextField(blank=True)
    content_ru = models.TextField(blank=True)
    content_pl = models.TextField(blank=True)
    content_de = models.TextField(blank=True)

    keywords = models.CharField(max_length=500, help_text="Comma-separated keywords for AI search")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_content(self, language="en"):
        return getattr(self, f"content_{language}", None) or self.content_en


class Listing(models.Model):
    """
    Represents a 'supply' item scraped/ingested from a source (property, car, etc.).
    Optimized for the proxy-agent flow: internal-first search, outreach, photo enrichment.
    """

    SOURCE_CHOICES = [
        ('website', 'Website'),
        ('facebook', 'Facebook'),
        ('telegram', 'Telegram'),
        ('whatsapp', 'Whatsapp'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('verified_with_photos', 'Verified with Photos'),
        ('inactive', 'Inactive'),
    ]

    # --- Source Information ---
    source_name = models.CharField(
        max_length=50,
        help_text="e.g., 'WhatsApp', 'Facebook', '101evler', etc."
    )
    source_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique ID from the provider (e.g., post_id)"
    )
    source_url = models.URLField(max_length=512, blank=True, null=True)
    posted_at = models.DateTimeField(null=True, blank=True)
    raw_text = models.TextField(
        blank=True,
        help_text="Original, unstructured post text"
    )

    # --- AI-structured data ---
    structured_data = models.JSONField(blank=True, null=True)

    # --- Searchable fields (denormalized) ---
    listing_type = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="e.g., 'property_rent', 'car_sale'"
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        db_index=True
    )
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, blank=True)

    # --- Lifecycle & timestamps ---
    is_active = models.BooleanField(default=True, db_index=True)
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True,
        help_text="Internal lifecycle for proxy outreach"
    )
    last_seen_at = models.DateTimeField(auto_now=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # --- Media enrichment ---
    image_urls = models.JSONField(
        default=list,
        blank=True,
        help_text="Permanent CDN/S3 URLs for photos"
    )
    has_image = models.BooleanField(default=False)

    # --- Minimal contact hints (never shown to user) ---
    contact_channel = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        blank=True,
        help_text="e.g., whatsapp, telegram"
    )
    contact_identifier = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="e.g., E.164 phone number or chat id"
    )

    # --- Optional: internal provenance tag (never exposed) ---
    source_private_label = models.CharField(
        max_length=50,
        blank=True,
        help_text="Internal tag for source; never surfaced to end users"
    )

    class Meta:
        ordering = ["-last_seen_at"]
        indexes = [
            models.Index(fields=["is_active", "listing_type", "last_seen_at"]),
            models.Index(fields=["location", "last_seen_at"]),
        ]

    def save(self, *args, **kwargs):
        # Keep has_image in sync with image_urls
        self.has_image = bool(self.image_urls)
        super().save(*args, **kwargs)

    def __str__(self):
        title = self.structured_data.get("title", "Untitled Listing") if self.structured_data else "Untitled Listing"
        return f"{title} from {self.source_name}"


class DemandLead(models.Model):
    """Represents a 'demand' signal (a user looking for something)."""

    source_provider = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    source_id = models.CharField(max_length=100, unique=True)
    source_url = models.URLField(max_length=512, blank=True, null=True)
    author_name = models.CharField(max_length=255, blank=True)
    author_profile_url = models.URLField(max_length=512, blank=True, null=True)
    raw_content = models.TextField()
    keywords_detected = models.JSONField(default=list, blank=True)
    posted_at = models.DateTimeField(null=True, blank=True)

    structured_lead = models.JSONField(blank=True, null=True)

    STATUS_CHOICES = [
        ("new", "New"),
        ("matched", "Matched"),
        ("contacted", "Outreach sent"),
        ("responded", "User responded"),
        ("closed", "Closed"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    is_processed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-posted_at"]

    def __str__(self):
        return f"Lead from {self.author_name or 'Unknown'} on {self.get_source_provider_display()} ({self.status})"


class Conversation(models.Model):
    conversation_id = models.CharField(max_length=36, unique=True)
    user_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.conversation_id}"


class Message(models.Model):
    # ✅ fixed typo: coversation → conversation
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=[("user", "User"), ("assistant", "Assistant")])
    content = models.TextField()
    language = models.CharField(max_length=2, default="en")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Message Context - stores what was shown/available when this message was sent
    message_context = models.JSONField(default=dict, blank=True)  # e.g., {"last_recommendations": [1,2,3], "search_query": "2+1 in Girne"}
    
    # NEW: Pending State - stores pending actions for enhanced agent (optional, nullable for backward compatibility)
    pending_state = models.JSONField(null=True, blank=True)  # e.g., {"pending_actions": [...], "context_loaded": true}

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class UserProfile(models.Model):
    """Advanced user profile for personalized interactions"""
    
    user_id = models.CharField(max_length=100, unique=True, db_index=True)
    
    # User Preferences
    preferred_language = models.CharField(max_length=10, default="en")
    communication_style = models.CharField(max_length=20, default="casual")  # formal, casual, direct, detailed
    detail_preference = models.CharField(max_length=20, default="moderate")  # minimal, moderate, detailed
    
    # User Situation
    living_status = models.CharField(max_length=50, blank=True)  # resident, expat, tourist, student
    family_situation = models.CharField(max_length=100, blank=True)  # single, couple, family with kids
    work_situation = models.CharField(max_length=100, blank=True)  # employed, self-employed, retired, student
    current_location = models.CharField(max_length=100, blank=True)
    
    # User History and Patterns
    query_history = models.JSONField(default=list)  # Previous queries and topics
    service_usage = models.JSONField(default=dict)  # Services used and satisfaction
    interests = models.JSONField(default=list)  # Areas of interest
    goals = models.JSONField(default=list)  # Long-term objectives
    
    # Interaction Data
    total_interactions = models.IntegerField(default=0)
    last_interaction = models.DateTimeField(null=True, blank=True)
    satisfaction_rating = models.FloatField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"User Profile: {self.user_id}"
    
    def get_preferences(self):
        return {
            "language": self.preferred_language,
            "communication_style": self.communication_style,
            "detail_preference": self.detail_preference
        }
    
    def get_situation(self):
        return {
            "living_status": self.living_status,
            "family_situation": self.family_situation,
            "work_situation": self.work_situation,
            "current_location": self.current_location
        }


class ConversationContext(models.Model):
    """Advanced conversation context tracking"""
    
    conversation_id = models.CharField(max_length=100, unique=True, db_index=True)
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, null=True, blank=True)
    
    # Current Context
    current_topic = models.CharField(max_length=200, blank=True)
    user_situation = models.JSONField(default=dict)  # Current situation context
    emotional_state = models.CharField(max_length=50, blank=True)  # urgent, casual, frustrated, excited
    urgency_level = models.CharField(max_length=20, default="medium")  # high, medium, low
    information_gaps = models.JSONField(default=list)  # What information is missing
    
    # Conversation Flow
    conversation_phase = models.CharField(max_length=50, default="initial")  # initial, exploration, action, follow_up
    active_goals = models.JSONField(default=list)  # Current user goals
    pending_actions = models.JSONField(default=list)  # Actions waiting to be completed
    
    # Context History
    topic_history = models.JSONField(default=list)  # Topics discussed
    decision_points = models.JSONField(default=list)  # Key decisions made
    user_feedback = models.JSONField(default=dict)  # User satisfaction and feedback
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Context: {self.conversation_id} - {self.current_topic}"
    

# ----------------------------
# Outreach indexing (contact → listing)
# ----------------------------


class ContactIndex(models.Model):
    """Simple index to resolve inbound WhatsApp numbers to listings.

    Created when we initiate outreach so later Twilio webhooks can map
    the sender's number back to the target listing quickly.
    """

    normalized_contact = models.CharField(max_length=32, db_index=True)
    listing = models.ForeignKey('Listing', on_delete=models.CASCADE, related_name='contact_indexes')
    conversation = models.ForeignKey('Conversation', on_delete=models.SET_NULL, null=True, blank=True, related_name='contacts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("normalized_contact", "listing")

    def __str__(self) -> str:
        return f"{self.normalized_contact} → {self.listing_id}"

    def get_context_summary(self):
        return {
            "topic": self.current_topic,
            "phase": self.conversation_phase,
            "urgency": self.urgency_level,
            "emotional_state": self.emotional_state,
            "gaps": self.information_gaps,
            "goals": self.active_goals
        }


class Booking(models.Model):
    """Property viewing bookings"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='bookings')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='bookings')
    
    # Booking details
    preferred_date = models.DateTimeField()
    preferred_time = models.TimeField()
    message = models.TextField(blank=True, help_text="Additional message for the agent")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Contact information
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    
    # Agent response (through platform only)
    agent_response = models.TextField(blank=True)
    agent_available_times = models.JSONField(default=list, help_text="Available time slots from agent")
    agent_notes = models.TextField(blank=True, help_text="Additional notes from agent")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['listing', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['preferred_date']),
        ]
    
    def __str__(self):
        try:
            sd = self.listing.structured_data or {}
            title = sd.get('title') or f"Listing #{self.listing.id}"
        except Exception:
            title = f"Listing #{self.listing_id}"
        return f"Booking {self.id} - {title} - {self.get_status_display()}"
