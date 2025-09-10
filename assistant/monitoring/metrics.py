# assistant/monitoring/metrics.py
"""
LLM Performance Metrics and Cost Tracking

Based on "LLMs in Production" Chapter 8: Monitoring and Observability
"""

import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json

from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class LLMRequestMetrics:
    """Track individual LLM request metrics"""
    request_id: str
    timestamp: datetime
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    cost_usd: float
    success: bool
    error_type: Optional[str] = None
    intent_type: Optional[str] = None
    language: Optional[str] = None


class LLMMetrics:
    """Production-ready LLM metrics tracking"""
    
    def __init__(self):
        self.cache_key_prefix = "llm_metrics"
        self.daily_cost_key = "daily_cost"
        self.performance_key = "performance_stats"
    
    def track_request(self, metrics: LLMRequestMetrics) -> None:
        """Track a single LLM request"""
        try:
            # Store individual request
            cache_key = f"{self.cache_key_prefix}:{metrics.request_id}"
            cache.set(cache_key, asdict(metrics), timeout=86400)  # 24 hours
            
            # Update daily aggregates
            self._update_daily_metrics(metrics)
            
            # Update performance stats
            self._update_performance_stats(metrics)
            
            logger.info(f"LLM metrics tracked: {metrics.request_id} - {metrics.latency_ms}ms - ${metrics.cost_usd:.4f}")
            
        except Exception as e:
            logger.error(f"Failed to track LLM metrics: {e}")
    
    def _update_daily_metrics(self, metrics: LLMRequestMetrics) -> None:
        """Update daily cost and usage aggregates"""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        daily_key = f"{self.daily_cost_key}:{today}"
        
        # Get existing daily data
        daily_data = cache.get(daily_key, {
            "date": today,
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_latency": 0.0,
            "models_used": {}
        })
        
        # Update aggregates
        daily_data["total_requests"] += 1
        daily_data["total_tokens"] += metrics.total_tokens
        daily_data["total_cost"] += metrics.cost_usd
        daily_data["avg_latency"] = (
            (daily_data["avg_latency"] * (daily_data["total_requests"] - 1) + metrics.latency_ms) 
            / daily_data["total_requests"]
        )
        
        if metrics.success:
            daily_data["successful_requests"] += 1
        else:
            daily_data["failed_requests"] += 1
        
        # Track model usage
        if metrics.model not in daily_data["models_used"]:
            daily_data["models_used"][metrics.model] = 0
        daily_data["models_used"][metrics.model] += 1
        
        # Store updated data
        cache.set(daily_key, daily_data, timeout=86400 * 7)  # Keep for 7 days
    
    def _update_performance_stats(self, metrics: LLMRequestMetrics) -> None:
        """Update rolling performance statistics"""
        stats_key = f"{self.performance_key}:rolling"
        
        # Get existing stats
        stats = cache.get(stats_key, {
            "total_requests": 0,
            "avg_latency_ms": 0.0,
            "success_rate": 0.0,
            "cost_per_request": 0.0,
            "tokens_per_request": 0.0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        })
        
        # Update rolling averages (simple moving average)
        total = stats["total_requests"]
        stats["total_requests"] = total + 1
        
        # Update averages
        stats["avg_latency_ms"] = (
            (stats["avg_latency_ms"] * total + metrics.latency_ms) / (total + 1)
        )
        stats["cost_per_request"] = (
            (stats["cost_per_request"] * total + metrics.cost_usd) / (total + 1)
        )
        stats["tokens_per_request"] = (
            (stats["tokens_per_request"] * total + metrics.total_tokens) / (total + 1)
        )
        
        # Update success rate
        if metrics.success:
            successful = stats.get("successful_requests", 0) + 1
        else:
            successful = stats.get("successful_requests", 0)
        
        stats["successful_requests"] = successful
        stats["success_rate"] = successful / (total + 1)
        stats["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        # Store updated stats
        cache.set(stats_key, stats, timeout=3600)  # 1 hour rolling window
    
    def get_daily_metrics(self, date: Optional[str] = None) -> Dict[str, Any]:
        """Get daily metrics for a specific date"""
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        daily_key = f"{self.daily_cost_key}:{date}"
        return cache.get(daily_key, {})
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        stats_key = f"{self.performance_key}:rolling"
        return cache.get(stats_key, {})
    
    def get_cost_estimate(self, prompt_tokens: int, completion_tokens: int, model: str = "gpt-4o-mini") -> float:
        """Estimate cost for a request based on current pricing"""
        # OpenAI pricing (as of 2024, update as needed)
        pricing = {
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},  # per 1K tokens
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4": {"input": 0.03, "output": 0.06},
        }
        
        model_pricing = pricing.get(model, pricing["gpt-4o-mini"])
        
        input_cost = (prompt_tokens / 1000) * model_pricing["input"]
        output_cost = (completion_tokens / 1000) * model_pricing["output"]
        
        return input_cost + output_cost


class PerformanceTracker:
    """Context manager for tracking LLM request performance"""
    
    def __init__(self, request_id: str, model: str = "gpt-4o-mini", intent_type: str = None, language: str = None):
        self.request_id = request_id
        self.model = model
        self.intent_type = intent_type
        self.language = language
        self.start_time = None
        self.metrics = LLMMetrics()
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            latency_ms = (time.time() - self.start_time) * 1000
            
            # Create metrics object
            metrics = LLMMetrics()
            cost = metrics.get_cost_estimate(0, 0, self.model)  # Will be updated with actual tokens
            
            request_metrics = LLMRequestMetrics(
                request_id=self.request_id,
                timestamp=datetime.now(timezone.utc),
                model=self.model,
                prompt_tokens=0,  # Will be updated by the calling code
                completion_tokens=0,  # Will be updated by the calling code
                total_tokens=0,  # Will be updated by the calling code
                latency_ms=latency_ms,
                cost_usd=cost,
                success=exc_type is None,
                error_type=str(exc_type) if exc_type else None,
                intent_type=self.intent_type,
                language=self.language
            )
            
            # Track the metrics
            self.metrics.track_request(request_metrics)
    
    def update_tokens(self, prompt_tokens: int, completion_tokens: int):
        """Update token counts and recalculate cost"""
        # This would be called after getting the response
        pass


