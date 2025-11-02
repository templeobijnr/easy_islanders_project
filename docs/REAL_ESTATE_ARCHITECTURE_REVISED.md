# Real Estate Architecture - Revised Structure

**Clean Separation**: Domain app (`real_estate`) + Centralized agents (`assistant/agents/real_estate`)

---

## 🏗️ Recommended Structure

```
easy_islanders_project/
│
├── real_estate/                          # Django App - Domain Logic
│   ├── __init__.py
│   ├── apps.py
│   ├── admin.py
│   ├── urls.py
│   │
│   ├── models/                           # Domain Models
│   │   ├── __init__.py
│   │   ├── property.py                   # Property model
│   │   ├── rental.py                     # Rental-specific models
│   │   ├── amenity.py                    # Amenity catalog
│   │   └── location.py                   # Location hierarchy
│   │
│   ├── managers/                         # Custom QuerySets
│   │   ├── __init__.py
│   │   └── property_manager.py           # Intelligent filtering
│   │
│   ├── services/                         # Business Logic Layer
│   │   ├── __init__.py
│   │   ├── search_service.py             # Search with margins
│   │   ├── recommendation_service.py     # Recommendation tracking
│   │   └── pricing_service.py            # Price intelligence
│   │
│   ├── serializers/                      # DRF Serializers
│   │   ├── __init__.py
│   │   ├── property_serializer.py
│   │   └── search_serializer.py
│   │
│   ├── views/                            # API Views
│   │   ├── __init__.py
│   │   ├── property_views.py
│   │   └── search_views.py
│   │
│   ├── utils/                            # Domain Utilities
│   │   ├── __init__.py
│   │   ├── location_utils.py             # Location normalization
│   │   ├── pricing_utils.py              # Margin calculations
│   │   └── filters.py                    # Intelligent filters
│   │
│   ├── migrations/
│   └── tests/
│       ├── test_models.py
│       ├── test_services.py
│       └── test_utils.py
│
├── assistant/                            # AI Agent Infrastructure
│   ├── brain/
│   │   ├── agent.py                      # Supervisor agent
│   │   ├── tools/                        # General tools
│   │   │   ├── __init__.py
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── agents/                           # ⭐ ALL AGENTS LIVE HERE
│   │   ├── __init__.py
│   │   ├── base.py                       # Base agent class
│   │   │
│   │   ├── real_estate/                  # Real Estate Agent Package
│   │   │   ├── __init__.py
│   │   │   ├── agent.py                  # Main RE agent (LangGraph node)
│   │   │   ├── search_agent.py           # Search specialist
│   │   │   ├── qa_agent.py               # Q&A specialist
│   │   │   ├── tools.py                  # RE-specific LangChain tools
│   │   │   └── schemas.py                # Agent state schemas
│   │   │
│   │   ├── vehicle/                      # Future: Vehicle agent
│   │   │   └── ...
│   │   │
│   │   └── service/                      # Future: Service agent
│   │       └── ...
│   │
│   └── ...
│
└── listings/                             # Generic Listings (Keep as-is)
    ├── models.py
    └── ...
```

---

## 📐 Architecture Philosophy

### Clear Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│  real_estate/ app - Django models, business logic, API views    │
│  - Owns: Property data, search logic, domain rules              │
│  - Provides: Services, managers, serializers                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │ Uses services/models
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                      AGENT LAYER                                │
│  assistant/agents/real_estate/ - AI orchestration & tools       │
│  - Owns: Conversational logic, LangGraph nodes, tool wrappers   │
│  - Uses: real_estate.services, real_estate.models              │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits

✅ **Domain Independence** - `real_estate` app can exist without agents
✅ **Agent Centralization** - All agents in one place (`assistant/agents/`)
✅ **Clean Imports** - Agents import from domain, not vice versa
✅ **Team Structure** - Backend team owns `real_estate`, AI team owns `assistant/agents`
✅ **Testability** - Test domain logic separately from agent logic

---

## 📦 Detailed Structure

### 1. Domain App: `real_estate/`

**Purpose**: Django app handling property data, business logic, API endpoints

#### Models (`real_estate/models/`)

```python
# real_estate/models/property.py

from django.db import models
from real_estate.managers.property_manager import PropertyManager

class Property(models.Model):
    """Real estate property model."""

    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255)
    description = models.TextField()

    # Real estate specific
    property_type = models.CharField(max_length=50)  # apartment, villa, house
    rental_type = models.CharField(max_length=20)    # short_term, long_term

    # Location
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='EUR')

    # Specs
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    size_sqm = models.IntegerField(null=True)

    # Features
    is_furnished = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)

    # Relations
    amenities = models.ManyToManyField('Amenity')

    # Custom manager with intelligent filtering
    objects = PropertyManager()

    class Meta:
        db_table = 'real_estate_property'
        indexes = [
            models.Index(fields=['city', 'rental_type', 'price']),
            models.Index(fields=['bedrooms', 'price']),
        ]
```

