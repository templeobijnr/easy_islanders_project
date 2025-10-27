"""
Django app configuration for monitoring and observability.
"""

from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class MonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'assistant.monitoring'
    verbose_name = 'Monitoring & Observability'

    def ready(self):
        """Initialize OpenTelemetry when Django starts."""
        try:
            from .otel_instrumentation import setup_otel_instrumentation
            from .metrics import warm_metrics
            from django.conf import settings
            
            # Only setup OpenTelemetry if enabled
            if getattr(settings, 'ENABLE_OTEL_METRICS', False):
                setup_otel_instrumentation()
                logger.info("OpenTelemetry instrumentation initialized")
            else:
                logger.info("OpenTelemetry instrumentation disabled")
            # Warm Prometheus metric series so they are visible pre-traffic
            try:
                warm_metrics()
            except Exception:
                pass
                
        except Exception as e:
            logger.error(f"Failed to initialize OpenTelemetry: {e}")
            # Don't raise exception to prevent Django startup failure
