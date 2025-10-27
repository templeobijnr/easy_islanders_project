from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from typing import Any, Dict
import uuid

from .brain.intent_router import run_router


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def route_intent(request):
    """POST /api/route – Classify and route a user utterance (skeleton)."""
    payload: Dict[str, Any] = request.data or {}
    utterance = (payload.get("utterance") or payload.get("message") or "").strip()
    thread_id = payload.get("thread_id") or str(uuid.uuid4())
    context_hint = payload.get("context_hint") or {}
    if not utterance:
        return Response({"error": "utterance is required"}, status=status.HTTP_400_BAD_REQUEST)
    decision = run_router(utterance, thread_id, context_hint)
    return Response(decision, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def router_feedback(request):
    """POST /api/feedback – Submit routing outcome feedback (HIT/MISS, corrected_intent)."""
    data = request.data or {}
    hit = bool(data.get("hit"))
    corrected = data.get("corrected_intent")
    # In a future milestone, persist into router_events/calibration store.
    return Response({"ack": True, "recorded": {"hit": hit, "corrected_intent": corrected}}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_registered_agents(request):
    """GET /api/registry/agents – List registered agents (stubbed registry)."""
    agents = [
        {
            "agent_id": "real_estate_agent",
            "domain": "real_estate",
            "description": "Property search and booking",
            "coverage": {"tools": ["search_internal_listings"], "locales": ["en", "tr", "ru"], "sla_ms": 800},
            "version": "v1",
        },
        {
            "agent_id": "marketplace_agent",
            "domain": "marketplace",
            "description": "General product and vehicle search",
            "coverage": {"tools": ["search_marketplace"], "locales": ["en"], "sla_ms": 900},
            "version": "v1",
        },
        {
            "agent_id": "local_info_agent",
            "domain": "local_info",
            "description": "Local lookup (pharmacies, clinics)",
            "coverage": {"tools": ["tavily"], "locales": ["en"], "sla_ms": 1200},
            "version": "v1",
        },
    ]
    return Response({"results": agents}, status=status.HTTP_200_OK)

