# Slot Pre-fill Integration Guide

**Quick guide for integrating graph-aware slot pre-filling into real_estate_handler.py**

---

## 🎯 Goal

Transform the user experience from "repeat yourself" to "I remember you":

**Before:**
```
Day 1: "2BR in Girne for £600"
Day 2: "Show me apartments"
→ Agent: "What location?" ❌ (frustrating!)
```

**After:**
```
Day 1: "2BR in Girne for £600"
Day 2: "Show me apartments"
→ Agent: "I'll show 2BR in Girne around £600..." ✅ (delightful!)
```

---

## 🔧 Integration Steps

### Step 1: Add Import

```python
# In assistant/brain/real_estate_handler.py (top of file)
from assistant.brain.graph_slot_prefill import (
    prefill_slots_from_graph,
    explain_prefill_to_user
)
```

### Step 2: Pre-fill Before Extraction

Find this section in `handle_real_estate_prompt_driven()`:

```python
def handle_real_estate_prompt_driven(state: SupervisorState) -> SupervisorState:
    # ... existing code ...

    # CURRENT CODE (around line 175):
    # Step 1: Get agent context
    merged_slots = re_ctx.get("filled_slots", {})

    # ADD GRAPH PRE-FILL HERE ⬇️
    # Step 1.5: Pre-fill from Graph (NEW!)
    user_id = state.get("user_id")
    if user_id:
        original_slots = merged_slots.copy()  # Save for comparison

        merged_slots = prefill_slots_from_graph(
            user_id=user_id,
            current_slots=merged_slots,
            intent=current_intent
        )

        # Optional: Generate user-facing message
        prefill_message = explain_prefill_to_user(
            user_id=user_id,
            prefilled_slots=merged_slots,
            original_slots=original_slots
        )

        if prefill_message:
            logger.info(
                "[%s] Graph pre-fill: %s",
                thread_id,
                prefill_message
            )
            # Optionally inject into agent context or prepend to speak

    # Continue with existing code...
    # Step 2: Call slot inference engine
    all_missing = get_missing_slots(...)
```

### Step 3: Test Integration

```python
# Create test user with preferences
from assistant.memory.graph_manager import get_graph_manager

graph = get_graph_manager()
graph.store_user_preference("test_user_123", "location", "Girne", 0.9)
graph.store_user_preference("test_user_123", "bedrooms", "2", 0.9)
graph.store_user_preference("test_user_123", "budget", "600", 0.9)

# Simulate conversation
state = {
    "user_input": "Show me apartments",
    "user_id": "test_user_123",
    "thread_id": "test_thread_001"
}

result = handle_real_estate_prompt_driven(state)
# Should pre-fill: location=Girne, bedrooms=2, budget=600
```

---

## 🎨 User-Facing Integration

### Option A: Subtle Acknowledgment

```python
# In _handle_search_and_recommend():
if prefill_message:
    # Prepend to agent's speak
    speak = f"{prefill_message} Let me search for you..."
```

**Result:**
> "I remember you were looking for 2-bedroom apartments in Girne around £600. Let me search for you..."

### Option B: Explicit Confirmation

```python
# In _handle_ask_slot():
if prefilled_keys:
    # Add confirmation to slot question
    speak = f"I've pre-filled: {', '.join(prefilled_keys)}. {speak}"
```

**Result:**
> "I've pre-filled: location, bedrooms, budget. Is this for short-term or long-term rent?"

### Option C: Silent (No Message)

```python
# Just pre-fill silently, no user message
# Agent proceeds with pre-filled values transparently
```

**Result:**
> (No mention, but slots are auto-filled)

**Recommendation:** Use Option A (subtle acknowledgment) for best UX balance.

---

## 🧪 Testing Checklist

- [ ] Import works without errors
- [ ] Pre-fill triggers for `property_search` intent
- [ ] Pre-fill SKIPS for other intents (general_chat, etc.)
- [ ] Current turn slots override Graph defaults (priority)
- [ ] Log messages appear: `[GraphPrefill] Pre-filled X slots`
- [ ] User message generated correctly
- [ ] No pre-fill when Graph empty (new user)
- [ ] No crashes if GraphManager unavailable

