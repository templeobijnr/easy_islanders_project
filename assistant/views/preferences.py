from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache

from assistant.services.preferences import PreferenceService
from assistant.models import ConversationThread


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_active_preferences(request):
    """
    Return active user preferences grouped by category.

    Query params:
    - category: optional category filter (e.g., "real_estate")
    - min_confidence: float threshold (default 0.5)
    """
    try:
        min_conf = float(request.GET.get("min_confidence", "0.5"))
    except ValueError:
        min_conf = 0.5

    category = request.GET.get("category")

    prefs = PreferenceService.get_active_preferences(request.user.id, min_confidence=min_conf)
    if category:
        prefs = {category: prefs.get(category, [])}

    return Response({"preferences": prefs})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def set_thread_personalization(request, thread_id: str):
    """
    Toggle per-thread personalization (pause/resume applying saved preferences).

    Body: {"paused": true|false}
    """
    # Verify thread belongs to the current user
    thread = ConversationThread.objects.filter(user=request.user, thread_id=str(thread_id)).first()
    if not thread:
        return Response({"ok": False, "error": "thread_not_found"}, status=status.HTTP_404_NOT_FOUND)

    paused = bool(request.data.get("paused", False))
    cache_key = f"thread:{thread_id}:personalization_paused"
    # Store for 30 days; refreshed on subsequent writes
    cache.set(cache_key, paused, timeout=60 * 60 * 24 * 30)

    return Response({"ok": True, "thread_id": str(thread_id), "paused": paused})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_thread_personalization(request, thread_id: str):
    """
    Return per-thread personalization pause state.

    Response: {"ok": true, "thread_id": "...", "paused": bool}
    """
    # Verify thread belongs to the current user
    thread = ConversationThread.objects.filter(user=request.user, thread_id=str(thread_id)).first()
    if not thread:
        return Response({"ok": False, "error": "thread_not_found"}, status=status.HTTP_404_NOT_FOUND)

    cache_key = f"thread:{thread_id}:personalization_paused"
    paused = bool(cache.get(cache_key, False))
    return Response({"ok": True, "thread_id": str(thread_id), "paused": paused})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upsert_preference(request):
    """
    Create or update a user preference.

    Body:
    {
      "category": "real_estate",            # optional, default real_estate
      "preference_type": "location",        # required
      "value": { ... },                      # required (structured JSON)
      "confidence": 0.9,                     # optional (default 0.9)
      "source": "explicit"                   # optional (default explicit)
    }
    """
    payload = request.data or {}
    category = payload.get("category") or "real_estate"
    pref_type = payload.get("preference_type") or payload.get("type")
    value = payload.get("value")
    confidence = float(payload.get("confidence") or 0.9)
    source = payload.get("source") or "explicit"

    if not pref_type or value is None:
        return Response({"ok": False, "error": "preference_type and value required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        obj = PreferenceService.upsert_preference(
            user_id=request.user.id,
            category=str(category),
            preference_type=str(pref_type),
            value=value,
            confidence=confidence,
            source=str(source),
        )
        # Model has to_dict()
        data = getattr(obj, "to_dict", None)
        return Response({"ok": True, "preference": obj.to_dict() if callable(data) else {
            "id": str(obj.id),
            "category": obj.category,
            "preference_type": obj.preference_type,
            "value": obj.value,
            "confidence": obj.confidence,
            "source": obj.source,
        }})
    except Exception as e:
        return Response({"ok": False, "error": str(e)}, status=500)
