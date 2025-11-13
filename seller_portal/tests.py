"""
Tests for Seller Portal API endpoints
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class SellerPortalAPITests(TestCase):
    """Test seller portal API endpoints"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
        
        # Create a business user
        self.business_user = User.objects.create_user(
            username='seller@example.com',
            email='seller@example.com',
            password='testpass123',
            user_type='business'
        )
        
        # Create business profile
        from users.models import BusinessProfile
        self.business_profile = BusinessProfile.objects.create(
            user=self.business_user,
            business_name='Test Business',
            contact_phone='+1234567890',
        )
    
    def test_seller_overview_requires_auth(self):
        """Test that seller overview requires authentication"""
        response = self.client.get('/api/seller/overview/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_seller_overview_requires_business_user(self):
        """Test that seller overview requires business user"""
        # Create regular user
        regular_user = User.objects.create_user(
            username='customer@example.com',
            email='customer@example.com',
            password='testpass123',
            user_type='customer'
        )
        
        self.client.force_authenticate(user=regular_user)
        response = self.client.get('/api/seller/overview/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_seller_overview_success(self):
        """Test successful seller overview retrieval"""
        self.client.force_authenticate(user=self.business_user)
        response = self.client.get('/api/seller/overview/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('business_id', data)
        self.assertIn('business_name', data)
        self.assertIn('total_listings', data)
        self.assertIn('total_bookings', data)
        self.assertIn('total_revenue', data)
        self.assertIn('domains', data)
        
        self.assertEqual(data['business_name'], 'Test Business')
    
    def test_all_listings_requires_auth(self):
        """Test that all listings requires authentication"""
        response = self.client.get('/api/seller/listings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_all_listings_success(self):
        """Test successful listings retrieval"""
        self.client.force_authenticate(user=self.business_user)
        response = self.client.get('/api/seller/listings/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should be a list
        self.assertIsInstance(data, list)
    
    def test_all_bookings_requires_auth(self):
        """Test that all bookings requires authentication"""
        response = self.client.get('/api/seller/bookings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_all_bookings_success(self):
        """Test successful bookings retrieval"""
        self.client.force_authenticate(user=self.business_user)
        response = self.client.get('/api/seller/bookings/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should be a list
        self.assertIsInstance(data, list)
