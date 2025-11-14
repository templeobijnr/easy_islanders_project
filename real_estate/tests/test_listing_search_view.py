"""
Tests for Listing Search View (v1 schema)

Tests the /api/v1/real_estate/listings/search/ endpoint
"""
from django.test import TestCase, Client
from django.urls import reverse
from real_estate.models import (
    ListingType, PropertyType, FeatureCategory, Feature,
    Location, Property, Listing
)


class ListingSearchViewTest(TestCase):
    """Test cases for the v1 listing search API"""

    @classmethod
    def setUpTestData(cls):
        """Set up test data (runs once per test class)"""
        # Create listing types
        cls.daily_rental_type = ListingType.objects.create(
            code="DAILY_RENTAL",
            label="Daily Rental"
        )
        cls.long_term_type = ListingType.objects.create(
            code="LONG_TERM_RENTAL",
            label="Long-term Rental"
        )

        # Create property type
        cls.property_type = PropertyType.objects.create(
            code="APARTMENT",
            label="Apartment",
            category="RESIDENTIAL"
        )

        # Create features
        cls.feature_category = FeatureCategory.objects.create(
            code="AMENITY",
            label="Amenity"
        )
        cls.wifi_feature = Feature.objects.create(
            code="WIFI",
            label="WiFi",
            category=cls.feature_category,
            is_required_for_daily_rental=True
        )
        cls.pool_feature = Feature.objects.create(
            code="PRIVATE_POOL",
            label="Private Pool",
            category=cls.feature_category
        )

        # Create locations
        cls.location_kyrenia = Location.objects.create(
            country="Cyprus",
            region="North Cyprus",
            city="Kyrenia",
            area="Catalkoy"
        )
        cls.location_famagusta = Location.objects.create(
            country="Cyprus",
            region="North Cyprus",
            city="Famagusta",
            area="Long Beach"
        )

        # Create properties
        cls.property_1 = Property.objects.create(
            reference_code="EI-RE-001",
            title="2BR Apartment in Catalkoy",
            location=cls.location_kyrenia,
            property_type=cls.property_type,
            bedrooms=2,
            bathrooms=1,
            total_area_sqm=85,
            furnished_status="FULLY_FURNISHED"
        )
        cls.property_1.features.add(cls.wifi_feature, cls.pool_feature)

        cls.property_2 = Property.objects.create(
            reference_code="EI-RE-002",
            title="Studio in Famagusta",
            location=cls.location_famagusta,
            property_type=cls.property_type,
            bedrooms=0,
            bathrooms=1,
            total_area_sqm=45,
            furnished_status="FULLY_FURNISHED"
        )
        cls.property_2.features.add(cls.wifi_feature)

        # Create listings
        cls.listing_1 = Listing.objects.create(
            reference_code="EI-L-001",
            listing_type=cls.daily_rental_type,
            property=cls.property_1,
            title="2BR Apartment - Daily Rental",
            description="Beautiful 2 bedroom apartment",
            base_price=100,
            currency="EUR",
            price_period="PER_DAY",
            status="ACTIVE"
        )

        cls.listing_2 = Listing.objects.create(
            reference_code="EI-L-002",
            listing_type=cls.long_term_type,
            property=cls.property_2,
            title="Studio - Long Term",
            description="Cozy studio apartment",
            base_price=500,
            currency="EUR",
            price_period="PER_MONTH",
            status="ACTIVE"
        )

    def setUp(self):
        """Set up test client before each test"""
        self.client = Client()

    def test_search_without_filters_returns_all_active_listings(self):
        """Test that search without filters returns all active listings"""
        response = self.client.get('/api/v1/real_estate/listings/search/')

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertGreaterEqual(data['count'], 2)

    def test_search_by_city(self):
        """Test filtering by city"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'city': 'Kyrenia'
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['count'], 1)

        # Verify city in results
        for result in data['results']:
            self.assertEqual(result['city'], 'Kyrenia')

    def test_search_by_listing_type(self):
        """Test filtering by listing type"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'listing_type': 'DAILY_RENTAL'
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['count'], 1)

        # Verify listing type in results
        for result in data['results']:
            self.assertEqual(result['listing_type_code'], 'DAILY_RENTAL')

    def test_search_by_bedrooms(self):
        """Test filtering by minimum bedrooms"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'min_bedrooms': 2
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['count'], 1)

        # Verify bedrooms in results
        for result in data['results']:
            if result['bedrooms'] is not None:
                self.assertGreaterEqual(result['bedrooms'], 2)

    def test_search_by_price_range(self):
        """Test filtering by price range"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'min_price': 50,
            'max_price': 150
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verify price in results
        for result in data['results']:
            price = float(result['base_price'])
            self.assertGreaterEqual(price, 50)
            self.assertLessEqual(price, 150)

    def test_search_by_feature_flag(self):
        """Test filtering by feature flags"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'has_wifi': 'true',
            'has_private_pool': 'true'
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Should return at least the property with both features
        self.assertGreaterEqual(data['count'], 1)

        # Verify features in results
        for result in data['results']:
            self.assertTrue(result['has_wifi'])
            self.assertTrue(result['has_private_pool'])

    def test_search_with_limit(self):
        """Test pagination with limit"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'limit': 1
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(len(data['results']), 1)
        self.assertEqual(data['limit'], 1)

    def test_search_response_structure(self):
        """Test that response has correct structure"""
        response = self.client.get('/api/v1/real_estate/listings/search/')

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check top-level keys
        self.assertIn('count', data)
        self.assertIn('results', data)
        self.assertIn('limit', data)
        self.assertIn('offset', data)

        # Check result item structure
        if len(data['results']) > 0:
            result = data['results'][0]
            expected_fields = [
                'listing_id', 'listing_reference_code', 'listing_type_code',
                'status', 'title', 'description', 'base_price', 'currency',
                'price_period', 'city', 'area', 'bedrooms', 'bathrooms',
                'has_wifi', 'has_kitchen', 'has_private_pool'
            ]
            for field in expected_fields:
                self.assertIn(field, result)

    def test_invalid_listing_type_is_ignored(self):
        """Test that invalid listing_type values are handled gracefully"""
        response = self.client.get('/api/v1/real_estate/listings/search/', {
            'listing_type': 'INVALID_TYPE'
        })

        # Should return 400 or ignore the invalid filter
        self.assertIn(response.status_code, [200, 400])
