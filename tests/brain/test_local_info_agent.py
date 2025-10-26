"""
Tests for LOCAL_LOOKUP worker agent (local_info_handler).
Ensures city confirmation and map payload generation.
"""

import pytest
from unittest.mock import patch, MagicMock


def test_asks_for_city_when_missing():
    """Test that local_info_agent asks for city when missing from state."""
    from assistant.brain.supervisor_graph import local_info_handler
    
    # State with no city
    state = {
        "user_input": "where can I find an open pharmacy?",
        "routing_decision": {"intent_type": "local_lookup", "attributes": {}},
        "thread_id": "test-123"
    }
    
    result = local_info_handler(state)
    
    # Should ask for city
    assert result["is_complete"] == False
    assert "Which city" in result["final_response"]["message"]
    assert "Kyrenia" in result["final_response"]["message"]  # Show examples


def test_emits_geo_recommendations_when_city_present():
    """Test that local_info_agent emits geo_location recommendations with city."""
    from assistant.brain.supervisor_graph import local_info_handler
    
    state = {
        "user_input": "open pharmacy in Kyrenia",
        "routing_decision": {
            "intent_type": "local_lookup",
            "attributes": {"city": "Kyrenia"}
        },
        "thread_id": "test-123"
    }
    
    with patch("assistant.brain.tavily.search") as mock_search, \
         patch("assistant.brain.tavily.extract") as mock_extract, \
         patch("assistant.brain.tools_local.geocode") as mock_geocode:
        
        # Mock Tavily search
        mock_search.return_value = {
            "results": [
                {"url": "https://kteb.org/pharmacies"}
            ]
        }
        
        # Mock Tavily extract
        mock_extract.return_value = {
            "results": [
                {"title": "Pharmacy A", "meta": "Main St, Kyrenia"}
            ]
        }
        
        # Mock geocode
        mock_geocode.return_value = (35.1264, 33.4299)
        
        result = local_info_handler(state)
        
        # Should have recommendations
        assert result["is_complete"] == True
        assert "recommendations" in result
        assert len(result["recommendations"]) > 0
        
        # Check structure
        rec = result["recommendations"][0]
        assert rec["type"] == "geo_location"
        assert rec["latitude"] == 35.1264
        assert rec["longitude"] == 33.4299
        assert rec["display_name"] == "Pharmacy A"
        assert rec["entity_type"] == "pharmacy"


def test_summary_text_in_final_response():
    """Test that final_response includes summary text."""
    from assistant.brain.supervisor_graph import local_info_handler
    
    state = {
        "user_input": "pharmacy in Kyrenia",
        "routing_decision": {
            "intent_type": "local_lookup",
            "attributes": {"city": "Kyrenia"}
        },
        "thread_id": "test-123"
    }
    
    with patch("assistant.brain.tavily.search") as mock_search, \
         patch("assistant.brain.tavily.extract") as mock_extract, \
         patch("assistant.brain.tools_local.geocode") as mock_geocode:
        
        mock_search.return_value = {"results": [{"url": "https://test.com"}]}
        mock_extract.return_value = {
            "results": [{"title": "Pharmacy", "meta": "Address"}]
        }
        mock_geocode.return_value = (35.1, 33.4)
        
        result = local_info_handler(state)
        
        # Final response should have summary
        assert "final_response" in result
        assert "type" in result["final_response"]
        assert "message" in result["final_response"]
        assert result["final_response"]["type"] == "text"
