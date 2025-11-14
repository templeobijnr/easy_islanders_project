"""
Tests for format_v1_listing_for_card function.

These tests lock down the RecItem v1 contract and ensure that the formatter
always produces valid RecItem dictionaries regardless of input variations.

⚠️ RecItem v1 Contract Tests — DO NOT MODIFY WITHOUT VERSION BUMP
See docs/RECITEM_CONTRACT.md for versioning policy.
"""

import pytest
from assistant.domain.real_estate_search_v1 import format_v1_listing_for_card


class TestFormatV1ListingForCard:
    """Test suite for RecItem v1 contract compliance."""

    def test_minimal_listing_returns_valid_recitem(self):
        """Test that minimal listing data produces valid RecItem with required fields."""
        # Arrange: minimal listing (only required DB fields)
        listing = {
            "listing_id": 123,
            "title": "Test Property",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 1000,
            "currency": "EUR",
            "price_period": "PER_MONTH",
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: RecItem v1 required fields
        assert isinstance(result, dict)
        assert isinstance(result["id"], str)
        assert result["id"] == "123"
        assert isinstance(result["title"], str)
        assert len(result["title"]) > 0
        assert result["title"] == "Test Property"

    def test_rent_type_mapping_all_variants(self):
        """Test that all listing_type_code values map correctly to rent_type enum."""
        test_cases = [
            ("DAILY_RENTAL", "daily"),
            ("LONG_TERM_RENTAL", "long_term"),
            ("SALE", "sale"),
            ("PROJECT", "project"),
            ("UNKNOWN_TYPE", "long_term"),  # Default fallback
        ]

        for listing_type_code, expected_rent_type in test_cases:
            # Arrange
            listing = {
                "listing_id": 1,
                "title": "Test",
                "listing_type_code": listing_type_code,
                "base_price": 100,
                "currency": "EUR",
                "price_period": "PER_NIGHT",
            }

            # Act
            result = format_v1_listing_for_card(listing)

            # Assert
            assert result["metadata"]["rent_type"] == expected_rent_type, \
                f"Failed for {listing_type_code}: expected {expected_rent_type}, got {result['metadata']['rent_type']}"

    def test_rent_type_in_valid_enum_values(self):
        """Test that rent_type is always one of the valid enum values."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
        }

        result = format_v1_listing_for_card(listing)

        valid_rent_types = {"daily", "long_term", "sale", "project"}
        assert result["metadata"]["rent_type"] in valid_rent_types

    def test_badges_limited_to_six(self):
        """Test that badges array never exceeds 6 items."""
        # Arrange: listing with ALL features enabled (should still limit to 6)
        listing = {
            "listing_id": 1,
            "title": "Fully Featured Property",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
            # Enable ALL features
            "has_wifi": True,
            "has_kitchen": True,
            "has_private_pool": True,
            "has_shared_pool": True,
            "view_sea": True,
            "has_parking": True,
            "furnished_status": "FULLY_FURNISHED",
            "has_air_conditioning": True,
            "has_washing_machine": True,
            "has_balcony": True,
            "pet_friendly": True,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert
        assert isinstance(result["badges"], list)
        assert len(result["badges"]) <= 6, \
            f"Expected max 6 badges, got {len(result['badges'])}: {result['badges']}"

    def test_badges_generation_priority(self):
        """Test that badges follow the correct priority order."""
        # Arrange: listing with specific features
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
            "has_wifi": True,
            "has_kitchen": True,
            "has_private_pool": True,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: Expected badges in priority order
        assert "WiFi" in result["badges"]
        assert "Kitchen" in result["badges"]
        assert "Private Pool" in result["badges"]

    def test_amenities_contains_all_features(self):
        """Test that metadata.amenities includes all enabled features (not limited to 6)."""
        # Arrange: listing with multiple features
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
            "has_wifi": True,
            "has_kitchen": True,
            "has_private_pool": True,
            "view_sea": True,
            "has_parking": True,
            "furnished_status": "FULLY_FURNISHED",
            "has_air_conditioning": True,
            "has_washing_machine": True,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: amenities should include ALL features (unlike badges)
        amenities = result["metadata"]["amenities"]
        assert isinstance(amenities, list)
        assert "WiFi" in amenities
        assert "Kitchen" in amenities
        assert "Private Pool" in amenities
        assert "Sea View" in amenities
        assert "Parking" in amenities
        assert "Furnished" in amenities
        assert "Air Conditioning" in amenities
        assert "Washing Machine" in amenities
        # Amenities list can be longer than 6
        assert len(amenities) >= 8

    def test_price_formatting_eur(self):
        """Test EUR price formatting with correct symbol."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 750,
            "currency": "EUR",
            "price_period": "PER_MONTH",
        }

        result = format_v1_listing_for_card(listing)

        assert result["price"] == "€750 / month"

    def test_price_formatting_gbp(self):
        """Test GBP price formatting with correct symbol."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 120,
            "currency": "GBP",
            "price_period": "PER_NIGHT",
        }

        result = format_v1_listing_for_card(listing)

        assert result["price"] == "£120 / night"

    def test_price_formatting_usd(self):
        """Test USD price formatting with correct symbol."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 150,
            "currency": "USD",
            "price_period": "PER_NIGHT",
        }

        result = format_v1_listing_for_card(listing)

        assert result["price"] == "$150 / night"

    def test_price_formatting_try(self):
        """Test TRY price formatting with correct symbol."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 25000,
            "currency": "TRY",
            "price_period": "PER_MONTH",
        }

        result = format_v1_listing_for_card(listing)

        assert result["price"] == "₺25000 / month"

    def test_price_formatting_sale_property(self):
        """Test sale property price formatting (no period suffix)."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "SALE",
            "base_price": 250000,
            "currency": "GBP",
            "price_period": None,
        }

        result = format_v1_listing_for_card(listing)

        # Sale properties should not have " / month" or " / night"
        assert result["price"] == "£250000"

    def test_subtitle_from_city_and_area(self):
        """Test subtitle generation from city and area."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "city": "Kyrenia",
            "area": "Catalkoy",
        }

        result = format_v1_listing_for_card(listing)

        assert result["subtitle"] == "Kyrenia, Catalkoy"

    def test_area_field_direct_mapping(self):
        """Test that area field is mapped directly."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "area": "Catalkoy",
        }

        result = format_v1_listing_for_card(listing)

        assert result["area"] == "Catalkoy"

    def test_metadata_bedrooms_bathrooms(self):
        """Test metadata includes bedrooms and bathrooms."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "bedrooms": 2,
            "bathrooms": 1,
        }

        result = format_v1_listing_for_card(listing)

        assert result["metadata"]["bedrooms"] == 2
        assert result["metadata"]["bathrooms"] == 1

    def test_metadata_sqm_prefers_total_over_net(self):
        """Test that sqm prefers total_area_sqm over net_area_sqm."""
        # Arrange: listing with both total and net area
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "total_area_sqm": 100,
            "net_area_sqm": 85,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: should use total, not net
        assert result["metadata"]["sqm"] == 100

    def test_metadata_sqm_falls_back_to_net(self):
        """Test that sqm falls back to net_area_sqm if total is missing."""
        # Arrange: listing with only net area
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "net_area_sqm": 85,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: should use net as fallback
        assert result["metadata"]["sqm"] == 85

    def test_metadata_description(self):
        """Test that description is included in metadata."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "description": "Beautiful apartment with sea view",
        }

        result = format_v1_listing_for_card(listing)

        assert result["metadata"]["description"] == "Beautiful apartment with sea view"

    def test_gallery_images_placeholder(self):
        """Test that galleryImages is included (currently empty, TODO in v1)."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
        }

        result = format_v1_listing_for_card(listing)

        # galleryImages should exist (even if empty in v1)
        assert "galleryImages" in result
        assert isinstance(result["galleryImages"], list)

    def test_image_url_mapping(self):
        """Test that hero_image_url maps to imageUrl."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            "hero_image_url": "https://example.com/image.jpg",
        }

        result = format_v1_listing_for_card(listing)

        assert result["imageUrl"] == "https://example.com/image.jpg"

    def test_all_recitem_v1_fields_present(self):
        """Test that all RecItem v1 fields are present in the output (contract completeness)."""
        # Arrange: fully populated listing
        listing = {
            "listing_id": 123,
            "title": "2+1 Sea View Apartment",
            "city": "Kyrenia",
            "area": "Catalkoy",
            "base_price": 750,
            "currency": "GBP",
            "price_period": "PER_MONTH",
            "listing_type_code": "LONG_TERM_RENTAL",
            "bedrooms": 2,
            "bathrooms": 1,
            "total_area_sqm": 85,
            "description": "Beautiful apartment",
            "hero_image_url": "https://example.com/image.jpg",
            "has_wifi": True,
            "has_kitchen": True,
        }

        # Act
        result = format_v1_listing_for_card(listing)

        # Assert: All RecItem v1 top-level fields present
        required_fields = ["id", "title", "subtitle", "price", "area", "badges", "imageUrl", "galleryImages", "metadata"]
        for field in required_fields:
            assert field in result, f"Missing required RecItem field: {field}"

        # Assert: All RecItemMetadata fields present
        metadata_fields = ["bedrooms", "bathrooms", "amenities", "sqm", "description", "rent_type"]
        for field in metadata_fields:
            assert field in result["metadata"], f"Missing required metadata field: {field}"

    def test_empty_badges_when_no_features(self):
        """Test that badges is empty list when no features are enabled."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
            # No features enabled
        }

        result = format_v1_listing_for_card(listing)

        assert result["badges"] == []

    def test_private_pool_takes_priority_over_shared(self):
        """Test that 'Private Pool' badge appears instead of 'Pool' when both flags exist."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
            "has_private_pool": True,
            "has_shared_pool": True,  # Should be ignored in favor of private
        }

        result = format_v1_listing_for_card(listing)

        assert "Private Pool" in result["badges"]
        assert "Pool" not in result["badges"]  # Should not show generic "Pool"

    def test_id_is_always_string(self):
        """Test that id is always converted to string (not int)."""
        listing = {
            "listing_id": 999,  # Integer in DB
            "title": "Test",
            "listing_type_code": "LONG_TERM_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
        }

        result = format_v1_listing_for_card(listing)

        assert isinstance(result["id"], str)
        assert result["id"] == "999"


