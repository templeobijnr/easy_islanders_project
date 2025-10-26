import os
from django.apps import AppConfig


class AssistantConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "assistant"

    _otel_bootstrapped = False

    def ready(self):
        """Register signal handlers and bootstrap observability."""
        from . import signals  # noqa: F401
        self._bootstrap_observability()

    def _bootstrap_observability(self):
        if self.__class__._otel_bootstrapped:
            return

        # During Django reloader the first process should skip instrumentation
        if os.environ.get("RUN_MAIN") == "true" or not os.environ.get("RUN_MAIN"):
            try:
                from assistant.monitoring.otel_instrumentation import (
                    setup_otel_instrumentation,
                    instrument_django_apps,
                )

                if setup_otel_instrumentation(instrument_django=True):
                    instrument_django_apps()
                    self.__class__._otel_bootstrapped = True
            except Exception as exc:  # pragma: no cover - startup errors
                import logging

                logging.getLogger(__name__).error(
                    "Failed to bootstrap OpenTelemetry instrumentation: %s", exc
                )
