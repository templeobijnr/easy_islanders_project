# Real Estate Agent Integration Plan

**Status:** Ready for Implementation
**Alignment:** Production Playbook (Contracts-first, Tool-first, Deterministic)

---

## Current State

### Supervisor Architecture
- **File:** `assistant/brain/supervisor_graph.py`
- **Routing:** Already configured! Lines 206, 212, 216 route to `"real_estate_agent"`
- **Handler:** Lines 98-143 have stub `real_estate_handler()`
- **Graph:** Lines 410, 421, 428 wire the node

### RE Agent Status
- ✅ **Contracts:** `assistant/agents/contracts.py` - Frozen AgentRequest/Response
- ✅ **Tools:** `assistant/agents/real_estate/tools.py` - All 10 tools implemented
- ✅ **Policy:** `assistant/agents/real_estate/policy.py` - State machine complete
- ✅ **Agent:** `assistant/agents/real_estate/agent.py` - Entry point ready
- ✅ **Tests:** 11/11 smoke tests passing

**Gap:** Supervisor `real_estate_handler` doesn't call the actual agent!

---

## Integration Steps (S2.5 → S3 Gate)

### Step 1.1: Wire Supervisor → RE Agent

**File to Modify:** `assistant/brain/supervisor_graph.py`

**Current Code (Lines 98-143):**
```python
@traced_worker_agent("real_estate")
def real_estate_handler(state: SupervisorState) -> SupervisorState:
    # STUB: Just returns acknowledgment, doesn't call agent
    entities = state.get('routing_decision', {}).get('extracted_entities', {})
    return {
        **state,
        'final_response': f"I'm searching for properties...",  # ← STUB!
        'current_node': 'real_estate_agent',
        'is_complete': True,
    }
```

**New Code:**
```python
@traced_worker_agent("real_estate")
def real_estate_handler(state: SupervisorState) -> SupervisorState:
    """
    Real Estate Agent: Calls production RE agent with contracts.
    Maps SupervisorState → AgentRequest → AgentResponse → SupervisorState
    """
    from assistant.agents.real_estate import handle_real_estate_request
    from assistant.agents.contracts import AgentRequest, AgentContext

    try:
        thread_id = state.get('thread_id', 'unknown')
        logger.info(f"[{thread_id}] RE Agent: delegating to production agent...")

        # Map SupervisorState → AgentRequest
        routing = state.get('routing_decision', {})
        intent_type = routing.get('intent_type', 'property_search')

        # Map intent_type → frozen intent enum
        intent_map = {
            'property_search': 'property_search',
            'booking_request': 'property_search',  # Treat as search for S2
            'lead_capture': 'property_search',
        }
        intent = intent_map.get(intent_type, 'property_search')

        agent_request = AgentRequest(
            thread_id=thread_id,
            client_msg_id=state.get('client_msg_id', f"sup-{uuid.uuid4()}"),
            intent=intent,
            input=state['user_input'],
            ctx=AgentContext(
                user_id=state.get('user_id'),
                locale=state.get('user_language', 'en'),
                time=datetime.utcnow().isoformat() + 'Z',
            ),
        )

        # Call production agent
        agent_response = handle_real_estate_request(agent_request)

        # Extract reply and actions
        reply = agent_response.get('reply', 'I found some properties for you.')
        actions = agent_response.get('actions', [])
        traces = agent_response.get('traces', {})

        # Map AgentResponse → SupervisorState
        # Extract property cards from show_listings action
        recommendations = []
        for action in actions:
            if action['type'] == 'show_listings':
                listings = action['params'].get('listings', [])
                # Convert PropertyCard → recommendation format
                recommendations = [
                    {
                        'id': lst['id'],
                        'title': lst['title'],
                        'location': lst['location'],
                        'bedrooms': lst['bedrooms'],
                        'price': lst['price_per_night'],
                        'amenities': lst['amenities'],
                        'photos': lst['photos'],
                        'type': 'property',
                    }
                    for lst in listings
                ]

        logger.info(f"[{thread_id}] RE Agent: completed, {len(recommendations)} cards")

        return {
            **state,
            'final_response': reply,
            'recommendations': recommendations,
            'current_node': 'real_estate_agent',
            'is_complete': True,
            'agent_response': agent_response,  # Full response for debugging
            'agent_traces': traces,
        }

    except Exception as e:
        logger.error(f"[{thread_id}] RE Agent failed: {e}", exc_info=True)
        return {
            **state,
            'final_response': 'I had trouble processing your property request. Please try again.',
            'current_node': 'real_estate_agent',
            'is_complete': True,
            'error_message': str(e),
        }
```

**Changes:**
1. Import `handle_real_estate_request` from our production agent
2. Map `SupervisorState` → `AgentRequest` using frozen contracts
3. Call the agent
4. Map `AgentResponse` → `SupervisorState`
5. Extract `show_listings` action and convert to `recommendations` format
6. Preserve traces for observability

