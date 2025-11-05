"""
PreferenceService: CRUD operations for user preferences with canonical normalization.

Implements:
- Idempotent upsert with hash-based deduplication
- Canonical normalization (locations, budgets, features)
- Precedence rules: current turn > explicit > strong inferred (≥0.7) > weak inferred (0.4-0.69)
- "Why" note generation for transparency
- Contradiction detection
- Time-based confidence decay
"""

import hashlib
import json
import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional, Tuple

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from assistant.models import PreferenceExtractionEvent, UserPreference

User = get_user_model()
logger = logging.getLogger(__name__)


class PreferenceService:
    """Service layer for user preference management."""

    # Canonical location mappings (user input -> canonical)
    LOCATION_MAP = {
        'kyrenia': 'Girne',
        'girne': 'Girne',
        'famagusta': 'Gazimağusa',
        'gazimagusa': 'Gazimağusa',
        'nicosia': 'Lefkoşa',
        'lefkosa': 'Lefkoşa',
        'morphou': 'Güzelyurt',
        'guzelyurt': 'Güzelyurt',
        'iskele': 'İskele',
    }

    # Canonical feature mappings
    FEATURE_MAP = {
        'swimming pool': 'pool',
        'swimmingpool': 'pool',
        'pool': 'pool',
        'garden': 'garden',
        'yard': 'garden',
        'parking': 'parking',
        'garage': 'parking',
        'sea view': 'sea_view',
        'seaview': 'sea_view',
        'mountain view': 'mountain_view',
        'mountainview': 'mountain_view',
        'balcony': 'balcony',
        'terrace': 'balcony',
    }

    # Currency conversions to USD (approximate rates)
    CURRENCY_RATES = {
        'USD': 1.0,
        'EUR': 1.1,
        'GBP': 1.27,
        'TRY': 0.037,
        'TL': 0.037,
    }

    @classmethod
    def normalize_location(cls, location: str) -> str:
        """
        Normalize location to canonical form.

        Examples:
            'Kyrenia' -> 'Girne'
            'Famagusta' -> 'Gazimağusa'
        """
        location_lower = location.lower().strip()
        return cls.LOCATION_MAP.get(location_lower, location.title())

    @classmethod
    def normalize_budget(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize budget to USD.

        Input: {'min': 100000, 'max': 500000, 'currency': 'EUR'}
        Output: {'min': 110000, 'max': 550000, 'currency': 'USD'}
        """
        currency = value.get('currency', 'USD').upper()
        rate = cls.CURRENCY_RATES.get(currency, 1.0)

        normalized = {
            'currency': 'USD',
        }

        if 'min' in value:
            normalized['min'] = int(value['min'] * rate)
        if 'max' in value:
            normalized['max'] = int(value['max'] * rate)
        if 'exact' in value:
            normalized['exact'] = int(value['exact'] * rate)

        return normalized

    @classmethod
    def normalize_features(cls, features: List[str]) -> List[str]:
        """
        Normalize features to canonical form.

        Input: ['swimming pool', 'Sea View', 'garden']
        Output: ['pool', 'sea_view', 'garden']
        """
        normalized = []
        for feature in features:
            feature_lower = feature.lower().strip()
            canonical = cls.FEATURE_MAP.get(feature_lower, feature_lower.replace(' ', '_'))
            if canonical not in normalized:
                normalized.append(canonical)

        return sorted(normalized)

    @classmethod
    def compute_hash(cls, user_id: int, category: str, preference_type: str, value: Any) -> str:
        """
        Compute hash for deduplication.

        Hash is based on: user_id + category + preference_type + normalized value
        """
        hash_input = f"{user_id}:{category}:{preference_type}:{json.dumps(value, sort_keys=True)}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    @classmethod
    def apply_precedence(
        cls,
        existing: Optional[UserPreference],
        new_value: Any,
        new_confidence: float,
        new_source: str,
    ) -> Tuple[bool, str]:
        """
        Apply precedence rules to determine if new preference should override existing.

        Precedence: current turn > explicit > strong inferred (≥0.7) > weak inferred (0.4-0.69)

        Returns:
            (should_update: bool, reason: str)
        """
        if not existing:
            return (True, "No existing preference")

        # Current turn always wins
        if new_source == 'current_turn':
            return (True, "Current turn overrides previous preferences")

        # Explicit overrides inferred
        if new_source == 'explicit' and existing.source == 'inferred':
            return (True, "Explicit statement overrides inferred preference")

        # Same source: higher confidence wins
        if new_source == existing.source:
            if new_confidence > existing.confidence:
                return (True, f"Higher confidence ({new_confidence:.2f} > {existing.confidence:.2f})")
            else:
                return (False, f"Lower confidence ({new_confidence:.2f} ≤ {existing.confidence:.2f})")

        # Strong inferred (≥0.7) overrides weak inferred
        if (
            new_source == 'inferred'
            and existing.source == 'inferred'
            and new_confidence >= 0.7
            and existing.confidence < 0.7
        ):
            return (True, f"Strong inferred ({new_confidence:.2f}) overrides weak ({existing.confidence:.2f})")

        # Inferred doesn't override explicit
        if new_source == 'inferred' and existing.source == 'explicit':
            return (False, "Inferred preference doesn't override explicit")

        # Behavior overrides inferred
        if new_source == 'behavior' and existing.source == 'inferred':
            return (True, "Behavioral pattern overrides inferred preference")

        # Default: don't update
        return (False, f"Existing preference kept (source: {existing.source}, confidence: {existing.confidence:.2f})")

    @classmethod
    def generate_why_note(
        cls,
        preference_type: str,
        value: Any,
        confidence: float,
        source: str,
        raw_value: Optional[str] = None,
    ) -> str:
        """
        Generate "why" note explaining where preference came from.

        Examples:
            "You mentioned wanting a property in Girne (confidence: 95%)"
            "Inferred from your search for 2-bedroom properties (confidence: 70%)"
        """
        confidence_pct = int(confidence * 100)

        if source == 'explicit':
            if raw_value:
                return f"You explicitly stated: '{raw_value}' (confidence: {confidence_pct}%)"
            return f"You explicitly stated this preference (confidence: {confidence_pct}%)"

        elif source == 'inferred':
            if confidence >= 0.7:
                strength = "strong"
            else:
                strength = "moderate"
            return f"Inferred from your conversation with {strength} confidence ({confidence_pct}%)"

        elif source == 'behavior':
            return f"Learned from your browsing and interaction patterns (confidence: {confidence_pct}%)"

        else:
            return f"Preference recorded (confidence: {confidence_pct}%)"

    @classmethod
    def detect_contradiction(
        cls,
        user: User,
        category: str,
        preference_type: str,
        new_value: Any,
    ) -> List[Dict[str, Any]]:
        """
        Detect contradictions with existing preferences.

        Returns list of contradictions with format:
        [
            {
                'field': 'budget',
                'old_value': {'min': 100000, 'max': 300000},
                'new_value': {'min': 400000, 'max': 600000},
                'reason': 'Budget range increased significantly',
            }
        ]
        """
        contradictions = []

        try:
            existing = UserPreference.objects.get(
                user=user,
                category=category,
                preference_type=preference_type,
            )

            # Budget contradiction: non-overlapping ranges
            if preference_type == 'budget':
                old_val = existing.value
                new_val = new_value

                old_max = old_val.get('max', float('inf'))
                new_min = new_val.get('min', 0)

                if new_min > old_max:
                    contradictions.append({
                        'field': preference_type,
                        'old_value': old_val,
                        'new_value': new_val,
                        'reason': 'Budget range increased significantly (no overlap)',
                    })

            # Location contradiction: different locations
            elif preference_type == 'location':
                old_location = existing.value.get('city', '').lower()
                new_location = new_value.get('city', '').lower()

                if old_location and new_location and old_location != new_location:
                    contradictions.append({
                        'field': preference_type,
                        'old_value': existing.value,
                        'new_value': new_value,
                        'reason': f'Location changed from {old_location} to {new_location}',
                    })

            # Bedrooms contradiction: different count
            elif preference_type == 'bedrooms':
                old_count = existing.value.get('count')
                new_count = new_value.get('count')

                if old_count and new_count and old_count != new_count:
                    contradictions.append({
                        'field': preference_type,
                        'old_value': existing.value,
                        'new_value': new_value,
                        'reason': f'Bedroom count changed from {old_count} to {new_count}',
                    })

        except UserPreference.DoesNotExist:
            # No existing preference, no contradiction
            pass

        return contradictions

    @classmethod
    @transaction.atomic
    def upsert_preference(
        cls,
        user: User,
        category: str,
        preference_type: str,
        value: Any,
        confidence: float,
        source: str,
        raw_value: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        embedding: Optional[List[float]] = None,
    ) -> Tuple[UserPreference, bool, str]:
        """
        Idempotent upsert of user preference.

        Args:
            user: User instance
            category: Preference category ('real_estate', 'services', etc.)
            preference_type: Type of preference ('budget', 'location', 'bedrooms', etc.)
            value: Structured value (dict or list)
            confidence: Confidence score (0.0 - 1.0)
            source: Source of preference ('explicit', 'inferred', 'behavior')
            raw_value: Original utterance (PII-redacted)
            metadata: Additional metadata
            embedding: Vector embedding (1536-dim)

        Returns:
            (preference: UserPreference, created: bool, reason: str)
        """
        # Normalize value based on type
        if preference_type == 'location' and isinstance(value, dict):
            if 'city' in value:
                value['city'] = cls.normalize_location(value['city'])

        elif preference_type == 'budget' and isinstance(value, dict):
            value = cls.normalize_budget(value)

        elif preference_type == 'features' and isinstance(value, list):
            value = cls.normalize_features(value)

        # Check for existing preference
        try:
            existing = UserPreference.objects.get(
                user=user,
                category=category,
                preference_type=preference_type,
            )

            # Apply precedence rules
            should_update, reason = cls.apply_precedence(
                existing=existing,
                new_value=value,
                new_confidence=confidence,
                new_source=source,
            )

            if not should_update:
                logger.info(
                    f"Preference not updated for user {user.id}: {reason}",
                    extra={
                        'user_id': user.id,
                        'category': category,
                        'preference_type': preference_type,
                        'reason': reason,
                    }
                )
                return (existing, False, reason)

            # Detect contradictions
            contradictions = cls.detect_contradiction(user, category, preference_type, value)

            # Update existing preference
            existing.value = value
            existing.confidence = confidence
            existing.source = source
            if raw_value:
                existing.raw_value = raw_value
            existing.last_decayed_at = timezone.now()
            if embedding:
                existing.embedding = embedding
            if metadata:
                existing.metadata.update(metadata)
            else:
                existing.metadata = metadata or {}

            # Add "why" note
            existing.metadata['why'] = cls.generate_why_note(
                preference_type=preference_type,
                value=value,
                confidence=confidence,
                source=source,
                raw_value=raw_value,
            )

            # Add contradictions if detected
            if contradictions:
                existing.metadata['contradictions'] = contradictions
                logger.warning(
                    f"Contradictions detected for user {user.id}",
                    extra={
                        'user_id': user.id,
                        'category': category,
                        'preference_type': preference_type,
                        'contradictions': contradictions,
                    }
                )

            existing.save()

            logger.info(
                f"Preference updated for user {user.id}",
                extra={
                    'user_id': user.id,
                    'category': category,
                    'preference_type': preference_type,
                    'confidence': confidence,
                    'source': source,
                }
            )

            return (existing, False, f"Updated: {reason}")

        except UserPreference.DoesNotExist:
            # Create new preference
            metadata = metadata or {}
            metadata['why'] = cls.generate_why_note(
                preference_type=preference_type,
                value=value,
                confidence=confidence,
                source=source,
                raw_value=raw_value,
            )

            preference = UserPreference.objects.create(
                user=user,
                category=category,
                preference_type=preference_type,
                value=value,
                raw_value=raw_value or '',
                confidence=confidence,
                source=source,
                embedding=embedding,
                metadata=metadata,
            )

            logger.info(
                f"Preference created for user {user.id}",
                extra={
                    'user_id': user.id,
                    'category': category,
                    'preference_type': preference_type,
                    'confidence': confidence,
                    'source': source,
                }
            )

            return (preference, True, "Created new preference")

    @classmethod
    def get_preferences(
        cls,
        user: User,
        category: Optional[str] = None,
        preference_type: Optional[str] = None,
        min_confidence: float = 0.0,
    ) -> List[UserPreference]:
        """
        Get user preferences with optional filtering.

        Args:
            user: User instance
            category: Filter by category
            preference_type: Filter by preference type
            min_confidence: Minimum confidence threshold

        Returns:
            List of UserPreference instances ordered by confidence desc
        """
        queryset = UserPreference.objects.filter(user=user)

        if category:
            queryset = queryset.filter(category=category)

        if preference_type:
            queryset = queryset.filter(preference_type=preference_type)

        if min_confidence > 0.0:
            queryset = queryset.filter(confidence__gte=min_confidence)

        return list(queryset.order_by('-confidence', '-last_used_at'))

    @classmethod
    @transaction.atomic
    def apply_confidence_decay(cls, user: User) -> int:
        """
        Apply time-based confidence decay to all user preferences.

        Decay schedule:
        - 0-7 days: No decay
        - 7-30 days: -0.01 per day
        - 30-90 days: -0.02 per day
        - 90+ days: -0.05 per day

        Returns:
            Number of preferences decayed
        """
        count = 0

        preferences = UserPreference.objects.filter(
            user=user,
            last_used_at__isnull=False,
        )

        for pref in preferences:
            decay_amount = pref.calculate_decay()

            if decay_amount > 0:
                new_confidence = max(0.0, pref.confidence - decay_amount)

                if new_confidence != pref.confidence:
                    pref.confidence = new_confidence
                    pref.last_decayed_at = timezone.now()
                    pref.save(update_fields=['confidence', 'last_decayed_at'])
                    count += 1

                    logger.info(
                        f"Applied confidence decay for user {user.id}",
                        extra={
                            'user_id': user.id,
                            'preference_id': str(pref.id),
                            'preference_type': pref.preference_type,
                            'decay_amount': decay_amount,
                            'new_confidence': new_confidence,
                        }
                    )

        return count

    @classmethod
    def mark_preference_used(cls, preference_id: str) -> bool:
        """
        Mark a preference as used (updates last_used_at and use_count).

        Args:
            preference_id: UUID of preference

        Returns:
            True if updated, False if not found
        """
        try:
            preference = UserPreference.objects.get(id=preference_id)
            preference.last_used_at = timezone.now()
            preference.use_count += 1
            preference.save(update_fields=['last_used_at', 'use_count'])

            logger.debug(
                f"Preference marked as used",
                extra={
                    'preference_id': preference_id,
                    'use_count': preference.use_count,
                }
            )

            return True

        except UserPreference.DoesNotExist:
            logger.warning(f"Preference not found: {preference_id}")
            return False

    @classmethod
    def delete_preference(cls, user: User, preference_id: str) -> bool:
        """
        Delete a user preference.

        Args:
            user: User instance
            preference_id: UUID of preference

        Returns:
            True if deleted, False if not found
        """
        try:
            preference = UserPreference.objects.get(id=preference_id, user=user)
            preference.delete()

            logger.info(
                f"Preference deleted for user {user.id}",
                extra={
                    'user_id': user.id,
                    'preference_id': preference_id,
                }
            )

            return True

        except UserPreference.DoesNotExist:
            logger.warning(f"Preference not found: {preference_id}")
            return False
