# GraphManager Examples

This directory contains **production-ready examples** for integrating Zep Graph v3 memory into your agent pipeline.

---

## Quick Start

### 1. Prerequisites

```bash
# Install Zep Cloud SDK
pip install zep-cloud

# Set environment variables in .env.dev
ZEP_ENABLED=true
ZEP_BASE_URL=https://api.getzep.com
ZEP_API_KEY=z_your_api_key_here
```

### 2. Run Interactive Demo

```bash
# End-to-end demo showing Session + Graph memory
python3 examples/graph_memory_demo.py
```

This demonstrates:
- **Day 1**: User searches, preferences stored to Graph
- **Day 2**: User returns in new session, preferences recalled
- **Update**: User changes preference, Graph updates

### 3. Run Unit Tests

```bash
# Full test suite
pytest tests/test_graph_manager.py -v

# Specific test
pytest tests/test_graph_manager.py::test_add_fact_triplet_user -v

# With coverage
pytest tests/test_graph_manager.py --cov=assistant.memory.graph_manager
```

### 4. Validate Integration

```bash
# Automated validation of Graph setup
python3 scripts/test_graph_memory.py --verbose
```

Expected output:
```
✅ PASS Initialization
✅ PASS System Graph Creation
✅ PASS User Preference Storage
✅ PASS User Preference Retrieval
✅ PASS Graph Search

Total: 5/5 tests passed
```

---

## Examples Included

| File | Purpose | What It Demonstrates |
|------|---------|---------------------|
| [`graph_memory_demo.py`](graph_memory_demo.py) | Interactive demo | Dual-layer memory (Session + Graph) |
| [`../tests/test_graph_manager.py`](../tests/test_graph_manager.py) | Unit tests | API wrapper behavior, mocking |
| [`../scripts/test_graph_memory.py`](../scripts/test_graph_memory.py) | Integration test | Real API calls, validation |

---

## Documentation

### Core Documentation

- **[GraphManager API Reference](../assistant/memory/graph_manager.py)** - Main API wrapper
- **[Graph Schema Definitions](../assistant/memory/graph_schemas.yaml)** - Node/edge ontology
- **[Integration Examples](../assistant/memory/GRAPH_INTEGRATION_EXAMPLES.md)** - Code snippets
- **[Testing Guide](../assistant/memory/GRAPH_TESTING.md)** - Comprehensive test scenarios

### Architecture Diagrams

**Dual-Layer Memory Architecture:**

```
┌─────────────────────────────────────────┐
│         User Request                    │
│   "Show me apartments"                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Supervisor   │
         └────────┬───────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌─────────┐  ┌──────────┐
│Session │  │  Graph  │  │  Recent  │
│Memory  │  │ Memory  │  │ History  │
│(Zep v2)│  │(Zep v3) │  │(In-mem)  │
│        │  │         │  │          │
│Recent  │  │User     │  │Last 5    │
│convo   │  │prefs    │  │turns     │
└────┬───┘  └────┬────┘  └─────┬────┘
     │           │             │
     │   ✓ location: Girne    │
     │   ✓ bedrooms: 2        │
     │   ✓ budget: £600       │
     └───────────┴─────────────┘
                 │
                 ▼
         ┌──────────────┐
         │Context Fusion│
         │              │
         │Merges all 3  │
         │sources into  │
         │agent prompt  │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Real Estate │
         │    Agent     │
         │              │
         │Pre-filled:   │
         │- location    │
         │- bedrooms    │
         │- budget      │
         └──────────────┘
```

---

## Common Workflows

### Workflow 1: Store User Preferences

```python
from assistant.memory.graph_manager import get_graph_manager

graph = get_graph_manager()

# Store preference
graph.store_user_preference(
    user_id="user_123",
    preference_type="location",
    value="Girne",
    confidence=0.9
)
```

### Workflow 2: Retrieve Preferences for Context

