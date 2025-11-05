# Sprint 6: User Preference Extraction - Implementation Guide

**Goal:** Implement user preference extraction and persistence system
**Duration:** 2 weeks
**Team:** Backend (2), Frontend (1), QA (1)

---

## Week 1: Backend Infrastructure

### Day 1-2: Database Schema & Migrations

**Task 1: Create Django Models**

File: `assistant/models.py`

```python
from django.db import models
from django.contrib.auth import get_user_model
from pgvector.django import VectorField
import uuid

User = get_user_model()

class UserPreference(models.Model):
    """Structured user preferences extracted from conversations."""

    CATEGORY_CHOICES = [
        ('real_estate', 'Real Estate'),
        ('services', 'Services'),
        ('lifestyle', 'Lifestyle'),
        ('general', 'General'),
    ]

    SOURCE_CHOICES = [
        ('explicit', 'Explicitly Stated'),
        ('inferred', 'Inferred from Context'),
        ('behavior', 'Learned from Behavior'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='preferences')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    preference_type = models.CharField(max_length=50, db_index=True)  # budget, location, etc.
    value = models.JSONField()  # Structured value {type: "range"|"list"|"single", ...}
    confidence = models.FloatField(default=1.0)  # 0.0 to 1.0
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='explicit')
    extracted_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    use_count = models.IntegerField(default=0)
    embedding = VectorField(dimensions=1536, null=True, blank=True)  # OpenAI ada-002
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'user_preferences'
        unique_together = [['user', 'category', 'preference_type']]
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'category', 'preference_type']),
            models.Index(fields=['-last_used_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.category}/{self.preference_type}"

    def to_dict(self):
        return {
            'id': str(self.id),
            'category': self.category,
            'preference_type': self.preference_type,
            'value': self.value,
            'confidence': self.confidence,
            'source': self.source,
            'extracted_at': self.extracted_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'use_count': self.use_count,
        }


class PreferenceExtractionEvent(models.Model):
    """Audit trail for preference extraction attempts."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    thread_id = models.CharField(max_length=255, db_index=True)
    message_id = models.UUIDField(db_index=True)
    utterance = models.TextField()
    extracted_preferences = models.JSONField()  # List of extracted prefs
    confidence_scores = models.JSONField()  # {pref_type: confidence}
    extraction_method = models.CharField(max_length=50)  # 'llm', 'rule', 'implicit'
    llm_reasoning = models.TextField(blank=True)  # LLM's reasoning
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'preference_extraction_events'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['thread_id', '-created_at']),
        ]

    def __str__(self):
        return f"Extraction for {self.user.username} at {self.created_at}"
```

**Task 2: Create Migration**

```bash
python manage.py makemigrations assistant --name add_user_preferences
python manage.py migrate assistant
```

**Task 3: Add pgvector Index**

Create migration: `assistant/migrations/0XXX_add_pgvector_index.py`

```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('assistant', '0XXX_add_user_preferences'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX user_preferences_embedding_idx
                ON user_preferences
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
            """,
            reverse_sql="DROP INDEX IF EXISTS user_preferences_embedding_idx;"
        ),
    ]
```

---

### Day 3-4: Preference Extraction Pipeline

**Task 4: Create Extraction Service**

File: `assistant/services/preference_extraction.py`

