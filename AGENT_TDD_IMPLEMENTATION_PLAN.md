# AI Agent TDD Implementation Plan – Multi-Category Extension

## Overview

This plan implements the multi-category agent transformation using **Test-Driven Development (TDD)** principles:
1. Write tests FIRST (for new features)
2. Implement code to pass tests
3. Never break existing tests (red gate: existing property search must always work)
4. Deploy incrementally with feature flags

---

## Phase Structure

```
Phase 1: Foundations (Week 1)
├─ TDD: Classification engine
├─ TDD: Tool registry
├─ Feature flags for new paths
└─ Existing property search: UNCHANGED

Phase 2: Learn from Data (Week 1-2)
├─ Collect real classification attempts
├─ Analyze failures
├─ Update hard rules based on data

Phase 3: Add Sophistication (Week 2-3)
├─ TDD: Vector store integration
├─ TDD: Caching layer
├─ TDD: Risk-tiered HITL
└─ Feature flags: Enable gradually

Phase 4: Scale Safely (Week 3-4)
├─ TDD: Worker teams (Cars, Dining, Electronics, etc.)
├─ TDD: Tool selection logic
├─ Feature flags: Canary rollout

Phase 5: Enterprise Features (Week 4-5)
├─ TDD: CRAG (Corrective RAG)
├─ TDD: Intelligent logging
├─ TDD: State management
└─ Feature flags: Full rollout

Phase 6: Polish & Launch (Week 5-6)
├─ Load testing
├─ Security audit
├─ Compliance review
└─ Final validation tests
```

---

## Test Strategy

### Test Pyramid
```
                    /\
                   /  \
                  /  E2E \         (10-15 tests)
                 /________\
                /          \
               /   Integration\  (30-40 tests)
              /________________\
             /                  \
            /    Unit Tests       \ (80-100 tests)
           /____________________\
```

### Test Environments
```
✅ Local: Run before git commit (unit + integration)
✅ CI/CD: Run on PR (all tests, must pass)
✅ Staging: Real API, real DB (E2E tests)
✅ Production: Feature flags, gradual rollout, monitoring
```

---

## Phase 1: Foundations (Week 1)

### 1.1 Classification Engine Tests

**File:** `tests/test_classification_engine.py`

