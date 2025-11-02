"""
WebSocket authentication middleware with cookie support.

Order of precedence:
1. "access" cookie (primary in production)
2. ?token=... query param (only in DEBUG or if explicitly enabled)
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token_str):
    """
    Validate JWT and return user.

    Returns:
        User object if valid, AnonymousUser if invalid
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        validated_token = AccessToken(token_str)
        user_id = validated_token['user_id']
        user = User.objects.get(pk=user_id, is_active=True)
        return user
    except Exception:
        return AnonymousUser()


class CookieOrQueryTokenAuthMiddleware(BaseMiddleware):
    """
    WebSocket authentication middleware supporting cookies and query params.

    Security:
    - Cookies are primary auth mechanism (HttpOnly, can't be stolen by XSS)
    - Query param fallback only in DEBUG mode or with explicit flag
    """

    async def __call__(self, scope, receive, send):
        # Extract cookies from headers
        cookies = {}
        for name, value in scope.get('headers', []):
            if name == b'cookie':
                cookie_str = value.decode('utf-8')
                for cookie in cookie_str.split('; '):
                    if '=' in cookie:
                        key, val = cookie.split('=', 1)
                        cookies[key] = val

        token = None
        auth_method = None

        # Method 1: Try cookie (primary)
        if 'access' in cookies:
            token = cookies['access']
            auth_method = 'cookie'

        # Method 2: Query param fallback (dev only or explicitly enabled)
        allow_query_token = settings.DEBUG or getattr(
            settings, 'FEATURE_FLAG_ALLOW_QUERY_TOKEN', False
        )

        if not token and allow_query_token:
            query_string = scope.get('query_string', b'').decode('utf-8')
            query_params = parse_qs(query_string)
            if 'token' in query_params:
                token = query_params['token'][0]
                auth_method = 'query'

        # Authenticate
        if token:
            scope['user'] = await get_user_from_token(token)
            scope['auth_method'] = auth_method
        else:
            scope['user'] = AnonymousUser()
            scope['auth_method'] = None

        return await super().__call__(scope, receive, send)
