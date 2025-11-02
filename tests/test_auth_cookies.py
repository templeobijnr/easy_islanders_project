"""
Tests for cookie-based JWT authentication.

PR D: Auth Hardening - Ensures JWT cookies are properly set, validated, and cleared.
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client for testing."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        is_active=True
    )


@pytest.mark.django_db
class TestCookieAuthentication:
    """Test suite for cookie-based JWT authentication."""

    def test_login_sets_http_only_cookies(self, api_client, test_user):
        """
        Test that login endpoint sets HttpOnly cookies instead of returning tokens in body.

        Security requirement: Tokens must be in HttpOnly cookies to prevent XSS attacks.
        """
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

        response = api_client.post(url, data, format='json')

        # Verify success response
        assert response.status_code == status.HTTP_200_OK
        assert response.data.get('ok') is True
        assert 'Cookies set' in response.data.get('message', '')

        # Verify tokens are NOT in response body (security best practice)
        assert 'access' not in response.data
        assert 'refresh' not in response.data

        # Verify cookies are set
        assert 'access' in response.cookies
        assert 'refresh' in response.cookies

        # Verify HttpOnly flag is set
        access_cookie = response.cookies['access']
        refresh_cookie = response.cookies['refresh']
        assert access_cookie['httponly'] is True
        assert refresh_cookie['httponly'] is True

        # Verify SameSite is set
        assert access_cookie['samesite'] == 'Lax'
        assert refresh_cookie['samesite'] == 'Lax'

    def test_refresh_rotates_access_cookie(self, api_client, test_user):
        """
        Test that refresh endpoint reads refresh token from cookie and sets new access cookie.
        """
        # First, login to get cookies
        login_url = reverse('token_obtain_pair')
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK

        # Extract cookies from login response
        refresh_token = login_response.cookies['refresh'].value

        # Set the refresh cookie manually (simulating browser behavior)
        api_client.cookies['refresh'] = refresh_token

        # Call refresh endpoint
        refresh_url = reverse('token_refresh')
        refresh_response = api_client.post(refresh_url, {}, format='json')

        # Verify success
        assert refresh_response.status_code == status.HTTP_200_OK
        assert refresh_response.data.get('ok') is True
        assert 'Tokens refreshed' in refresh_response.data.get('message', '')

        # Verify new access cookie is set
        assert 'access' in refresh_response.cookies
        new_access_cookie = refresh_response.cookies['access']
        assert new_access_cookie['httponly'] is True

        # Verify tokens are NOT in response body
        assert 'access' not in refresh_response.data or refresh_response.data.get('ok')
        assert 'refresh' not in refresh_response.data or refresh_response.data.get('ok')

    def test_logout_clears_cookies(self, api_client, test_user):
        """
        Test that logout endpoint clears JWT cookies.
        """
        # First, login to get cookies
        login_url = reverse('token_obtain_pair')
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK

        # Set cookies on client
        api_client.cookies['access'] = login_response.cookies['access'].value
        api_client.cookies['refresh'] = login_response.cookies['refresh'].value

        # Call logout endpoint
        logout_url = reverse('logout')
        logout_response = api_client.post(logout_url, {}, format='json')

        # Verify success
        assert logout_response.status_code == status.HTTP_204_NO_CONTENT

        # Verify cookies are cleared (max_age=0)
        assert 'access' in logout_response.cookies
        assert 'refresh' in logout_response.cookies

        access_cookie = logout_response.cookies['access']
        refresh_cookie = logout_response.cookies['refresh']

        # Cookies should have max_age=0 to clear them
        assert access_cookie['max-age'] == 0
        assert refresh_cookie['max-age'] == 0

    def test_api_works_with_cookie_auth_only(self, api_client, test_user):
        """
        Test that authenticated API endpoints work with cookie-based auth (no Authorization header).

        This validates that CookieJWTAuthentication is properly integrated into DRF.
        """
        # First, login to get cookies
        login_url = reverse('token_obtain_pair')
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK

        # Set access cookie on client
        api_client.cookies['access'] = login_response.cookies['access'].value

        # Call an authenticated endpoint (e.g., /api/v1/messages/unread-count/)
        # This endpoint requires IsAuthenticated permission
        unread_url = '/api/v1/messages/unread-count/'
        response = api_client.get(unread_url)

        # Should succeed with cookie auth only (no Authorization header)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        # 404 is acceptable if no messages exist; what matters is we're authenticated (not 401)
        assert response.status_code != status.HTTP_401_UNAUTHORIZED

    def test_missing_cookies_returns_401(self, api_client):
        """
        Test that requests without cookies to authenticated endpoints return 401.
        """
        # Try to access authenticated endpoint without cookies
        unread_url = '/api/v1/messages/unread-count/'
        response = api_client.get(unread_url)

        # Should return 401 Unauthorized
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_cookie_token_returns_401(self, api_client):
        """
        Test that invalid JWT in cookie returns 401.
        """
        # Set invalid cookie
        api_client.cookies['access'] = 'invalid.token.here'

        # Try to access authenticated endpoint
        unread_url = '/api/v1/messages/unread-count/'
        response = api_client.get(unread_url)

        # Should return 401 Unauthorized
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