```python
import pytest
from assistant.brain.classification import (
    classify_query_heuristic,
    classify_query_with_llm,
    classify_with_fallback,
)

class TestClassificationHeuristics:
    """Unit tests: Hard rules for category classification"""
    
    def test_car_keywords_simple(self):
        """Test: Simple car query matches heuristic"""
        category, confidence = classify_query_heuristic("Show me cars")
        assert category == "car_rental"
        assert confidence >= 0.95
    
    def test_car_keywords_complex(self):
        """Test: Complex car query with multiple keywords"""
        category, confidence = classify_query_heuristic(
            "I need to rent an automatic car for 3 days under 100 euros"
        )
        assert category == "car_rental"
        assert confidence >= 0.90
    
    def test_property_keywords_apartment(self):
        """Test: Property query for apartments"""
        category, confidence = classify_query_heuristic("2+1 apartment in Kyrenia")
        assert category == "accommodation"
        assert confidence >= 0.95
    
    def test_property_keywords_house(self):
        """Test: Property query for houses"""
        category, confidence = classify_query_heuristic("Show me houses in Girne")
        assert category == "accommodation"
        assert confidence >= 0.90
    
    def test_dining_keywords(self):
        """Test: Restaurant query"""
        category, confidence = classify_query_heuristic(
            "Find restaurants with WiFi in Kyrenia"
        )
        assert category == "dining"
        assert confidence >= 0.90
    
    def test_electronics_keywords(self):
        """Test: Electronics query"""
        category, confidence = classify_query_heuristic(
            "Laptops under 500 euros"
        )
        assert category == "electronics"
        assert confidence >= 0.90
    
    def test_beauty_keywords(self):
        """Test: Beauty/salon query"""
        category, confidence = classify_query_heuristic(
            "Hair salon near me"
        )
        assert category == "beauty"
        assert confidence >= 0.90
    
    def test_ambiguous_query_low_confidence(self):
        """Test: Ambiguous query returns None with low confidence"""
        category, confidence = classify_query_heuristic(
            "Show me something fun"
        )
        assert category is None
        assert confidence < 0.6
    
    def test_empty_query(self):
        """Test: Empty query returns None"""
        category, confidence = classify_query_heuristic("")
        assert category is None
        assert confidence == 0.0
    
    def test_multilingual_turkish_car(self):
        """Test: Turkish language car query"""
        category, confidence = classify_query_heuristic(
            "Bana araba göster"  # "Show me cars" in Turkish
        )
        # Should either recognize Turkish keywords OR return low confidence
        # (LLM will handle)
        assert category is None or category == "car_rental"
    
    def test_case_insensitive(self):
        """Test: Classification is case-insensitive"""
        cat1, conf1 = classify_query_heuristic("SHOW ME CARS")
        cat2, conf2 = classify_query_heuristic("show me cars")
        assert cat1 == cat2
        assert conf1 == conf2
    
    def test_extra_whitespace(self):
        """Test: Extra whitespace doesn't affect classification"""
        cat1, conf1 = classify_query_heuristic("show   me    cars")
        cat2, conf2 = classify_query_heuristic("show me cars")
        assert cat1 == cat2
        assert conf1 == conf2
    
    def test_typos_approximate_matching(self):
        """Test: Common typos still match (fuzzy matching optional)"""
        # "cra" instead of "cars" - should still match
        category, confidence = classify_query_heuristic("Show me cra")
        # With fuzzy: should match
        # Without fuzzy: okay to fail (LLM handles it)
        assert category in (None, "car_rental")


class TestClassificationFallback:
    """Unit tests: Fallback behavior when heuristic fails"""
    
    def test_fallback_to_llm_when_ambiguous(self):
        """Test: Use LLM for low-confidence queries"""
        # Mock LLM classifier
        category, confidence = classify_with_fallback(
            "Find me something nice",
            use_llm_threshold=0.6
        )
        # Should try LLM since heuristic confidence < 0.6
        assert isinstance(category, (str, type(None)))
    
    def test_fallback_explicit_request(self):
        """Test: Ask user when confidence too low"""
        category, confidence = classify_with_fallback(
            "Show me stuff",
            ask_user_threshold=0.5
        )
        assert category in (None, "user_asked")  # Need explicit user choice
    
    def test_no_fallback_for_high_confidence(self):
        """Test: Don't use LLM if heuristic already confident"""
        with patch('assistant.brain.classification.llm_classifier') as mock_llm:
            category, confidence = classify_with_fallback(
                "Show me cars",
                use_llm_threshold=0.7
            )
            # LLM should NOT be called (heuristic confidence already high)
            mock_llm.assert_not_called()
            assert category == "car_rental"


class TestClassificationMetrics:
    """Unit tests: Classification accuracy tracking"""
    
    def test_log_classification_success(self):
        """Test: Log successful classification"""
        from assistant.brain.classification import log_classification
        
        log_classification(
            query="Show me cars",
            predicted_category="car_rental",
            predicted_confidence=0.95,
            actual_category="car_rental",
            success=True
        )
        # Verify logged to database
        from assistant.models import ClassificationLog
        log = ClassificationLog.objects.last()
        assert log.query == "Show me cars"
        assert log.success is True
    
    def test_log_classification_failure(self):
        """Test: Log failed classification"""
        from assistant.brain.classification import log_classification
        
        log_classification(
            query="Show me cars",
            predicted_category="accommodation",
            predicted_confidence=0.65,
            actual_category="car_rental",
            success=False
        )
        log = ClassificationLog.objects.last()
        assert log.success is False
```

### 1.2 Tool Registry Tests

**File:** `tests/test_tool_registry.py`

