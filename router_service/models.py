from __future__ import annotations

from django.db import models


class RouterEvent(models.Model):
    """Router event log for evaluation and calibration.

    This is a simplified subset to avoid vector dependencies in dev.
    """

    event_id = models.UUIDField(primary_key=True, editable=False)
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["domain_pred"]),
        ]

