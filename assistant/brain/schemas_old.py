from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime


class IntentResult(BaseModel):
    """
    Strict schema for intent classification - GUARANTEED VALID OUTPUT
    
    Architectural Mandates (Phase B.1/B.2):
    - 100% schema compliance (type-safe routing)
    - Audit trail via reasoning field
    - Validation on tool_name requirement
    - Confidence scoring for decision tracking
    - Multilingual ingress/egress support
    - Category taxonomy for router-based orchestration
    """
    intent_type: Literal[
        "property_search", "agent_outreach", "conversation_continuation", 
        "status_update", "follow_up", "general_chat", "service_search", 
        "knowledge_query"
    ]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")
    needs_tool: bool = Field(default=False, description="Whether this intent requires tool execution")
    tool_name: Optional[str] = Field(default=None, description="Name of tool if needs_tool=True")
    action: Optional[str] = None  # Legacy: Was Literal["request_photos", "get_details"]

    # Multilingual
    language: str = Field(default="en", description="Router-processed language (may be normalized)")
    input_language: Optional[str] = Field(default=None, description="Detected input language (e.g., 'tr', 'ru')")
    output_language: Optional[str] = Field(default=None, description="Desired output language (fallback to input)")

    # Router taxonomy
    category: Optional[Literal[
        "PROPERTY", "VEHICLE", "GENERAL_PRODUCT", "SERVICE", "KNOWLEDGE_QUERY", "OUT_OF_SCOPE"
    ]] = Field(default=None)
    subcategory: Optional[str] = Field(default=None)
    goal: Optional[str] = Field(default=None, description="High-level goal/outcome for planning")

    reasoning: Optional[str] = Field(default="", description="Why this intent was selected (audit trail)")
    
    @classmethod
    def __init__(cls, **data):
        """Validate tool_name requirement before instantiation"""
        super().__init__(**data)
        if data.get('needs_tool') and not data.get('tool_name'):
            raise ValueError("tool_name is required when needs_tool=True")


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


# === Agent Contracts (Phase A) ===
class SearchCriteria(BaseModel):
    user_question: str
    search_tokens: List[str] = Field(default_factory=list)
    criteria_filters: Optional[Dict[str, Any]] = None


class SearchResult(BaseModel):
    document_id: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_fallback_source: bool = False


class LeadPayload(BaseModel):
    target_listing_id: str
    preferred_contact_token: str
    priority_score: float = Field(default=0.5, ge=0.0, le=1.0)
    required_seller_id: str


class BroadcastSummary(BaseModel):
    status: Literal["SENT", "QUEUED", "PENDING_APPROVAL", "FAILED"]
    final_message: str
    tool_trace: List[Dict[str, Any]] = Field(default_factory=list)
    seller_source_used: Literal["listing_owner", "service_provider", "mixed"]


