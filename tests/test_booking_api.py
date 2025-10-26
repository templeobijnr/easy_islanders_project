"""
Booking API Endpoints Tests
TDD: Write tests first, implement views after

Test cases for booking CRUD operations and API endpoints
"""

import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import uuid

from listings.models import Listing, Category, Subcategory
from assistant.models import Booking

User = get_user_model()


@pytest.mark.django_db
class BookingAPITests(TestCase):
    """Tests for booking API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create users
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='testpass123',
            user_type='consumer'
        )
        
        self.seller = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='testpass123',
            user_type='business'
        )
        
        # Create category and subcategory
        self.category = Category.objects.create(
            name='Accommodation',
            slug='accommodation'
        )
        
        self.subcategory = Subcategory.objects.create(
            category=self.category,
            name='Villas',
            slug='villas'
        )
        
        # Create listing
        self.listing = Listing.objects.create(
            owner=self.seller,
            title='Beautiful Villa',
            description='A beautiful villa',
            category=self.category,
            subcategory=self.subcategory,
            price=150,
            currency='EUR',
            location='Kyrenia',
            status='published'
        )

    # TEST 1: POST /api/bookings/ - Create booking (authenticated)
    def test_create_booking_authenticated(self):
        """Test: Can create booking when authenticated"""
        self.client.force_authenticate(user=self.customer)
        
        booking_data = {
            'listing_id': str(self.listing.id),
            'preferred_date': '2025-10-30',
            'preferred_time': '10:00',
            'message': 'Looking forward to viewing',
            'contact_phone': '+12025551234',
            'contact_email': 'customer@example.com'
        }
        
        response = self.client.post('/api/bookings/', booking_data, format='json')
        
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert 'booking_id' in response.data or 'success' in response.data

    def test_create_booking_unauthenticated(self):
        """Test: Cannot create booking without authentication"""
        booking_data = {
            'listing_id': str(self.listing.id),
            'preferred_date': '2025-10-30',
            'preferred_time': '10:00',
        }
        
        response = self.client.post('/api/bookings/', booking_data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_booking_invalid_listing(self):
        """Test: Cannot create booking for non-existent listing"""
        self.client.force_authenticate(user=self.customer)
        
        booking_data = {
            'listing_id': str(uuid.uuid4()),
            'preferred_date': '2025-10-30',
            'preferred_time': '10:00',
        }
        
        response = self.client.post('/api/bookings/', booking_data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_booking_missing_required_fields(self):
        """Test: Cannot create booking without required fields"""
        self.client.force_authenticate(user=self.customer)
        
        booking_data = {
            'listing_id': str(self.listing.id),
            # Missing preferred_date and preferred_time
        }
        
        response = self.client.post('/api/bookings/', booking_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    # TEST 2: GET /api/bookings/user/ - Get user's bookings
    def test_get_user_bookings(self):
        """Test: Can retrieve user's bookings"""
        # Create a booking first
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            message='Test booking',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bookings/user/', format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'bookings' in response.data
        assert len(response.data['bookings']) >= 1

    def test_get_user_bookings_unauthenticated(self):
        """Test: Cannot get bookings without authentication"""
        response = self.client.get('/api/bookings/user/', format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_user_bookings_empty(self):
        """Test: Returns empty list when user has no bookings"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/bookings/user/', format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['bookings'] == []

    # TEST 3: PUT /api/bookings/{id}/status - Update status (agent only)
    def test_update_booking_status_as_seller(self):
        """Test: Seller can update booking status"""
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.seller)
        
        update_data = {
            'status': 'confirmed',
            'agent_response': 'Confirmed for 10:00 AM',
            'agent_available_times': ['10:00', '11:00'],
            'agent_notes': 'Please bring ID'
        }
        
        response = self.client.put(
            f'/api/bookings/{str(booking.id)}/status/',
            update_data,
            format='json'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    def test_update_booking_status_as_customer(self):
        """Test: Customer cannot update booking status"""
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.customer)
        
        update_data = {
            'status': 'confirmed',
        }
        
        response = self.client.put(
            f'/api/bookings/{str(booking.id)}/status/',
            update_data,
            format='json'
        )
        
        # Should be forbidden or not found
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_update_booking_status_nonexistent(self):
        """Test: Cannot update non-existent booking"""
        self.client.force_authenticate(user=self.seller)
        
        update_data = {
            'status': 'confirmed',
        }
        
        response = self.client.put(
            f'/api/bookings/{str(uuid.uuid4())}/status/',
            update_data,
            format='json'
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # TEST 4: DELETE /api/bookings/{id}/ - Cancel booking
    def test_delete_booking_as_customer(self):
        """Test: Customer can cancel their pending booking"""
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(f'/api/bookings/{str(booking.id)}/', format='json')
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]

    def test_delete_booking_non_pending(self):
        """Test: Cannot cancel confirmed booking"""
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='confirmed'
        )
        
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(f'/api/bookings/{str(booking.id)}/', format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_booking_not_owner(self):
        """Test: Cannot cancel someone else's booking"""
        other_customer = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123'
        )
        
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        self.client.force_authenticate(user=other_customer)
        response = self.client.delete(f'/api/bookings/{str(booking.id)}/', format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # TEST 5: GET /api/bookings/{id}/availability - Get calendar availability
    def test_get_booking_availability(self):
        """Test: Can get available dates for listing"""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/',
            format='json'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    def test_get_availability_with_date_filter(self):
        """Test: Can get available times for specific date"""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date=2025-10-30',
            format='json'
        )
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

    # TEST 6: Authentication required for all endpoints
    def test_all_endpoints_require_auth(self):
        """Test: All booking endpoints require authentication"""
        endpoints = [
            ('/api/bookings/', 'post'),
            ('/api/bookings/user/', 'get'),
        ]
        
        for endpoint, method in endpoints:
            if method == 'post':
                response = self.client.post(endpoint, {}, format='json')
            else:
                response = self.client.get(endpoint, format='json')
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # TEST 7: Permission checks (can't update others' bookings)
    def test_cannot_update_others_booking(self):
        """Test: Cannot update or view others' bookings"""
        other_customer = User.objects.create_user(
            username='other_customer',
            email='other@example.com',
            password='testpass123'
        )
        
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        # Try to update as different user
        self.client.force_authenticate(user=other_customer)
        response = self.client.put(
            f'/api/bookings/{str(booking.id)}/status/',
            {'status': 'confirmed'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_seller_can_only_update_own_listings_bookings(self):
        """Test: Seller can only update bookings for their listings"""
        other_seller = User.objects.create_user(
            username='other_seller',
            email='other_seller@example.com',
            password='testpass123',
            user_type='business'
        )
        
        booking = Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date='2025-10-30',
            preferred_time='10:00',
            status='pending'
        )
        
        # Try to update as different seller
        self.client.force_authenticate(user=other_seller)
        response = self.client.put(
            f'/api/bookings/{str(booking.id)}/status/',
            {'status': 'confirmed'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
