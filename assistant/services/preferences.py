from __future__ import annotations

"""
Preference service: CRUD operations, normalization, confidence decay, and reads.

Initial minimal implementation to support Sprint 6 foundation. Embeddings and
advanced normalization can be added incrementally.
"""
import logging
from typing import Any, Dict, List, Optional
from django.db import transaction
from django.utils import timezone

from users.models import UserPreference
from assistant.memory.pii import redact_pii

logger = logging.getLogger(__name__)


def _sanitize_embedding(embedding: Optional[List[float]]) -> Optional[List[float]]:
    """Return None instead of empty vectors (pgvector rejects [])."""
    if not embedding:
        return None
    if isinstance(embedding, list) and len(embedding) == 0:
        return None
    return embedding


class PreferenceService:
    @staticmethod
    def normalize(preference_type: str, value: Dict[str, Any]) -> Dict[str, Any]:
        """Canonicalize common fields (currency codes, location casing, etc.)."""
        try:
            v = dict(value or {})
        except Exception:
            v = {"type": "single", "value": str(value)}
        # Basic normalization for location casing
        if preference_type == "location":
            if v.get("type") == "list":
                v["values"] = [str(x).title() for x in v.get("values", [])]
            elif v.get("type") == "single":
                v["value"] = str(v.get("value", "")).title()
        # Currency normalization
        if preference_type == "budget":
            unit = (v.get("unit") or "").upper()
            if unit in {"EUR", "EURO", "€"}: v["unit"] = "EUR"
            if unit in {"USD", "$"}: v["unit"] = "USD"
            if unit in {"TRY", "TL"}: v["unit"] = "TRY"
        return v

    @staticmethod
    @transaction.atomic
    def upsert_preference(
        *,
        user_id: int,
        category: str,
        preference_type: str,
        value: Dict[str, Any],
        confidence: float = 1.0,
        source: str = "explicit",
        embedding: Optional[List[float]] = None,  # Deprecated: not used
        metadata: Optional[Dict[str, Any]] = None,
    ) -> UserPreference:
        # PII-redact values' free text where applicable
        try:
            # Redact inside nested fields if present
            if value.get("type") == "single" and isinstance(value.get("value"), str):
                red = redact_pii(value["value"])
                value["value"] = red["text"]
            if value.get("type") == "list":
                new_vals = []
                for x in value.get("values", []):
                    if isinstance(x, str):
                        new_vals.append(redact_pii(x)["text"])  # counters emitted inside redact_pii
                    else:
                        new_vals.append(x)
                value["values"] = new_vals
        except Exception:
            pass

        norm_value = PreferenceService.normalize(preference_type, value)
        
        # Store category in metadata
        pref_metadata = metadata or {}
        if category:
            pref_metadata = dict(pref_metadata)
            pref_metadata["category"] = category

        obj, created = UserPreference.objects.select_for_update().get_or_create(
            user_id=user_id,
            preference_type=preference_type,
            defaults={
                "value": norm_value,
                "confidence": confidence,
                "source": source,
                "metadata": pref_metadata,
            },
        )
        if not created:
            # Update existing: keep higher confidence, merge metadata
            obj.value = norm_value
            obj.confidence = max(obj.confidence or 0.0, confidence or 0.0)
            obj.source = source or obj.source
            md = dict(obj.metadata or {})
            if category:
                md["category"] = category
            if metadata:
                md.update(metadata)
            obj.metadata = md
            obj.save()
        return obj

    @staticmethod
    def mark_used(pref: UserPreference) -> None:
        pref.use_count = (pref.use_count or 0) + 1
        pref.last_used_at = timezone.now()
        pref.save(update_fields=["use_count", "last_used_at"])

    @staticmethod
    def get_active_preferences(user_id: int, *, min_confidence: float = 0.5) -> Dict[str, List[Dict[str, Any]]]:
        qs = UserPreference.objects.filter(user_id=user_id, confidence__gte=min_confidence)
        grouped: Dict[str, List[Dict[str, Any]]] = {}
        for p in qs:
            category = p.metadata.get("category", "general") if p.metadata else "general"
            bucket = grouped.setdefault(category, [])
            bucket.append(
                {
                    "type": p.preference_type,
                    "value": p.value,
                    "confidence": p.confidence,
                    "source": p.source,
                    "last_used_at": p.last_used_at.isoformat() if p.last_used_at else None,
                }
            )
        return grouped
