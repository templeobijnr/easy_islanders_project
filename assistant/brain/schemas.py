"""
Enterprise-Grade Pydantic Schemas for Multi-Domain AI Agent Platform
Structured validation with category-specific attributes and multilingual support
"""

from typing import Any, Dict, List, Optional, Literal, Union
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from enum import Enum

# ============================================================================
# ENTERPRISE INTENT CLASSIFICATION SCHEMA
# ============================================================================

class EnterpriseIntentResult(BaseModel):
    """
    Enterprise-grade intent classification with full multilingual support,
    category-specific validation, and explicit flow/node routing.
    
    Maps to:
    - 4 Core Flows: Search & Show (F1), Capture & Broadcast (F2), Direct Contact (F3), Booking & Viewing (F4)
    - 12-Node LangGraph: Guardrails (2), NLU (4), Retrieval (6), Synthesis (7), Capture Lead (8), 
                        HITL Approval (9), Broadcast (10), Booking (11), Long-Term Memory (12)
    """
    # Core intent classification - 12 types covering all domains and flows
    intent_type: Literal[
        # Domain-Specific Search/Discovery (Flow 1 - Search & Show, primary)
        "property_search",          # PROPERTY domain -> Node 4,6,7
        "vehicle_search",           # VEHICLE domain -> Node 4,6,7
        "product_search",           # GENERAL_PRODUCT domain -> Node 4,6,7
        "service_search",           # SERVICE domain -> Node 4,6,7
        
        # Transactional/Action Intents
        "booking_request",          # Flow 4 -> Node 11 (Booking)
        "lead_capture",             # Flow 2 -> Node 8,9,10 (Capture & Broadcast)
        "agent_outreach",           # Flow 3 -> Agent contact tools
        "status_update",            # Query flow state -> Node 12 (Long-Term Memory)
        
        # Knowledge & Conversation
        "knowledge_query",          # General RAG -> Node 6,7
        "general_chat",             # Conversational -> Node 7 (Synthesis)
        "greeting",                 # Simple greeting -> Node 7
        
        # Governance/Safety
        "out_of_scope",             # Block harmful/irrelevant -> Node 2 (Guardrails)
        
        # Live local information lookup (non-transactional, external web/tool)
        "local_lookup",             # Live local info (pharmacy on duty, hospital location, activities)
    ]
    
    # Category taxonomy for router-based orchestration
    category: Literal[
        "PROPERTY", "VEHICLE", "GENERAL_PRODUCT", "SERVICE", 
        "KNOWLEDGE_QUERY", "OUT_OF_SCOPE", "CONVERSATION"
    ]
    
    # Flow and node mapping for architectural tracing
    triggered_flow: Optional[Literal["F1_search_show", "F2_capture_broadcast", "F3_direct_contact", "F4_booking_viewing"]] = Field(
        None, description="Which core flow this intent triggers"
    )
    primary_node: Optional[Literal["2", "4", "6", "7", "8", "9", "10", "11", "12"]] = Field(
        None, description="Primary node in 12-node architecture that handles this intent"
    )
    
    subcategory: Optional[str] = Field(None, description="Specific subcategory within main category")
    goal: Optional[str] = Field(None, description="High-level goal/outcome for planning")
    
    # Multilingual support
    input_language: str = Field(default="en", description="Detected input language")
    output_language: str = Field(default="en", description="Target output language")
    user_language: str = Field(default="en", description="User's preferred language")
    
    # Confidence and routing
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")
    needs_tool: bool = Field(default=False, description="Whether this intent requires tool execution")
    tool_name: Optional[str] = Field(default=None, description="Name of tool if needs_tool=True")
    action: Optional[str] = Field(None, description="Specific action to take")
    
    # Quality and governance
    reasoning: str = Field(default="", description="Why this intent was selected (audit trail)")
    requires_hitl: bool = Field(default=False, description="Whether HITL approval is required (e.g., Flow 2 broadcast)")
    
    # Category-specific attributes (validated based on category)
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Category-specific attributes")
    
    @model_validator(mode='after')
    def set_flow_and_node(self):
        """Automatically set triggered_flow and primary_node based on intent_type"""
        flow_mapping = {
            # F1: Search & Show
            "property_search": ("F1_search_show", "6"),
            "vehicle_search": ("F1_search_show", "6"),
            "product_search": ("F1_search_show", "6"),
            "service_search": ("F1_search_show", "6"),
            "knowledge_query": ("F1_search_show", "6"),
            "local_lookup": ("F1_search_show", "6"),
            
            # F2: Capture & Broadcast
            "lead_capture": ("F2_capture_broadcast", "8"),
            
            # F3: Direct Contact
            "agent_outreach": ("F3_direct_contact", "7"),
            
            # F4: Booking & Viewing
            "booking_request": ("F4_booking_viewing", "11"),
            
            # Other
            "status_update": (None, "12"),
            "general_chat": (None, "7"),
            "greeting": (None, "7"),
            "out_of_scope": (None, "2"),
        }
        
        if self.intent_type in flow_mapping:
            flow, node = flow_mapping[self.intent_type]
            self.triggered_flow = flow
            self.primary_node = node
        
        return self
    
    @field_validator('attributes', mode='before')
    @classmethod
    def validate_attributes_by_category(cls, v):
        """Validate attributes based on category - just pass through, validate in model_validator"""
        return v if v else {}
    
    @field_validator('output_language', mode='after')
    @classmethod
    def ensure_language_consistency(cls, v, info):
        """Ensure output language matches input language"""
        if info.data.get('input_language') and v == 'en':
            return info.data['input_language']
        return v