```python
"""
Preference extraction using LangChain structured outputs.
"""
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Union
import logging

logger = logging.getLogger(__name__)


# Pydantic schemas for structured output
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
    category: Literal["real_estate", "services", "lifestyle", "general"]
    preference_type: str = Field(
        description="Type: budget, location, property_type, bedrooms, bathrooms, features, etc."
    )
    value: Union[PreferenceRange, PreferenceList, PreferenceSingle]
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Extraction confidence 0-1. Use 1.0 for explicit, 0.7-0.9 for inferred, 0.4-0.6 for weak"
    )
    source: Literal["explicit", "inferred"]
    reasoning: str = Field(description="Why this preference was extracted")

class PreferenceExtractionOutput(BaseModel):
    preferences: List[ExtractedPreference]
    overall_reasoning: str = Field(description="Overall analysis of the conversation")


# Extraction prompt template
EXTRACTION_PROMPT = """You are a preference extraction system for a real estate and services platform.

Analyze the user's message and extract any stated or implied preferences about:

**Real Estate:**
- Budget (price range with currency)
- Location (cities, neighborhoods, areas)
- Property type (apartment, villa, land, commercial, office)
- Bedrooms/bathrooms count (exact or range)
- Property size (square meters, exact or range)
- Features (pool, gym, parking, sea_view, garden, balcony, furnished, etc.)
- Deal-breakers (must-haves, must-not-haves)

**Services:**
- Service types (pharmacy, gym, restaurant, school, hospital)
- Location preferences
- Operating hours preferences
- Distance constraints

**Lifestyle:**
- Neighborhood vibe (quiet, city center, beach area, family-friendly)
- Commute preferences
- Amenities importance

**Confidence Guidelines:**
- 1.0: Explicitly stated ("I want 2 bedrooms", "budget is 200k EUR")
- 0.8-0.9: Strongly implied ("looking for family home" → likely 2-3 bedrooms)
- 0.6-0.7: Moderately implied ("near the beach" → sea_view might be important)
- 0.4-0.5: Weakly implied
- <0.4: Don't extract (too uncertain)

**Important:**
- Only extract if confidence ≥ 0.4
- If user updates a preference, mark it as explicit with confidence 1.0
- Consider conversation history for context
- Don't hallucinate - only extract what's clearly present

**User Message:**
{user_message}

**Recent Conversation History:**
{conversation_history}

**Existing Preferences (for context):**
{existing_preferences}

{format_instructions}
"""


class PreferenceExtractor:
    """Service for extracting structured preferences from conversation."""

    def __init__(self, model: str = "gpt-4-turbo-preview", temperature: float = 0.0):
        self.llm = ChatOpenAI(model=model, temperature=temperature)
        self.parser = PydanticOutputParser(pydantic_object=PreferenceExtractionOutput)
        self.prompt = PromptTemplate(
            template=EXTRACTION_PROMPT,
            input_variables=["user_message", "conversation_history", "existing_preferences"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )

    def extract(
        self,
        user_message: str,
        conversation_history: List[dict],
        existing_preferences: List[dict]
    ) -> PreferenceExtractionOutput:
        """
        Extract preferences from user message.

        Args:
            user_message: Current user utterance
            conversation_history: Recent messages [{"role": "user|assistant", "content": "..."}]
            existing_preferences: Current preferences for context

        Returns:
            PreferenceExtractionOutput with extracted preferences
        """
        try:
            # Format inputs
            history_str = self._format_history(conversation_history)
            prefs_str = self._format_existing(existing_preferences)

            # Generate prompt
            prompt_value = self.prompt.format_prompt(
                user_message=user_message,
                conversation_history=history_str,
                existing_preferences=prefs_str
            )

            # Call LLM
            output = self.llm.invoke(prompt_value.to_string())

            # Parse structured output
            result = self.parser.parse(output.content)

            logger.info(
                f"Extracted {len(result.preferences)} preferences with confidences: "
                f"{[p.confidence for p in result.preferences]}"
            )

            return result

        except Exception as exc:
            logger.error(f"Preference extraction failed: {exc}", exc_info=True)
            # Return empty result on failure
            return PreferenceExtractionOutput(
                preferences=[],
                overall_reasoning=f"Extraction failed: {str(exc)}"
            )

    def _format_history(self, history: List[dict]) -> str:
        """Format conversation history for prompt."""
        if not history:
            return "(No previous conversation)"

        lines = []
        for msg in history[-5:]:  # Last 5 messages
            role = msg.get("role", "unknown").capitalize()
            content = msg.get("content", "")
            lines.append(f"{role}: {content}")

        return "\n".join(lines)

    def _format_existing(self, prefs: List[dict]) -> str:
        """Format existing preferences for prompt."""
        if not prefs:
            return "(No existing preferences)"

        lines = []
        for pref in prefs:
            cat = pref.get("category", "unknown")
            ptype = pref.get("preference_type", "unknown")
            value = pref.get("value", {})
            conf = pref.get("confidence", 0)
            lines.append(f"- {cat}/{ptype}: {value} (confidence: {conf:.2f})")

        return "\n".join(lines)
```

