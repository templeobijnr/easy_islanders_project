"""
Health check endpoints for monitoring service dependencies.
"""

import time
from django.http import JsonResponse
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def redis_health(request):
    """
    Check Redis connectivity for channel layer (WebSocket support).

    Returns:
        200: Redis channel layer is healthy
        503: Redis channel layer is unhealthy or unreachable
    """
    layer = get_channel_layer()

    try:
        # Test group_send (non-blocking test message)
        test_group = 'health_check'
        test_message = {
            'type': 'health.ping',
            'timestamp': time.time()
        }

        async_to_sync(layer.group_send)(test_group, test_message)

        return JsonResponse({
            'status': 'healthy',
            'service': 'redis_channel_layer',
            'backend': layer.__class__.__name__,
        })

    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'service': 'redis_channel_layer',
            'error': str(e)[:200],
        }, status=503)
