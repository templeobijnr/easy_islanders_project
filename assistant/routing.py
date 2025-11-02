# assistant/routing.py - WebSocket URL patterns for Channels
from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # Handle both with and without leading slash for flexibility
    re_path(r"^/?ws/chat/(?P<thread_id>[0-9a-f-]+)/?$", ChatConsumer.as_asgi()),
]
