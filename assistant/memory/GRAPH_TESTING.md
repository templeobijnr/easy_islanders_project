# Graph Memory Testing Guide

This guide provides step-by-step instructions for testing the Zep Graph v3 integration alongside existing session memory.

## Architecture Overview

The system now operates with **dual-layer memory**:

1. **Session Memory (Zep v1/v2)**: Short-term conversation context, semantic retrieval
2. **Graph Memory (Zep v3)**: Long-term structured preferences, fact relationships

Both layers run in parallel and complement each other:
- Session: "User mentioned Girne 5 minutes ago in the conversation"
- Graph: "User prefers location: Girne" (persists across sessions)

---

## Prerequisites

### 1. Environment Setup

Ensure your `.env.dev` has Zep credentials:

```bash
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com
ZEP_API_KEY=z_your_api_key_here
ZEP_TIMEOUT_MS=10000
```

### 2. Install Zep Cloud SDK

```bash
pip install zep-cloud
```

### 3. Verify GraphManager Import

```python
from assistant.memory.graph_manager import get_graph_manager

mgr = get_graph_manager()
print(f"GraphManager available: {mgr is not None}")
```

---

## Testing Workflow

### Stage 1: Initialize System Graph

This creates the shared domain knowledge graph and seeds reference data.

**Run initialization command:**

```bash
python3 manage.py init_zep_graphs
```

**Expected output:**

```
🌍 Initializing Zep Graph Memory
✓ GraphManager initialized
📊 System Graph: real_estate_system
  ✓ Created system graph 'real_estate_system'
🌱 Ingesting Seed Data
  📍 Locations: 5
    ✓ Girne (city)
    ✓ Lefkoşa (city)
    ✓ Gazimağusa (city)
    ✓ İskele (city)
    ✓ Güzelyurt (city)
  🏠 Amenities: 24
  ✓ Seed data ingestion complete
🎉 Zep Graph initialization complete!
```

**Verification:**

```python
from assistant.memory.graph_manager import get_graph_manager

mgr = get_graph_manager()

# Search system graph for locations
results = mgr.search_graph(
    graph_id="real_estate_system",
    query="cities in North Cyprus",
    limit=10
)

print(f"Found {len(results.get('nodes', []))} location nodes")
```

**Optional: Skip listings ingestion during development:**

```bash
python3 manage.py init_zep_graphs --skip-listings
```

---

### Stage 2: Test User Preference Storage

This verifies that user preferences are automatically extracted and stored as Graph facts.

**Scenario 1: User states location preference**

```bash
# Start conversation
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need a 2-bedroom apartment in Girne for £600",
    "language": "en",
    "thread_id": "test_graph_001"
  }'
```

**Expected Graph storage:**

Check logs for:

```
[test_graph_001] Stored Graph fact: thread_test_graph_001 —[prefers_location]→ Girne
[test_graph_001] Stored Graph fact: thread_test_graph_001 —[prefers_bedrooms]→ 2
[test_graph_001] Stored Graph fact: thread_test_graph_001 —[prefers_budget]→ 600
[test_graph_001] Stored Graph fact: thread_test_graph_001 —[prefers_budget_currency]→ GBP
[test_graph_001] Stored 4 preference facts to Graph for user thread_test_graph_001
```

**Verification via Python:**

```python
from assistant.memory.graph_manager import get_graph_manager

mgr = get_graph_manager()

# Retrieve user preferences
prefs = mgr.get_user_preferences(user_id="thread_test_graph_001")

print(f"Stored preferences: {len(prefs)}")
for pref in prefs:
    print(f"  {pref.get('source')} —[{pref.get('fact')}]→ {pref.get('target')}")
```

**Expected output:**

```
Stored preferences: 4
  thread_test_graph_001 —[prefers_location]→ Girne
  thread_test_graph_001 —[prefers_bedrooms]→ 2
  thread_test_graph_001 —[prefers_budget]→ 600
  thread_test_graph_001 —[prefers_budget_currency]→ GBP
```

---

