"""
Prometheus metrics for WebSocket connections and message delivery.

Metrics:
  - websocket_connections_active: Current number of active WS connections
  - ws_message_send_errors_total: Cumulative count of send failures
"""
from prometheus_client import Counter, Gauge

# Active WebSocket connections gauge
ws_connections_active = Gauge(
    "websocket_connections_active",
    "Number of active WebSocket connections",
)

# WebSocket send error counter
ws_message_send_errors_total = Counter(
    "ws_message_send_errors_total",
    "Total WebSocket message send failures",
)
