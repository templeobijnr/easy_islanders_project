"""
Unit tests for GraphManager (Zep Graph v3 API wrapper)

Tests verify:
- Proper parameter passing to Zep SDK
- User graphs vs system graphs behavior
- Defensive checks (user_id or graph_id required)
- Error handling and graceful degradation
- Convenience methods for RE domain

Usage:
    pytest -v tests/test_graph_manager.py
    pytest tests/test_graph_manager.py::test_add_fact_triplet_user
"""

import pytest
from unittest.mock import MagicMock, patch, Mock
from datetime import datetime


@pytest.fixture
def mock_zep_client():
    """Mock Zep client for testing without actual API calls."""
    with patch("assistant.memory.graph_manager.Zep") as MockZep:
        mock_instance = MockZep.return_value

        # Setup default mock responses
        mock_instance.graph.add_fact_triple.return_value = {"status": "ok", "uuid": "fact123"}
        mock_instance.graph.search.return_value = {
            "edges": [{"fact": "prefers_location", "target": "Girne"}],
            "nodes": [],
            "episodes": []
        }
        mock_instance.graph.add.return_value = {"uuid": "episode123"}
        mock_instance.graph.create.return_value = {"graph_id": "test_graph"}
        mock_instance.graph.delete.return_value = {"status": "deleted"}

        yield mock_instance


@pytest.fixture
def graph_manager(mock_zep_client):
    """GraphManager instance with mocked Zep client."""
    from assistant.memory.graph_manager import GraphManager

    gm = GraphManager(api_key="test_key", base_url="https://api.getzep.com")
    return gm


# ========================================================================
# Graph Creation Tests
# ========================================================================

def test_create_graph(graph_manager, mock_zep_client):
    """Test system graph creation."""
    resp = graph_manager.create_graph(
        graph_id="test_system",
        name="Test System Graph",
        description="Test description"
    )

    assert resp["graph_id"] == "test_graph"
    mock_zep_client.graph.create.assert_called_once_with(
        graph_id="test_system",
        name="Test System Graph",
        description="Test description"
    )


# ========================================================================
# Fact Triplet Tests (User Graphs)
# ========================================================================

def test_add_fact_triplet_user_graph(graph_manager, mock_zep_client):
    """Test adding fact to user graph."""
    resp = graph_manager.add_fact_triplet(
        user_id="user123",
        source_node_name="User123",
        target_node_name="Girne",
        fact="prefers_location"
    )

    assert resp["status"] == "ok"
    mock_zep_client.graph.add_fact_triple.assert_called_once()

    # Verify user_id was passed, not graph_id
    call_kwargs = mock_zep_client.graph.add_fact_triple.call_args[1]
    assert call_kwargs["user_id"] == "user123"
    assert "graph_id" not in call_kwargs
    assert call_kwargs["source_node_name"] == "User123"
    assert call_kwargs["target_node_name"] == "Girne"
    assert call_kwargs["fact"] == "prefers_location"


def test_add_fact_triplet_system_graph(graph_manager, mock_zep_client):
    """Test adding fact to system graph."""
    resp = graph_manager.add_fact_triplet(
        graph_id="real_estate_system",
        source_node_name="Listing_42",
        target_node_name="Girne",
        fact="located_in"
    )

    assert resp["status"] == "ok"

    # Verify graph_id was passed, not user_id
    call_kwargs = mock_zep_client.graph.add_fact_triple.call_args[1]
    assert call_kwargs["graph_id"] == "real_estate_system"
    assert "user_id" not in call_kwargs


def test_add_fact_triplet_requires_id(graph_manager):
    """Test that either user_id or graph_id must be provided."""
    with pytest.raises(ValueError, match="Either graph_id or user_id must be provided"):
        graph_manager.add_fact_triplet(
            source_node_name="Source",
            target_node_name="Target",
            fact="relationship"
        )


def test_add_fact_triplet_with_temporal_validity(graph_manager, mock_zep_client):
    """Test adding fact with valid_from and valid_until timestamps."""
    now = datetime.utcnow().isoformat()

    resp = graph_manager.add_fact_triplet(
        user_id="user123",
        source_node_name="User123",
        target_node_name="Budget500",
        fact="prefers_budget",
        valid_from=now
    )

    call_kwargs = mock_zep_client.graph.add_fact_triple.call_args[1]
    assert call_kwargs["valid_from"] == now


# ========================================================================
# Episode Tests
# ========================================================================

def test_add_episode_json(graph_manager, mock_zep_client):
    """Test adding JSON episode to system graph."""
    data = {
        "type": "Listing",
        "listing_id": 42,
        "title": "2BR Apartment in Girne"
    }

    resp = graph_manager.add_episode(
        graph_id="real_estate_system",
        type="json",
        data=data,
        source_description="Test listing"
    )

    assert resp["uuid"] == "episode123"

    call_kwargs = mock_zep_client.graph.add.call_args[1]
    assert call_kwargs["graph_id"] == "real_estate_system"
    assert call_kwargs["type"] == "json"
    assert "listing_id" in call_kwargs["data"]  # JSON should be stringified


