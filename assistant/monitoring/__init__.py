# assistant/monitoring/__init__.py
"""
Production monitoring and observability for Easy Islanders LLM Agent.

Based on "LLMs in Production" best practices:
- Performance metrics tracking
- Error monitoring and alerting
- Cost optimization
- Response quality assessment
"""

from .metrics import LLMMetrics, PerformanceTracker, record_turn_summary
from .alerts import AlertManager
from .health import HealthChecker

__all__ = [
    "LLMMetrics",
    "PerformanceTracker", 
    "record_turn_summary",
    "AlertManager",
    "HealthChecker"
]





