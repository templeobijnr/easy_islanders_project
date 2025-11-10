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

urlpatterns = [
    path("chat/", ChatEnqueueView.as_view(), name="chat-enqueue"),
    path("health/redis/", redis_health, name="health-redis"),
    path("preferences/active/", get_active_preferences, name="preferences-active"),
    path("preferences/", upsert_preference, name="preferences-upsert"),
    path("chat/thread/<str:thread_id>/personalization/", set_thread_personalization, name="chat-thread-personalization"),
    path("chat/thread/<str:thread_id>/personalization/state/", get_thread_personalization, name="chat-thread-personalization-state"),
    # Availability check via WhatsApp
    path("v1/availability/check/", check_availability, name="availability-check"),
    # Twilio WhatsApp webhook
    path("webhooks/twilio/whatsapp/", twilio_whatsapp_webhook, name="twilio-whatsapp-webhook"),
]
