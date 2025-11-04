"""
Memory subsystem bootstrap.

Exports feature flags and the Zep client so callers can remain decoupled
from the underlying implementation while we iterate on the rollout plan.
"""

from .flags import (  # noqa: F401
    MemoryMode,
    current_mode,
    read_enabled,
    write_enabled,
)
from .zep_client import (  # noqa: F401
    ZepClient,
    ZepClientError,
    ZepCircuitOpenError,
    ZepRequestError,
)
from .service import (  # noqa: F401
    call_zep,
    fetch_thread_context,
    get_client,
    invalidate_context,
)

__all__ = [
    "MemoryMode",
    "current_mode",
    "read_enabled",
    "write_enabled",
    "get_client",
    "call_zep",
    "fetch_thread_context",
    "invalidate_context",
    "ZepClient",
    "ZepClientError",
    "ZepCircuitOpenError",
    "ZepRequestError",
]
