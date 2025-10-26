"""
OpenTelemetry Configuration for Easy Islanders

Provides centralized OpenTelemetry setup for both Django and FastAPI services.
Includes request_id correlation, sampling policies, and OTLP exporter configuration.
"""

import os
import logging
from typing import Optional
from decouple import config
try:
    from opentelemetry.sdk.trace.sampling import Sampler, SamplingResult, TraceIdRatioBased, ParentBased

    _SAMPLER_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    Sampler = object  # type: ignore
    SamplingResult = TraceIdRatioBased = ParentBased = None  # type: ignore
    _SAMPLER_AVAILABLE = False

ENABLE_OTEL_METRICS = config("ENABLE_OTEL_METRICS", default=False, cast=bool)

logger = logging.getLogger(__name__)

# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT = config('OTEL_EXPORTER_OTLP_ENDPOINT', default='http://localhost:4317')
OTEL_SERVICE_NAME = config('OTEL_SERVICE_NAME', default='easy-islanders')
OTEL_SERVICE_VERSION = config('OTEL_SERVICE_VERSION', default='1.0.0')
OTEL_RESOURCE_ATTRIBUTES = config('OTEL_RESOURCE_ATTRIBUTES', default='service.name=easy-islanders,service.version=1.0.0')

# Sampling Configuration
OTEL_TRACES_SAMPLER = config('OTEL_TRACES_SAMPLER', default='traceidratio')
OTEL_TRACES_SAMPLER_ARG = config('OTEL_TRACES_SAMPLER_ARG', default='1.0')  # 1.0 for staging, 0.2 for prod
OTEL_ERROR_SAMPLER_ARG = config('OTEL_ERROR_SAMPLER_ARG', default='1.0')  # Always sample errors

# Environment-specific sampling rates
ENVIRONMENT = config('ENVIRONMENT', default='staging')
if ENVIRONMENT == 'production':
    OTEL_TRACES_SAMPLER_ARG = '0.2'  # 20% sampling for production
elif ENVIRONMENT == 'staging':
    OTEL_TRACES_SAMPLER_ARG = '1.0'  # 100% sampling for staging

def get_otel_config() -> dict:
    """Get OpenTelemetry configuration dictionary."""
    return {
        'OTEL_EXPORTER_OTLP_ENDPOINT': OTEL_EXPORTER_OTLP_ENDPOINT,
        'OTEL_SERVICE_NAME': OTEL_SERVICE_NAME,
        'OTEL_SERVICE_VERSION': OTEL_SERVICE_VERSION,
        'OTEL_RESOURCE_ATTRIBUTES': OTEL_RESOURCE_ATTRIBUTES,
        'OTEL_TRACES_SAMPLER': OTEL_TRACES_SAMPLER,
        'OTEL_TRACES_SAMPLER_ARG': OTEL_TRACES_SAMPLER_ARG,
        'OTEL_ERROR_SAMPLER_ARG': OTEL_ERROR_SAMPLER_ARG,
    }

def setup_otel_environment():
    """Set up OpenTelemetry environment variables."""
    if not ENABLE_OTEL_METRICS:
        logger.info("OpenTelemetry metrics disabled (ENABLE_OTEL_METRICS=false)")
        return False

    config_dict = get_otel_config()
    for key, value in config_dict.items():
        os.environ[key] = str(value)
    
    logger.info(f"OpenTelemetry configured: {OTEL_SERVICE_NAME} v{OTEL_SERVICE_VERSION}")
    logger.info(f"OTLP Endpoint: {OTEL_EXPORTER_OTLP_ENDPOINT}")
    logger.info(f"Sampling Rate: {OTEL_TRACES_SAMPLER_ARG} ({ENVIRONMENT})")
    return True

if _SAMPLER_AVAILABLE:

    class ErrorAwareSampler(Sampler):
        """
        Custom sampler that always samples errors and applies configured rate for others.
        """

        def __init__(self, base_rate: float = 1.0, error_rate: float = 1.0):
            self.base_sampler = ParentBased(TraceIdRatioBased(base_rate))
            self.error_sampler = ParentBased(TraceIdRatioBased(error_rate))

        def should_sample(
            self,
            parent_context: Optional[object],
            trace_id: int,
            name: str,
            kind: Optional[int],
            attributes: Optional[dict],
            links: Optional[tuple] = None,
        ) -> SamplingResult:
            attributes = attributes or {}
            force_error_sampling = attributes.get("force_sample") or False
            status_code = attributes.get("http.status_code")
            if force_error_sampling or (status_code and int(status_code) >= 500):
                return self.error_sampler.should_sample(
                    parent_context, trace_id, name, kind, attributes, links
                )
            return self.base_sampler.should_sample(
                parent_context, trace_id, name, kind, attributes, links
            )

        def get_description(self) -> str:
            return "ErrorAwareSampler"

else:

    class ErrorAwareSampler:  # type: ignore[no-redef]
        """Fallback sampler used when OpenTelemetry sampling classes are unavailable."""

        def __init__(self, base_rate: float = 1.0, error_rate: float = 1.0):
            self.base_rate = base_rate
            self.error_rate = error_rate

        def get_description(self) -> str:
            return "ErrorAwareSampler(fallback)"

def get_sampler() -> ErrorAwareSampler:
    """Get the appropriate sampler based on environment."""
    base_rate = float(OTEL_TRACES_SAMPLER_ARG)
    error_rate = float(OTEL_ERROR_SAMPLER_ARG)
    return ErrorAwareSampler(base_rate, error_rate)
