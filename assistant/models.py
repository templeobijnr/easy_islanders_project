from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
import uuid
from django.utils import timezone
from pgvector.django import VectorField

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
    # Agent extensions
    STATUS_CHOICES = [
        ('new', 'New'),
        ('broadcasted', 'Broadcasted'),
        ('responded', 'Responded'),
        ('closed', 'Closed'),
    ]
    INTENT_CHOICES = [
        ('short_term', 'Short Term'),
        ('long_term', 'Long Term'),
        ('unknown', 'Unknown'),
    ]
    SOURCE_CHOICES = [
        ('facebook', 'Facebook'),
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('reddit', 'Reddit'),
        ('other', 'Other'),
    ]
    extracted_criteria = models.JSONField(default=dict, help_text='Structured search/lead criteria extracted by NLU')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    intent_type = models.CharField(max_length=20, choices=INTENT_CHOICES, default='unknown')
    sellers_contacted = models.JSONField(default=list, help_text='Audit log of sellers contacted for this request')
    handle_notes = models.TextField(blank=True, help_text='Internal notes / BI for this request')
    source_id = models.CharField(max_length=255, null=True, blank=True)
    source_provider = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='other')
    source_url = models.URLField(null=True, blank=True)
    author_name = models.CharField(max_length=255, null=True, blank=True)
    raw_content = models.TextField(null=True, blank=True)
    keywords_detected = models.JSONField(default=list)
    posted_at = models.DateTimeField(null=True, blank=True)
    structured_lead = models.JSONField(default=dict)
    is_processed = models.BooleanField(default=False)

    class Meta:
        permissions = [
            ("can_broadcast_to_all_sellers", "Can broadcast to all sellers"),
        ]
    
    def __str__(self):
        return f"Demand - {self.contact_info}"

# === NEW: Generic Request model (API V1.1) ===
class Request(models.Model):
    CATEGORY_CHOICES = [
        ('PROPERTY', 'Property'),
        ('VEHICLE', 'Vehicle'),
        ('GENERAL_PRODUCT', 'General Product'),
        ('SERVICE', 'Service'),
        ('KNOWLEDGE_QUERY', 'Knowledge Query'),
        ('OUT_OF_SCOPE', 'Out of Scope'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('pending_approval', 'Pending Approval'),
        ('broadcasted', 'Broadcasted'),
        ('responded', 'Responded'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=64, blank=True)
    location = models.CharField(max_length=255, blank=True)
    budget_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_currency = models.CharField(max_length=8, blank=True)
    attributes = models.JSONField(default=dict, help_text='Flexible attributes for domain-specific needs')
    contact = models.CharField(max_length=255, help_text='User-provided contact (tokenized/redacted in serializers)')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['category', 'location']),
            models.Index(fields=['status']),
        ]
        verbose_name = 'Request'
        verbose_name_plural = 'Requests'

    def __str__(self):
        return f"Request {self.id.hex[:8]} ({self.category})"