def test_add_episode_user_graph(graph_manager, mock_zep_client):
    """Test adding episode to user graph."""
    resp = graph_manager.add_episode(
        user_id="user123",
        type="text",
        data="User searched for 2BR apartments in Girne"
    )

    assert resp["uuid"] == "episode123"

    call_kwargs = mock_zep_client.graph.add.call_args[1]
    assert call_kwargs["user_id"] == "user123"
    assert "graph_id" not in call_kwargs


def test_add_episode_requires_id(graph_manager):
    """Test that either user_id or graph_id must be provided for episodes."""
    with pytest.raises(ValueError, match="Either graph_id or user_id must be provided"):
        graph_manager.add_episode(
            type="json",
            data={"test": "data"}
        )


# ========================================================================
# Search Tests
# ========================================================================

def test_search_graph_user(graph_manager, mock_zep_client):
    """Test searching user graph."""
    resp = graph_manager.search_graph(
        user_id="user123",
        query="location preferences",
        limit=5
    )

    assert "edges" in resp
    assert len(resp["edges"]) == 1
    assert resp["edges"][0]["fact"] == "prefers_location"

    mock_zep_client.graph.search.assert_called_once()
    call_kwargs = mock_zep_client.graph.search.call_args[1]
    assert call_kwargs["user_id"] == "user123"
    assert call_kwargs["query"] == "location preferences"
    assert call_kwargs["limit"] == 5


def test_search_graph_with_filters(graph_manager, mock_zep_client):
    """Test searching with min_rating and scope filters."""
    resp = graph_manager.search_graph(
        graph_id="real_estate_system",
        query="coastal cities",
        limit=10,
        min_rating=0.8,
        scope="edges"
    )

    call_kwargs = mock_zep_client.graph.search.call_args[1]
    assert call_kwargs["min_fact_rating"] == 0.8
    assert call_kwargs["scope"] == "edges"


def test_search_graph_error_handling(graph_manager, mock_zep_client):
    """Test that search errors return empty results instead of crashing."""
    mock_zep_client.graph.search.side_effect = Exception("API Error")

    resp = graph_manager.search_graph(
        user_id="user123",
        query="test"
    )

    # Should return empty results, not raise exception
    assert resp == {"edges": [], "nodes": [], "episodes": []}


def test_read_facts(graph_manager, mock_zep_client):
    """Test reading all facts for a user."""
    mock_zep_client.graph.search.return_value = {
        "edges": [
            {"fact": "prefers_location", "target": "Girne"},
            {"fact": "prefers_budget", "target": "600"}
        ],
        "nodes": [],
        "episodes": []
    }

    facts = graph_manager.read_facts(user_id="user123", limit=50)

    assert len(facts) == 2
    assert facts[0]["fact"] == "prefers_location"

    # Verify scope was set to "edges"
    call_kwargs = mock_zep_client.graph.search.call_args[1]
    assert call_kwargs["scope"] == "edges"


# ========================================================================
# Deletion Tests
# ========================================================================

def test_delete_episode(graph_manager, mock_zep_client):
    """Test deleting an episode."""
    resp = graph_manager.delete_episode(
        uuid="episode123",
        user_id="user123"
    )

    assert resp["status"] == "deleted"
    mock_zep_client.graph.delete.assert_called_once()


# ========================================================================
# Convenience Method Tests (Real Estate Domain)
# ========================================================================

def test_store_user_preference(graph_manager, mock_zep_client):
    """Test convenience method for storing user preferences."""
    resp = graph_manager.store_user_preference(
        user_id="user123",
        preference_type="location",
        value="Girne",
        confidence=0.9
    )

    assert resp["status"] == "ok"

    call_kwargs = mock_zep_client.graph.add_fact_triple.call_args[1]
    assert call_kwargs["user_id"] == "user123"
    assert call_kwargs["source_node_name"] == "user123"
    assert call_kwargs["target_node_name"] == "Girne"
    assert call_kwargs["fact"] == "prefers_location"
    assert "valid_from" in call_kwargs  # Should have timestamp


def test_get_user_preferences_all(graph_manager, mock_zep_client):
    """Test retrieving all user preferences."""
    mock_zep_client.graph.search.return_value = {
        "edges": [
            {"fact": "prefers_location", "target": "Girne"},
            {"fact": "prefers_budget", "target": "600"},
            {"fact": "prefers_property_type", "target": "apartment"}
        ],
        "nodes": [],
        "episodes": []
    }

    prefs = graph_manager.get_user_preferences(user_id="user123")

    assert len(prefs) == 3

    # Verify search query included "preferences"
    call_kwargs = mock_zep_client.graph.search.call_args[1]
    assert "preferences" in call_kwargs["query"]
    assert call_kwargs["scope"] == "edges"


