"""
Tests for Availability Check and Booking Creation API endpoints.

These tests lock down the RecItem v1 booking flow contracts:
- POST /api/v1/real_estate/availability/check/
- POST /api/v1/real_estate/bookings/

⚠️ RecItem v1 API Contract Tests — DO NOT MODIFY WITHOUT VERSION BUMP
See docs/RECITEM_CONTRACT.md for versioning policy.
"""

import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from real_estate.models import (
    Listing,
    ListingType,
    Property,
    PropertyType,
    Location,
    Tenancy,
)

User = get_user_model()


@pytest.fixture
def api_client():
    """Authenticated API client."""
    client = APIClient()
    user = User.objects.create_user(username="testuser", password="testpass")
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def unauthenticated_client():
    """Unauthenticated API client."""
    return APIClient()


@pytest.fixture
def listing_type_daily():
    """Daily rental listing type."""
    listing_type, _ = ListingType.objects.get_or_create(
        code="DAILY_RENTAL",
        defaults={"label": "Daily Rental"}
    )
    return listing_type


@pytest.fixture
def listing_type_long_term():
    """Long-term rental listing type."""
    listing_type, _ = ListingType.objects.get_or_create(
        code="LONG_TERM_RENTAL",
        defaults={"label": "Long-Term Rental"}
    )
    return listing_type


@pytest.fixture
def property_type():
    """Property type fixture."""
    prop_type, _ = PropertyType.objects.get_or_create(
        code="APARTMENT",
        defaults={"label": "Apartment", "category": "RESIDENTIAL"}
    )
    return prop_type


@pytest.fixture
def location():
    """Location fixture."""
    location, _ = Location.objects.get_or_create(
        city="Kyrenia",
        area="Catalkoy",
        defaults={"region": "North Cyprus", "country": "Cyprus"}
    )
    return location


@pytest.fixture
def active_daily_listing(listing_type_daily, property_type, location):
    """Active daily rental listing with property."""
    property_obj = Property.objects.create(
        reference_code="TEST-PROP-001",
        property_type=property_type,
        location=location,
        bedrooms=2,
        bathrooms=1,
    )
    listing = Listing.objects.create(
        reference_code="TEST-LISTING-001",
        listing_type=listing_type_daily,
        property=property_obj,
        title="Test Daily Rental",
        base_price=100,
        currency="EUR",
        price_period="PER_DAY",
        status="ACTIVE",
    )
    return listing


@pytest.fixture
def draft_listing(listing_type_daily, property_type, location):
    """Draft listing (not bookable)."""
    property_obj = Property.objects.create(
        reference_code="TEST-PROP-002",
        property_type=property_type,
        location=location,
        bedrooms=1,
        bathrooms=1,
    )
    listing = Listing.objects.create(
        reference_code="TEST-LISTING-002",
        listing_type=listing_type_daily,
        property=property_obj,
        title="Draft Listing",
        base_price=80,
        currency="EUR",
        price_period="PER_DAY",
        status="DRAFT",
    )
    return listing