#### Services (`real_estate/services/`)

```python
# real_estate/services/search_service.py

class PropertySearchService:
    """
    Business logic for property search.
    Used by agents and views.
    """

    @staticmethod
    def search(filters: Dict[str, Any]) -> QuerySet:
        """
        Execute intelligent property search.

        Args:
            filters: {
                'location': str,
                'price_min': float,
                'price_max': float,
                'bedrooms': int,
                'rental_type': str,
                'amenities': List[str],
                'apply_margin': bool  (default True)
            }

        Returns:
            QuerySet of Property objects
        """
        from real_estate.models import Property

        return Property.objects.search(**filters)

    @staticmethod
    def format_for_recommendation(properties: QuerySet) -> List[Dict]:
        """
        Format properties as recommendation cards.
        Used by agents to send to frontend.
        """
        return [
            {
                'id': str(p.id),
                'title': p.title,
                'description': p.description,
                'price': float(p.price),
                'currency': p.currency,
                'location': f"{p.district}, {p.city}",
                'bedrooms': p.bedrooms,
                'bathrooms': p.bathrooms,
                'property_type': p.property_type,
                'amenities': [a.slug for a in p.amenities.all()],
                'images': [img.image.url for img in p.images.all()]
            }
            for p in properties
        ]
```

#### Utils (`real_estate/utils/`)

```python
# real_estate/utils/pricing_utils.py

def apply_intelligent_price_margin(
    price_max: float,
    margin_percent: float = 10.0,
    max_absolute_margin: float = 100.0
) -> float:
    """
    Apply intelligent price margin.

    Examples:
        500-600 GBP → 500-650 GBP (50 margin)
        1000-1500 GBP → 1000-1600 GBP (100 margin, capped)
    """
    calculated_margin = price_max * (margin_percent / 100.0)
    applied_margin = min(calculated_margin, max_absolute_margin)
    return price_max + applied_margin


# real_estate/utils/location_utils.py

LOCATION_ALIASES = {
    'kyrenia': ['kyrenia', 'girne', 'keryneia'],
    'nicosia': ['nicosia', 'lefkoşa', 'lefkosa'],
    'famagusta': ['famagusta', 'magosa', 'mağusa'],
    'catalkoy': ['catalkoy', 'çatalköy'],
}

def normalize_location(location: str) -> List[str]:
    """
    Normalize location to all known aliases.

    Args:
        location: User input (e.g., "kyrenia")

    Returns:
        List of all aliases (e.g., ["kyrenia", "girne", "keryneia"])
    """
    location_lower = location.lower().strip()

    for canonical, aliases in LOCATION_ALIASES.items():
        if location_lower in aliases:
            return aliases

    return [location]
```

---

### 2. Agent Package: `assistant/agents/real_estate/`

**Purpose**: AI agents that use the `real_estate` domain app

#### Main Agent (`assistant/agents/real_estate/agent.py`)

```python
# assistant/agents/real_estate/agent.py

"""
Real Estate Agent - LangGraph node for property-related interactions.

This agent orchestrates:
- Property search
- Property questions
- Recommendation tracking
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def real_estate_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Real Estate Agent - Main entry point (LangGraph node).

    Routes to specialized sub-handlers based on intent.

    State Schema:
        user_input: str
        thread_id: str
        language: str
        intent_result: IntentResult
        routing_decision: str

    Returns:
        Updated state with agent_response and recommendations
    """
    logger.info(f"[{state['thread_id']}] Real Estate Agent activated")

    intent = state.get('intent_result')
    user_input = state['user_input']
    thread_id = state['thread_id']
    language = state.get('language', 'en')

    # Route to specialized handler
    if intent.intent_type == 'property_search':
        return handle_property_search(state)

    elif intent.intent_type == 'property_question':
        return handle_property_question(state)

    elif intent.intent_type == 'property_detail':
        return handle_property_detail(state)

    else:
        # Fallback
        return {
            **state,
            'agent_response': "I can help you search for properties. What are you looking for?",
            'final_response': "I can help you search for properties. What are you looking for?",
            'is_complete': True
        }


def handle_property_search(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle property search requests.

    Flow:
    1. Extract search criteria from user input
    2. Call real_estate.services.PropertySearchService
    3. Format results as recommendation cards
    4. Save to conversation context
    5. Return response with recommendations
    """
    from assistant.agents.real_estate.search_agent import PropertySearchAgent

    agent = PropertySearchAgent()
    return agent.execute(state)


def handle_property_question(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle questions about specific properties.

    Flow:
    1. Resolve property reference ("the first one", "listing 2")
    2. Fetch property details
    3. Answer question using RAG
    4. Return grounded answer
    """
    from assistant.agents.real_estate.qa_agent import PropertyQAAgent

    agent = PropertyQAAgent()
    return agent.execute(state)


def handle_property_detail(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle requests for detailed property information.

    Flow:
    1. Resolve property reference
    2. Fetch full property details
    3. Format comprehensive response
    4. Return with property data
    """
    from assistant.agents.real_estate.qa_agent import PropertyQAAgent

    agent = PropertyQAAgent()
    return agent.execute_detail_request(state)
```