---

### Step 1.2: Wire WS Emission with Agent Metadata

**File to Modify:** `assistant/tasks.py` (process_chat_message task)

**Current Code (Lines 1290-1314):**
```python
frame_payload = {
    "text": reply_text,
    "rich": rich_payload,
}
# No "agent" field!
```

**New Code:**
```python
# Extract agent name from state
agent_name = result.get('current_node', 'unknown')
if agent_name.endswith('_agent'):
    agent_name = agent_name.replace('_agent', '')  # "real_estate_agent" → "real_estate"

frame_payload = {
    "text": reply_text,
    "rich": rich_payload,
    "agent": agent_name,  # ← ADD THIS!
}
```

**WS Frame Output:**
```json
{
  "type": "chat_message",
  "event": "assistant_message",
  "thread_id": "thread-123",
  "payload": {
    "text": "I found 2 properties matching your search:",
    "rich": {"recommendations": [...]},
    "agent": "real_estate"  // ← Frontend knows which agent handled it!
  },
  "meta": {
    "in_reply_to": "msg-456",
    "queued_message_id": "qmsg-789"
  }
}
```

---

### Step 2: Add Prometheus Metrics

**File to Modify:** `assistant/agents/real_estate/agent.py`

**Add at top:**
```python
from prometheus_client import Counter, Histogram

# Agent-level metrics
RE_REQUESTS_TOTAL = Counter(
    "agent_re_requests_total",
    "Total RE agent requests",
    ["intent"]
)

RE_EXECUTION_SECONDS = Histogram(
    "agent_re_execution_duration_seconds",
    "RE agent execution time",
    buckets=[0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
)

RE_SEARCH_RESULTS = Histogram(
    "agent_re_search_results_count",
    "Number of results returned",
    buckets=[0, 1, 5, 10, 25]
)

RE_ERRORS_TOTAL = Counter(
    "agent_re_errors_total",
    "RE agent errors",
    ["error_type"]
)
```

**Instrument `handle_real_estate_request`:**
```python
def handle_real_estate_request(request: dict[str, Any]) -> AgentResponse:
    start_time = time.time()

    # Increment request counter
    RE_REQUESTS_TOTAL.labels(request["intent"]).inc()

    try:
        validated_request = validate_request(request)
        response = execute_policy(validated_request)

        # Record results count
        for action in response.get('actions', []):
            if action['type'] == 'show_listings':
                count = len(action['params'].get('listings', []))
                RE_SEARCH_RESULTS.observe(count)

        # Record duration
        RE_EXECUTION_SECONDS.observe(time.time() - start_time)

        return validated_response

    except ValueError as e:
        RE_ERRORS_TOTAL.labels(error_type="validation").inc()
        # ... error handling
    except TimeoutError as e:
        RE_ERRORS_TOTAL.labels(error_type="timeout").inc()
        # ... error handling
    except Exception as e:
        RE_ERRORS_TOTAL.labels(error_type="unexpected").inc()
        # ... error handling
```

**Acceptance:** `curl http://localhost:8000/api/metrics/ | grep agent_re` shows non-zero values

---

### Step 3: Lock Contracts in CI

**Files to Create:**

1. **`schema/agents/contracts/1.0/agent_request.schema.json`**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentRequest",
  "description": "Frozen contract: Supervisor → Agent",
  "type": "object",
  "required": ["thread_id", "client_msg_id", "intent", "input", "ctx"],
  "properties": {
    "thread_id": {"type": "string"},
    "client_msg_id": {"type": "string"},
    "intent": {
      "type": "string",
      "enum": ["property_search", "property_qa", "smalltalk", "out_of_scope"]
    },
    "input": {"type": "string"},
    "ctx": {
      "type": "object",
      "required": ["locale", "time"],
      "properties": {
        "user_id": {"type": ["string", "null"]},
        "locale": {"type": "string", "pattern": "^(en|tr|ru|de|pl)$"},
        "time": {"type": "string", "format": "date-time"}
      }
    }
  }
}
```

2. **`schema/agents/contracts/1.0/agent_response.schema.json`**
3. **`schema/ws/1.0/assistant_message.schema.json`**

**Add CI Job:**
```yaml
# .github/workflows/contracts.yml
name: Contract Tests
on: [push, pull_request]
jobs:
  validate-schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install jsonschema
        run: pip install jsonschema
      - name: Validate frozen schemas
        run: python scripts/validate_schemas.py
      - name: Run snapshot tests
        run: pytest tests/contracts/ -v
