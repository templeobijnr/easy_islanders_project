from django.urls import path
from assistant.views_core import ChatEnqueueView
from assistant.views.health import redis_health

urlpatterns = [
    path("chat/", ChatEnqueueView.as_view(), name="chat-enqueue"),
    path("health/redis/", redis_health, name="health-redis"),
]
