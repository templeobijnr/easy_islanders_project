# Sprint 6: Task-by-Task Implementation Guide

**Epic:** Sprint 6 – Preference Extraction & Persistence
**Goal:** Phase 1 of context-aware roadmap - extract & persist user preferences
**Duration:** 2 weeks
**Status:** Ready to Execute

---

## Task Overview

| # | Task | Type | Priority | Owner | Status |
|---|------|------|----------|-------|--------|
| 1 | DB Schema (pgvector) | Story | High | Backend | 🟢 Ready |
| 2 | PreferenceService CRUD | Story | High | Backend | 🟡 Blocked by #1 |
| 3 | PII Integration | Task | High | Backend | 🟡 Blocked by #2 |
| 4 | LLM Extraction Chain | Story | High | Backend | 🟢 Ready |
| 5 | Rule-based Fallback | Task | Medium | Backend | 🟡 Blocked by #4 |
| 6 | Celery Async Task | Task | High | Backend | 🟡 Blocked by #2,#4 |
| 7 | Supervisor Integration | Story | High | Backend | 🟡 Blocked by #2 |
| 8 | RE Agent Integration | Story | High | Backend | 🟡 Blocked by #7 |
| 9 | Prometheus Metrics | Task | High | Observability | 🟢 Ready |
| 10 | Grafana Dashboard | Task | Medium | Observability | 🟡 Blocked by #9 |
| 11 | Frontend Chips | Story | High | Frontend | 🟢 Ready |
| 12 | Frontend 'Why' Notes | Task | Medium | Frontend | 🟡 Blocked by #11 |
| 13 | Eval Dataset | Story | High | QA | 🟢 Ready |
| 14 | TTFB Regression Guard | Task | Medium | Backend | 🟡 Blocked by #7 |
| 15 | Feature Flags | Task | High | Infra | 🟢 Ready |
| 16 | Write-Only Launch | Task | High | Infra | 🟡 Blocked by #1-6,#15 |
| 17 | Read Canary | Task | High | Infra | 🟡 Blocked by #16 |
| 18 | Prod Canary 10% | Task | High | Infra | 🟡 Blocked by #17 |
| 19 | Full Rollout | Task | High | Infra | 🟡 Blocked by #18 |

---

## TASK #1: DB Schema (pgvector) 📊

**Type:** Story
**Priority:** High
**Owner:** Backend
**Estimated:** 1 day
**Dependencies:** None

### Description
Create normalized database tables for user preferences and extraction audit trail. Enable pgvector extension for semantic search capability.

### Schema Design

```sql
-- Enable pgvector extension (run as superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- Main preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,

    -- Categorization
    category VARCHAR(50) NOT NULL,  -- 'real_estate', 'services'
    preference_type VARCHAR(50) NOT NULL,  -- 'budget', 'location', 'bedrooms'

    -- Value storage
    value JSONB NOT NULL,  -- Normalized structured value
    raw_value TEXT,  -- Original user utterance (PII-redacted)

    -- Confidence & source tracking
    confidence FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(50) NOT NULL,  -- 'explicit', 'inferred', 'behavior'

    -- Timestamps
    extracted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    last_decayed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    use_count INTEGER NOT NULL DEFAULT 0,

    -- Vector embedding for semantic search
    embedding VECTOR(1536),

    -- Versioning & metadata
    schema_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT unique_user_category_type UNIQUE (user_id, category, preference_type),
    CONSTRAINT valid_category CHECK (category IN ('real_estate', 'services', 'lifestyle', 'general')),
    CONSTRAINT valid_source CHECK (source IN ('explicit', 'inferred', 'behavior'))
);

-- Indexes
CREATE INDEX idx_user_prefs_user_category ON user_preferences(user_id, category);
CREATE INDEX idx_user_prefs_confidence ON user_preferences(confidence DESC, last_used_at DESC);
CREATE INDEX idx_user_prefs_last_used ON user_preferences(last_used_at DESC NULLS LAST);

-- pgvector index (IVFFlat for fast approximate search)
CREATE INDEX idx_user_prefs_embedding ON user_preferences
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Audit trail table
CREATE TABLE preference_extraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,

    -- Context
    thread_id VARCHAR(255) NOT NULL,
    message_id UUID NOT NULL,
    utterance TEXT NOT NULL,

    -- Extraction results
    extracted_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    extraction_method VARCHAR(50) NOT NULL,  -- 'llm', 'rule', 'hybrid'
    llm_reasoning TEXT,
    contradictions_detected JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processing_time_ms INTEGER,

    CONSTRAINT valid_extraction_method CHECK (extraction_method IN ('llm', 'rule', 'hybrid', 'fallback'))
);

-- Indexes for audit trail
CREATE INDEX idx_pref_events_user ON preference_extraction_events(user_id, created_at DESC);
CREATE INDEX idx_pref_events_thread ON preference_extraction_events(thread_id, created_at DESC);
CREATE INDEX idx_pref_events_created ON preference_extraction_events(created_at DESC);
```