class TestRecItemV1ContractInvariants:
    """Test invariants that must hold for ALL RecItem outputs."""

    @pytest.mark.parametrize("listing_type", ["DAILY_RENTAL", "LONG_TERM_RENTAL", "SALE", "PROJECT"])
    def test_invariant_rent_type_always_valid(self, listing_type):
        """Invariant: rent_type is always one of the valid enum values."""
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": listing_type,
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_MONTH",
        }

        result = format_v1_listing_for_card(listing)

        valid_values = {"daily", "long_term", "sale", "project"}
        assert result["metadata"]["rent_type"] in valid_values

    def test_invariant_badges_never_exceed_six(self):
        """Invariant: badges.length <= 6 for ANY input."""
        # Stress test with maximum features
        listing = {
            "listing_id": 1,
            "title": "Test",
            "listing_type_code": "DAILY_RENTAL",
            "base_price": 100,
            "currency": "EUR",
            "price_period": "PER_NIGHT",
            "has_wifi": True,
            "has_kitchen": True,
            "has_private_pool": True,
            "has_shared_pool": True,
            "view_sea": True,
            "view_mountain": True,
            "has_parking": True,
            "furnished_status": "FULLY_FURNISHED",
            "has_air_conditioning": True,
            "has_washing_machine": True,
            "has_dishwasher": True,
            "has_balcony": True,
            "has_garden": True,
            "pet_friendly": True,
        }

        result = format_v1_listing_for_card(listing)

        assert len(result["badges"]) <= 6

    def test_invariant_id_and_title_always_present(self):
        """Invariant: id and title are ALWAYS present (required fields)."""
        # Minimal listing
        listing = {
            "listing_id": 1,
            "title": "Minimal",
            "listing_type_code": "SALE",
            "base_price": 100,
            "currency": "EUR",
            "price_period": None,
        }

        result = format_v1_listing_for_card(listing)

        assert "id" in result
        assert "title" in result
        assert len(result["id"]) > 0
        assert len(result["title"]) > 0
