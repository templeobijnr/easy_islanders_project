"""
Tests for WebSocket cookie authentication.

PR D: Auth Hardening - Ensures WebSocket connections authenticate via cookies (primary)
and query params (dev fallback only).
"""
import pytest
import asyncio
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from easy_islanders.asgi import application

User = get_user_model()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    return User.objects.create_user(
        username='wsuser',
        email='ws@example.com',
        password='wspass123',
        is_active=True
    )


@pytest.fixture
def access_token(test_user):
    """Generate a valid access token for the test user."""
    token = AccessToken.for_user(test_user)
    return str(token)


@pytest.mark.django_db
@pytest.mark.asyncio
class TestWebSocketCookieAuth:
    """Test suite for WebSocket cookie-based authentication."""

    async def test_ws_handshake_with_cookie(self, test_user, access_token):
        """
        Test that WebSocket connection succeeds when access token is in cookie.

        Security requirement: Cookies are the PRIMARY auth method for WebSockets.
        """
        # Create WebSocket communicator with cookie header
        communicator = WebsocketCommunicator(
            application,
            "/ws/chat/"
        )

        # Set cookie header (simulates browser sending cookies)
        communicator.scope['headers'].append(
            (b'cookie', f'access={access_token}'.encode('utf-8'))
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Verify connection succeeded
        assert connected is True

        # Verify user is authenticated in scope
        assert communicator.scope['user'].is_authenticated
        assert communicator.scope['user'].username == 'wsuser'
        assert communicator.scope['auth_method'] == 'cookie'

        # Clean up
        await communicator.disconnect()

    async def test_ws_handshake_without_auth(self):
        """
        Test that WebSocket connection succeeds but user is anonymous without auth.

        Note: WebSocket connections don't reject unauthenticated users at handshake;
        they set scope['user'] = AnonymousUser() and let consumers handle auth checks.
        """
        # Create WebSocket communicator without auth
        communicator = WebsocketCommunicator(
            application,
            "/ws/chat/"
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Connection succeeds (WebSocket doesn't reject at handshake)
        assert connected is True

        # But user should be AnonymousUser
        assert not communicator.scope['user'].is_authenticated
        assert communicator.scope['auth_method'] is None

        # Clean up
        await communicator.disconnect()

    async def test_ws_accepts_query_token_in_debug(self, test_user, access_token, settings):
        """
        Test that WebSocket accepts query parameter token in DEBUG mode.

        This is a fallback for development/testing when cookies are inconvenient.
        """
        # Ensure we're in DEBUG mode
        settings.DEBUG = True

        # Create WebSocket communicator with query param token
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token={access_token}"
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Verify connection succeeded
        assert connected is True

        # Verify user is authenticated via query param
        assert communicator.scope['user'].is_authenticated
        assert communicator.scope['user'].username == 'wsuser'
        assert communicator.scope['auth_method'] == 'query'

        # Clean up
        await communicator.disconnect()

    async def test_ws_rejects_query_token_in_prod(self, test_user, access_token, settings):
        """
        Test that WebSocket IGNORES query parameter token in production (DEBUG=False).

        Security requirement: Query params leak tokens in logs/history, so they're
        disabled in production unless FEATURE_FLAG_ALLOW_QUERY_TOKEN is explicitly set.
        """
        # Simulate production mode
        settings.DEBUG = False
        settings.FEATURE_FLAG_ALLOW_QUERY_TOKEN = False

        # Create WebSocket communicator with query param token
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token={access_token}"
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Connection succeeds (doesn't reject at handshake)
        assert connected is True

        # But user should be ANONYMOUS because query param is ignored in prod
        assert not communicator.scope['user'].is_authenticated
        assert communicator.scope['auth_method'] is None

        # Clean up
        await communicator.disconnect()

    async def test_ws_cookie_precedence_over_query(self, test_user, access_token, settings):
        """
        Test that cookie takes precedence over query param when both are present.

        Security requirement: Cookies are more secure than query params, so they
        should be checked first.
        """
        # Ensure DEBUG mode (to allow query param fallback)
        settings.DEBUG = True

        # Create WebSocket communicator with BOTH cookie and query param
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token=invalid_token_here"
        )

        # Set valid cookie
        communicator.scope['headers'].append(
            (b'cookie', f'access={access_token}'.encode('utf-8'))
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Verify connection succeeded
        assert connected is True

        # Verify user is authenticated via COOKIE (not query param)
        assert communicator.scope['user'].is_authenticated
        assert communicator.scope['user'].username == 'wsuser'
        assert communicator.scope['auth_method'] == 'cookie'  # Cookie took precedence

        # Clean up
        await communicator.disconnect()

    async def test_ws_invalid_cookie_token(self):
        """
        Test that invalid JWT in cookie results in anonymous user.
        """
        # Create WebSocket communicator with invalid cookie
        communicator = WebsocketCommunicator(
            application,
            "/ws/chat/"
        )

        # Set invalid cookie
        communicator.scope['headers'].append(
            (b'cookie', b'access=invalid.jwt.token')
        )

        # Attempt WebSocket handshake
        connected, subprotocol = await communicator.connect()

        # Connection succeeds (doesn't reject at handshake)
        assert connected is True

        # But user should be anonymous
        assert not communicator.scope['user'].is_authenticated

        # Clean up
        await communicator.disconnect()
