"""
Query Transformation Module for LangGraph Agent

Implements advanced query rewriting strategies to improve RAG retrieval accuracy:
1. HyDE (Hypothetical Document Embeddings) - Generate synthetic matching documents
2. Semantic Expansion - Add synonyms and related terms
3. Specification Extraction - Parse structured criteria (budget, location, bedrooms, etc.)

These transformations ensure ambiguous user queries are converted to vector-store-optimized
forms before retrieval, reducing hallucination and improving context relevance.

Success Criteria:
  - Query transformation accuracy: >90%
  - RAG relevance improvement: 70% → 85%+
  - Latency impact: <100ms additional
"""

from typing import Dict, List, Any, Optional, Tuple
import json
import logging
import re
from dataclasses import dataclass, asdict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


@dataclass
class TransformedQuery:
    """Structured output from query transformation."""
    original: str
    rewritten: str
    expanded: str
    parsed_specs: Dict[str, Any]
    embedding_ready: bool
    transformation_score: float  # 0-1, confidence in transformation


class QueryTransformer:
    """Transform user queries into retrieval-optimized forms."""
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7):
        """
        Initialize transformer with LLM for HyDE generation.
        
        Args:
            model: OpenAI model to use (cheaper mini model for speed)
            temperature: LLM temperature (0.7 for creative expansion)
        """
        self.llm = ChatOpenAI(model=model, temperature=temperature)
        self.temperature = temperature
        
    def transform(self, query: str) -> TransformedQuery:
        """
        Transform user query into retrieval-optimized form.
        
        Executes three strategies in sequence:
        1. HyDE - Generate synthetic document matching the query
        2. Semantic Expansion - Add related terms and synonyms
        3. Specification Extraction - Parse structured criteria
        
        Args:
            query: User's natural language query
            
        Returns:
            TransformedQuery with rewritten, expanded, and parsed specs
        """
        if not query or not query.strip():
            return self._empty_transformation()
        
        query = query.strip()
        
        try:
            # Strategy 1: Generate hypothetical document (HyDE)
            rewritten = self._generate_hypothesis(query)
            
            # Strategy 2: Semantic expansion with synonyms
            expanded = self._expand_synonyms(query)
            
            # Strategy 3: Extract specifications
            parsed_specs = self._extract_specifications(query)
            
            # Calculate confidence score
            score = self._calculate_confidence(query, rewritten, parsed_specs)
            
            return TransformedQuery(
                original=query,
                rewritten=rewritten,
                expanded=expanded,
                parsed_specs=parsed_specs,
                embedding_ready=True,
                transformation_score=score
            )
        except Exception as e:
            logger.error(f"Error transforming query: {e}")
            return self._empty_transformation_with_original(query)
    
    def _generate_hypothesis(self, query: str) -> str:
        """
        HyDE: Generate hypothetical document matching the query.
        
        Example:
          Query: "find apartment for 600"
          Generated: "2-bedroom apartment in Kyrenia, recently renovated, 
                     €600/month, near beach, modern amenities"
        
        This document is then embedded alongside the query for better matching.
        """
        try:
            system_msg = SystemMessage(content="""You are an expert real estate document generator.
Given a user search query, write a realistic property listing that would perfectly match this query.
Write a SHORT, specific 1-2 sentence listing (not a full document).
Focus on concrete details: type, location, price, features.""")
            
            user_msg = HumanMessage(content=f"""Generate a property listing that matches this search:
"{query}"

Listing:""")
            
            response = self.llm.invoke([system_msg, user_msg])
            hypothesis = response.content.strip()
            
            # Ensure it's not too long
            if len(hypothesis) > 300:
                hypothesis = hypothesis[:300]
            
            logger.debug(f"Generated hypothesis: {hypothesis[:80]}...")
            return hypothesis
        except Exception as e:
            logger.warning(f"HyDE generation failed, using original: {e}")
            return query
    
    def _expand_synonyms(self, query: str) -> str:
        """
        Expand query with synonyms and related terms.
        
        Example:
          "apartment for 600" → "apartment flat studio rental €600 EUR monthly"
        
        Creates alternative search variants using domain-specific synonyms.
        """
        # Domain-specific synonym mappings
        synonyms = {
            r'\bapartment\b': 'apartment flat studio rental residential',
            r'\bhouse\b': 'house villa home residence property',
            r'\bcar\b': 'car vehicle automobile rent rental',
            r'\bexperience\b': 'experience activity tour service',
            r'\bservice\b': 'service professional help assistance',
            r'\bbed\b|br\b|bedroom': 'bedroom bed room br',
            r'\bluxury\b': 'luxury premium high-end deluxe',
            r'\bbudget\b': 'budget affordable cheap inexpensive',
            r'\bbeach\b': 'beach seaside coastal waterfront',
            r'\bcity\b|center\b|centre\b': 'city center downtown urban',
            r'\bkyrenia\b|giresun\b|kyrenia': 'kyrenia giresun north coast',
            r'\bfamagusta\b|gazimagusa\b': 'famagusta gazimagusa east coast',
            r'\bprice\b|cost\b|rate': 'price cost rate fee charge',
            r'\beuro\b|€|pounds\b|£': 'euro EUR pounds GBP',
        }
        
        expanded = query.lower()
        for pattern, replacement in synonyms.items():
            expanded = re.sub(pattern, replacement, expanded, flags=re.IGNORECASE)
        
        # Remove duplicates while preserving order
        words = expanded.split()
        unique_words = []
        seen = set()
        for word in words:
            if word.lower() not in seen:
                unique_words.append(word)
                seen.add(word.lower())
        
        expanded = ' '.join(unique_words)
        logger.debug(f"Expanded query: {expanded[:80]}...")
        return expanded
    
    def _extract_specifications(self, query: str) -> Dict[str, Any]:
        """
        Extract structured specifications from query using regex + LLM.
        
        Extracts: budget_min, budget_max, location, bedrooms, amenities, type, etc.
        
        Example:
          "2BR apartment in Kyrenia for €600" →
          {
            "type": "apartment",
            "bedrooms": 2,
            "location": "Kyrenia",
            "budget_max": 600,
            "currency": "EUR"
          }
        """
        specs = {}
        query_lower = query.lower()
        
        # 1. Extract budget using regex
        budget_patterns = [
            (r'€\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 'EUR'),
            (r'(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:euro|eur)', 'EUR'),
            (r'£\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 'GBP'),
            (r'(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:pound|gbp)', 'GBP'),
        ]
        
        for pattern, currency in budget_patterns:
            match = re.search(pattern, query_lower)
            if match:
                amount = float(match.group(1).replace(',', ''))
                if 'max' not in specs or amount < specs.get('budget_max', float('inf')):
                    specs['budget_max'] = int(amount)
                    specs['currency'] = currency
                break
        
        # 2. Extract bedrooms
        br_match = re.search(r'(\d+)\s*(?:bed|br|bedroom)', query_lower)
        if br_match:
            specs['bedrooms'] = int(br_match.group(1))
        
        # 3. Extract type
        if re.search(r'\b(apartment|flat|studio|apt)\b', query_lower):
            specs['type'] = 'apartment'
        elif re.search(r'\b(house|villa|home|bungalow)\b', query_lower):
            specs['type'] = 'house'
        elif re.search(r'\b(car|vehicle|rental car|auto)\b', query_lower):
            specs['type'] = 'car'
        elif re.search(r'\b(experience|tour|activity|service)\b', query_lower):
            specs['type'] = 'service'
        
        # 4. Extract location (simplified)
        locations = {
            'kyrenia': ['kyrenia', 'girne'],
            'famagusta': ['famagusta', 'gazimagusa'],
            'nicosia': ['nicosia', 'lefkosa'],
            'larnaca': ['larnaca', 'larnaka'],
            'paphos': ['paphos', 'pafos'],
        }
        
        for loc_name, loc_keywords in locations.items():
            if any(kw in query_lower for kw in loc_keywords):
                specs['location'] = loc_name
                break
        
        # 5. Extract amenities
        amenities = []
        amenity_patterns = {
            'furnished': r'\bfurnished\b',
            'unfurnished': r'\bunfurnished\b',
            'modern': r'\bmodern\b',
            'luxury': r'\bluxury\b',
            'beach_view': r'\beach (?:view|access|front)\b',
            'parking': r'\bparking\b',
            'pool': r'\bpool\b',
        }
        
        for amenity, pattern in amenity_patterns.items():
            if re.search(pattern, query_lower):
                amenities.append(amenity)
        
        if amenities:
            specs['amenities'] = amenities
        
        logger.debug(f"Extracted specs: {specs}")
        return specs
    
    def _calculate_confidence(
        self, 
        original: str, 
        rewritten: str, 
        specs: Dict[str, Any]
    ) -> float:
        """
        Calculate confidence score (0-1) for transformation quality.
        
        Factors:
        - Presence of structured specs (budget, location, type)
        - Similarity between original and rewritten (not too different)
        - Query length (longer queries have more info)
        """
        score = 0.5  # baseline
        
        # Reward for extracted specifications
        if specs.get('budget_max'):
            score += 0.15
        if specs.get('location'):
            score += 0.15
        if specs.get('type'):
            score += 0.10
        if specs.get('bedrooms'):
            score += 0.05
        
        # Reward for reasonable query length
        if 10 <= len(original.split()) <= 50:
            score += 0.10
        
        # Small penalty if rewritten differs too much (sign of hallucination)
        original_words = set(original.lower().split())
        rewritten_words = set(rewritten.lower().split())
        overlap = len(original_words & rewritten_words) / max(len(original_words), 1)
        if overlap < 0.2:  # Very different = potential hallucination
            score -= 0.15
        
        return min(1.0, max(0.0, score))  # Clamp to [0, 1]
    
    def _empty_transformation(self) -> TransformedQuery:
        """Return null transformation for empty query."""
        return TransformedQuery(
            original="",
            rewritten="",
            expanded="",
            parsed_specs={},
            embedding_ready=False,
            transformation_score=0.0
        )
    
    def _empty_transformation_with_original(self, query: str) -> TransformedQuery:
        """Fallback: return original query without transformation."""
        return TransformedQuery(
            original=query,
            rewritten=query,
            expanded=query,
            parsed_specs=self._extract_specifications(query),
            embedding_ready=True,
            transformation_score=0.3  # Low confidence, but usable
        )


def create_query_transformer(model: str = "gpt-4o-mini") -> QueryTransformer:
    """Factory function to create a QueryTransformer instance."""
    return QueryTransformer(model=model)


# Integration with LangGraph graph.py
def node_transform_query(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Transform user query before retrieval.
    
    Executes between state_init and node_search.
    Converts ambiguous natural language into retrieval-optimized form.
    
    Args:
        state: LangGraph state with 'user_text' key
        
    Returns:
        Updated state with 'transformed_query' and 'query_metadata'
    """
    user_text = state.get("user_text", "").strip()
    
    if not user_text:
        return state
    
    try:
        transformer = create_query_transformer()
        transformed = transformer.transform(user_text)
        
        return {
            **state,
            "transformed_query": asdict(transformed),
            "query_metadata": transformed.parsed_specs,
            "transformation_confidence": transformed.transformation_score,
        }
    except Exception as e:
        logger.error(f"Query transformation node failed: {e}")
        return state
Query Transformation Module for LangGraph Agent

Implements advanced query rewriting strategies to improve RAG retrieval accuracy:
1. HyDE (Hypothetical Document Embeddings) - Generate synthetic matching documents
2. Semantic Expansion - Add synonyms and related terms
3. Specification Extraction - Parse structured criteria (budget, location, bedrooms, etc.)

These transformations ensure ambiguous user queries are converted to vector-store-optimized
forms before retrieval, reducing hallucination and improving context relevance.

Success Criteria:
  - Query transformation accuracy: >90%
  - RAG relevance improvement: 70% → 85%+
  - Latency impact: <100ms additional
"""

from typing import Dict, List, Any, Optional, Tuple
import json
import logging
import re
from dataclasses import dataclass, asdict
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)


@dataclass
class TransformedQuery:
    """Structured output from query transformation."""
    original: str
    rewritten: str
    expanded: str
    parsed_specs: Dict[str, Any]
    embedding_ready: bool
    transformation_score: float  # 0-1, confidence in transformation


class QueryTransformer:
    """Transform user queries into retrieval-optimized forms."""
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7):
        """
        Initialize transformer with LLM for HyDE generation.
        
        Args:
            model: OpenAI model to use (cheaper mini model for speed)
            temperature: LLM temperature (0.7 for creative expansion)
        """
        self.llm = ChatOpenAI(model=model, temperature=temperature)
        self.temperature = temperature
        
    def transform(self, query: str) -> TransformedQuery:
        """
        Transform user query into retrieval-optimized form.
        
        Executes three strategies in sequence:
        1. HyDE - Generate synthetic document matching the query
        2. Semantic Expansion - Add related terms and synonyms
        3. Specification Extraction - Parse structured criteria
        
        Args:
            query: User's natural language query
            
        Returns:
            TransformedQuery with rewritten, expanded, and parsed specs
        """
        if not query or not query.strip():
            return self._empty_transformation()
        
        query = query.strip()
        
        try:
            # Strategy 1: Generate hypothetical document (HyDE)
            rewritten = self._generate_hypothesis(query)
            
            # Strategy 2: Semantic expansion with synonyms
            expanded = self._expand_synonyms(query)
            
            # Strategy 3: Extract specifications
            parsed_specs = self._extract_specifications(query)
            
            # Calculate confidence score
            score = self._calculate_confidence(query, rewritten, parsed_specs)
            
            return TransformedQuery(
                original=query,
                rewritten=rewritten,
                expanded=expanded,
                parsed_specs=parsed_specs,
                embedding_ready=True,
                transformation_score=score
            )
        except Exception as e:
            logger.error(f"Error transforming query: {e}")
            return self._empty_transformation_with_original(query)
    
    def _generate_hypothesis(self, query: str) -> str:
        """
        HyDE: Generate hypothetical document matching the query.
        
        Example:
          Query: "find apartment for 600"
          Generated: "2-bedroom apartment in Kyrenia, recently renovated, 
                     €600/month, near beach, modern amenities"
        
        This document is then embedded alongside the query for better matching.
        """
        try:
            system_msg = SystemMessage(content="""You are an expert real estate document generator.
Given a user search query, write a realistic property listing that would perfectly match this query.
Write a SHORT, specific 1-2 sentence listing (not a full document).
Focus on concrete details: type, location, price, features.""")
            
            user_msg = HumanMessage(content=f"""Generate a property listing that matches this search:
"{query}"

Listing:""")
            
            response = self.llm.invoke([system_msg, user_msg])
            hypothesis = response.content.strip()
            
            # Ensure it's not too long
            if len(hypothesis) > 300:
                hypothesis = hypothesis[:300]
            
            logger.debug(f"Generated hypothesis: {hypothesis[:80]}...")
            return hypothesis
        except Exception as e:
            logger.warning(f"HyDE generation failed, using original: {e}")
            return query
    
    def _expand_synonyms(self, query: str) -> str:
        """
        Expand query with synonyms and related terms.
        
        Example:
          "apartment for 600" → "apartment flat studio rental €600 EUR monthly"
        
        Creates alternative search variants using domain-specific synonyms.
        """
        # Domain-specific synonym mappings
        synonyms = {
            r'\bapartment\b': 'apartment flat studio rental residential',
            r'\bhouse\b': 'house villa home residence property',
            r'\bcar\b': 'car vehicle automobile rent rental',
            r'\bexperience\b': 'experience activity tour service',
            r'\bservice\b': 'service professional help assistance',
            r'\bbed\b|br\b|bedroom': 'bedroom bed room br',
            r'\bluxury\b': 'luxury premium high-end deluxe',
            r'\bbudget\b': 'budget affordable cheap inexpensive',
            r'\bbeach\b': 'beach seaside coastal waterfront',
            r'\bcity\b|center\b|centre\b': 'city center downtown urban',
            r'\bkyrenia\b|giresun\b|kyrenia': 'kyrenia giresun north coast',
            r'\bfamagusta\b|gazimagusa\b': 'famagusta gazimagusa east coast',
            r'\bprice\b|cost\b|rate': 'price cost rate fee charge',
            r'\beuro\b|€|pounds\b|£': 'euro EUR pounds GBP',
        }
        
        expanded = query.lower()
        for pattern, replacement in synonyms.items():
            expanded = re.sub(pattern, replacement, expanded, flags=re.IGNORECASE)
        
        # Remove duplicates while preserving order
        words = expanded.split()
        unique_words = []
        seen = set()
        for word in words:
            if word.lower() not in seen:
                unique_words.append(word)
                seen.add(word.lower())
        
        expanded = ' '.join(unique_words)
        logger.debug(f"Expanded query: {expanded[:80]}...")
        return expanded
    
    def _extract_specifications(self, query: str) -> Dict[str, Any]:
        """
        Extract structured specifications from query using regex + LLM.
        
        Extracts: budget_min, budget_max, location, bedrooms, amenities, type, etc.
        
        Example:
          "2BR apartment in Kyrenia for €600" →
          {
            "type": "apartment",
            "bedrooms": 2,
            "location": "Kyrenia",
            "budget_max": 600,
            "currency": "EUR"
          }
        """
        specs = {}
        query_lower = query.lower()
        
        # 1. Extract budget using regex
        budget_patterns = [
            (r'€\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 'EUR'),
            (r'(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:euro|eur)', 'EUR'),
            (r'£\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)', 'GBP'),
            (r'(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:pound|gbp)', 'GBP'),
        ]
        
        for pattern, currency in budget_patterns:
            match = re.search(pattern, query_lower)
            if match:
                amount = float(match.group(1).replace(',', ''))
                if 'max' not in specs or amount < specs.get('budget_max', float('inf')):
                    specs['budget_max'] = int(amount)
                    specs['currency'] = currency
                break
        
        # 2. Extract bedrooms
        br_match = re.search(r'(\d+)\s*(?:bed|br|bedroom)', query_lower)
        if br_match:
            specs['bedrooms'] = int(br_match.group(1))
        
        # 3. Extract type
        if re.search(r'\b(apartment|flat|studio|apt)\b', query_lower):
            specs['type'] = 'apartment'
        elif re.search(r'\b(house|villa|home|bungalow)\b', query_lower):
            specs['type'] = 'house'
        elif re.search(r'\b(car|vehicle|rental car|auto)\b', query_lower):
            specs['type'] = 'car'
        elif re.search(r'\b(experience|tour|activity|service)\b', query_lower):
            specs['type'] = 'service'
        
        # 4. Extract location (simplified)
        locations = {
            'kyrenia': ['kyrenia', 'girne'],
            'famagusta': ['famagusta', 'gazimagusa'],
            'nicosia': ['nicosia', 'lefkosa'],
            'larnaca': ['larnaca', 'larnaka'],
            'paphos': ['paphos', 'pafos'],
        }
        
        for loc_name, loc_keywords in locations.items():
            if any(kw in query_lower for kw in loc_keywords):
                specs['location'] = loc_name
                break
        
        # 5. Extract amenities
        amenities = []
        amenity_patterns = {
            'furnished': r'\bfurnished\b',
            'unfurnished': r'\bunfurnished\b',
            'modern': r'\bmodern\b',
            'luxury': r'\bluxury\b',
            'beach_view': r'\beach (?:view|access|front)\b',
            'parking': r'\bparking\b',
            'pool': r'\bpool\b',
        }
        
        for amenity, pattern in amenity_patterns.items():
            if re.search(pattern, query_lower):
                amenities.append(amenity)
        
        if amenities:
            specs['amenities'] = amenities
        
        logger.debug(f"Extracted specs: {specs}")
        return specs
    
    def _calculate_confidence(
        self, 
        original: str, 
        rewritten: str, 
        specs: Dict[str, Any]
    ) -> float:
        """
        Calculate confidence score (0-1) for transformation quality.
        
        Factors:
        - Presence of structured specs (budget, location, type)
        - Similarity between original and rewritten (not too different)
        - Query length (longer queries have more info)
        """
        score = 0.5  # baseline
        
        # Reward for extracted specifications
        if specs.get('budget_max'):
            score += 0.15
        if specs.get('location'):
            score += 0.15
        if specs.get('type'):
            score += 0.10
        if specs.get('bedrooms'):
            score += 0.05
        
        # Reward for reasonable query length
        if 10 <= len(original.split()) <= 50:
            score += 0.10
        
        # Small penalty if rewritten differs too much (sign of hallucination)
        original_words = set(original.lower().split())
        rewritten_words = set(rewritten.lower().split())
        overlap = len(original_words & rewritten_words) / max(len(original_words), 1)
        if overlap < 0.2:  # Very different = potential hallucination
            score -= 0.15
        
        return min(1.0, max(0.0, score))  # Clamp to [0, 1]
    
    def _empty_transformation(self) -> TransformedQuery:
        """Return null transformation for empty query."""
        return TransformedQuery(
            original="",
            rewritten="",
            expanded="",
            parsed_specs={},
            embedding_ready=False,
            transformation_score=0.0
        )
    
    def _empty_transformation_with_original(self, query: str) -> TransformedQuery:
        """Fallback: return original query without transformation."""
        return TransformedQuery(
            original=query,
            rewritten=query,
            expanded=query,
            parsed_specs=self._extract_specifications(query),
            embedding_ready=True,
            transformation_score=0.3  # Low confidence, but usable
        )


def create_query_transformer(model: str = "gpt-4o-mini") -> QueryTransformer:
    """Factory function to create a QueryTransformer instance."""
    return QueryTransformer(model=model)


# Integration with LangGraph graph.py
def node_transform_query(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Transform user query before retrieval.
    
    Executes between state_init and node_search.
    Converts ambiguous natural language into retrieval-optimized form.
    
    Args:
        state: LangGraph state with 'user_text' key
        
    Returns:
        Updated state with 'transformed_query' and 'query_metadata'
    """
    user_text = state.get("user_text", "").strip()
    
    if not user_text:
        return state
    
    try:
        transformer = create_query_transformer()
        transformed = transformer.transform(user_text)
        
        return {
            **state,
            "transformed_query": asdict(transformed),
            "query_metadata": transformed.parsed_specs,
            "transformation_confidence": transformed.transformation_score,
        }
    except Exception as e:
        logger.error(f"Query transformation node failed: {e}")
        return state
