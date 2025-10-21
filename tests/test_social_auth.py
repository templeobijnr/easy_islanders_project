"""
Social authentication tests (TDD)
Tests for Google and Facebook OAuth integration
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import json

User = get_user_model()


class GoogleAuthTests(TestCase):
    """Tests for Google OAuth authentication"""

    def setUp(self):
        self.client = APIClient()
        self.google_auth_url = '/api/auth/google/'

    @patch('users.views.id_token.verify_oauth2_token')
    def test_user_can_authenticate_with_google_token(self, mock_verify):
        """Test: User can authenticate with valid Google token"""
        # Mock Google token verification
        mock_verify.return_value = {
            'sub': '123456789',
            'email': 'user@gmail.com',
            'name': 'John Doe',
            'picture': 'https://example.com/photo.jpg',
            'iss': 'https://accounts.google.com'  # Add issuer
        }

        response = self.client.post(
            self.google_auth_url,
            {'token': 'valid_google_token'},
            format='json'
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    @patch('users.views.id_token.verify_oauth2_token')
    def test_google_social_login_creates_user_if_not_exists(self, mock_verify):
        """Test: Google login creates new user if doesn't exist"""
        mock_verify.return_value = {
            'sub': '987654321',
            'email': 'newuser@gmail.com',
            'name': 'Jane Smith',
            'picture': 'https://example.com/photo2.jpg',
            'iss': 'https://accounts.google.com'
        }

        initial_count = User.objects.count()

        response = self.client.post(
            self.google_auth_url,
            {'token': 'valid_google_token'},
            format='json'
        )

        # Should create new user
        self.assertEqual(User.objects.count(), initial_count + 1)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    @patch('users.views.id_token.verify_oauth2_token')
    def test_google_social_login_links_to_existing_user(self, mock_verify):
        """Test: Google login links to existing user if email matches"""
        # Create existing user
        existing_user = User.objects.create_user(
            username='johnsmith',
            email='john@gmail.com',
            password='oldpass123',
            user_type='consumer'
        )

        mock_verify.return_value = {
            'sub': '111222333',
            'email': 'john@gmail.com',  # Same email
            'name': 'John Smith',
            'picture': 'https://example.com/photo.jpg',
            'iss': 'https://accounts.google.com'
        }

        response = self.client.post(
            self.google_auth_url,
            {'token': 'valid_google_token'},
            format='json'
        )

        # Should NOT create new user (still 1 user)
        self.assertEqual(User.objects.count(), 1)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertEqual(response.data['user']['email'], 'john@gmail.com')

    @patch('users.views.id_token.verify_oauth2_token')
    def test_google_social_auth_returns_jwt_tokens(self, mock_verify):
        """Test: Google auth returns JWT tokens"""
        mock_verify.return_value = {
            'sub': '555666777',
            'email': 'jwt@gmail.com',
            'name': 'JWT User',
            'picture': 'https://example.com/photo.jpg',
            'iss': 'https://accounts.google.com'
        }

        response = self.client.post(
            self.google_auth_url,
            {'token': 'valid_google_token'},
            format='json'
        )

        self.assertIn('token', response.data)
        self.assertIn('refresh', response.data)
        # Token should be a non-empty string
        self.assertTrue(len(response.data['token']) > 0)

    def test_google_auth_fails_with_invalid_token(self):
        """Test: Google auth fails with invalid token"""
        response = self.client.post(
            self.google_auth_url,
            {'token': 'invalid_token'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class FacebookAuthTests(TestCase):
    """Tests for Facebook OAuth authentication"""

    def setUp(self):
        self.client = APIClient()
        self.facebook_auth_url = '/api/auth/facebook/'

    @patch('users.views.requests.get')
    def test_user_can_authenticate_with_facebook_token(self, mock_get):
        """Test: User can authenticate with valid Facebook token"""
        # Mock Facebook API response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'id': '123456',
            'email': 'user@facebook.com',
            'name': 'Facebook User',
            'picture': {'data': {'url': 'https://example.com/photo.jpg'}}
        }
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        response = self.client.post(
            self.facebook_auth_url,
            {'access_token': 'valid_facebook_token'},
            format='json'
        )

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    @patch('users.views.requests.get')
    def test_facebook_social_login_creates_user_if_not_exists(self, mock_get):
        """Test: Facebook login creates new user if doesn't exist"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'id': '654321',
            'email': 'newfb@facebook.com',
            'name': 'New Facebook User',
            'picture': {'data': {'url': 'https://example.com/photo2.jpg'}}
        }
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        initial_count = User.objects.count()

        response = self.client.post(
            self.facebook_auth_url,
            {'access_token': 'valid_facebook_token'},
            format='json'
        )

        # Should create new user
        self.assertEqual(User.objects.count(), initial_count + 1)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    @patch('users.views.requests.get')
    def test_facebook_social_login_links_to_existing_user(self, mock_get):
        """Test: Facebook login links to existing user if email matches"""
        # Create existing user
        existing_user = User.objects.create_user(
            username='fbuser',
            email='fb@facebook.com',
            password='oldpass123',
            user_type='consumer'
        )

        mock_response = MagicMock()
        mock_response.json.return_value = {
            'id': '999888777',
            'email': 'fb@facebook.com',  # Same email
            'name': 'FB User',
            'picture': {'data': {'url': 'https://example.com/photo.jpg'}}
        }
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        response = self.client.post(
            self.facebook_auth_url,
            {'access_token': 'valid_facebook_token'},
            format='json'
        )

        # Should NOT create new user (still 1 user)
        self.assertEqual(User.objects.count(), 1)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_facebook_auth_fails_with_invalid_token(self):
        """Test: Facebook auth fails with invalid token"""
        response = self.client.post(
            self.facebook_auth_url,
            {'access_token': 'invalid_token'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class SocialAuthIntegrationTests(TestCase):
    """Integration tests for social authentication"""

    def setUp(self):
        self.client = APIClient()

    @patch('users.views.id_token.verify_oauth2_token')
    def test_social_auth_user_type_defaults_to_consumer(self, mock_verify):
        """Test: Social auth creates consumer user by default"""
        mock_verify.return_value = {
            'sub': '111',
            'email': 'consumer@gmail.com',
            'name': 'Consumer User',
            'picture': 'https://example.com/photo.jpg',
            'iss': 'https://accounts.google.com'
        }

        response = self.client.post(
            '/api/auth/google/',
            {'token': 'valid_token'},
            format='json'
        )

        user = User.objects.get(email='consumer@gmail.com')
        self.assertEqual(user.user_type, 'consumer')

    @patch('users.views.id_token.verify_oauth2_token')
    def test_social_auth_can_specify_business_user_type(self, mock_verify):
        """Test: Social auth can create business user"""
        mock_verify.return_value = {
            'sub': '222',
            'email': 'business@gmail.com',
            'name': 'Business User',
            'picture': 'https://example.com/photo.jpg',
            'iss': 'https://accounts.google.com'
        }

        response = self.client.post(
            '/api/auth/google/',
            {
                'token': 'valid_token',
                'user_type': 'business'
            },
            format='json'
        )

        user = User.objects.get(email='business@gmail.com')
        self.assertEqual(user.user_type, 'business')

    def test_existing_email_prevents_duplicate_registration(self):
        """Test: Existing email prevents creating duplicate account"""
        # Create user first
        User.objects.create_user(
            username='duplicate',
            email='duplicate@example.com',
            password='pass123'
        )

        # Try to create another user with same email
        response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'different_username',
                'email': 'duplicate@example.com',
                'password': 'newpass123'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email='duplicate@example.com').count(), 1)
