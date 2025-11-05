# Context-Aware Multi-Agent System - Roadmap to Production

**Vision:** Build a fully context-aware conversational AI that maintains user preferences across multi-turn conversations, seamlessly switches between specialized agents, and delivers a dynamic, personalized user experience.

**Current State:** ✅ Production-hardened Zep memory integration with auto-downgrade protection
**Target State:** 🎯 Multi-agent orchestration with persistent user preference memory, seamless handoffs, and proactive recommendations

---

## Table of Contents
1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Gap Analysis](#gap-analysis)
3. [Roadmap Phases](#roadmap-phases)
4. [Implementation Plan](#implementation-plan)
5. [Success Metrics](#success-metrics)

---

## Current Architecture Analysis

### What We Have (✅ Complete)

**Memory Layer (PR-D + PR-J):**
- ✅ Shared Zep service with read-before-route
- ✅ Auto-downgrade guard (self-healing on failures)
- ✅ PII redaction layer (GDPR/KVKK compliant)
- ✅ 30s positive cache, 3s negative cache
- ✅ Sticky routing for follow-ups (180s TTL)

**Supervisor Orchestration:**
- ✅ LangGraph-based hierarchical multi-agent system
- ✅ CentralSupervisor routes to domain-specific workers
- ✅ Sticky follow-up detection (`_maybe_route_sticky`)
- ✅ Memory context injection (`_apply_memory_context`)
- ✅ LangSmith tracing for observability

**Agent Contracts:**
- ✅ Frozen API types (`AgentRequest`, `AgentResponse`, `AgentContext`)
- ✅ Agent actions: `show_listings`, `ask_clarification`, `answer_qa`, `error`
- ✅ Memory passed via `conversation_capsule` and `memory` fields

**Current Memory Flow:**
```
User Message → Supervisor → Zep fetch_thread_context()
                ↓
          state["memory_context_summary"]
          state["memory_context_facts"]
          state["memory_context_recent"]
                ↓
          AgentContext.memory → Specialized Agent
```

### What's Working

**Strengths:**
1. **Read-before-route**: Supervisor fetches memory before routing decision
2. **Sticky follow-ups**: "show me" / "more" utterances route to last agent
3. **Memory injection**: Agents receive summary/facts/recent in `AgentContext`
4. **Fail-safe**: Writes continue even during Zep outages

**Current Use Cases:**
- ✅ Single-turn property search: "need a 2 bedroom in Girne"
- ✅ Follow-up clarification: "show me" → sticky to real_estate agent
- ✅ Context persistence: Conversation summary stored in Zep

---

## Gap Analysis

### What's Missing for Full Context Awareness

#### 1. **User Preference Persistence** 🔴
**Current:** Memory stores conversation summaries but doesn't extract/persist user preferences
**Gap:** No structured preference store for:
- Budget ranges
- Location preferences
- Property type preferences (villa, apartment, land)
- Lifestyle preferences (beach view, city center, quiet area)
- Deal-breakers (no ground floor, must have parking)

**Impact:** Agent has to re-ask questions on every conversation

#### 2. **Cross-Agent Memory Sharing** 🔴
**Current:** Memory is passive (summary text), agents interpret independently
**Gap:** No structured context handoff between agents:
- Real estate agent → Services agent (user wants gym near property)
- Services agent → Real estate agent (user mentioned budget in services conversation)
- No shared "working memory" for active transaction state

**Impact:** Agent switching feels disjointed, user repeats information

#### 3. **Proactive Context Utilization** 🟡
**Current:** Agents receive memory but don't proactively use it
**Gap:** Agents should:
- Pre-filter results using known preferences
- Suggest follow-up actions based on past behavior
- Anticipate needs ("You mentioned budget €200K, these are all under €195K")

**Impact:** Feels reactive, not intelligent

#### 4. **Multi-Turn Transaction State** 🔴
**Current:** Sticky routing works for follow-ups, but no transaction memory
**Gap:** No tracking of:
- Active property shortlist
- Comparison state (comparing A vs B)
- Negotiation history
- Scheduled viewings
- Pending actions ("remind me tomorrow")

**Impact:** Can't handle complex multi-step workflows

#### 5. **Preference Learning & Evolution** 🔴
**Current:** No feedback loop on user behavior
**Gap:** System doesn't learn from:
- Which properties user clicked/saved
- Which results user dismissed
- Implicit preferences (always chooses properties with pools)
- Time-based patterns (searches on weekends)

**Impact:** No personalization improvement over time

#### 6. **Context-Aware Routing** 🟡
**Current:** Router uses utterance + basic keyword detection
**Gap:** Router doesn't consider:
- Active transaction context (user in middle of property search)
- Recent agent history (just talked to real estate, unclear utterance → likely follow-up)
- User intent patterns (user always asks services after property search)

**Impact:** Router makes wrong decisions on ambiguous utterances

---

## Roadmap Phases

### Phase 1: Preference Extraction & Persistence (Sprint 6-7)
**Goal:** Extract and persist structured user preferences from conversations
**Duration:** 2 sprints (4 weeks)

**Deliverables:**
1. User preference schema (Postgres + pgvector embeddings)
2. Preference extraction pipeline (LangChain + OpenAI structured outputs)
3. Preference CRUD API for agents
4. Preference injection into agent context
5. Preference update UI (user can edit saved preferences)

**Success Metrics:**
- 80% of property searches use 3+ saved preferences
- User repeats requirements in <10% of follow-up searches
- Preference extraction accuracy >90% (human eval)

### Phase 2: Cross-Agent Memory & Transaction State (Sprint 8-9)
**Goal:** Enable seamless handoffs and multi-turn transaction tracking
**Duration:** 2 sprints (4 weeks)

**Deliverables:**
1. Shared transaction state schema (Redis + Postgres)
2. Agent handoff protocol (context serialization)
3. Working memory API (shortlist, comparisons, pending actions)
4. Transaction state UI (frontend shows active workflow)
5. Supervisor enhancements (context-aware routing with transaction state)

**Success Metrics:**
- 95% of agent switches preserve context (no re-asking)
- Multi-turn workflows complete without repetition
- Transaction state visible to user in UI

### Phase 3: Proactive Intelligence & Learning (Sprint 10-11)
**Goal:** Agents proactively use context and learn from behavior
**Duration:** 2 sprints (4 weeks)

**Deliverables:**
1. Proactive filtering (pre-apply preferences to search)
2. Anticipatory suggestions ("Based on your budget...")
3. Implicit preference learning (click tracking, dismissal signals)
4. Personalization scoring (rank results by fit to preferences)
5. Feedback loop pipeline (behavior → preference updates)

**Success Metrics:**
- 70% of search results match saved preferences without explicit filtering
- Users accept >60% of proactive suggestions
- Personalization score correlates with user satisfaction (survey)

### Phase 4: Advanced Orchestration & Context (Sprint 12-13)
**Goal:** Context-aware routing and multi-step workflows
**Duration:** 2 sprints (4 weeks)

**Deliverables:**
1. Enhanced router with transaction context
2. Multi-step workflow templates (property search → viewing → negotiation)
3. Reminder/scheduling system (follow-up actions)
4. Cross-conversation continuity (resume from previous session)
5. Proactive agent suggestions ("You were looking at properties in Girne, want to continue?")

**Success Metrics:**
- Routing accuracy >95% on ambiguous utterances with context
- Multi-step workflows complete >80% of time
- User session resumption rate >50%

---

## Implementation Plan

### Phase 1: Preference Extraction & Persistence (DETAILED)

#### 1.1 Preference Schema Design

**Database Schema:**
```sql
-- User preferences (structured storage)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,  -- 'real_estate', 'services', 'general'
    preference_type VARCHAR(50) NOT NULL,  -- 'budget', 'location', 'property_type', etc.
    value JSONB NOT NULL,  -- Structured value (range, list, single)
    confidence FLOAT DEFAULT 1.0,  -- Explicit=1.0, implicit=0.1-0.9
    source VARCHAR(50) NOT NULL,  -- 'explicit', 'inferred', 'behavior'
    extracted_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    use_count INT DEFAULT 0,
    embedding VECTOR(1536),  -- For semantic search
    metadata JSONB,
    UNIQUE(user_id, category, preference_type, value)
);

CREATE INDEX idx_user_prefs_user_category ON user_preferences(user_id, category);
CREATE INDEX idx_user_prefs_embedding ON user_preferences USING ivfflat (embedding vector_cosine_ops);

-- Preference extraction events (audit trail)
CREATE TABLE preference_extraction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    thread_id VARCHAR(255) NOT NULL,
    message_id UUID NOT NULL,
    utterance TEXT NOT NULL,
    extracted_preferences JSONB NOT NULL,
    confidence_scores JSONB NOT NULL,
    extraction_method VARCHAR(50) NOT NULL,  -- 'llm', 'rule', 'implicit'
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Preference Value Schema (JSONB):**
```json
{
  "budget": {
    "type": "range",
    "min": 150000,
    "max": 250000,
    "currency": "EUR"
  },
  "location": {
    "type": "list",
    "values": ["Girne", "Lefkosa", "Iskele"],
    "priority": [1, 2, 3]
  },
  "property_type": {
    "type": "single",
    "value": "apartment"
  },
  "bedrooms": {
    "type": "range",
    "min": 2,
    "max": 3
  },
  "features": {
    "type": "list",
    "required": ["pool", "parking"],
    "preferred": ["sea_view", "gym"],
    "dealbreakers": ["ground_floor"]
  }
}
```

#### 1.2 Extraction Pipeline

**LangChain Structured Output Chain:**
```python
# assistant/brain/preference_extraction.py

from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class PreferenceRange(BaseModel):
    type: Literal["range"] = "range"
    min: Optional[float] = None
    max: Optional[float] = None
    unit: Optional[str] = None

class PreferenceList(BaseModel):
    type: Literal["list"] = "list"
    values: List[str]
    priority: Optional[List[int]] = None

class PreferenceSingle(BaseModel):
    type: Literal["single"] = "single"
    value: str

class ExtractedPreference(BaseModel):
    category: Literal["real_estate", "services", "lifestyle"]
    preference_type: str = Field(description="Type: budget, location, property_type, bedrooms, etc.")
    value: PreferenceRange | PreferenceList | PreferenceSingle
    confidence: float = Field(ge=0.0, le=1.0, description="Extraction confidence 0-1")
    source: Literal["explicit", "inferred"]

class PreferenceExtractionOutput(BaseModel):
    preferences: List[ExtractedPreference]
    reasoning: str = Field(description="Why these preferences were extracted")

def extract_preferences_from_message(
    user_message: str,
    conversation_history: List[dict],
    existing_preferences: List[dict]
) -> PreferenceExtractionOutput:
    """
    Extract structured preferences from user utterance.

    Uses LangChain structured output parser with OpenAI function calling.
    """
    parser = PydanticOutputParser(pydantic_object=PreferenceExtractionOutput)

    prompt = PromptTemplate(
        template="""You are a preference extraction system for a real estate platform.

Analyze the user's message and extract any stated or implied preferences about:
- Budget (price range)
- Location (cities, areas, neighborhoods)
- Property type (apartment, villa, land, commercial)
- Bedrooms/bathrooms count
- Features (pool, gym, parking, sea view, etc.)
- Deal-breakers (must-haves, must-not-haves)

User Message: {user_message}

Recent Conversation:
{conversation_history}

Existing Preferences:
{existing_preferences}

Rules:
1. Mark confidence=1.0 if explicitly stated ("I want 2 bedrooms")
2. Mark confidence=0.7-0.9 if strongly implied ("looking for family home" → likely 2-3 bedrooms)
3. Mark confidence=0.4-0.6 if weakly implied
4. Don't extract if confidence <0.4
5. Update existing preferences if user modifies them
6. Source="explicit" if directly stated, "inferred" if implied

{format_instructions}
""",
        input_variables=["user_message", "conversation_history", "existing_preferences"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    from langchain.chat_models import ChatOpenAI
    from langchain.chains import LLMChain

    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
    chain = LLMChain(llm=llm, prompt=prompt)

    output = chain.run(
        user_message=user_message,
        conversation_history=format_history(conversation_history),
        existing_preferences=format_existing(existing_preferences)
    )

    return parser.parse(output)
```

#### 1.3 Preference Service API

**Service Layer:**
```python
# assistant/services/preference_service.py

from typing import List, Dict, Any, Optional
from django.db import transaction
from django.contrib.auth import get_user_model
from assistant.models import UserPreference, PreferenceExtractionEvent
from assistant.brain.preference_extraction import extract_preferences_from_message

User = get_user_model()

class PreferenceService:

    @staticmethod
    def extract_and_save(
        user_id: str,
        thread_id: str,
        message_id: str,
        user_message: str,
        conversation_history: List[dict]
    ) -> List[UserPreference]:
        """
        Extract preferences from message and persist to DB.

        Returns list of created/updated preferences.
        """
        existing = UserPreference.objects.filter(user_id=user_id).all()
        existing_data = [p.to_dict() for p in existing]

        # Extract using LLM
        extraction = extract_preferences_from_message(
            user_message=user_message,
            conversation_history=conversation_history,
            existing_preferences=existing_data
        )

        saved_prefs = []
        with transaction.atomic():
            # Log extraction event
            PreferenceExtractionEvent.objects.create(
                user_id=user_id,
                thread_id=thread_id,
                message_id=message_id,
                utterance=user_message,
                extracted_preferences=[p.dict() for p in extraction.preferences],
                confidence_scores={p.preference_type: p.confidence for p in extraction.preferences},
                extraction_method="llm"
            )

            # Upsert preferences
            for pref in extraction.preferences:
                if pref.confidence >= 0.4:  # Threshold
                    obj, created = UserPreference.objects.update_or_create(
                        user_id=user_id,
                        category=pref.category,
                        preference_type=pref.preference_type,
                        defaults={
                            "value": pref.value.dict(),
                            "confidence": pref.confidence,
                            "source": pref.source,
                            "extracted_at": now(),
                        }
                    )
                    saved_prefs.append(obj)

        return saved_prefs

    @staticmethod
    def get_active_preferences(
        user_id: str,
        category: Optional[str] = None,
        min_confidence: float = 0.5
    ) -> Dict[str, Any]:
        """
        Get active preferences for user, formatted for agent context.

        Returns:
            {
                "real_estate": {
                    "budget": {"min": 150000, "max": 250000, "currency": "EUR"},
                    "location": {"values": ["Girne", "Iskele"]},
                    ...
                },
                "services": {...},
                ...
            }
        """
        qs = UserPreference.objects.filter(
            user_id=user_id,
            confidence__gte=min_confidence
        ).order_by('-last_used_at', '-extracted_at')

        if category:
            qs = qs.filter(category=category)

        result = {}
        for pref in qs:
            if pref.category not in result:
                result[pref.category] = {}
            result[pref.category][pref.preference_type] = pref.value

        return result

    @staticmethod
    def mark_used(preference_ids: List[str]) -> None:
        """Update last_used_at and increment use_count."""
        UserPreference.objects.filter(id__in=preference_ids).update(
            last_used_at=now(),
            use_count=F('use_count') + 1
        )
```

#### 1.4 Integration with Supervisor

**Enhanced Memory Context Injection:**
```python
# assistant/brain/supervisor_graph.py

def _apply_memory_context(state: SupervisorState) -> SupervisorState:
    """
    Fetch conversational memory AND user preferences from Zep/DB.
    """
    if not read_enabled():
        return state

    thread_id = state.get("thread_id")
    user_id = state.get("user_id")

    if not thread_id:
        return state

    # Existing Zep context (conversation summary)
    context, meta = fetch_thread_context(thread_id, mode="summary")
    conversation_ctx: Dict[str, Any] = dict(state.get("conversation_ctx") or {})

    # NEW: Fetch user preferences
    from assistant.services.preference_service import PreferenceService
    preferences = {}
    if user_id:
        preferences = PreferenceService.get_active_preferences(
            user_id=user_id,
            min_confidence=0.5
        )

    if context:
        summary = context.get("context") or ""
        facts = context.get("facts") or []
        recent = context.get("recent") or []
        memory_block = {
            "summary": summary,
            "facts": facts,
            "recent": recent,
            "preferences": preferences,  # <-- NEW
        }
        conversation_ctx.setdefault("memory", {})
        conversation_ctx["memory"] = memory_block
        state = {
            **state,
            "memory_context_summary": summary,
            "memory_context_facts": facts,
            "memory_context_recent": recent,
            "user_preferences": preferences,  # <-- NEW
        }

    state = {
        **state,
        "memory_trace": meta,
        "conversation_ctx": conversation_ctx,
    }
    return state
```

**Agent Context Update:**
```python
# assistant/agents/contracts.py

class AgentContext(TypedDict, total=False):
    """Context passed to all agents."""
    user_id: str | None
    locale: Required[str]
    time: Required[str]
    conversation_capsule: NotRequired[dict[str, Any]]
    memory: NotRequired[dict[str, Any]]
    user_preferences: NotRequired[dict[str, Any]]  # <-- NEW
```

#### 1.5 Agent Utilization

**Real Estate Agent with Preference Pre-filtering:**
```python
# assistant/agents/real_estate/agent.py

def handle_property_search(request: AgentRequest) -> AgentResponse:
    """
    Property search with automatic preference application.
    """
    ctx = request["ctx"]
    user_prefs = ctx.get("user_preferences", {}).get("real_estate", {})

    # Extract search params from utterance
    params = extract_search_params(request["input"])

    # Apply saved preferences (with user override)
    if "budget" in user_prefs and "budget" not in params:
        params["budget"] = user_prefs["budget"]

    if "location" in user_prefs and "location" not in params:
        params["location"] = user_prefs["location"]["values"][0]  # Top priority

    if "bedrooms" in user_prefs and "bedrooms" not in params:
        params["bedrooms"] = user_prefs["bedrooms"]

    # Search with applied preferences
    listings = search_listings(**params)

    # Generate response with preference acknowledgment
    reply = f"Based on your preferences (budget {params['budget']['min']}-{params['budget']['max']} {params['budget']['currency']}, "
    reply += f"{params['bedrooms']['min']}-{params['bedrooms']['max']} bedrooms in {params['location']}), "
    reply += f"I found {len(listings)} properties:"

    return {
        "reply": reply,
        "actions": [
            {
                "type": "show_listings",
                "params": {"listings": [l.to_dict() for l in listings]}
            }
        ]
    }
```

#### 1.6 Background Extraction Pipeline

**Celery Task:**
```python
# assistant/tasks.py

@shared_task(bind=True, max_retries=3)
def extract_preferences_async(self, user_id: str, thread_id: str, message_id: str, user_message: str):
    """
    Background task to extract preferences from user message.

    Runs asynchronously to not block chat response.
    """
    try:
        from assistant.services.preference_service import PreferenceService
        from assistant.models import Message

        # Get conversation history
        messages = Message.objects.filter(
            thread_id=thread_id
        ).order_by('-created_at')[:10]
        history = [{"role": m.role, "content": m.content} for m in messages]

        # Extract and save
        prefs = PreferenceService.extract_and_save(
            user_id=user_id,
            thread_id=thread_id,
            message_id=message_id,
            user_message=user_message,
            conversation_history=history
        )

        logger.info(f"Extracted {len(prefs)} preferences for user {user_id}")

    except Exception as exc:
        logger.error(f"Preference extraction failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
```

**Hook into Message Creation:**
```python
# assistant/views/messages.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_message(request):
    """
    Create user message and trigger preference extraction.
    """
    # ... existing message creation logic ...

    # Trigger async preference extraction
    if message.role == 'user':
        extract_preferences_async.delay(
            user_id=str(request.user.id),
            thread_id=message.thread_id,
            message_id=str(message.id),
            user_message=message.content
        )

    return Response(...)
```

---

### Phase 2: Cross-Agent Memory & Transaction State (OVERVIEW)

#### 2.1 Transaction State Schema

**Redis-backed working memory:**
```python
# Ephemeral transaction state (Redis, TTL=1 hour)
transaction_state = {
    "user_id": "uuid",
    "thread_id": "abc123",
    "active_workflow": "property_search",
    "current_step": "reviewing_options",
    "shortlist": ["listing_1", "listing_2", "listing_3"],
    "comparison": {
        "comparing": ["listing_1", "listing_2"],
        "criteria": ["price", "location", "bedrooms"]
    },
    "pending_actions": [
        {"type": "schedule_viewing", "listing_id": "listing_1", "status": "pending"},
        {"type": "contact_agent", "listing_id": "listing_2", "status": "pending"}
    ],
    "last_agent": "real_estate",
    "handoff_context": {
        "from_agent": "real_estate",
        "to_agent": "services",
        "intent": "find_gym_near_property",
        "params": {"listing_id": "listing_1"}
    }
}
```

#### 2.2 Agent Handoff Protocol

**Handoff context serialization:**
```python
class AgentHandoff:
    """Protocol for passing context between agents."""

    @staticmethod
    def prepare_handoff(
        from_agent: str,
        to_agent: str,
        intent: str,
        params: dict,
        thread_id: str
    ) -> dict:
        """Prepare context for agent handoff."""
        handoff_ctx = {
            "from_agent": from_agent,
            "to_agent": to_agent,
            "intent": intent,
            "params": params,
            "timestamp": time.time()
        }

        # Store in Redis transaction state
        redis_key = f"txn:state:{thread_id}"
        state = redis.get(redis_key) or {}
        state["handoff_context"] = handoff_ctx
        redis.setex(redis_key, 3600, json.dumps(state))

        return handoff_ctx

    @staticmethod
    def accept_handoff(thread_id: str) -> dict:
        """Retrieve and clear handoff context."""
        redis_key = f"txn:state:{thread_id}"
        state = json.loads(redis.get(redis_key) or "{}")
        handoff_ctx = state.pop("handoff_context", None)

        if handoff_ctx:
            redis.setex(redis_key, 3600, json.dumps(state))

        return handoff_ctx
```

---

### Phase 3: Proactive Intelligence (OVERVIEW)

#### 3.1 Proactive Filtering

**Pre-apply preferences before search:**
```python
def search_with_preferences(user_id: str, query: str) -> List[Listing]:
    """Search with automatic preference application."""
    prefs = PreferenceService.get_active_preferences(user_id, category="real_estate")

    # Build filters from preferences
    filters = {}
    if "budget" in prefs:
        filters["price__gte"] = prefs["budget"]["min"]
        filters["price__lte"] = prefs["budget"]["max"]

    if "location" in prefs:
        filters["location__in"] = prefs["location"]["values"]

    if "bedrooms" in prefs:
        filters["bedrooms__gte"] = prefs["bedrooms"]["min"]
        filters["bedrooms__lte"] = prefs["bedrooms"]["max"]

    # Execute search with filters
    results = Listing.objects.filter(**filters).all()

    return results
```

#### 3.2 Implicit Learning from Behavior

**Click tracking:**
```python
@shared_task
def learn_from_click(user_id: str, listing_id: str, action: str):
    """
    Learn implicit preferences from user interactions.

    Actions: 'view', 'save', 'dismiss', 'contact'
    """
    listing = Listing.objects.get(id=listing_id)

    # Extract features from clicked listing
    features = {
        "location": listing.location,
        "price": listing.price,
        "property_type": listing.structured_data.get("property_type"),
        "bedrooms": listing.structured_data.get("bedrooms"),
        "has_pool": "pool" in listing.structured_data.get("features", []),
        "has_sea_view": "sea_view" in listing.structured_data.get("features", [])
    }

    # Update implicit preferences (lower confidence)
    if action in ["save", "contact"]:
        # Positive signal → increase confidence
        for feature, value in features.items():
            UserPreference.objects.update_or_create(
                user_id=user_id,
                category="real_estate",
                preference_type=feature,
                defaults={
                    "value": {"type": "single", "value": value},
                    "confidence": 0.6,
                    "source": "behavior"
                }
            )

    elif action == "dismiss":
        # Negative signal → add to dealbreakers
        pass  # TODO: implement negative preferences
```

---

### Phase 4: Advanced Orchestration (OVERVIEW)

#### 4.1 Context-Aware Router

**Enhanced router with transaction state:**
```python
def route_with_context(
    utterance: str,
    thread_id: str,
    user_id: str,
    transaction_state: dict
) -> str:
    """
    Route utterance considering transaction context.

    Examples:
    - User: "what about gyms nearby?" → Check transaction_state.shortlist → services agent
    - User: "show me" → Check transaction_state.last_agent → sticky route
    - User: "any updates?" → Check pending_actions → notifications agent
    """
    # Check for active workflow
    active_workflow = transaction_state.get("active_workflow")
    if active_workflow == "property_search":
        # Bias towards real_estate agent for ambiguous utterances
        if is_ambiguous(utterance):
            return "real_estate"

    # Check for follow-up context
    last_agent = transaction_state.get("last_agent")
    if last_agent and is_followup(utterance):
        return last_agent

    # Check for handoff context
    handoff = transaction_state.get("handoff_context")
    if handoff and handoff["to_agent"]:
        return handoff["to_agent"]

    # Fall back to standard router
    return standard_route(utterance, thread_id)
```

#### 4.2 Multi-Step Workflows

**Workflow templates:**
```python
WORKFLOWS = {
    "property_search_to_viewing": {
        "steps": [
            {"agent": "real_estate", "action": "search"},
            {"agent": "real_estate", "action": "shortlist"},
            {"agent": "scheduling", "action": "book_viewing"},
            {"agent": "notifications", "action": "confirm"}
        ]
    },
    "property_inquiry_to_offer": {
        "steps": [
            {"agent": "real_estate", "action": "property_details"},
            {"agent": "negotiation", "action": "initial_offer"},
            {"agent": "negotiation", "action": "counter_offer"},
            {"agent": "legal", "action": "contract_review"}
        ]
    }
}
```

---

## Success Metrics

### Phase 1: Preference Extraction
- **Extraction Accuracy**: >90% (human eval on sample)
- **Preference Reuse Rate**: 80% of searches use 3+ saved preferences
- **Repetition Reduction**: <10% of conversations have user repeat requirements
- **User Satisfaction**: 4.5/5 on "system remembers my preferences"

### Phase 2: Cross-Agent Memory
- **Handoff Success Rate**: 95% of agent switches preserve context
- **Context Loss**: <5% of conversations have context loss
- **Multi-Turn Completion**: 80% of multi-turn workflows complete successfully
- **User Satisfaction**: 4.5/5 on "conversations feel seamless"

### Phase 3: Proactive Intelligence
- **Proactive Match Rate**: 70% of results match preferences without explicit filtering
- **Suggestion Accept Rate**: >60% of proactive suggestions accepted
- **Personalization Score**: Correlation with user satisfaction >0.7
- **User Satisfaction**: 4.5/5 on "system understands my needs"

### Phase 4: Advanced Orchestration
- **Routing Accuracy**: >95% on ambiguous utterances with context
- **Workflow Completion**: >80% of multi-step workflows complete
- **Session Resumption**: >50% of users resume from previous session
- **User Satisfaction**: 4.5/5 on "system anticipates my needs"

---

## Implementation Priorities (Next Sprint)

### Immediate (Sprint 6 - Week 1-2)

**P0: Preference Schema & API**
- [ ] Create database schema (user_preferences, preference_extraction_events)
- [ ] Implement PreferenceService CRUD API
- [ ] Add preference injection to supervisor memory context
- [ ] Update agent contracts to include user_preferences field

**P0: Basic Extraction Pipeline**
- [ ] Implement LangChain structured output parser
- [ ] Create extraction prompt template
- [ ] Build extract_preferences_from_message() function
- [ ] Add Celery background task for async extraction

**P1: Integration with Existing Flow**
- [ ] Hook extraction task into message creation
- [ ] Update supervisor_graph._apply_memory_context()
- [ ] Modify real_estate agent to use preferences
- [ ] Add preference display in frontend UI

### Short-Term (Sprint 6 - Week 3-4)

**P1: Preference Management UI**
- [ ] Frontend: Display saved preferences in user profile
- [ ] Frontend: Allow manual editing of preferences
- [ ] API: PATCH endpoint for preference updates
- [ ] API: DELETE endpoint for preference removal

**P1: Testing & Validation**
- [ ] Unit tests for extraction pipeline
- [ ] Integration tests for end-to-end flow
- [ ] Human eval dataset (100 conversations)
- [ ] Accuracy benchmarking (target >90%)

**P2: Observability**
- [ ] Prometheus metrics for extraction (success/failure, latency)
- [ ] Dashboard for preference coverage by user
- [ ] Alerting on extraction failures

---

## Technical Considerations

### Performance
- **Extraction Latency**: Run async via Celery (don't block chat response)
- **Cache Preferences**: Redis cache with 5-minute TTL for hot path
- **Batch Updates**: Bulk upsert preferences to minimize DB hits

### Privacy & Compliance
- **PII Redaction**: Apply existing PII redaction to preference values
- **User Consent**: Explicit opt-in for preference storage
- **Data Retention**: 90-day TTL on inactive preferences
- **GDPR Right to Deletion**: CASCADE delete on user deletion

### Scalability
- **Embedding Generation**: Batch via Celery, reuse OpenAI embeddings
- **Vector Search**: Use pgvector with IVFFlat index
- **Sharding**: Partition by user_id for horizontal scaling

### Monitoring
- **Extraction Accuracy**: Weekly human eval on random sample
- **Preference Staleness**: Alert on preferences >30 days old
- **Reuse Rate**: Track preference use_count distribution
- **User Feedback**: In-app thumbs up/down on preference application

---

## Dependencies

### External Services
- **OpenAI API**: For LLM-based extraction (structured outputs)
- **Zep**: For conversation memory (already integrated)
- **Redis**: For transaction state caching
- **Postgres + pgvector**: For preference storage and vector search

### Internal Systems
- **Celery**: For async preference extraction
- **LangChain**: For structured output parsing
- **Django ORM**: For preference CRUD
- **Supervisor Graph**: For memory injection

---

## Risks & Mitigations

### Risk 1: Low Extraction Accuracy
**Impact:** Users don't trust saved preferences
**Mitigation:**
- Human-in-the-loop validation for first 1,000 extractions
- Confidence threshold (only save if >0.4)
- Allow manual editing/deletion

### Risk 2: Stale Preferences
**Impact:** System uses outdated preferences
**Mitigation:**
- TTL-based decay (reduce confidence over time)
- Re-extraction on explicit contradiction
- Periodic "preference review" prompts

### Risk 3: Privacy Concerns
**Impact:** Users uncomfortable with preference storage
**Mitigation:**
- Explicit opt-in during onboarding
- Clear UI showing what's stored
- Easy deletion mechanism
- Comply with GDPR/KVKK

### Risk 4: Performance Degradation
**Impact:** Extraction tasks slow down system
**Mitigation:**
- Async processing (Celery)
- Circuit breaker on OpenAI API failures
- Fallback to rule-based extraction
- Rate limiting (max 1 extraction per message)

---

## Next Steps

**Immediate Actions:**
1. ✅ Review this roadmap with product team
2. ⬜ Create Sprint 6 detailed task breakdown
3. ⬜ Set up database migrations for preference schema
4. ⬜ Implement basic extraction pipeline (MVP)
5. ⬜ Integrate with supervisor memory context
6. ⬜ Deploy to staging for internal testing

**Success Criteria for Sprint 6:**
- [ ] Preference extraction works end-to-end
- [ ] Preferences persisted to database
- [ ] Preferences injected into agent context
- [ ] Real estate agent uses preferences in search
- [ ] Frontend displays saved preferences
- [ ] 90% extraction accuracy on test dataset

---

**Last Updated:** 2025-11-03
**Author:** Claude Code
**Status:** Draft for Review