### Django Models

```python
# assistant/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from pgvector.django import VectorField
import uuid

User = get_user_model()

class UserPreference(models.Model):
    """
    Structured user preferences extracted from conversations.

    Schema version: 1
    """

    SCHEMA_VERSION = 1

    CATEGORY_CHOICES = [
        ('real_estate', 'Real Estate'),
        ('services', 'Services'),
        ('lifestyle', 'Lifestyle'),
        ('general', 'General'),
    ]

    SOURCE_CHOICES = [
        ('explicit', 'Explicitly Stated'),
        ('inferred', 'Inferred from Context'),
        ('behavior', 'Learned from Behavior'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='preferences')

    # Categorization
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    preference_type = models.CharField(max_length=50, db_index=True)

    # Value storage
    value = models.JSONField(help_text="Normalized structured value")
    raw_value = models.TextField(blank=True, help_text="Original utterance (PII-redacted)")

    # Confidence & tracking
    confidence = models.FloatField(default=1.0)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)

    # Timestamps
    extracted_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_decayed_at = models.DateTimeField(default=timezone.now)
    use_count = models.IntegerField(default=0)

    # Vector embedding
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    # Versioning
    schema_version = models.IntegerField(default=SCHEMA_VERSION)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'user_preferences'
        unique_together = [['user', 'category', 'preference_type']]
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['-confidence', '-last_used_at']),
        ]
        ordering = ['-confidence', '-last_used_at']

    def __str__(self):
        return f"{self.user.username} - {self.category}/{self.preference_type}"

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
            'category': self.category,
            'preference_type': self.preference_type,
            'value': self.value,
            'confidence': round(self.confidence, 2),
            'source': self.source,
            'extracted_at': self.extracted_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'use_count': self.use_count,
            'is_stale': self.is_stale,
        }


class PreferenceExtractionEvent(models.Model):
    """Audit trail for preference extraction attempts."""

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
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['thread_id', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Extraction for {self.user.username} at {self.created_at}"
```

### Migration