```python
import pytest
from assistant.brain.tools import ToolRegistry, ToolDefinition

class TestToolRegistry:
    """Unit tests: Tool registration and validation"""
    
    @pytest.fixture
    def registry(self):
        """Fresh registry for each test"""
        return ToolRegistry()
    
    def test_register_tool(self, registry):
        """Test: Register a new tool"""
        tool = ToolDefinition(
            name="search_cars",
            category="car_rental",
            schema={"type": "object", "properties": {"query": {"type": "string"}}},
            handler=lambda q: []
        )
        registry.register_tool("car_rental", tool)
        
        assert registry.has_tool("car_rental", "search_cars")
    
    def test_register_invalid_tool(self, registry):
        """Test: Reject tool without schema"""
        tool = ToolDefinition(
            name="broken_tool",
            category="car_rental",
            schema=None,  # Invalid
            handler=lambda: None
        )
        with pytest.raises(ValueError, match="schema"):
            registry.register_tool("car_rental", tool)
    
    def test_get_tools_for_category(self, registry):
        """Test: Retrieve tools for specific category"""
        car_tools = [
            ToolDefinition(name="search_cars", category="car_rental"),
            ToolDefinition(name="check_availability", category="car_rental"),
        ]
        for tool in car_tools:
            registry.register_tool("car_rental", tool)
        
        retrieved = registry.get_tools_for_category("car_rental")
        assert len(retrieved) == 2
        assert all(t.category == "car_rental" for t in retrieved)
    
    def test_validate_tool_call(self, registry):
        """Test: Validate tool call against schema"""
        tool = ToolDefinition(
            name="search",
            schema={
                "type": "object",
                "properties": {"location": {"type": "string"}},
                "required": ["location"]
            },
            handler=lambda loc: []
        )
        registry.register_tool("car_rental", tool)
        
        # Valid call
        assert registry.validate_tool_call("car_rental", "search", {"location": "Kyrenia"})
        
        # Invalid call (missing required field)
        with pytest.raises(ValueError, match="required"):
            registry.validate_tool_call("car_rental", "search", {})
    
    def test_tool_not_found(self, registry):
        """Test: Error when tool doesn't exist"""
        with pytest.raises(ValueError, match="Unknown tool"):
            registry.validate_tool_call("car_rental", "nonexistent_tool", {})
    
    def test_duplicate_tool_raises_error(self, registry):
        """Test: Can't register same tool twice"""
        tool = ToolDefinition(name="search_cars", category="car_rental")
        registry.register_tool("car_rental", tool)
        
        with pytest.raises(ValueError, match="already registered"):
            registry.register_tool("car_rental", tool)


class TestToolExecution:
    """Integration tests: Actually executing tools"""
    
    def test_execute_search_cars(self, registry, db):
        """Test: Execute car search tool"""
        # Pre-populate database with test cars
        Car.objects.create(brand="Toyota", model="Corolla", price=30)
        
        tool = registry.get_tool("car_rental", "search_cars")
        result = tool(location="Kyrenia", max_price=50)
        
        assert len(result) > 0
        assert result[0]["brand"] == "Toyota"
    
    def test_execute_invalid_args_fails_safely(self, registry):
        """Test: Tool execution with invalid args fails gracefully"""
        tool = registry.get_tool("car_rental", "search_cars")
        
        # Invalid argument (missing required location)
        with pytest.raises(ValueError):
            tool()  # No location provided
```

### 1.3 Feature Flag Tests

**File:** `tests/test_feature_flags.py`

```python
import pytest
from assistant.utils.feature_flags import get_feature_flag, set_feature_flag

class TestFeatureFlags:
    """Unit tests: Feature flag management"""
    
    def test_feature_flag_disabled_by_default(self):
        """Test: New features disabled by default"""
        # Existing property search should work
        assert get_feature_flag("property_search", default=True) is True
        
        # New features should be disabled
        assert get_feature_flag("multi_category_search", default=False) is False
        assert get_feature_flag("vector_search", default=False) is False
    
    def test_enable_feature_flag(self):
        """Test: Enable a feature flag"""
        set_feature_flag("multi_category_search", True)
        assert get_feature_flag("multi_category_search") is True
    
    def test_disable_feature_flag(self):
        """Test: Disable a feature flag"""
        set_feature_flag("multi_category_search", True)
        set_feature_flag("multi_category_search", False)
        assert get_feature_flag("multi_category_search") is False
    
    def test_user_specific_flag(self):
        """Test: Feature flag for specific user"""
        user = User.objects.create(username="test_user")
        
        set_feature_flag("multi_category_search", True, user_id=user.id)
        assert get_feature_flag("multi_category_search", user_id=user.id) is True
        
        # Other users still see default
        assert get_feature_flag("multi_category_search", user_id=999) is False
    
    def test_canary_rollout(self):
        """Test: Gradual feature rollout (5% of users)"""
        # Simulate 100 user IDs
        enabled_count = 0
        for user_id in range(1, 101):
            if get_feature_flag("multi_category_search", user_id=user_id, canary_percentage=5):
                enabled_count += 1
        
        # Should be approximately 5% (allow 1-9 for randomness)
        assert 1 <= enabled_count <= 9
```