**Task 5: Create Preference Service**

File: `assistant/services/preference_service.py`

```python
"""
Service layer for user preference management.
"""
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from django.db.models import F
from django.contrib.auth import get_user_model
from assistant.models import UserPreference, PreferenceExtractionEvent
from assistant.services.preference_extraction import PreferenceExtractor
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class PreferenceService:
    """Service for preference CRUD and extraction."""

    extractor = PreferenceExtractor()

    @classmethod
    def extract_and_save(
        cls,
        user_id: str,
        thread_id: str,
        message_id: str,
        user_message: str,
        conversation_history: List[dict]
    ) -> List[UserPreference]:
        """
        Extract preferences from message and persist to DB.

        Returns:
            List of created/updated UserPreference objects
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found")
            return []

        # Get existing preferences for context
        existing = UserPreference.objects.filter(user=user).all()
        existing_data = [p.to_dict() for p in existing]

        # Extract using LLM
        extraction = cls.extractor.extract(
            user_message=user_message,
            conversation_history=conversation_history,
            existing_preferences=existing_data
        )

        saved_prefs = []
        with transaction.atomic():
            # Log extraction event
            PreferenceExtractionEvent.objects.create(
                user=user,
                thread_id=thread_id,
                message_id=message_id,
                utterance=user_message,
                extracted_preferences=[p.dict() for p in extraction.preferences],
                confidence_scores={p.preference_type: p.confidence for p in extraction.preferences},
                extraction_method="llm",
                llm_reasoning=extraction.overall_reasoning
            )

            # Upsert preferences (only if confidence >= threshold)
            for pref in extraction.preferences:
                if pref.confidence >= 0.4:  # Confidence threshold
                    obj, created = UserPreference.objects.update_or_create(
                        user=user,
                        category=pref.category,
                        preference_type=pref.preference_type,
                        defaults={
                            "value": pref.value.dict(),
                            "confidence": pref.confidence,
                            "source": pref.source,
                            "extracted_at": timezone.now(),
                            "metadata": {"reasoning": pref.reasoning}
                        }
                    )
                    saved_prefs.append(obj)
                    action = "created" if created else "updated"
                    logger.info(
                        f"Preference {action}: {obj.category}/{obj.preference_type} "
                        f"(confidence: {obj.confidence:.2f})"
                    )

        return saved_prefs

    @classmethod
    def get_active_preferences(
        cls,
        user_id: str,
        category: Optional[str] = None,
        min_confidence: float = 0.5
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get active preferences for user, formatted for agent context.

        Args:
            user_id: User UUID
            category: Filter by category (optional)
            min_confidence: Minimum confidence threshold

        Returns:
            {
                "real_estate": {
                    "budget": {"type": "range", "min": 150000, "max": 250000, "currency": "EUR"},
                    "location": {"type": "list", "values": ["Girne", "Iskele"]},
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

    @classmethod
    def mark_used(cls, preference_ids: List[str]) -> int:
        """
        Update last_used_at and increment use_count for preferences.

        Returns:
            Number of preferences updated
        """
        return UserPreference.objects.filter(id__in=preference_ids).update(
            last_used_at=timezone.now(),
            use_count=F('use_count') + 1
        )

    @classmethod
    def delete_preference(cls, user_id: str, preference_id: str) -> bool:
        """Delete a user preference."""
        try:
            UserPreference.objects.filter(
                id=preference_id,
                user_id=user_id
            ).delete()
            return True
        except Exception as exc:
            logger.error(f"Failed to delete preference: {exc}")
            return False

    @classmethod
    def update_preference(
        cls,
        user_id: str,
        preference_id: str,
        value: dict,
        confidence: Optional[float] = None
    ) -> Optional[UserPreference]:
        """Update a user preference (manual edit)."""
        try:
            pref = UserPreference.objects.get(id=preference_id, user_id=user_id)
            pref.value = value
            if confidence is not None:
                pref.confidence = confidence
            pref.source = "explicit"  # Manual edits are explicit
            pref.save()
            return pref
        except UserPreference.DoesNotExist:
            logger.error(f"Preference {preference_id} not found")
            return None
```

