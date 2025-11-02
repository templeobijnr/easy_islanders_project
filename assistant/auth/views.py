"""
Custom JWT token views with cookie support.
"""
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .cookies import set_jwt_cookies, clear_jwt_cookies


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint that sets JWT cookies instead of returning tokens in body.
    """

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            # Set cookies
            set_jwt_cookies(response, access_token, refresh_token)

            # Remove tokens from response body (security best practice)
            payload = {
                'ok': True,
                'message': 'Authentication successful. Cookies set.',
            }
            if getattr(settings, 'FEATURE_FLAG_ALLOW_HEADER_AUTH', False):
                if access_token:
                    payload['access'] = access_token
                if refresh_token:
                    payload['refresh'] = refresh_token

            response.data = payload

        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    Refresh endpoint that reads/writes cookies.
    """

    def post(self, request, *args, **kwargs):
        # Inject refresh token from cookie into request data
        refresh_token = request.COOKIES.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token not found in cookies'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Override request data
        request.data._mutable = True  # Make QueryDict mutable
        request.data['refresh'] = refresh_token
        request.data._mutable = False

        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')
            # Refresh token may be rotated
            new_refresh_token = response.data.get('refresh', refresh_token)

            # Update cookies
            set_jwt_cookies(response, access_token, new_refresh_token)

            payload = {
                'ok': True,
                'message': 'Tokens refreshed. Cookies updated.',
            }
            if getattr(settings, 'FEATURE_FLAG_ALLOW_HEADER_AUTH', False):
                if access_token:
                    payload['access'] = access_token
                if new_refresh_token:
                    payload['refresh'] = new_refresh_token

            response.data = payload

        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint that clears JWT cookies.
    """
    response = Response(
        {'ok': True, 'message': 'Logged out successfully'},
        status=status.HTTP_204_NO_CONTENT
    )
    clear_jwt_cookies(response)
    return response
