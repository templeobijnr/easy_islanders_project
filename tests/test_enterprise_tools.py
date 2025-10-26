"""
Unit Tests for Enterprise Tools
Tests InternalVectorStoreSearchTool, ExternalWebSearchTool, and HybridRAGCoordinator
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase

from assistant.brain.enterprise_tools import (
    InternalVectorStoreSearchTool,
    ExternalWebSearchTool,
    HybridRAGCoordinator,
    get_hybrid_rag_coordinator
)
from assistant.brain.enterprise_schemas import EnterpriseIntentResult

class TestInternalVectorStoreSearchTool(TestCase):
    """Test InternalVectorStoreSearchTool"""
    
    def setUp(self):
        """Set up test data"""
        self.tool = InternalVectorStoreSearchTool()
    
    def test_tool_initialization(self):
        """Test tool initialization"""
        assert self.tool.name == "internal_vector_search"
        assert self.tool.description is not None
        assert self.tool.embeddings is not None
    
    def test_run_with_vector_store(self):
        """Test _run method with vector store available"""
        with patch.object(self.tool, 'vector_store') as mock_vector_store:
            mock_vector_store.similarity_search.return_value = [
                Mock(metadata={'title': 'Property 1'}, page_content='Description 1')
            ]
            
            results = self.tool._run(
                query="2 bedroom apartment",
                category="property",
                attributes={'bedrooms': 2},
                language="en",
                limit=5
            )
            
            assert len(results) == 1
            assert results[0]['title'] == 'Property 1'
            assert results[0]['source'] == 'internal'
    
    def test_run_with_fallback_database_search(self):
        """Test _run method with database fallback"""
        with patch.object(self.tool, 'vector_store', None):
            with patch.object(self.tool, '_fallback_database_search') as mock_fallback:
                mock_fallback.return_value = [{'title': 'DB Property', 'source': 'database'}]
                
                results = self.tool._run(
                    query="2 bedroom apartment",
                    category="property",
                    language="en"
                )
                
                assert len(results) == 1
                assert results[0]['source'] == 'database'
                mock_fallback.assert_called_once()
    
    def test_build_metadata_filters_property(self):
        """Test metadata filter building for property category"""
        filters = self.tool._build_metadata_filters(
            category="property",
            attributes={'bedrooms': 2, 'property_type': 'apartment', 'location': 'Girne'}
        )
        
        assert filters['category'] == 'property'
        assert filters['bedrooms'] == 2
        assert filters['property_type'] == 'apartment'
        assert 'location' in filters
    
    def test_build_metadata_filters_vehicle(self):
        """Test metadata filter building for vehicle category"""
        filters = self.tool._build_metadata_filters(
            category="vehicle",
            attributes={'make': 'Toyota', 'model': 'Camry', 'fuel_type': 'petrol'}
        )
        
        assert filters['category'] == 'vehicle'
        assert 'make' in filters
        assert 'model' in filters
        assert filters['fuel_type'] == 'petrol'
    
    def test_build_metadata_filters_service(self):
        """Test metadata filter building for service category"""
        filters = self.tool._build_metadata_filters(
            category="service",
            attributes={'service_type': 'cleaning'}
        )
        
        assert filters['category'] == 'service'
        assert 'service_type' in filters
    
    def test_fallback_database_search_success(self):
        """Test database fallback search with successful results"""
        with patch('assistant.brain.enterprise_tools.Listing') as mock_listing:
            mock_listing.objects.filter.return_value = [
                Mock(
                    id=1,
                    title="Test Property",
                    description="Test Description",
                    price=1000,
                    location="Girne",
                    category=Mock(name="Property")
                )
            ]
            
            results = self.tool._fallback_database_search(
                query="2 bedroom apartment",
                category="property",
                attributes={'bedrooms': 2},
                language="en"
            )
            
            assert len(results) == 1
            assert results[0]['title'] == 'Test Property'
            assert results[0]['source'] == 'database'
    
    def test_fallback_database_search_error(self):
        """Test database fallback search with error"""
        with patch('assistant.brain.enterprise_tools.Listing') as mock_listing:
            mock_listing.objects.filter.side_effect = Exception("Database error")
            
            results = self.tool._fallback_database_search(
                query="test query",
                category="property",
                language="en"
            )
            
            assert results == []

class TestExternalWebSearchTool(TestCase):
    """Test ExternalWebSearchTool"""
    
    def setUp(self):
        """Set up test data"""
        self.tool = ExternalWebSearchTool()
    
    def test_tool_initialization(self):
        """Test tool initialization"""
        assert self.tool.name == "external_web_search"
        assert self.tool.description is not None
        assert self.tool.tavily_api_key is None
        assert self.tool.duckduckgo_enabled == True
    
    def test_run_with_tavily_success(self):
        """Test _run method with successful Tavily search"""
        self.tool.tavily_api_key = "test-key"
        
        with patch.object(self.tool, '_search_tavily') as mock_tavily:
            mock_tavily.return_value = [{'title': 'Tavily Result', 'source': 'tavily'}]
            
            results = self.tool._run(
                query="iPhone 15",
                search_type="products",
                language="en",
                limit=5
            )
            
            assert len(results) == 1
            assert results[0]['source'] == 'tavily'
            mock_tavily.assert_called_once()
    
    def test_run_with_duckduckgo_fallback(self):
        """Test _run method with DuckDuckGo fallback"""
        self.tool.tavily_api_key = None
        
        with patch.object(self.tool, '_search_duckduckgo') as mock_ddg:
            mock_ddg.return_value = [{'title': 'DDG Result', 'source': 'duckduckgo'}]
            
            results = self.tool._run(
                query="general knowledge",
                search_type="knowledge",
                language="en"
            )
            
            assert len(results) == 1
            assert results[0]['source'] == 'duckduckgo'
            mock_ddg.assert_called_once()
    
    def test_run_all_methods_fail(self):
        """Test _run method when all search methods fail"""
        self.tool.tavily_api_key = None
        self.tool.duckduckgo_enabled = False
        
        results = self.tool._run(
            query="test query",
            search_type="general"
        )
        
        assert results == []
    
    def test_search_tavily_success(self):
        """Test Tavily search with successful API response"""
        self.tool.tavily_api_key = "test-key"
        
        mock_response = Mock()
        mock_response.json.return_value = {
            'results': [
                {
                    'title': 'Test Result',
                    'content': 'Test Content',
                    'score': 0.9,
                    'url': 'https://example.com',
                    'published_date': '2024-01-01'
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        
        with patch('assistant.brain.enterprise_tools.requests.post') as mock_post:
            mock_post.return_value = mock_response
            
            results = self.tool._search_tavily(
                query="test query",
                search_type="general",
                language="en",
                limit=5
            )
            
            assert len(results) == 1
            assert results[0]['title'] == 'Test Result'
            assert results[0]['source'] == 'tavily'
    
    def test_search_tavily_error(self):
        """Test Tavily search with API error"""
        self.tool.tavily_api_key = "test-key"
        
        with patch('assistant.brain.enterprise_tools.requests.post') as mock_post:
            mock_post.side_effect = Exception("API error")
            
            results = self.tool._search_tavily(
                query="test query",
                search_type="general",
                language="en"
            )
            
            assert results == []
    
    def test_search_duckduckgo_success(self):
        """Test DuckDuckGo search with successful response"""
        mock_response = Mock()
        mock_response.json.return_value = {
            'Abstract': 'Test abstract',
            'Heading': 'Test Heading',
            'AbstractURL': 'https://example.com',
            'RelatedTopics': [
                {
                    'Text': 'Related topic',
                    'FirstURL': 'https://related.com'
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        
        with patch('assistant.brain.enterprise_tools.requests.get') as mock_get:
            mock_get.return_value = mock_response
            
            results = self.tool._search_duckduckgo(
                query="test query",
                search_type="general",
                language="en",
                limit=5
            )
            
            assert len(results) >= 1
            assert any(result['source'] == 'duckduckgo' for result in results)
    
    def test_search_duckduckgo_error(self):
        """Test DuckDuckGo search with error"""
        with patch('assistant.brain.enterprise_tools.requests.get') as mock_get:
            mock_get.side_effect = Exception("Network error")
            
            results = self.tool._search_duckduckgo(
                query="test query",
                search_type="general",
                language="en"
            )
            
            assert results == []

class TestHybridRAGCoordinator(TestCase):
    """Test HybridRAGCoordinator"""
    
    def setUp(self):
        """Set up test data"""
        self.coordinator = HybridRAGCoordinator()
        self.mock_intent = EnterpriseIntentResult(
            intent_type="property_search",
            confidence=0.9,
            language="en",
            category="PROPERTY",
            attributes={'bedrooms': 2}
        )
    
    def test_coordinator_initialization(self):
        """Test coordinator initialization"""
        assert self.coordinator.internal_tool is not None
        assert self.coordinator.external_tool is not None
    
    def test_search_property_category(self):
        """Test search for property category"""
        with patch.object(self.coordinator.internal_tool, '_run') as mock_internal:
            mock_internal.return_value = [{'title': 'Property 1', 'source': 'internal'}]
            
            results = self.coordinator.search(
                query="2 bedroom apartment",
                intent=self.mock_intent,
                language="en"
            )
            
            assert 'internal_results' in results
            assert 'external_results' in results
            assert 'combined_results' in results
            assert len(results['internal_results']) == 1
            assert len(results['external_results']) == 0  # Property uses internal only
    
    def test_search_vehicle_category(self):
        """Test search for vehicle category"""
        vehicle_intent = EnterpriseIntentResult(
            intent_type="vehicle_search",
            confidence=0.9,
            language="en",
            category="VEHICLE",
            attributes={'make': 'Toyota'}
        )
        
        with patch.object(self.coordinator.internal_tool, '_run') as mock_internal:
            mock_internal.return_value = []  # No internal results
            
            with patch.object(self.coordinator.external_tool, '_run') as mock_external:
                mock_external.return_value = [{'title': 'External Vehicle', 'source': 'external'}]
                
                results = self.coordinator.search(
                    query="Toyota Camry",
                    intent=vehicle_intent,
                    language="en"
                )
                
                assert len(results['internal_results']) == 0
                assert len(results['external_results']) == 1
                assert len(results['combined_results']) == 1
    
    def test_search_general_product_category(self):
        """Test search for general product category"""
        product_intent = EnterpriseIntentResult(
            intent_type="general_product_search",
            confidence=0.9,
            language="en",
            category="GENERAL_PRODUCT",
            attributes={'product_type': 'electronics'}
        )
        
        with patch.object(self.coordinator.internal_tool, '_run') as mock_internal:
            mock_internal.return_value = [{'title': 'Internal Product', 'source': 'internal'}]
            
            with patch.object(self.coordinator.external_tool, '_run') as mock_external:
                mock_external.return_value = [{'title': 'External Product', 'source': 'external'}]
                
                results = self.coordinator.search(
                    query="iPhone 15",
                    intent=product_intent,
                    language="en"
                )
                
                assert len(results['internal_results']) == 1
                assert len(results['external_results']) == 1
                assert len(results['combined_results']) == 2
    
    def test_search_knowledge_query_category(self):
        """Test search for knowledge query category"""
        knowledge_intent = EnterpriseIntentResult(
            intent_type="knowledge_query",
            confidence=0.9,
            language="en",
            category="KNOWLEDGE_QUERY"
        )
        
        with patch.object(self.coordinator.external_tool, '_run') as mock_external:
            mock_external.return_value = [{'title': 'Knowledge Result', 'source': 'external'}]
            
            results = self.coordinator.search(
                query="How to buy a house?",
                intent=knowledge_intent,
                language="en"
            )
            
            assert len(results['internal_results']) == 0
            assert len(results['external_results']) == 1
            assert len(results['combined_results']) == 1
    
    def test_search_service_category(self):
        """Test search for service category"""
        service_intent = EnterpriseIntentResult(
            intent_type="service_search",
            confidence=0.9,
            language="en",
            category="SERVICE",
            attributes={'service_type': 'cleaning'}
        )
        
        with patch.object(self.coordinator.internal_tool, '_run') as mock_internal:
            mock_internal.return_value = []  # No internal results
            
            with patch.object(self.coordinator.external_tool, '_run') as mock_external:
                mock_external.return_value = [{'title': 'External Service', 'source': 'external'}]
                
                results = self.coordinator.search(
                    query="cleaning service",
                    intent=service_intent,
                    language="en"
                )
                
                assert len(results['internal_results']) == 0
                assert len(results['external_results']) == 1
                assert len(results['combined_results']) == 1
    
    def test_combine_and_rank_results(self):
        """Test result combination and ranking"""
        internal_results = [
            {'title': 'Internal 1', 'relevance_score': 0.9, 'source': 'internal'},
            {'title': 'Internal 2', 'relevance_score': 0.8, 'source': 'internal'}
        ]
        external_results = [
            {'title': 'External 1', 'relevance_score': 0.7, 'source': 'external'},
            {'title': 'External 2', 'relevance_score': 0.6, 'source': 'external'}
        ]
        
        combined = self.coordinator._combine_and_rank_results(
            internal_results, external_results, "test query"
        )
        
        assert len(combined) == 4
        assert combined[0]['priority'] == 'high'  # Internal results have higher priority
        assert combined[0]['source_type'] == 'internal'
        assert combined[2]['priority'] == 'medium'  # External results have medium priority
        assert combined[2]['source_type'] == 'external'
        
        # Results should be sorted by relevance score
        assert combined[0]['relevance_score'] >= combined[1]['relevance_score']
    
    def test_combine_and_rank_results_empty(self):
        """Test result combination with empty results"""
        combined = self.coordinator._combine_and_rank_results(
            [], [], "test query"
        )
        
        assert combined == []
    
    def test_get_hybrid_rag_coordinator(self):
        """Test get_hybrid_rag_coordinator function"""
        coordinator = get_hybrid_rag_coordinator()
        
        assert isinstance(coordinator, HybridRAGCoordinator)
        assert coordinator.internal_tool is not None
        assert coordinator.external_tool is not None

class TestEnterpriseToolsIntegration(TestCase):
    """Integration tests for enterprise tools"""
    
    def test_tool_error_handling(self):
        """Test that tools handle errors gracefully"""
        # Test InternalVectorStoreSearchTool error handling
        internal_tool = InternalVectorStoreSearchTool()
        with patch.object(internal_tool, 'vector_store', None):
            with patch.object(internal_tool, '_fallback_database_search') as mock_fallback:
                mock_fallback.side_effect = Exception("Database error")
                
                results = internal_tool._run("test query", "property", {}, "en")
                assert results == []
        
        # Test ExternalWebSearchTool error handling
        external_tool = ExternalWebSearchTool()
        with patch.object(external_tool, '_search_tavily') as mock_tavily:
            mock_tavily.side_effect = Exception("Tavily error")
            
            with patch.object(external_tool, '_search_duckduckgo') as mock_ddg:
                mock_ddg.side_effect = Exception("DuckDuckGo error")
                
                results = external_tool._run("test query", "general", "en")
                assert results == []
    
    def test_coordinator_error_handling(self):
        """Test that coordinator handles tool errors gracefully"""
        coordinator = HybridRAGCoordinator()
        intent = EnterpriseIntentResult(
            intent_type="property_search",
            confidence=0.9,
            language="en",
            category="PROPERTY"
        )
        
        with patch.object(coordinator.internal_tool, '_run') as mock_internal:
            mock_internal.side_effect = Exception("Internal tool error")
            
            results = coordinator.search("test query", intent, "en")
            
            assert 'internal_results' in results
            assert 'external_results' in results
            assert 'combined_results' in results
            assert results['internal_results'] == []
    
    def test_tool_performance(self):
        """Test tool performance with large result sets"""
        # Test InternalVectorStoreSearchTool with large results
        internal_tool = InternalVectorStoreSearchTool()
        with patch.object(internal_tool, 'vector_store') as mock_vector_store:
            # Create mock results
            mock_results = []
            for i in range(100):
                mock_results.append(Mock(
                    metadata={'title': f'Property {i}'},
                    page_content=f'Description {i}'
                ))
            mock_vector_store.similarity_search.return_value = mock_results
            
            results = internal_tool._run("test query", "property", {}, "en", limit=10)
            
            # Should respect limit
            assert len(results) <= 10
    
    def test_tool_language_handling(self):
        """Test tool language handling with different languages"""
        # Test with Turkish
        internal_tool = InternalVectorStoreSearchTool()
        with patch.object(internal_tool, 'vector_store') as mock_vector_store:
            mock_vector_store.similarity_search.return_value = []
            
            results = internal_tool._run(
                query="2 yatak odalı daire",
                category="property",
                language="tr"
            )
            
            # Should handle Turkish language
            assert isinstance(results, list)
        
        # Test with Russian
        external_tool = ExternalWebSearchTool()
        with patch.object(external_tool, '_search_duckduckgo') as mock_ddg:
            mock_ddg.return_value = []
            
            results = external_tool._run(
                query="квартира с 2 спальнями",
                search_type="property",
                language="ru"
            )
            
            # Should handle Russian language
            assert isinstance(results, list)