#### Search Agent (`assistant/agents/real_estate/search_agent.py`)

```python
# assistant/agents/real_estate/search_agent.py

"""
Property Search Agent - Handles property search with intelligent filtering.
"""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class PropertySearchAgent:
    """Specialized agent for property search operations."""

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute property search with intelligent filtering.

        Steps:
        1. Extract search criteria from user input
        2. Apply intelligent margins (price, bedrooms)
        3. Execute search via real_estate.services
        4. Format results for frontend
        5. Save recommendations to context
        6. Generate response message
        """
        user_input = state['user_input']
        thread_id = state['thread_id']
        language = state.get('language', 'en')
        intent = state.get('intent_result')

        # Extract search criteria
        criteria = self._extract_criteria(user_input, intent, language)

        logger.info(f"[{thread_id}] Search criteria: {criteria}")

        # Execute search using domain service
        from real_estate.services.search_service import PropertySearchService

        properties = PropertySearchService.search(criteria)

        # Format for recommendations
        recommendations = PropertySearchService.format_for_recommendation(properties[:10])

        if recommendations:
            # Save to conversation context
            self._save_recommendations(thread_id, user_input, recommendations, criteria)

            # Generate response
            message = self._format_success_response(len(recommendations), criteria, language)

            return {
                **state,
                'agent_response': message,
                'recommendations': recommendations,
                'final_response': message,
                'is_complete': True
            }
        else:
            # No results
            message = self._format_no_results_response(criteria, language)

            return {
                **state,
                'agent_response': message,
                'recommendations': [],
                'final_response': message,
                'is_complete': True
            }

    def _extract_criteria(self, user_input: str, intent, language: str) -> Dict[str, Any]:
        """
        Extract search criteria from user input and intent.

        Returns:
            {
                'location': str,
                'price_min': float,
                'price_max': float,
                'bedrooms': int,
                'rental_type': str,
                'property_type': str,
                'amenities': List[str],
                'apply_margin': bool
            }
        """
        # Use intent attributes if available
        criteria = intent.attributes.copy() if hasattr(intent, 'attributes') else {}

        # Parse additional criteria from user input using NLU
        # (This would use a more sophisticated extraction in production)

        # Set defaults
        criteria.setdefault('apply_margin', True)
        criteria.setdefault('rental_type', 'long_term')

        return criteria

    def _save_recommendations(
        self,
        thread_id: str,
        user_input: str,
        recommendations: List[Dict],
        criteria: Dict
    ) -> None:
        """
        Save recommendations to conversation context for later reference.
        """
        from assistant.brain.memory import save_assistant_turn

        # Build context
        recommendation_details = {
            str(rec['id']): {
                'position': idx + 1,
                'title': rec['title'],
                'price': rec['price'],
                'location': rec['location'],
                'bedrooms': rec['bedrooms'],
                'property_type': rec['property_type']
            }
            for idx, rec in enumerate(recommendations)
        }

        message_context = {
            'intent_type': 'property_search',
            'tool_used': 'real_estate_search',
            'last_recommendations': [rec['id'] for rec in recommendations],
            'recommendation_details': recommendation_details,
            'search_criteria': criteria
        }

        # Save to memory
        message = self._format_success_response(len(recommendations), criteria, 'en')
        save_assistant_turn(thread_id, user_input, message, message_context)

    def _format_success_response(self, count: int, criteria: Dict, language: str) -> str:
        """Format success message in user's language."""
        location = criteria.get('location', 'the area')

        messages = {
            'en': f"I found {count} properties in {location} matching your search.",
            'tr': f"{location} bölgesinde aramanıza uygun {count} mülk buldum.",
            'ru': f"Я нашел {count} объектов в {location}, соответствующих вашему запросу."
        }

        return messages.get(language, messages['en'])

    def _format_no_results_response(self, criteria: Dict, language: str) -> str:
        """Format no results message in user's language."""
        messages = {
            'en': "I couldn't find properties matching your criteria. Would you like to adjust your search?",
            'tr': "Kriterlerinize uygun mülk bulamadım. Aramanızı genişletmek ister misiniz?",
            'ru': "Я не нашел объектов, соответствующих вашим критериям. Хотите изменить параметры поиска?"
        }

        return messages.get(language, messages['en'])
```

