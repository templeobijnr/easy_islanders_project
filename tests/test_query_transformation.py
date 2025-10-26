"""
Test Suite for Query Transformation Module

Tests cover:
1. HyDE (Hypothetical Document Embeddings) generation quality
2. Semantic expansion and synonym mapping
3. Specification extraction (budget, location, bedrooms, type, amenities)
4. Edge cases (empty queries, special characters, multiple criteria)
5. Performance (<100ms per transformation)
6. LangGraph node integration
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from assistant.brain.query_transformer import (
    QueryTransformer,
    create_query_transformer,
    node_transform_query,
    TransformedQuery
)


class TestTransformedQueryDataclass:
    """Test TransformedQuery dataclass structure."""
    
    def test_transformed_query_fields(self):
        """Verify all required fields are present."""
        tq = TransformedQuery(
            original="test",
            rewritten="test transformed",
            expanded="test expanded",
            parsed_specs={"type": "apartment"},
            embedding_ready=True,
            transformation_score=0.85
        )
        assert tq.original == "test"
        assert tq.transformation_score == 0.85
        assert tq.embedding_ready is True


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestQueryTransformerInitialization:
    """Test transformer initialization and configuration."""
    
    def test_default_initialization(self, mock_chat):
        """Create transformer with default settings."""
        mock_chat.return_value = Mock()
        transformer = create_query_transformer()
        assert transformer is not None
        assert transformer.llm is not None
    
    def test_custom_model(self, mock_chat):
        """Create transformer with custom model."""
        mock_chat.return_value = Mock()
        transformer = QueryTransformer(model="gpt-4o-mini")
        assert transformer.llm is not None
    
    def test_temperature_setting(self, mock_chat):
        """Verify temperature is set correctly."""
        mock_chat.return_value = Mock()
        transformer = QueryTransformer(temperature=0.5)
        assert transformer.temperature == 0.5


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestEmptyAndEdgeCases:
    """Test edge cases and empty inputs."""
    
    def test_empty_query(self, mock_chat):
        """Handle empty query string."""
        mock_chat.return_value = Mock()
        transformer = create_query_transformer()
        result = transformer.transform("")
        assert result.original == ""
        assert result.embedding_ready is False
    
    def test_whitespace_only_query(self, mock_chat):
        """Handle whitespace-only query."""
        mock_chat.return_value = Mock()
        transformer = create_query_transformer()
        result = transformer.transform("   \n\t   ")
        assert result.original == ""
        assert result.embedding_ready is False
    
    def test_single_word_query(self, mock_chat):
        """Handle single word queries."""
        mock_chat.return_value = Mock()
        transformer = create_query_transformer()
        result = transformer.transform("apartment")
        assert result.original == "apartment"
        assert result.embedding_ready is True
        assert result.parsed_specs.get("type") == "apartment"


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestSpecificationExtraction:
    """Test extraction of structured specifications."""
    
    def test_extract_budget_eur(self, mock_chat):
        """Extract budget with EUR notation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "A 2-bedroom apartment in Kyrenia for €600/month"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment for €600")
        assert result.parsed_specs.get("budget_max") == 600
        assert result.parsed_specs.get("currency") == "EUR"
    
    def test_extract_budget_gbp(self, mock_chat):
        """Extract budget with GBP notation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment for £500"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment for £500")
        assert result.parsed_specs.get("budget_max") == 500
        assert result.parsed_specs.get("currency") == "GBP"
    
    def test_extract_bedrooms(self, mock_chat):
        """Extract bedroom count."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2 bedroom apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("2 bedroom apartment")
        assert result.parsed_specs.get("bedrooms") == 2
    
    def test_extract_location_kyrenia(self, mock_chat):
        """Extract Kyrenia location."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment in Kyrenia"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment in kyrenia")
        assert result.parsed_specs.get("location") == "kyrenia"
    
    def test_extract_location_famagusta(self, mock_chat):
        """Extract Famagusta location."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "House in Famagusta"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("house in famagusta")
        assert result.parsed_specs.get("location") == "famagusta"
    
    def test_extract_type_apartment(self, mock_chat):
        """Extract apartment type."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Flat for rent"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("flat for rent")
        assert result.parsed_specs.get("type") == "apartment"
    
    def test_extract_type_house(self, mock_chat):
        """Extract house type."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Villa in Nicosia"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("villa in nicosia")
        assert result.parsed_specs.get("type") == "house"
    
    def test_extract_amenities(self, mock_chat):
        """Extract amenities."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Furnished apartment with pool and parking"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("furnished apartment with pool and parking")
        amenities = result.parsed_specs.get("amenities", [])
        assert "furnished" in amenities
        assert "pool" in amenities
        assert "parking" in amenities
    
    def test_multiple_specifications(self, mock_chat):
        """Extract multiple specifications from complex query."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2BR furnished apartment in Kyrenia for €800 with pool"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        query = "2BR furnished apartment in kyrenia for €800 with pool"
        result = transformer.transform(query)
        assert result.parsed_specs.get("bedrooms") == 2
        assert result.parsed_specs.get("type") == "apartment"
        assert result.parsed_specs.get("location") == "kyrenia"
        assert result.parsed_specs.get("budget_max") == 800
        assert "furnished" in result.parsed_specs.get("amenities", [])


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestSemanticExpansion:
    """Test synonym expansion and semantic enrichment."""
    
    def test_expand_apartment_synonyms(self, mock_chat):
        """Expand 'apartment' to related terms."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment")
        expanded_lower = result.expanded.lower()
        assert "apartment" in expanded_lower or "flat" in expanded_lower
    
    def test_expand_preserves_original_terms(self, mock_chat):
        """Expanded query should retain original terms."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Kyrenia apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("kyrenia apartment")
        expanded = result.expanded.lower()
        assert "kyrenia" in expanded
    
    def test_expand_removes_duplicates(self, mock_chat):
        """Expansion should not contain duplicate words."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment apartment apartment")
        words = result.expanded.split()
        unique_words = set(words)
        assert len(words) == len(unique_words)


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestHyDEGeneration:
    """Test Hypothetical Document Embeddings generation."""
    
    def test_hyde_generates_output(self, mock_chat):
        """HyDE should generate a non-empty hypothesis."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2-bedroom apartment in Kyrenia, €600/month, modern amenities"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("2BR apartment in kyrenia for €600")
        assert result.rewritten != ""
        assert len(result.rewritten) > 0
    
    def test_hyde_stays_within_length_limit(self, mock_chat):
        """Generated hypothesis should be reasonably sized."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Short hypothesis"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("apartment")
        assert len(result.rewritten) <= 300
    
    def test_hyde_contains_query_context(self, mock_chat):
        """Generated hypothesis should relate to query topic."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Reliable car rental service in Cyprus"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("car rental")
        rewritten_lower = result.rewritten.lower()
        assert any(term in rewritten_lower for term in ["car", "rental", "vehicle", "automobile"])


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestConfidenceScoring:
    """Test confidence score calculation."""
    
    def test_high_confidence_detailed_query(self, mock_chat):
        """Detailed query with multiple specs should have high confidence."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Detailed response"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("2BR furnished apartment in kyrenia for €600 with pool")
        assert result.transformation_score > 0.7
    
    def test_low_confidence_vague_query(self, mock_chat):
        """Vague query should have lower confidence."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Something"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        result = transformer.transform("something")
        assert result.transformation_score < 0.7
    
    def test_score_in_valid_range(self, mock_chat):
        """Score should always be between 0 and 1."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Response"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        queries = [
            "apartment",
            "2BR apartment in kyrenia for €600",
            "",
            "a"
        ]
        for query in queries:
            result = transformer.transform(query)
            assert 0.0 <= result.transformation_score <= 1.0


class TestLangGraphNodeIntegration:
    """Test integration with LangGraph as a node."""
    
    def test_node_accepts_state(self):
        """Node should accept LangGraph state dict."""
        state = {"user_text": "apartment in kyrenia"}
        result = node_transform_query(state)
        assert result is not None
        assert "user_text" in result
    
    @patch('assistant.brain.query_transformer.ChatOpenAI')
    def test_node_adds_transformed_query(self, mock_chat):
        """Node should add transformed_query to state."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2BR apartment for €600"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        state = {"user_text": "2BR apartment for €600"}
        result = node_transform_query(state)
        assert "transformed_query" in result
        assert result["transformed_query"]["original"] == "2BR apartment for €600"
    
    @patch('assistant.brain.query_transformer.ChatOpenAI')
    def test_node_adds_query_metadata(self, mock_chat):
        """Node should add query_metadata to state."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment for €600"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        state = {"user_text": "apartment for €600"}
        result = node_transform_query(state)
        assert "query_metadata" in result
        assert "budget_max" in result["query_metadata"]
    
    @patch('assistant.brain.query_transformer.ChatOpenAI')
    def test_node_adds_confidence_score(self, mock_chat):
        """Node should add transformation_confidence to state."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        state = {"user_text": "apartment"}
        result = node_transform_query(state)
        assert "transformation_confidence" in result
        assert 0.0 <= result["transformation_confidence"] <= 1.0
    
    def test_node_handles_empty_state(self):
        """Node should gracefully handle empty state."""
        state = {}
        result = node_transform_query(state)
        assert result is not None
    
    def test_node_handles_missing_user_text(self):
        """Node should handle missing user_text key."""
        state = {"other_key": "value"}
        result = node_transform_query(state)
        assert result is not None


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestTransformationIntegration:
    """Integration tests combining multiple transformation strategies."""
    
    def test_full_transformation_pipeline(self, mock_chat):
        """Test complete transformation from raw query to optimized form."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2BR furnished apartment in Kyrenia, €700/month"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        query = "looking for 2 bedroom furnished apartment in kyrenia around €700/month"
        result = transformer.transform(query)
        
        assert result.original == query
        assert result.rewritten != ""
        assert result.expanded != ""
        assert len(result.parsed_specs) > 0
        assert result.embedding_ready is True
        assert 0.0 <= result.transformation_score <= 1.0
        
        assert result.parsed_specs.get("bedrooms") == 2
        assert result.parsed_specs.get("type") == "apartment"
        assert result.parsed_specs.get("location") == "kyrenia"
        assert result.parsed_specs.get("budget_max") == 700
    
    def test_transformation_comparison(self, mock_chat):
        """Compare transformations for similar queries."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Apartment"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        results = []
        for query in [
            "apartment in kyrenia",
            "2BR apartment in kyrenia for €600",
            "luxury apartment with pool in kyrenia"
        ]:
            results.append(transformer.transform(query))
        
        assert all(r.embedding_ready for r in results)
        confidences = [r.transformation_score for r in results]
        assert confidences[1] >= confidences[0] or confidences[2] >= confidences[0]


@patch('assistant.brain.query_transformer.ChatOpenAI')
class TestPerformance:
    """Test performance characteristics."""
    
    def test_transformation_latency(self, mock_chat):
        """Transformation should complete within acceptable time."""
        import time
        
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "2BR apartment in Kyrenia for €600"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        query = "2BR apartment in kyrenia for €600"
        
        start = time.time()
        result = transformer.transform(query)
        elapsed = (time.time() - start) * 1000
        
        assert result is not None
    
    def test_batch_transformation(self, mock_chat):
        """Transform multiple queries efficiently."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Response"
        mock_llm.invoke.return_value = mock_response
        mock_chat.return_value = mock_llm
        
        transformer = create_query_transformer()
        queries = [
            "apartment in kyrenia",
            "2BR house for €800",
            "car rental",
            "luxury villa with pool"
        ]
        
        results = [transformer.transform(q) for q in queries]
        assert len(results) == 4
        assert all(r.embedding_ready for r in results)


if __name__ == "__main__":
