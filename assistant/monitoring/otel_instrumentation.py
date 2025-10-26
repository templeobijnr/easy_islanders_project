"""
OpenTelemetry Instrumentation for Easy Islanders.

Provides Django and FastAPI instrumentation with request_id correlation.
"""

from __future__ import annotations

import logging
import os
import uuid
from contextlib import nullcontext
from typing import Optional, Dict, Any

try:
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.celery import CeleryInstrumentor
    from opentelemetry.instrumentation.django import DjangoInstrumentor
    from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
    from opentelemetry.instrumentation.redis import RedisInstrumentor
    from opentelemetry.instrumentation.requests import RequestsInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.trace import Status, StatusCode

    _OTEL_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    trace = None  # type: ignore
    OTLPSpanExporter = None  # type: ignore
    CeleryInstrumentor = DjangoInstrumentor = Psycopg2Instrumentor = RedisInstrumentor = RequestsInstrumentor = None  # type: ignore
    Resource = TracerProvider = BatchSpanProcessor = Status = StatusCode = None  # type: ignore
    _OTEL_AVAILABLE = False

from .otel_config import (
    ENABLE_OTEL_METRICS,
    setup_otel_environment,
    get_otel_config,
    get_sampler,
)

logger = logging.getLogger(__name__)

if _OTEL_AVAILABLE:  # Optional FastAPI/uvicorn instrumentation
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # type: ignore

        _FASTAPI_AVAILABLE = True
    except ImportError:  # pragma: no cover - optional dependency
        _FASTAPI_AVAILABLE = False

    try:
        from opentelemetry.instrumentation.uvicorn import UvicornInstrumentor  # type: ignore

        _UVICORN_AVAILABLE = True
    except ImportError:  # pragma: no cover - optional dependency
        _UVICORN_AVAILABLE = False
else:  # pragma: no cover - otel disabled
    _FASTAPI_AVAILABLE = False
    _UVICORN_AVAILABLE = False


class _NullSpan:
    """No-op span used when OpenTelemetry is disabled."""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

    def set_attribute(self, *args, **kwargs):
        return None

    def set_status(self, *args, **kwargs):
        return None

    def record_exception(self, *args, **kwargs):
        return None


class _ManagedSpan:
    """Wrapper around start_as_current_span to work with middleware usage."""

    def __init__(self, tracer: trace.Tracer, name: str, attributes: Dict[str, Any]):
        self._context_manager = tracer.start_as_current_span(name, attributes=attributes)
        self._span = None

    def __enter__(self):
        self._span = self._context_manager.__enter__()
        return self._span

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._context_manager.__exit__(exc_type, exc_val, exc_tb)

    def set_attribute(self, key, value):
        if self._span:
            self._span.set_attribute(key, value)

    def set_status(self, status):
        if self._span:
            self._span.set_status(status)

    def record_exception(self, exc):
        if self._span:
            self._span.record_exception(exc)


# Global tracer/provider state
_tracer: Optional[trace.Tracer] = None
_tracer_provider: Optional[TracerProvider] = None
_instrumented = False
_django_instrumented = False


def get_tracer() -> trace.Tracer:
    """Get the global tracer instance."""
    if not _OTEL_AVAILABLE or trace is None:  # pragma: no cover - otel missing
        raise RuntimeError("OpenTelemetry is not available in this environment")
    global _tracer
    if _tracer is None:
        _tracer = trace.get_tracer(__name__)
    return _tracer


def setup_otel_instrumentation(instrument_django: bool = True) -> bool:
    """Set up OpenTelemetry instrumentation for all services."""
    global _instrumented, _tracer_provider, _django_instrumented

    if not ENABLE_OTEL_METRICS or not _OTEL_AVAILABLE:
        if not _OTEL_AVAILABLE:
            logger.info("OpenTelemetry not installed; skipping instrumentation")
        return False

    if _instrumented:
        if instrument_django and not _django_instrumented:
            DjangoInstrumentor().instrument()
            _django_instrumented = True
        return True

    if not setup_otel_environment():
        return False

    try:
        config = get_otel_config()
        resource = Resource.create(
            {
                "service.name": config["OTEL_SERVICE_NAME"],
                "service.version": config["OTEL_SERVICE_VERSION"],
            }
        )

        _tracer_provider = TracerProvider(
            resource=resource,
            sampler=get_sampler(),
        )
        trace.set_tracer_provider(_tracer_provider)

        otlp_exporter = OTLPSpanExporter(
            endpoint=config["OTEL_EXPORTER_OTLP_ENDPOINT"],
            insecure=True,
        )
        _tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

        # Instrument common libraries once
        if RequestsInstrumentor:
            RequestsInstrumentor().instrument()
        if Psycopg2Instrumentor:
            Psycopg2Instrumentor().instrument()
        if RedisInstrumentor:
            RedisInstrumentor().instrument()
        if CeleryInstrumentor:
            CeleryInstrumentor().instrument()

        if instrument_django and DjangoInstrumentor:
            DjangoInstrumentor().instrument()
            _django_instrumented = True

        _instrumented = True
        logger.info("OpenTelemetry instrumentation setup complete")
        return True
    except Exception as exc:  # pragma: no cover - setup errors
        logger.error("Failed to setup OpenTelemetry instrumentation: %s", exc)
        return False