# ============================================================================
# CATEGORY-SPECIFIC ATTRIBUTE SCHEMAS
# ============================================================================

class PropertyAttributes(BaseModel):
    """Attributes specific to property requests"""
    bedrooms: Optional[int] = Field(None, ge=0, le=10)
    bathrooms: Optional[int] = Field(None, ge=0, le=10)
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    currency: Optional[Literal["EUR", "USD", "GBP", "TL"]] = Field(default="EUR")
    location: Optional[str] = Field(None, max_length=200)
    property_type: Optional[Literal["apartment", "house", "villa", "studio", "penthouse"]] = None
    furnished: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    duration: Optional[Literal["short_term", "long_term", "permanent"]] = None
    features: Optional[List[str]] = Field(default_factory=list)
    
    class Config:
        extra = "forbid"  # Strict validation for property attributes

class VehicleAttributes(BaseModel):
    """Attributes specific to vehicle requests"""
    make: Optional[str] = Field(None, max_length=50)
    model: Optional[str] = Field(None, max_length=50)
    year_min: Optional[int] = Field(None, ge=1900, le=2030)
    year_max: Optional[int] = Field(None, ge=1900, le=2030)
    fuel_type: Optional[Literal["petrol", "diesel", "electric", "hybrid", "lpg"]] = None
    transmission: Optional[Literal["manual", "automatic", "semi_automatic"]] = None
    body_type: Optional[Literal["sedan", "hatchback", "suv", "coupe", "convertible", "truck"]] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    currency: Optional[Literal["EUR", "USD", "GBP", "TL"]] = Field(default="EUR")
    location: Optional[str] = Field(None, max_length=200)
    condition: Optional[Literal["new", "used", "certified_pre_owned"]] = None
    
    class Config:
        extra = "forbid"

class ProductAttributes(BaseModel):
    """Attributes specific to general product requests"""
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    product_type: Optional[str] = Field(None, max_length=100)
    condition: Optional[Literal["new", "used", "refurbished", "open_box"]] = None
    color: Optional[str] = Field(None, max_length=50)
    size: Optional[str] = Field(None, max_length=50)
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    currency: Optional[Literal["EUR", "USD", "GBP", "TL"]] = Field(default="EUR")
    location: Optional[str] = Field(None, max_length=200)
    features: Optional[List[str]] = Field(default_factory=list)
    
    class Config:
        extra = "forbid"

class ServiceAttributes(BaseModel):
    """Attributes specific to service requests"""
    service_type: Optional[str] = Field(None, max_length=100)
    urgency: Optional[Literal["low", "medium", "high", "urgent"]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = Field(None, ge=0)
    currency: Optional[Literal["EUR", "USD", "GBP", "TL"]] = Field(default="EUR")
    location: Optional[str] = Field(None, max_length=200)
    requirements: Optional[List[str]] = Field(default_factory=list)
    
    class Config:
        extra = "forbid"

class KnowledgeAttributes(BaseModel):
    """Attributes specific to knowledge queries"""
    topic: Optional[str] = Field(None, max_length=200)
    question_type: Optional[Literal["what", "how", "when", "where", "why", "who"]] = None
    complexity: Optional[Literal["basic", "intermediate", "advanced"]] = None
    context: Optional[str] = Field(None, max_length=500)
    
    class Config:
        extra = "forbid"

class GenericAttributes(BaseModel):
    """Fallback attributes for general requests"""
    details: Optional[str] = Field(None, max_length=1000)
    keywords: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=500)
    
    class Config:
        extra = "allow"  # Allow extra fields for generic requests

# Local lookup attributes (documented for clarity; attributes remains flexible)
class LocalLookupAttributes(BaseModel):
    """Attributes for LOCAL_LOOKUP queries (never infer city)."""
    city: Optional[str] = Field(None, description="Explicit city provided by the user (never inferred)")
    
    class Config:
        extra = "forbid"

# ============================================================================
# ENTERPRISE REQUEST PAYLOAD SCHEMA
# ============================================================================

