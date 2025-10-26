"""
Tests for Tavily API client wrappers.
Ensures Bearer authentication and proper endpoint calls.
"""

import pytest
from unittest.mock import patch, MagicMock
import json


@pytest.fixture
def tavily_api_key():
    """Fixture providing test Tavily API key."""
    return "tvly-dev-test-key-12345"


@patch.dict("os.environ", {"TAVILY_API_KEY": "tvly-dev-test-key-12345"})
@patch("requests.post")
def test_search_calls_endpoint_with_bearer_and_returns_json(mock_post):
    """Test that search() calls Tavily /search endpoint with Bearer auth."""
    from assistant.brain import tavily
    
    # Mock successful response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": [
            {"url": "https://example.com", "title": "Example"}
        ]
    }
    mock_response.raise_for_status = MagicMock()
    mock_post.return_value = mock_response
    
    # Call search
    result = tavily.search("test query")
    
    # Assertions
    assert result == {"results": [{"url": "https://example.com", "title": "Example"}]}
    mock_post.assert_called_once()
    call_args = mock_post.call_args
    
    # Verify endpoint
    assert "api.tavily.com/search" in call_args[0][0]
    
    # Verify Bearer auth header
    headers = call_args[1]["headers"]
    assert "Authorization" in headers
    assert headers["Authorization"].startswith("Bearer ")


@patch.dict("os.environ", {"TAVILY_API_KEY": "tvly-dev-test-key-12345"})
@patch("requests.post")
def test_extract_calls_endpoint_with_bearer_and_returns_json(mock_post):
    """Test that extract() calls Tavily /extract endpoint with Bearer auth."""
    from assistant.brain import tavily
    
    # Mock successful response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "results": [
            {"title": "Pharmacy Name", "meta": "Address info"}
        ]
    }
    mock_response.raise_for_status = MagicMock()
    mock_post.return_value = mock_response
    
    # Call extract
    result = tavily.extract("https://example.com/page")
    
    # Assertions
    assert result == {"results": [{"title": "Pharmacy Name", "meta": "Address info"}]}
    mock_post.assert_called_once()
    call_args = mock_post.call_args
    
    # Verify endpoint
    assert "api.tavily.com/extract" in call_args[0][0]
    
    # Verify Bearer auth header
    headers = call_args[1]["headers"]
    assert "Authorization" in headers
    assert "tvly-dev-test-key-12345" in headers["Authorization"]