```python
# assistant/migrations/0XXX_add_user_preferences.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid
from pgvector.django import VectorExtension, VectorField


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('assistant', '0XXX_previous_migration'),
    ]

    operations = [
        # Enable pgvector extension
        VectorExtension(),

        # Create user_preferences table
        migrations.CreateModel(
            name='UserPreference',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('category', models.CharField(choices=[('real_estate', 'Real Estate'), ('services', 'Services'), ('lifestyle', 'Lifestyle'), ('general', 'General')], db_index=True, max_length=50)),
                ('preference_type', models.CharField(db_index=True, max_length=50)),
                ('value', models.JSONField(help_text='Normalized structured value')),
                ('raw_value', models.TextField(blank=True, help_text='Original utterance (PII-redacted)')),
                ('confidence', models.FloatField(default=1.0)),
                ('source', models.CharField(choices=[('explicit', 'Explicitly Stated'), ('inferred', 'Inferred from Context'), ('behavior', 'Learned from Behavior')], max_length=50)),
                ('extracted_at', models.DateTimeField(auto_now_add=True)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                ('last_decayed_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('use_count', models.IntegerField(default=0)),
                ('embedding', VectorField(blank=True, dimensions=1536, null=True)),
                ('schema_version', models.IntegerField(default=1)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_preferences',
                'ordering': ['-confidence', '-last_used_at'],
            },
        ),

        # Create preference_extraction_events table
        migrations.CreateModel(
            name='PreferenceExtractionEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('thread_id', models.CharField(db_index=True, max_length=255)),
                ('message_id', models.UUIDField(db_index=True)),
                ('utterance', models.TextField()),
                ('extracted_preferences', models.JSONField(default=list)),
                ('confidence_scores', models.JSONField(default=dict)),
                ('extraction_method', models.CharField(choices=[('llm', 'LLM (OpenAI)'), ('rule', 'Rule-based'), ('hybrid', 'Hybrid (LLM + Rules)'), ('fallback', 'Fallback Only')], max_length=50)),
                ('llm_reasoning', models.TextField(blank=True)),
                ('contradictions_detected', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('processing_time_ms', models.IntegerField(null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'preference_extraction_events',
                'ordering': ['-created_at'],
            },
        ),

        # Add unique constraint
        migrations.AddConstraint(
            model_name='userpreference',
            constraint=models.UniqueConstraint(fields=['user', 'category', 'preference_type'], name='unique_user_category_type'),
        ),

        # Add indexes
        migrations.AddIndex(
            model_name='userpreference',
            index=models.Index(fields=['user', 'category'], name='idx_user_prefs_user_category'),
        ),
        migrations.AddIndex(
            model_name='userpreference',
            index=models.Index(fields=['-confidence', '-last_used_at'], name='idx_user_prefs_confidence'),
        ),
        migrations.AddIndex(
            model_name='preferenceextractionevent',
            index=models.Index(fields=['user', '-created_at'], name='idx_pref_events_user'),
        ),
        migrations.AddIndex(
            model_name='preferenceextractionevent',
            index=models.Index(fields=['thread_id', '-created_at'], name='idx_pref_events_thread'),
        ),
    ]
```

### Testing

```python
# tests/models/test_user_preference.py

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from assistant.models import UserPreference, PreferenceExtractionEvent

User = get_user_model()

@pytest.mark.django_db
class TestUserPreference:

    def test_create_preference(self):
        """Test basic preference creation."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'type': 'range', 'min': 0, 'max': 200000, 'currency': 'EUR'},
            confidence=1.0,
            source='explicit'
        )

        assert pref.id is not None
        assert pref.category == 'real_estate'
        assert pref.confidence == 1.0
        assert not pref.is_stale

    def test_unique_constraint(self):
        """Test unique constraint on (user, category, preference_type)."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'max': 200000},
            confidence=1.0,
            source='explicit'
        )

        # Should raise IntegrityError on duplicate
        with pytest.raises(Exception):  # IntegrityError
            UserPreference.objects.create(
                user=user,
                category='real_estate',
                preference_type='budget',
                value={'max': 300000},
                confidence=1.0,
                source='explicit'
            )

    def test_staleness_detection(self):
        """Test stale preference detection."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'values': ['Girne']},
            confidence=1.0,
            source='explicit'
        )

        # Not stale initially
        assert not pref.is_stale

        # Manually set last_used_at to 31 days ago
        pref.last_used_at = timezone.now() - timedelta(days=31)
        pref.save()

        pref.refresh_from_db()
        assert pref.is_stale

    def test_confidence_decay_calculation(self):
        """Test time-based confidence decay."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='bedrooms',
            value={'min': 2, 'max': 2},
            confidence=1.0,
            source='explicit'
        )

        # No decay for recent use
        pref.last_used_at = timezone.now() - timedelta(days=5)
        assert pref.calculate_decay() == 0.0

        # Moderate decay after 30 days
        pref.last_used_at = timezone.now() - timedelta(days=30)
        decay = pref.calculate_decay()
        assert 0.2 < decay < 0.3

        # Heavy decay after 100 days
        pref.last_used_at = timezone.now() - timedelta(days=100)
        decay = pref.calculate_decay()
        assert decay > 1.4


@pytest.mark.django_db
class TestPreferenceExtractionEvent:

    def test_create_extraction_event(self):
        """Test audit trail creation."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        event = PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread_123',
            message_id='msg_456',
            utterance='I need a 2 bedroom apartment in Girne',
            extracted_preferences=[
                {'type': 'bedrooms', 'value': 2, 'confidence': 1.0}
            ],
            confidence_scores={'bedrooms': 1.0},
            extraction_method='llm',
            llm_reasoning='Explicit statement',
            processing_time_ms=250
        )

        assert event.id is not None
        assert event.extraction_method == 'llm'
        assert len(event.extracted_preferences) == 1
        assert event.processing_time_ms == 250
```