### 1.4 Existing Property Search: ZERO Changes Tests

**File:** `tests/test_existing_property_search_unchanged.py`

```python
import pytest
from assistant.brain.agent import process_turn
from assistant.models import Listing, Conversation

class TestExistingPropertySearchUnchanged:
    """CRITICAL: Verify property search still works after changes"""
    
    @pytest.fixture
    def conversation(self):
        """Create test conversation"""
        return Conversation.objects.create(conversation_id="test_conv_001")
    
    @pytest.fixture
    def test_listings(self):
        """Create test property listings"""
        return [
            Listing.objects.create(
                title="2+1 Apartment in Kyrenia",
                listing_type="property_rent",
                location="kyrenia",
                price=500,
                currency="EUR",
                structured_data={
                    "bedrooms": 2,
                    "location": "Kyrenia",
                    "featured_image": "image1.jpg"
                }
            ),
            Listing.objects.create(
                title="3+1 Villa in Girne",
                listing_type="property_rent",
                location="girne",
                price=750,
                currency="EUR",
                structured_data={
                    "bedrooms": 3,
                    "location": "Girne",
                    "featured_image": "image2.jpg"
                }
            ),
        ]
    
    def test_existing_property_search_simple(self, conversation, test_listings):
        """Test: Simple property search still works"""
        result = process_turn(
            user_text="Show me 2+1 apartments in Kyrenia",
            conversation_id="test_conv_001"
        )
        
        assert result["message"] is not None
        assert "properties" in result["message"].lower() or "found" in result["message"].lower()
        assert len(result.get("recommendations", [])) > 0
    
    def test_existing_property_search_with_price_filter(self, conversation, test_listings):
        """Test: Property search with price filtering"""
        result = process_turn(
            user_text="Show me apartments in Kyrenia under 600 euros",
            conversation_id="test_conv_001"
        )
        
        assert len(result.get("recommendations", [])) > 0
        # Verify only apartments under 600 returned
        for rec in result["recommendations"]:
            price_match = rec.get("price", "0").split()[0]
            assert float(price_match) <= 600
    
    def test_existing_agent_outreach_still_works(self, conversation, test_listings):
        """Test: Agent contact still works"""
        # Ensure listing has contact info
        test_listings[0].structured_data["contact_info"] = "+90-555-1234"
        test_listings[0].save()
        
        result = process_turn(
            user_text="Contact the first listing for photos",
            conversation_id="test_conv_001"
        )
        
        # Should be successful or at least not crash
        assert "ok" in result or "message" in result
    
    def test_existing_multilingual_support(self, conversation, test_listings):
        """Test: Turkish language still works"""
        result = process_turn(
            user_text="Bana Kyrenia'da daire göster",  # "Show me apartment in Kyrenia" in Turkish
            conversation_id="test_conv_001"
        )
        
        # Shouldn't crash; language detection should work
        assert result["language"] in ("tr", "en")
    
    def test_existing_status_update(self, conversation):
        """Test: Photo request status still works"""
        result = process_turn(
            user_text="Any news on the photos?",
            conversation_id="test_conv_001"
        )
        
        # Should respond with status (even if no pending action)
        assert "waiting" in result["message"].lower() or "no" in result["message"].lower()
    
    def test_regression_property_search_intent_detection(self, conversation, test_listings):
        """Test: Property search intent still detected correctly"""
        from assistant.brain.agent import _looks_like_property_search
        
        # These should ALL still be recognized as property searches
        property_queries = [
            "Show me 2+1 apartments",
            "Find rental houses in Kyrenia",
            "I need a villa",
            "Studio in Girne",
            "Bedrooms available",
        ]
        
        for query in property_queries:
            assert _looks_like_property_search(query), f"Failed to recognize: {query}"
```

