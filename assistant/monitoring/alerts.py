# assistant/monitoring/alerts.py
"""
Alert Management for LLM Production Issues

Based on "LLMs in Production" Chapter 8: Monitoring and Observability
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass

from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


@dataclass
class Alert:
    """Alert definition"""
    id: str
    type: str  # "error_rate", "latency", "cost", "quality"
    severity: str  # "low", "medium", "high", "critical"
    message: str
    threshold: float
    current_value: float
    timestamp: datetime
    resolved: bool = False


class AlertManager:
    """Production alert management for LLM system"""
    
    def __init__(self):
        self.alert_key_prefix = "llm_alerts"
        self.alert_history_key = "alert_history"
        
        # Alert thresholds (configurable via environment)
        self.thresholds = {
            "error_rate": float(getattr(settings, 'LLM_ERROR_RATE_THRESHOLD', 0.05)),  # 5%
            "latency_ms": float(getattr(settings, 'LLM_LATENCY_THRESHOLD', 5000)),  # 5 seconds
            "daily_cost": float(getattr(settings, 'LLM_DAILY_COST_THRESHOLD', 50.0)),  # $50
            "success_rate": float(getattr(settings, 'LLM_SUCCESS_RATE_THRESHOLD', 0.95)),  # 95%
        }
    
    def check_alerts(self) -> List[Alert]:
        """Check all alert conditions and return active alerts"""
        alerts = []
        
        # Check error rate
        error_rate_alert = self._check_error_rate()
        if error_rate_alert:
            alerts.append(error_rate_alert)
        
        # Check latency
        latency_alert = self._check_latency()
        if latency_alert:
            alerts.append(latency_alert)
        
        # Check daily cost
        cost_alert = self._check_daily_cost()
        if cost_alert:
            alerts.append(cost_alert)
        
        # Check success rate
        success_rate_alert = self._check_success_rate()
        if success_rate_alert:
            alerts.append(success_rate_alert)
        
        # Store alerts
        for alert in alerts:
            self._store_alert(alert)
        
        return alerts
    
    def _check_error_rate(self) -> Optional[Alert]:
        """Check if error rate exceeds threshold"""
        try:
            # Get recent performance stats
            stats_key = "llm_metrics:performance_stats:rolling"
            stats = cache.get(stats_key, {})
            
            total_requests = stats.get("total_requests", 0)
            successful_requests = stats.get("successful_requests", 0)
            
            if total_requests < 10:  # Need minimum sample size
                return None
            
            error_rate = 1.0 - (successful_requests / total_requests)
            threshold = self.thresholds["error_rate"]
            
            if error_rate > threshold:
                return Alert(
                    id=f"error_rate_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    type="error_rate",
                    severity="high" if error_rate > threshold * 2 else "medium",
                    message=f"LLM error rate is {error_rate:.2%}, exceeding threshold of {threshold:.2%}",
                    threshold=threshold,
                    current_value=error_rate,
                    timestamp=datetime.now(timezone.utc)
                )
        
        except Exception as e:
            logger.error(f"Error checking error rate: {e}")
        
        return None
    
    def _check_latency(self) -> Optional[Alert]:
        """Check if average latency exceeds threshold"""
        try:
            stats_key = "llm_metrics:performance_stats:rolling"
            stats = cache.get(stats_key, {})
            
            avg_latency = stats.get("avg_latency_ms", 0)
            threshold = self.thresholds["latency_ms"]
            
            if avg_latency > threshold:
                return Alert(
                    id=f"latency_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    type="latency",
                    severity="high" if avg_latency > threshold * 2 else "medium",
                    message=f"LLM average latency is {avg_latency:.0f}ms, exceeding threshold of {threshold:.0f}ms",
                    threshold=threshold,
                    current_value=avg_latency,
                    timestamp=datetime.now(timezone.utc)
                )
        
        except Exception as e:
            logger.error(f"Error checking latency: {e}")
        
        return None
    
    def _check_daily_cost(self) -> Optional[Alert]:
        """Check if daily cost exceeds threshold"""
        try:
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            daily_key = f"llm_metrics:daily_cost:{today}"
            daily_data = cache.get(daily_key, {})
            
            total_cost = daily_data.get("total_cost", 0.0)
            threshold = self.thresholds["daily_cost"]
            
            if total_cost > threshold:
                return Alert(
                    id=f"cost_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    type="cost",
                    severity="high" if total_cost > threshold * 2 else "medium",
                    message=f"Daily LLM cost is ${total_cost:.2f}, exceeding threshold of ${threshold:.2f}",
                    threshold=threshold,
                    current_value=total_cost,
                    timestamp=datetime.now(timezone.utc)
                )
        
        except Exception as e:
            logger.error(f"Error checking daily cost: {e}")
        
        return None
    
    def _check_success_rate(self) -> Optional[Alert]:
        """Check if success rate falls below threshold"""
        try:
            stats_key = "llm_metrics:performance_stats:rolling"
            stats = cache.get(stats_key, {})
            
            success_rate = stats.get("success_rate", 1.0)
            threshold = self.thresholds["success_rate"]
            
            if success_rate < threshold:
                return Alert(
                    id=f"success_rate_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    type="success_rate",
                    severity="critical" if success_rate < 0.8 else "high",
                    message=f"LLM success rate is {success_rate:.2%}, below threshold of {threshold:.2%}",
                    threshold=threshold,
                    current_value=success_rate,
                    timestamp=datetime.now(timezone.utc)
                )
        
        except Exception as e:
            logger.error(f"Error checking success rate: {e}")
        
        return None
    
    def _store_alert(self, alert: Alert) -> None:
        """Store alert in cache"""
        try:
            alert_key = f"{self.alert_key_prefix}:{alert.id}"
            cache.set(alert_key, alert.__dict__, timeout=86400 * 7)  # Keep for 7 days
            
            # Add to alert history
            history_key = f"{self.alert_history_key}:recent"
            history = cache.get(history_key, [])
            history.append(alert.__dict__)
            
            # Keep only last 100 alerts
            if len(history) > 100:
                history = history[-100:]
            
            cache.set(history_key, history, timeout=86400 * 7)
            
            # Log the alert
            logger.warning(f"LLM Alert [{alert.severity.upper()}]: {alert.message}")
            
        except Exception as e:
            logger.error(f"Failed to store alert: {e}")
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active (unresolved) alerts"""
        try:
            history_key = f"{self.alert_history_key}:recent"
            history = cache.get(history_key, [])
            
            # Filter unresolved alerts from last 24 hours
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            active_alerts = []
            
            for alert_data in history:
                alert_time = datetime.fromisoformat(alert_data["timestamp"].replace('Z', '+00:00'))
                if alert_time > cutoff and not alert_data.get("resolved", False):
                    active_alerts.append(alert_data)
            
            return active_alerts
        
        except Exception as e:
            logger.error(f"Error getting active alerts: {e}")
            return []
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved"""
        try:
            alert_key = f"{self.alert_key_prefix}:{alert_id}"
            alert_data = cache.get(alert_key)
            
            if alert_data:
                alert_data["resolved"] = True
                cache.set(alert_key, alert_data, timeout=86400 * 7)
                
                # Update in history
                history_key = f"{self.alert_history_key}:recent"
                history = cache.get(history_key, [])
                
                for i, hist_alert in enumerate(history):
                    if hist_alert.get("id") == alert_id:
                        history[i]["resolved"] = True
                        break
                
                cache.set(history_key, history, timeout=86400 * 7)
                logger.info(f"Alert {alert_id} marked as resolved")
                return True
        
        except Exception as e:
            logger.error(f"Error resolving alert {alert_id}: {e}")
        
        return False