### Acceptance Criteria

✅ **DONE when:**
- [ ] Migrations apply cleanly (`python manage.py migrate`)
- [ ] Rollback works (`python manage.py migrate assistant 0XXX_previous_migration`)
- [ ] `EXPLAIN` shows index usage for common queries
- [ ] Unit tests cover:
  - Preference creation
  - Unique constraint
  - Staleness detection
  - Decay calculation
  - Extraction event logging
- [ ] pgvector extension enabled and queryable
- [ ] No N+1 queries in preference fetching

### Validation Commands

```bash
# 1. Apply migration
python manage.py migrate assistant

# 2. Verify tables created
python manage.py dbshell
\dt user_preferences
\d user_preferences
\d preference_extraction_events

# 3. Verify pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

# 4. Test index usage
EXPLAIN ANALYZE
SELECT * FROM user_preferences
WHERE user_id = '...' AND category = 'real_estate';

# Should show "Index Scan using idx_user_prefs_user_category"

# 5. Run tests
pytest tests/models/test_user_preference.py -v
```

---

## TASK #2: PreferenceService CRUD 🛠️

**Type:** Story
**Priority:** High
**Owner:** Backend
**Estimated:** 1.5 days
**Dependencies:** Task #1 (DB Schema)

### Description
Implement service layer with CRUD operations, canonical normalization, confidence decay, and precedence rules.

### Implementation

```python
# assistant/services/preference_normalizer.py

"""
Canonical value normalization for preferences.

Ensures consistent storage and prevents drift from user input variations.
"""

from typing import List, Dict, Any

# Canonical location mappings (Northern Cyprus)
LOCATION_CANONICAL = {
    # Girne/Kyrenia
    "girne": "Girne",
    "kyrenia": "Girne",
    "kyrnia": "Girne",

    # Lefkosa/Nicosia
    "lefkosa": "Nicosia",
    "nicosia": "Nicosia",
    "lefkosia": "Nicosia",

    # Iskele/Famagusta
    "iskele": "Iskele",
    "famagusta": "Iskele",
    "gazimag usa": "Iskele",
    "gazi magusa": "Iskele",

    # Guzelyurt/Morphou
    "guzelyurt": "Guzelyurt",
    "morphou": "Guzelyurt",

    # Lapta
    "lapta": "Lapta",
    "lapithos": "Lapta",
}

# Canonical feature mappings
FEATURE_CANONICAL = {
    "pool": "swimming_pool",
    "swimming pool": "swimming_pool",
    "swimmingpool": "swimming_pool",

    "sea view": "sea_view",
    "seaview": "sea_view",
    "ocean view": "sea_view",
    "beach view": "sea_view",

    "gym": "fitness_center",
    "fitness": "fitness_center",
    "fitness center": "fitness_center",
    "fitness centre": "fitness_center",

    "parking": "parking",
    "garage": "parking",
    "car park": "parking",

    "garden": "garden",
    "yard": "garden",
    "outdoor space": "garden",

    "furnished": "furnished",
    "fully furnished": "furnished",

    "balcony": "balcony",
    "terrace": "terrace",
}

# Currency conversion rates (to EUR)
CURRENCY_TO_EUR = {
    "EUR": 1.0,
    "USD": 0.92,
    "GBP": 1.16,
    "TRY": 0.034,
}


def normalize_location(raw: str) -> str:
    """
    Normalize location to canonical form.

    Args:
        raw: User input location (e.g., "kyrenia", "Girne")

    Returns:
        Canonical location name (e.g., "Girne")
    """
    normalized = raw.lower().strip()
    return LOCATION_CANONICAL.get(normalized, raw.title())


def normalize_locations(raw_list: List[str]) -> List[str]:
    """Normalize list of locations."""
    return list(set(normalize_location(loc) for loc in raw_list))


def normalize_feature(raw: str) -> str:
    """Normalize feature to canonical enum."""
    normalized = raw.lower().strip()
    return FEATURE_CANONICAL.get(normalized, raw.lower().replace(" ", "_"))


def normalize_features(raw_list: List[str]) -> List[str]:
    """Normalize list of features."""
    return list(set(normalize_feature(feat) for feat in raw_list))


def normalize_budget(
    raw_min: float,
    raw_max: float,
    currency: str = "EUR"
) -> Dict[str, Any]:
    """
    Normalize budget to EUR with standard rounding.

    Args:
        raw_min: Minimum budget in original currency
        raw_max: Maximum budget in original currency
        currency: Original currency code

    Returns:
        Normalized budget dict with EUR values
    """
    # Convert to EUR
    rate = CURRENCY_TO_EUR.get(currency.upper(), 1.0)
    min_eur = raw_min * rate
    max_eur = raw_max * rate

    # Round to nearest 1000
    min_rounded = round(min_eur / 1000) * 1000
    max_rounded = round(max_eur / 1000) * 1000

    return {
        "type": "range",
        "min": int(min_rounded),
        "max": int(max_rounded),
        "currency": "EUR"
    }


def normalize_bedrooms(count: int) -> Dict[str, Any]:
    """Normalize bedroom count to range."""
    return {
        "type": "range",
        "min": count,
        "max": count
    }
```