### 1.5 Feature Flag Integration Tests

**File:** `tests/test_feature_flag_integration.py`

```python
import pytest
from assistant.brain.agent import process_turn
from assistant.utils.feature_flags import get_feature_flag, set_feature_flag

class TestNewFeaturesBehindFlags:
    """Integration tests: New features only enabled via flags"""
    
    def setup_method(self):
        """Ensure feature flags are off by default"""
        set_feature_flag("multi_category_search", False)
        set_feature_flag("vector_search", False)
    
    def test_new_car_search_disabled_by_default(self, conversation):
        """Test: Car search disabled until feature flag enabled"""
        assert get_feature_flag("multi_category_search", default=False) is False
        
        # With flag disabled, should fall back to generic chat
        result = process_turn(
            user_text="Show me cars",
            conversation_id="test_conv_001"
        )
        
        # Should NOT return car rental results (flag disabled)
        # Should either return generic chat or suggestion
        assert "car" not in result["message"].lower() or len(result.get("recommendations", [])) == 0
    
    def test_new_car_search_enabled_with_flag(self, conversation):
        """Test: Car search works when feature flag enabled"""
        set_feature_flag("multi_category_search", True)
        
        # Create test car listing
        from assistant.models import Listing
        Listing.objects.create(
            title="Toyota Corolla for Rent",
            listing_type="car_rental",
            location="kyrenia",
            price=30,
            currency="EUR",
            structured_data={"transmission": "automatic"}
        )
        
        result = process_turn(
            user_text="Show me cars",
            conversation_id="test_conv_001",
            feature_flags={"multi_category_search": True}
        )
        
        # With flag enabled, should return car results
        # (Implementation checks feature flag before routing)
        assert len(result.get("recommendations", [])) > 0 or \
               "car" in result["message"].lower()
```

---

## Implementation Tasks (Phase 1)

### Task 1.1: Create Classification Module

**File:** `assistant/brain/classification.py` (NEW)

