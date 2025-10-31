from __future__ import annotations

from django.db import models
from typing import Optional
import uuid


class RouterEvent(models.Model):
    """Router event log for evaluation and calibration.

    This is a simplified subset to avoid vector dependencies in dev.
    """

    SPLIT_CHOICES = [
        ('train', 'Training'),
        ('val', 'Validation'),
        ('test', 'Testing'),
    ]

    event_id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    thread_id = models.CharField(max_length=64, blank=True)
    utterance = models.TextField()
    context_hint = models.JSONField(default=dict)
    stage1_safe = models.BooleanField(default=True)
    domain_pred = models.CharField(max_length=64, blank=True)
    domain_conf = models.FloatField(default=0.0)
    in_domain_intent = models.CharField(max_length=64, blank=True)
    action = models.CharField(max_length=32, blank=True)
    latency_ms = models.IntegerField(default=0)
    cost_cents = models.FloatField(null=True, blank=True)
    split = models.CharField(max_length=8, choices=SPLIT_CHOICES, default='train')
    correct_label = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["domain_pred"]),
            models.Index(fields=["split"]),
            models.Index(fields=['-created_at'], name='router_evt_created_idx'),
            models.Index(fields=['domain_pred', '-created_at'], name='router_evt_domain_idx'),
        ]


class IntentExemplar(models.Model):
    """Few-shot exemplar stored for prompt assembly (dev JSON vector).

    Production uses pgvector as per SQL in registry_service/sql/02_intent_router.sql.
    """

    exemplar_id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    intent_key = models.CharField(max_length=128)
    text = models.TextField()
    vector = models.JSONField(default=list)  # JSON list of floats in dev; pgvector in prod
    locale = models.CharField(max_length=16, blank=True)
    geo_region = models.CharField(max_length=32, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["intent_key"]),
        ]


class AgentRegistry(models.Model):
    """Registered agents and coverage (dev JSON coverage).

    Mirrors agent_registry table in production schema.
    """

    agent_id = models.CharField(primary_key=True, max_length=64)
    domain = models.CharField(max_length=64)
    description = models.TextField()
    coverage = models.JSONField(default=dict)
    version = models.CharField(max_length=16, default="v1")


class DomainCentroid(models.Model):
    """Per-domain centroid vector (dev JSON vector).

    Mirrors domain_centroids in production; used for local testing without pgvector.
    """

    domain = models.CharField(primary_key=True, max_length=64)
    vector = models.JSONField(default=list)
    support_n = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class CalibrationParams(models.Model):
    """Calibration parameters for router confidence scores.

    Stores Platt scaling or Isotonic regression parameters for each domain.
    Used to calibrate raw classifier probabilities into well-calibrated confidence scores.
    """

    domain = models.CharField(max_length=64)
    method = models.CharField(max_length=16, default="platt")  # 'platt' or 'isotonic'
    params = models.JSONField(default=dict, help_text="Calibration parameters (weights, intercepts, etc.)")
    ece = models.FloatField(default=0.0, help_text="Expected Calibration Error")
    support_n = models.IntegerField(default=0, help_text="Number of samples used for calibration")
    version = models.CharField(max_length=32, default="active", help_text="Version tag (active, shadow, v20240101, etc.)")
    evaluated_on = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["evaluated_on"]),
            models.Index(fields=["version"]),
        ]
        unique_together = [["domain", "version"]]

    @classmethod
    def get_active_params(cls, domain: str) -> Optional['CalibrationParams']:
        """Get active calibration parameters for a domain."""
        return cls.objects.filter(domain=domain, version="active").first()

    @classmethod
    def get_shadow_params(cls, domain: str) -> Optional['CalibrationParams']:
        """Get shadow calibration parameters for a domain."""
        return cls.objects.filter(domain=domain, version="shadow").first()

    def promote_to_active(self) -> None:
        """Promote this shadow version to active."""
        from django.db import transaction

        with transaction.atomic():
            # Archive current active version
            cls.objects.filter(domain=self.domain, version="active").update(version="archived")

            # Promote shadow to active
            self.version = "active"
            self.save()

    def create_shadow_copy(self) -> 'CalibrationParams':
        """Create a shadow copy for testing."""
        shadow = cls.objects.create(
            domain=self.domain,
            method=self.method,
            params=self.params,
            ece=self.ece,
            support_n=self.support_n,
            version="shadow"
        )
        return shadow
