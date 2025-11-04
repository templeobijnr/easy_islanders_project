"""
Unit tests for PreferenceService.

Tests cover:
- Canonical normalization (locations, budgets, features)
- Idempotent upsert with hash-based deduplication
- Precedence rules (current > explicit > strong inferred > weak inferred)
- "Why" note generation
- Contradiction detection
- Time-based confidence decay
- CRUD operations
"""

import uuid
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from assistant.models import UserPreference
from assistant.services import PreferenceService

User = get_user_model()


@pytest.mark.django_db
class TestCanonicalNormalization:
    """Test canonical normalization methods."""

    def test_normalize_location_kyrenia(self):
        """Test Kyrenia -> Girne normalization."""
        assert PreferenceService.normalize_location('Kyrenia') == 'Girne'
        assert PreferenceService.normalize_location('kyrenia') == 'Girne'
        assert PreferenceService.normalize_location('KYRENIA') == 'Girne'

    def test_normalize_location_famagusta(self):
        """Test Famagusta -> Gazimağusa normalization."""
        assert PreferenceService.normalize_location('Famagusta') == 'Gazimağusa'
        assert PreferenceService.normalize_location('famagusta') == 'Gazimağusa'

    def test_normalize_location_unknown(self):
        """Test unknown location stays as title case."""
        assert PreferenceService.normalize_location('Lapta') == 'Lapta'
        assert PreferenceService.normalize_location('lapta') == 'Lapta'

    def test_normalize_budget_eur_to_usd(self):
        """Test EUR to USD budget normalization."""
        result = PreferenceService.normalize_budget({
            'min': 100000,
            'max': 500000,
            'currency': 'EUR'
        })

        assert result['currency'] == 'USD'
        assert result['min'] == 110000  # 100k * 1.1
        assert result['max'] == 550000  # 500k * 1.1

    def test_normalize_budget_gbp_to_usd(self):
        """Test GBP to USD budget normalization."""
        result = PreferenceService.normalize_budget({
            'min': 100000,
            'max': 200000,
            'currency': 'GBP'
        })

        assert result['currency'] == 'USD'
        assert result['min'] == 127000  # 100k * 1.27
        assert result['max'] == 254000  # 200k * 1.27

    def test_normalize_budget_usd_unchanged(self):
        """Test USD budget remains unchanged."""
        result = PreferenceService.normalize_budget({
            'min': 100000,
            'max': 500000,
            'currency': 'USD'
        })

        assert result['currency'] == 'USD'
        assert result['min'] == 100000
        assert result['max'] == 500000

    def test_normalize_features(self):
        """Test feature normalization."""
        result = PreferenceService.normalize_features([
            'swimming pool',
            'Sea View',
            'garden',
            'PARKING'
        ])

        assert 'pool' in result
        assert 'sea_view' in result
        assert 'garden' in result
        assert 'parking' in result
        assert len(result) == 4

    def test_normalize_features_deduplication(self):
        """Test feature deduplication."""
        result = PreferenceService.normalize_features([
            'pool',
            'swimming pool',
            'swimmingpool'
        ])

        # All should normalize to 'pool' and be deduplicated
        assert result == ['pool']


