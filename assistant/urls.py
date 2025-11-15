from django.urls import path
from assistant.views_core import ChatEnqueueView
from assistant.views.health import redis_health
from assistant.views.preferences import (
    get_active_preferences,
    set_thread_personalization,
    get_thread_personalization,
    upsert_preference,
)
from assistant.views.availability import check_availability
from assistant.views.twilio_webhook import twilio_whatsapp_webhook
from assistant.views.messages import (
    get_messages,
    get_unread_count,
    mark_thread_read,
    get_threads,
)
from assistant.views.listings import (
    migrate_legacy_data,
    get_current_conversation,
    create_new_conversation,
)

urlpatterns = [
    path("chat/", ChatEnqueueView.as_view(), name="chat-enqueue"),
    path("health/redis/", redis_health, name="health-redis"),
    path("preferences/active/", get_active_preferences, name="preferences-active"),
    path("preferences/", upsert_preference, name="preferences-upsert"),
    # Legacy client data migration (localStorage -> backend)
    path("migrate-legacy-data/", migrate_legacy_data, name="migrate-legacy-data"),
    # Conversation thread management (F.1)
    path("conversations/current/", get_current_conversation, name="conversations-current"),
    path("conversations/", create_new_conversation, name="conversations-create"),
    path("chat/thread/<str:thread_id>/personalization/", set_thread_personalization, name="chat-thread-personalization"),
    path("chat/thread/<str:thread_id>/personalization/state/", get_thread_personalization, name="chat-thread-personalization-state"),
    # Availability check via WhatsApp
    path("v1/availability/check/", check_availability, name="availability-check"),
    # Twilio WhatsApp webhook
    path("webhooks/twilio/whatsapp/", twilio_whatsapp_webhook, name="twilio-whatsapp-webhook"),
    # F.3 Messages API - V1.0 Contract
    path("v1/messages/", get_messages, name="messages-list"),
    path("v1/messages/unread-count/", get_unread_count, name="messages-unread-count"),
    path("v1/messages/<str:thread_id>/read_status/", mark_thread_read, name="messages-mark-read"),
    path("v1/threads/", get_threads, name="threads-list"),
]
