"""
Zep Graph Memory Manager (v3 API)

Provides structured, long-term knowledge storage using Zep Graphs.
Complements session memory with persistent user preferences and domain knowledge.

Architecture:
- User Graphs: Per-user personalized knowledge (preferences, history)
- System Graph: Shared domain knowledge (listings, locations, amenities)

Features:
- Circuit breaker for fault tolerance
- Retry logic with exponential backoff
- Performance metrics tracking
- Graceful degradation on failures

Usage:
    manager = GraphManager()

    # Store user preference
    manager.add_fact_triplet(
        user_id="user_123",
        source_node_name="user_123",
        target_node_name="Girne",
        fact="prefers_location"
    )

    # Search user preferences
    results = manager.search_graph(user_id="user_123", query="location preferences")
"""

import os
import json
import logging
import time
from typing import List, Optional, Dict, Any, Callable
from datetime import datetime
from functools import wraps

logger = logging.getLogger(__name__)


# ========================================================================
# Circuit Breaker Pattern for Graph Operations
# ========================================================================

class CircuitBreaker:
    """
    Circuit breaker for Graph API calls.

    States:
    - CLOSED: Normal operation, calls pass through
    - OPEN: Too many failures, all calls fail fast
    - HALF_OPEN: Testing if service recovered
    """

    def __init__(self, max_failures: int = 5, reset_timeout: float = 30.0):
        self.max_failures = max_failures
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"

    def call(self, fn: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        # Check if we should reset from OPEN to HALF_OPEN
        if self.state == "OPEN":
            if time.time() - self.last_failure_time >= self.reset_timeout:
                logger.info("[CircuitBreaker] Transitioning to HALF_OPEN (testing recovery)")
                self.state = "HALF_OPEN"
            else:
                raise Exception(f"Circuit breaker OPEN (retrying in {self.reset_timeout}s)")

        try:
            result = fn(*args, **kwargs)

            # Success - reset if in HALF_OPEN
            if self.state == "HALF_OPEN":
                logger.info("[CircuitBreaker] Recovery successful, transitioning to CLOSED")
                self.state = "CLOSED"
                self.failure_count = 0

            return result

        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            # Transition to OPEN if threshold exceeded
            if self.failure_count >= self.max_failures:
                logger.warning(
                    "[CircuitBreaker] Max failures reached (%d), transitioning to OPEN",
                    self.max_failures
                )
                self.state = "OPEN"

            raise


def with_retry(max_retries: int = 3, backoff_factor: float = 1.5):
    """
    Decorator for retrying Graph operations with exponential backoff.

    Args:
        max_retries: Maximum retry attempts
        backoff_factor: Multiplier for delay between retries
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    last_exception = e

                    if attempt < max_retries - 1:
                        delay = backoff_factor ** attempt
                        logger.warning(
                            "[Retry] Attempt %d/%d failed: %s. Retrying in %.1fs...",
                            attempt + 1,
                            max_retries,
                            e,
                            delay
                        )
                        time.sleep(delay)
                    else:
                        logger.error(
                            "[Retry] All %d attempts failed for %s",
                            max_retries,
                            fn.__name__
                        )

            raise last_exception

        return wrapper
    return decorator

# Try to import Zep client - graceful fallback if not available
try:
    from zep_cloud.client import Zep
    ZEP_AVAILABLE = True
except ImportError:
    logger.warning("zep_cloud not installed - Graph features will be disabled")
    ZEP_AVAILABLE = False
    Zep = None


class GraphManager:
    """
    Manager for Zep Graph Memory operations.

    Handles both user-specific graphs (preferences, history) and
    system-wide graphs (domain knowledge, listings).
    """

    # Graph naming conventions
    SYSTEM_GRAPH_RE = "real_estate_system"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        enable_circuit_breaker: bool = True
    ):
        """
        Initialize Graph Manager with fault tolerance.

        Args:
            api_key: Zep API key (default: from ZEP_API_KEY env)
            base_url: Zep base URL (default: from ZEP_BASE_URL env)
            enable_circuit_breaker: Enable circuit breaker for fault tolerance

        Raises:
            ValueError: If Zep is not available or API key not provided
        """
        if not ZEP_AVAILABLE:
            raise ValueError(
                "Zep Cloud SDK not installed. "
                "Install with: pip install zep-cloud"
            )

        api_key = api_key or os.getenv("ZEP_API_KEY")
        base_url = base_url or os.getenv("ZEP_BASE_URL")

        # Temporary debug log to verify key loading
        if api_key:
            logger.info(f"[GraphManager] Using ZEP_API_KEY: {api_key[:8]}...{api_key[-8:]}")
        else:
            logger.warning("[GraphManager] ZEP_API_KEY not found in environment.")

        if not api_key:
            raise ValueError("ZEP_API_KEY must be provided")

        # Initialize client
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url

        self.client = Zep(**client_kwargs)
        self.enabled = True

        # Initialize circuit breaker for fault tolerance
        self.circuit_breaker = CircuitBreaker(
            max_failures=5,
            reset_timeout=30.0
        ) if enable_circuit_breaker else None

        # Metrics tracking
        self.metrics = {
            "operations_total": 0,
            "operations_failed": 0,
            "operations_circuit_broken": 0,
            "last_operation_time": None
        }

        logger.info(
            "[GraphManager] Initialized (base_url=%s, circuit_breaker=%s)",
            base_url or "default",
            "enabled" if enable_circuit_breaker else "disabled"
        )

    # ========================================================================
    # Helper Methods
    # ========================================================================

    def _execute_with_protection(self, operation_name: str, fn: Callable, *args, **kwargs):
        """
        Execute Graph operation with circuit breaker and metrics tracking.

        Args:
            operation_name: Name of operation for logging
            fn: Function to execute
            *args, **kwargs: Arguments to pass to function

        Returns:
            Function result

        Raises:
            Exception: If operation fails after retries or circuit is open
        """
        self.metrics["operations_total"] += 1
        start_time = time.time()

        try:
            if self.circuit_breaker:
                result = self.circuit_breaker.call(fn, *args, **kwargs)
            else:
                result = fn(*args, **kwargs)

            # Track success
            self.metrics["last_operation_time"] = time.time() - start_time

            logger.debug(
                "[GraphManager] %s completed in %.2fms",
                operation_name,
                (time.time() - start_time) * 1000
            )

            return result

        except Exception as e:
            self.metrics["operations_failed"] += 1

            if self.circuit_breaker and self.circuit_breaker.state == "OPEN":
                self.metrics["operations_circuit_broken"] += 1

            logger.error(
                "[GraphManager] %s failed after %.2fms: %s",
                operation_name,
                (time.time() - start_time) * 1000,
                e
            )

            raise

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics for monitoring."""
        return {
            **self.metrics,
            "circuit_breaker_state": self.circuit_breaker.state if self.circuit_breaker else "disabled"
        }

    # ========================================================================
    # Graph Creation & Setup
    # ========================================================================

    def create_graph(
        self,
        graph_id: str,
        name: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new named graph (for system-wide graphs).

        Args:
            graph_id: Unique identifier for the graph
            name: Human-readable name
            description: Optional description

        Returns:
            Graph creation response
        """
        try:
            resp = self.client.graph.create(
                graph_id=graph_id,
                name=name,
                description=description
            )
            logger.info("[GraphManager] Created graph '%s'", graph_id)
            return resp
        except Exception as e:
            logger.error(
                "[GraphManager] Failed to create graph '%s': %s",
                graph_id,
                e,
                exc_info=True
            )
            raise

    # ========================================================================
    # Data Ingestion
    # ========================================================================

    def add_episode(
        self,
        graph_id: Optional[str] = None,
        user_id: Optional[str] = None,
        type: str = "json",
        data: Any = None,
        source_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add an episode (message/text/json) to a graph.

        Args:
            graph_id: System graph ID (mutually exclusive with user_id)
            user_id: User graph ID (mutually exclusive with graph_id)
            type: Episode type ("json", "text", "message")
            data: Episode data (will be JSON-stringified if dict)
            source_description: Optional description of data source

        Returns:
            Episode creation response

        Raises:
            ValueError: If neither graph_id nor user_id provided
        """
        if not (graph_id or user_id):
            raise ValueError("Either graph_id or user_id must be provided")

        # Prepare payload
        payload = {
            "type": type,
            "data": json.dumps(data) if isinstance(data, dict) else str(data),
        }

        if source_description:
            payload["source_description"] = source_description

        if user_id:
            payload["user_id"] = user_id
        else:
            payload["graph_id"] = graph_id

        try:
            resp = self.client.graph.add(**payload)
            logger.debug(
                "[GraphManager] Added episode to %s",
                f"user={user_id}" if user_id else f"graph={graph_id}"
            )
            return resp
        except Exception as e:
            logger.error(
                "[GraphManager] Failed to add episode: %s",
                e,
                exc_info=True
            )
            raise

    def add_fact_triplet(
        self,
        source_node_name: str,
        target_node_name: str,
        fact: str,
        graph_id: Optional[str] = None,
        user_id: Optional[str] = None,
        fact_name: Optional[str] = None,
        confidence: Optional[float] = None,
        source: Optional[str] = None,
        # Deprecated parameters (v2 compatibility)
        valid_from: Optional[str] = None,
        valid_until: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add or update a structured fact triplet: source —[fact]→ target.

        Use this for explicit relationships like:
        - user_123 —[prefers_location]→ Girne
        - Listing_42 —[located_in]→ Girne
        - Girne —[is_city_in]→ North Cyprus

        Args:
            source_node_name: Source node identifier (subject in v3)
            target_node_name: Target node identifier (object in v3)
            fact: Relationship/predicate name
            graph_id: System graph ID (mutually exclusive with user_id)
            user_id: User graph ID (mutually exclusive with graph_id)
            fact_name: Optional human-readable fact name
            confidence: Confidence score for this fact (0.0-1.0)
            source: Source of this fact (e.g., "user_input", "agent_inference")
            valid_from: Deprecated (v2 compatibility, ignored)
            valid_until: Deprecated (v2 compatibility, ignored)

        Returns:
            Fact creation response

        Raises:
            ValueError: If neither graph_id nor user_id provided
        """
        if not (graph_id or user_id):
            raise ValueError("Either graph_id or user_id must be provided")

        # Build v3-compatible payload
        payload: Dict[str, Any] = {
            "fact": fact,
            "target_node_name": target_node_name,
            "source_node_name": source_node_name,
            "fact_name": fact_name or f"{source_node_name} {fact} {target_node_name}"
        }

        # Add temporal parameters (v3 uses valid_at, invalid_at, expired_at)
        if valid_from:
            payload["valid_at"] = valid_from
        if valid_until:
            payload["invalid_at"] = valid_until

        # Determine graph target
        if user_id:
            payload["user_id"] = user_id
        else:
            payload["graph_id"] = graph_id

        try:
            # v3 API: Use add_fact_triple method
            resp = self.client.graph.add_fact_triple(**payload)
            logger.debug(
                "[GraphManager] Added fact: %s —[%s]→ %s (graph_id=%s, user_id=%s)",
                source_node_name,
                fact,
                target_node_name,
                graph_id,
                user_id
            )
            return resp
        except Exception as e:
            logger.error(
                "[GraphManager] Failed to add fact triplet: %s (payload=%s)",
                e,
                payload,
                exc_info=True
            )
            raise

    # ========================================================================
    # Search & Retrieval
    # ========================================================================

    @with_retry(max_retries=3, backoff_factor=1.5)
    def search_graph(
        self,
        query: str,
        graph_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 10,
        min_rating: Optional[float] = None,
        scope: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search the graph for nodes/facts/episodes matching a query.

        Features:
        - Automatic retry with exponential backoff
        - Circuit breaker protection
        - Graceful degradation on errors

        Args:
            query: Natural language query
            graph_id: System graph ID (mutually exclusive with user_id)
            user_id: User graph ID (mutually exclusive with graph_id)
            limit: Maximum results to return
            min_rating: Minimum fact rating/confidence (0.0-1.0)
            scope: Search scope ("edges", "nodes", "episodes", or None for all)

        Returns:
            Search results with edges, nodes, and/or episodes

        Raises:
            ValueError: If neither graph_id nor user_id provided
        """
        if not (graph_id or user_id):
            raise ValueError("Either graph_id or user_id must be provided")

        params: Dict[str, Any] = {
            "query": query,
            "limit": limit
        }

        if min_rating is not None:
            params["min_fact_rating"] = min_rating
        if scope:
            params["scope"] = scope

        if user_id:
            params["user_id"] = user_id
        else:
            params["graph_id"] = graph_id

        try:
            # Execute with circuit breaker protection
            def _do_search():
                return self.client.graph.search(**params)

            resp = self._execute_with_protection("search_graph", _do_search)

            logger.debug(
                "[GraphManager] Searched %s with query='%s', found %d results",
                f"user={user_id}" if user_id else f"graph={graph_id}",
                query[:50],
                len(resp.get("edges", [])) + len(resp.get("nodes", []))
            )
            return resp

        except Exception as e:
            logger.error(
                "[GraphManager] Search failed after retries: %s",
                e,
                exc_info=True
            )
            # Graceful degradation: return empty result
            return {"edges": [], "nodes": [], "episodes": []}

    def read_facts(
        self,
        graph_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get all facts (edges) for a user or graph.

        Args:
            graph_id: System graph ID
            user_id: User graph ID
            limit: Maximum facts to return

        Returns:
            List of fact edges
        """
        resp = self.search_graph(
            query="",
            graph_id=graph_id,
            user_id=user_id,
            limit=limit,
            scope="edges"
        )
        return resp.get("edges", [])

    # ========================================================================
    # Deletion
    # ========================================================================

    def delete_episode(
        self,
        uuid: str,
        graph_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Delete an episode from a graph.

        Args:
            uuid: Episode UUID to delete
            graph_id: System graph ID
            user_id: User graph ID

        Returns:
            Deletion response
        """
        payload: Dict[str, Any] = {"uuid": uuid}

        if user_id:
            payload["user_id"] = user_id
        else:
            payload["graph_id"] = graph_id

        try:
            resp = self.client.graph.delete(**payload)
            logger.info("[GraphManager] Deleted episode %s", uuid)
            return resp
        except Exception as e:
            logger.error(
                "[GraphManager] Failed to delete episode: %s",
                e,
                exc_info=True
            )
            raise

    # ========================================================================
    # Convenience Methods for Real Estate Domain
    # ========================================================================

    def store_user_preference(
        self,
        user_id: str,
        preference_type: str,
        value: str,
        confidence: float = 1.0
    ):
        """
        Store a user preference as a fact.

        Example:
            store_user_preference(
                user_id="user_123",
                preference_type="location",
                value="Girne",
                confidence=0.9
            )
            Creates: user_123 —[prefers_location]→ Girne

        Args:
            user_id: User identifier
            preference_type: Type of preference (location, budget, rental_type, etc.)
            value: Preference value
            confidence: Confidence score (0.0-1.0, for future use)

        Note:
            Zep Graph v3 SDK doesn't directly support confidence scores.
            We track when preferences were set via valid_at timestamp.
        """
        return self.add_fact_triplet(
            user_id=user_id,
            source_node_name=user_id,
            target_node_name=str(value),
            fact=f"prefers_{preference_type}",
            fact_name=f"User prefers {preference_type}: {value}",
            valid_from=datetime.utcnow().isoformat()
        )

    def get_user_preferences(
        self,
        user_id: str,
        preference_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve user preferences from graph.

        Args:
            user_id: User identifier
            preference_type: Optional filter (e.g., "location", "budget")

        Returns:
            List of preference facts
        """
        query = f"preferences {preference_type}" if preference_type else "preferences"
        resp = self.search_graph(
            user_id=user_id,
            query=query,
            scope="edges"
        )
        return resp.get("edges", [])


# Singleton instance for easy access
_graph_manager_instance = None


def get_graph_manager() -> Optional[GraphManager]:
    """
    Get or create singleton GraphManager instance.

    Returns:
        GraphManager instance, or None if Zep is not available
    """
    global _graph_manager_instance

    if _graph_manager_instance is None:
        try:
            _graph_manager_instance = GraphManager()
        except Exception as e:
            logger.warning(
                "[GraphManager] Failed to initialize: %s. Graph features disabled.",
                e
            )
            return None

    return _graph_manager_instance