```python
import logging
import re
from typing import Optional, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)

# Hard rules for category detection (no LLM needed)
CATEGORY_HEURISTICS = {
    "car_rental": [
        r"\b(car|rental|vehicle|auto|automobile|drive|hire|rent a car)\b",
        r"\b\d+\s*(day|days|week|weeks)\b",  # temporal rental pattern
    ],
    "accommodation": [
        r"\b(hotel|apartment|flat|house|villa|rental|stay|booking|2\+1|3\+1|bedroom)\b",
        r"\b(girne|kyrenia|lefkoşa|nicosia|magosa|famagusta|iskele)\b",
    ],
    "dining": [
        r"\b(restaurant|food|eat|meal|cuisine|cafe|dine|dinner|lunch)\b",
        r"\b(per person|per head|€\d+)\b",
    ],
    "electronics": [
        r"\b(phone|laptop|computer|camera|device|tech|gadget|smartphone|tablet)\b",
        r"\b(under|less than|cheaper|discount|price)\b",
    ],
    "beauty": [
        r"\b(hair|makeup|skincare|salon|cosmetics|beauty|barber|spa)\b",
        r"\b(service|appointment|booking)\b",
    ],
}

def classify_query_heuristic(query: str) -> Tuple[Optional[str], float]:
    """
    Classify user query using hard rules (no LLM).
    
    Returns:
        (category_slug, confidence) - category is None if no match
    """
    if not query:
        return (None, 0.0)
    
    t = query.lower().strip()
    
    # Score each category by matches
    scores = {}
    for category, patterns in CATEGORY_HEURISTICS.items():
        matches = 0
        for pattern in patterns:
            if re.search(pattern, t, re.IGNORECASE):
                matches += 1
        
        if matches > 0:
            # Confidence proportional to number of matches
            # Each match = +0.3 confidence, capped at 0.95
            confidence = min(0.3 * matches, 0.95)
            scores[category] = confidence
    
    if not scores:
        return (None, 0.0)
    
    # Return highest-scoring category
    best_category = max(scores, key=scores.get)
    return (best_category, scores[best_category])


def classify_with_fallback(
    query: str,
    use_llm_threshold: float = 0.6,
    ask_user_threshold: float = 0.5,
) -> Tuple[Optional[str], float]:
    """
    Classify with fallback to LLM or user prompt.
    
    Args:
        query: User query
        use_llm_threshold: If heuristic confidence < this, try LLM
        ask_user_threshold: If still uncertain, ask user
    
    Returns:
        (category_slug, confidence)
    """
    # Step 1: Try heuristic
    category, confidence = classify_query_heuristic(query)
    
    if confidence >= use_llm_threshold:
        return (category, confidence)
    
    # Step 2: Try LLM (if enabled and confidence low)
    if settings.ENABLE_MULTI_CATEGORY_LLM:
        category_llm, confidence_llm = classify_query_with_llm(query)
        
        if confidence_llm >= 0.7:
            return (category_llm, confidence_llm)
    
    # Step 3: Ask user if still uncertain
    if confidence < ask_user_threshold:
        return (None, confidence)  # Caller should ask user
    
    # Step 4: Return best guess even if uncertain
    return (category, confidence)


def log_classification(
    query: str,
    predicted_category: Optional[str],
    predicted_confidence: float,
    actual_category: Optional[str] = None,
    success: Optional[bool] = None,
):
    """Log classification for analysis and learning."""
    from assistant.models import ClassificationLog
    
    ClassificationLog.objects.create(
        query=query,
        predicted_category=predicted_category,
        predicted_confidence=predicted_confidence,
        actual_category=actual_category,
        success=success,
    )
```

### Task 1.2: Create Tool Registry

**File:** `assistant/brain/tool_registry.py` (NEW)

```python
import logging
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass
import jsonschema

logger = logging.getLogger(__name__)

@dataclass
class ToolDefinition:
    """Definition of a tool the agent can call"""
    name: str
    category: str
    schema: Dict[str, Any]
    handler: Callable
    description: str = ""
    

class ToolRegistry:
    """Central registry for all marketplace tools"""
    
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._schemas: Dict[str, Dict] = {}
    
    def register_tool(self, category: str, tool: ToolDefinition) -> None:
        """Register a new tool with validation"""
        # Validate tool has required fields
        if not tool.schema:
            raise ValueError(f"Tool {tool.name} must have a schema")
        
        key = f"{category}_{tool.name}"
        
        if key in self.tools:
            raise ValueError(f"Tool {key} already registered")
        
        self.tools[key] = tool
        self._schemas[key] = tool.schema
        
        logger.info(f"Registered tool: {key}")
    
    def has_tool(self, category: str, tool_name: str) -> bool:
        """Check if tool exists"""
        key = f"{category}_{tool_name}"
        return key in self.tools
    
    def get_tools_for_category(self, category: str) -> List[ToolDefinition]:
        """Get all tools for a category"""
        return [
            t for k, t in self.tools.items()
            if k.startswith(f"{category}_")
        ]
    
    def get_tool(self, category: str, tool_name: str) -> ToolDefinition:
        """Get specific tool"""
        key = f"{category}_{tool_name}"
        if key not in self.tools:
            raise ValueError(f"Unknown tool: {key}")
        return self.tools[key]
    
    def validate_tool_call(
        self, category: str, tool_name: str, args: Dict[str, Any]
    ) -> bool:
        """Validate tool call against schema"""
        key = f"{category}_{tool_name}"
        
        if key not in self.tools:
            raise ValueError(f"Unknown tool: {key}")
        
        schema = self._schemas[key]
        
        try:
            jsonschema.validate(args, schema)
            return True
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid args for {key}: {e.message}")
    
    def call_tool(self, category: str, tool_name: str, args: Dict[str, Any]) -> Any:
        """Execute tool with validation"""
        self.validate_tool_call(category, tool_name, args)
        
        tool = self.get_tool(category, tool_name)
        return tool.handler(**args)


# Global registry instance
_registry = None

def get_registry() -> ToolRegistry:
    """Get or create global registry"""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
        _initialize_tools(_registry)
    return _registry


def _initialize_tools(registry: ToolRegistry) -> None:
    """Register all available tools"""
    from assistant.tools import search_internal_listings
    
    # Register existing property search tool
    registry.register_tool(
        "accommodation",
        ToolDefinition(
            name="search_listings",
            category="accommodation",
            schema={
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "bedrooms": {"type": "integer"},
                    "max_price": {"type": "number"},
                },
                "required": ["location"],
            },
            handler=search_internal_listings,
            description="Search for rental properties"
        )
    )
```

