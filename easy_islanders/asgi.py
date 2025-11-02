import os

import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "easy_islanders.settings")

# Ensure Django apps initialize before importing auth-dependent modules
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from assistant.routing import websocket_urlpatterns
from assistant.auth.ws_cookie_auth import CookieOrQueryTokenAuthMiddleware  # PR D: Cookie auth

# Fail fast if WebSocket support is missing
from .startup_checks import check_ws_support
check_ws_support()

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": CookieOrQueryTokenAuthMiddleware(  # PR D: Cookie-first auth
        URLRouter(websocket_urlpatterns)
    ),
})
