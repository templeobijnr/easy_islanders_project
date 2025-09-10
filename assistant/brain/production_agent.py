# assistant/brain/production_agent.py
"""
Production-Ready LLM Agent with Monitoring, Caching, and Error Handling

Based on "LLMs in Production" best practices:
- Comprehensive monitoring and metrics
- Intelligent response caching
- Robust error handling and fallbacks
- Performance optimization
"""

import uuid
import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from django.core.cache import cache

from .agent import process_turn as base_process_turn
from .config import OPENAI_CHAT_MODEL
from ..monitoring.metrics import LLMMetrics, PerformanceTracker, LLMRequestMetrics
from ..monitoring.alerts import AlertManager
from ..caching.response_cache import ResponseCache, CacheStrategy

logger = logging.getLogger(__name__)


class ProductionAgent:
    """Production-ready LLM agent with monitoring and optimization"""
    
    def __init__(self):
        self.metrics = LLMMetrics()
        self.alerts = AlertManager()
        self.cache = ResponseCache()
        self.request_count = 0
    
    def process_turn(self, user_text: str, conversation_id: Optional[str]) -> Dict[str, Any]:
        """
        Enhanced process_turn with production features:
        - Request tracking and metrics
        - Response caching
        - Error handling and fallbacks
        - Performance monitoring
        """
        request_id = f"prod_{uuid.uuid4().hex[:8]}"
        self.request_count += 1
        
        logger.info(f"[{request_id}] Production agent processing request #{self.request_count}")
        
        # Check cache first
        cached_response = self._check_cache(user_text, conversation_id)
        if cached_response:
            logger.info(f"[{request_id}] Returning cached response")
            return cached_response
        
        # Process with monitoring
        with PerformanceTracker(request_id, OPENAI_CHAT_MODEL) as tracker:
            try:
                # Get intent for cache strategy determination
                intent_type = self._get_intent_type(user_text, conversation_id)
                tracker.intent_type = intent_type
                
                # Process the request
                start_time = time.time()
                result = base_process_turn(user_text, conversation_id)
                processing_time = (time.time() - start_time) * 1000
                
                # Extract token usage if available
                prompt_tokens = result.get("prompt_tokens", 0)
                completion_tokens = result.get("completion_tokens", 0)
                total_tokens = prompt_tokens + completion_tokens
                
                # Update tracker with actual token usage
                tracker.update_tokens(prompt_tokens, completion_tokens)
                
                # Calculate cost
                cost = self.metrics.get_cost_estimate(prompt_tokens, completion_tokens, OPENAI_CHAT_MODEL)
                
                # Create detailed metrics
                request_metrics = LLMRequestMetrics(
                    request_id=request_id,
                    timestamp=datetime.now(timezone.utc),
                    model=OPENAI_CHAT_MODEL,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    latency_ms=processing_time,
                    cost_usd=cost,
                    success=True,
                    intent_type=intent_type,
                    language=result.get("language", "en")
                )
                
                # Track metrics
                self.metrics.track_request(request_metrics)
                
                # Cache the response
                cache_strategy = self.cache.determine_cache_strategy(
                    user_text, intent_type, conversation_id
                )
                self.cache.set(user_text, conversation_id, result.get("language", "en"), 
                             result, cache_strategy)
                
                # Add production metadata to response
                result["production_metadata"] = {
                    "request_id": request_id,
                    "processing_time_ms": processing_time,
                    "tokens_used": total_tokens,
                    "cost_usd": cost,
                    "cached": False,
                    "cache_strategy": cache_strategy.value
                }
                
                logger.info(f"[{request_id}] Request completed successfully - {processing_time:.0f}ms, {total_tokens} tokens, ${cost:.4f}")
                
                return result
                
            except Exception as e:
                logger.error(f"[{request_id}] Request failed: {e}", exc_info=True)
                
                # Track error metrics
                error_metrics = LLMRequestMetrics(
                    request_id=request_id,
                    timestamp=datetime.now(timezone.utc),
                    model=OPENAI_CHAT_MODEL,
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0,
                    latency_ms=(time.time() - start_time) * 1000,
                    cost_usd=0.0,
                    success=False,
                    error_type=type(e).__name__,
                    intent_type=getattr(tracker, 'intent_type', None),
                    language="en"
                )
                
                self.metrics.track_request(error_metrics)
                
                # Return fallback response
                return self._get_fallback_response(user_text, conversation_id, str(e))
    
    def _check_cache(self, user_text: str, conversation_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Check if response is available in cache"""
        try:
            # Get language from previous context or default
            language = self._get_language_from_context(conversation_id) or "en"
            
            cached_response = self.cache.get(user_text, conversation_id, language)
            if cached_response:
                # Add cache metadata
                cached_response["production_metadata"] = {
                    "request_id": f"cached_{uuid.uuid4().hex[:8]}",
                    "processing_time_ms": 0,
                    "tokens_used": 0,
                    "cost_usd": 0.0,
                    "cached": True,
                    "cache_strategy": "hit"
                }
                return cached_response
            
        except Exception as e:
            logger.error(f"Error checking cache: {e}")
        
        return None
    
    def _get_intent_type(self, user_text: str, conversation_id: Optional[str]) -> str:
        """Get intent type for cache strategy determination"""
        try:
            # Use a lightweight intent detection
            user_lower = user_text.lower()
            
            if any(keyword in user_lower for keyword in ["apartment", "house", "rent", "property", "bedroom"]):
                return "property_search"
            elif any(keyword in user_lower for keyword in ["contact", "agent", "photos", "pictures"]):
                return "agent_outreach"
            elif any(keyword in user_lower for keyword in ["hello", "hi", "help", "what"]):
                return "general_chat"
            else:
                return "general_chat"
        
        except Exception:
            return "general_chat"
    
    def _get_language_from_context(self, conversation_id: Optional[str]) -> Optional[str]:
        """Get language from conversation context"""
        try:
            if conversation_id:
                # Try to get language from recent messages
                from .memory import load_recent_messages
                history = load_recent_messages(conversation_id)
                if history:
                    # Get language from most recent assistant message
                    for msg in reversed(history):
                        if msg.get("role") == "assistant":
                            return msg.get("language", "en")
        
        except Exception:
            pass
        
        return None
    
    def _get_fallback_response(self, user_text: str, conversation_id: Optional[str], error: str) -> Dict[str, Any]:
        """Provide fallback response when LLM fails"""
        logger.warning(f"Using fallback response due to error: {error}")
        
        # Simple rule-based fallback
        user_lower = user_text.lower()
        
        if any(keyword in user_lower for keyword in ["apartment", "house", "rent", "property"]):
            fallback_message = "I'm having trouble processing your request right now. Please try asking about properties in a different way, or contact our support team."
        elif any(keyword in user_lower for keyword in ["contact", "agent", "photos"]):
            fallback_message = "I'm experiencing technical difficulties. Please try contacting the agent again in a few moments."
        else:
            fallback_message = "I'm sorry, I'm having trouble processing your request. Please try rephrasing your question or contact our support team."
        
        return {
            "message": fallback_message,
            "language": "en",
            "recommendations": [],
            "function_calls": [],
            "requires_phone": False,
            "conversation_id": conversation_id,
            "production_metadata": {
                "request_id": f"fallback_{uuid.uuid4().hex[:8]}",
                "processing_time_ms": 0,
                "tokens_used": 0,
                "cost_usd": 0.0,
                "cached": False,
                "cache_strategy": "fallback",
                "error": error
            }
        }
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status"""
        try:
            # Get performance metrics
            performance_stats = self.metrics.get_performance_stats()
            
            # Get cache statistics
            cache_stats = self.cache.get_cache_stats()
            
            # Check for active alerts
            active_alerts = self.alerts.get_active_alerts()
            
            # Determine overall health
            health_status = "healthy"
            if active_alerts:
                critical_alerts = [a for a in active_alerts if a.get("severity") == "critical"]
                if critical_alerts:
                    health_status = "critical"
                else:
                    health_status = "degraded"
            
            return {
                "status": health_status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "performance": performance_stats,
                "cache": cache_stats,
                "alerts": {
                    "active_count": len(active_alerts),
                    "critical_count": len([a for a in active_alerts if a.get("severity") == "critical"]),
                    "recent_alerts": active_alerts[:5]  # Last 5 alerts
                },
                "request_count": self.request_count
            }
        
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            return {
                "status": "unknown",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def run_health_checks(self) -> Dict[str, Any]:
        """Run comprehensive health checks"""
        try:
            from ..monitoring.health import HealthChecker
            health_checker = HealthChecker()
            return health_checker.run_health_checks()
        
        except Exception as e:
            logger.error(f"Error running health checks: {e}")
            return {"overall_status": "error", "error": str(e)}


# Global production agent instance
production_agent = ProductionAgent()


def process_turn_production(user_text: str, conversation_id: Optional[str]) -> Dict[str, Any]:
    """
    Production-ready entry point for LLM processing.
    Use this instead of the base process_turn for production deployments.
    """
    return production_agent.process_turn(user_text, conversation_id)


