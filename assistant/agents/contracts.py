"""
Agent Contracts - Frozen API types for agent communication.

These types define the supervisor <-> agent interface.
Changes require version bumps and migration plan.
"""

from typing import TypedDict, Literal, Any, NotRequired, Required


class AgentContext(TypedDict, total=False):
    """Context passed to all agents."""
    user_id: str | None
    locale: Required[str]  # 'en', 'tr', 'ru', 'de', 'pl'
    time: Required[str]    # ISO8601 timestamp
    conversation_capsule: NotRequired[dict[str, Any]]
    memory: NotRequired[dict[str, Any]]


class AgentRequest(TypedDict):
    """
    Request from supervisor to specialized agent.

    Frozen contract - do not modify without version bump.
    """
    thread_id: str
    client_msg_id: str
    intent: Literal["property_search", "property_qa", "smalltalk", "out_of_scope"]
    input: str
    ctx: AgentContext


class AgentAction(TypedDict, total=False):
    """
    Action emitted by agent (rendered by frontend).

    Types:
    - show_listings: Display property cards
    - ask_clarification: Request missing information
    - answer_qa: Answer property question
    - error: Error state
    """
    type: Literal["show_listings", "ask_clarification", "answer_qa", "error"]
    params: dict[str, Any]


class AgentResponse(TypedDict):
    """
    Response from agent back to supervisor.

    Frozen contract - validated against JSON schema before WS emit.
    """
    reply: str  # Natural language response
    actions: list[AgentAction]
    traces: NotRequired[dict[str, Any]]  # Observability metadata (opaque to supervisor)
