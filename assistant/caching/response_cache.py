# assistant/caching/response_cache.py
"""
Intelligent Response Caching for LLM Production

Based on "LLMs in Production" Chapter 6: Caching and Optimization
"""

import hashlib
import json
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from enum import Enum

from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class CacheStrategy(Enum):
    """Caching strategies for different types of requests"""
    AGGRESSIVE = "aggressive"  # Cache for 24 hours
    MODERATE = "moderate"      # Cache for 1 hour
    CONSERVATIVE = "conservative"  # Cache for 15 minutes
    NO_CACHE = "no_cache"      # Don't cache


@dataclass
class CacheEntry:
    """Cached response entry"""
    key: str
    response: Dict[str, Any]
    timestamp: datetime
    strategy: CacheStrategy
    hit_count: int = 0
    last_accessed: datetime = None
    metadata: Dict[str, Any] = None


class ResponseCache:
    """Intelligent response caching for LLM requests"""
    
    def __init__(self):
        self.cache_prefix = "llm_response_cache"
        self.cache_stats_key = "cache_stats"
        
        # Cache TTL by strategy (in seconds)
        self.ttl_strategies = {
            CacheStrategy.AGGRESSIVE: 86400,    # 24 hours
            CacheStrategy.MODERATE: 3600,       # 1 hour
            CacheStrategy.CONSERVATIVE: 900,    # 15 minutes
            CacheStrategy.NO_CACHE: 0           # No caching
        }
    
    def get_cache_key(self, user_message: str, conversation_id: str, language: str) -> str:
        """Generate a cache key for the request"""
        # Normalize the message for consistent caching
        normalized_message = self._normalize_message(user_message)
        
        # Create hash of the normalized request
        cache_data = {
            "message": normalized_message,
            "conversation_id": conversation_id,
            "language": language
        }
        
        cache_string = json.dumps(cache_data, sort_keys=True)
        cache_hash = hashlib.md5(cache_string.encode()).hexdigest()
        
        return f"{self.cache_prefix}:{cache_hash}"
    
    def _normalize_message(self, message: str) -> str:
        """Normalize message for consistent caching"""
        # Convert to lowercase
        normalized = message.lower().strip()
        
        # Remove extra whitespace
        normalized = " ".join(normalized.split())
        
        # Remove common variations that shouldn't affect caching
        # (e.g., "please", "can you", "I need")
        stop_words = ["please", "can you", "could you", "i need", "i want", "i'm looking for"]
        for word in stop_words:
            if normalized.startswith(word):
                normalized = normalized[len(word):].strip()
        
        return normalized
    
    def get(self, user_message: str, conversation_id: str, language: str) -> Optional[Dict[str, Any]]:
        """Get cached response if available"""
        try:
            cache_key = self.get_cache_key(user_message, conversation_id, language)
            cached_data = cache.get(cache_key)
            
            if cached_data:
                # Update access statistics
                self._update_cache_stats("hit")
                
                # Update entry metadata
                cached_data["hit_count"] = cached_data.get("hit_count", 0) + 1
                cached_data["last_accessed"] = datetime.now(timezone.utc).isoformat()
                cache.set(cache_key, cached_data, timeout=self._get_ttl(cached_data.get("strategy")))
                
                logger.info(f"Cache HIT for key: {cache_key[:20]}...")
                return cached_data.get("response")
            
            # Cache miss
            self._update_cache_stats("miss")
            logger.info(f"Cache MISS for key: {cache_key[:20]}...")
            return None
        
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None
    
    def set(self, user_message: str, conversation_id: str, language: str, 
            response: Dict[str, Any], strategy: CacheStrategy = CacheStrategy.MODERATE) -> None:
        """Cache a response"""
        try:
            cache_key = self.get_cache_key(user_message, conversation_id, language)
            
            # Don't cache if strategy is NO_CACHE
            if strategy == CacheStrategy.NO_CACHE:
                return
            
            # Create cache entry
            cache_entry = {
                "key": cache_key,
                "response": response,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "strategy": strategy.value,
                "hit_count": 0,
                "last_accessed": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    "original_message": user_message,
                    "conversation_id": conversation_id,
                    "language": language
                }
            }
            
            # Store in cache
            ttl = self._get_ttl(strategy)
            cache.set(cache_key, cache_entry, timeout=ttl)
            
            logger.info(f"Cached response with strategy {strategy.value} for {ttl}s")
        
        except Exception as e:
            logger.error(f"Error caching response: {e}")
    
    def _get_ttl(self, strategy: CacheStrategy) -> int:
        """Get TTL for a caching strategy"""
        if isinstance(strategy, str):
            strategy = CacheStrategy(strategy)
        return self.ttl_strategies.get(strategy, 3600)
    
    def _update_cache_stats(self, event_type: str) -> None:
        """Update cache statistics"""
        try:
            stats = cache.get(self.cache_stats_key, {
                "hits": 0,
                "misses": 0,
                "total_requests": 0,
                "hit_rate": 0.0,
                "last_updated": datetime.now(timezone.utc).isoformat()
            })
            
            stats["total_requests"] += 1
            
            if event_type == "hit":
                stats["hits"] += 1
            elif event_type == "miss":
                stats["misses"] += 1
            
            # Calculate hit rate
            if stats["total_requests"] > 0:
                stats["hit_rate"] = stats["hits"] / stats["total_requests"]
            
            stats["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Store updated stats
            cache.set(self.cache_stats_key, stats, timeout=86400)  # Keep for 24 hours
        
        except Exception as e:
            logger.error(f"Error updating cache stats: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        return cache.get(self.cache_stats_key, {
            "hits": 0,
            "misses": 0,
            "total_requests": 0,
            "hit_rate": 0.0,
            "last_updated": None
        })
    
    def determine_cache_strategy(self, user_message: str, intent_type: str, 
                               conversation_id: str) -> CacheStrategy:
        """Determine appropriate caching strategy based on request characteristics"""
        
        # Don't cache personal or time-sensitive requests
        personal_keywords = ["my", "i am", "i'm", "personal", "private", "book", "schedule"]
        if any(keyword in user_message.lower() for keyword in personal_keywords):
            return CacheStrategy.NO_CACHE
        
        # Don't cache requests that depend on conversation context
        if conversation_id and len(conversation_id) > 10:  # Likely has conversation history
            context_keywords = ["remember", "you said", "earlier", "before", "previous"]
            if any(keyword in user_message.lower() for keyword in context_keywords):
                return CacheStrategy.NO_CACHE
        
        # Cache property searches aggressively (they're mostly static)
        if intent_type == "property_search":
            return CacheStrategy.AGGRESSIVE
        
        # Cache general knowledge questions moderately
        if intent_type == "general_chat":
            knowledge_keywords = ["what is", "how to", "explain", "tell me about"]
            if any(keyword in user_message.lower() for keyword in knowledge_keywords):
                return CacheStrategy.MODERATE
        
        # Cache agent outreach conservatively (might have dynamic elements)
        if intent_type == "agent_outreach":
            return CacheStrategy.CONSERVATIVE
        
        # Default to moderate caching
        return CacheStrategy.MODERATE
    
    def invalidate_conversation_cache(self, conversation_id: str) -> None:
        """Invalidate all cached responses for a conversation"""
        try:
            # This is a simplified approach - in production, you might want to
            # maintain a reverse index of conversation_id -> cache_keys
            logger.info(f"Cache invalidation requested for conversation: {conversation_id}")
            # Note: Full implementation would require maintaining a mapping
            # of conversation_id to cache keys for efficient invalidation
        
        except Exception as e:
            logger.error(f"Error invalidating conversation cache: {e}")
    
    def clear_expired_cache(self) -> int:
        """Clear expired cache entries (called periodically)"""
        try:
            # This is a simplified implementation
            # In production, you might want to implement a more sophisticated
            # cleanup mechanism
            logger.info("Cache cleanup requested")
            return 0  # Return number of entries cleaned
        
        except Exception as e:
            logger.error(f"Error clearing expired cache: {e}")
            return 0