@pytest.mark.django_db
class TestAvailabilityCheckView:
    """Test suite for POST /api/v1/real_estate/availability/check/"""

    url = reverse("availability-check")

    def test_requires_authentication(self, unauthenticated_client, active_daily_listing):
        """Test that endpoint requires authentication."""
        response = unauthenticated_client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_requires_listing_id(self, api_client):
        """Test that listing_id is required."""
        client, _ = api_client
        response = client.post(self.url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "listing_id" in response.data["error"].lower()

    def test_listing_not_found(self, api_client):
        """Test 404 when listing doesn't exist."""
        client, _ = api_client
        response = client.post(self.url, {
            "listing_id": "999999",
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.data["error"].lower()

    def test_active_listing_without_dates_is_available(self, api_client, active_daily_listing):
        """Test that active listing without date check returns available=True."""
        client, _ = api_client
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True
        assert "available" in response.data["message"].lower()

    def test_draft_listing_is_not_available(self, api_client, draft_listing):
        """Test that draft listing returns available=False."""
        client, _ = api_client
        response = client.post(self.url, {
            "listing_id": str(draft_listing.id),
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert "status" in response.data["message"].lower()

    def test_listing_available_for_future_dates(self, api_client, active_daily_listing):
        """Test that listing is available for future dates with no conflicts."""
        client, _ = api_client
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True
        assert "selected dates" in response.data["message"].lower()

    def test_listing_not_available_when_dates_overlap_existing_tenancy(
        self, api_client, active_daily_listing
    ):
        """Test that overlapping tenancy makes listing unavailable."""
        client, user = api_client

        # Create existing tenancy for days 10-15
        existing_check_in = date.today() + timedelta(days=10)
        existing_check_out = date.today() + timedelta(days=15)
        Tenancy.objects.create(
            property=active_daily_listing.property,
            listing=active_daily_listing,
            tenant=user,
            tenancy_kind="DAILY",
            start_date=existing_check_in,
            end_date=existing_check_out,
            rent_amount=500,
            rent_currency="EUR",
            status="ACTIVE",
        )

        # Try to book overlapping dates (days 12-17)
        new_check_in = (date.today() + timedelta(days=12)).isoformat()
        new_check_out = (date.today() + timedelta(days=17)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": new_check_in,
            "check_out": new_check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert "not available for selected dates" in response.data["message"].lower()

    def test_listing_available_when_dates_do_not_overlap_existing_tenancy(
        self, api_client, active_daily_listing
    ):
        """Test that non-overlapping dates are available even with existing tenancy."""
        client, user = api_client

        # Create existing tenancy for days 10-15
        existing_check_in = date.today() + timedelta(days=10)
        existing_check_out = date.today() + timedelta(days=15)
        Tenancy.objects.create(
            property=active_daily_listing.property,
            listing=active_daily_listing,
            tenant=user,
            tenancy_kind="DAILY",
            start_date=existing_check_in,
            end_date=existing_check_out,
            rent_amount=500,
            rent_currency="EUR",
            status="ACTIVE",
        )

        # Try to book non-overlapping dates (days 20-25)
        new_check_in = (date.today() + timedelta(days=20)).isoformat()
        new_check_out = (date.today() + timedelta(days=25)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": new_check_in,
            "check_out": new_check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True

    def test_only_active_and_pending_tenancies_block_availability(
        self, api_client, active_daily_listing
    ):
        """Test that cancelled/ended tenancies don't block availability."""
        client, user = api_client

        # Create cancelled tenancy for days 10-15
        cancelled_check_in = date.today() + timedelta(days=10)
        cancelled_check_out = date.today() + timedelta(days=15)
        Tenancy.objects.create(
            property=active_daily_listing.property,
            listing=active_daily_listing,
            tenant=user,
            tenancy_kind="DAILY",
            start_date=cancelled_check_in,
            end_date=cancelled_check_out,
            rent_amount=500,
            rent_currency="EUR",
            status="CANCELLED",  # Cancelled tenancies don't block
        )

        # Try to book overlapping dates (should be available)
        new_check_in = (date.today() + timedelta(days=12)).isoformat()
        new_check_out = (date.today() + timedelta(days=17)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": new_check_in,
            "check_out": new_check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is True

    def test_invalid_date_format(self, api_client, active_daily_listing):
        """Test that invalid date format returns 400."""
        client, _ = api_client
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": "not-a-date",
            "check_out": "2025-08-07",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalid date format" in response.data["error"].lower()

    def test_listing_available_from_constraint(self, api_client, active_daily_listing):
        """Test that available_from date is enforced."""
        client, _ = api_client

        # Set listing to be available from 30 days in future
        active_daily_listing.available_from = date.today() + timedelta(days=30)
        active_daily_listing.save()

        # Try to book before available_from
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert "only available from" in response.data["message"].lower()

    def test_listing_available_to_constraint(self, api_client, active_daily_listing):
        """Test that available_to date is enforced."""
        client, _ = api_client

        # Set listing to be available until 20 days in future
        active_daily_listing.available_to = date.today() + timedelta(days=20)
        active_daily_listing.save()

        # Try to book after available_to
        check_in = (date.today() + timedelta(days=25)).isoformat()
        check_out = (date.today() + timedelta(days=30)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["available"] is False
        assert "only available until" in response.data["message"].lower()


@pytest.mark.django_db
class TestBookingCreateView:
    """Test suite for POST /api/v1/real_estate/bookings/"""

    url = reverse("booking-create")

    def test_requires_authentication(self, unauthenticated_client, active_daily_listing):
        """Test that endpoint requires authentication."""
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = unauthenticated_client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_requires_listing_id(self, api_client):
        """Test that listing_id is required."""
        client, _ = api_client
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = client.post(self.url, {
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "listing_id" in response.data["error"].lower()

    def test_requires_check_in_and_check_out(self, api_client, active_daily_listing):
        """Test that check_in and check_out are required."""
        client, _ = api_client

        # Missing both dates
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "check_in and check_out" in response.data["error"].lower()

        # Missing check_out
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": date.today().isoformat(),
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_listing_not_found(self, api_client):
        """Test 404 when listing doesn't exist."""
        client, _ = api_client
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = client.post(self.url, {
            "listing_id": "999999",
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_date_format(self, api_client, active_daily_listing):
        """Test that invalid date format returns 400."""
        client, _ = api_client
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": "not-a-date",
            "check_out": "2025-08-07",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalid date format" in response.data["error"].lower()

    def test_check_out_must_be_after_check_in(self, api_client, active_daily_listing):
        """Test that check_out must be after check_in."""
        client, _ = api_client
        check_in = (date.today() + timedelta(days=15)).isoformat()
        check_out = (date.today() + timedelta(days=10)).isoformat()  # Before check_in

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "check_out must be after check_in" in response.data["error"].lower()

    def test_cannot_book_draft_listing(self, api_client, draft_listing):
        """Test that draft listings cannot be booked."""
        client, _ = api_client
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(draft_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not available for booking" in response.data["error"].lower()

    def test_successful_booking_creates_tenancy_record(self, api_client, active_daily_listing):
        """Test that successful booking creates a Tenancy record."""
        client, user = api_client
        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=15)).isoformat()

        initial_count = Tenancy.objects.count()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })

        assert response.status_code == status.HTTP_201_CREATED
        assert Tenancy.objects.count() == initial_count + 1

        # Verify tenancy details
        tenancy = Tenancy.objects.latest("created_at")
        assert tenancy.listing == active_daily_listing
        assert tenancy.property == active_daily_listing.property
        assert tenancy.tenant == user
        assert tenancy.tenancy_kind == "DAILY"
        assert tenancy.status == "PENDING"
        assert str(tenancy.start_date) == check_in
        assert str(tenancy.end_date) == check_out

    def test_booking_response_format(self, api_client, active_daily_listing):
        """Test that booking response follows the RecItem v1 contract."""
        client, _ = api_client
        check_in_date = date.today() + timedelta(days=10)
        check_out_date = date.today() + timedelta(days=15)
        check_in = check_in_date.isoformat()
        check_out = check_out_date.isoformat()

        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })

        assert response.status_code == status.HTTP_201_CREATED

        # Verify response contract
        required_fields = ["id", "status", "listing_id", "check_in", "check_out", "nights", "rent_amount", "currency", "message"]
        for field in required_fields:
            assert field in response.data, f"Missing required field: {field}"

        # Verify field types and values
        assert isinstance(response.data["id"], int)
        assert response.data["status"] == "PENDING"
        assert response.data["listing_id"] == str(active_daily_listing.id)
        assert response.data["check_in"] == check_in
        assert response.data["check_out"] == check_out
        assert response.data["nights"] == 5
        assert response.data["currency"] == "EUR"
        assert "successfully" in response.data["message"].lower()

    def test_double_booking_rejected(self, api_client, active_daily_listing):
        """Test that double booking is rejected with 409 Conflict."""
        client, user = api_client

        # Create first booking
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        Tenancy.objects.create(
            property=active_daily_listing.property,
            listing=active_daily_listing,
            tenant=user,
            tenancy_kind="DAILY",
            start_date=check_in,
            end_date=check_out,
            rent_amount=500,
            rent_currency="EUR",
            status="ACTIVE",
        )

        # Try to create overlapping booking
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": (date.today() + timedelta(days=12)).isoformat(),
            "check_out": (date.today() + timedelta(days=17)).isoformat(),
        })

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "no longer available" in response.data["error"].lower()

    def test_tenancy_kind_based_on_listing_type(
        self, api_client, listing_type_long_term, property_type, location
    ):
        """Test that tenancy_kind is set based on listing type."""
        client, _ = api_client

        # Create long-term rental listing
        property_obj = Property.objects.create(
            reference_code="TEST-PROP-LT",
            property_type=property_type,
            location=location,
            bedrooms=2,
            bathrooms=1,
        )
        long_term_listing = Listing.objects.create(
            reference_code="TEST-LT-001",
            listing_type=listing_type_long_term,
            property=property_obj,
            title="Long-Term Rental",
            base_price=1000,
            currency="EUR",
            price_period="PER_MONTH",
            status="ACTIVE",
        )

        check_in = (date.today() + timedelta(days=10)).isoformat()
        check_out = (date.today() + timedelta(days=40)).isoformat()

        response = client.post(self.url, {
            "listing_id": str(long_term_listing.id),
            "check_in": check_in,
            "check_out": check_out,
        })

        assert response.status_code == status.HTTP_201_CREATED

        # Verify tenancy kind is LONG_TERM
        tenancy = Tenancy.objects.latest("created_at")
        assert tenancy.tenancy_kind == "LONG_TERM"

    def test_atomic_transaction_on_failure(self, api_client, active_daily_listing):
        """Test that failed booking doesn't create partial records."""
        client, user = api_client

        # Create existing tenancy
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        Tenancy.objects.create(
            property=active_daily_listing.property,
            listing=active_daily_listing,
            tenant=user,
            tenancy_kind="DAILY",
            start_date=check_in,
            end_date=check_out,
            rent_amount=500,
            rent_currency="EUR",
            status="ACTIVE",
        )

        initial_count = Tenancy.objects.count()

        # Try to create overlapping booking (should fail atomically)
        response = client.post(self.url, {
            "listing_id": str(active_daily_listing.id),
            "check_in": (date.today() + timedelta(days=12)).isoformat(),
            "check_out": (date.today() + timedelta(days=17)).isoformat(),
        })

        assert response.status_code == status.HTTP_409_CONFLICT

        # Verify no new tenancy was created
        assert Tenancy.objects.count() == initial_count