---

## 🐛 Debugging

### Check if Pre-fill is Running

```bash
# Grep logs
tail -f logs/django.log | grep GraphPrefill

# Expected output:
# [GraphPrefill] Pre-filled 3 slots from Graph for user_123: {'location', 'bedrooms', 'budget'}
```

### Check Stored Preferences

```bash
curl "http://localhost:8000/api/memory/debug?user_id=user_123" | jq '.graph_memory.preferences'
```

### Manual Test

```python
from assistant.brain.graph_slot_prefill import prefill_slots_from_graph

result = prefill_slots_from_graph(
    user_id="test_user",
    current_slots={},
    intent="property_search"
)
print(result)  # Should show pre-filled slots
```

---

## ⚡ Performance

**Impact:**
- First call: ~100ms (Graph API request)
- Cached calls: ~50ms (if caching implemented)
- Net UX gain: **Massive** (skip 2-3 slot questions)

**Optimization:**
```python
# Add caching (optional)
from django.core.cache import cache

cache_key = f"graph_prefs:{user_id}"
cached = cache.get(cache_key)

if cached:
    merged_slots = {**cached, **merged_slots}
else:
    merged_slots = prefill_slots_from_graph(...)
    cache.set(cache_key, merged_slots, timeout=300)  # 5 min
```

---

## 🎛️ Feature Flag

```python
# .env.dev
ENABLE_GRAPH_PREFILL=true
```

```python
# In code:
import os

if os.getenv("ENABLE_GRAPH_PREFILL", "false").lower() == "true":
    merged_slots = prefill_slots_from_graph(...)
else:
    logger.debug("Graph pre-fill disabled via feature flag")
```

---

## 📊 Monitoring

**Metrics to Track:**

| Metric | How to Measure |
|--------|----------------|
| Pre-fill rate | `prefill_count / total_searches` |
| Slots pre-filled per user | Avg from logs |
| Time saved | (slots_prefilled × avg_slot_question_time) |
| User satisfaction | Survey: "Did the agent remember you?" |

**Log Analysis:**
```bash
# Count pre-fill events
grep "Pre-filled.*slots" logs/django.log | wc -l

# Average slots per pre-fill
grep "Pre-filled" logs/django.log | awk '{print $5}' | stats
```

---

## 🚀 Rollout Plan

### Phase 1: Test (Week 1)
- Enable for 10% of users via feature flag
- Monitor logs for errors
- Collect user feedback

### Phase 2: Expand (Week 2)
- Enable for 50% of users
- Measure impact on engagement
- Tune confidence thresholds

### Phase 3: Full (Week 3)
- Enable for 100% of users
- Set as default behavior
- Remove feature flag

---

## ✅ Integration Complete When...

- [ ] Code integrated in `real_estate_handler.py`
- [ ] Tests pass (manual + automated)
- [ ] Logs show pre-fill activity
- [ ] Debug endpoint shows preferences
- [ ] User-facing message tested
- [ ] Performance acceptable (< 150ms)
- [ ] Feature flag implemented
- [ ] Monitoring dashboard created

---

## 🆘 Support

**Questions?** Check:
1. [GRAPH_INTEGRATION_EXAMPLES.md](../memory/GRAPH_INTEGRATION_EXAMPLES.md) - Complete examples
2. [GRAPH_QUICK_REFERENCE.md](../memory/GRAPH_QUICK_REFERENCE.md) - API reference
3. [PHASE3_DEPLOYMENT.md](../../PHASE3_DEPLOYMENT.md) - Full deployment guide

**Issues?** Common fixes:
- GraphManager not available → Check ZEP_API_KEY
- No preferences found → Check user_id consistency
- Pre-fill not triggering → Check intent eligibility

---

*Ready to deploy!* 🎉