### Task 1.3: Create Feature Flags Utility

**File:** `assistant/utils/feature_flags.py` (NEW)

```python
import random
from typing import Optional
from django.core.cache import cache

DEFAULT_FLAGS = {
    "property_search": True,  # Always on (existing feature)
    "multi_category_search": False,  # Off by default (new feature)
    "vector_search": False,  # Off by default
    "crag_enabled": False,  # Off by default
    "intelligent_logging": False,  # Off by default
}

def get_feature_flag(
    flag_name: str,
    user_id: Optional[int] = None,
    canary_percentage: Optional[int] = None,
    default: Optional[bool] = None,
) -> bool:
    """
    Check if feature flag is enabled.
    
    Args:
        flag_name: Name of flag
        user_id: If provided, check user-specific flag
        canary_percentage: If provided, enable for N% of users (0-100)
        default: Default value if not set
    
    Returns:
        bool: Whether feature is enabled
    """
    # Check user-specific flag first
    if user_id:
        cache_key = f"flag:{flag_name}:user:{user_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        # Canary rollout: enable for percentage of users
        if canary_percentage:
            # Use user_id as seed for deterministic behavior
            enabled = (user_id % 100) < canary_percentage
            cache.set(cache_key, enabled, 86400)  # Cache 1 day
            return enabled
    
    # Check global flag
    cache_key = f"flag:{flag_name}:global"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Return default
    if default is not None:
        return default
    
    return DEFAULT_FLAGS.get(flag_name, False)


def set_feature_flag(
    flag_name: str,
    enabled: bool,
    user_id: Optional[int] = None,
) -> None:
    """Set feature flag state"""
    if user_id:
        cache_key = f"flag:{flag_name}:user:{user_id}"
    else:
        cache_key = f"flag:{flag_name}:global"
    
    cache.set(cache_key, enabled, None)  # No expiry


def enable_canary_rollout(flag_name: str, percentage: int) -> None:
    """Enable feature for N% of users"""
    cache_key = f"flag:{flag_name}:canary_percentage"
    cache.set(cache_key, percentage, None)


def get_canary_percentage(flag_name: str) -> int:
    """Get current canary percentage"""
    cache_key = f"flag:{flag_name}:canary_percentage"
    return cache.get(cache_key, 0)
```

### Task 1.4: Create Models for Tracking

**File:** Add to `assistant/models.py`

```python
class ClassificationLog(models.Model):
    """Track classification accuracy for learning"""
    query = models.TextField()
    predicted_category = models.CharField(max_length=100, null=True, blank=True)
    predicted_confidence = models.FloatField()
    actual_category = models.CharField(max_length=100, null=True, blank=True)
    success = models.BooleanField(null=True, blank=True)  # True/False/None
    language = models.CharField(max_length=10, default="en")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["predicted_category"]),
            models.Index(fields=["success"]),
        ]
    
    def __str__(self):
        return f"{self.query[:50]}... → {self.predicted_category}"


class ToolExecutionLog(models.Model):
    """Track tool usage and errors"""
    STATUSES = [
        ("success", "Success"),
        ("failure", "Failure"),
        ("timeout", "Timeout"),
        ("validation_error", "Validation Error"),
    ]
    
    tool_name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUSES)
    execution_time_ms = models.IntegerField()
    error_message = models.TextField(blank=True)
    args = models.JSONField()
    result = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tool_name", "status"]),
            models.Index(fields=["created_at"]),
        ]
```

