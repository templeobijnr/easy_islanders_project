from uuid import UUID, uuid4

from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import Throttled

from assistant.models import ConversationThread, Message
from assistant.tasks import process_chat_message  # celery task
from assistant.utils.correlation import set_correlation_id, reset_correlation_id


def _resolve_thread_for_user(user, raw_thread_id):
    """
    Resolve the requested thread for the authenticated user.

    Accepts either the public UUID (thread_id field) or, for backwards compatibility,
    the numeric primary key. Falls back to the active thread (creating one if needed).
    """
    thread = None
    if raw_thread_id:
        # First try to interpret as UUID against the thread_id field
        try:
            uuid_val = UUID(str(raw_thread_id))
        except (TypeError, ValueError):
            uuid_val = None
        if uuid_val:
            thread = ConversationThread.objects.filter(
                user=user,
                thread_id=str(uuid_val),
            ).first()

        # Fallback: legacy integer primary key lookup
        if thread is None:
            try:
                pk_val = int(str(raw_thread_id))
            except (TypeError, ValueError):
                pk_val = None
            if pk_val is not None:
                thread = ConversationThread.objects.filter(
                    user=user,
                    pk=pk_val,
                ).first()

    if thread is None:
        # Reuse or create the active thread for the user
        thread, _ = ConversationThread.get_or_create_active(user)

    return thread


class ChatEnqueueView(APIView):
    """
    Chat endpoint with idempotency, rate limiting, and transaction-safe task enqueueing.
    Gate B: Uses DRF throttling for proper 429 responses.
    """
    
    throttle_scope = 'user'  # 10/min via REST_FRAMEWORK settings

    def handle_exception(self, exc):
        """Gate B: Custom 429 message for rate limiting"""
        if isinstance(exc, Throttled):
            exc.default_detail = "Rate limit exceeded (10/min). Please retry shortly."
        return super().handle_exception(exc)

    def post(self, request):
        user = request.user
        text = (request.data or {}).get("message", "").strip()
        if not text:
            return Response({"ok": False, "error": "message required"}, status=400)

        payload = request.data or {}
        thread = _resolve_thread_for_user(user, payload.get("thread_id"))

        # Validate or generate client_msg_id for idempotency
        raw_client_msg_id = payload.get("client_msg_id")
        if raw_client_msg_id:
            try:
                client_uuid = UUID(str(raw_client_msg_id))
            except (TypeError, ValueError):
                return Response({"ok": False, "error": "invalid client_msg_id format, must be UUID"}, status=400)
        else:
            # Server-side generation if client doesn't provide (backwards compatible)
            client_uuid = uuid4()

        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())

        token = set_correlation_id(correlation_id)
        try:
            with transaction.atomic():
                # Check for existing message with same client_msg_id (idempotency)
                existing = Message.objects.filter(
                    conversation_id=thread.thread_id,
                    client_msg_id=client_uuid
                ).first()

                if existing:
                    # Idempotent response: return existing message details
                    return Response({
                        "ok": True,
                        "thread_id": str(thread.thread_id),
                        "queued_message_id": str(existing.id),
                        "client_msg_id_echo": str(client_uuid),
                        "correlation_id": correlation_id,
                        "idempotent": True,
                    }, status=202)

                # Create a user message record in the unified schema
                message = Message.objects.create(
                    type="user",
                    conversation_id=thread.thread_id,
                    content=text,
                    sender=user,
                    client_msg_id=client_uuid,
                )

                # Enqueue background processing (Celery) AFTER transaction commits
                # This ensures the message is visible to the Celery worker
                msg_id = str(message.id)
                thread_id_str = str(thread.thread_id)
                client_id = str(client_uuid)

                transaction.on_commit(
                    lambda: process_chat_message.apply_async(
                        kwargs={
                            "message_id": msg_id,
                            "thread_id": thread_id_str,
                            "client_msg_id": client_id,
                        },
                        headers={"correlation_id": correlation_id},
                    )
                )

            return Response({
                "ok": True,
                "thread_id": str(thread.thread_id),
                "queued_message_id": str(message.id),
                "client_msg_id_echo": str(client_uuid),
                "correlation_id": correlation_id,
            }, status=202)
        finally:
            reset_correlation_id(token)