class AgentBroadcast(models.Model):
    """Immutable log of per-seller broadcast attempts for a given demand lead."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(DemandLead, on_delete=models.CASCADE, related_name='broadcasts')
    seller_id = models.CharField(max_length=64, blank=True, help_text='Target seller/business identifier')
    medium = models.CharField(max_length=32, help_text='email | sms | whatsapp')
    status = models.CharField(max_length=32, default='pending', help_text='pending | sent | failed | responded | retrying')
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    response_log = models.JSONField(default=dict, help_text='Optional payload of provider responses / metadata')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Broadcast {self.id} → seller={self.seller_id} status={self.status}"

# === NEW: AgentBroadcastV2 for generalized Request ===
class AgentBroadcastV2(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='broadcasts_v2')
    seller_id = models.CharField(max_length=64, blank=True, help_text='Target seller/business identifier')
    medium = models.CharField(max_length=32, help_text='email | sms | whatsapp')
    status = models.CharField(max_length=32, default='pending', help_text='pending | sent | failed | responded | retrying')
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    response_log = models.JSONField(default=dict, help_text='Optional payload of provider responses / metadata')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agent Broadcast V2'
        verbose_name_plural = 'Agent Broadcasts V2'
        constraints = [
            models.UniqueConstraint(fields=['request', 'seller_id'], name='uniq_broadcast_v2_request_seller')
        ]

    def __str__(self):
        return f"BroadcastV2 {self.id} → seller={self.seller_id} status={self.status}"


class FeatureFlag(models.Model):
    """Simple feature flag stored in DB for dynamic rollout control."""
    name = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FeatureFlag({self.name}={self.enabled})"


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
    is_active = models.BooleanField(default=True)
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
    """
    Extended Message model supporting F.3 unified messaging system.
    
    Supports multiple message types with structured metadata, PII gatekeeping,
    unread tracking (excluding system messages), and immutable audit trails.
    
    Architectural Mandates:
    - Q20: ALL messages MUST have non-null conversation_id
    - Q4a: broadcast_request sender MUST be agent_service
    - Q9: PII filtering happens in serialization layer
    - Q11: Badge counts exclude system messages
    - Q15: Messages ordered newest-first
    """
    MESSAGE_TYPES = [
        ('broadcast_request', 'Broadcast Request'),  # New lead (seller sees location+budget)
        ('seller_response', 'Seller Response'),      # Seller's offer
        ('user', 'User Message'),                    # Human-to-human chat
        ('assistant', 'Assistant Message'),          # Agent/LLM response
        ('system', 'System Message'),                # Notifications, confirmations
    ]
    
    # === CORE IDENTITY FIELDS ===
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPES,
        default='user',
        help_text='Message classification'
    )
    conversation_id = models.CharField(
        max_length=255,
        null=False,  # MANDATORY NON-NULL [Q20]
        blank=False,
        db_index=True,
        default='legacy-conv',  # Default for existing rows during migration
        help_text='Links all messages in a thread (non-null for ALL types) [Q20]'
    )
    content = models.TextField(help_text='Primary message text or summary')
    demand_lead_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Foreign key to DemandLead (for Flow 2 messages)'
    )
    client_msg_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Client-generated UUID for idempotency (prevents duplicate processing on network retry)'
    )
    
    # === PARTICIPANT FIELDS ===
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
        help_text='Message sender (agent_service for broadcast_request) [Q4a]'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_messages',
        help_text='Message recipient'
    )
    
    # === TEMPORAL FIELDS ===
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_unread = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Unread status (excludes system messages from badge count) [Q11]'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when marked as read'
    )
    
    # === METADATA FIELDS (CONDITIONAL BASED ON TYPE) ===
    broadcast_metadata = models.JSONField(
        null=True,
        blank=True,
        help_text='Structured criteria for broadcast_request (gatekept: location, budget, category, duration) [Q7, Q9]'
    )
    offer_metadata = models.JSONField(
        null=True,
        blank=True,
        help_text='Seller offer details for seller_response (price, availability, photos, details, links) [Q19c]'
    )
    
    class Meta:
        ordering = ['-created_at']  # Newest first [Q15]
        indexes = [
            models.Index(fields=['recipient', 'is_unread']),  # For badge polling [Q14]
            models.Index(fields=['conversation_id', '-created_at']),  # For thread retrieval [Q15]
            models.Index(fields=['type', 'is_unread']),  # For filtering
            models.Index(fields=['-created_at']),  # For pagination
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['conversation_id', 'client_msg_id'],
                name='uniq_conversation_client_msg',
                condition=models.Q(client_msg_id__isnull=False),
            )
        ]
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
    
    def __str__(self):
        return f"Message {self.id.hex[:8]} ({self.type}) - {self.conversation_id[:16]}"
    
    def mark_as_read(self):
        """Atomically mark message as read (for mark-as-read endpoint)"""
        if self.is_unread:
            self.is_unread = False
            self.read_at = timezone.now()
            self.save(update_fields=['is_unread', 'read_at'])
    
    @property
    def counts_toward_badge(self):
        """Return True if this message increments the unread badge (excludes system) [Q11]"""
        return self.type in ['broadcast_request', 'seller_response', 'user', 'assistant']


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


# DEPRECATED: Booking moved to bookings.models.Booking
# This was consolidated to use the unified booking model from the bookings app.
# See DJANGO_DIAGNOSTIC_REPORT.md for details on the consolidation.


class UserProfile(models.Model):
    """Legacy user profile model - kept for compatibility"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    preferred_language = models.CharField(
        max_length=10,
        default='en',
        choices=[('en', 'English'), ('tr', 'Turkish'), ('ru', 'Russian'), ('pl', 'Polish')],
        help_text='User preferred language for chat'
    )
    theme_preference = models.CharField(
        max_length=10,
        default='light',
        choices=[('light', 'Light'), ('dark', 'Dark')],
        help_text='User theme preference (light/dark)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


class ConversationThread(models.Model):
    """
    Persistent conversation thread linked to user for cross-device sync.
    
    Each user has one active thread at a time. This model serves as the bridge
    between the authenticated User ID and the LangGraph checkpoint thread_id,
    enabling durable state persistence and cross-device synchronization.
    
    Usage:
    - Backend generates thread_id on first message if not provided
    - Stores mapping: User ID ↔ thread_id
    - Frontend caches thread_id in localStorage (non-authoritative)
    - On cross-device login, backend retrieves same thread_id via User ID lookup
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_threads')
    thread_id = models.CharField(
        max_length=36,
        unique=True,
        help_text='UUID identifying this conversation thread (LangGraph checkpoint key)'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Active thread for this user (one active thread per user)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # Composite index for fast lookup: user + is_active
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['thread_id']),
            models.Index(fields=['user', '-created_at']),
        ]
        # Constraint: only one active thread per user
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active=True),
                name='unique_active_thread_per_user'
            )
        ]
    
    def __str__(self):
        return f"Thread {self.thread_id[:8]}... (user: {self.user})"
    
    @classmethod
    def get_or_create_active(cls, user):
        """
        Get the active thread for a user, or create one if none exists.
        
        Returns:
            (ConversationThread, created: bool)
        """
        thread, created = cls.objects.get_or_create(
            user=user,
            is_active=True,
            defaults={'thread_id': str(uuid.uuid4())}
        )
        return thread, created
    
    @classmethod
    def get_active_thread_id(cls, user):
        """
        Get the thread_id for the user's active thread, or None if no active thread.
        
        Returns:
            str (UUID) or None
        """
        thread = cls.objects.filter(user=user, is_active=True).first()
        return thread.thread_id if thread else None


class ApproveBroadcast(models.Model):
    """
    Human-in-the-Loop (HITL) approval gate for broadcast actions.
    
    When agent decides to broadcast an RFQ, it pauses at this gate
    pending human review. Business user must explicitly approve or reject.
    
    Used for Flow 2: Capture & Broadcast governance.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired (24h timeout)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Link to the demand lead (RFQ) [legacy]
    demand_lead = models.ForeignKey(
        DemandLead,
        on_delete=models.CASCADE,
        related_name='broadcast_approvals',
        help_text='The RFQ being broadcast',
        null=True,
        blank=True,
    )

    # NEW: Link to generalized Request (V1.1)
    request_fk = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name='broadcast_approvals',
        help_text='The generalized Request being broadcast',
        null=True,
        blank=True,
    )
    
    # Business user who will review
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='broadcast_reviews',
        help_text='Business user reviewing this broadcast'
    )
    
    # Broadcast details for review
    target_seller_count = models.IntegerField(
        help_text='Number of sellers to be contacted'
    )
    seller_ids = models.JSONField(
        default=list,
        help_text='List of seller IDs targeted for this broadcast'
    )
    medium = models.CharField(
        max_length=32,
        default='whatsapp',
        choices=[('whatsapp', 'WhatsApp'), ('email', 'Email'), ('sms', 'SMS')],
        help_text='Communication medium for broadcast'
    )
    
    # Approval tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    approval_notes = models.TextField(
        blank=True,
        help_text='Business user notes on approval/rejection decision'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
        ]
        permissions = [
            ("can_approve_broadcasts", "Can approve RFQ broadcasts"),
            ("can_reject_broadcasts", "Can reject RFQ broadcasts"),
        ]
        constraints = [
            # Exactly one of demand_lead or request_fk must be set
            models.CheckConstraint(
                name='approve_exactly_one_fk',
                check=(
                    (models.Q(demand_lead__isnull=False, request_fk__isnull=True)) |
                    (models.Q(demand_lead__isnull=True, request_fk__isnull=False))
                )
            ),
            models.CheckConstraint(
                name='approve_not_both_null',
                check=~(
                    models.Q(demand_lead__isnull=True, request_fk__isnull=True)
                )
            ),
        ]
    
    def __str__(self):
        return f"Broadcast Approval {self.id} ({self.status})"
    
    def approve(self, reviewer=None, notes=''):
        """Mark broadcast as approved"""
        self.status = 'approved'
        self.reviewer = reviewer
        self.approval_notes = notes
        self.approved_at = timezone.now()
        self.save()
    
    def reject(self, reviewer=None, notes=''):
        """Mark broadcast as rejected"""
        self.status = 'rejected'
        self.reviewer = reviewer
        self.approval_notes = notes
        self.rejected_at = timezone.now()
        self.save()
    
    @property
    def is_pending(self):
        """Check if still awaiting approval"""
        return self.status == 'pending'
    
    @property
    def is_approved(self):
        """Check if approved"""
        return self.status == 'approved'
    
    @property
    def is_rejected(self):
        """Check if rejected"""
        return self.status == 'rejected'
    
    @property
    def is_expired(self):
        """Check if 24h timeout exceeded"""
        if self.status != 'pending':
            return False
        timeout = self.created_at + timezone.timedelta(hours=24)
        return timezone.now() > timeout