```python
# Get all preferences
prefs = graph.get_user_preferences(user_id="user_123")

# Parse into dict
parsed = {}
for edge in prefs:
    if edge.get("fact", "").startswith("prefers_"):
        pref_type = edge["fact"][8:]  # Remove "prefers_"
        parsed[pref_type] = edge.get("target")

print(parsed)
# {'location': 'Girne', 'bedrooms': '2', 'budget': '600'}
```

### Workflow 3: Search System Graph

```python
# Find locations
results = graph.search_graph(
    graph_id="real_estate_system",
    query="coastal cities beach",
    limit=10
)

for node in results.get("nodes", []):
    print(f"{node.get('name')}: {node.get('description')}")
```

### Workflow 4: Track User Interactions

```python
# Track listing view
graph.add_fact_triplet(
    user_id="user_123",
    source_node_name="user_123",
    target_node_name="Listing_42",
    fact="viewed_listing",
    valid_from=datetime.utcnow().isoformat()
)
```

---

## Integration Points

### Already Integrated ✅

| File | Function | What It Does |
|------|----------|--------------|
| `supervisor_graph.py` | `_inject_graph_context()` | Retrieves preferences during context fusion |
| `supervisor_graph.py` | `_fuse_context()` | Merges Graph prefs into agent prompt |
| `real_estate_handler.py` | `_store_slots_to_graph()` | Stores extracted slots as facts |

### Next Integration Steps 📋

| File | Function | Purpose |
|------|----------|---------|
| `slot_policy.py` | `prefill_slots_from_graph()` | Pre-fill missing slots from Graph |
| `real_estate_search.py` | `answer_location_question()` | Use Graph for knowledge queries |
| `real_estate_handler.py` | `track_listing_interaction()` | Track views/likes for recommendations |

See [GRAPH_INTEGRATION_EXAMPLES.md](../assistant/memory/GRAPH_INTEGRATION_EXAMPLES.md) for implementation details.

---

## Troubleshooting

### Error: "zep_cloud not installed"

```bash
pip install zep-cloud
```

### Error: "GraphManager not available"

Check environment variables:
```python
import os
print(f"ZEP_API_KEY: {bool(os.getenv('ZEP_API_KEY'))}")
print(f"ZEP_BASE_URL: {os.getenv('ZEP_BASE_URL')}")
```

### Warning: "No preferences found"

Initialize system graph:
```bash
python3 manage.py init_zep_graphs
```

### Tests failing with connection errors

Check firewall/network:
```bash
curl https://api.getzep.com/health
```

---

## Performance Tips

### 1. Cache Preferences

```python
from django.core.cache import cache

cache_key = f"graph_prefs:{user_id}"
prefs = cache.get(cache_key)

if not prefs:
    prefs = graph.get_user_preferences(user_id)
    cache.set(cache_key, prefs, timeout=300)  # 5 min
```

### 2. Batch Operations

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [
        executor.submit(graph.store_user_preference, user_id, k, v)
        for k, v in prefs.items()
    ]
```

### 3. Limit Result Size

```python
# Only retrieve what you need
prefs = graph.get_user_preferences(
    user_id=user_id,
    preference_type="location"  # Specific type
)

# Limit results
results = graph.search_graph(
    query="...",
    limit=5  # Not 100
)
```

---

## Next Steps

1. **Run the demo**: `python3 examples/graph_memory_demo.py`
2. **Run tests**: `pytest tests/test_graph_manager.py -v`
3. **Initialize system graph**: `python3 manage.py init_zep_graphs`
4. **Validate integration**: `python3 scripts/test_graph_memory.py`
5. **Add slot pre-filling**: See [integration examples](../assistant/memory/GRAPH_INTEGRATION_EXAMPLES.md#3-pre-filling-slots-from-graph)

---

## Support

- **Documentation**: [assistant/memory/](../assistant/memory/)
- **Issues**: File issue in project repo
- **Zep Docs**: https://help.getzep.com/graphs
- **API Reference**: https://docs.getzep.com/api/

---

**Last Updated:** 2025-11-08
**Graph Schema Version:** 1.0
**Zep API Version:** v3
