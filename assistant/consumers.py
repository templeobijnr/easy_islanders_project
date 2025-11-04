"""
Production WebSocket consumer with close-code hygiene, duration tracking, and metrics.
"""
import json
import time
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from assistant.utils.correlation import set_correlation_id, reset_correlation_id

# Import WebSocket metrics
try:
    from assistant.monitoring.metrics import (
        WEBSOCKET_CONNECTIONS,
        WS_MESSAGE_SEND_ERRORS,
        WS_CLOSES_TOTAL,
        WS_CONNECTION_DURATION_SECONDS,
        WS_FRAMES_SENT_TOTAL,
        _PROMETHEUS_AVAILABLE,
    )
except ImportError:
    WEBSOCKET_CONNECTIONS = None
    WS_MESSAGE_SEND_ERRORS = None
    WS_CLOSES_TOTAL = None
    WS_CONNECTION_DURATION_SECONDS = None
    WS_FRAMES_SENT_TOTAL = None
    _PROMETHEUS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Production close codes (RFC 6455 + custom)
AUTH_CLOSE = 4401       # Authentication required (custom)
INTERNAL_CLOSE = 1011   # Internal server error
RETRY_LATER = 1013      # Service restart / try again later
NORMAL_CLOSE = 1000     # Normal closure


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        """
        Handle WebSocket connection with production-grade error handling.

        Close Codes:
        - 4401: Authentication required (don't retry)
        - 1011: Internal server error
        - 1000: Normal closure
        """
        self.connection_start_time = time.time()
        token = set_correlation_id(self.scope.get("correlation_id"))

        try:
            # Extract thread_id from URL
            self.thread_id = self.scope.get("url_route", {}).get("kwargs", {}).get("thread_id")

            # Validate authentication
            user = self.scope.get("user")
            if not user or isinstance(user, AnonymousUser) or not getattr(user, "is_authenticated", False):
                # Production close code: 4401 (auth required)
                logger.warning(
                    "ws_connect_rejected",
                    extra={
                        "thread_id": self.thread_id,
                        "reason": "unauthenticated",
                        "code": AUTH_CLOSE,
                    }
                )
                reset_correlation_id(token)
                token = None
                await self.close(code=AUTH_CLOSE)

                # Track close in metrics
                if _PROMETHEUS_AVAILABLE and WS_CLOSES_TOTAL:
                    WS_CLOSES_TOTAL.labels(code=str(AUTH_CLOSE), reason="unauth").inc()
                return

            # Accept connection
            await self.accept()
            self.group_name = f"thread-{self.thread_id}"

            # Join thread group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Track connection in metrics
            if _PROMETHEUS_AVAILABLE and WEBSOCKET_CONNECTIONS:
                WEBSOCKET_CONNECTIONS.labels(thread_id=str(self.thread_id)).inc()

            logger.info(
                "ws_connect_ok",
                extra={
                    "thread_id": self.thread_id,
                    "user_id": getattr(user, "id", None),
                }
            )

        except Exception as e:
            logger.error(
                "ws_connect_error",
                exc_info=True,
                extra={
                    "thread_id": getattr(self, "thread_id", None),
                    "error": str(e),
                }
            )
            await self.close(code=INTERNAL_CLOSE)
        finally:
            reset_correlation_id(token)

    async def disconnect(self, code):
        """
        Handle WebSocket disconnection with duration tracking and metrics.

        Tracks:
        - Connection duration (histogram)
        - Close codes (counter)
        - Structured logging
        """
        # Calculate connection duration
        duration = 0.0
        if hasattr(self, "connection_start_time"):
            duration = max(0.0, time.time() - self.connection_start_time)

            # Track duration in Prometheus
            if _PROMETHEUS_AVAILABLE and WS_CONNECTION_DURATION_SECONDS:
                WS_CONNECTION_DURATION_SECONDS.observe(duration)

        # Map close code to reason
        reason = self._get_close_reason(code)

        # Track close code in Prometheus
        if _PROMETHEUS_AVAILABLE and WS_CLOSES_TOTAL:
            WS_CLOSES_TOTAL.labels(code=str(code or NORMAL_CLOSE), reason=reason).inc()

        # Structured logging
        logger.info(
            "ws_disconnect",
            extra={
                "thread_id": getattr(self, "thread_id", None),
                "code": code,
                "reason": reason,
                "duration_seconds": round(duration, 2),
            }
        )

        # Leave thread group
        if hasattr(self, "group_name"):
            try:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)

                # Untrack connection in metrics
                if _PROMETHEUS_AVAILABLE and WEBSOCKET_CONNECTIONS:
                    WEBSOCKET_CONNECTIONS.labels(thread_id=str(self.thread_id)).dec()
            except Exception as e:
                logger.warning(
                    "ws_group_discard_error",
                    extra={"thread_id": getattr(self, "thread_id", None), "error": str(e)}
                )

    def _get_close_reason(self, code: int) -> str:
        """
        Map WebSocket close code to human-readable reason.

        Close Code Categories:
        - Normal: 1000 (normal closure)
        - Client-initiated: 1001 (going away)
        - Errors: 1002 (protocol), 1003 (unsupported), 1006 (abnormal)
        - Policy: 1008 (policy violation), 4401 (auth required)
        - Server: 1011 (internal error), 1012 (restart), 1013 (try again)
        """
        close_reasons = {
            NORMAL_CLOSE: "normal_closure",
            1001: "going_away",
            1002: "protocol_error",
            1003: "unsupported_data",
            1006: "abnormal_closure",
            1008: "policy_violation",
            INTERNAL_CLOSE: "internal_error",
            1012: "service_restart",
            RETRY_LATER: "try_again_later",
            AUTH_CLOSE: "auth_required",
        }
        return close_reasons.get(code, "unknown")

    async def receive_json(self, content, **kwargs):
        """
        Handle incoming JSON messages from client.

        Supports:
        - client_hello: For typing state recovery (optional)
        - Future: client pings, typing indicators
        """
        msg_type = content.get("type")

        if msg_type == "client_hello":
            # Client reconnected, could re-emit typing state here
            logger.debug(
                "ws_client_hello",
                extra={"thread_id": getattr(self, "thread_id", None)}
            )
            # Future: Re-emit typing_done if backend has pending state
        # Future: Handle client typing, pings, etc.

    async def safe_send_json(self, payload):
        """
        Send JSON with error tracking and frame counting.

        Tracks:
        - Send failures (counter)
        - Frame counts by event type (counter)
        """
        try:
            await self.send(text_data=json.dumps(payload))

            # Track frame sent by event type
            if _PROMETHEUS_AVAILABLE and WS_FRAMES_SENT_TOTAL:
                event_type = payload.get("event", "unknown")
                WS_FRAMES_SENT_TOTAL.labels(event=event_type).inc()

        except Exception as e:
            logger.error(
                "ws_send_error",
                exc_info=True,
                extra={
                    "thread_id": getattr(self, "thread_id", None),
                    "error": str(e),
                }
            )
            if _PROMETHEUS_AVAILABLE and WS_MESSAGE_SEND_ERRORS:
                WS_MESSAGE_SEND_ERRORS.inc()
            raise

    # ===== Channels event handlers (called by group_send) =====

    async def chat_message(self, event):
        """
        Handle chat_message event from Celery task.

        Called via: channel_layer.group_send(group_name, {"type": "chat.message", "data": {...}})

        Note: Channels converts "chat.message" → calls chat_message()
        """
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            # Extract payload (support both event["data"] and direct event)
            data = event.get("data") or event

            if not isinstance(data, dict):
                await self.safe_send_json(data)
                return

            # Normalize meta.in_reply_to (backward compat)
            meta = data.setdefault("meta", {})
            if isinstance(meta, dict) and "reply_to" in data and "in_reply_to" not in meta:
                meta["in_reply_to"] = data.pop("reply_to")

            await self.safe_send_json(data)

        finally:
            reset_correlation_id(token)

    async def chat_error(self, event):
        """Handle chat_error event."""
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            await self.safe_send_json(event)
        finally:
            reset_correlation_id(token)

    async def chat_status(self, event):
        """Handle chat_status event (typing indicators)."""
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            await self.safe_send_json(event)
        finally:
            reset_correlation_id(token)
