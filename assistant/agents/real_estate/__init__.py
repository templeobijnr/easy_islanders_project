"""
Real Estate Agent Package.

Main exports:
- handle_real_estate_request: Entry point for supervisor
- real_estate_node: LangGraph node wrapper (S3)
"""

from assistant.agents.real_estate.agent import (
    handle_real_estate_request,
    real_estate_node,
)

__all__ = [
    "handle_real_estate_request",
    "real_estate_node",
]
