from __future__ import annotations

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from typing import Any, Dict
import uuid

from .graph import run_router
from assistant.monitoring.metrics import (
    observe_router_latency,
    inc_router_request,
    inc_router_uncertain,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def route_intent(request):
    payload: Dict[str, Any] = request.data or {}
    utterance = (payload.get("utterance") or payload.get("message") or "").strip()
    thread_id = payload.get("thread_id") or str(uuid.uuid4())
    context_hint = payload.get("context_hint") or {}
    if not utterance:
        return Response({"error": "utterance is required"}, status=status.HTTP_400_BAD_REQUEST)
    # Metrics: start
    inc_router_request(status="start", domain="*")
    decision = run_router(utterance, thread_id, context_hint)
    # Metrics: end
    try:
        observe_router_latency(decision.get('domain_choice', {}).get('domain', '*'), float(decision.get('latency_ms', 0))/1000.0)
        action = decision.get('action') or 'dispatch'
        inc_router_request(status=action, domain=decision.get('domain_choice', {}).get('domain', '*'))
        if action == 'clarify':
            inc_router_uncertain(domain=decision.get('domain_choice', {}).get('domain', '*'))
    except Exception:
        pass
    return Response(decision, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def router_feedback(request):
    data = request.data or {}
    hit = bool(data.get("hit"))
    corrected = data.get("corrected_intent")
    # Future: persist to RouterEvent for learning
    return Response({"ack": True, "recorded": {"hit": hit, "corrected_intent": corrected}}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_registered_agents(request):
    agents = [
        {"agent_id": "real_estate_agent", "domain": "real_estate", "description": "Property search and booking", "coverage": {"tools": ["search_internal_listings"], "locales": ["en", "tr", "ru"], "sla_ms": 800}, "version": "v1"},
        {"agent_id": "marketplace_agent", "domain": "marketplace", "description": "General product and vehicle search", "coverage": {"tools": ["search_marketplace"], "locales": ["en"], "sla_ms": 900}, "version": "v1"},
        {"agent_id": "local_info_agent", "domain": "local_info", "description": "Local lookup (pharmacies, clinics)", "coverage": {"tools": ["tavily"], "locales": ["en"], "sla_ms": 1200}, "version": "v1"},
    ]
    return Response({"results": agents}, status=status.HTTP_200_OK)