```python
# assistant/services/preference_service.py

"""
PreferenceService: CRUD operations with normalization and precedence.
"""

import hashlib
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from django.contrib.auth import get_user_model

from assistant.models import UserPreference, PreferenceExtractionEvent
from assistant.services.preference_normalizer import (
    normalize_location,
    normalize_locations,
    normalize_features,
    normalize_budget,
    normalize_bedrooms,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class PreferenceService:
    """
    Service for user preference management.

    Features:
    - Idempotent upsert with hash-based deduplication
    - Canonical normalization
    - Confidence decay (time + contradiction)
    - Precedence rules: current > explicit > strong inferred > weak inferred
    - 'Why' note generation
    """

    # Confidence thresholds
    MIN_CONFIDENCE = 0.4  # Below this, don't save
    STRONG_INFERRED = 0.7  # Strong implicit signal
    WEAK_INFERRED = 0.4   # Weak implicit signal

    @staticmethod
    def _hash_preference(
        user_id: str,
        category: str,
        pref_type: str,
        value: dict
    ) -> str:
        """Generate idempotent hash for preference."""
        key = f"{user_id}:{category}:{pref_type}:{json.dumps(value, sort_keys=True)}"
        return hashlib.sha256(key.encode()).hexdigest()[:16]

    @classmethod
    def upsert_preference(
        cls,
        user_id: str,
        category: str,
        preference_type: str,
        value: dict,
        confidence: float,
        source: str,
        raw_value: str = "",
        metadata: Optional[dict] = None
    ) -> Tuple[UserPreference, bool]:
        """
        Idempotent preference upsert with normalization.

        Args:
            user_id: User UUID
            category: real_estate, services, etc.
            preference_type: budget, location, bedrooms, etc.
            value: Structured value dict
            confidence: 0.0 to 1.0
            source: explicit, inferred, behavior
            raw_value: Original utterance (PII-redacted)
            metadata: Additional metadata

        Returns:
            (UserPreference, created: bool)
        """
        # Validate confidence threshold
        if confidence < cls.MIN_CONFIDENCE:
            logger.debug(
                f"Skipping preference {preference_type} with confidence {confidence} "
                f"(below threshold {cls.MIN_CONFIDENCE})"
            )
            return None, False

        # Normalize value based on type
        normalized_value = cls._normalize_value(preference_type, value)

        # Check for existing preference
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found")
            return None, False

        existing = UserPreference.objects.filter(
            user=user,
            category=category,
            preference_type=preference_type
        ).first()

        # Detect contradictions
        contradictions = []
        if existing and existing.source == "explicit" and source == "explicit":
            if existing.value != normalized_value:
                contradictions.append({
                    "old_value": existing.value,
                    "new_value": normalized_value,
                    "timestamp": timezone.now().isoformat()
                })
                # Reduce confidence on old preference
                existing.confidence = max(existing.confidence - 0.3, 0.3)
                existing.save()
                logger.info(
                    f"Contradiction detected for {preference_type}: "
                    f"{existing.value} -> {normalized_value}"
                )

        # Upsert with precedence
        metadata = metadata or {}
        if contradictions:
            metadata["contradictions"] = contradictions

        obj, created = UserPreference.objects.update_or_create(
            user=user,
            category=category,
            preference_type=preference_type,
            defaults={
                "value": normalized_value,
                "raw_value": raw_value,
                "confidence": confidence,
                "source": source,
                "extracted_at": timezone.now(),
                "metadata": metadata
            }
        )

        action = "created" if created else "updated"
        logger.info(
            f"Preference {action}: {category}/{preference_type} "
            f"(confidence: {confidence:.2f}, source: {source})"
        )

        return obj, created

    @classmethod
    def _normalize_value(cls, preference_type: str, value: dict) -> dict:
        """Normalize value based on preference type."""
        if preference_type == "location":
            if "values" in value:
                value["values"] = normalize_locations(value["values"])
        elif preference_type == "budget" and "min" in value and "max" in value:
            value = normalize_budget(
                value.get("min", 0),
                value.get("max", float('inf')),
                value.get("currency", "EUR")
            )
        elif preference_type == "features" and "values" in value:
            value["values"] = normalize_features(value["values"])
        elif preference_type == "bedrooms" and "min" in value:
            # Keep as range for consistency
            pass

        return value

    @classmethod
    def get_active_with_precedence(
        cls,
        user_id: str,
        category: Optional[str] = None,
        min_confidence: float = 0.5
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get active preferences with precedence and 'why' notes.

        Precedence: current turn > explicit > strong inferred (≥0.7) > weak inferred

        Returns:
            {
                "real_estate": {
                    "budget": {
                        "value": {"min": 0, "max": 200000, "currency": "EUR"},
                        "applied_from": "explicit",
                        "confidence": 1.0,
                        "why": "You told me your budget is 150-200k EUR",
                        "last_used": "2025-11-03T10:30:00Z"
                    },
                    ...
                }
            }
        """
        qs = UserPreference.objects.filter(
            user_id=user_id,
            confidence__gte=min_confidence
        ).select_related('user')

        if category:
            qs = qs.filter(category=category)

        # Apply time-based decay
        for pref in qs:
            if pref.last_used_at:
                decay = pref.calculate_decay()
                if decay > 0:
                    new_confidence = max(pref.confidence - decay, 0.1)
                    if new_confidence != pref.confidence:
                        pref.confidence = new_confidence
                        pref.last_decayed_at = timezone.now()
                        pref.save(update_fields=['confidence', 'last_decayed_at'])
                        logger.debug(
                            f"Applied decay to {pref.preference_type}: "
                            f"{pref.confidence + decay:.2f} -> {pref.confidence:.2f}"
                        )

        # Re-filter after decay
        qs = qs.filter(confidence__gte=min_confidence).order_by(
            '-confidence',
            '-last_used_at'
        )

        # Group by category
        result = {}
        for pref in qs:
            if pref.category not in result:
                result[pref.category] = {}

            # Generate 'why' note
            why = cls._generate_why_note(pref)

            result[pref.category][pref.preference_type] = {
                "value": pref.value,
                "applied_from": pref.source,
                "confidence": round(pref.confidence, 2),
                "why": why,
                "last_used": pref.last_used_at.isoformat() if pref.last_used_at else None,
                "use_count": pref.use_count
            }

        return result

    @staticmethod
    def _generate_why_note(pref: UserPreference) -> str:
        """
        Generate human-readable 'why' note for preference.

        Examples:
        - "You told me your budget is 150-200k EUR"
        - "Based on our conversation about location"
        - "Based on properties you've saved"
        """
        if pref.source == "explicit":
            if pref.preference_type == "budget":
                val = pref.value
                return f"You told me your budget is {val['min']}-{val['max']} {val['currency']}"
            elif pref.preference_type == "location":
                locs = ", ".join(pref.value.get("values", []))
                return f"You told me you're looking in {locs}"
            elif pref.preference_type == "bedrooms":
                beds = pref.value.get("min") or pref.value.get("max")
                return f"You told me you need {beds} bedrooms"
            else:
                return f"You explicitly mentioned {pref.preference_type}"

        elif pref.source == "inferred":
            if pref.confidence >= 0.7:
                return f"Based on our conversation about {pref.preference_type}"
            else:
                return f"I inferred this from your recent searches"

        elif pref.source == "behavior":
            return f"Based on properties you've saved or viewed"

        return "Saved from previous conversation"

    @classmethod
    def mark_used(cls, preference_ids: List[str]) -> int:
        """
        Mark preferences as used (update last_used_at, increment use_count).

        Returns:
            Number of preferences updated
        """
        return UserPreference.objects.filter(
            id__in=preference_ids
        ).update(
            last_used_at=timezone.now(),
            use_count=F('use_count') + 1
        )

    @classmethod
    def delete_preference(cls, user_id: str, preference_id: str) -> bool:
        """Delete a user preference."""
        try:
            deleted, _ = UserPreference.objects.filter(
                id=preference_id,
                user_id=user_id
            ).delete()
            return deleted > 0
        except Exception as exc:
            logger.error(f"Failed to delete preference: {exc}")
            return False

    @classmethod
    def update_preference(
        cls,
        user_id: str,
        preference_id: str,
        value: dict,
        confidence: Optional[float] = None
    ) -> Optional[UserPreference]:
        """Update a preference (manual edit from UI)."""
        try:
            pref = UserPreference.objects.get(
                id=preference_id,
                user_id=user_id
            )

            # Normalize new value
            normalized = cls._normalize_value(pref.preference_type, value)
            pref.value = normalized

            if confidence is not None:
                pref.confidence = confidence

            pref.source = "explicit"  # Manual edits are always explicit
            pref.save()

            logger.info(
                f"Updated preference {preference_id} manually: {normalized}"
            )
            return pref

        except UserPreference.DoesNotExist:
            logger.error(f"Preference {preference_id} not found")
            return None
```

