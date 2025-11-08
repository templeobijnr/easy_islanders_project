"""
Memory Debug API Endpoint

Provides introspection into dual-layer memory system for debugging and monitoring.

Exposes:
- Session memory (Zep v2) state
- Graph memory (Zep v3) preferences
- Context fusion preview
- Performance metrics

Usage:
    GET /api/memory/debug?user_id=user_123
    GET /api/memory/debug?user_id=user_123&thread_id=thread_456
    GET /api/memory/debug?user_id=user_123&include_metrics=true

Response:
    {
        "user_id": "user_123",
        "session_memory": {
            "thread_id": "thread_456",
            "message_count": 12,
            "summary": "...",
            "recent_turns": [...]
        },
        "graph_memory": {
            "preferences": {"location": "Girne", ...},
            "fact_count": 5,
            "last_updated": "2025-11-08T14:30:00Z"
        },
        "context_fusion": "...",
        "metrics": {...}
    }
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from assistant.memory.graph_manager import get_graph_manager
from assistant.brain.zep_client import ZepClient
from assistant.brain.graph_slot_prefill import get_preference_summary
import os

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["GET"])
def memory_debug_view(request):
    """
    Debug endpoint for inspecting dual-layer memory state.

    Query Parameters:
        user_id (required): User identifier
        thread_id (optional): Specific thread to inspect
        include_metrics (optional): Include performance metrics (default: false)
        include_raw (optional): Include raw Zep responses (default: false)

    Returns:
        JSON response with memory state

    Example:
        GET /api/memory/debug?user_id=user_123&thread_id=thread_456&include_metrics=true

    Security:
        This endpoint should be restricted to admins/debugging in production.
        Add authentication decorator: @permission_required('assistant.view_memory_debug')
    """
    # Get parameters
    user_id = request.GET.get("user_id")
    thread_id = request.GET.get("thread_id")
    include_metrics = request.GET.get("include_metrics", "false").lower() == "true"
    include_raw = request.GET.get("include_raw", "false").lower() == "true"

    if not user_id:
        return JsonResponse(
            {"error": "user_id parameter is required"},
            status=400
        )

    try:
        # Build response
        response = {
            "user_id": user_id,
            "thread_id": thread_id,
            "timestamp": datetime.utcnow().isoformat(),
            "session_memory": _get_session_memory_state(user_id, thread_id, include_raw),
            "graph_memory": _get_graph_memory_state(user_id, include_raw),
            "context_fusion": _build_context_fusion_preview(user_id, thread_id),
        }

        if include_metrics:
            response["metrics"] = _get_memory_metrics(user_id)

        return JsonResponse(response)

    except Exception as e:
        logger.error("[MemoryDebug] Failed to build debug response: %s", e, exc_info=True)
        return JsonResponse(
            {
                "error": "Internal server error",
                "message": str(e),
                "user_id": user_id
            },
            status=500
        )


def _get_session_memory_state(
    user_id: str,
    thread_id: Optional[str],
    include_raw: bool
) -> Dict[str, Any]:
    """Get session memory (Zep v2) state."""
    try:
        zep_client = ZepClient(
            base_url=os.getenv("ZEP_URL"),
            api_key=os.getenv("ZEP_API_KEY")
        )

        if not thread_id:
            return {
                "status": "no_thread_id",
                "message": "Provide thread_id to inspect session memory"
            }

        # Get session memory
        try:
            # Get recent messages
            memory = zep_client.get_memory(session_id=thread_id)

            session_state = {
                "thread_id": thread_id,
                "status": "active",
                "message_count": len(memory.get("messages", [])) if memory else 0,
                "summary": memory.get("summary") if memory else None,
                "recent_turns": []
            }

            # Parse recent turns
            if memory and "messages" in memory:
                messages = memory["messages"][-5:]  # Last 5 turns
                for msg in messages:
                    session_state["recent_turns"].append({
                        "role": msg.get("role"),
                        "content": msg.get("content", "")[:200],  # Truncate for readability
                        "timestamp": msg.get("created_at")
                    })

            if include_raw:
                session_state["raw_response"] = memory

            return session_state

        except Exception as e:
            logger.warning("[MemoryDebug] Session memory retrieval failed: %s", e)
            return {
                "thread_id": thread_id,
                "status": "error",
                "error": str(e)
            }

    except Exception as e:
        logger.error("[MemoryDebug] Failed to initialize Zep client: %s", e)
        return {
            "status": "unavailable",
            "error": "Zep client initialization failed"
        }


def _get_graph_memory_state(
    user_id: str,
    include_raw: bool
) -> Dict[str, Any]:
    """Get graph memory (Zep v3) state."""
    try:
        graph_mgr = get_graph_manager()
        if graph_mgr is None:
            return {
                "status": "unavailable",
                "message": "GraphManager not initialized"
            }

        # Get preference summary
        summary = get_preference_summary(user_id)

        graph_state = {
            "user_id": user_id,
            "status": "active",
            "preferences": summary.get("sample", {}),
            "preference_types": summary.get("preference_types", []),
            "fact_count": summary.get("total_preferences", 0),
            "last_updated": summary.get("last_updated")
        }

        if include_raw:
            # Get raw preferences
            try:
                prefs = graph_mgr.get_user_preferences(user_id=user_id)
                graph_state["raw_preferences"] = prefs
            except Exception as e:
                logger.warning("[MemoryDebug] Raw preference retrieval failed: %s", e)
                graph_state["raw_error"] = str(e)

        # Get metrics if available
        try:
            metrics = graph_mgr.get_metrics()
            graph_state["graph_metrics"] = metrics
        except Exception as e:
            logger.debug("[MemoryDebug] Metrics not available: %s", e)

        return graph_state

    except Exception as e:
        logger.error("[MemoryDebug] Graph memory state failed: %s", e, exc_info=True)
        return {
            "status": "error",
            "error": str(e)
        }


def _build_context_fusion_preview(
    user_id: str,
    thread_id: Optional[str]
) -> str:
    """Build preview of what context fusion would generate."""
    try:
        # Simulate context fusion (same logic as supervisor_graph.py)
        context_parts = []

        # 1. Graph preferences
        graph_mgr = get_graph_manager()
        if graph_mgr:
            try:
                prefs = graph_mgr.get_user_preferences(user_id=user_id)
                if prefs:
                    prefs_lines = []
                    for edge in prefs:
                        fact = edge.get("fact", "")
                        target = edge.get("target", "")
                        if fact.startswith("prefers_"):
                            pref_type = fact[8:]
                            prefs_lines.append(f"- {pref_type}: {target}")

                    if prefs_lines:
                        context_parts.append(
                            "[User Preferences (Graph)]:\n" + "\n".join(prefs_lines)
                        )
            except Exception as e:
                logger.debug("[MemoryDebug] Graph context failed: %s", e)

        # 2. Session summary (if thread_id provided)
        if thread_id:
            try:
                zep_client = ZepClient(
                    base_url=os.getenv("ZEP_URL"),
                    api_key=os.getenv("ZEP_API_KEY")
                )
                memory = zep_client.get_memory(session_id=thread_id)

                if memory and memory.get("summary"):
                    context_parts.append(
                        f"[Conversation Summary]:\n{memory['summary']}"
                    )

                # Recent turns
                if memory and "messages" in memory:
                    recent = memory["messages"][-3:]
                    if recent:
                        history_lines = []
                        for msg in recent:
                            role = msg.get("role", "").capitalize()
                            content = msg.get("content", "")[:100]
                            history_lines.append(f"{role}: {content}")

                        context_parts.append(
                            "[Recent Conversation]:\n" + "\n".join(history_lines)
                        )
            except Exception as e:
                logger.debug("[MemoryDebug] Session context failed: %s", e)

        if not context_parts:
            return "(No context available)"

        return "\n\n".join(context_parts)

    except Exception as e:
        logger.error("[MemoryDebug] Context fusion preview failed: %s", e)
        return f"(Error building preview: {e})"


def _get_memory_metrics(user_id: str) -> Dict[str, Any]:
    """Get performance metrics for memory operations."""
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id
    }

    # Graph metrics
    try:
        graph_mgr = get_graph_manager()
        if graph_mgr:
            graph_metrics = graph_mgr.get_metrics()
            metrics["graph"] = graph_metrics
    except Exception as e:
        logger.debug("[MemoryDebug] Graph metrics unavailable: %s", e)
        metrics["graph"] = {"error": str(e)}

    # Session metrics (if available)
    # TODO: Add Zep v2 metrics when ZepClient exposes them

    return metrics


# URL configuration (add to assistant/urls.py):
# path('memory/debug', memory_debug_view, name='memory_debug'),
