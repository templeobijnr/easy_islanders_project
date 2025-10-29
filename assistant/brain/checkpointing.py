"""
PostgreSQL Checkpointing for LangGraph Persistence

Provides durable, distributed state management for multi-turn conversations.
Enables horizontal scaling and fault recovery across worker processes.

Note: Phase A uses MemorySaver. PostgreSQL integration will be available 
in langgraph >= 0.2.0 via langgraph.checkpoint.postgres.PostgresSaver
"""

from typing import Optional, Any, Dict
import logging
from datetime import datetime

try:
    from django.core.cache import cache  # type: ignore
    _CACHE_AVAILABLE = True
except Exception:  # pragma: no cover
    cache = None
    _CACHE_AVAILABLE = False

logger = logging.getLogger(__name__)


# ISSUE-006 FIX: Custom exception for checkpoint failures
class CheckpointError(Exception):
    """Raised when checkpoint operations fail."""
    pass


def get_checkpoint_saver(
    connection_string: str,
    namespace: str = "langgraph",
    deserializer=None,
) -> Any:
    """
    Factory for checkpoint saver with production-grade configuration.
    
    Args:
        connection_string: PostgreSQL connection URL
            Format: postgresql://user:password@host:port/database
        namespace: Table namespace (default: "langgraph")
        deserializer: Custom deserializer (optional)
    
    Returns:
        Initialized checkpoint saver instance (MemorySaver in Phase A)
    
    Note: 
        - Phase A: Returns MemorySaver (in-memory)
        - Phase B: Will return PostgresSaver when langgraph >= 0.2.0
    """
    if not connection_string:
        raise ValueError("connection_string required for checkpoint saver")
    
    try:
        # Phase A: Use MemorySaver as fallback
        from langgraph.checkpoint.memory import MemorySaver
        logger.info(f"Using MemorySaver (Phase A development mode)")
        logger.info(f"PostgreSQL connection string saved for Phase B upgrade: {connection_string[:50]}...")
        return MemorySaver()
    except ImportError:
        logger.error("Failed to import checkpoint saver")
        raise


def test_connection(connection_string: str) -> bool:
    """
    Test PostgreSQL connection without initializing saver.
    
    Args:
        connection_string: PostgreSQL connection URL
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        import psycopg2
        conn = psycopg2.connect(connection_string)
        conn.close()
        logger.info("✅ PostgreSQL connection test passed")
        return True
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection test failed: {e}")
        return False


# === Phase B2: Lightweight checkpoint helpers (cache-based) ===

_CKPT_TTL_SECONDS = 86400  # 24h


def save_checkpoint(conversation_id: str, state: Dict[str, Any]) -> bool:
    """Save a lightweight checkpoint to cache.

    ISSUE-006 FIX: Now raises CheckpointError on failure instead of silently returning False.
    Returns True if stored successfully.
    
    Raises:
        CheckpointError: If checkpoint save fails
    """
    if not conversation_id:
        raise CheckpointError("conversation_id is required for checkpoint save")
    
    if not _CACHE_AVAILABLE:
        raise CheckpointError("Cache backend not available for checkpoint storage")
    
    try:
        key = f"ckpt:{conversation_id}"
        envelope = {"state": state, "ts": datetime.utcnow().isoformat()}
        cache.set(key, envelope, timeout=_CKPT_TTL_SECONDS)
        logger.debug("Checkpoint saved: %s", key)
        return True
    except Exception as e:
        logger.error("Failed to save checkpoint %s: %s", conversation_id, e, exc_info=True)
        raise CheckpointError(f"Failed to save checkpoint {conversation_id}: {e}") from e


def load_checkpoint(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Load last checkpoint from cache.
    
    ISSUE-006 FIX: Now raises CheckpointError on critical failures.
    Returns None if checkpoint doesn't exist (not an error).
    
    Raises:
        CheckpointError: If cache backend fails or conversation_id invalid
    """
    if not conversation_id:
        raise CheckpointError("conversation_id is required for checkpoint load")
    
    if not _CACHE_AVAILABLE:
        logger.warning("Cache backend not available - checkpoint load skipped")
        return None  # Gracefully degrade
    
    try:
        key = f"ckpt:{conversation_id}"
        envelope = cache.get(key)
        if isinstance(envelope, dict):
            return envelope.get("state")
        return None  # Checkpoint doesn't exist (not an error)
    except Exception as e:
        logger.error("Failed to load checkpoint %s: %s", conversation_id, e, exc_info=True)
        raise CheckpointError(f"Failed to load checkpoint {conversation_id}: {e}") from e
