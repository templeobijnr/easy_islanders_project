"""
JWT cookie management for HttpOnly, Secure authentication.

Provides utilities to set/clear JWT cookies and a DRF authentication
class that reads cookies as primary auth mechanism.
"""
from datetime import timedelta
from typing import Optional

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken


def set_jwt_cookies(response, access_token: str, refresh_token: str) -> None:
    """
    Set HttpOnly JWT cookies on response.

    Args:
        response: Django/DRF Response object
        access_token: JWT access token string
        refresh_token: JWT refresh token string
    """
    cookie_secure = getattr(settings, 'JWT_COOKIE_SECURE', not settings.DEBUG)
    cookie_samesite = getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax')

    # Access token (short-lived)
    access_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=5))
    response.set_cookie(
        key='access',
        value=access_token,
        max_age=int(access_lifetime.total_seconds()),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path='/',
    )

    # Refresh token (long-lived)
    refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=1))
    response.set_cookie(
        key='refresh',
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path='/api/token/refresh/',  # Restrict to refresh endpoint
    )


def clear_jwt_cookies(response) -> None:
    """
    Clear JWT cookies on logout.

    Args:
        response: Django/DRF Response object
    """
    response.delete_cookie('access', path='/')
    response.delete_cookie('refresh', path='/api/token/refresh/')


class CookieJWTAuthentication(BaseAuthentication):
    """
    DRF authentication class that reads JWT from cookies.

    Order of precedence:
    1. "access" cookie (primary in production)
    2. Authorization header (fallback in dev, required for non-browser clients)
    """

    def authenticate(self, request):
        # Try cookie first
        access_token = request.COOKIES.get('access')

        if access_token:
            try:
                validated_token = AccessToken(access_token)
                user = self._get_user_from_token(validated_token)
                return (user, validated_token)
            except Exception as e:
                # Invalid cookie token, try header fallback in dev
                if settings.DEBUG or getattr(settings, 'FEATURE_FLAG_ALLOW_HEADER_AUTH', False):
                    return self._try_header_auth(request)
                raise AuthenticationFailed('Invalid or expired cookie token')

        # Fallback to header (dev mode or non-browser clients)
        if settings.DEBUG or getattr(settings, 'FEATURE_FLAG_ALLOW_HEADER_AUTH', False):
            return self._try_header_auth(request)

        # No authentication provided
        return None

    def _try_header_auth(self, request):
        """Fallback to standard JWT header authentication."""
        jwt_auth = JWTAuthentication()
        try:
            return jwt_auth.authenticate(request)
        except:
            return None

    def _get_user_from_token(self, validated_token):
        """Extract user from validated JWT token."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user_id = validated_token['user_id']
            user = User.objects.get(pk=user_id)
            if not user.is_active:
                raise AuthenticationFailed('User is inactive')
            return user
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
