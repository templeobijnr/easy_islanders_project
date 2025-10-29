"""
Health check endpoint for Fly.io and monitoring.
Returns 200 with cheap JSON including version, status, and basic metrics.
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import time
import os

@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Cheap health check endpoint.
    Returns 200 OK with system status.
    """
    response_data = {
        "status": "healthy",
        "version": os.getenv("GIT_SHA", "unknown"),
        "environment": os.getenv("DJANGO_ENV", "unknown"),
        "router_config": os.getenv("ROUTER_CONFIG", "unknown"),
        "shadow_rate": float(os.getenv("ROUTER_SHADOW", "0.0")),
        "timestamp": int(time.time()),
    }
    
    return JsonResponse(response_data, status=200)