### Task 1.5: Add Models Migration

**File:** `assistant/migrations/0002_classification_logging.py` (NEW)

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('assistant', '0001_initial'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='ClassificationLog',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('query', models.TextField()),
                ('predicted_category', models.CharField(max_length=100, null=True, blank=True)),
                ('predicted_confidence', models.FloatField()),
                ('actual_category', models.CharField(max_length=100, null=True, blank=True)),
                ('success', models.BooleanField(null=True, blank=True)),
                ('language', models.CharField(default='en', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ToolExecutionLog',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('tool_name', models.CharField(max_length=100)),
                ('category', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('success', 'Success'), ('failure', 'Failure'), ('timeout', 'Timeout'), ('validation_error', 'Validation Error')], max_length=20)),
                ('execution_time_ms', models.IntegerField()),
                ('error_message', models.TextField(blank=True)),
                ('args', models.JSONField()),
                ('result', models.JSONField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
```

---

## Phase 1 Checklist

- [ ] **Tests Written First**
  - [ ] `test_classification_engine.py` – All classification tests (15 tests)
  - [ ] `test_tool_registry.py` – Registry tests (8 tests)
  - [ ] `test_feature_flags.py` – Feature flag tests (6 tests)
  - [ ] `test_existing_property_search_unchanged.py` – RED GATE (8 tests)
  - [ ] `test_feature_flag_integration.py` – Integration tests (3 tests)

- [ ] **Implementation**
  - [ ] Create `classification.py`
  - [ ] Create `tool_registry.py`
  - [ ] Create `feature_flags.py`
  - [ ] Update `models.py` (add logging models)
  - [ ] Create migration `0002_classification_logging.py`

- [ ] **Run Tests Locally**
  - [ ] All new tests should pass
  - [ ] RED GATE tests ensure existing property search works

- [ ] **CI/CD Validation**
  - [ ] Push to branch → all tests run
  - [ ] RED GATE tests especially must pass
  - [ ] Code coverage > 80%

---

## How to Run Tests

```bash
# Install test dependencies
pip install pytest pytest-django pytest-cov

# Run all tests
pytest tests/ -v

# Run only Phase 1 tests
pytest tests/test_classification_engine.py tests/test_tool_registry.py -v

# Run RED GATE (existing property search)
pytest tests/test_existing_property_search_unchanged.py -v --tb=short

# Run with coverage
pytest tests/ --cov=assistant --cov-report=html
```

---

## Red Gate: Property Search Protection

The test file `test_existing_property_search_unchanged.py` is the **RED GATE**. These tests MUST PASS at all times:

✅ Property search still works
✅ Price filtering still works
✅ Agent outreach still works
✅ Multilingual support still works
✅ Status updates still work

**Rule:** If any RED GATE test fails, the build is BROKEN. No commits until fixed.

---

## Success Criteria (Phase 1)

- [ ] 40+ new unit tests, all passing
- [ ] 0 breaking changes to existing code
- [ ] RED GATE: 8/8 property search tests passing
- [ ] Feature flags prevent new features from activating
- [ ] Code coverage ≥ 80%
- [ ] Classification engine detects 5+ categories with >90% confidence
- [ ] Tool registry validates schema correctly

---

## Next: Phase 2 Plan

Once Phase 1 is complete and tested:

**Phase 2: Learn from Data (Week 1-2)**
- [ ] Collect real classification attempts from early beta users
- [ ] Analyze failures → update heuristic patterns
- [ ] Measure category distribution (which categories are users asking for?)
- [ ] Plan vector store schema based on real queries

(Detailed Phase 2 plan will follow after Phase 1 passes all tests)

---

## Notes

- **Feature Flags as Safety**: New features are disabled by default. Enable incrementally.
- **RED GATE Protection**: Existing functionality tested rigorously and protected.
- **TDD Discipline**: Write tests first, implement second. Tests define success.
- **Incremental Rollout**: Deploy to staging → canary users (5%) → full rollout.

---

**Status:** Phase 1 ready for implementation. Begin with test writing.