@pytest.mark.django_db
class TestPrecedenceRules:
    """Test precedence rules system."""

    @pytest.fixture
    def user(self):
        """Create test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    @pytest.fixture
    def explicit_pref(self, user):
        """Create explicit preference."""
        return UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 300000, 'currency': 'USD'},
            confidence=0.95,
            source='explicit',
        )

    def test_precedence_no_existing(self):
        """Test precedence when no existing preference."""
        should_update, reason = PreferenceService.apply_precedence(
            existing=None,
            new_value={'min': 200000},
            new_confidence=0.8,
            new_source='inferred',
        )

        assert should_update is True
        assert reason == "No existing preference"

    def test_precedence_current_turn_wins(self, explicit_pref):
        """Test current turn always overrides."""
        should_update, reason = PreferenceService.apply_precedence(
            existing=explicit_pref,
            new_value={'min': 200000},
            new_confidence=0.7,
            new_source='current_turn',
        )

        assert should_update is True
        assert "Current turn" in reason

    def test_precedence_explicit_over_inferred(self, user):
        """Test explicit overrides inferred."""
        inferred_pref = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Girne'},
            confidence=0.8,
            source='inferred',
        )

        should_update, reason = PreferenceService.apply_precedence(
            existing=inferred_pref,
            new_value={'city': 'Lefkoşa'},
            new_confidence=0.9,
            new_source='explicit',
        )

        assert should_update is True
        assert "Explicit" in reason

    def test_precedence_inferred_not_over_explicit(self, explicit_pref):
        """Test inferred doesn't override explicit."""
        should_update, reason = PreferenceService.apply_precedence(
            existing=explicit_pref,
            new_value={'min': 200000},
            new_confidence=0.9,
            new_source='inferred',
        )

        assert should_update is False
        assert "doesn't override explicit" in reason

    def test_precedence_higher_confidence_same_source(self, user):
        """Test higher confidence wins with same source."""
        weak_inferred = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='bedrooms',
            value={'count': 2},
            confidence=0.6,
            source='inferred',
        )

        should_update, reason = PreferenceService.apply_precedence(
            existing=weak_inferred,
            new_value={'count': 3},
            new_confidence=0.85,
            new_source='inferred',
        )

        assert should_update is True
        assert "Higher confidence" in reason

    def test_precedence_strong_over_weak_inferred(self, user):
        """Test strong inferred (≥0.7) overrides weak inferred."""
        weak_inferred = UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='features',
            value=['pool'],
            confidence=0.5,
            source='inferred',
        )

        should_update, reason = PreferenceService.apply_precedence(
            existing=weak_inferred,
            new_value=['pool', 'garden'],
            new_confidence=0.75,
            new_source='inferred',
        )

        assert should_update is True
        # Higher confidence with same source triggers first
        assert "Higher confidence" in reason or "Strong inferred" in reason


@pytest.mark.django_db
class TestWhyNoteGeneration:
    """Test 'why' note generation."""

    def test_why_note_explicit_with_raw(self):
        """Test 'why' note for explicit preference with raw value."""
        note = PreferenceService.generate_why_note(
            preference_type='budget',
            value={'min': 100000, 'max': 500000},
            confidence=0.95,
            source='explicit',
            raw_value='I want a budget between 100k and 500k',
        )

        assert 'explicitly stated' in note.lower()
        assert 'I want a budget between 100k and 500k' in note
        assert '95%' in note

    def test_why_note_strong_inferred(self):
        """Test 'why' note for strong inferred preference."""
        note = PreferenceService.generate_why_note(
            preference_type='location',
            value={'city': 'Girne'},
            confidence=0.85,
            source='inferred',
        )

        assert 'inferred' in note.lower()
        assert 'strong' in note.lower()
        assert '85%' in note

    def test_why_note_weak_inferred(self):
        """Test 'why' note for weak inferred preference."""
        note = PreferenceService.generate_why_note(
            preference_type='bedrooms',
            value={'count': 2},
            confidence=0.55,
            source='inferred',
        )

        assert 'inferred' in note.lower()
        assert 'moderate' in note.lower()
        assert '55%' in note

    def test_why_note_behavior(self):
        """Test 'why' note for behavioral preference."""
        note = PreferenceService.generate_why_note(
            preference_type='features',
            value=['pool', 'garden'],
            confidence=0.75,
            source='behavior',
        )

        assert 'behavior' in note.lower() or 'browsing' in note.lower()
        assert '75%' in note