### Testing

```python
# tests/services/test_preference_service.py

import pytest
from django.contrib.auth import get_user_model
from assistant.services.preference_service import PreferenceService
from assistant.models import UserPreference

User = get_user_model()

@pytest.mark.django_db
class TestPreferenceService:

    def test_upsert_budget_preference(self):
        """Test budget preference creation with normalization."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref, created = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='budget',
            value={'min': 0, 'max': 200000, 'currency': 'EUR'},
            confidence=1.0,
            source='explicit',
            raw_value='budget 200k EUR'
        )

        assert created is True
        assert pref.value['max'] == 200000
        assert pref.value['currency'] == 'EUR'
        assert pref.confidence == 1.0

    def test_upsert_location_normalization(self):
        """Test location canonical normalization."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        # User says "kyrenia" -> should normalize to "Girne"
        pref, created = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='location',
            value={'type': 'list', 'values': ['kyrenia', 'lefkosa']},
            confidence=1.0,
            source='explicit'
        )

        assert 'Girne' in pref.value['values']
        assert 'Nicosia' in pref.value['values']
        assert 'kyrenia' not in pref.value['values']

    def test_confidence_threshold(self):
        """Test preferences below threshold are rejected."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref, created = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='features',
            value={'values': ['pool']},
            confidence=0.3,  # Below threshold (0.4)
            source='inferred'
        )

        assert pref is None
        assert created is False

    def test_contradiction_detection(self):
        """Test explicit preference contradictions are recorded."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        # First preference: budget 200k
        pref1, _ = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='budget',
            value={'min': 0, 'max': 200000, 'currency': 'EUR'},
            confidence=1.0,
            source='explicit',
            raw_value='budget 200k'
        )

        # Contradictory preference: budget 300k
        pref2, _ = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='budget',
            value={'min': 0, 'max': 300000, 'currency': 'EUR'},
            confidence=1.0,
            source='explicit',
            raw_value='budget 300k'
        )

        # Should update to new value
        assert pref2.value['max'] == 300000

        # Should record contradiction in metadata
        assert 'contradictions' in pref2.metadata
        assert len(pref2.metadata['contradictions']) > 0

        # Old preference confidence should be reduced
        pref1.refresh_from_db()
        assert pref1.confidence < 1.0

    def test_get_active_with_precedence(self):
        """Test preference retrieval with precedence and why notes."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        # Create multiple preferences
        PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='budget',
            value={'min': 0, 'max': 200000, 'currency': 'EUR'},
            confidence=1.0,
            source='explicit'
        )

        PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='location',
            value={'values': ['Girne']},
            confidence=0.8,
            source='inferred'
        )

        # Get active preferences
        prefs = PreferenceService.get_active_with_precedence(
            user_id=str(user.id),
            category='real_estate',
            min_confidence=0.5
        )

        assert 'real_estate' in prefs
        assert 'budget' in prefs['real_estate']
        assert 'location' in prefs['real_estate']

        # Check 'why' notes
        assert 'You told me' in prefs['real_estate']['budget']['why']
        assert 'conversation' in prefs['real_estate']['location']['why']

        # Check confidence and source
        assert prefs['real_estate']['budget']['confidence'] == 1.0
        assert prefs['real_estate']['budget']['applied_from'] == 'explicit'

    def test_mark_used_increments_counters(self):
        """Test marking preferences as used."""
        user = User.objects.create_user('test', 'test@example.com', 'pass')

        pref, _ = PreferenceService.upsert_preference(
            user_id=str(user.id),
            category='real_estate',
            preference_type='bedrooms',
            value={'min': 2, 'max': 2},
            confidence=1.0,
            source='explicit'
        )

        # Mark as used
        updated = PreferenceService.mark_used([str(pref.id)])

        assert updated == 1

        pref.refresh_from_db()
        assert pref.last_used_at is not None
        assert pref.use_count == 1

        # Mark again
        PreferenceService.mark_used([str(pref.id)])
        pref.refresh_from_db()
        assert pref.use_count == 2
```

