from channels.generic.websocket import AsyncJsonWebsocketConsumer

from assistant.utils.correlation import set_correlation_id, reset_correlation_id

# Gate B: Import WebSocket metrics
try:
    from assistant.monitoring.metrics import (
        WEBSOCKET_CONNECTIONS,
        WS_MESSAGE_SEND_ERRORS,
        _PROMETHEUS_AVAILABLE,
    )
except ImportError:
    WEBSOCKET_CONNECTIONS = None
    WS_MESSAGE_SEND_ERRORS = None
    _PROMETHEUS_AVAILABLE = False

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        token = set_correlation_id(self.scope.get("correlation_id"))
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        user = self.scope.get("user")
        if not (user and getattr(user, "is_authenticated", False)):
            reset_correlation_id(token)
            await self.close(code=4401)
            return

        await self.accept()  # accept first to avoid handshake resets
        self.group_name = f"thread-{self.thread_id}"
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            # Gate B: Track WebSocket connection
            if _PROMETHEUS_AVAILABLE and WEBSOCKET_CONNECTIONS:
                WEBSOCKET_CONNECTIONS.labels(thread_id=str(self.thread_id)).inc()
        except Exception as e:
            await self.send_json({
                "type": "chat_error",
                "event": "server_error",
                "error": str(e),
            })
        finally:
            reset_correlation_id(token)

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            try:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
                # Gate B: Untrack WebSocket connection
                if _PROMETHEUS_AVAILABLE and WEBSOCKET_CONNECTIONS:
                    WEBSOCKET_CONNECTIONS.labels(thread_id=str(self.thread_id)).dec()
            except Exception:
                pass

    async def receive_json(self, content, **kwargs):
        # Optional: allow client pings/typing
        pass

    async def safe_send_json(self, payload):
        """
        Send JSON with error tracking.

        Tracks send failures in Prometheus metrics for observability.
        """
        try:
            await self.send_json(payload)
        except Exception as e:
            if _PROMETHEUS_AVAILABLE and WS_MESSAGE_SEND_ERRORS:
                WS_MESSAGE_SEND_ERRORS.inc()
            raise

    # Called by Celery task via channel_layer.group_send
    async def chat_message(self, event):
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            data = event.get("data") or event
            if not isinstance(data, dict):
                await self.safe_send_json(data)
                return
            meta = data.setdefault("meta", {})
            if isinstance(meta, dict) and "reply_to" in data and "in_reply_to" not in meta:
                meta["in_reply_to"] = data.pop("reply_to")
            await self.safe_send_json(data)
        finally:
            reset_correlation_id(token)

    async def chat_error(self, event):
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            await self.safe_send_json(event)
        finally:
            reset_correlation_id(token)

    async def chat_status(self, event):
        token = set_correlation_id(self.scope.get("correlation_id"))
        try:
            await self.safe_send_json(event)
        finally:
            reset_correlation_id(token)
