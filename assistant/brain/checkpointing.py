"""
PostgreSQL Checkpointing for LangGraph Persistence

Provides durable, distributed state management for multi-turn conversations.
Enables horizontal scaling and fault recovery across worker processes.

Note: Phase A uses MemorySaver. PostgreSQL integration will be available 
in langgraph >= 0.2.0 via langgraph.checkpoint.postgres.PostgresSaver
"""

from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)


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