def test_get_user_preferences_filtered(graph_manager, mock_zep_client):
    """Test retrieving specific preference type."""
    prefs = graph_manager.get_user_preferences(
        user_id="user123",
        preference_type="location"
    )

    # Verify query includes preference type
    call_kwargs = mock_zep_client.graph.search.call_args[1]
    assert "location" in call_kwargs["query"]


# ========================================================================
# Singleton Tests
# ========================================================================

def test_get_graph_manager_singleton():
    """Test singleton pattern for get_graph_manager()."""
    from assistant.memory.graph_manager import get_graph_manager

    with patch("assistant.memory.graph_manager.GraphManager") as MockGM:
        mock_instance = MockGM.return_value

        # First call should create instance
        mgr1 = get_graph_manager()

        # Second call should return same instance
        mgr2 = get_graph_manager()

        # Should only create once
        assert MockGM.call_count == 1


def test_get_graph_manager_handles_init_failure():
    """Test that get_graph_manager returns None on init failure."""
    from assistant.memory.graph_manager import get_graph_manager, _graph_manager_instance

    # Reset singleton
    import assistant.memory.graph_manager as gm_module
    gm_module._graph_manager_instance = None

    with patch("assistant.memory.graph_manager.GraphManager") as MockGM:
        MockGM.side_effect = ValueError("API key missing")

        mgr = get_graph_manager()
        assert mgr is None


# ========================================================================
# Initialization Tests
# ========================================================================

def test_graphmanager_init_requires_api_key():
    """Test that GraphManager requires ZEP_API_KEY."""
    from assistant.memory.graph_manager import GraphManager

    with patch.dict('os.environ', {}, clear=True):
        with pytest.raises(ValueError, match="ZEP_API_KEY must be provided"):
            GraphManager()


def test_graphmanager_init_with_env_vars():
    """Test GraphManager initialization from environment variables."""
    from assistant.memory.graph_manager import GraphManager

    with patch.dict('os.environ', {
        'ZEP_API_KEY': 'test_key',
        'ZEP_BASE_URL': 'https://test.example.com'
    }):
        with patch("assistant.memory.graph_manager.Zep") as MockZep:
            gm = GraphManager()

            # Verify Zep client was initialized with env vars
            MockZep.assert_called_once()
            call_kwargs = MockZep.call_args[1]
            assert call_kwargs["api_key"] == "test_key"
            assert call_kwargs["base_url"] == "https://test.example.com"


def test_graphmanager_init_without_zep_sdk():
    """Test that GraphManager raises error when zep-cloud not installed."""
    from assistant.memory.graph_manager import GraphManager

    with patch("assistant.memory.graph_manager.ZEP_AVAILABLE", False):
        with pytest.raises(ValueError, match="Zep Cloud SDK not installed"):
            GraphManager(api_key="test")


# ========================================================================
# Integration Test Scenarios
# ========================================================================

@pytest.mark.integration
def test_full_user_preference_workflow(graph_manager, mock_zep_client):
    """Integration test: Store and retrieve user preferences."""
    user_id = "integration_test_user"

    # 1. Store multiple preferences
    graph_manager.store_user_preference(user_id, "location", "Girne", 0.9)
    graph_manager.store_user_preference(user_id, "budget", "600", 0.8)
    graph_manager.store_user_preference(user_id, "property_type", "apartment", 0.85)

    assert mock_zep_client.graph.add_fact_triple.call_count == 3

    # 2. Retrieve preferences
    mock_zep_client.graph.search.return_value = {
        "edges": [
            {"fact": "prefers_location", "target": "Girne", "source": user_id},
            {"fact": "prefers_budget", "target": "600", "source": user_id},
            {"fact": "prefers_property_type", "target": "apartment", "source": user_id}
        ],
        "nodes": [],
        "episodes": []
    }

    prefs = graph_manager.get_user_preferences(user_id)
    assert len(prefs) == 3


@pytest.mark.integration
def test_system_graph_listing_ingestion(graph_manager, mock_zep_client):
    """Integration test: Ingest listing into system graph."""
    listing_data = {
        "type": "Listing",
        "listing_id": 42,
        "title": "2BR Apartment in Girne",
        "price": 600,
        "currency": "GBP",
        "bedrooms": 2,
        "location": "Girne"
    }

    # 1. Add listing as episode
    graph_manager.add_episode(
        graph_id="real_estate_system",
        type="json",
        data=listing_data,
        source_description="Django Listing 42"
    )

    # 2. Add location relationship
    graph_manager.add_fact_triplet(
        graph_id="real_estate_system",
        source_node_name="Listing_42",
        target_node_name="Girne",
        fact="located_in"
    )

    assert mock_zep_client.graph.add.call_count == 1
    assert mock_zep_client.graph.add_fact_triple.call_count == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
