from django.http import HttpResponse, HttpResponseServerError

try:
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

    _PROMETHEUS_AVAILABLE = True
except Exception:  # noqa: BLE001
    _PROMETHEUS_AVAILABLE = False


def prometheus_metrics_view(request):
    """Expose Prometheus metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return HttpResponseServerError("Prometheus metrics not configured")
    output = generate_latest()
    return HttpResponse(output, content_type=CONTENT_TYPE_LATEST)
