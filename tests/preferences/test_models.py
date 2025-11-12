"""
Unit tests for UserPreference and PreferenceExtractionEvent models.

Tests cover:
- Model creation and validation
- Confidence decay calculation
- Staleness detection
- Unique constraints
- Serialization (to_dict)
- VectorField storage
"""

import uuid
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone

from assistant.models import PreferenceExtractionEvent
from users.models import UserPreference

User = get_user_model()


@pytest.mark.django_db
class TestUserPreferenceModel:
    """Test UserPreference model behavior."""

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    @pytest.fixture
    def preference(self, user):
        """Create a test preference."""
        return UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 500000, 'currency': 'USD'},
            raw_value='I want a property between 100k and 500k USD',
            confidence=0.9,
            source='explicit',
        )

    def test_create_preference(self, user):
        """Test creating a basic preference."""
        pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Girne', 'region': 'North Cyprus'},
            confidence=0.95,
            source='explicit',
        )

        assert pref.id is not None
        assert pref.user == user
        assert pref.category == 'real_estate'
        assert pref.preference_type == 'location'
        assert pref.value == {'city': 'Girne', 'region': 'North Cyprus'}
        assert pref.confidence == 0.95
        assert pref.source == 'explicit'
        assert pref.schema_version == 1
        assert pref.use_count == 0
        assert pref.metadata == {}

    def test_unique_constraint(self, user, preference):
        """Test unique constraint on (user, category, preference_type)."""
        with pytest.raises(IntegrityError):
            UserPreference.objects.create(
                user=user,
                category='real_estate',
                preference_type='budget',  # Same as fixture
                value={'min': 200000, 'max': 600000},
                confidence=0.8,
                source='inferred',
            )

    def test_is_stale_no_usage(self, preference):
        """Test is_stale when last_used_at is None."""
        assert preference.last_used_at is None
        assert preference.is_stale is False

    def test_is_stale_recent_usage(self, preference):
        """Test is_stale when last_used_at is recent (< 30 days)."""
        preference.last_used_at = timezone.now() - timedelta(days=20)
        preference.save()
        assert preference.is_stale is False

    def test_is_stale_old_usage(self, preference):
        """Test is_stale when last_used_at is > 30 days ago."""
        preference.last_used_at = timezone.now() - timedelta(days=35)
        preference.save()
        assert preference.is_stale is True

    def test_calculate_decay_no_usage(self, preference):
        """Test decay calculation when never used."""
        assert preference.last_used_at is None
        assert preference.calculate_decay() == 0.0

    def test_calculate_decay_0_7_days(self, preference):
        """Test no decay for 0-7 days."""
        preference.last_used_at = timezone.now() - timedelta(days=5)
        assert preference.calculate_decay() == 0.0

    def test_calculate_decay_7_30_days(self, preference):
        """Test decay for 7-30 days (-0.01 per day)."""
        preference.last_used_at = timezone.now() - timedelta(days=15)
        # 15 days - 7 days grace = 8 days * 0.01 = 0.08
        assert preference.calculate_decay() == pytest.approx(0.08, rel=1e-2)

    def test_calculate_decay_30_90_days(self, preference):
        """Test decay for 30-90 days (-0.02 per day after initial 0.23)."""
        preference.last_used_at = timezone.now() - timedelta(days=60)
        # 0.23 (7-30) + (60-30)*0.02 = 0.23 + 0.60 = 0.83
        assert preference.calculate_decay() == pytest.approx(0.83, rel=1e-2)

    def test_calculate_decay_90_plus_days(self, preference):
        """Test decay for 90+ days (-0.05 per day after initial 1.43)."""
        preference.last_used_at = timezone.now() - timedelta(days=100)
        # 1.43 (0-90) + (100-90)*0.05 = 1.43 + 0.50 = 1.93
        assert preference.calculate_decay() == pytest.approx(1.93, rel=1e-2)

    def test_to_dict(self, preference):
        """Test serialization to dictionary."""
        result = preference.to_dict()

        assert result['id'] == str(preference.id)
        assert result['category'] == 'real_estate'
        assert result['preference_type'] == 'budget'
        assert result['value'] == {'min': 100000, 'max': 500000, 'currency': 'USD'}
        assert result['confidence'] == 0.9
        assert result['source'] == 'explicit'
        assert 'extracted_at' in result
        assert result['last_used_at'] is None
        assert result['use_count'] == 0
        assert result['is_stale'] is False

    def test_to_dict_with_last_used(self, preference):
        """Test serialization with last_used_at set."""
        preference.last_used_at = timezone.now() - timedelta(days=5)
        preference.save()

        result = preference.to_dict()
        assert result['last_used_at'] is not None
        assert 'T' in result['last_used_at']  # ISO format

    def test_embedding_field(self, user):
        """Test storing vector embeddings."""
        # Create a 1536-dimensional embedding (OpenAI ada-002 size)
        embedding = [0.1] * 1536

        pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='features',
            value={'pool': True, 'garden': True},
            confidence=0.85,
            source='explicit',
            embedding=embedding,
        )

        pref.refresh_from_db()
        assert pref.embedding is not None
        assert len(pref.embedding) == 1536

    def test_metadata_json_field(self, user):
        """Test storing arbitrary metadata."""
        pref = UserPreference.objects.create(
            user=user,
            category='services',
            preference_type='provider',
            value={'provider': 'ABC Realty'},
            confidence=0.7,
            source='inferred',
            metadata={
                'extraction_timestamp': '2025-11-03T10:00:00Z',
                'source_message_id': str(uuid.uuid4()),
                'notes': 'Inferred from conversation context',
            }
        )

        pref.refresh_from_db()
        assert pref.metadata['extraction_timestamp'] == '2025-11-03T10:00:00Z'
        assert 'source_message_id' in pref.metadata
        assert pref.metadata['notes'] == 'Inferred from conversation context'


