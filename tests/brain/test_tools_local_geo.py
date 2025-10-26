"""
Tests for geo utilities: city normalization and geocoding.
Ensures bilingual city name mapping and caching.
"""

import pytest
from unittest.mock import patch, MagicMock


def test_normalize_city_bilingual_mappings():
    """Test that normalize_city correctly maps Turkish and English city names."""
    from assistant.brain.tools_local import normalize_city
    
    # Test Turkish to English mappings
    assert normalize_city("Girne") == "Kyrenia"
    assert normalize_city("girne") == "Kyrenia"
    assert normalize_city("GIRNE") == "Kyrenia"
    assert normalize_city("Lefkoşa") == "Nicosia"
    assert normalize_city("Famagusta") == "Famagusta"  # Already English
    assert normalize_city("Gazimağusa") == "Famagusta"
    assert normalize_city("Kyrenia") == "Kyrenia"  # Already normalized
    assert normalize_city("Nicosia") == "Nicosia"  # Already normalized


@patch("requests.get")
def test_geocode_happy_path_and_cache(mock_get):
    """Test that geocode() calls Nominatim and caches results."""
    from assistant.brain.tools_local import geocode
    
    # Clear cache before test
    geocode.cache_clear()
    
    # Mock Nominatim response
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {
            "lat": "35.1264",
            "lon": "33.4299",
            "address": "Kyrenia, Cyprus"
        }
    ]
    mock_response.raise_for_status = MagicMock()
    mock_get.return_value = mock_response
    
    # First call - should hit network
    result1 = geocode("pharmacy Kyrenia")
    assert result1 == (35.1264, 33.4299)
    assert mock_get.call_count == 1
    
    # Second call - should hit cache
    result2 = geocode("pharmacy Kyrenia")
    assert result2 == (35.1264, 33.4299)
    assert mock_get.call_count == 1  # Still 1, cache worked


@patch("requests.get")
def test_geocode_returns_none_on_empty_result(mock_get):
    """Test that geocode() returns None when Nominatim has no results."""
    from assistant.brain.tools_local import geocode
    
    geocode.cache_clear()
    
    # Mock empty response
    mock_response = MagicMock()
    mock_response.json.return_value = []
    mock_response.raise_for_status = MagicMock()
    mock_get.return_value = mock_response
    
    result = geocode("nonexistent place xyz")
    assert result is None
