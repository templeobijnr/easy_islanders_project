# GraphManager Quick Reference Card

**One-page cheat sheet for Zep Graph v3 API**

---

## Setup

```python
from assistant.memory.graph_manager import get_graph_manager

# Get singleton instance
graph = get_graph_manager()

# Direct initialization (testing)
from assistant.memory.graph_manager import GraphManager
graph = GraphManager(api_key="z_...", base_url="https://api.getzep.com")
```

---

## User Preferences

### Store

```python
# High-level convenience method
graph.store_user_preference(
    user_id="user_123",
    preference_type="location",
    value="Girne",
    confidence=0.9
)
# Creates: user_123 —[prefers_location]→ Girne

# Low-level fact triplet
graph.add_fact_triplet(
    user_id="user_123",
    source_node_name="user_123",
    target_node_name="Girne",
    fact="prefers_location",
    valid_from="2025-11-08T10:00:00Z"
)
```

### Retrieve

```python
# All preferences
prefs = graph.get_user_preferences(user_id="user_123")
# Returns: [{"fact": "prefers_location", "target": "Girne", ...}, ...]

# Specific type
prefs = graph.get_user_preferences(
    user_id="user_123",
    preference_type="location"
)

# Parse into dict
parsed = {}
for edge in prefs:
    if edge.get("fact", "").startswith("prefers_"):
        pref_type = edge["fact"][8:]
        parsed[pref_type] = edge.get("target")
# {'location': 'Girne', 'budget': '600'}
```

---

## System Graph

### Create Graph

```python
graph.create_graph(
    graph_id="real_estate_system",
    name="Real Estate Knowledge Graph",
    description="Domain knowledge for North Cyprus real estate"
)
```

### Add Episodes (Unstructured Data)

```python
# JSON episode
graph.add_episode(
    graph_id="real_estate_system",
    type="json",
    data={
        "type": "Location",
        "name": "Girne",
        "description": "Harbor city on north coast"
    },
    source_description="Seed location data"
)

# Text episode
graph.add_episode(
    graph_id="real_estate_system",
    type="text",
    data="Girne is a popular tourist destination..."
)
```

### Add Relationships (Structured Data)

```python
# Location hierarchy
graph.add_fact_triplet(
    graph_id="real_estate_system",
    source_node_name="Girne",
    target_node_name="North_Cyprus",
    fact="is_city_in"
)

# Listing location
graph.add_fact_triplet(
    graph_id="real_estate_system",
    source_node_name="Listing_42",
    target_node_name="Girne",
    fact="located_in"
)

# Listing amenity
graph.add_fact_triplet(
    graph_id="real_estate_system",
    source_node_name="Listing_42",
    target_node_name="Pool",
    fact="has_amenity"
)
```

---

## Search

### Basic Search

```python
# User graph
results = graph.search_graph(
    user_id="user_123",
    query="location preferences",
    limit=10
)

# System graph
results = graph.search_graph(
    graph_id="real_estate_system",
    query="coastal cities beach",
    limit=10
)
```

### Advanced Search

```python
results = graph.search_graph(
    graph_id="real_estate_system",
    query="Girne properties",
    limit=20,
    min_rating=0.8,      # Confidence filter
    scope="edges"        # "edges", "nodes", "episodes", or None
)

# Access results
edges = results.get("edges", [])      # Relationships
nodes = results.get("nodes", [])      # Entities
episodes = results.get("episodes", []) # Documents
```

### Read All Facts

```python
# Get all edges for a user
facts = graph.read_facts(user_id="user_123", limit=50)

# Get all edges for system graph
facts = graph.read_facts(graph_id="real_estate_system", limit=100)
```

---

## Deletion

```python
graph.delete_episode(
    uuid="episode_uuid_here",
    user_id="user_123"  # or graph_id="..."
)
```

---

## Common Patterns

### Store Extracted Slots

```python
def store_slots(user_id, slots):
    """Store user slots as preferences."""
    for slot_name, value in slots.items():
        if slot_name in {"location", "budget", "bedrooms", "property_type"}:
            graph.store_user_preference(user_id, slot_name, str(value))
```

### Pre-fill from Graph

