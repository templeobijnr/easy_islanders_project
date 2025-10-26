"""
Tests for /api/chat/ endpoint API contract.
Ensures recommendations field is included in response.
"""

import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client as DjangoClient
import json


class ChatEndpointTests(TestCase):
    """Tests for chat API endpoint."""
    
    def setUp(self):
        self.client = DjangoClient()
    
    @patch("assistant.views.run_supervisor_agent")
    def test_chat_includes_recommendations_from_agent(self, mock_agent):
        """Test that /api/chat/ includes recommendations in JSON response."""
        
        # Mock agent result with recommendations
        mock_agent.return_value = {
            "final_response": {"type": "text", "message": "Found 2 pharmacies"},
            "recommendations": [
                {
                    "type": "geo_location",
                    "latitude": 35.1264,
                    "longitude": 33.4299,
                    "display_name": "Pharmacy A",
                    "entity_type": "pharmacy",
                    "metadata": {"address": "Main St, Kyrenia"}
                },
                {
                    "type": "geo_location",
                    "latitude": 35.1300,
                    "longitude": 33.4350,
                    "display_name": "Pharmacy B",
                    "entity_type": "pharmacy",
                    "metadata": {"address": "Side St, Kyrenia"}
                }
            ],
            "thread_id": "test-123"
        }
        
        # Make request
        response = self.client.post(
            "/api/chat/",
            data=json.dumps({"message": "open pharmacy in Kyrenia"}),
            content_type="application/json"
        )
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Verify recommendations in response
        assert "recommendations" in data
        assert len(data["recommendations"]) == 2
        assert data["recommendations"][0]["type"] == "geo_location"
        assert data["recommendations"][0]["latitude"] == 35.1264
        assert data["recommendations"][0]["display_name"] == "Pharmacy A"
    
    @patch("assistant.views.run_supervisor_agent")
    def test_chat_response_has_message_field(self, mock_agent):
        """Test that /api/chat/ response includes message field."""
        
        mock_agent.return_value = {
            "final_response": {"type": "text", "message": "Hello!"},
            "recommendations": [],
            "thread_id": "test-123"
        }
        
        response = self.client.post(
            "/api/chat/",
            data=json.dumps({"message": "hello"}),
            content_type="application/json"
        )
        
        data = response.json()
        assert "message" in data or "final_response" in data