@pytest.mark.django_db
class TestContradictionDetection:
    """Test contradiction detection."""

    @pytest.fixture
    def user(self):
        """Create test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_budget_contradiction_non_overlapping(self, user):
        """Test budget contradiction for non-overlapping ranges."""
        UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 300000, 'currency': 'USD'},
            confidence=0.9,
            source='explicit',
        )

        contradictions = PreferenceService.detect_contradiction(
            user=user,
            category='real_estate',
            preference_type='budget',
            new_value={'min': 400000, 'max': 600000, 'currency': 'USD'},
        )

        assert len(contradictions) == 1
        assert contradictions[0]['field'] == 'budget'
        assert 'increased significantly' in contradictions[0]['reason'].lower()

    def test_budget_no_contradiction_overlapping(self, user):
        """Test no contradiction for overlapping budget ranges."""
        UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 300000, 'currency': 'USD'},
            confidence=0.9,
            source='explicit',
        )

        contradictions = PreferenceService.detect_contradiction(
            user=user,
            category='real_estate',
            preference_type='budget',
            new_value={'min': 200000, 'max': 500000, 'currency': 'USD'},
        )

        assert len(contradictions) == 0

    def test_location_contradiction(self, user):
        """Test location contradiction."""
        UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Girne', 'region': 'North Cyprus'},
            confidence=0.9,
            source='explicit',
        )

        contradictions = PreferenceService.detect_contradiction(
            user=user,
            category='real_estate',
            preference_type='location',
            new_value={'city': 'Lefkoşa', 'region': 'North Cyprus'},
        )

        assert len(contradictions) == 1
        assert contradictions[0]['field'] == 'location'
        assert 'girne' in contradictions[0]['reason'].lower()
        assert 'lefkoşa' in contradictions[0]['reason'].lower()

    def test_bedrooms_contradiction(self, user):
        """Test bedrooms contradiction."""
        UserPreference.objects.create(
            user=user,
            category='real_estate',
            preference_type='bedrooms',
            value={'count': 2},
            confidence=0.9,
            source='explicit',
        )

        contradictions = PreferenceService.detect_contradiction(
            user=user,
            category='real_estate',
            preference_type='bedrooms',
            new_value={'count': 4},
        )

        assert len(contradictions) == 1
        assert contradictions[0]['field'] == 'bedrooms'
        assert '2' in contradictions[0]['reason']
        assert '4' in contradictions[0]['reason']


@pytest.mark.django_db
class TestUpsertPreference:
    """Test idempotent upsert functionality."""

    @pytest.fixture
    def user(self):
        """Create test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_upsert_create_new(self, user):
        """Test creating new preference."""
        pref, created, reason = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 500000, 'currency': 'USD'},
            confidence=0.9,
            source='explicit',
            raw_value='I want a budget between 100k and 500k',
        )

        assert created is True
        assert "Created" in reason
        assert pref.value == {'min': 100000, 'max': 500000, 'currency': 'USD'}
        assert pref.confidence == 0.9
        assert pref.source == 'explicit'
        assert 'why' in pref.metadata
        assert 'explicitly stated' in pref.metadata['why'].lower()

    def test_upsert_update_existing_higher_confidence(self, user):
        """Test updating existing preference with higher confidence."""
        # Create initial preference
        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 300000, 'currency': 'USD'},
            confidence=0.7,
            source='inferred',
        )

        # Update with higher confidence
        pref, created, reason = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 200000, 'max': 500000, 'currency': 'USD'},
            confidence=0.9,
            source='inferred',
        )

        assert created is False
        assert "Updated" in reason
        assert pref.value == {'min': 200000, 'max': 500000, 'currency': 'USD'}
        assert pref.confidence == 0.9

    def test_upsert_no_update_lower_confidence(self, user):
        """Test no update when new confidence is lower."""
        # Create initial preference
        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 300000, 'currency': 'USD'},
            confidence=0.9,
            source='explicit',
        )

        # Try to update with lower confidence
        pref, created, reason = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 200000, 'max': 500000, 'currency': 'USD'},
            confidence=0.7,
            source='inferred',
        )

        assert created is False
        assert "doesn't override" in reason or "kept" in reason.lower()
        # Original value should remain
        assert pref.value == {'min': 100000, 'max': 300000, 'currency': 'USD'}
        assert pref.confidence == 0.9

    def test_upsert_with_location_normalization(self, user):
        """Test upsert with automatic location normalization."""
        pref, created, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Kyrenia', 'region': 'North Cyprus'},
            confidence=0.9,
            source='explicit',
        )

        assert created is True
        # Should be normalized to 'Girne'
        assert pref.value['city'] == 'Girne'

    def test_upsert_with_budget_normalization(self, user):
        """Test upsert with automatic budget normalization."""
        pref, created, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 500000, 'currency': 'EUR'},
            confidence=0.9,
            source='explicit',
        )

        assert created is True
        # Should be normalized to USD
        assert pref.value['currency'] == 'USD'
        assert pref.value['min'] == 110000  # 100k * 1.1
        assert pref.value['max'] == 550000  # 500k * 1.1

    def test_upsert_with_features_normalization(self, user):
        """Test upsert with automatic features normalization."""
        pref, created, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='features',
            value=['swimming pool', 'Sea View', 'garden'],
            confidence=0.85,
            source='explicit',
        )

        assert created is True
        # Should be normalized and sorted
        assert 'pool' in pref.value
        assert 'sea_view' in pref.value
        assert 'garden' in pref.value


