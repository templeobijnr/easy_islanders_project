"""
Compatibility wrapper for enterprise transactions.

Exposes the stable functions expected by tests by delegating to
the current implementation in transactions.py.
"""

from .transactions import (
    create_request_atomic,
    create_approval_gate_atomic,
    broadcast_request_atomic,
    approve_broadcast_atomic,
    update_request_status_atomic,
    create_request_safe,
    approve_broadcast_safe,
    get_eligible_sellers,
    send_message_to_seller,
    build_broadcast_message,
)

__all__ = [
    "create_request_atomic",
    "create_approval_gate_atomic",
    "broadcast_request_atomic",
    "approve_broadcast_atomic",
    "update_request_status_atomic",
    "create_request_safe",
    "approve_broadcast_safe",
    "get_eligible_sellers",
    "send_message_to_seller",
    "build_broadcast_message",
]
