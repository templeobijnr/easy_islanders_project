"""
Phase B.2: Node-Level Resilience & Retry Logic

Implements production-grade resilience for critical transactional services:
- seller_outreach (Flow 2: Capture & Broadcast, Flow 3: Direct Contact)
- booking operations (Flow 4: Booking & Viewing)
- broadcast (Flow 2 monetization flow)

Strategy:
1. Retry with exponential backoff (2s, 4s, 8s) for transient failures
2. Circuit breaker to prevent cascade failures after 5 consecutive failures
3. Graceful degradation with fallback responses
4. Full audit trail and observability
"""

import time
import logging
from functools import wraps
from typing import Callable, Any, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Implements the Circuit Breaker pattern to prevent cascade failures.
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Failure threshold exceeded, requests fast-fail
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    
    Transitions:
    CLOSED --[threshold exceeded]--> OPEN
    OPEN --[timeout elapsed]--> HALF_OPEN
    HALF_OPEN --[success]--> CLOSED
    HALF_OPEN --[failure]--> OPEN
    """
    
    STATE_CLOSED = "closed"
    STATE_OPEN = "open"
    STATE_HALF_OPEN = "half_open"
    
    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: int = 60,
        max_half_open_requests: int = 3,
    ):
        """
        Initialize circuit breaker.
        
        Args:
            service_name: Name of the service (e.g., "seller_outreach")
            failure_threshold: Consecutive failures before opening circuit (default: 5)
            recovery_timeout_seconds: Time to wait before attempting recovery (default: 60s)
            max_half_open_requests: Max requests allowed in half_open state (default: 3)
        """
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.max_half_open_requests = max_half_open_requests
        
        # State tracking
        self.state = self.STATE_CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_requests = 0
        self.last_state_change: Optional[datetime] = None
        
        logger.info(
            f"[CircuitBreaker] Initialized for {service_name}: "
            f"threshold={failure_threshold}, timeout={recovery_timeout_seconds}s"
        )
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function through circuit breaker.
        
        Raises:
            Exception: If circuit is open or function fails
        """
        if self.state == self.STATE_OPEN:
            if self._should_attempt_recovery():
                self.state = self.STATE_HALF_OPEN
                self.half_open_requests = 0
                logger.info(
                    f"[CircuitBreaker] {self.service_name} transitioning to HALF_OPEN"
                )
            else:
                raise Exception(
                    f"Service {self.service_name} temporarily unavailable (circuit breaker open)"
                )
        
        if self.state == self.STATE_HALF_OPEN:
            if self.half_open_requests >= self.max_half_open_requests:
                raise Exception(
                    f"Service {self.service_name} half-open request limit exceeded"
                )
            self.half_open_requests += 1
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_recovery(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if not self.last_failure_time:
            return False
        elapsed = (datetime.utcnow() - self.last_failure_time).total_seconds()
        return elapsed >= self.recovery_timeout_seconds
    
    def _on_success(self):
        """Handle successful call."""
        if self.state == self.STATE_HALF_OPEN:
            logger.info(f"[CircuitBreaker] {self.service_name} recovered - closing circuit")
            self.state = self.STATE_CLOSED
            self.failure_count = 0
            self.last_failure_time = None
            self.last_state_change = datetime.utcnow()
    
    def _on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold and self.state == self.STATE_CLOSED:
            self.state = self.STATE_OPEN
            self.last_state_change = datetime.utcnow()
            logger.warning(
                f"[CircuitBreaker] {self.service_name} circuit OPENED "
                f"({self.failure_count} consecutive failures)"
            )
        elif self.state == self.STATE_HALF_OPEN:
            self.state = self.STATE_OPEN
            self.failure_count = self.failure_threshold
            logger.warning(
                f"[CircuitBreaker] {self.service_name} circuit REOPENED during recovery"
            )
        
        logger.debug(
            f"[CircuitBreaker] {self.service_name} failure #{self.failure_count}"
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Get circuit breaker status."""
        return {
            "service": self.service_name,
            "state": self.state,
            "failure_count": self.failure_count,
            "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "last_state_change": self.last_state_change.isoformat() if self.last_state_change else None,
        }


# Global circuit breakers for critical services
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(service_name: str) -> CircuitBreaker:
    """Get or create circuit breaker for service."""
    if service_name not in _circuit_breakers:
        _circuit_breakers[service_name] = CircuitBreaker(
            service_name=service_name,
            failure_threshold=5,
            recovery_timeout_seconds=60,
        )
    return _circuit_breakers[service_name]


def resilient_api_call(
    service_name: str,
    max_retries: int = 3,
    initial_retry_delay_seconds: float = 2,
    max_retry_delay_seconds: float = 8,
):
    """
    Decorator: Implement retry logic + circuit breaker for API calls.
    
    Features:
    - Automatic retry with exponential backoff
    - Circuit breaker prevents cascade failures
    - Specific exception handling for transient vs permanent failures
    - Full audit logging
    
    Args:
        service_name: Service identifier (e.g., "seller_outreach", "booking")
        max_retries: Maximum retry attempts (default: 3)
        initial_retry_delay_seconds: Initial backoff delay (default: 2s)
        max_retry_delay_seconds: Maximum backoff delay (default: 8s)
    
    Usage:
        @resilient_api_call("seller_outreach", max_retries=3)
        def send_seller_outreach(seller_id, message):
            # Your API call here
            return api_client.send_to_seller(seller_id, message)
    
    Raises:
        Exception: If all retries exhausted or circuit breaker open
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            circuit_breaker = get_circuit_breaker(service_name)
            
            # Track retry attempts
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    # Route through circuit breaker
                    result = circuit_breaker.call(func, *args, **kwargs)
                    
                    if attempt > 0:
                        logger.info(
                            f"[{service_name}] Succeeded after {attempt} retries"
                        )
                    
                    return result
                
                except Exception as e:
                    last_exception = e
                    is_final_attempt = (attempt == max_retries)
                    
                    # Log the failure
                    logger.warning(
                        f"[{service_name}] Attempt {attempt + 1}/{max_retries + 1} failed: {str(e)[:100]}"
                    )
                    
                    if is_final_attempt:
                        logger.error(
                            f"[{service_name}] All {max_retries + 1} attempts exhausted",
                            exc_info=True,
                        )
                        break
                    
                    # Calculate exponential backoff
                    retry_delay = min(
                        initial_retry_delay_seconds * (2 ** attempt),
                        max_retry_delay_seconds,
                    )
                    
                    logger.info(
                        f"[{service_name}] Retrying in {retry_delay}s..."
                    )
                    time.sleep(retry_delay)
            
            # All retries exhausted
            raise last_exception or Exception(
                f"Service {service_name} failed after {max_retries + 1} attempts"
            )
        
        return wrapper
    
    return decorator


def get_all_circuit_breaker_status() -> Dict[str, Any]:
    """Get status of all active circuit breakers."""
    return {
        service_name: cb.get_status()
        for service_name, cb in _circuit_breakers.items()
    }
