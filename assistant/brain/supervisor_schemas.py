from typing import TypedDict, Optional, Dict, List, Literal, Any
from pydantic import BaseModel, Field


class SupervisorRoutingDecision(BaseModel):
    """Structured output for Central Supervisor Agent routing decisions"""

    primary_domain: Literal[
        "REAL_ESTATE",
        "NON_RE_MARKETPLACE",
        "GENERAL_CONVERSATION",
    ] = Field(description="Primary domain classification")

    secondary_domain: Optional[
        Literal["REAL_ESTATE", "NON_RE_MARKETPLACE", "GENERAL_CONVERSATION"]
    ] = Field(default=None, description="Secondary domain (for ambiguous queries)")

    confidence_score: float = Field(
        ge=0.0, le=1.0, description="Confidence in classification (0-1)"
    )

    extracted_entities: Dict[str, Any] = Field(
        default_factory=dict, description="Entities extracted from user input"
    )

    reasoning: str = Field(description="Explanation for routing decision")

    requires_clarification: bool = Field(
        default=False, description="Whether user clarification is needed"
    )


class SupervisorState(TypedDict):
    """Unified state object for entire hierarchical system"""

    user_input: str
    thread_id: str
    messages: List[Dict]
    history: List[Dict[str, str]]
    user_id: Optional[int]
    conversation_history: List[Dict]

    # Supervisor decisions
    routing_decision: Optional[Any]
    routing_decision_normalized: Optional[Dict[str, Any]]
    routing_decision_raw: Optional[SupervisorRoutingDecision]
    target_agent: Optional[str]

    # Domain-specific data
    extracted_criteria: Optional[Dict]
    property_data: Optional[List[Dict]]
    request_data: Optional[Dict]

    # Execution state
    current_node: str
    error_message: Optional[str]
    is_complete: bool

    # Minimal echo from specialized agents for verification
    agent_response: Optional[Dict]
    
    # Agent response content
    final_response: Optional[str]
    recommendations: Optional[List[Dict]]
    agent_name: Optional[str]
    agent_traces: Optional[Dict[str, Any]]
    conversation_ctx: Optional[Dict[str, Any]]
    memory_trace: Optional[Dict[str, Any]]
    memory_context_summary: Optional[str]
    memory_context_facts: Optional[List[Dict[str, Any]]]
    memory_context_recent: Optional[List[Dict[str, Any]]]
    retrieved_context: Optional[str]


class MapMarker(BaseModel):
    """DTO for individual map marker in geo-location recommendations."""
    
    id: str = Field(description="Unique marker identifier")
    title: str = Field(description="Marker display name (e.g., pharmacy name)")
    lat: float = Field(description="WGS84 latitude coordinate")
    lng: float = Field(description="WGS84 longitude coordinate")
    subtitle: Optional[str] = Field(default=None, description="Optional subtitle")
    address: Optional[str] = Field(default=None, description="Full address string")
    phone: Optional[str] = Field(default=None, description="Contact phone number")
    url: Optional[str] = Field(default=None, description="Source/info URL")
    category: Literal[
        "pharmacy", "hospital", "bus", "place", "activity", "other"
    ] = Field(default="place", description="Location category")
    
    class Config:
        extra = "forbid"