```python
def get_defaults(user_id):
    """Get user's default preferences."""
    prefs = graph.get_user_preferences(user_id)
    defaults = {}
    for edge in prefs:
        if edge.get("fact", "").startswith("prefers_"):
            defaults[edge["fact"][8:]] = edge.get("target")
    return defaults

# Usage
slots = get_defaults("user_123")
# {'location': 'Girne', 'bedrooms': '2'}
```

### Track Interactions

```python
def track_view(user_id, listing_id):
    """Track listing view."""
    graph.add_fact_triplet(
        user_id=user_id,
        source_node_name=user_id,
        target_node_name=f"Listing_{listing_id}",
        fact="viewed_listing",
        valid_from=datetime.utcnow().isoformat()
    )
```

### Search Knowledge Base

```python
def find_coastal_areas():
    """Find coastal locations."""
    results = graph.search_graph(
        graph_id="real_estate_system",
        query="beach coastal sea harbor",
        limit=10,
        scope="nodes"
    )
    return [node.get("name") for node in results.get("nodes", [])]
```

---

## Error Handling

### Safe Wrapper

```python
def safe_store(user_id, pref_type, value):
    """Store with error handling."""
    try:
        graph.store_user_preference(user_id, pref_type, value)
        return True
    except Exception as e:
        logger.error(f"Graph storage failed: {e}")
        return False
```

### Graceful Degradation

```python
# Always check if Graph is available
graph = get_graph_manager()
if graph is None:
    logger.debug("GraphManager not available, using defaults")
    return default_behavior()

# Fallback on errors
try:
    prefs = graph.get_user_preferences(user_id)
except Exception:
    prefs = []  # Empty list as fallback
```

---

## Integration Checklist

**Already Integrated:**
- ✅ `supervisor_graph.py::_inject_graph_context()` - Retrieve preferences
- ✅ `supervisor_graph.py::_fuse_context()` - Merge into prompt
- ✅ `real_estate_handler.py::_store_slots_to_graph()` - Store extracted slots

**Next Steps:**
- 📋 Pre-fill slots from Graph before extraction
- 📋 Use Graph for knowledge queries (ANSWER_QUESTION)
- 📋 Track listing interactions (views, likes)
- 📋 Build recommendation engine from interaction history

---

## Testing

```bash
# Unit tests (mocked)
pytest tests/test_graph_manager.py -v

# Integration tests (real API)
python3 scripts/test_graph_memory.py

# Interactive demo
python3 examples/graph_memory_demo.py
```

---

## Performance

| Operation | Target Latency | Optimization |
|-----------|---------------|--------------|
| Store preference | < 50ms | Batch with ThreadPoolExecutor |
| Retrieve preferences | < 100ms | Cache for 5 min |
| Search system graph | < 150ms | Limit results, use scope filter |

---

## Environment Variables

```bash
ZEP_API_KEY=z_your_api_key_here
ZEP_BASE_URL=https://api.getzep.com
```

---

## Fact Naming Conventions

| Domain | Fact Type | Example |
|--------|-----------|---------|
| User preferences | `prefers_{type}` | `prefers_location`, `prefers_budget` |
| User interactions | `{action}_listing` | `viewed_listing`, `liked_listing` |
| System relationships | `{relationship}` | `located_in`, `has_amenity`, `is_city_in` |
| Temporal facts | Add `valid_from`/`valid_until` | Budget valid for 30 days |

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ValueError: ZEP_API_KEY must be provided` | Missing env var | Set in `.env.dev` |
| `ImportError: No module named 'zep_cloud'` | SDK not installed | `pip install zep-cloud` |
| `Either graph_id or user_id must be provided` | Missing parameter | Pass one or the other |
| `GraphManager not available` | Init failed | Check API key and network |

---

## Quick Commands

```bash
# Initialize system graph
python3 manage.py init_zep_graphs

# Initialize without listings (faster)
python3 manage.py init_zep_graphs --skip-listings

# Reset graph (delete and recreate)
python3 manage.py init_zep_graphs --reset

# Run validation suite
python3 scripts/test_graph_memory.py --verbose
```

---

**Documentation:** [GRAPH_INTEGRATION_EXAMPLES.md](GRAPH_INTEGRATION_EXAMPLES.md)
**Testing Guide:** [GRAPH_TESTING.md](GRAPH_TESTING.md)
**Schema:** [graph_schemas.yaml](graph_schemas.yaml)
**Version:** 1.0 | **API:** Zep v3 | **Updated:** 2025-11-08