---

### Day 5: Background Task Integration

**Task 6: Create Celery Task**

File: `assistant/tasks.py` (add to existing file)

```python
from celery import shared_task
from assistant.services.preference_service import PreferenceService
from assistant.models import Message
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def extract_preferences_async(
    self,
    user_id: str,
    thread_id: str,
    message_id: str,
    user_message: str
):
    """
    Background task to extract preferences from user message.

    Runs asynchronously to not block chat response.
    """
    try:
        # Get recent conversation history
        messages = Message.objects.filter(
            thread_id=thread_id
        ).order_by('-created_at')[:10]

        history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(messages)
        ]

        # Extract and save
        prefs = PreferenceService.extract_and_save(
            user_id=user_id,
            thread_id=thread_id,
            message_id=message_id,
            user_message=user_message,
            conversation_history=history
        )

        logger.info(
            f"Extracted {len(prefs)} preferences for user {user_id}, "
            f"thread {thread_id}"
        )

        return {
            "success": True,
            "preferences_count": len(prefs),
            "preference_types": [p.preference_type for p in prefs]
        }

    except Exception as exc:
        logger.error(f"Preference extraction task failed: {exc}", exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## Week 2: Supervisor Integration & Frontend

### Day 6-7: Supervisor Memory Context Enhancement

**Task 7: Update Supervisor Graph**

File: `assistant/brain/supervisor_graph.py`

```python
# Existing imports...
from assistant.services.preference_service import PreferenceService

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
    preferences = {}
    if user_id:
        try:
            preferences = PreferenceService.get_active_preferences(
                user_id=str(user_id),
                min_confidence=0.5
            )
            logger.info(
                f"[{thread_id}] Loaded preferences: "
                f"{list(preferences.keys())}"
            )
        except Exception as exc:
            logger.warning(f"Failed to load preferences: {exc}")
            preferences = {}

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
        if isinstance(meta, dict):
            meta["context_chars"] = len(summary)
            meta["preferences_loaded"] = bool(preferences)
    else:
        meta.setdefault("used", False)

    state = {
        **state,
        "memory_trace": meta,
        "conversation_ctx": conversation_ctx,
    }
    return state
```

**Task 8: Update Agent Contracts**

File: `assistant/agents/contracts.py`

```python
class AgentContext(TypedDict, total=False):
    """Context passed to all agents."""
    user_id: str | None
    locale: Required[str]
    time: Required[str]
    conversation_capsule: NotRequired[dict[str, Any]]
    memory: NotRequired[dict[str, Any]]
    user_preferences: NotRequired[dict[str, Any]]  # <-- NEW
