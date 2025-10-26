"""
Enterprise-Grade Specialized Retrieval Tools for Multi-Domain AI Agent Platform
Internal Vector Store Search and External Web Search with Hybrid RAG Foundation
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Union
import logging
import json
import requests
from datetime import datetime

from langchain_core.tools import BaseTool
from langchain_core.embeddings import Embeddings
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

from .schemas import EnterpriseIntentResult

logger = logging.getLogger(__name__)

# ============================================================================
# INTERNAL VECTOR STORE SEARCH TOOL
# ============================================================================

class InternalVectorStoreSearchTool(BaseTool):
    """
    Internal Vector Store Search Tool for Proprietary Data
    Handles property listings, vehicle inventory, and internal knowledge base
    """
    
    name: str = "internal_vector_search"
    description: str = """
    Search internal proprietary database for properties, vehicles, services, and internal knowledge.
    Use this tool for:
    - Property listings (apartments, houses, villas)
    - Vehicle inventory (cars, motorcycles, boats)
    - Internal service providers
    - Company knowledge base and policies
    """
    
    def __init__(self):
        super().__init__()
        self.embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Initialize the vector store with existing data"""
        try:
            # Initialize ChromaDB for internal data
            self.vector_store = Chroma(
                collection_name="internal_knowledge",
                embedding_function=self.embeddings,
                persist_directory="./chroma_db"
            )
            logger.info("Internal vector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            self.vector_store = None
    
    def _run(self, 
             query: str, 
             category: str = "property",
             attributes: Optional[Dict[str, Any]] = None,
             language: str = "en",
             limit: int = 5) -> List[Dict[str, Any]]:
        """
        Execute internal vector search with hybrid filtering
        """
        logger.info(f"Internal search: {query[:50]}... (category: {category})")
        
        if not self.vector_store:
            logger.warning("Vector store not initialized, falling back to database search")
            return self._fallback_database_search(query, category, attributes, language)
        
        try:
            # Build metadata filters based on category and attributes
            metadata_filters = self._build_metadata_filters(category, attributes)
            
            # Perform vector search with metadata filtering
            results = self.vector_store.similarity_search(
                query=query,
                k=limit,
                filter=metadata_filters
            )
            
            # Convert to standardized format
            formatted_results = []
            for doc in results:
                formatted_results.append({
                    'title': doc.metadata.get('title', ''),
                    'description': doc.page_content,
                    'category': doc.metadata.get('category', category),
                    'source': 'internal',
                    'relevance_score': doc.metadata.get('relevance_score', 0.0),
                    'metadata': doc.metadata
                })
            
            logger.info(f"Internal search returned {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Internal vector search failed: {e}")
            return self._fallback_database_search(query, category, attributes, language)
    
    def _build_metadata_filters(self, category: str, attributes: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Build metadata filters for vector search"""
        filters = {"category": category}
        
        if not attributes:
            return filters
        
        # Category-specific filtering
        if category == "property":
            if attributes.get('bedrooms'):
                filters['bedrooms'] = attributes['bedrooms']
            if attributes.get('property_type'):
                filters['property_type'] = attributes['property_type']
            if attributes.get('location'):
                filters['location'] = {"$regex": attributes['location'], "$options": "i"}
        
        elif category == "vehicle":
            if attributes.get('make'):
                filters['make'] = {"$regex": attributes['make'], "$options": "i"}
            if attributes.get('model'):
                filters['model'] = {"$regex": attributes['model'], "$options": "i"}
            if attributes.get('fuel_type'):
                filters['fuel_type'] = attributes['fuel_type']
        
        elif category == "service":
            if attributes.get('service_type'):
                filters['service_type'] = {"$regex": attributes['service_type'], "$options": "i"}
        
        return filters
    
    def _fallback_database_search(self, query: str, category: str, attributes: Optional[Dict[str, Any]], language: str) -> List[Dict[str, Any]]:
        """Fallback to database search if vector store fails"""
        try:
            from listings.models import Listing
            from django.db.models import Q
            
            # Build database query
            q_objects = Q()
            
            # Text search
            if query:
                q_objects |= Q(title__icontains=query) | Q(description__icontains=query)
            
            # Category filtering
            if category == "property":
                q_objects &= Q(category__name__icontains="property")
            elif category == "vehicle":
                q_objects &= Q(category__name__icontains="vehicle")
            
            # Attribute filtering - use dynamic_fields JSON containment
            if attributes:
                if attributes.get('bedrooms'):
                    # Query JSON containment: dynamic_fields contains bedrooms key
                    q_objects &= Q(dynamic_fields__bedrooms=attributes['bedrooms'])
                if attributes.get('max_price'):
                    q_objects &= Q(price__lte=attributes['max_price'])
                if attributes.get('min_price'):
                    q_objects &= Q(price__gte=attributes['min_price'])
                if attributes.get('furnished'):
                    q_objects &= Q(dynamic_fields__furnished=attributes['furnished'])
                if attributes.get('property_type'):
                    q_objects &= Q(dynamic_fields__property_type=attributes['property_type'])
            
            # Execute query
            listings = Listing.objects.filter(q_objects)[:5]
            
            # Format results
            results = []
            for listing in listings:
                results.append({
                    'title': listing.title,
                    'description': listing.description,
                    'category': category,
                    'source': 'database',
                    'relevance_score': 0.8,  # Default score for database results
                    'metadata': {
                        'id': listing.id,
                        'price': str(listing.price),
                        'location': listing.location,
                        'category': listing.category.name if listing.category else None
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Database fallback search failed: {e}")
            return []

# ============================================================================
# EXTERNAL WEB SEARCH TOOL
# ============================================================================

class ExternalWebSearchTool(BaseTool):
    """
    External Web Search Tool for General Knowledge and Real-time Information
    Handles knowledge queries, general products, and external information
    """
    
    name: str = "external_web_search"
    description: str = """
    Search external web for general knowledge, real-time information, and external products.
    Use this tool for:
    - General knowledge queries (how-to, what-is, explanations)
    - External product information (iPhone, cars, services)
    - Real-time information (news, prices, availability)
    - Non-proprietary information not in internal database
    """
    
    def __init__(self):
        super().__init__()
        self.tavily_api_key = None  # Will be loaded from settings
        self.duckduckgo_enabled = True  # Fallback option
    
    def _run(self, 
             query: str, 
             search_type: str = "general",
             language: str = "en",
             limit: int = 5) -> List[Dict[str, Any]]:
        """
        Execute external web search
        """
        logger.info(f"External search: {query[:50]}... (type: {search_type})")
        
        # Try Tavily first (if available)
        if self.tavily_api_key:
            results = self._search_tavily(query, search_type, language, limit)
            if results:
                return results
        
        # Fallback to DuckDuckGo
        if self.duckduckgo_enabled:
            results = self._search_duckduckgo(query, search_type, language, limit)
            if results:
                return results
        
        # Final fallback - return empty results
        logger.warning("All external search methods failed")
        return []
    
    def _search_tavily(self, query: str, search_type: str, language: str, limit: int) -> List[Dict[str, Any]]:
        """Search using Tavily API (preferred)"""
        try:
            # Tavily API configuration
            url = "https://api.tavily.com/search"
            headers = {
                "Authorization": f"Bearer {self.tavily_api_key}",
                "Content-Type": "application/json"
            }
            
            # Build search parameters
            search_params = {
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "include_raw_content": False,
                "max_results": limit,
                "include_domains": [],
                "exclude_domains": []
            }
            
            # Add language-specific parameters
            if language != "en":
                search_params["language"] = language
            
            # Execute search
            response = requests.post(url, json=search_params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Format results
            results = []
            for item in data.get('results', []):
                results.append({
                    'title': item.get('title', ''),
                    'description': item.get('content', ''),
                    'category': search_type,
                    'source': 'tavily',
                    'relevance_score': item.get('score', 0.0),
                    'metadata': {
                        'url': item.get('url', ''),
                        'published_date': item.get('published_date', ''),
                        'language': language
                    }
                })
            
            logger.info(f"Tavily search returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return []
    
    def _search_duckduckgo(self, query: str, search_type: str, language: str, limit: int) -> List[Dict[str, Any]]:
        """Search using DuckDuckGo (fallback)"""
        try:
            # Simple DuckDuckGo search implementation
            # In production, use a proper DuckDuckGo API wrapper
            url = "https://api.duckduckgo.com/"
            params = {
                'q': query,
                'format': 'json',
                'no_html': '1',
                'skip_disambig': '1'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Format results
            results = []
            
            # Process abstract (main result)
            if data.get('Abstract'):
                results.append({
                    'title': data.get('Heading', 'DuckDuckGo Result'),
                    'description': data.get('Abstract', ''),
                    'category': search_type,
                    'source': 'duckduckgo',
                    'relevance_score': 0.9,
                    'metadata': {
                        'url': data.get('AbstractURL', ''),
                        'language': language
                    }
                })
            
            # Process related topics
            for topic in data.get('RelatedTopics', [])[:limit-1]:
                if isinstance(topic, dict) and topic.get('Text'):
                    results.append({
                        'title': topic.get('FirstURL', '').split('/')[-1].replace('_', ' ').title(),
                        'description': topic.get('Text', ''),
                        'category': search_type,
                        'source': 'duckduckgo',
                        'relevance_score': 0.7,
                        'metadata': {
                            'url': topic.get('FirstURL', ''),
                            'language': language
                        }
                    })
            
            logger.info(f"DuckDuckGo search returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {e}")
            return []

# ============================================================================
# HYBRID RAG COORDINATOR
# ============================================================================

class HybridRAGCoordinator:
    """
    Coordinates between internal and external search tools
    Implements intelligent routing and result merging
    """
    
    def __init__(self):
        self.internal_tool = InternalVectorStoreSearchTool()
        self.external_tool = ExternalWebSearchTool()
    
    def search(self, 
               query: str, 
               intent: EnterpriseIntentResult,
               language: str = "en") -> Dict[str, List[Dict[str, Any]]]:
        """
        Intelligent hybrid search based on intent category
        """
        logger.info(f"Hybrid RAG search: {query[:50]}... (category: {intent.category})")
        
        results = {
            'internal_results': [],
            'external_results': [],
            'combined_results': []
        }
        
        # Route based on intent category
        if intent.category == "PROPERTY":
            # Property searches use internal database
            results['internal_results'] = self.internal_tool._run(
                query=query,
                category="property",
                attributes=intent.attributes,
                language=language
            )
        
        elif intent.category == "VEHICLE":
            # Vehicle searches try internal first, then external
            results['internal_results'] = self.internal_tool._run(
                query=query,
                category="vehicle",
                attributes=intent.attributes,
                language=language
            )
            
            # If no internal results, try external
            if not results['internal_results']:
                results['external_results'] = self.external_tool._run(
                    query=query,
                    search_type="products",
                    language=language
                )
        
        elif intent.category == "GENERAL_PRODUCT":
            # General products try internal first, then external
            results['internal_results'] = self.internal_tool._run(
                query=query,
                category="product",
                attributes=intent.attributes,
                language=language
            )
            
            # Always try external for general products
            results['external_results'] = self.external_tool._run(
                query=query,
                search_type="products",
                language=language
            )
        
        elif intent.category == "KNOWLEDGE_QUERY":
            # Knowledge queries use external search
            results['external_results'] = self.external_tool._run(
                query=query,
                search_type="knowledge",
                language=language
            )
        
        elif intent.category == "SERVICE":
            # Services try internal first, then external
            results['internal_results'] = self.internal_tool._run(
                query=query,
                category="service",
                attributes=intent.attributes,
                language=language
            )
            
            if not results['internal_results']:
                results['external_results'] = self.external_tool._run(
                    query=query,
                    search_type="services",
                    language=language
                )
        
        # Combine and rank results
        results['combined_results'] = self._combine_and_rank_results(
            results['internal_results'],
            results['external_results'],
            query
        )
        
        return results
    
    def _combine_and_rank_results(self, 
                                 internal_results: List[Dict[str, Any]], 
                                 external_results: List[Dict[str, Any]], 
                                 query: str) -> List[Dict[str, Any]]:
        """Combine and rank results from internal and external sources"""
        combined = []
        
        # Add internal results with higher priority
        for result in internal_results:
            result['priority'] = 'high'
            result['source_type'] = 'internal'
            combined.append(result)
        
        # Add external results with lower priority
        for result in external_results:
            result['priority'] = 'medium'
            result['source_type'] = 'external'
            combined.append(result)
        
        # Sort by relevance score and priority
        combined.sort(key=lambda x: (
            x.get('relevance_score', 0.0),
            x.get('priority', 'low') == 'high'
        ), reverse=True)
        
        return combined

# ============================================================================
# ENTERPRISE TOOLS ENTRY POINT
# ============================================================================

def get_hybrid_rag_coordinator() -> HybridRAGCoordinator:
    """Get the hybrid RAG coordinator instance"""
    return HybridRAGCoordinator()

def search_internal_listings(query: str, category: str, attributes: Dict[str, Any], language: str) -> List[Dict[str, Any]]:
    """Search internal listings (legacy compatibility)"""
    tool = InternalVectorStoreSearchTool()
    return tool._run(query, category, attributes, language)

def search_external_web(query: str, search_type: str, language: str) -> List[Dict[str, Any]]:
    """Search external web (legacy compatibility)"""
    tool = ExternalWebSearchTool()
    return tool._run(query, search_type, language)
