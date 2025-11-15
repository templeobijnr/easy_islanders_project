"""Tests for real estate property + listing creation API.

Endpoint under test:
    POST /api/v1/real_estate/properties/

Contract goals:
- Create Property with structural fields and attributes
- Attach Feature records based on feature_codes
- Create Listing linked to Property
- Return property_id and listing_id
"""

import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from real_estate.models import Property, PropertyType, Location, Feature, FeatureCategory, Listing, ListingType

User = get_user_model()


@pytest.fixture
def api_client(db):
    """Authenticated API client for property creation tests."""
    user = User.objects.create_user(username="seller", password="testpass")
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def property_type_apartment(db):
    return PropertyType.objects.create(code="APARTMENT", label="Apartment", category="RESIDENTIAL")


@pytest.fixture
def location_kyrenia(db):
    return Location.objects.create(country="Cyprus", region="North Cyprus", city="Kyrenia", area="Esentepe")


@pytest.fixture
def feature_taxonomy(db):
    """Seed a minimal feature taxonomy used by the tests.

    We intentionally do not rely on the management command here to keep the
    tests fast and isolated, but the codes match the ones seeded there.
    """
    internal = FeatureCategory.objects.create(code="INTERNAL", label="Internal Features", sort_order=10)
    external = FeatureCategory.objects.create(code="EXTERNAL", label="External Features", sort_order=20)
    location_cat = FeatureCategory.objects.create(code="LOCATION", label="Location Features", sort_order=30)

    Feature.objects.create(code="pool_shared", label="Shared Pool", category=external, group="EXTERNAL")
    Feature.objects.create(code="gym", label="Gym", category=external, group="EXTERNAL")
    Feature.objects.create(code="sea_view", label="Sea View", category=location_cat, group="LOCATION")
    Feature.objects.create(code="open_parking", label="Open Parking", category=external, group="EXTERNAL")

    # Internal feature not used directly in assertions but ensures schema works
    Feature.objects.create(code="ac", label="Air Conditioning", category=internal, group="INTERNAL")


@pytest.fixture
def listing_type_long_term(db):
    return ListingType.objects.create(code="LONG_TERM_RENTAL", label="Long-Term Rental")


@pytest.mark.django_db
class TestPropertyCreateAPI:
    url_name = "real-estate-property-create"

    def test_requires_authentication(self, db):
        client = APIClient()
        url = reverse(self.url_name)
        response = client.post(url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_missing_required_fields_returns_400(self, api_client):
        client, _ = api_client
        url = reverse(self.url_name)
        response = client.post(url, {"title": "Only title"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "city" in str(response.data).lower()

    def test_creates_property_listing_and_features(
        self,
        api_client,
        property_type_apartment,
        location_kyrenia,
        feature_taxonomy,
        listing_type_long_term,
    ):
        client, user = api_client
        url = reverse(self.url_name)

        payload = {
            "title": "Test Apartment in Kyrenia",
            "description": "Beautiful 2+1 with sea view.",
            "location": {
                "city": "Kyrenia",
                "district": "Esentepe",
                "latitude": 35.3368,
                "longitude": 33.3173,
            },
            "structure": {
                "property_type_code": "APARTMENT",
                "bedrooms": 2,
                "living_rooms": 1,
                "bathrooms": 1,
                "room_configuration_label": "2+1",
                "building_name": "Royal Heights",
                "flat_number": "A-101",
                "floor_number": 3,
                "total_area_sqm": 120,
                "net_area_sqm": 100,
                "year_built": 2020,
                "parking_spaces": 1,
                "is_gated_community": True,
                "furnished_status": "FULLY_FURNISHED",
            },
            "features": {
                "feature_codes": ["pool_shared", "gym", "sea_view", "open_parking"],
                "pet_friendly": True,
            },
            "listing": {
                "transaction_type": "rent_long",
                "base_price": 850,
                "currency": "GBP",
                "rental_kind": "LONG_TERM",
                "min_term_months": 6,
                "available_from": "2025-01-01",
                "deposit": 850,
            },
        }

        response = client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        body = response.data
        assert "property_id" in body
        assert "listing_id" in body

        prop = Property.objects.get(id=body["property_id"])
        listing = Listing.objects.get(id=body["listing_id"])

        # Basic field assertions
        assert prop.title == payload["title"]
        assert prop.property_type.code == "APARTMENT"
        assert prop.bedrooms == 2
        assert prop.room_configuration_label == "2+1"
        assert prop.is_gated_community is True

        # Feature links
        feature_codes = set(prop.features.values_list("code", flat=True))
        assert {"pool_shared", "gym", "sea_view", "open_parking"}.issubset(feature_codes)

        # Listing linkage
        assert listing.property == prop
        assert float(listing.base_price) == 850
        assert listing.currency == "GBP"
        assert listing.listing_type.code == "LONG_TERM_RENTAL"
        assert listing.status == "ACTIVE"

    def test_created_listing_appears_in_portfolio_listings(
        self,
        api_client,
        property_type_apartment,
        location_kyrenia,
        feature_taxonomy,
        listing_type_long_term,
    ):
        """Sanity check that created listing is visible in portfolio endpoint.

        This ensures the end-to-end flow from creation to portfolio listing
        works for the seller dashboard.
        """
        client, user = api_client
        create_url = reverse(self.url_name)

        payload = {
            "title": "Portfolio Visibility Test",
            "description": "Visible in portfolio",
            "location": {"city": "Kyrenia", "district": "Esentepe"},
            "structure": {"property_type_code": "APARTMENT", "bedrooms": 1, "bathrooms": 1},
            "features": {"feature_codes": []},
            "listing": {"transaction_type": "rent_long", "base_price": 500, "currency": "EUR"},
        }

        resp = client.post(create_url, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        listing_id = resp.data["listing_id"]

        portfolio_url = reverse("portfolio-listings")
        portfolio_resp = client.get(portfolio_url)
        assert portfolio_resp.status_code == status.HTTP_200_OK

        listing_ids = {str(item["id"]) for item in portfolio_resp.data["results"]}
        assert str(listing_id) in listing_ids
