# GraphManager Integration Examples

This guide provides **production-ready code snippets** for integrating Zep Graph v3 across your agent pipeline.

---

## Quick Reference

| Use Case | Location | Function |
|----------|----------|----------|
| Store user preferences | [real_estate_handler.py](#1-storing-user-preferences) | `_store_slots_to_graph()` |
| Retrieve preferences for context | [supervisor_graph.py](#2-retrieving-preferences-for-context) | `_inject_graph_context()` |
| Pre-fill slots from Graph | [slot_policy.py](#3-pre-filling-slots-from-graph) | `_prefill_from_graph()` |
| Search system graph for knowledge | [real_estate_search.py](#4-searching-system-graph) | `search_graph()` |
| Batch ingest listings | [Management command](#5-batch-listing-ingestion) | `init_zep_graphs` |
| Track user interactions | [Analytics](#6-tracking-user-interactions) | `add_fact_triplet()` |

---

## 1. Storing User Preferences

**Location:** `assistant/brain/real_estate_handler.py`

**Already implemented** (lines 54-138), but here's the core pattern:

```python
from assistant.memory.graph_manager import get_graph_manager

def _store_slots_to_graph(
    thread_id: str,
    user_id: Optional[str],
    slots_delta: Dict[str, Any],
    confidence: float = 0.8
) -> None:
    """
    Store newly extracted slots as facts in Zep Graph.

    Creates user preference facts like:
    - user_123 —[prefers_location]→ Girne
    - user_123 —[prefers_budget]→ 600
    """
    if not slots_delta:
        return

    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        logger.debug("[%s] GraphManager not available", thread_id)
        return

    effective_user_id = user_id or f"thread_{thread_id}"

    # Define which slots should be stored as long-term preferences
    preference_slots = {
        "location",
        "budget",
        "budget_currency",
        "property_type",
        "bedrooms",
        "rental_type"
    }

    for slot_name, value in slots_delta.items():
        if slot_name not in preference_slots:
            continue  # Skip transient slots (check_in/check_out)

        try:
            graph_mgr.store_user_preference(
                user_id=effective_user_id,
                preference_type=slot_name,
                value=str(value),
                confidence=confidence
            )
            logger.debug(
                "[%s] Stored Graph fact: %s —[prefers_%s]→ %s",
                thread_id, effective_user_id, slot_name, value
            )
        except Exception as e:
            logger.warning("[%s] Failed to store Graph fact: %s", thread_id, e)
```

**When to call:**

```python
# After slot extraction (in handle_real_estate_prompt_driven)
if slots_delta:
    merged_slots = merge_and_commit_slots(merged_slots, slots_delta)

    # Store to Graph
    _store_slots_to_graph(
        thread_id=thread_id,
        user_id=state.get("user_id"),
        slots_delta=slots_delta,
        confidence=0.8
    )
```

---

## 2. Retrieving Preferences for Context

**Location:** `assistant/brain/supervisor_graph.py`

**Already implemented** (lines 185-249), retrieves preferences during context fusion:

```python
from assistant.memory.graph_manager import get_graph_manager

def _inject_graph_context(state: SupervisorState) -> SupervisorState:
    """
    Retrieve structured user preferences from Zep Graph API.

    Complements session memory with long-term structured knowledge.
    """
    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        return {**state, "graph_preferences": {}}

    thread_id = state.get("thread_id")
    user_id = state.get("user_id")

    # Use thread_id as fallback for anonymous users
    effective_user_id = user_id or f"thread_{thread_id}"

    try:
        # Retrieve user preferences
        prefs = graph_mgr.get_user_preferences(user_id=effective_user_id)

        if not prefs:
            return {**state, "graph_preferences": {}}

        # Parse preferences into structured format
        parsed_prefs = {}
        for edge in prefs:
            fact = edge.get("fact", "")
            target = edge.get("target", "")

            # Extract preference type: "prefers_location" → "location"
            if fact.startswith("prefers_"):
                pref_type = fact[8:]
                parsed_prefs[pref_type] = target

        logger.info(
            "[GRAPH] Retrieved %d preferences for user %s: %s",
            len(parsed_prefs),
            effective_user_id,
            list(parsed_prefs.keys())
        )

        return {**state, "graph_preferences": parsed_prefs}

    except Exception as exc:
        logger.error("[GRAPH] Preference retrieval failed: %s", exc)
        return {**state, "graph_preferences": {}}
```

**Context fusion integration:**

```python
def _fuse_context(state: SupervisorState) -> SupervisorState:
    """Merge session memory + graph memory + recent history."""
    context_parts = []

    # ... session context, summary, recent turns ...

    # Add Graph preferences
    graph_prefs = state.get("graph_preferences") or {}
    if graph_prefs:
        prefs_lines = [f"- {pref_type}: {value}"
                       for pref_type, value in graph_prefs.items()]
        context_parts.append(
            f"[User Preferences (Graph)]:\n" + "\n".join(prefs_lines)
        )

    fused = "\n\n".join(context_parts)
    return {**state, "fused_context": fused}
```

**Supervisor node integration:**

```python
def supervisor_node(state: SupervisorState) -> SupervisorState:
    state = _apply_memory_context(state)
    state = _inject_zep_context(state)      # Session memory
    state = _inject_graph_context(state)    # Graph memory ✨
    state = _maybe_roll_summary(state)
    state = _fuse_context(state)            # Merge both layers
    # ... rest of orchestration
```

---

## 3. Pre-filling Slots from Graph

**Location:** `assistant/brain/slot_policy.py` (new enhancement)

**Not yet implemented** - here's how to add it:

```python
from assistant.memory.graph_manager import get_graph_manager

def prefill_slots_from_graph(
    user_id: str,
    current_slots: Dict[str, Any],
    intent: str
) -> Dict[str, Any]:
    """
    Pre-fill missing slots from user's Graph preferences.

    Example:
        User previously searched for "Girne, 2BR, £600"
        On new session: "Show me apartments"
        → Auto-fill: location=Girne, bedrooms=2, budget=600

    Returns:
        Updated slots dict with Graph preferences merged in
    """
    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        return current_slots

    # Only pre-fill for property search intents
    if intent not in {"property_search", "rental_inquiry"}:
        return current_slots

    try:
        # Retrieve user preferences
        prefs = graph_mgr.get_user_preferences(user_id=user_id)

        # Parse into slot format
        graph_slots = {}
        for edge in prefs:
            fact = edge.get("fact", "")
            target = edge.get("target", "")

            if fact.startswith("prefers_"):
                slot_name = fact[8:]  # Remove "prefers_" prefix
                graph_slots[slot_name] = target

        # Merge: current slots take priority over Graph defaults
        prefilled = {**graph_slots, **current_slots}

        # Log what was prefilled
        prefilled_keys = set(graph_slots.keys()) - set(current_slots.keys())
        if prefilled_keys:
            logger.info(
                "[SlotPolicy] Pre-filled %d slots from Graph: %s",
                len(prefilled_keys),
                prefilled_keys
            )

        return prefilled

    except Exception as e:
        logger.warning("[SlotPolicy] Graph prefill failed: %s", e)
        return current_slots
```

**Usage in real_estate_handler:**

```python
# Before slot extraction
merged_slots = state.get("agent_collected_info", {})

# Pre-fill from Graph (user's historical preferences)
merged_slots = prefill_slots_from_graph(
    user_id=state.get("user_id") or f"thread_{thread_id}",
    current_slots=merged_slots,
    intent=current_intent
)

# Then extract new slots from current message
new_slots = extract_slots(user_input, current_intent)
merged_slots = merge_and_commit_slots(merged_slots, new_slots)
```

**User experience:**

```
User (Session 1): "I need 2BR in Girne for £600"
→ Stores: location=Girne, bedrooms=2, budget=600 to Graph

User (Session 2, days later): "Show me apartments"
→ Pre-fills: location=Girne, bedrooms=2, budget=600 from Graph
→ Agent: "I'll show you 2-bedroom apartments in Girne around £600.
         Would you like to adjust any of these preferences?"
```

---

## 4. Searching System Graph

**Location:** `assistant/brain/real_estate_search.py` or `real_estate_handler.py`

**Use case:** Answer knowledge queries using system graph data.

```python
from assistant.memory.graph_manager import get_graph_manager

def answer_location_question(query: str) -> str:
    """
    Answer informational questions about locations using system graph.

    Example queries:
    - "Which areas are near the beach?"
    - "What's the rental market like in Girne?"
    - "Show me coastal neighborhoods"
    """
    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        return "I don't have detailed location information available right now."

    try:
        # Search system graph for relevant location info
        results = graph_mgr.search_graph(
            graph_id="real_estate_system",
            query=query,
            limit=10,
            scope="episodes"  # Search episodes (location data)
        )

        episodes = results.get("episodes", [])
        if not episodes:
            return "I don't have specific information about that area yet."

        # Extract location details from episodes
        locations = []
        for ep in episodes:
            data = ep.get("data", {})
            if data.get("type") == "Location":
                locations.append({
                    "name": data.get("name"),
                    "description": data.get("description"),
                    "synonyms": data.get("synonyms", [])
                })

        # Format response
        if locations:
            location_list = "\n".join([
                f"- **{loc['name']}**: {loc['description']}"
                for loc in locations[:3]  # Top 3
            ])
            return f"Here are some areas that match:\n\n{location_list}\n\nWould you like to search for properties in any of these locations?"

        return "I found some information but couldn't extract specific locations."

    except Exception as e:
        logger.error("[GraphSearch] Failed to search system graph: %s", e)
        return "I encountered an error searching location data."
```

**Integration in ANSWER_QUESTION handler:**

```python
def _handle_answer_question(state, speak, merged_slots, notes):
    """Handle informational queries with Graph-enhanced answers."""
    user_input = state.get("user_input", "").lower()

    # Check if query is about locations
    if any(keyword in user_input for keyword in ["area", "location", "beach", "city", "neighborhood"]):
        # Enhance response with system graph data
        graph_answer = answer_location_question(user_input)
        if graph_answer and len(graph_answer) > 50:
            speak = graph_answer  # Override LLM response with Graph-enhanced answer

    return _with_history(state, {
        "final_response": speak,
        "current_node": "real_estate_agent",
        "is_complete": True,
        "re_agent_act": "ANSWER_QUESTION"
    }, speak)
```

---

## 5. Batch Listing Ingestion

**Location:** `assistant/management/commands/init_zep_graphs.py`

**Already implemented**, but here's how to extend it for custom data:

```python
from assistant.memory.graph_manager import get_graph_manager
from listings.models import Listing

def ingest_all_listings():
    """Batch ingest Django listings into system graph."""
    graph_mgr = get_graph_manager()
    graph_id = "real_estate_system"

    listings = Listing.objects.filter(is_active=True)

    for listing in listings:
        # 1. Add listing as episode (full data)
        graph_mgr.add_episode(
            graph_id=graph_id,
            type="json",
            data={
                "type": "Listing",
                "listing_id": listing.id,
                "title": listing.title,
                "price": float(listing.price),
                "currency": listing.currency,
                "bedrooms": listing.bedrooms,
                "property_type": listing.property_type,
                "rental_type": listing.rental_type
            },
            source_description=f"Django Listing {listing.id}"
        )

        # 2. Add location relationship
        if listing.location:
            graph_mgr.add_fact_triplet(
                graph_id=graph_id,
                source_node_name=f"Listing_{listing.id}",
                target_node_name=listing.location,
                fact="located_in"
            )

        # 3. Add amenity relationships
        for amenity in listing.amenities.all():
            graph_mgr.add_fact_triplet(
                graph_id=graph_id,
                source_node_name=f"Listing_{listing.id}",
                target_node_name=amenity.name,
                fact="has_amenity",
                fact_name=f"Listing {listing.id} has {amenity.name}"
            )
```

**Run via management command:**

```bash
python3 manage.py init_zep_graphs
```

**Or schedule as daily cron job:**

```bash
# Update Graph with new listings every night at 2am
0 2 * * * cd /app && python3 manage.py init_zep_graphs --skip-listings=false
```

---

## 6. Tracking User Interactions

**Location:** `assistant/brain/real_estate_handler.py` or analytics layer

**Use case:** Track which listings users view/click for recommendations.

```python
from assistant.memory.graph_manager import get_graph_manager

def track_listing_interaction(
    user_id: str,
    listing_id: int,
    interaction_type: str = "viewed"
):
    """
    Track user-listing interactions for recommendation engine.

    Creates facts like:
    - user_123 —[viewed_listing]→ Listing_42
    - user_123 —[liked_listing]→ Listing_55
    - user_123 —[rejected_listing]→ Listing_33
    """
    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        return

    try:
        graph_mgr.add_fact_triplet(
            user_id=user_id,
            source_node_name=user_id,
            target_node_name=f"Listing_{listing_id}",
            fact=f"{interaction_type}_listing",
            valid_from=datetime.utcnow().isoformat()
        )

        logger.info(
            "[Graph] Tracked interaction: %s —[%s]→ Listing_%d",
            user_id,
            interaction_type,
            listing_id
        )
    except Exception as e:
        logger.warning("[Graph] Failed to track interaction: %s", e)
```

**Integration with recommendation card:**

```python
def _handle_search_and_recommend(state, speak, merged_slots, notes):
    # ... search backend ...

    # Emit recommendation card
    if listings:
        for listing in listings[:3]:
            # Track that user viewed this listing
            track_listing_interaction(
                user_id=state.get("user_id") or thread_id,
                listing_id=listing.id,
                interaction_type="viewed"
            )

        # Build card payload
        card_payload = RecommendationCardPayload(...)
        # ... emit card ...
```

**Building recommendations from interaction history:**

```python
def get_similar_listings(user_id: str) -> List[int]:
    """Find listings similar to ones user previously liked."""
    graph_mgr = get_graph_manager()

    # Get listings user liked
    results = graph_mgr.search_graph(
        user_id=user_id,
        query="liked listings",
        scope="edges"
    )

    liked_listings = [
        int(edge["target"].split("_")[1])  # Extract ID from "Listing_42"
        for edge in results.get("edges", [])
        if edge.get("fact") == "liked_listing"
    ]

    # Now find similar listings from system graph
    # (based on location, price range, property type)
    # ... implementation depends on your similarity algorithm

    return similar_listing_ids
```

---

## 7. Hybrid Slot Filling (Session + Graph)

**Complete example:** Merge Graph preferences with session context.

```python
def get_smart_slots(
    user_id: str,
    thread_id: str,
    user_input: str,
    current_slots: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Smart slot filling using 3 sources:
    1. Current turn extraction (highest priority)
    2. Session memory (medium priority)
    3. Graph preferences (default fallback)
    """
    # 1. Extract from current turn
    new_slots = extract_slots(user_input, intent="property_search")

    # 2. Get Graph preferences
    graph_mgr = get_graph_manager()
    graph_slots = {}

    if graph_mgr:
        prefs = graph_mgr.get_user_preferences(user_id=user_id)
        for edge in prefs:
            if edge.get("fact", "").startswith("prefers_"):
                slot_name = edge["fact"][8:]
                graph_slots[slot_name] = edge.get("target")

    # 3. Merge with priority: current > session > graph
    merged = {
        **graph_slots,           # Lowest priority (defaults)
        **current_slots,         # Medium priority (session state)
        **new_slots              # Highest priority (current turn)
    }

    # 4. Log merge strategy
    logger.info(
        "[SmartSlots] Merged slots: graph=%d, session=%d, new=%d → total=%d",
        len(graph_slots),
        len(current_slots),
        len(new_slots),
        len(merged)
    )

    return merged
```

---

## 8. Multi-Tenant Graph Isolation

**For production:** Ensure user graphs are properly isolated.

```python
def get_user_graph_id(user_id: str, tenant_id: str) -> str:
    """
    Generate tenant-scoped user graph ID.

    Format: user_{tenant_id}_{user_id}
    Example: user_acme_corp_user123
    """
    return f"user_{tenant_id}_{user_id}"

def store_preference_multi_tenant(
    user_id: str,
    tenant_id: str,
    preference_type: str,
    value: str
):
    """Store preference with tenant isolation."""
    graph_mgr = get_graph_manager()

    # Use tenant-scoped user ID
    scoped_user_id = get_user_graph_id(user_id, tenant_id)

    graph_mgr.store_user_preference(
        user_id=scoped_user_id,
        preference_type=preference_type,
        value=value
    )
```

---

## Performance Optimization

### Batch Operations

```python
def batch_store_preferences(user_id: str, preferences: Dict[str, str]):
    """Store multiple preferences in parallel."""
    graph_mgr = get_graph_manager()

    # Use ThreadPoolExecutor for parallel writes
    from concurrent.futures import ThreadPoolExecutor

    def store_one(pref_type, value):
        graph_mgr.store_user_preference(user_id, pref_type, value)

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(store_one, pref_type, value)
            for pref_type, value in preferences.items()
        ]

        # Wait for all to complete
        for future in futures:
            future.result()  # Raises exception if any failed
```

### Caching

```python
from functools import lru_cache
from django.core.cache import cache

@lru_cache(maxsize=1000)
def get_cached_user_preferences(user_id: str) -> Dict[str, str]:
    """Cache user preferences for 5 minutes."""
    cache_key = f"graph_prefs:{user_id}"

    # Try cache first
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Fetch from Graph
    graph_mgr = get_graph_manager()
    prefs = graph_mgr.get_user_preferences(user_id=user_id)

    # Parse and cache
    parsed = {}
    for edge in prefs:
        if edge.get("fact", "").startswith("prefers_"):
            parsed[edge["fact"][8:]] = edge.get("target")

    cache.set(cache_key, parsed, timeout=300)  # 5 min
    return parsed
```

---

## Error Handling Best Practices

```python
def safe_graph_operation(operation_name: str, fn, *args, **kwargs):
    """Wrapper for safe Graph operations with logging."""
    try:
        result = fn(*args, **kwargs)
        logger.debug(f"[Graph] {operation_name}: Success")
        return result

    except Exception as e:
        logger.error(
            f"[Graph] {operation_name}: Failed - {e}",
            exc_info=True,
            extra={
                "operation": operation_name,
                "args": args,
                "kwargs": kwargs
            }
        )
        return None  # Graceful degradation

# Usage
prefs = safe_graph_operation(
    "get_user_preferences",
    graph_mgr.get_user_preferences,
    user_id="user123"
) or {}  # Fallback to empty dict
```

---

## Testing Integration

```python
# tests/test_real_estate_handler.py

from unittest.mock import patch

def test_slot_storage_to_graph():
    """Test that extracted slots are stored to Graph."""
    with patch("assistant.memory.graph_manager.get_graph_manager") as mock_get_gm:
        mock_gm = MagicMock()
        mock_get_gm.return_value = mock_gm

        # Run handler
        state = {
            "user_input": "2BR in Girne for £600",
            "thread_id": "test_123"
        }
        result = handle_real_estate_prompt_driven(state)

        # Verify Graph storage was called
        assert mock_gm.store_user_preference.call_count >= 3
        mock_gm.store_user_preference.assert_any_call(
            user_id="thread_test_123",
            preference_type="location",
            value="Girne",
            confidence=0.8
        )
```

---

## Next Steps

1. **Test current implementation:**
   ```bash
   python3 scripts/test_graph_memory.py --verbose
   ```

2. **Initialize system graph:**
   ```bash
   python3 manage.py init_zep_graphs
   ```

3. **Add slot pre-filling** (Section 3)

4. **Enhance knowledge answers** (Section 4)

5. **Add interaction tracking** (Section 6)

---

**Last Updated:** 2025-11-08
**Graph Schema Version:** 1.0
**Zep API Version:** v3
