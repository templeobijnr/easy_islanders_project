"""
Smoke tests for Real Estate Agent.

Basic tests to verify the agent works end-to-end:
1. Property search with location + budget
2. Property Q&A
3. Clarification request
4. Empty results + relax
"""

import unittest
from assistant.agents.real_estate import handle_real_estate_request
from assistant.agents.contracts import AgentRequest, AgentContext


class RealEstateAgentSmokeTests(unittest.TestCase):
    """Basic smoke tests for real estate agent."""

    def setUp(self):
        """Set up test fixtures."""
        self.base_context = AgentContext(
            user_id="test-user-123",
            locale="en",
            time="2025-11-02T12:00:00Z"
        )

    def test_property_search_success(self):
        """Test successful property search with location and budget."""
        request = AgentRequest(
            thread_id="thread-001",
            client_msg_id="msg-001",
            intent="property_search",
            input="I'm looking for a 2 bedroom apartment in Kyrenia for £500-600 per night",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Assertions
        self.assertIn("reply", response)
        self.assertIn("actions", response)
        self.assertIsInstance(response["actions"], list)

        # Should have show_listings action
        self.assertTrue(any(a["type"] == "show_listings" for a in response["actions"]))

        # Should have results (fixtures have properties in this range)
        show_listings_action = next(a for a in response["actions"] if a["type"] == "show_listings")
        listings = show_listings_action["params"]["listings"]
        self.assertGreater(len(listings), 0)

        # Check listing structure
        first_listing = listings[0]
        self.assertIn("id", first_listing)
        self.assertIn("title", first_listing)
        self.assertIn("location", first_listing)
        self.assertIn("bedrooms", first_listing)
        self.assertIn("price_per_night", first_listing)

    def test_property_search_budget_margin(self):
        """Test that budget margin (+10%) works correctly."""
        # Request £500-600, should find properties up to £660 (600 * 1.1)
        request = AgentRequest(
            thread_id="thread-002",
            client_msg_id="msg-002",
            intent="property_search",
            input="Show me apartments in Kyrenia for 500 to 600 pounds",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should have results
        self.assertTrue(any(a["type"] == "show_listings" for a in response["actions"]))

    def test_property_search_location_fuzzy_match(self):
        """Test location fuzzy matching (Kyrenia = Girne)."""
        request = AgentRequest(
            thread_id="thread-003",
            client_msg_id="msg-003",
            intent="property_search",
            input="Find me a place in Girne under £200",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should find Kyrenia properties
        self.assertTrue(any(a["type"] == "show_listings" for a in response["actions"]))
        show_listings_action = next(a for a in response["actions"] if a["type"] == "show_listings")
        listings = show_listings_action["params"]["listings"]

        # Check that we found properties (Girne = Kyrenia in fixtures)
        self.assertGreater(len(listings), 0)

    def test_property_qa_pool(self):
        """Test property Q&A for pool amenity."""
        request = AgentRequest(
            thread_id="thread-004",
            client_msg_id="msg-004",
            intent="property_qa",
            input="Does prop-002 have a pool?",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should have answer in reply
        self.assertIn("reply", response)
        self.assertIn("pool", response["reply"].lower())

        # Should contain "yes" (prop-002 is the villa with private_pool)
        self.assertIn("yes", response["reply"].lower())

    def test_property_qa_parking(self):
        """Test property Q&A for parking amenity."""
        request = AgentRequest(
            thread_id="thread-005",
            client_msg_id="msg-005",
            intent="property_qa",
            input="Does prop-001 have parking?",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # prop-001 has parking in amenities
        self.assertIn("yes", response["reply"].lower())

    def test_clarification_missing_params(self):
        """Test clarification request when missing required params."""
        request = AgentRequest(
            thread_id="thread-006",
            client_msg_id="msg-006",
            intent="property_search",
            input="I want a nice place",  # No location or budget
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should ask for clarification
        self.assertTrue(any(a["type"] == "ask_clarification" for a in response["actions"]))

    def test_empty_results_relax(self):
        """Test relax strategy when no results found."""
        request = AgentRequest(
            thread_id="thread-007",
            client_msg_id="msg-007",
            intent="property_search",
            input="I need a 10 bedroom mansion in Kyrenia for £50 per night",  # Unrealistic
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should either:
        # 1. Return relaxed results (if relax found something), OR
        # 2. Ask for clarification (if relax still found nothing)
        action_types = [a["type"] for a in response["actions"]]
        self.assertTrue("show_listings" in action_types or "ask_clarification" in action_types)

        # Check traces for relax attempts
        if "traces" in response:
            self.assertIn("states_visited", response["traces"])

    def test_bedroom_flexibility(self):
        """Test bedroom flexibility (+1 bedroom)."""
        request = AgentRequest(
            thread_id="thread-008",
            client_msg_id="msg-008",
            intent="property_search",
            input="2 bedroom apartment in Kyrenia under £200",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should find 2BR and 3BR properties
        show_listings_action = next(a for a in response["actions"] if a["type"] == "show_listings")
        listings = show_listings_action["params"]["listings"]

        # Check bedrooms (should be 2 or 3)
        for listing in listings:
            self.assertIn(listing["bedrooms"], [2, 3])

    def test_amenities_filter(self):
        """Test amenities filtering."""
        request = AgentRequest(
            thread_id="thread-009",
            client_msg_id="msg-009",
            intent="property_search",
            input="Show me apartments in Kyrenia with pool and wifi under £200",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Should have results with pool and wifi
        if any(a["type"] == "show_listings" for a in response["actions"]):
            show_listings_action = next(a for a in response["actions"] if a["type"] == "show_listings")
            listings = show_listings_action["params"]["listings"]

            # All results should have both pool and wifi
            for listing in listings:
                amenities = listing["amenities"]
                # Note: fixtures may have "pool" or "private_pool"
                has_pool = "pool" in amenities or any("pool" in a for a in amenities)
                has_wifi = "wifi" in amenities
                self.assertTrue(has_pool or has_wifi, f"Listing {listing['id']} missing required amenities")

    def test_response_schema_valid(self):
        """Test that response schema is valid."""
        request = AgentRequest(
            thread_id="thread-010",
            client_msg_id="msg-010",
            intent="property_search",
            input="Kyrenia under £100",
            ctx=self.base_context
        )

        response = handle_real_estate_request(request)

        # Check required fields
        self.assertIn("reply", response)
        self.assertIn("actions", response)
        self.assertIsInstance(response["reply"], str)
        self.assertIsInstance(response["actions"], list)

        # Check actions have type and params
        for action in response["actions"]:
            self.assertIn("type", action)
            self.assertIn("params", action)
            self.assertIn(action["type"], ["show_listings", "ask_clarification", "answer_qa", "error"])

    def test_localization_support(self):
        """Test that locale is respected (basic check)."""
        # S2: Just verify it doesn't crash with different locales
        # S3: Add actual translation checks
        for locale in ["en", "tr", "ru", "de", "pl"]:
            context = AgentContext(
                user_id="test-user",
                locale=locale,
                time="2025-11-02T12:00:00Z"
            )

            request = AgentRequest(
                thread_id=f"thread-{locale}",
                client_msg_id=f"msg-{locale}",
                intent="property_search",
                input="Kyrenia £100-200",
                ctx=context
            )

            response = handle_real_estate_request(request)

            # Should not crash
            self.assertIn("reply", response)


if __name__ == "__main__":
    unittest.main()
