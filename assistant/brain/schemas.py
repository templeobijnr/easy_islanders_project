from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime


class IntentResult(BaseModel):
    intent_type: Literal[
        "property_search", "agent_outreach", "conversation_continuation", 
        "status_update", "follow_up", "general_chat", "service_search", 
        "knowledge_query"
    ]
    confidence: float = Field(..., ge=0, le=1)
    needs_tool: bool = False
    tool_name: Optional[str] = None
    action: Optional[str] = None  # CHANGED: Was Literal["request_photos", "get_details"]
    language: str = "en"
    reasoning: Optional[str] = None


class Requirements(BaseModel):
    property_type: Optional[str] = None
    purpose: Optional[
        Literal["rent", "sale", "holiday", "long_term", "short_term", "monthly", "daily"]
    ] = None
    location: Optional[str] = None
    bedrooms: Optional[Union[int, Literal["any"]]] = None
    bathrooms: Optional[Union[int, Literal["any"]]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    currency: Optional[Literal["GBP", "EUR", "USD", "TL"]] = None
    furnished: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    duration: Optional[Literal["daily", "weekly", "monthly", "yearly"]] = None
    features: Optional[List[str]] = None
    raw_query: str


class ToolDecision(BaseModel):
    name: Literal["search_internal_listings", "initiate_contact_with_seller", "none"]
    args: Dict[str, Any] = Field(default_factory=dict)
    reason: str


class AgentState(BaseModel):
    request_id: str
    conversation_id: Optional[str] = None
    language: Optional[Literal["en", "tr", "ru", "pl"]] = None
    user_text: str
    intent: Optional[IntentResult] = None
    requirements: Optional[Requirements] = None
    tool_decision: Optional[ToolDecision] = None
    tool_result: Optional[Dict[str, Any]] = None
    last_recommendations: Optional[List[int]] = None
    errors: Optional[List[str]] = None


# NEW: Enhanced classes for context-aware agent (non-breaking additions)
class PendingAction(BaseModel):
    """Tracks pending actions like outreach waiting for agent response."""
    type: Literal["outreach_pictures", "outreach_details", "outreach_availability"] = Field(
        ..., description="Type of pending outreach"
    )
    listing_id: int = Field(..., description="The listing ID involved")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(), description="When the action was initiated")
    status: Literal["initiated", "waiting", "completed", "failed"] = "waiting"
    context: Optional[Dict[str, Any]] = None  # e.g., {"reason": "user asked for photos"}


class AgentStateWithContext(AgentState):
    """Enhanced AgentState with context awareness - inherits all existing fields."""
    history_summary: Optional[str] = None
    pending_actions: List[PendingAction] = Field(default_factory=list)
    context_loaded: bool = False