```

---

### Day 8-9: Real Estate Agent Integration

**Task 9: Update Real Estate Agent to Use Preferences**

File: `assistant/agents/real_estate/agent.py` (create or update)

```python
def handle_property_search(request: AgentRequest) -> AgentResponse:
    """
    Property search with automatic preference application.
    """
    ctx = request["ctx"]
    user_input = request["input"]
    user_prefs = ctx.get("user_preferences", {}).get("real_estate", {})

    # Extract explicit params from utterance
    explicit_params = extract_search_params(user_input)

    # Build search params: explicit > preferences > defaults
    params = {}
    auto_applied = []

    # Budget
    if "budget" in explicit_params:
        params["price_min"] = explicit_params["budget"].get("min")
        params["price_max"] = explicit_params["budget"].get("max")
    elif "budget" in user_prefs:
        budget = user_prefs["budget"]
        params["price_min"] = budget.get("min")
        params["price_max"] = budget.get("max")
        auto_applied.append(f"budget {budget.get('min')}-{budget.get('max')} {budget.get('unit', 'EUR')}")

    # Location
    if "location" in explicit_params:
        params["location"] = explicit_params["location"]
    elif "location" in user_prefs:
        loc = user_prefs["location"]
        params["location"] = loc["values"][0] if loc.get("values") else None
        if params["location"]:
            auto_applied.append(f"location {params['location']}")

    # Bedrooms
    if "bedrooms" in explicit_params:
        params["bedrooms_min"] = explicit_params["bedrooms"].get("min")
        params["bedrooms_max"] = explicit_params["bedrooms"].get("max")
    elif "bedrooms" in user_prefs:
        beds = user_prefs["bedrooms"]
        params["bedrooms_min"] = beds.get("min")
        params["bedrooms_max"] = beds.get("max")
        if params["bedrooms_min"] or params["bedrooms_max"]:
            auto_applied.append(f"{params['bedrooms_min']}-{params['bedrooms_max']} bedrooms")

    # Execute search
    from listings.models import Listing
    qs = Listing.objects.filter(is_active=True, is_published=True)

    if params.get("price_min"):
        qs = qs.filter(price__gte=params["price_min"])
    if params.get("price_max"):
        qs = qs.filter(price__lte=params["price_max"])
    if params.get("location"):
        qs = qs.filter(location__icontains=params["location"])
    if params.get("bedrooms_min"):
        qs = qs.filter(structured_data__bedrooms__gte=params["bedrooms_min"])
    if params.get("bedrooms_max"):
        qs = qs.filter(structured_data__bedrooms__lte=params["bedrooms_max"])

    listings = qs.order_by('-created_at')[:20]

    # Generate response
    reply = ""
    if auto_applied:
        reply = f"Based on your preferences ({', '.join(auto_applied)}), "
    else:
        reply = "Here are the "

    reply += f"I found {listings.count()} properties"

    if params.get("location"):
        reply += f" in {params['location']}"

    reply += ":"

    # Mark preferences as used
    if user_prefs:
        pref_ids = [
            str(p.id) for p in UserPreference.objects.filter(
                user_id=ctx["user_id"],
                category="real_estate"
            )
        ]
        if pref_ids:
            PreferenceService.mark_used(pref_ids)

    return {
        "reply": reply,
        "actions": [
            {
                "type": "show_listings",
                "params": {
                    "listings": [format_listing(l) for l in listings],
                    "auto_applied_preferences": auto_applied
                }
            }
        ],
        "traces": {
            "search_params": params,
            "preferences_used": list(user_prefs.keys()),
            "auto_applied": auto_applied
        }
    }
```

---

### Day 10: Frontend Preference UI

**Task 10: Create Preferences API Endpoint**

File: `assistant/views/preferences.py` (new file)

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from assistant.services.preference_service import PreferenceService
from assistant.models import UserPreference


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_preferences(request):
    """List user's saved preferences."""
    category = request.query_params.get('category')
    min_confidence = float(request.query_params.get('min_confidence', 0.5))

    prefs = PreferenceService.get_active_preferences(
        user_id=str(request.user.id),
        category=category,
        min_confidence=min_confidence
    )

    # Also return raw preference objects for UI display
    qs = UserPreference.objects.filter(user=request.user)
    if category:
        qs = qs.filter(category=category)

    prefs_list = [p.to_dict() for p in qs.order_by('-last_used_at')]

    return Response({
        "preferences": prefs,
        "preferences_list": prefs_list
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_preference(request, preference_id):
    """Update a preference (manual edit)."""
    value = request.data.get('value')
    confidence = request.data.get('confidence')

    if not value:
        return Response(
            {"error": "value is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    pref = PreferenceService.update_preference(
        user_id=str(request.user.id),
        preference_id=preference_id,
        value=value,
        confidence=confidence
    )

    if pref:
        return Response(pref.to_dict())
    else:
        return Response(
            {"error": "Preference not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_preference(request, preference_id):
    """Delete a preference."""
    success = PreferenceService.delete_preference(
        user_id=str(request.user.id),
        preference_id=preference_id
    )

    if success:
        return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
    else:
        return Response(
            {"error": "Preference not found"},
            status=status.HTTP_404_NOT_FOUND
        )
```