#### Q&A Agent (`assistant/agents/real_estate/qa_agent.py`)

```python
# assistant/agents/real_estate/qa_agent.py

"""
Property Q&A Agent - Answers questions about specific properties.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class PropertyQAAgent:
    """Specialized agent for answering property questions."""

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Answer questions about properties.

        Steps:
        1. Resolve property reference from conversation
        2. Fetch property details from database
        3. Answer question using RAG
        4. Return grounded answer
        """
        user_input = state['user_input']
        thread_id = state['thread_id']
        language = state.get('language', 'en')

        # Resolve which property the user is asking about
        property_id = self._resolve_property_reference(user_input, thread_id)

        if not property_id:
            return {
                **state,
                'agent_response': "I'm not sure which property you're asking about. Could you specify?",
                'final_response': "I'm not sure which property you're asking about. Could you specify?",
                'is_complete': True
            }

        # Fetch property from database
        property_obj = self._get_property(property_id)

        if not property_obj:
            return {
                **state,
                'agent_response': "I couldn't find that property. It may no longer be available.",
                'final_response': "I couldn't find that property. It may no longer be available.",
                'is_complete': True
            }

        # Answer the question using RAG
        answer = self._answer_question(user_input, property_obj, language)

        return {
            **state,
            'agent_response': answer,
            'final_response': answer,
            'property_referenced': str(property_id),
            'is_complete': True
        }

    def _resolve_property_reference(self, user_input: str, thread_id: str) -> Optional[str]:
        """
        Resolve conversational property reference.

        Handles:
        - "the first one" → property at position 1
        - "listing 2" → property at position 2
        - "that property" → most recent property
        """
        from assistant.brain.memory import load_recent_messages

        # Load recent messages
        messages = load_recent_messages(thread_id, limit=10)

        # Find message with recommendations
        for msg in reversed(messages):
            ctx = msg.get('message_context', {})
            if 'last_recommendations' in ctx:
                # Extract position from user input
                position = self._extract_position_reference(user_input)

                if position:
                    # Find property at that position
                    for prop_id, details in ctx['recommendation_details'].items():
                        if details['position'] == position:
                            return prop_id

                # Default to first property
                return ctx['last_recommendations'][0]

        return None

    def _extract_position_reference(self, user_input: str) -> Optional[int]:
        """
        Extract position reference from user input.

        Examples:
        - "the first one" → 1
        - "second property" → 2
        - "listing 3" → 3
        """
        text_lower = user_input.lower()

        # Check for ordinal words
        ordinals = {
            'first': 1, '1st': 1,
            'second': 2, '2nd': 2,
            'third': 3, '3rd': 3,
            'fourth': 4, '4th': 4,
            'fifth': 5, '5th': 5
        }

        for word, position in ordinals.items():
            if word in text_lower:
                return position

        # Check for "listing N"
        import re
        match = re.search(r'listing\s+(\d+)', text_lower)
        if match:
            return int(match.group(1))

        return None

    def _get_property(self, property_id: str):
        """Fetch property from database."""
        from real_estate.models import Property

        try:
            return Property.objects.prefetch_related('amenities', 'images').get(id=property_id)
        except Property.DoesNotExist:
            return None

    def _answer_question(self, question: str, property_obj, language: str) -> str:
        """
        Answer question about property using RAG.

        Grounds answer in actual property data to prevent hallucinations.
        """
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate

        llm = ChatOpenAI(model="gpt-4o", temperature=0.3)

        # Build property context
        amenities = ', '.join([a.name_en for a in property_obj.amenities.all()])

        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""Answer the question based ONLY on the property data below.
Do NOT make up information. If the answer isn't in the data, say "I don't have that information."

Property: {property_obj.title}
Type: {property_obj.property_type}
Location: {property_obj.district}, {property_obj.city}
Bedrooms: {property_obj.bedrooms}
Bathrooms: {property_obj.bathrooms}
Furnished: {'Yes' if property_obj.is_furnished else 'No'}
Pets Allowed: {'Yes' if property_obj.pets_allowed else 'No'}
Amenities: {amenities}
Description: {property_obj.description}

Respond in {language} language."""),
            ("human", "{question}")
        ])

        chain = prompt | llm
        response = chain.invoke({"question": question})

        return response.content
```

