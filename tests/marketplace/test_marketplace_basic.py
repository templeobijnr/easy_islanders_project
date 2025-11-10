"""
Basic integration tests for marketplace app.
Tests seller profiles, listings, and API endpoints.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import SellerProfile, GenericListing, ListingImage

User = get_user_model()


@pytest.fixture
def user(db):
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def seller_user(db):
    """Create a user with seller profile"""
    user = User.objects.create_user(
        username='seller',
        email='seller@example.com',
        password='sellerpass123'
    )
    SellerProfile.objects.create(
        user=user,
        business_name='Test Business',
        categories=['vehicles', 'services'],
        verified=True,
        rating=4.5
    )
    return user


@pytest.fixture
def api_client():
    """Create API client"""
    return APIClient()


@pytest.fixture
def seller_profile(seller_user):
    """Get seller profile for seller_user"""
    return SellerProfile.objects.get(user=seller_user)


class TestSellerProfile:
    """Tests for SellerProfile model and API"""

    def test_create_seller_profile(self, db, user):
        """Test creating a seller profile"""
        profile = SellerProfile.objects.create(
            user=user,
            business_name='My Business',
            categories=['real_estate', 'vehicles']
        )

        assert profile.business_name == 'My Business'
        assert profile.categories == ['real_estate', 'vehicles']
        assert profile.verified is False
        assert profile.rating == 0.0
        assert profile.total_listings == 0
        assert profile.ai_agent_enabled is True

    def test_seller_profile_str(self, seller_profile):
        """Test string representation"""
        assert str(seller_profile) == 'Test Business (seller)'

    def test_increment_listing_count(self, seller_profile):
        """Test incrementing listing count"""
        initial_count = seller_profile.total_listings
        seller_profile.increment_listing_count()
        assert seller_profile.total_listings == initial_count + 1

    def test_decrement_listing_count(self, seller_profile):
        """Test decrementing listing count"""
        seller_profile.total_listings = 5
        seller_profile.save()
        seller_profile.decrement_listing_count()
        assert seller_profile.total_listings == 4

    def test_api_create_seller_profile(self, api_client, user):
        """Test creating seller profile via API"""
        api_client.force_authenticate(user=user)

        data = {
            'business_name': 'API Test Business',
            'categories': ['services', 'events'],
            'phone': '+123456789',
            'email': 'business@example.com'
        }

        response = api_client.post('/api/v1/marketplace/sellers/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['business_name'] == 'API Test Business'
        assert response.data['categories'] == ['services', 'events']
        assert response.data['verified'] is False

    def test_api_get_my_profile(self, api_client, seller_user, seller_profile):
        """Test getting current user's seller profile"""
        api_client.force_authenticate(user=seller_user)

        response = api_client.get('/api/v1/marketplace/sellers/me/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['business_name'] == 'Test Business'
        assert response.data['rating'] == 4.5

    def test_api_list_sellers_verified_only(self, api_client, user, seller_user):
        """Test that non-staff users only see verified sellers"""
        # Create unverified seller
        unverified_user = User.objects.create_user(
            username='unverified',
            email='unverified@example.com',
            password='pass123'
        )
        SellerProfile.objects.create(
            user=unverified_user,
            business_name='Unverified Business',
            verified=False
        )

        api_client.force_authenticate(user=user)
        response = api_client.get('/api/v1/marketplace/sellers/')

        assert response.status_code == status.HTTP_200_OK
        # Only verified seller should be visible
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['business_name'] == 'Test Business'


class TestGenericListing:
    """Tests for GenericListing model and API"""

    def test_create_listing(self, seller_profile):
        """Test creating a generic listing"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test Vehicle',
            description='A great vehicle for sale',
            category='vehicles',
            price=Decimal('15000.00'),
            location='Nicosia',
            metadata={'make': 'Toyota', 'year': 2020}
        )

        assert listing.title == 'Test Vehicle'
        assert listing.category == 'vehicles'
        assert listing.price == Decimal('15000.00')
        assert listing.location == 'Nicosia'
        assert listing.metadata == {'make': 'Toyota', 'year': 2020}
        assert listing.status == 'active'
        assert listing.views_count == 0

    def test_listing_str(self, seller_profile):
        """Test string representation"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test Service',
            description='Service description',
            category='services'
        )
        assert str(listing) == 'services: Test Service'

    def test_listing_price_display(self, seller_profile):
        """Test price display property"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test Item',
            description='Description',
            category='marketplace',
            price=Decimal('99.99'),
            currency='USD'
        )
        assert listing.price_display == 'USD 99.99'

    def test_listing_increment_views(self, seller_profile):
        """Test incrementing view counter"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test',
            description='Desc',
            category='services'
        )

        initial_views = listing.views_count
        listing.increment_views()
        assert listing.views_count == initial_views + 1

    def test_listing_auto_increment_seller_count(self, seller_profile):
        """Test that creating listing increments seller's listing count"""
        initial_count = seller_profile.total_listings

        GenericListing.objects.create(
            seller=seller_profile,
            title='Test',
            description='Desc',
            category='services'
        )

        seller_profile.refresh_from_db()
        assert seller_profile.total_listings == initial_count + 1

    def test_api_create_listing(self, api_client, seller_user):
        """Test creating listing via API"""
        api_client.force_authenticate(user=seller_user)

        data = {
            'title': 'Kayak Rental',
            'description': 'Fun sea kayaking experience.',
            'category': 'activities',
            'price': '50.00',
            'currency': 'EUR',
            'location': 'Kyrenia',
            'metadata': {'duration': '2 hours', 'difficulty': 'easy'}
        }

        response = api_client.post('/api/v1/marketplace/listings/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Kayak Rental'
        assert response.data['category'] == 'activities'
        assert Decimal(response.data['price']) == Decimal('50.00')

    def test_api_list_listings_with_filters(self, api_client, seller_profile):
        """Test listing with query parameter filters"""
        # Create multiple listings
        GenericListing.objects.create(
            seller=seller_profile,
            title='Vehicle 1',
            description='Desc',
            category='vehicles',
            price=Decimal('10000'),
            location='Nicosia'
        )
        GenericListing.objects.create(
            seller=seller_profile,
            title='Service 1',
            description='Desc',
            category='services',
            price=Decimal('100'),
            location='Kyrenia'
        )
        GenericListing.objects.create(
            seller=seller_profile,
            title='Vehicle 2',
            description='Desc',
            category='vehicles',
            price=Decimal('20000'),
            location='Famagusta'
        )

        # Filter by category
        response = api_client.get('/api/v1/marketplace/listings/?category=vehicles')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

        # Filter by price range
        response = api_client.get('/api/v1/marketplace/listings/?min_price=5000&max_price=15000')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

        # Filter by location
        response = api_client.get('/api/v1/marketplace/listings/?location=Nicosia')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1

    def test_api_get_my_listings(self, api_client, seller_user, seller_profile):
        """Test getting current seller's listings"""
        # Create listings
        GenericListing.objects.create(
            seller=seller_profile,
            title='My Listing 1',
            description='Desc',
            category='vehicles'
        )
        GenericListing.objects.create(
            seller=seller_profile,
            title='My Listing 2',
            description='Desc',
            category='services'
        )

        api_client.force_authenticate(user=seller_user)
        response = api_client.get('/api/v1/marketplace/listings/my-listings/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_api_increment_views(self, api_client, seller_profile):
        """Test incrementing view count via API"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test',
            description='Desc',
            category='services'
        )

        response = api_client.post(f'/api/v1/marketplace/listings/{listing.id}/increment_views/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['views_count'] == 1

    def test_api_cannot_update_other_users_listing(self, api_client, user, seller_profile):
        """Test that users cannot update listings they don't own"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Original Title',
            description='Desc',
            category='services'
        )

        # Different user tries to update
        api_client.force_authenticate(user=user)
        response = api_client.patch(
            f'/api/v1/marketplace/listings/{listing.id}/',
            {'title': 'Hacked Title'},
            format='json'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestListingImage:
    """Tests for ListingImage model"""

    def test_create_listing_image(self, seller_profile):
        """Test creating listing images"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test',
            description='Desc',
            category='services'
        )

        image = ListingImage.objects.create(
            listing=listing,
            image_url='https://example.com/image1.jpg',
            caption='Main image',
            display_order=1
        )

        assert image.listing == listing
        assert image.image_url == 'https://example.com/image1.jpg'
        assert image.caption == 'Main image'
        assert image.display_order == 1

    def test_listing_images_ordering(self, seller_profile):
        """Test that images are ordered by display_order"""
        listing = GenericListing.objects.create(
            seller=seller_profile,
            title='Test',
            description='Desc',
            category='services'
        )

        # Create images out of order
        img2 = ListingImage.objects.create(
            listing=listing,
            image_url='https://example.com/image2.jpg',
            display_order=2
        )
        img1 = ListingImage.objects.create(
            listing=listing,
            image_url='https://example.com/image1.jpg',
            display_order=1
        )
        img3 = ListingImage.objects.create(
            listing=listing,
            image_url='https://example.com/image3.jpg',
            display_order=3
        )

        # Get images through related manager
        images = list(listing.images.all())
        assert images[0] == img1
        assert images[1] == img2
        assert images[2] == img3