@pytest.mark.django_db
class TestPreferenceExtractionEventModel:
    """Test PreferenceExtractionEvent model behavior."""

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )

    @pytest.fixture
    def event(self, user):
        """Create a test extraction event."""
        return PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread-123',
            message_id=uuid.uuid4(),
            utterance='I need a 2 bedroom apartment in Girne',
            extracted_preferences=[
                {'type': 'bedrooms', 'value': 2, 'confidence': 0.95},
                {'type': 'location', 'value': 'Girne', 'confidence': 0.9},
            ],
            confidence_scores={'bedrooms': 0.95, 'location': 0.9},
            extraction_method='llm',
            llm_reasoning='User explicitly stated bedroom count and location',
            processing_time_ms=150,
        )

    def test_create_extraction_event(self, user):
        """Test creating an extraction event."""
        event = PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread-abc',
            message_id=uuid.uuid4(),
            utterance='I prefer properties with a pool',
            extracted_preferences=[
                {'type': 'features', 'value': ['pool'], 'confidence': 0.85}
            ],
            confidence_scores={'features': 0.85},
            extraction_method='hybrid',
            processing_time_ms=200,
        )

        assert event.id is not None
        assert event.user == user
        assert event.thread_id == 'thread-abc'
        assert event.extraction_method == 'hybrid'
        assert len(event.extracted_preferences) == 1
        assert event.processing_time_ms == 200

    def test_extraction_method_choices(self, user):
        """Test all extraction method choices."""
        methods = ['llm', 'rule', 'hybrid', 'fallback']

        for method in methods:
            event = PreferenceExtractionEvent.objects.create(
                user=user,
                thread_id=f'thread-{method}',
                message_id=uuid.uuid4(),
                utterance='test utterance',
                extracted_preferences=[],
                confidence_scores={},
                extraction_method=method,
            )
            assert event.extraction_method == method

    def test_contradictions_detected(self, user):
        """Test storing contradiction information."""
        event = PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread-contradiction',
            message_id=uuid.uuid4(),
            utterance='I want a budget of 200k, actually make that 500k',
            extracted_preferences=[
                {'type': 'budget', 'value': 500000, 'confidence': 0.8}
            ],
            confidence_scores={'budget': 0.8},
            extraction_method='llm',
            contradictions_detected=[
                {
                    'field': 'budget',
                    'old_value': 200000,
                    'new_value': 500000,
                    'reason': 'User corrected themselves in same utterance',
                }
            ],
        )

        event.refresh_from_db()
        assert len(event.contradictions_detected) == 1
        assert event.contradictions_detected[0]['field'] == 'budget'

    def test_ordering(self, user):
        """Test events are ordered by created_at descending."""
        event1 = PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread-1',
            message_id=uuid.uuid4(),
            utterance='first',
            extracted_preferences=[],
            confidence_scores={},
            extraction_method='llm',
        )

        event2 = PreferenceExtractionEvent.objects.create(
            user=user,
            thread_id='thread-2',
            message_id=uuid.uuid4(),
            utterance='second',
            extracted_preferences=[],
            confidence_scores={},
            extraction_method='llm',
        )

        events = list(PreferenceExtractionEvent.objects.all())
        assert events[0].id == event2.id  # Most recent first
        assert events[1].id == event1.id

    def test_indexes_exist(self, user, event):
        """Test that required indexes exist for fast queries."""
        # This is a smoke test - migrations should have created indexes
        # We can query efficiently by user + created_at
        events = PreferenceExtractionEvent.objects.filter(
            user=user
        ).order_by('-created_at')
        assert events.count() == 1

        # Query by thread_id + created_at
        events = PreferenceExtractionEvent.objects.filter(
            thread_id='thread-123'
        ).order_by('-created_at')
        assert events.count() == 1
