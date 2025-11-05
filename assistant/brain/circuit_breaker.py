"""
Circuit Breaker for Backend Service Calls

Prevents cascading failures by opening circuit after N consecutive failures.
Auto-closes after cooldown period.
"""

import time
import logging
from typing import Callable, Any, Optional
from dataclasses import dataclass
import threading

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration."""
    failure_threshold: int = 5  # Open after N consecutive failures
    cooldown_seconds: float = 60.0  # Auto-close after N seconds
    timeout_ms: float = 800.0  # Request timeout in milliseconds


class CircuitBreaker:
    """
    Circuit breaker implementation.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Circuit open, requests fail fast
    - HALF_OPEN: Testing if service recovered

    Transitions:
    - CLOSED → OPEN: After failure_threshold consecutive failures
    - OPEN → HALF_OPEN: After cooldown_seconds
    - HALF_OPEN → CLOSED: After successful request
    - HALF_OPEN → OPEN: After failure
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED"  # CLOSED | OPEN | HALF_OPEN
        self.lock = threading.Lock()

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to call
            *args, **kwargs: Function arguments

        Returns:
            Function result if successful

        Raises:
            CircuitBreakerOpen: If circuit is open
            Exception: Original exception if function fails
        """
        with self.lock:
            # Check if circuit should transition from OPEN to HALF_OPEN
            if self.state == "OPEN":
                if time.time() - self.last_failure_time >= self.config.cooldown_seconds:
                    logger.info(
                        f"[CircuitBreaker:{self.name}] Transitioning OPEN → HALF_OPEN (cooldown elapsed)"
                    )
                    self.state = "HALF_OPEN"
                else:
                    # Still in cooldown, fail fast
                    raise CircuitBreakerOpen(
                        f"Circuit breaker '{self.name}' is OPEN "
                        f"(cooling down for {self.config.cooldown_seconds}s)"
                    )

        # Execute function
        try:
            result = func(*args, **kwargs)

            # Success - reset failure count and close circuit
            with self.lock:
                if self.state == "HALF_OPEN":
                    logger.info(
                        f"[CircuitBreaker:{self.name}] Transitioning HALF_OPEN → CLOSED (success)"
                    )
                    self.state = "CLOSED"
                self.failure_count = 0

            return result

        except Exception as e:
            # Failure - increment count and potentially open circuit
            with self.lock:
                self.failure_count += 1
                self.last_failure_time = time.time()

                if self.state == "HALF_OPEN":
                    # Failure during testing - reopen circuit
                    logger.warning(
                        f"[CircuitBreaker:{self.name}] Transitioning HALF_OPEN → OPEN (failure during test)"
                    )
                    self.state = "OPEN"
                elif self.failure_count >= self.config.failure_threshold:
                    # Threshold exceeded - open circuit
                    logger.error(
                        f"[CircuitBreaker:{self.name}] Transitioning CLOSED → OPEN "
                        f"({self.failure_count} consecutive failures)"
                    )
                    self.state = "OPEN"

                logger.warning(
                    f"[CircuitBreaker:{self.name}] Failure {self.failure_count}/{self.config.failure_threshold}, "
                    f"state={self.state}, error={e}"
                )

            # Re-raise original exception
            raise

    def is_open(self) -> bool:
        """Check if circuit is currently open."""
        with self.lock:
            return self.state == "OPEN"

    def get_state(self) -> str:
        """Get current circuit state."""
        with self.lock:
            return self.state

    def reset(self):
        """Manually reset circuit breaker (for testing)."""
        with self.lock:
            self.state = "CLOSED"
            self.failure_count = 0
            self.last_failure_time = 0.0
            logger.info(f"[CircuitBreaker:{self.name}] Manually reset")


class CircuitBreakerOpen(Exception):
    """Exception raised when circuit breaker is open."""
    pass


# ============================================================================
# GLOBAL CIRCUIT BREAKERS
# ============================================================================

# Backend search circuit breaker
_backend_search_breaker = None


def get_backend_search_breaker(config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
    """Get or create backend search circuit breaker."""
    global _backend_search_breaker
    if _backend_search_breaker is None:
        _backend_search_breaker = CircuitBreaker("backend_search", config)
    return _backend_search_breaker


def reset_all_breakers():
    """Reset all circuit breakers (for testing)."""
    global _backend_search_breaker
    if _backend_search_breaker:
        _backend_search_breaker.reset()