@pytest.mark.django_db
class TestCRUDOperations:
    """Test CRUD operations."""

    @pytest.fixture
    def user(self):
        """Create test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_get_preferences_all(self, user):
        """Test getting all preferences."""
        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000, 'max': 500000},
            confidence=0.9,
            source='explicit',
        )

        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Girne'},
            confidence=0.85,
            source='explicit',
        )

        prefs = PreferenceService.get_preferences(user=user)

        assert len(prefs) == 2
        # Should be ordered by confidence desc
        assert prefs[0].confidence >= prefs[1].confidence

    def test_get_preferences_by_category(self, user):
        """Test filtering by category."""
        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        PreferenceService.upsert_preference(
            user=user,
            category='services',
            preference_type='provider',
            value={'name': 'ABC Services'},
            confidence=0.8,
            source='explicit',
        )

        prefs = PreferenceService.get_preferences(user=user, category='real_estate')

        assert len(prefs) == 1
        assert prefs[0].category == 'real_estate'

    def test_get_preferences_min_confidence(self, user):
        """Test filtering by minimum confidence."""
        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='location',
            value={'city': 'Girne'},
            confidence=0.5,
            source='inferred',
        )

        prefs = PreferenceService.get_preferences(user=user, min_confidence=0.7)

        assert len(prefs) == 1
        assert prefs[0].confidence >= 0.7

    def test_mark_preference_used(self, user):
        """Test marking preference as used."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        assert pref.use_count == 0
        assert pref.last_used_at is None

        success = PreferenceService.mark_preference_used(str(pref.id))

        assert success is True

        pref.refresh_from_db()
        assert pref.use_count == 1
        assert pref.last_used_at is not None

    def test_delete_preference(self, user):
        """Test deleting preference."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        success = PreferenceService.delete_preference(user=user, preference_id=str(pref.id))

        assert success is True
        assert UserPreference.objects.filter(id=pref.id).count() == 0


@pytest.mark.django_db
class TestConfidenceDecay:
    """Test time-based confidence decay."""

    @pytest.fixture
    def user(self):
        """Create test user."""
        return User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_decay_no_usage(self, user):
        """Test no decay when never used."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        count = PreferenceService.apply_confidence_decay(user=user)

        assert count == 0
        pref.refresh_from_db()
        assert pref.confidence == 0.9  # Unchanged

    def test_decay_7_30_days(self, user):
        """Test decay for 7-30 day range."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        # Set last_used_at to 15 days ago
        pref.last_used_at = timezone.now() - timedelta(days=15)
        pref.save()

        count = PreferenceService.apply_confidence_decay(user=user)

        assert count == 1
        pref.refresh_from_db()
        # 15 days - 7 grace = 8 days * 0.01 = 0.08 decay
        expected = 0.9 - 0.08
        assert abs(pref.confidence - expected) < 0.01

    def test_decay_30_90_days(self, user):
        """Test decay for 30-90 day range."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.9,
            source='explicit',
        )

        # Set last_used_at to 60 days ago
        pref.last_used_at = timezone.now() - timedelta(days=60)
        pref.save()

        count = PreferenceService.apply_confidence_decay(user=user)

        assert count == 1
        pref.refresh_from_db()
        # 0.23 (7-30) + (60-30)*0.02 = 0.23 + 0.60 = 0.83 decay
        expected = 0.9 - 0.83
        assert abs(pref.confidence - expected) < 0.01

    def test_decay_floor_at_zero(self, user):
        """Test decay doesn't go below 0.0."""
        pref, _, _ = PreferenceService.upsert_preference(
            user=user,
            category='real_estate',
            preference_type='budget',
            value={'min': 100000},
            confidence=0.2,
            source='inferred',
        )

        # Set last_used_at to 100 days ago (huge decay)
        pref.last_used_at = timezone.now() - timedelta(days=100)
        pref.save()

        count = PreferenceService.apply_confidence_decay(user=user)

        assert count == 1
        pref.refresh_from_db()
        # Should be floored at 0.0
        assert pref.confidence == 0.0