def create_request_span(request, operation_name: Optional[str] = None):
    """Create a span for a request with request_id correlation."""
    if not ENABLE_OTEL_METRICS or _tracer_provider is None:
        return _NullSpan()

    tracer = get_tracer()
    request_id = getattr(request, "request_id", None) or request.META.get(
        "HTTP_X_REQUEST_ID"
    ) or str(uuid.uuid4())

    if hasattr(request, "request_id"):
        request.request_id = request_id

    attributes = {
        "request_id": request_id,
        "http.method": getattr(request, "method", ""),
        "http.url": request.build_absolute_uri() if hasattr(request, "build_absolute_uri") else "",
        "http.user_agent": request.META.get("HTTP_USER_AGENT", "") if hasattr(request, "META") else "",
        "http.remote_addr": request.META.get("REMOTE_ADDR", "") if hasattr(request, "META") else "",
    }

    span_name = operation_name or f"{getattr(request, 'method', 'GET')} {getattr(request, 'path', '/')}"
    return _ManagedSpan(tracer, span_name, attributes)


def add_span_attributes(span, attributes: Dict[str, Any]):
    """Add attributes to a span."""
    if span is None:
        return
    setter = getattr(span, "set_attribute", None)
    if not setter:
        return
    for key, value in attributes.items():
        if value is not None:
            setter(key, value)


def set_span_error(span, error: Exception):
    """Mark a span as failed with error details."""
    if span is None:
        return
    status = Status(StatusCode.ERROR, str(error))
    if hasattr(span, "set_status"):
        span.set_status(status)
    if hasattr(span, "set_attribute"):
        span.set_attribute("error", True)
        span.set_attribute("error.message", str(error))
        span.set_attribute("error.type", type(error).__name__)
    if hasattr(span, "record_exception"):
        span.record_exception(error)


def create_agent_span(agent_name: str, operation: str, request_id: Optional[str] = None):
    """Create a span for agent operations."""
    if not ENABLE_OTEL_METRICS or _tracer_provider is None:
        return _NullSpan()

    tracer = get_tracer()
    attributes = {
        "agent.name": agent_name,
        "agent.operation": operation,
        "request_id": request_id,
    }
    return _ManagedSpan(tracer, f"{agent_name}.{operation}", attributes)


def create_tool_span(tool_name: str, operation: str, request_id: Optional[str] = None):
    """Create a span for tool operations."""
    if not ENABLE_OTEL_METRICS or _tracer_provider is None:
        return _NullSpan()

    tracer = get_tracer()
    attributes = {
        "tool.name": tool_name,
        "tool.operation": operation,
        "request_id": request_id,
    }
    return _ManagedSpan(tracer, f"tool.{tool_name}.{operation}", attributes)


def create_registry_span(operation: str, request_id: Optional[str] = None):
    """Create a span for registry service operations."""
    if not ENABLE_OTEL_METRICS or _tracer_provider is None:
        return _NullSpan()

    tracer = get_tracer()
    attributes = {
        "service.name": "registry",
        "service.operation": operation,
        "request_id": request_id,
    }
    return _ManagedSpan(tracer, f"registry.{operation}", attributes)


class RequestIDMiddleware:
    """
    Django middleware to add request_id to all requests and correlate with OpenTelemetry spans.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = (
            request.META.get("HTTP_X_REQUEST_ID") if hasattr(request, "META") else None
        ) or str(uuid.uuid4())
        request.request_id = request_id

        response = self.get_response(request)
        if hasattr(response, "__setitem__"):
            response["X-Request-ID"] = request_id
        return response


def instrument_django_apps():
    """Instrument Django applications with OpenTelemetry."""
    if not ENABLE_OTEL_METRICS or not _OTEL_AVAILABLE:
        return
    try:
        from django.conf import settings

        middleware = 'assistant.monitoring.otel_instrumentation.RequestIDMiddleware'
        if middleware not in settings.MIDDLEWARE:
            settings.MIDDLEWARE.insert(0, middleware)
        logger.info("Django apps instrumented with OpenTelemetry middleware")
    except Exception as exc:  # pragma: no cover - configuration errors
        logger.error("Failed to instrument Django apps: %s", exc)


def instrument_fastapi_app(app):
    """Instrument a FastAPI application."""
    if not ENABLE_OTEL_METRICS or not _OTEL_AVAILABLE:
        return
    if not setup_otel_instrumentation(instrument_django=False):
        return
    try:
        if _FASTAPI_AVAILABLE:
            FastAPIInstrumentor().instrument_app(app, tracer_provider=_tracer_provider)
        if _UVICORN_AVAILABLE:
            UvicornInstrumentor().instrument()
        logger.info("FastAPI app instrumented with OpenTelemetry")
    except Exception as exc:  # pragma: no cover - instrumentation errors
        logger.error("Failed to instrument FastAPI app: %s", exc)


def cleanup_instrumentation():
    """Clean up OpenTelemetry instrumentation."""
    if not ENABLE_OTEL_METRICS:
        return
    try:
        if DjangoInstrumentor:
            DjangoInstrumentor().uninstrument()
        if RequestsInstrumentor:
            RequestsInstrumentor().uninstrument()
        if Psycopg2Instrumentor:
            Psycopg2Instrumentor().uninstrument()
        if RedisInstrumentor:
            RedisInstrumentor().uninstrument()
        if CeleryInstrumentor:
            CeleryInstrumentor().uninstrument()
        if _FASTAPI_AVAILABLE:
            FastAPIInstrumentor().uninstrument()
        if _UVICORN_AVAILABLE:
            UvicornInstrumentor().uninstrument()
        logger.info("OpenTelemetry instrumentation cleaned up")
    except Exception as exc:  # pragma: no cover - cleanup errors
        logger.error("Failed to cleanup OpenTelemetry instrumentation: %s", exc)
