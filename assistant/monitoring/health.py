# assistant/monitoring/health.py
"""
Health Check System for LLM Production

Based on "LLMs in Production" Chapter 8: Monitoring and Observability
"""

import logging
import time
from typing import Dict, Any, List
from datetime import datetime, timezone
from dataclasses import dataclass

from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class HealthCheck:
    """Individual health check result"""
    name: str
    status: str  # "healthy", "degraded", "unhealthy"
    message: str
    response_time_ms: float
    timestamp: datetime
    details: Dict[str, Any] = None


class HealthChecker:
    """Comprehensive health checking for LLM production system"""
    
    def __init__(self):
        self.health_key = "llm_health_status"
        self.health_history_key = "llm_health_history"
    
    def run_health_checks(self) -> Dict[str, Any]:
        """Run all health checks and return overall status"""
        checks = []
        
        # Check OpenAI API connectivity
        checks.append(self._check_openai_api())
        
        # Check Redis connectivity
        checks.append(self._check_redis())
        
        # Check database connectivity
        checks.append(self._check_database())
        
        # Check Twilio connectivity
        checks.append(self._check_twilio())
        
        # Check recent performance
        checks.append(self._check_recent_performance())
        
        # Check error rates
        checks.append(self._check_error_rates())
        
        # Determine overall health
        overall_status = self._determine_overall_health(checks)
        
        health_status = {
            "overall_status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": [check.__dict__ for check in checks],
            "summary": self._generate_summary(checks)
        }
        
        # Store health status
        self._store_health_status(health_status)
        
        return health_status
    
    def _check_openai_api(self) -> HealthCheck:
        """Check OpenAI API connectivity and response time"""
        start_time = time.time()
        
        try:
            from ..brain.llm import get_chat_model
            
            # Try to create a model instance
            model = get_chat_model()
            
            # Test with a simple request
            test_prompt = "Respond with exactly: 'health_check_ok'"
            response = model.invoke([{"role": "user", "content": test_prompt}])
            
            response_time = (time.time() - start_time) * 1000
            
            if "health_check_ok" in str(response.content):
                return HealthCheck(
                    name="openai_api",
                    status="healthy",
                    message="OpenAI API responding correctly",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"model": str(model), "response_length": len(str(response.content))}
                )
            else:
                return HealthCheck(
                    name="openai_api",
                    status="degraded",
                    message="OpenAI API responding but with unexpected content",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"expected": "health_check_ok", "received": str(response.content)[:100]}
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="openai_api",
                status="unhealthy",
                message=f"OpenAI API check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _check_redis(self) -> HealthCheck:
        """Check Redis connectivity"""
        start_time = time.time()
        
        try:
            # Test Redis connection
            test_key = "health_check_redis"
            test_value = f"test_{int(time.time())}"
            
            cache.set(test_key, test_value, timeout=60)
            retrieved_value = cache.get(test_key)
            
            response_time = (time.time() - start_time) * 1000
            
            if retrieved_value == test_value:
                cache.delete(test_key)  # Clean up
                return HealthCheck(
                    name="redis",
                    status="healthy",
                    message="Redis cache working correctly",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"test_key": test_key}
                )
            else:
                return HealthCheck(
                    name="redis",
                    status="degraded",
                    message="Redis cache responding but data integrity issue",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"expected": test_value, "received": retrieved_value}
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="redis",
                status="unhealthy",
                message=f"Redis check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _check_database(self) -> HealthCheck:
        """Check database connectivity"""
        start_time = time.time()
        
        try:
            from django.db import connection
            
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            
            response_time = (time.time() - start_time) * 1000
            
            if result and result[0] == 1:
                return HealthCheck(
                    name="database",
                    status="healthy",
                    message="Database connection working",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"query_result": result[0]}
                )
            else:
                return HealthCheck(
                    name="database",
                    status="degraded",
                    message="Database responding but unexpected result",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"result": result}
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="database",
                status="unhealthy",
                message=f"Database check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _check_twilio(self) -> HealthCheck:
        """Check Twilio connectivity"""
        start_time = time.time()
        
        try:
            from ..twilio_client import TwilioWhatsAppClient
            
            # Test Twilio client initialization
            client = TwilioWhatsAppClient()
            
            response_time = (time.time() - start_time) * 1000
            
            # Check if credentials are configured
            if hasattr(client, 'account_sid') and client.account_sid:
                return HealthCheck(
                    name="twilio",
                    status="healthy",
                    message="Twilio client configured and ready",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"account_sid": client.account_sid[:10] + "..."}
                )
            else:
                return HealthCheck(
                    name="twilio",
                    status="degraded",
                    message="Twilio client not fully configured",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"status": "credentials_missing"}
                )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="twilio",
                status="unhealthy",
                message=f"Twilio check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _check_recent_performance(self) -> HealthCheck:
        """Check recent LLM performance metrics"""
        start_time = time.time()
        
        try:
            # Get recent performance stats
            stats_key = "llm_metrics:performance_stats:rolling"
            stats = cache.get(stats_key, {})
            
            response_time = (time.time() - start_time) * 1000
            
            total_requests = stats.get("total_requests", 0)
            avg_latency = stats.get("avg_latency_ms", 0)
            success_rate = stats.get("success_rate", 1.0)
            
            if total_requests == 0:
                return HealthCheck(
                    name="recent_performance",
                    status="degraded",
                    message="No recent performance data available",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"total_requests": 0}
                )
            
            # Check if performance is within acceptable ranges
            if success_rate < 0.9:  # Less than 90% success rate
                status = "unhealthy"
                message = f"Low success rate: {success_rate:.2%}"
            elif avg_latency > 10000:  # More than 10 seconds
                status = "degraded"
                message = f"High latency: {avg_latency:.0f}ms"
            else:
                status = "healthy"
                message = f"Performance within normal ranges"
            
            return HealthCheck(
                name="recent_performance",
                status=status,
                message=message,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={
                    "total_requests": total_requests,
                    "avg_latency_ms": avg_latency,
                    "success_rate": success_rate
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="recent_performance",
                status="unhealthy",
                message=f"Performance check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _check_error_rates(self) -> HealthCheck:
        """Check recent error rates"""
        start_time = time.time()
        
        try:
            # Get recent error data
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            daily_key = f"llm_metrics:daily_cost:{today}"
            daily_data = cache.get(daily_key, {})
            
            response_time = (time.time() - start_time) * 1000
            
            total_requests = daily_data.get("total_requests", 0)
            failed_requests = daily_data.get("failed_requests", 0)
            
            if total_requests == 0:
                return HealthCheck(
                    name="error_rates",
                    status="healthy",
                    message="No requests today to check error rates",
                    response_time_ms=response_time,
                    timestamp=datetime.now(timezone.utc),
                    details={"total_requests": 0}
                )
            
            error_rate = failed_requests / total_requests
            
            if error_rate > 0.1:  # More than 10% error rate
                status = "unhealthy"
                message = f"High error rate: {error_rate:.2%}"
            elif error_rate > 0.05:  # More than 5% error rate
                status = "degraded"
                message = f"Elevated error rate: {error_rate:.2%}"
            else:
                status = "healthy"
                message = f"Error rate within normal range: {error_rate:.2%}"
            
            return HealthCheck(
                name="error_rates",
                status=status,
                message=message,
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={
                    "total_requests": total_requests,
                    "failed_requests": failed_requests,
                    "error_rate": error_rate
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheck(
                name="error_rates",
                status="unhealthy",
                message=f"Error rate check failed: {str(e)}",
                response_time_ms=response_time,
                timestamp=datetime.now(timezone.utc),
                details={"error": str(e)}
            )
    
    def _determine_overall_health(self, checks: List[HealthCheck]) -> str:
        """Determine overall system health based on individual checks"""
        if any(check.status == "unhealthy" for check in checks):
            return "unhealthy"
        elif any(check.status == "degraded" for check in checks):
            return "degraded"
        else:
            return "healthy"
    
    def _generate_summary(self, checks: List[HealthCheck]) -> Dict[str, Any]:
        """Generate a summary of health check results"""
        healthy_count = sum(1 for check in checks if check.status == "healthy")
        degraded_count = sum(1 for check in checks if check.status == "degraded")
        unhealthy_count = sum(1 for check in checks if check.status == "unhealthy")
        
        return {
            "total_checks": len(checks),
            "healthy": healthy_count,
            "degraded": degraded_count,
            "unhealthy": unhealthy_count,
            "health_percentage": (healthy_count / len(checks)) * 100 if checks else 0
        }
    
    def _store_health_status(self, health_status: Dict[str, Any]) -> None:
        """Store health status in cache"""
        try:
            # Store current status
            cache.set(self.health_key, health_status, timeout=3600)  # 1 hour
            
            # Add to history
            history_key = f"{self.health_history_key}:recent"
            history = cache.get(history_key, [])
            history.append(health_status)
            
            # Keep only last 24 health checks (24 hours if run hourly)
            if len(history) > 24:
                history = history[-24:]
            
            cache.set(history_key, history, timeout=86400 * 7)  # Keep for 7 days
            
        except Exception as e:
            logger.error(f"Failed to store health status: {e}")
    
    def get_current_health(self) -> Dict[str, Any]:
        """Get current health status"""
        return cache.get(self.health_key, {"overall_status": "unknown"})
    
    def get_health_history(self) -> List[Dict[str, Any]]:
        """Get health check history"""
        history_key = f"{self.health_history_key}:recent"
        return cache.get(history_key, [])

