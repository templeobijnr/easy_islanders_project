"""
Assistant hooks for external integrations.

This package provides optional integrations with external services
like Zep Graph for enhanced AI context management.
"""

from .seller_agent import (
    store_seller_context,
    get_seller_context,
    enrich_seller_query,
    sync_seller_to_zep,
    is_zep_enabled,
)

__all__ = [
    'store_seller_context',
    'get_seller_context',
    'enrich_seller_query',
    'sync_seller_to_zep',
    'is_zep_enabled',
]
