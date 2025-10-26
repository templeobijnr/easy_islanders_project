"""
Django middleware for OpenTelemetry integration and metrics collection.
"""

import time
import logging
from typing import Callable
from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin

from .otel_instrumentation import create_request_span, add_span_attributes, set_span_error
from .metrics import record_http_metrics, record_error

logger = logging.getLogger(__name__)

class OpenTelemetryMiddleware(MiddlewareMixin):
    """
    Django middleware that creates OpenTelemetry spans for each request
    and records HTTP metrics for Grafana dashboard.
    """
    
    def process_request(self, request: HttpRequest) -> None:
        """Process incoming request and create span."""
        # Start timing
        request._start_time = time.time()
        
        # Create OpenTelemetry span
        request._otel_span = create_request_span(request, f"{request.method} {request.path}")
        request._otel_span.__enter__()

        # Add request attributes
        add_span_attributes(request._otel_span, {
            "http.method": request.method,
            "http.url": request.build_absolute_uri(),
            "http.user_agent": request.META.get('HTTP_USER_AGENT', ''),
            "http.remote_addr": request.META.get('REMOTE_ADDR', ''),
            "django.view_name": getattr(request.resolver_match, 'view_name', '') if request.resolver_match else '',
        })
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Process outgoing response and complete span."""
        try:
            # Calculate duration
            duration = time.time() - getattr(request, '_start_time', 0)
            
            # Get span
            span = getattr(request, '_otel_span', None)
            if span:
                # Add response attributes
                add_span_attributes(span, {
                    "http.status_code": response.status_code,
                    "http.response_size": len(response.content) if hasattr(response, 'content') else 0,
                })
                
                # Set status based on response code
                if response.status_code >= 400:
                    span.set_attribute("error", True)
                    span.set_attribute("error.status_code", response.status_code)
                
                # Complete span
                span.__exit__(None, None, None)
            
            # Record HTTP metrics
            endpoint = self._get_endpoint_name(request)
            record_http_metrics(
                method=request.method,
                endpoint=endpoint,
                status_code=response.status_code,
                duration=duration,
                service="django"
            )
            
            # Record errors
            if response.status_code >= 400:
                error_type = f"http_{response.status_code}"
                record_error("django", error_type, "error")
            
        except Exception as e:
            logger.error(f"Error in OpenTelemetry middleware: {e}")
        
        return response
    
    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        """Process exceptions and mark span as failed."""
        try:
            span = getattr(request, '_otel_span', None)
            if span:
                set_span_error(span, exception)
                span.__exit__(type(exception), exception, None)
            
            # Record error metrics
            record_error("django", type(exception).__name__, "error")
            
        except Exception as e:
            logger.error(f"Error processing exception in OpenTelemetry middleware: {e}")
    
    def _get_endpoint_name(self, request: HttpRequest) -> str:
        """Extract a clean endpoint name from the request."""
        if request.resolver_match and request.resolver_match.view_name:
            return request.resolver_match.view_name
        
        # Fallback to path-based naming
        path = request.path
        if path.startswith('/api/'):
            return path.replace('/api/', '').replace('/', '_')
        
        return path.replace('/', '_').strip('_') or 'root'

class MetricsMiddleware(MiddlewareMixin):
    """
    Additional middleware for collecting detailed metrics.
    """
    
    def process_request(self, request: HttpRequest) -> None:
        """Record request start metrics."""
        request._metrics_start_time = time.time()
        
        # Record connection metrics
        from .metrics import record_connection
        record_connection("http", "active")
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """Record response metrics."""
        try:
            # Calculate total request time
            total_time = time.time() - getattr(request, '_metrics_start_time', 0)
            
            # Record additional metrics based on endpoint
            if request.path.startswith('/api/assistant/chat'):
                from .metrics import record_agent_execution
                record_agent_execution("chat_assistant", "process_message", total_time, response.status_code < 400)
            
            elif request.path.startswith('/api/registry/'):
                from .metrics import record_registry_operation
                record_registry_operation("api_request", "success" if response.status_code < 400 else "error", total_time)
            
            # Record cache operations if applicable
            if hasattr(request, '_cache_operations'):
                from .metrics import record_cache_operation
                for operation in request._cache_operations:
                    record_cache_operation(operation['type'], operation['cache_type'], operation['status'])
            
        except Exception as e:
            logger.error(f"Error in metrics middleware: {e}")
        
        return response