### Stage 3: Test Preference Retrieval & Context Fusion

This verifies that Graph preferences are retrieved and injected into agent context.

**Scenario 2: New conversation by same user**

```bash
# Start NEW thread (simulating returning user)
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me apartments again",
    "language": "en",
    "thread_id": "test_graph_002",
    "user_id": "test_user_123"
  }'
```

**Note:** Use same `user_id` to link conversations.

**Expected behavior:**

1. Graph retrieves preferences: `location=Girne, bedrooms=2, budget=600`
2. Context fusion includes `[User Preferences (Graph)]` section
3. Agent uses preferences to pre-fill slots or adjust recommendations

**Check logs for:**

```
[test_graph_002] [GRAPH] Retrieved 4 preferences for user test_user_123: ['location', 'bedrooms', 'budget', 'budget_currency']
[test_graph_002] Context fusion: 7 parts, 1234 chars (summary=no, retrieved=no, recent=1 turns)
```

**Verify fused context includes preferences:**

```python
# In supervisor_graph.py, enable debug logging
logger.debug("[%s] Fused context:\n%s", thread_id, fused)
```

Expected log output:

```
[test_graph_002] Fused context:
[Active Domain: real_estate_agent]

[User Preferences (Graph)]:
- location: Girne
- bedrooms: 2
- budget: 600
- budget_currency: GBP

[Recent Conversation]:
User: Show me apartments again
```

---

### Stage 4: Test Preference Updates

This verifies that preference updates overwrite old values.

**Scenario 3: User changes location preference**

```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Actually I prefer Lefkoşa now",
    "language": "en",
    "thread_id": "test_graph_001"
  }'
```

**Expected behavior:**

- New fact created: `user —[prefers_location]→ Lefkoşa`
- Old fact (`Girne`) remains but with earlier timestamp
- Retrieval returns most recent preference

**Verification:**

```python
prefs = mgr.get_user_preferences(user_id="thread_test_graph_001", preference_type="location")

# Should show both, sorted by recency
for pref in prefs:
    print(f"{pref.get('target')} (created: {pref.get('valid_from')})")
```

---

### Stage 5: Test Graph Search for Knowledge Queries

This verifies that system graph can answer informational questions.

**Scenario 4: User asks about locations**

```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which areas are near the beach?",
    "language": "en",
    "thread_id": "test_graph_003"
  }'
```

**Expected flow:**

1. Intent classified as `knowledge_query`
2. Routed to `real_estate_agent` (Phase 1.5)
3. Agent action: `ANSWER_QUESTION`
4. Backend searches system graph for coastal locations
5. LLM generates answer using graph data

**Manual Graph search:**

```python
results = mgr.search_graph(
    graph_id="real_estate_system",
    query="beach coastal areas",
    limit=5
)

print(f"Found {len(results.get('nodes', []))} location nodes")
for node in results.get('nodes', []):
    print(f"  {node.get('name')}: {node.get('description')}")
```

---

## Validation Checklist

### ✅ Storage (Write Path)

- [ ] Preferences stored when user states location
- [ ] Preferences stored when user states budget
- [ ] Preferences stored when user states property type
- [ ] Preferences stored when user states bedrooms
- [ ] Inferred slots also stored (with lower confidence)
- [ ] Transient slots (check_in/check_out) NOT stored
- [ ] GraphManager gracefully handles missing Zep SDK
- [ ] Logs show successful fact triplet creation

### ✅ Retrieval (Read Path)

- [ ] Graph preferences retrieved in supervisor_node
- [ ] Preferences included in fused_context
- [ ] Context fusion logs show `[User Preferences (Graph)]`
- [ ] Agent receives preferences in `user_profile` or context
- [ ] Retrieval works with thread_id fallback (anonymous users)
- [ ] Retrieval returns empty dict if no preferences found
- [ ] GraphManager handles search errors gracefully

### ✅ Integration (End-to-End)