class FailedTask(models.Model):
    """
    Dead Letter Queue (DLQ) for failed Celery tasks.
    Gate B: Operational Hardening - captures poison tasks after max retries exceeded.
    """
    task_name = models.CharField(max_length=255)
    args = models.JSONField()
    exception = models.TextField()
    failed_at = models.DateTimeField(auto_now_add=True)
    retried_at = models.DateTimeField(null=True, blank=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-failed_at']
        indexes = [
            models.Index(fields=['-failed_at']),
            models.Index(fields=['resolved']),
        ]

    def __str__(self):
        return f"{self.task_name} failed at {self.failed_at}"

# SPRINT 6: User Preference Models
# ============================================================================

# DEPRECATED: UserPreference moved to users.models.UserPreference
# This was consolidated to create a unified preference model.
# See DJANGO_DIAGNOSTIC_REPORT.md for details on the consolidation.


class PreferenceExtractionEvent(models.Model):
    """
    Audit trail for preference extraction attempts.

    Tracks:
    - Extraction method (LLM, rule-based, fallback)
    - Confidence scores
    - Contradictions detected
    - Processing time
    """

    EXTRACTION_METHOD_CHOICES = [
        ('llm', 'LLM (OpenAI)'),
        ('rule', 'Rule-based'),
        ('hybrid', 'Hybrid (LLM + Rules)'),
        ('fallback', 'Fallback Only'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Context
    thread_id = models.CharField(max_length=255, db_index=True)
    message_id = models.UUIDField(db_index=True)
    utterance = models.TextField()

    # Results
    extracted_preferences = models.JSONField(default=list)
    confidence_scores = models.JSONField(default=dict)
    extraction_method = models.CharField(max_length=50, choices=EXTRACTION_METHOD_CHOICES)
    llm_reasoning = models.TextField(blank=True)
    contradictions_detected = models.JSONField(default=list)

    # Performance
    created_at = models.DateTimeField(auto_now_add=True)
    processing_time_ms = models.IntegerField(null=True)

    class Meta:
        db_table = 'preference_extraction_events'
        indexes = [
            models.Index(fields=['user', '-created_at'], name="pref_ext_user_created_idx"),
            models.Index(fields=['thread_id', '-created_at'], name="pref_ext_thread_created_idx"),
            models.Index(fields=['-created_at'], name="pref_ext_created_at_idx"),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Extraction for {self.user.username} at {self.created_at}"
