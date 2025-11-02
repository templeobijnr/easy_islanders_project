"""
Assistant Agents Package.

All specialized agents live here:
- real_estate: Property search and Q&A
- (future: services, general, etc.)

Contracts module defines the frozen API between supervisor and agents.
"""

from assistant.agents.contracts import (
    AgentRequest,
    AgentResponse,
    AgentAction,
    AgentContext,
)

__all__ = [
    "AgentRequest",
    "AgentResponse",
    "AgentAction",
    "AgentContext",
]