class EnterpriseRequestPayload(BaseModel):
    """
    Enterprise-grade request payload with full validation
    """
    category: Literal[
        "PROPERTY", "VEHICLE", "GENERAL_PRODUCT", "SERVICE", 
        "KNOWLEDGE_QUERY", "OUT_OF_SCOPE"
    ]
    
    subcategory: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    budget_amount: Optional[float] = Field(None, ge=0)
    budget_currency: Optional[Literal["EUR", "USD", "GBP", "TL"]] = Field(default="EUR")
    
    # Category-specific attributes (validated)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    
    # Contact and metadata
    contact: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[str] = Field(None, max_length=100)
    conversation_id: Optional[str] = Field(None, max_length=100)
    
    # Language and quality
    language: str = Field(default="en", max_length=10)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    @model_validator(mode='before')
    def validate_attributes_by_category(cls, values):
        """Validate attributes based on category"""
        category = values.get('category')
        attributes = values.get('attributes', {})
        
        try:
            if category == 'PROPERTY':
                PropertyAttributes(**attributes)
            elif category == 'VEHICLE':
                VehicleAttributes(**attributes)
            elif category == 'GENERAL_PRODUCT':
                ProductAttributes(**attributes)
            elif category == 'SERVICE':
                ServiceAttributes(**attributes)
            elif category == 'KNOWLEDGE_QUERY':
                KnowledgeAttributes(**attributes)
            else:
                GenericAttributes(**attributes)
        except Exception as e:
            raise ValueError(f"Invalid attributes for category {category}: {str(e)}")
        
        return values

# ============================================================================
# ENTERPRISE RESPONSE SCHEMA
# ============================================================================

class EnterpriseResponse(BaseModel):
    """Enterprise-grade response schema"""
    message: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(..., max_length=10)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    conversation_id: str = Field(..., max_length=100)
    
    # Quality and governance
    quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    hitl_required: bool = Field(default=False)
    approval_id: Optional[str] = Field(None, max_length=100)
    
    # Metadata
    processing_time: Optional[float] = Field(None, ge=0)
    node_path: Optional[List[str]] = Field(default_factory=list)
    error_code: Optional[str] = Field(None, max_length=50)
    
    # Audit trail
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# ENTERPRISE GUARDRAIL SCHEMA
# ============================================================================

class GuardrailResult(BaseModel):
    """Guardrail validation result"""
    passed: bool = Field(..., description="Whether guardrail passed")
    reason: Optional[str] = Field(None, description="Reason for failure")
    risk_level: Literal["low", "medium", "high", "critical"] = Field(default="low")
    action_taken: Literal["allow", "block", "escalate"] = Field(default="allow")
    
    # Specific checks
    toxicity_detected: bool = Field(default=False)
    injection_detected: bool = Field(default=False)
    pii_detected: bool = Field(default=False)
    out_of_scope: bool = Field(default=False)
    
    # Audit trail
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = Field(None, max_length=100)

# ============================================================================
# ENTERPRISE QUALITY ASSESSMENT SCHEMA
# ============================================================================

class QualityAssessment(BaseModel):
    """Quality assessment for CRAG pattern"""
    overall_score: float = Field(..., ge=0.0, le=1.0)
    
    # Component scores
    retrieval_quality: float = Field(..., ge=0.0, le=1.0)
    synthesis_quality: float = Field(..., ge=0.0, le=1.0)
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    completeness_score: float = Field(..., ge=0.0, le=1.0)
    
    # Specific metrics
    hallucination_risk: float = Field(..., ge=0.0, le=1.0)
    grounding_score: float = Field(..., ge=0.0, le=1.0)
    language_consistency: float = Field(..., ge=0.0, le=1.0)
    
    # Recommendations
    needs_retry: bool = Field(default=False)
    retry_reason: Optional[str] = Field(None, max_length=200)
    improvement_suggestions: List[str] = Field(default_factory=list)
    
    # Audit trail
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    assessor_version: str = Field(default="1.0.0")

# ============================================================================
# ENTERPRISE AUDIT TRAIL SCHEMA
# ============================================================================

class AuditTrail(BaseModel):
    """Comprehensive audit trail for enterprise compliance"""
    conversation_id: str = Field(..., max_length=100)
    user_id: Optional[str] = Field(None, max_length=100)
    session_id: Optional[str] = Field(None, max_length=100)
    
    # Request details
    user_input: str = Field(..., max_length=5000)
    detected_language: str = Field(..., max_length=10)
    intent_classification: EnterpriseIntentResult
    
    # Processing details
    node_path: List[str] = Field(default_factory=list)
    processing_time: float = Field(..., ge=0)
    quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # Governance
    guardrail_result: GuardrailResult
    hitl_required: bool = Field(default=False)
    approval_id: Optional[str] = Field(None, max_length=100)
    
    # Response details
    response_generated: bool = Field(default=False)
    response_length: Optional[int] = Field(None, ge=0)
    recommendations_count: Optional[int] = Field(None, ge=0)
    
    # Timestamps
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