- [ ] Session memory (Zep v1) and Graph memory (v3) run in parallel
- [ ] No conflicts between session retrieval and graph retrieval
- [ ] Performance: Graph retrieval adds < 100ms latency
- [ ] Preferences persist across multiple sessions
- [ ] Updated preferences overwrite old values
- [ ] System graph search works for knowledge queries
- [ ] Docker environment: web container can reach Zep API

---

## Troubleshooting

### Error: "zep_cloud not installed"

**Solution:**

```bash
pip install zep-cloud
```

### Error: "Failed to initialize GraphManager"

**Possible causes:**

1. Missing `ZEP_API_KEY` in environment
2. Invalid API key
3. Firewall blocking api.getzep.com

**Debug:**

```python
import os
print(f"ZEP_API_KEY set: {bool(os.getenv('ZEP_API_KEY'))}")
print(f"ZEP_BASE_URL: {os.getenv('ZEP_BASE_URL')}")

# Test connection
from assistant.memory.graph_manager import GraphManager
mgr = GraphManager()  # Will raise error with details
```

### Warning: "GraphManager not available, skipping retrieval"

This is **expected** if:

- Zep SDK not installed
- API key not configured
- Running in development mode without Zep

The system will continue to work using session memory only.

### Error: "Graph 'real_estate_system' already exists"

This is **normal** when running `init_zep_graphs` multiple times.

To reset:

1. Delete graph via Zep dashboard
2. Re-run `python3 manage.py init_zep_graphs`

Or use `--reset` flag (when implemented).

---

## Performance Benchmarks

Expected latency for Graph operations:

| Operation | Target | Measured |
|-----------|--------|----------|
| Store preference fact | < 50ms | ? |
| Retrieve user preferences | < 100ms | ? |
| Search system graph | < 150ms | ? |
| Full context fusion (with Graph) | < 200ms | ? |

**Measure in production:**

```python
import time

start = time.time()
mgr.get_user_preferences(user_id="test")
duration_ms = (time.time() - start) * 1000
print(f"Graph retrieval: {duration_ms:.1f}ms")
```

---

## Next Steps

After validating basic Graph functionality:

1. **Stage 2: System Graph Data Ingestion**
   - Ingest active listings from Django database
   - Create location hierarchies (Girne → North Cyprus)
   - Add amenity relationships (Listing → has_amenity → Pool)

2. **Stage 3: Graph-Aware Slot Policy**
   - Pre-fill slots from Graph preferences
   - Skip asking for slots already in Graph
   - Show "remembered" message to user

3. **Stage 4: Search Integration**
   - Use Graph to find similar listings
   - Recommend based on historical preferences
   - "Users who liked X also liked Y"

4. **Stage 5: Feedback Loops**
   - Track which listings user clicked
   - Store as `viewed_listing` or `liked_listing` facts
   - Improve recommendations over time

5. **Stage 6: Multi-User Graphs**
   - Proper user authentication
   - User-specific graphs (not thread-based)
   - Privacy controls

---

## Developer Notes

### Graph vs Session Memory

**When to use Graph:**

- Long-term preferences (location, budget range, property type)
- Explicit user statements ("I prefer...")
- Historical patterns (viewed listings, favorite areas)
- Domain knowledge (locations, amenities, market data)

**When to use Session:**

- Short-term context (last 5 turns)
- Conversational flow ("it" references)
- Temporary constraints (this search only)
- Recent topic shifts

**When to use both:**

- Pre-fill slots from Graph, override with Session if conflicting
- Use Graph for "default" preferences, Session for "this time" variations
- Example: Graph says "prefers Girne", Session says "show me Lefkoşa too"

### Schema Evolution

The graph schema is versioned in [graph_schemas.yaml](graph_schemas.yaml).

To add new node/edge types:

1. Update schema YAML
2. Re-run `init_zep_graphs` (safe, won't delete existing data)
3. Update fact extraction hooks in `real_estate_handler.py`
4. Update context fusion in `supervisor_graph.py`

---

**Last Updated:** 2025-11-08
**Graph Schema Version:** 1.0
**Zep API Version:** v3
