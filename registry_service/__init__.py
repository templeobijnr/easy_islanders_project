"""Registry service package initializer."""

from .tasks import celery_app as app

__all__ = ["app"]