```

**Snapshot Test:**
```python
# tests/contracts/test_re_agent_contracts.py
def test_agent_request_schema():
    """Snapshot test: AgentRequest schema must not change without version bump."""
    import json
    schema_path = "schema/agents/contracts/1.0/agent_request.schema.json"
    with open(schema_path) as f:
        current_schema = json.load(f)

    snapshot_path = "tests/contracts/snapshots/agent_request_v1.0.json"
    with open(snapshot_path) as f:
        snapshot = json.load(f)

    assert current_schema == snapshot, (
        "AgentRequest schema changed! "
        "If intentional, bump version and update migration notes."
    )
```

---

### Step 4: Golden Sessions Test

**File:** `tests/golden_sessions/test_re_property_search.py`

```python
"""
Golden Session: Property Search in Kyrenia
Tests end-to-end flow: HTTP → Supervisor → RE Agent → WS
"""

import pytest
from unittest.mock import patch, MagicMock

def test_golden_session_property_search_kyrenia():
    """
    Scenario: User searches for "2 bedroom apartment in Kyrenia under £200"
    Expected: WS frame with show_listings action containing 2-3 properties
    """
    from assistant.agents.real_estate import handle_real_estate_request
    from assistant.agents.contracts import AgentRequest, AgentContext

    # Golden input
    request = AgentRequest(
        thread_id="golden-001",
        client_msg_id="golden-msg-001",
        intent="property_search",
        input="I'm looking for a 2 bedroom apartment in Kyrenia for under £200 per night",
        ctx=AgentContext(
            user_id="golden-user",
            locale="en",
            time="2025-11-02T12:00:00Z"
        )
    )

    # Execute
    response = handle_real_estate_request(request)

    # Golden assertions
    assert response['reply']  # Must have reply
    assert len(response['actions']) > 0  # Must have actions

    show_listings = next(a for a in response['actions'] if a['type'] == 'show_listings')
    assert show_listings is not None

    listings = show_listings['params']['listings']
    assert len(listings) >= 2, "Should find at least 2 properties in fixtures"

    # Validate listing structure
    for listing in listings:
        assert 'id' in listing
        assert listing['bedrooms'] in [2, 3]  # +1 bedroom flexibility
        assert 'price_per_night' in listing
        # Price should be under £220 (£200 + 10% margin)
```

**Run:** `pytest tests/golden_sessions/ -v`

---

## Acceptance Gates (S2.5 → S3)

### Gate 1: Integration
- [ ] Supervisor routes property_search → real_estate_agent
- [ ] Agent returns AgentResponse with show_listings action
- [ ] WS frame includes `"agent": "real_estate"` field
- [ ] Frontend receives PropertyCard[] in frame.payload.rich

### Gate 2: Observability
- [ ] `agent_re_requests_total` > 0 after test
- [ ] `agent_re_execution_duration_seconds` p95 < 100ms (fixtures)
- [ ] `agent_re_search_results_count` histogram populated
- [ ] Grafana dashboard shows RE metrics

### Gate 3: Contracts
- [ ] JSON schemas committed to `schema/`
- [ ] Snapshot tests pass in CI
- [ ] Golden sessions pass (2 scenarios minimum)

### Gate 4: Canary
- [ ] Feature flag: `ENABLE_RE_AGENT=true` in settings
- [ ] Staging: 24h with 0 errors, p95 < 100ms
- [ ] Internal users test: 10+ searches, 0 complaints

---

## Rollout Plan

### Phase 1: Staging (Week 1)
- Deploy with `ENABLE_RE_AGENT=false`
- Enable for internal users only (`user.is_staff`)
- Monitor metrics for 24 hours

### Phase 2: Canary (Week 1-2)
- Enable for 10% of production traffic
- A/B test vs. old stub agent
- Compare error rates, latency, user satisfaction

### Phase 3: Full Rollout (Week 2)
- Enable for 100% if canary succeeds
- Remove old stub code
- Update docs

---

## Files to Modify

1. ✅ `assistant/brain/supervisor_graph.py` - Replace stub handler
2. ✅ `assistant/tasks.py` - Add agent field to WS payload
3. ✅ `assistant/agents/real_estate/agent.py` - Add Prometheus metrics
4. ✅ `schema/agents/contracts/1.0/*.json` - Create JSON schemas
5. ✅ `tests/contracts/test_re_agent_contracts.py` - Snapshot tests
6. ✅ `tests/golden_sessions/test_re_property_search.py` - Golden sessions
7. ✅ `.github/workflows/contracts.yml` - CI job for schema validation

---

## Next Steps After Integration

1. **S3 Gate:** Migrate fixtures → database (Step 5 from roadmap)
2. **Frontend:** Add PropertyCard renderer + agent badge
3. **Safety:** Rate limiting + input validation
4. **Second Agent:** Car Rental Agent (parallel track)

---

**Status:** Ready to implement!
**Estimated Time:** 3-4 hours (including testing)
**Risk:** LOW (backward compatible, feature-flagged)
