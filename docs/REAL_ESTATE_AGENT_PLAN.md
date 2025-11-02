# Real Estate Agent - Comprehensive Implementation Plan

**Status**: Planning Phase
**Date**: 2025-11-01
**Owner**: Agent Development Team

---

## 🎯 Executive Summary

The Real Estate Agent is a specialized AI agent designed to handle property searches, recommendations, and transactions for both **short-term rentals** and **long-term rentals** in North Cyprus. This agent will integrate deeply with the Django `listings` app, provide intelligent filtering with flexible margins, maintain conversational awareness of property details, and track recommendation cards shown to users.

---

## 📋 Table of Contents

1. [Core Requirements](#core-requirements)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Agent Capabilities](#agent-capabilities)
4. [Intelligent Filtering System](#intelligent-filtering-system)
5. [Property Knowledge Integration](#property-knowledge-integration)
6. [Recommendation Card Awareness](#recommendation-card-awareness)
7. [Database Integration](#database-integration)
8. [Implementation Phases](#implementation-phases)
9. [Technical Specifications](#technical-specifications)
10. [API Contracts](#api-contracts)
11. [Testing Strategy](#testing-strategy)
12. [Monitoring & Metrics](#monitoring--metrics)

---

## 🎯 Core Requirements

### Functional Requirements

1. **Property Search**
   - Search both short-term and long-term rental properties
   - Filter by: location, price range, bedrooms, amenities, property type
   - Intelligent price margin (e.g., 500-600 GBP → search 500-650 GBP)
   - Support multiple locations (Kyrenia, Nicosia, Famagusta, etc.)

2. **Property Knowledge**
   - Answer detailed questions about specific properties
   - Aware of amenities (pool, parking, Wi-Fi, etc.)
   - Know property features from `dynamic_fields` JSON
   - Reference properties by listing ID or conversational context

3. **Recommendation Awareness**
   - Track which properties were shown to the user
   - Reference previously shown properties ("the first one", "listing 2")
   - Maintain conversation context with last shown recommendations

4. **Conversational Intelligence**
   - Understand rental duration intent (short-term vs long-term)
   - Handle follow-up questions about specific properties
   - Clarify ambiguous requests
   - Multi-language support (EN, TR, RU, DE, PL)

### Non-Functional Requirements

1. **Performance**
   - Search latency < 500ms (p95)
   - Filter operations < 100ms
   - Support 100+ concurrent searches

2. **Scalability**
   - Handle 10,000+ listings efficiently
   - Support horizontal scaling
   - Cache frequently accessed data

3. **Reliability**
   - 99.5% uptime
   - Graceful degradation on failures
   - Comprehensive error handling

---

## 🏗️ Current Architecture Analysis

### Existing Components

#### 1. **Listings App** (`listings/models.py`)

```python
class Listing(models.Model):
    """Universal listing model for all product categories"""

    # Basic info
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, ...)  # e.g., "Real Estate"
    subcategory = models.ForeignKey(Subcategory, ...)  # e.g., "Long-Term Rental"

    # Pricing and location
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='EUR')
    location = models.CharField(max_length=255)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)

    # Dynamic fields (CRITICAL for Real Estate Agent)
    dynamic_fields = models.JSONField(default=dict, blank=True)
    # Example dynamic_fields for real estate:
    # {
    #   "bedrooms": 2,
    #   "bathrooms": 1,
    #   "property_type": "apartment",
    #   "furnished": true,
    #   "amenities": ["pool", "gym", "parking", "wifi"],
    #   "size_sqm": 85,
    #   "floor": 3,
    #   "rental_duration": "long_term",  # or "short_term"
    #   "available_from": "2025-02-01",
    #   "pets_allowed": false,
    #   "features": ["sea_view", "balcony", "air_conditioning"]
    # }

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Insights**:
- `dynamic_fields` is the primary storage for property-specific attributes
- Subcategory can differentiate short-term vs long-term rentals
- `status='active'` must be enforced in all queries
- Images are in separate `Image` model with foreign key

#### 2. **Existing Agent Infrastructure** (`assistant/brain/agent.py`)

- **LangGraph-based architecture** with 12 nodes
- **Intent classification** with `EnterpriseIntentResult`
- **Memory system** via `save_assistant_turn()` and `load_recent_messages()`
- **Tool execution** framework with `BaseTool` pattern
- **Legacy property search** handlers already exist

**Current Flow**:
```
User Input → Language Preprocessor → Guardrails → NLU → Intent Routing
→ Retrieval → Synthesis → Response
```

---

## 🤖 Agent Capabilities

### 1. **Property Search Tool** (`RealEstateSearchTool`)

**Purpose**: Search listings database with intelligent filtering

**Inputs**:
- `query` (str): Natural language query
- `rental_type` (str): "short_term" | "long_term" | "both"
- `location` (str | List[str]): Target location(s)
- `price_min` (float | None): Minimum price
- `price_max` (float | None): Maximum price with intelligent margin
- `bedrooms` (int | None): Number of bedrooms (with margin)
- `amenities` (List[str]): Required amenities
- `property_type` (str | None): "apartment" | "villa" | "house" | "studio"
- `furnished` (bool | None): Furnished requirement
- `language` (str): User language for localized responses

**Outputs**:
```python
{
    "ok": true,
    "data": [
        {
            "id": "uuid",
            "title": "2BR Apartment in Kyrenia",
            "description": "...",
            "price": 550.00,
            "currency": "GBP",
            "location": "Kyrenia",
            "bedrooms": 2,
            "bathrooms": 1,
            "property_type": "apartment",
            "amenities": ["pool", "wifi", "parking"],
            "images": ["url1", "url2"],
            "relevance_score": 0.92
        }
    ],
    "total_count": 15,
    "applied_margin": {
        "price_max_original": 600,
        "price_max_adjusted": 650,
        "margin_percent": 8.3
    }
}
```

**Implementation**:
```python
class RealEstateSearchTool(BaseTool):
    name: str = "real_estate_search"
    description: str = "Search for short-term or long-term rental properties with intelligent filtering"

    def _run(self, **kwargs) -> Dict[str, Any]:
        # Step 1: Parse and validate inputs
        filters = self._parse_filters(kwargs)

        # Step 2: Apply intelligent margins
        filters = self._apply_intelligent_margins(filters)

        # Step 3: Build Django ORM query
        queryset = self._build_queryset(filters)

        # Step 4: Apply ranking and relevance scoring
        results = self._rank_results(queryset, kwargs['query'])

        # Step 5: Format for frontend recommendation cards
        return self._format_results(results, filters)
```

---

### 2. **Property Detail Tool** (`PropertyDetailTool`)

**Purpose**: Fetch detailed information about a specific property

**Inputs**:
- `listing_id` (str | int): Property UUID or reference
- `conversation_id` (str): For context resolution
- `language` (str): User language

**Outputs**:
```python
{
    "ok": true,
    "property": {
        "id": "uuid",
        "title": "Luxury 3BR Villa with Pool",
        "description": "Full description...",
        "price": 1200.00,
        "currency": "GBP",
        "location": "Bellapais, Kyrenia",
        "details": {
            "bedrooms": 3,
            "bathrooms": 2,
            "size_sqm": 150,
            "property_type": "villa",
            "furnished": true,
            "rental_duration": "long_term",
            "available_from": "2025-03-01"
        },
        "amenities": ["private_pool", "garden", "wifi", "parking", "air_conditioning"],
        "features": ["sea_view", "mountain_view", "terrace", "bbq"],
        "images": ["url1", "url2", "url3"],
        "owner": {
            "name": "John Doe",
            "contact_available": true
        }
    }
}
```

**Use Cases**:
- "Does this property have a pool?"
- "What amenities does listing 2 have?"
- "Tell me more about the first property"
- "Is it furnished?"

---

### 3. **Property Question Answerer** (`PropertyQATool`)

**Purpose**: Answer specific questions about properties using RAG

**Inputs**:
- `question` (str): User's question
- `listing_id` (str | None): Specific property or from context
- `conversation_context` (List[Dict]): Recent messages
- `language` (str): User language

**Outputs**:
```python
{
    "ok": true,
    "answer": "Yes, this property has a private swimming pool and a gym.",
    "property_id": "uuid",
    "property_title": "2BR Apartment in Kyrenia",
    "sources": [
        {"field": "amenities", "value": ["pool", "gym"]},
        {"field": "description", "excerpt": "...private pool..."}
    ]
}
```

**Implementation Strategy**:
- Use property description + dynamic_fields for RAG
- Semantic search over property attributes
- LLM-based answer generation grounded in property data

---

### 4. **Recommendation Tracker** (Context Management)

**Purpose**: Track which properties were shown to the user for conversational reference

**Storage**: Message context metadata
```python
message_context = {
    "intent_type": "property_search",
    "last_recommendations": [123, 456, 789],  # Listing IDs
    "recommendation_details": {
        "123": {"position": 1, "title": "2BR Apartment", "price": 550},
        "456": {"position": 2, "title": "3BR Villa", "price": 1200},
        "789": {"position": 3, "title": "Studio Flat", "price": 400}
    },
    "search_criteria": {
        "rental_type": "long_term",
        "location": "Kyrenia",
        "price_max": 650
    }
}
```

**Resolution Logic**:
- "Contact the first one" → listing_id = 123
- "Tell me about listing 2" → listing_id = 456
- "Does it have a pool?" → listing_id = most recently discussed property

---

## 🎯 Intelligent Filtering System

### Price Margin Logic

**Goal**: If user asks for "500-600 GBP", show properties up to 650 GBP (8-10% margin)

**Implementation**:
```python
def apply_intelligent_price_margin(
    price_min: Optional[float],
    price_max: Optional[float],
    margin_percent: float = 10.0,
    max_absolute_margin: float = 100.0
) -> Dict[str, float]:
    """
    Apply intelligent price margin to user's budget.

    Examples:
    - 500-600 GBP → 500-650 GBP (50 GBP margin, 8.3%)
    - 1000-1500 GBP → 1000-1600 GBP (100 GBP margin, 6.7%)
    - 5000-6000 GBP → 5000-6100 GBP (100 GBP cap)
    """
    if price_max is None:
        return {"price_min": price_min, "price_max": None, "margin_applied": 0}

    # Calculate margin (percentage of max price)
    calculated_margin = price_max * (margin_percent / 100.0)

    # Cap at maximum absolute margin
    applied_margin = min(calculated_margin, max_absolute_margin)

    return {
        "price_min": price_min,
        "price_max": price_max + applied_margin,
        "margin_applied": applied_margin,
        "margin_percent": (applied_margin / price_max) * 100
    }
```

### Bedroom Flexibility

**Goal**: If user asks for "2 bedrooms", also show 3-bedroom properties (upward flex only)

**Implementation**:
```python
def apply_bedroom_flexibility(
    requested_bedrooms: Optional[int],
    upward_flex: int = 1
) -> Dict[str, Any]:
    """
    Apply bedroom flexibility (upward only).

    Examples:
    - 2 bedrooms → show 2 and 3 BR properties
    - 1 bedroom → show 1 and 2 BR properties
    - 3 bedrooms → show 3 and 4 BR properties
    """
    if requested_bedrooms is None:
        return {"min": None, "max": None}

    return {
        "min": requested_bedrooms,
        "max": requested_bedrooms + upward_flex,
        "flex_applied": upward_flex
    }
```

### Location Fuzzy Matching

**Goal**: Handle variations like "Kyrenia" = "Girne", "Catalkoy" = "Çatalköy"

**Implementation**:
```python
LOCATION_ALIASES = {
    "kyrenia": ["kyrenia", "girne", "keryneia"],
    "nicosia": ["nicosia", "lefkoşa", "lefkosa", "nicosie"],
    "famagusta": ["famagusta", "magosa", "mağusa", "gazimagusa"],
    "catalkoy": ["catalkoy", "çatalköy", "catalköy"],
    # ... more mappings
}

def normalize_location(location: str) -> List[str]:
    """
    Normalize location to all known aliases.

    Example: "kyrenia" → ["kyrenia", "girne", "keryneia"]
    """
    location_lower = location.lower().strip()

    for canonical, aliases in LOCATION_ALIASES.items():
        if location_lower in aliases:
            return aliases

    # Fuzzy match as fallback
    return [location]
```

### Combined Filter Example

**User**: "I want a villa between 500 and 600 pounds in Kyrenia"

**Parsed Filters**:
```python
{
    "rental_type": "long_term",  # Inferred from conversation
    "location": ["kyrenia", "girne", "keryneia"],
    "price_min": 500.0,
    "price_max": 650.0,  # 8.3% margin applied
    "property_type": "villa",
    "bedrooms_min": None,
    "bedrooms_max": None,
    "currency": "GBP"
}
```

**Django ORM Query**:
```python
from django.db.models import Q

queryset = Listing.objects.filter(
    category__slug='real-estate',
    subcategory__slug='long-term-rental',
    status='active',
    Q(location__icontains='kyrenia') |
    Q(location__icontains='girne') |
    Q(location__icontains='keryneia'),
    price__gte=500.0,
    price__lte=650.0,
    currency='GBP',
    dynamic_fields__property_type='villa'
).select_related('category', 'subcategory').prefetch_related('images')[:10]
```

---

## 🧠 Property Knowledge Integration

### Knowledge Sources

1. **Structured Data** (from `Listing` model):
   - `title`, `description`, `location`, `price`
   - `dynamic_fields` (amenities, features, specs)

2. **Images** (from `Image` model):
   - Associated images for visual reference

3. **Owner Information**:
   - Contact availability
   - Response time (if tracked)

### Property Context Embedding

**Goal**: Enable semantic search and QA over property details

**Implementation**:
```python
def create_property_embedding(listing: Listing) -> str:
    """
    Create a rich text representation of a property for embedding.

    This text is used for:
    - Vector similarity search
    - RAG-based question answering
    - Semantic relevance scoring
    """
    dynamic = listing.dynamic_fields or {}

    # Build rich description
    parts = [
        f"Property: {listing.title}",
        f"Type: {dynamic.get('property_type', 'property')}",
        f"Location: {listing.location}",
        f"Price: {listing.price} {listing.currency} per month",
        f"Description: {listing.description}",
    ]

    # Add bedrooms/bathrooms
    if dynamic.get('bedrooms'):
        parts.append(f"Bedrooms: {dynamic['bedrooms']}")
    if dynamic.get('bathrooms'):
        parts.append(f"Bathrooms: {dynamic['bathrooms']}")

    # Add amenities
    amenities = dynamic.get('amenities', [])
    if amenities:
        parts.append(f"Amenities: {', '.join(amenities)}")

    # Add features
    features = dynamic.get('features', [])
    if features:
        parts.append(f"Features: {', '.join(features)}")

    # Add furniture status
    if 'furnished' in dynamic:
        status = "fully furnished" if dynamic['furnished'] else "unfurnished"
        parts.append(f"Furniture: {status}")

    return "\n".join(parts)
```

### Question Answering Flow

**User**: "Does listing 2 have a pool?"

**Flow**:
1. **Resolve "listing 2"** → Fetch from last_recommendations (position 2)
2. **Fetch property details** → Get `dynamic_fields['amenities']`
3. **Check for pool** → `"pool" in amenities or "private_pool" in amenities`
4. **Generate answer**:
   - If found: "Yes, listing 2 (3BR Villa in Kyrenia) has a private swimming pool."
   - If not found: "No, listing 2 doesn't have a pool, but it has a gym and parking."

---

## 📊 Recommendation Card Awareness

### Frontend Recommendation Card Format

Assuming the frontend displays recommendation cards like:

```typescript
interface RecommendationCard {
  id: string;  // Listing UUID
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  amenities: string[];
  property_type: string;
}
```

### Backend Context Tracking

When properties are shown to the user, save to message context:

```python
def save_property_recommendations(
    conversation_id: str,
    user_input: str,
    response_message: str,
    recommendations: List[Dict[str, Any]]
) -> None:
    """
    Save assistant turn with recommendation tracking.
    """
    # Extract listing IDs and create position mapping
    recommendation_ids = [rec['id'] for rec in recommendations]

    # Build detailed tracking
    recommendation_details = {
        str(rec['id']): {
            'position': idx + 1,
            'title': rec['title'],
            'price': rec['price'],
            'location': rec['location'],
            'bedrooms': rec.get('bedrooms'),
            'property_type': rec.get('property_type')
        }
        for idx, rec in enumerate(recommendations)
    }

    message_context = {
        'intent_type': 'property_search',
        'tool_used': 'real_estate_search',
        'last_recommendations': recommendation_ids,
        'recommendation_details': recommendation_details,
        'search_criteria': {
            # Store original search parameters for refinement
        }
    }

    save_assistant_turn(
        conversation_id,
        user_input,
        response_message,
        message_context=message_context
    )
```

### Conversational Reference Resolution

**User**: "Tell me about the first one"

**Resolution Logic**:
```python
def resolve_property_reference(
    user_input: str,
    conversation_id: str
) -> Optional[str]:
    """
    Resolve conversational references to properties.

    Handles:
    - "the first one" / "first property" / "listing 1"
    - "the second one" / "second property" / "listing 2"
    - "that property" / "this one" (most recent)
    """
    # Load recent messages with recommendations
    messages = load_recent_messages(conversation_id, limit=10)

    # Find last message with recommendations
    for msg in reversed(messages):
        if msg.get('message_context', {}).get('last_recommendations'):
            recommendations = msg['message_context']['recommendation_details']

            # Parse user input for reference
            position = extract_position_reference(user_input)  # "first" → 1, "second" → 2

            if position:
                # Find property at that position
                for listing_id, details in recommendations.items():
                    if details['position'] == position:
                        return listing_id

            # If just "that one" / "this property", return first
            return msg['message_context']['last_recommendations'][0]

    return None
```

---

## 🗄️ Database Integration

### Optimized Queries

1. **Basic Property Search**:
```python
def search_properties(filters: Dict[str, Any]) -> QuerySet:
    queryset = Listing.objects.filter(
        category__slug='real-estate',
        status='active'
    ).select_related(
        'category',
        'subcategory'
    ).prefetch_related(
        'images'
    )

    # Apply filters
    if filters.get('rental_type'):
        queryset = queryset.filter(
            subcategory__slug__contains=filters['rental_type']
        )

    if filters.get('location'):
        location_q = Q()
        for loc in filters['location']:
            location_q |= Q(location__icontains=loc)
        queryset = queryset.filter(location_q)

    if filters.get('price_min'):
        queryset = queryset.filter(price__gte=filters['price_min'])

    if filters.get('price_max'):
        queryset = queryset.filter(price__lte=filters['price_max'])

    # JSON field filtering
    if filters.get('bedrooms_min'):
        queryset = queryset.filter(
            dynamic_fields__bedrooms__gte=filters['bedrooms_min']
        )

    if filters.get('property_type'):
        queryset = queryset.filter(
            dynamic_fields__property_type=filters['property_type']
        )

    return queryset.order_by('-is_featured', '-created_at')[:20]
```

2. **Property Detail Fetch**:
```python
def get_property_details(listing_id: str) -> Optional[Dict]:
    try:
        listing = Listing.objects.select_related(
            'category', 'subcategory', 'owner'
        ).prefetch_related('images').get(
            id=listing_id,
            status='active'
        )

        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'price': float(listing.price),
            'currency': listing.currency,
            'location': listing.location,
            'details': listing.dynamic_fields,
            'images': [img.image.url for img in listing.images.all()],
            'owner': {
                'name': listing.owner.get_full_name() if listing.owner else 'Owner',
                'contact_available': True
            }
        }
    except Listing.DoesNotExist:
        return None
```

### Database Indexes

**Required Indexes** for performance:

```python
class Listing(models.Model):
    class Meta:
        indexes = [
            # Existing indexes
            models.Index(fields=['category', 'status']),
            models.Index(fields=['owner', 'status']),

            # NEW: Real Estate Agent indexes
            models.Index(fields=['category', 'subcategory', 'status', 'price']),
            models.Index(fields=['location', 'status']),
            models.Index(fields=['status', '-is_featured', '-created_at']),

            # GIN index for dynamic_fields (PostgreSQL-specific)
            # models.Index(fields=['dynamic_fields'], name='idx_dynamic_fields', opclasses=['jsonb_path_ops'])
        ]
```

**Migration**:
```bash
python manage.py makemigrations --name add_real_estate_indexes
python manage.py migrate
```

---

## 🚀 Implementation Phases

### Phase 1: Core Search & Filtering (Week 1-2)

**Deliverables**:
- [ ] `RealEstateSearchTool` with intelligent margins
- [ ] Location normalization and fuzzy matching
- [ ] Bedroom flexibility logic
- [ ] Django ORM query optimization
- [ ] Database indexes
- [ ] Unit tests for filtering logic

**Acceptance Criteria**:
- Search returns relevant properties within budget
- Intelligent margin applied correctly (8-10%)
- Location aliases working ("Kyrenia" = "Girne")
- Query performance < 100ms for 10K listings

---

### Phase 2: Property Knowledge & QA (Week 3)

**Deliverables**:
- [ ] `PropertyDetailTool` for specific property fetching
- [ ] `PropertyQATool` for answering property questions
- [ ] Property embedding generation
- [ ] Vector store integration for semantic search
- [ ] RAG pipeline for grounded answers

**Acceptance Criteria**:
- Can answer "Does this have a pool?" correctly
- Can fetch property details by ID
- Semantic search returns relevant properties
- Answers are grounded in property data (no hallucinations)

---

### Phase 3: Recommendation Tracking (Week 4)

**Deliverables**:
- [ ] Recommendation context tracking in messages
- [ ] Conversational reference resolution ("the first one")
- [ ] Position-based lookup logic
- [ ] Integration with existing memory system

**Acceptance Criteria**:
- Can resolve "Tell me about listing 2"
- Can resolve "Contact the first one"
- Maintains context across conversation turns
- Works with last 5 recommendations

---

### Phase 4: Agent Integration (Week 5)

**Deliverables**:
- [ ] Real Estate Agent node in LangGraph
- [ ] Intent routing to real estate agent
- [ ] Integration with synthesis node
- [ ] End-to-end conversation flow
- [ ] Multi-language support

**Acceptance Criteria**:
- Supervisor routes real estate queries correctly
- Agent responds with formatted recommendations
- Recommendations appear as cards in frontend
- Works in English, Turkish, Russian, German, Polish

---

### Phase 5: Testing & Optimization (Week 6)

**Deliverables**:
- [ ] Integration tests for full flow
- [ ] Performance benchmarks
- [ ] Load testing (100 concurrent users)
- [ ] Monitoring dashboards
- [ ] Documentation

**Acceptance Criteria**:
- All tests pass (unit, integration, E2E)
- p95 latency < 500ms
- 99.5% success rate
- Prometheus metrics available

---

## 📐 Technical Specifications

### Tool Definitions

```python
# assistant/brain/tools/real_estate.py

from langchain_core.tools import BaseTool
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class RealEstateSearchInput(BaseModel):
    """Input schema for real estate search."""
    query: str = Field(description="Natural language search query")
    rental_type: str = Field(description="short_term, long_term, or both")
    location: Optional[str] = Field(default=None, description="Target location")
    price_min: Optional[float] = Field(default=None, description="Minimum monthly price")
    price_max: Optional[float] = Field(default=None, description="Maximum monthly price")
    bedrooms: Optional[int] = Field(default=None, description="Number of bedrooms")
    property_type: Optional[str] = Field(default=None, description="apartment, villa, house, studio")
    furnished: Optional[bool] = Field(default=None, description="Furnished requirement")
    amenities: List[str] = Field(default_factory=list, description="Required amenities")
    language: str = Field(default="en", description="User language")

class RealEstateSearchTool(BaseTool):
    name: str = "real_estate_search"
    description: str = """Search for rental properties in North Cyprus.
    Supports both short-term and long-term rentals with intelligent filtering."""
    args_schema: type[BaseModel] = RealEstateSearchInput

    def _run(self, **kwargs) -> Dict[str, Any]:
        from assistant.brain.tools.real_estate_search import execute_property_search
        return execute_property_search(**kwargs)

class PropertyDetailInput(BaseModel):
    """Input schema for property detail fetch."""
    listing_id: str = Field(description="Property UUID or conversational reference")
    conversation_id: str = Field(description="Conversation ID for context")
    language: str = Field(default="en", description="User language")

class PropertyDetailTool(BaseTool):
    name: str = "property_detail"
    description: str = "Fetch detailed information about a specific property."
    args_schema: type[BaseModel] = PropertyDetailInput

    def _run(self, **kwargs) -> Dict[str, Any]:
        from assistant.brain.tools.real_estate_detail import get_property_detail
        return get_property_detail(**kwargs)

class PropertyQAInput(BaseModel):
    """Input schema for property question answering."""
    question: str = Field(description="User's question about a property")
    listing_id: Optional[str] = Field(default=None, description="Specific property ID")
    conversation_id: str = Field(description="Conversation ID for context")
    language: str = Field(default="en", description="User language")

class PropertyQATool(BaseTool):
    name: str = "property_qa"
    description: str = "Answer specific questions about properties using property data."
    args_schema: type[BaseModel] = PropertyQAInput

    def _run(self, **kwargs) -> Dict[str, Any]:
        from assistant.brain.tools.real_estate_qa import answer_property_question
        return answer_property_question(**kwargs)
```

### Agent Node

```python
# assistant/brain/agents/real_estate_agent.py

def real_estate_agent_node(state: SupervisorState) -> SupervisorState:
    """
    Real Estate Agent Node: Handle property search and questions.
    """
    logger.info(f"[{state['thread_id']}] Real Estate Agent processing...")

    user_input = state['user_input']
    thread_id = state['thread_id']
    language = detect_user_language(user_input)

    # Determine action type
    action_type = classify_real_estate_action(user_input, thread_id)

    if action_type == 'property_search':
        # Extract search criteria
        criteria = extract_search_criteria(user_input, language)

        # Execute search with intelligent filtering
        search_tool = RealEstateSearchTool()
        result = search_tool.run(**criteria)

        # Save recommendations to context
        if result['ok'] and result['data']:
            save_property_recommendations(
                thread_id,
                user_input,
                result['message'],
                result['data']
            )

        return {
            **state,
            'agent_response': result['message'],
            'recommendations': result['data'],
            'final_response': result['message'],
            'is_complete': True
        }

    elif action_type == 'property_question':
        # Answer question about specific property
        qa_tool = PropertyQATool()
        result = qa_tool.run(
            question=user_input,
            conversation_id=thread_id,
            language=language
        )

        return {
            **state,
            'agent_response': result['answer'],
            'final_response': result['answer'],
            'is_complete': True
        }

    elif action_type == 'property_detail':
        # Fetch property details
        detail_tool = PropertyDetailTool()
        result = detail_tool.run(
            listing_id=extract_listing_reference(user_input, thread_id),
            conversation_id=thread_id,
            language=language
        )

        # Generate detailed response
        response = format_property_detail_response(result['property'], language)

        return {
            **state,
            'agent_response': response,
            'final_response': response,
            'is_complete': True
        }

    else:
        # Fallback
        return {
            **state,
            'agent_response': "I'm not sure what you're looking for. Can you clarify?",
            'final_response': "I'm not sure what you're looking for. Can you clarify?",
            'is_complete': True
        }
```

---

## 📡 API Contracts

### Internal Tool API

**Search Properties**:
```python
# Input
{
    "query": "2 bedroom apartment in Kyrenia",
    "rental_type": "long_term",
    "location": "Kyrenia",
    "price_min": 500.0,
    "price_max": 600.0,
    "bedrooms": 2,
    "language": "en"
}

# Output
{
    "ok": true,
    "data": [
        {
            "id": "uuid-1",
            "title": "2BR Apartment Near Sea",
            "description": "Modern 2-bedroom...",
            "price": 550.0,
            "currency": "GBP",
            "location": "Kyrenia",
            "bedrooms": 2,
            "bathrooms": 1,
            "property_type": "apartment",
            "amenities": ["wifi", "parking", "air_conditioning"],
            "images": ["url1", "url2"],
            "relevance_score": 0.95
        }
    ],
    "total_count": 5,
    "applied_margin": {
        "price_max_original": 600,
        "price_max_adjusted": 650,
        "margin_percent": 8.3
    },
    "message": "I found 5 properties matching your search."
}
```

### Frontend-Backend WebSocket API

**Property Recommendations Message**:
```json
{
    "type": "assistant_message",
    "content": "I found 5 long-term rental apartments in Kyrenia for you.",
    "recommendations": [
        {
            "id": "uuid-1",
            "title": "2BR Apartment Near Sea",
            "description": "Modern 2-bedroom apartment...",
            "price": 550.0,
            "currency": "GBP",
            "location": "Kyrenia",
            "bedrooms": 2,
            "bathrooms": 1,
            "property_type": "apartment",
            "amenities": ["wifi", "parking", "air_conditioning"],
            "images": ["https://cdn.example.com/image1.jpg"]
        }
    ],
    "conversation_id": "thread-123",
    "timestamp": "2025-11-01T14:30:00Z"
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```python
# tests/test_real_estate_search.py

def test_intelligent_price_margin():
    """Test price margin application."""
    result = apply_intelligent_price_margin(500, 600)
    assert result['price_max'] == 650.0
    assert 8.0 <= result['margin_percent'] <= 10.0

def test_bedroom_flexibility():
    """Test bedroom upward flexibility."""
    result = apply_bedroom_flexibility(2)
    assert result['min'] == 2
    assert result['max'] == 3

def test_location_normalization():
    """Test location alias handling."""
    locations = normalize_location("kyrenia")
    assert "kyrenia" in locations
    assert "girne" in locations

def test_property_search_filters():
    """Test Django ORM filter construction."""
    filters = {
        'rental_type': 'long_term',
        'location': 'Kyrenia',
        'price_max': 650,
        'bedrooms': 2
    }
    queryset = search_properties(filters)
    assert queryset.count() > 0
```

### Integration Tests

```python
# tests/test_real_estate_agent.py

@pytest.mark.django_db
def test_real_estate_search_tool():
    """Test end-to-end property search."""
    tool = RealEstateSearchTool()
    result = tool.run(
        query="2 bedroom apartment in Kyrenia",
        rental_type="long_term",
        location="Kyrenia",
        price_max=600,
        bedrooms=2,
        language="en"
    )

    assert result['ok'] is True
    assert len(result['data']) > 0
    assert result['data'][0]['bedrooms'] in [2, 3]  # Flexibility applied
    assert result['applied_margin']['price_max_adjusted'] == 650

@pytest.mark.django_db
def test_property_qa_tool():
    """Test property question answering."""
    # Setup: Create a property with amenities
    listing = Listing.objects.create(
        title="Test Villa",
        description="Beautiful villa",
        price=1000,
        currency="GBP",
        location="Kyrenia",
        category=Category.objects.get(slug='real-estate'),
        subcategory=Subcategory.objects.get(slug='long-term-rental'),
        dynamic_fields={
            'amenities': ['pool', 'gym', 'wifi'],
            'property_type': 'villa'
        }
    )

    # Test QA
    tool = PropertyQATool()
    result = tool.run(
        question="Does this property have a pool?",
        listing_id=str(listing.id),
        conversation_id="test-123",
        language="en"
    )

    assert result['ok'] is True
    assert 'pool' in result['answer'].lower()
    assert 'yes' in result['answer'].lower()
```

---

## 📊 Monitoring & Metrics

### Prometheus Metrics

```python
# assistant/monitoring/metrics.py

from prometheus_client import Counter, Histogram, Gauge

# Real Estate Agent Metrics
re_agent_requests_total = Counter(
    'real_estate_agent_requests_total',
    'Total real estate agent requests',
    ['action_type', 'rental_type', 'language']
)

re_agent_search_latency = Histogram(
    'real_estate_agent_search_latency_seconds',
    'Real estate search latency',
    ['rental_type']
)

re_agent_search_results_count = Histogram(
    'real_estate_agent_search_results_count',
    'Number of search results returned',
    buckets=[0, 1, 5, 10, 20, 50]
)

re_agent_margin_applied = Histogram(
    'real_estate_agent_margin_applied_percent',
    'Price margin applied percentage',
    buckets=[0, 5, 8, 10, 15, 20]
)

re_agent_errors_total = Counter(
    'real_estate_agent_errors_total',
    'Total real estate agent errors',
    ['error_type', 'action_type']
)
```

### Grafana Dashboard

**Key Panels**:
1. Request Rate (by action type)
2. Search Latency (p50, p95, p99)
3. Result Count Distribution
4. Margin Application Rate
5. Error Rate
6. Successful Searches vs No Results

---

## 📚 Documentation

### User-Facing Documentation

**Property Search Examples**:
- "I want a 2-bedroom apartment in Kyrenia for 500-600 GBP per month"
- "Show me long-term rentals in Catalkoy"
- "Do you have any villas with a pool?"
- "What's available in Girne under 800 pounds?"

**Property Question Examples**:
- "Does listing 2 have parking?"
- "Tell me more about the first property"
- "Is it furnished?"
- "How many bathrooms does it have?"

**Conversational References**:
- "Contact the agent for the first one"
- "Show me more photos of listing 3"
- "What's the address of that apartment?"

### Developer Documentation

**Adding New Amenities**:
```python
# Update AMENITY_MAPPING in assistant/brain/tools/real_estate_search.py
AMENITY_MAPPING = {
    'pool': ['pool', 'swimming pool', 'private pool', 'shared pool'],
    'gym': ['gym', 'fitness center', 'workout room'],
    'parking': ['parking', 'garage', 'car park'],
    'wifi': ['wifi', 'wi-fi', 'internet', 'wireless'],
    # Add new amenity here
}
```

**Adding New Property Types**:
```python
# Update PROPERTY_TYPE_MAPPING in assistant/brain/tools/real_estate_search.py
PROPERTY_TYPE_MAPPING = {
    'apartment': ['apartment', 'flat', 'unit'],
    'villa': ['villa', 'detached villa'],
    'house': ['house', 'townhouse', 'bungalow'],
    'studio': ['studio', 'studio apartment'],
    # Add new property type here
}
```

---

## ✅ Success Criteria

### Functional Success

- [ ] Can search properties by location, price, bedrooms
- [ ] Intelligent margin applied correctly (8-10%)
- [ ] Can answer property-specific questions
- [ ] Can resolve conversational references ("the first one")
- [ ] Multi-language support working (EN, TR, RU, DE, PL)

### Performance Success

- [ ] Search latency < 500ms (p95)
- [ ] Filter latency < 100ms
- [ ] Support 100+ concurrent searches
- [ ] Database queries optimized (< 50ms)

### Quality Success

- [ ] 99.5% success rate
- [ ] Zero hallucinations (grounded answers only)
- [ ] Accurate margin application
- [ ] Correct reference resolution

---

## 🚧 Known Limitations & Future Work

### Current Limitations

1. **No Image Analysis**: Cannot answer visual questions like "Show me properties with modern kitchens"
2. **No Availability Tracking**: Doesn't track real-time availability or booking status
3. **No Price Negotiation**: Cannot handle price negotiation or offers
4. **Static Margins**: Margin percentages are fixed, not dynamic based on market

### Future Enhancements

1. **Visual Search**: Integrate CLIP or similar for image-based property search
2. **Availability Calendar**: Real-time booking availability tracking
3. **Price Intelligence**: Dynamic pricing suggestions based on market trends
4. **Agent Matching**: Match users with specialized real estate agents
5. **Virtual Tours**: Integration with 360° virtual tour providers
6. **Mortgage Calculator**: Built-in affordability calculator
7. **Comparison Tool**: Side-by-side property comparison

---

## 📞 Contact & Support

**Project Owner**: Agent Development Team
**Technical Lead**: [Name]
**Questions**: Slack #real-estate-agent channel

---

**Status**: Ready for Implementation
**Next Review**: Weekly sprint planning
**Last Updated**: 2025-11-01
