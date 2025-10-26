"""
Booking Calendar Availability Tests
TDD: Write tests first, implement logic after

Tests for availability calculation and calendar logic
"""

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone

from listings.models import Listing, Category, Subcategory
from assistant.models import Booking

User = get_user_model()


@pytest.mark.django_db
class BookingAvailabilityTests(TestCase):
    """Tests for booking availability logic"""

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

    # TEST 1: Returns available dates for listing
    def test_returns_available_dates_for_listing(self):
        """Test: Get available dates returns list of dates without bookings"""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_dates' in response.data
        assert isinstance(response.data['available_dates'], list)
        # Should have dates (at least some future dates available)
        assert len(response.data['available_dates']) > 0

    # TEST 2: Returns available time slots for selected date
    def test_returns_available_time_slots_for_date(self):
        """Test: Get available times for specific date returns hourly slots"""
        self.client.force_authenticate(user=self.customer)
        
        # Use a future date
        future_date = (timezone.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date={future_date}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_times' in response.data
        assert isinstance(response.data['available_times'], list)
        # Should have some available times (9am-5pm = 8 slots)
        assert len(response.data['available_times']) > 0
        # Times should be in HH:MM format
        for time_slot in response.data['available_times']:
            assert ':' in time_slot
            parts = time_slot.split(':')
            assert len(parts) == 2

    # TEST 3: Excludes already booked times
    def test_excludes_already_booked_times(self):
        """Test: Booked time slots are excluded from availability"""
        self.client.force_authenticate(user=self.customer)
        
        # Create a confirmed booking for a specific time
        future_date = (timezone.now() + timedelta(days=5)).date()
        booking_time = '10:00'
        
        Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date=future_date,
            preferred_time=booking_time,
            status='confirmed'
        )
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date={future_date.isoformat()}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_times' in response.data
        # Booked time should not be in available times
        assert booking_time not in response.data['available_times']
        # But other times should be available
        assert len(response.data['available_times']) > 0

    # TEST 4: Respects seller's availability settings
    def test_respects_business_hours(self):
        """Test: Only return times within business hours (9am-5pm)"""
        self.client.force_authenticate(user=self.customer)
        
        future_date = (timezone.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date={future_date}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_times' in response.data
        
        # All times should be between 9am and 5pm
        for time_slot in response.data['available_times']:
            hour = int(time_slot.split(':')[0])
            assert 9 <= hour < 17  # 9am to 4:59pm (5pm is end of business day)

    # TEST 5: Prevents booking in the past
    def test_prevents_booking_past_dates(self):
        """Test: Past dates are not included in available dates"""
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_dates' in response.data
        
        today = timezone.now().date()
        
        # All returned dates should be in the future (after today)
        for date_str in response.data['available_dates']:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            assert date_obj > today, f"Date {date_obj} should be after {today}"

    # Additional: Handles multiple bookings on same day
    def test_handles_multiple_bookings_same_day(self):
        """Test: Multiple bookings on same day excludes multiple time slots"""
        self.client.force_authenticate(user=self.customer)
        
        future_date = (timezone.now() + timedelta(days=5)).date()
        
        # Create multiple confirmed bookings
        Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date=future_date,
            preferred_time='10:00',
            status='confirmed'
        )
        
        Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date=future_date,
            preferred_time='11:00',
            status='confirmed'
        )
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date={future_date.isoformat()}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_times' in response.data
        # Both booked times should be excluded
        assert '10:00' not in response.data['available_times']
        assert '11:00' not in response.data['available_times']
        # Should still have available times
        assert len(response.data['available_times']) > 0

    # Additional: Pending bookings don't block availability
    def test_pending_bookings_dont_block_availability(self):
        """Test: Pending (not confirmed) bookings don't block availability"""
        self.client.force_authenticate(user=self.customer)
        
        future_date = (timezone.now() + timedelta(days=5)).date()
        
        # Create a PENDING booking (not confirmed)
        Booking.objects.create(
            listing=self.listing,
            user=self.customer,
            preferred_date=future_date,
            preferred_time='10:00',
            status='pending'
        )
        
        response = self.client.get(
            f'/api/listings/{str(self.listing.id)}/availability/?date={future_date.isoformat()}',
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'available_times' in response.data
        # Pending time should STILL be available (not confirmed yet)
        assert '10:00' in response.data['available_times']