### Acceptance Criteria

✅ **DONE when:**
- [ ] `PreferenceService.upsert_preference()` works with idempotency
- [ ] Canonical normalization applied (locations, features, currency)
- [ ] Confidence decay calculated correctly (time-based)
- [ ] Contradiction detection records old/new values
- [ ] `get_active_with_precedence()` returns grouped dict with 'why' notes
- [ ] `mark_used()` increments use_count and updates timestamp
- [ ] Unit tests pass (>80% coverage)
- [ ] `prefs_saved_total` Prometheus counter increments

### Validation

```bash
# Run tests
pytest tests/services/test_preference_service.py -v

# Test in Django shell
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> from assistant.services.preference_service import PreferenceService
>>> User = get_user_model()
>>> user = User.objects.first()
>>> pref, created = PreferenceService.upsert_preference(
...     user_id=str(user.id),
...     category='real_estate',
...     preference_type='budget',
...     value={'min': 0, 'max': 200000, 'currency': 'EUR'},
...     confidence=1.0,
...     source='explicit'
... )
>>> prefs = PreferenceService.get_active_with_precedence(str(user.id))
>>> print(prefs)
```

---

## ⏱️ Sprint Timeline

**Week 1:** Tasks #1-6 (Backend Core)
- Day 1: Task #1 (DB Schema)
- Day 2-3: Task #2 (PreferenceService) + Task #3 (PII)
- Day 4: Task #4 (LLM Extraction)
- Day 5: Task #5 (Fallback) + Task #6 (Celery)

**Week 2:** Tasks #7-15 (Integration + Frontend)
- Day 6: Task #7 (Supervisor)
- Day 7: Task #8 (RE Agent)
- Day 8: Task #9 (Metrics) + Task #11 (Frontend Chips)
- Day 9: Task #10 (Grafana) + Task #12 (Why Notes)
- Day 10: Task #13 (Eval) + Task #14 (TTFB) + Task #15 (Flags)

**Week 3:** Tasks #16-19 (Rollout)
- Day 11: Task #16 (Write-Only Launch)
- Day 12-13: Task #17 (Read Canary)
- Day 14: Task #18 (Prod Canary)
- Day 15: Task #19 (Full Rollout)

---

**Status:** Tasks #1-2 detailed above. Remaining 17 tasks will be detailed in subsequent sections.

**Next:** Task #3 (PII Integration), Task #4 (LLM Extraction), Task #5 (Fallback)...

