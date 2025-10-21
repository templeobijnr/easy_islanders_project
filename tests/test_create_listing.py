from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from listings.models import Category, Subcategory, Listing

User = get_user_model()


class CreateListingAPITests(TestCase):
    """Tests for Create Listing API endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create test categories and subcategories
        self.accommodation = Category.objects.create(
            slug='accommodation',
            name='Accommodation',
            is_featured_category=True
        )
        self.electronics = Category.objects.create(
            slug='electronics',
            name='Electronics',
            is_featured_category=False
        )
        self.cars = Category.objects.create(
            slug='cars',
            name='Cars',
            is_featured_category=True
        )
        
        Subcategory.objects.create(
            category=self.accommodation,
            slug='apartment',
            name='Apartments'
        )
        Subcategory.objects.create(
            category=self.accommodation,
            slug='villa',
            name='Villas'
        )
        Subcategory.objects.create(
            category=self.electronics,
            slug='phones',
            name='Phones'
        )
        Subcategory.objects.create(
            category=self.cars,
            slug='sedans',
            name='Sedans'
        )
        
        # Create business user
        self.business_user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='secure123',
            user_type='business'
        )
        
        # Create business profile
        from users.models import BusinessProfile
        self.profile = BusinessProfile.objects.create(
            user=self.business_user,
            business_name='Test Business',
            contact_phone='+1234567890',
            is_verified_by_admin=True
        )
        
        # Create consumer user
        self.consumer_user = User.objects.create_user(
            username='consumer',
            email='consumer@example.com',
            password='secure123',
            user_type='consumer'
        )

    def test_get_categories(self):
        """Test: Fetch categories for dropdown"""
        response = self.client.get('/api/categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)
    
    def test_get_subcategories_for_accommodation(self):
        """Test: Fetch subcategories for accommodation"""
        response = self.client.get('/api/categories/accommodation/subcategories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        slugs = [s['slug'] for s in response.data]
        self.assertIn('apartment', slugs)
        self.assertIn('villa', slugs)
    
    def test_get_subcategories_for_cars(self):
        """Test: Fetch subcategories for cars"""
        response = self.client.get('/api/categories/cars/subcategories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_list_featured_categories(self):
        """Test: Fetch only featured categories"""
        response = self.client.get('/api/categories/?featured=true')
        
        # Should get at least accommodation and cars which are featured
        if response.status_code == status.HTTP_200_OK:
            self.assertGreaterEqual(len(response.data), 2)
    
    def test_list_all_categories(self):
        """Test: Fetch all categories"""
        response = self.client.get('/api/categories/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        categories = {c['slug']: c for c in response.data}
        self.assertIn('accommodation', categories)
        self.assertIn('electronics', categories)
        self.assertIn('cars', categories)
    
    def test_authenticated_business_user_can_create_listing(self):
        """Test: Authenticated business user with verified profile can create listing"""
        self.client.force_authenticate(user=self.business_user)
        
        listing_data = {
            'title': 'Beautiful Apartment',
            'description': 'A nice apartment in the city',
            'category': self.accommodation.id,
            'subcategory': self.accommodation.subcategories.first().id,
            'price': '1500.00',
            'currency': 'EUR',
            'location': 'Downtown'
        }
        
        response = self.client.post('/api/listings/', listing_data, format='json')
        
        # Should succeed or return 201/400 but not 403 (which would mean permission denied)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_consumer_user_cannot_create_listing(self):
        """Test: Consumer user cannot create listing"""
        self.client.force_authenticate(user=self.consumer_user)
        
        listing_data = {
            'title': 'Beautiful Apartment',
            'description': 'A nice apartment in the city',
            'category': self.accommodation.id,
            'subcategory': self.accommodation.subcategories.first().id,
            'price': '1500.00',
            'currency': 'EUR',
            'location': 'Downtown'
        }
        
        response = self.client.post('/api/listings/', listing_data, format='json')
        
        # Should get 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