#### Tools (`assistant/agents/real_estate/tools.py`)

```python
# assistant/agents/real_estate/tools.py

"""
LangChain tools for real estate domain.
These wrap the domain services for use in LangChain/LangGraph.
"""

from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Dict, Any, List


class RealEstateSearchInput(BaseModel):
    """Input schema for property search tool."""
    location: str = Field(description="Target location (city or district)")
    price_min: float = Field(default=None, description="Minimum monthly price")
    price_max: float = Field(default=None, description="Maximum monthly price")
    bedrooms: int = Field(default=None, description="Number of bedrooms")
    rental_type: str = Field(default="long_term", description="long_term or short_term")
    property_type: str = Field(default=None, description="apartment, villa, house, studio")
    amenities: List[str] = Field(default_factory=list, description="Required amenities")


class RealEstateSearchTool(BaseTool):
    """
    Tool for searching rental properties.

    This wraps real_estate.services.PropertySearchService.
    """

    name: str = "real_estate_search"
    description: str = """Search for rental properties in North Cyprus.
    Supports intelligent filtering with price margins and bedroom flexibility."""
    args_schema: type[BaseModel] = RealEstateSearchInput

    def _run(self, **kwargs) -> Dict[str, Any]:
        """Execute property search."""
        from real_estate.services.search_service import PropertySearchService

        properties = PropertySearchService.search(kwargs)
        recommendations = PropertySearchService.format_for_recommendation(properties[:10])

        return {
            'ok': True,
            'data': recommendations,
            'total_count': properties.count(),
            'message': f"Found {len(recommendations)} properties"
        }
```

---

## 🔄 Integration with Supervisor

```python
# assistant/brain/supervisor_graph.py

def build_supervisor_graph():
    """Build supervisor with real estate agent."""
    from langgraph.graph import StateGraph, END
    from assistant.agents.real_estate.agent import real_estate_agent_node

    graph = StateGraph(SupervisorState)

    # Add real estate agent node
    graph.add_node("real_estate_agent", real_estate_agent_node)

    # Route from intent classifier
    graph.add_conditional_edges(
        "intent_classifier",
        lambda state: route_intent(state),
        {
            "property_search": "real_estate_agent",
            "property_question": "real_estate_agent",
            "property_detail": "real_estate_agent",
            # ... other routes
        }
    )

    graph.add_edge("real_estate_agent", END)

    return graph.compile()
```

---

## 📊 Data Flow

```
User: "2BR apartment in Kyrenia for 500-600 GBP"
                │
                ▼
    Supervisor Agent (intent routing)
                │
                ▼
    assistant/agents/real_estate/agent.py
        (real_estate_agent_node)
                │
                ▼
    assistant/agents/real_estate/search_agent.py
        (PropertySearchAgent.execute)
                │
                ▼
    real_estate/services/search_service.py
        (PropertySearchService.search)
                │
                ▼
    real_estate/models/property.py
        (Property.objects.search)
                │
                ▼
    real_estate/managers/property_manager.py
        (PropertyManager with intelligent filters)
                │
                ▼
    PostgreSQL Database
                │
                ▼
    Results → Format → Save to Context → Return to User
```

---

## ✅ Benefits of This Structure

| Aspect | Benefit |
|--------|---------|
| **Separation** | Domain app (`real_estate`) independent of agents |
| **Centralization** | All agents in `assistant/agents/` |
| **Reusability** | Domain services used by agents AND views |
| **Testability** | Test domain logic without agents |
| **Team Ownership** | Backend team = `real_estate/`, AI team = `assistant/agents/` |
| **Scalability** | Add new agents easily in `assistant/agents/` |
| **Clean Imports** | Agents import from domain, not vice versa |

---

## 📝 Import Patterns

```python
# ✅ CORRECT - Agents import from domain
# assistant/agents/real_estate/search_agent.py
from real_estate.services.search_service import PropertySearchService
from real_estate.models import Property

# ❌ WRONG - Domain should NOT import agents
# real_estate/services/search_service.py
from assistant.agents.real_estate.search_agent import PropertySearchAgent  # DON'T DO THIS
```

---

## 🚀 Next Steps

1. **Create `real_estate/` Django app**
2. **Implement models, managers, services**
3. **Create `assistant/agents/real_estate/` package**
4. **Implement agent nodes**
5. **Integrate with supervisor**
6. **Add tests**

---

**Ready to start implementation?** Let me know which part you want to build first!