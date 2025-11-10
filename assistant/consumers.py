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

            # STEP 6 + FIX: Rehydrate conversation state on reconnect and PUSH to client
            try:
                from assistant.brain.supervisor_graph import rehydrate_state, _get_checkpoint_state

                # Get rehydrated state from Zep
                rehydrated = rehydrate_state(self.thread_id)

                # Build comprehensive rehydration payload
                rehydration_payload = {
                    "type": "rehydration",
                    "thread_id": self.thread_id,
                    "rehydrated": rehydrated.get("rehydrated", False),
                    "active_domain": rehydrated.get("active_domain"),
                    "current_intent": rehydrated.get("current_intent"),
                    "conversation_summary": rehydrated.get("conversation_summary", "")[:500],  # Truncate to 500 chars
                    "turn_count": rehydrated.get("turn_count", 0),
                }

                # Try to get additional context from checkpoint
                try:
                    checkpoint_state = _get_checkpoint_state(self.thread_id)
                    if checkpoint_state:
                        # Add agent contexts
                        agent_contexts = checkpoint_state.get("agent_contexts", {})
                        if agent_contexts:
                            # Prune agent contexts to essential fields only
                            pruned_contexts = {}
                            for agent_name, agent_ctx in agent_contexts.items():
                                if isinstance(agent_ctx, dict):
                                    pruned_contexts[agent_name] = {
                                        "filled_slots": agent_ctx.get("filled_slots", {}),
                                        "stage": agent_ctx.get("stage"),
                                        "awaiting_slot": agent_ctx.get("awaiting_slot"),
                                    }
                            rehydration_payload["agent_contexts"] = pruned_contexts

                        # Add shared context (location, budget, etc.)
                        shared_context = {}
                        re_ctx = agent_contexts.get("real_estate_agent", {})
                        if isinstance(re_ctx, dict):
                            filled_slots = re_ctx.get("filled_slots", {})
                            if "location" in filled_slots:
                                shared_context["user_location"] = filled_slots["location"]
                            if "budget" in filled_slots:
                                shared_context["user_budget"] = filled_slots["budget"]
                        rehydration_payload["shared_context"] = shared_context

                        # Add recent turns (last 3)
                        messages = checkpoint_state.get("messages", [])
                        if messages:
                            recent_turns = messages[-6:]  # Last 3 exchanges (user + assistant)
                            rehydration_payload["recent_turns"] = [
                                {
                                    "role": msg.get("role"),
                                    "content": str(msg.get("content", ""))[:200]  # Truncate content
                                }
                                for msg in recent_turns
                            ]
                except Exception as checkpoint_error:
                    logger.debug(
                        "ws_connect_checkpoint_fetch_failed",
                        extra={"thread_id": self.thread_id, "error": str(checkpoint_error)}
                    )

                # Try to get user profile (minimal, PII-safe)
                try:
                    user_profile = {
                        "user_id": str(getattr(user, "id", None)),
                        "language": getattr(user, "preferred_language", "en"),
                    }
                    rehydration_payload["user_profile"] = user_profile
                except Exception:
                    pass

                # PUSH rehydration payload to client immediately
                await self.safe_send_json(rehydration_payload)

                if rehydrated.get("rehydrated"):
                    logger.info(
                        "ws_connect_rehydrated_pushed",
                        extra={
                            "thread_id": self.thread_id,
                            "domain": rehydrated.get("active_domain"),
                            "intent": rehydrated.get("current_intent"),
                            "turns": rehydrated.get("turn_count"),
                        }
                    )
                else:
                    logger.info(
                        "ws_connect_no_rehydration_data",
                        extra={"thread_id": self.thread_id}
                    )

            except Exception as rehydrate_error:
                logger.warning(
                    "ws_connect_rehydrate_failed",
                    extra={
                        "thread_id": self.thread_id,
                        "error": str(rehydrate_error),
                    }
                )
                # Send minimal rehydration payload on error
                try:
                    await self.safe_send_json({
                        "type": "rehydration",
                        "thread_id": self.thread_id,
                        "rehydrated": False,
                        "error": "rehydration_failed"
                    })
                except Exception:
                    pass

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
        - user_event: User interaction events for agent awareness
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

        elif msg_type == "user_event":
            # Handle user interaction events (listing selection, card clicks, etc.)
            await self.handle_user_event(content)

        # Future: Handle client typing, pings, etc.

    async def handle_user_event(self, content):
        """
        Handle user interaction events for agent awareness.

        Events include:
        - select_listing: User clicked on a listing card
        - view_gallery: User opened gallery modal
        - initiate_contact: User started contact flow

        These events update the conversation capsule to inform agent context.
        """
        event_type = content.get("event_type")
        payload = content.get("payload", {})
        thread_id = content.get("thread_id") or getattr(self, "thread_id", None)

        logger.info(
            "ws_user_event",
            extra={
                "thread_id": thread_id,
                "event_type": event_type,
                "payload_keys": list(payload.keys()) if isinstance(payload, dict) else None,
            }
        )

        if event_type == "select_listing":
            # Update conversation capsule with active listing
            try:
                from assistant.memory.service import update_conversation_capsule

                update_conversation_capsule(thread_id, {"active_listing": payload})

                logger.info(
                    "user_event_processed",
                    extra={
                        "thread_id": thread_id,
                        "event_type": event_type,
                        "listing_id": payload.get("listing_id"),
                    }
                )

                # Optional: Sync user interaction to Zep Graph for long-term memory
                try:
                    from assistant.memory.graph_manager import get_graph_manager
                    from django.conf import settings

                    # Only sync if Zep Graph is enabled
                    if getattr(settings, "ZEP_GRAPH_ENABLED", False):
                        graph_mgr = get_graph_manager()
                        user = self.scope.get("user")

                        if graph_mgr and user and hasattr(user, "id"):
                            # Sync user→listing interaction as graph edge
                            graph_mgr.add_fact_triplet(
                                user_id=str(user.id),
                                source_node_name=f"user_{user.id}",
                                target_node_name=f"listing_{payload.get('listing_id')}",
                                fact=f"viewed_listing_{payload.get('listing_id')}",
                                confidence=0.95,
                            )
                            logger.info(
                                "graph_sync_success",
                                extra={
                                    "user_id": user.id,
                                    "listing_id": payload.get("listing_id"),
                                    "event_type": event_type,
                                }
                            )
                except Exception as graph_err:
                    # Graph sync is best-effort, don't fail the event
                    logger.warning(
                        "graph_sync_failed",
                        extra={
                            "thread_id": thread_id,
                            "event_type": event_type,
                            "error": str(graph_err),
                        }
                    )

                # Send acknowledgement to client
                await self.safe_send_json({
                    "type": "user_event_ack",
                    "event_type": event_type,
                    "status": "success",
                })

            except Exception as e:
                logger.error(
                    "user_event_error",
                    exc_info=True,
                    extra={
                        "thread_id": thread_id,
                        "event_type": event_type,
                        "error": str(e),
                    }
                )
                await self.safe_send_json({
                    "type": "user_event_ack",
                    "event_type": event_type,
                    "status": "error",
                    "error": str(e),
                })

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