**Task 11: Add URL Routes**

File: `assistant/urls.py`

```python
from django.urls import path
from assistant.views import preferences

urlpatterns = [
    # ... existing routes ...

    # Preferences API
    path('preferences/', preferences.list_preferences, name='list_preferences'),
    path('preferences/<uuid:preference_id>/', preferences.update_preference, name='update_preference'),
    path('preferences/<uuid:preference_id>/delete/', preferences.delete_preference, name='delete_preference'),
]
```

---

## Testing Checklist

### Unit Tests

**File: `tests/services/test_preference_extraction.py`**

```python
import pytest
from assistant.services.preference_extraction import PreferenceExtractor

@pytest.fixture
def extractor():
    return PreferenceExtractor()

def test_extract_budget_explicit(extractor):
    """Test explicit budget extraction."""
    result = extractor.extract(
        user_message="I want to spend between 150k and 200k EUR",
        conversation_history=[],
        existing_preferences=[]
    )

    assert len(result.preferences) >= 1
    budget_pref = [p for p in result.preferences if p.preference_type == "budget"][0]
    assert budget_pref.value.type == "range"
    assert budget_pref.value.min == 150000
    assert budget_pref.value.max == 200000
    assert budget_pref.confidence == 1.0

def test_extract_location_implicit(extractor):
    """Test implicit location extraction."""
    result = extractor.extract(
        user_message="looking for something near the beach",
        conversation_history=[],
        existing_preferences=[]
    )

    # Should extract sea_view or beach_area preference
    assert len(result.preferences) >= 1
    assert any(p.confidence < 1.0 for p in result.preferences)  # Implicit

# Add more tests...
```

### Integration Tests

```bash
# Test end-to-end extraction flow
pytest tests/integration/test_preference_flow.py -v

# Test supervisor integration
pytest tests/brain/test_supervisor_with_preferences.py -v

# Test API endpoints
pytest tests/api/test_preferences_api.py -v
```

### Manual Testing

```bash
# 1. Create test user
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.create_user('test_prefs', 'test@example.com', 'password123')

# 2. Trigger extraction
curl -X POST http://localhost:8000/api/chat/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "I need a 2 bedroom apartment in Girne, budget 200k EUR", "thread_id": "test_123"}'

# 3. Check preferences
curl http://localhost:8000/api/preferences/ \
  -H "Authorization: Bearer $TOKEN"

# Should show:
# {
#   "preferences": {
#     "real_estate": {
#       "budget": {"type": "range", "min": 0, "max": 200000, "currency": "EUR"},
#       "location": {"type": "list", "values": ["Girne"]},
#       "bedrooms": {"type": "range", "min": 2, "max": 2}
#     }
#   }
# }
```

---

## Success Criteria

### Week 1 Completion
- [ ] Database schema created and migrated
- [ ] PreferenceExtractor working with LangChain
- [ ] PreferenceService CRUD complete
- [ ] Celery task wired to message creation
- [ ] Unit tests passing (>80% coverage)

### Week 2 Completion
- [ ] Supervisor integration complete
- [ ] Preferences injected into agent context
- [ ] Real estate agent uses preferences
- [ ] API endpoints working
- [ ] Integration tests passing
- [ ] Manual smoke test successful

### Sprint 6 Success Gates
- [ ] 90% extraction accuracy on test dataset (100 conversations)
- [ ] End-to-end flow working: message → extraction → storage → usage
- [ ] No performance degradation (<100ms overhead)
- [ ] Frontend can display/edit preferences
- [ ] Team sign-off for production deploy

---

## Next Steps (Sprint 7)

1. Frontend preference UI (React components)
2. Human eval dataset creation
3. Extraction accuracy benchmarking
4. Performance optimization (caching, batching)
5. Monitoring dashboard (Grafana)
6. Production deployment

---

**Last Updated:** 2025-11-03
**Status:** Ready for Sprint 6 Kickoff
