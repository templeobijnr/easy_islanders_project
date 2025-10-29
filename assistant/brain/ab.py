"""
A/B Testing utilities for router calibration and governance.

Provides utilities for comparing different router configurations,
calibration models, and governance thresholds in production.
"""

from __future__ import annotations

import hashlib
import random
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime, timezone

from django.core.cache import cache
from django.conf import settings

from router_service.models import RouterEvent


@dataclass
class ABTestVariant:
    """Represents a variant in an A/B test."""
    name: str
    weight: float
    config: Dict[str, Any]

    def __post_init__(self):
        if not 0 <= self.weight <= 1:
            raise ValueError("Weight must be between 0 and 1")


class ABTest:
    """Manages A/B testing for router components."""

    def __init__(self, test_name: str, variants: List[ABTestVariant]):
        self.test_name = test_name
        self.variants = variants

        # Validate weights sum to 1
        total_weight = sum(v.weight for v in variants)
        if not 0.99 <= total_weight <= 1.01:  # Allow small floating point errors
            raise ValueError(f"Variant weights must sum to 1, got {total_weight}")

        # Create cumulative weights for selection
        self.cumulative_weights = []
        cumulative = 0.0
        for variant in variants:
            cumulative += variant.weight
            self.cumulative_weights.append(cumulative)

    def get_variant(self, user_id: str) -> ABTestVariant:
        """Get the variant for a user using consistent hashing."""
        # Create a hash of user_id + test_name for consistency
        hash_input = f"{self.test_name}:{user_id}".encode('utf-8')
        hash_value = int(hashlib.sha256(hash_input).hexdigest()[:8], 16) / 2**32

        # Find the variant using cumulative weights
        for i, cumulative_weight in enumerate(self.cumulative_weights):
            if hash_value <= cumulative_weight:
                return self.variants[i]

        # Fallback (should not happen with proper weights)
        return self.variants[0]


class RouterABTester:
    """A/B testing framework specifically for router components."""

    def __init__(self):
        self.active_tests: Dict[str, ABTest] = {}
        self.cache_timeout = 3600  # 1 hour

    def register_test(self, test_name: str, test: ABTest) -> None:
        """Register a new A/B test."""
        self.active_tests[test_name] = test

    def get_router_config(self, user_id: str, test_name: str = "router_calibration") -> Dict[str, Any]:
        """Get router configuration for a user based on A/B test assignment."""
        if test_name not in self.active_tests:
            return {}  # Return default config

        variant = self.active_tests[test_name].get_variant(user_id)
        return variant.config

    def log_test_event(self, user_id: str, test_name: str, event_type: str, metadata: Dict[str, Any] = None) -> None:
        """Log an event for A/B testing analysis."""
        if test_name not in self.active_tests:
            return

        variant = self.active_tests[test_name].get_variant(user_id)

        # Create a test event record
        event_key = f"ab_test:{test_name}:{user_id}:{event_type}:{datetime.now(timezone.utc).isoformat()}"
        event_data = {
            "user_id": user_id,
            "test_name": test_name,
            "variant": variant.name,
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        }

        # Store in cache for later analysis
        cache.set(event_key, event_data, timeout=self.cache_timeout * 24)  # Keep for 24 hours

    def get_test_results(self, test_name: str) -> Dict[str, Any]:
        """Get aggregated results for an A/B test."""
        if test_name not in self.active_tests:
            return {"error": "Test not found"}

        # This is a simplified implementation
        # In production, you'd aggregate from a proper analytics database
        results = {
            "test_name": test_name,
            "variants": [v.name for v in self.active_tests[test_name].variants],
            "status": "running",
            "note": "Real implementation would aggregate metrics from analytics database"
        }

        return results


# Global A/B tester instance
router_ab_tester = RouterABTester()

# Pre-configured A/B tests
def setup_default_ab_tests():
    """Set up default A/B tests for router components."""

    # Test different confidence thresholds
    threshold_test = ABTest("router_thresholds", [
        ABTestVariant("conservative", 0.5, {"tau_default": 0.75, "tau_min": 0.65}),
        ABTestVariant("aggressive", 0.5, {"tau_default": 0.65, "tau_min": 0.55}),
    ])

    # Test different fusion weights
    fusion_test = ABTest("router_fusion", [
        ABTestVariant("embed_heavy", 0.33, {"fusion_weights": {"embed_score": 0.2, "clf_prob": 0.6, "rule_vote": 0.2}}),
        ABTestVariant("clf_heavy", 0.33, {"fusion_weights": {"embed_score": 0.1, "clf_prob": 0.8, "rule_vote": 0.1}}),
        ABTestVariant("balanced", 0.34, {"fusion_weights": {"embed_score": 0.15, "clf_prob": 0.7, "rule_vote": 0.15}}),
    ])

    router_ab_tester.register_test("router_thresholds", threshold_test)
    router_ab_tester.register_test("router_fusion", fusion_test)


# Initialize default tests on import
setup_default_ab_tests()


def get_user_router_config(user_id: str) -> Dict[str, Any]:
    """Get personalized router configuration for a user based on active A/B tests."""
    config = {}

    # Get configurations from all active tests
    for test_name in router_ab_tester.active_tests.keys():
        test_config = router_ab_tester.get_router_config(user_id, test_name)
        config.update(test_config)

    return config


def log_router_decision(user_id: str, decision: Dict[str, Any]) -> None:
    """Log router decision for A/B testing analysis."""
    metadata = {
        "domain": decision.get("domain_choice", {}).get("domain"),
        "confidence": decision.get("domain_choice", {}).get("calibrated", 0.0),
        "action": decision.get("action"),
        "latency_ms": decision.get("latency_ms", 0),
    }

    router_ab_tester.log_test_event(user_id, "router_decision", "routing", metadata)


def log_router_feedback(user_id: str, feedback: Dict[str, Any]) -> None:
    """Log user feedback on router decisions for A/B testing."""
    router_ab_tester.log_test_event(user_id, "router_feedback", "feedback", feedback)