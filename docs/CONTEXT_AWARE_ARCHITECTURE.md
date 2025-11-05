# Context-Aware Multi-Agent Architecture

**Vision:** Fully context-aware conversational AI with persistent user preferences, seamless multi-agent orchestration, and proactive intelligence.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION                            │
│                    (Chat UI, Voice, Mobile App)                      │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY & AUTH                              │
│                   (JWT, Rate Limiting, CORS)                         │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION ORCHESTRATOR                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  1. CONTEXT ASSEMBLY (Read-Before-Route)                   │     │
│  │                                                             │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │     │
│  │  │ Zep Memory   │  │ User Prefs   │  │ Transaction  │   │     │
│  │  │              │  │              │  │ State (Redis)│   │     │
│  │  │ • Summary    │  │ • Budget     │  │ • Shortlist  │   │     │
│  │  │ • Facts      │  │ • Location   │  │ • Workflow   │   │     │
│  │  │ • Recent     │  │ • Features   │  │ • Handoffs   │   │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │     │
│  │         │                  │                  │           │     │
│  │         └──────────────────┴──────────────────┘           │     │
│  │                            │                               │     │
│  │                            ▼                               │     │
│  │                    ┌───────────────┐                      │     │
│  │                    │ Unified       │                      │     │
│  │                    │ Context Block │                      │     │
│  │                    └───────────────┘                      │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  2. INTENT ROUTING (Context-Aware Router)                  │     │
│  │                                                             │     │
│  │  Input: Utterance + Context Block                          │     │
│  │                                                             │     │
│  │  ┌─────────────────────────────────────────────────┐       │     │
│  │  │ Router Decision Tree:                           │       │     │
│  │  │                                                  │       │     │
│  │  │ 1. Check active workflow → bias to workflow agent│      │     │
│  │  │ 2. Check handoff context → route to target agent│      │     │
│  │  │ 3. Check sticky follow-up → route to last agent │      │     │
│  │  │ 4. Check preference hints → bias to domain      │      │     │
│  │  │ 5. Run ML classifier (fallback)                 │      │     │
│  │  └─────────────────────────────────────────────────┘       │     │
│  │                            │                                │     │
│  │                            ▼                                │     │
│  │                    ┌───────────────┐                       │     │
│  │                    │ Target Agent  │                       │     │
│  │                    └───────────────┘                       │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  3. AGENT ORCHESTRATION (Supervisor Graph)                 │     │
│  │                                                             │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │     │
│  │  │ Real Estate │  │  Services   │  │  Scheduling │       │     │
│  │  │   Agent     │  │   Agent     │  │    Agent    │       │     │
│  │  │             │  │             │  │             │       │     │
│  │  │ • Search    │  │ • Pharmacies│  │ • Viewings  │       │     │
│  │  │ • QA        │  │ • Gyms      │  │ • Reminders │       │     │
│  │  │ • Recommend │  │ • Restaurants│  │             │       │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │     │
│  │         │                  │                  │            │     │
│  │         │      ┌───────────┴──────────┐      │            │     │
│  │         │      │                       │      │            │     │
│  │  ┌──────┴──────┴──┐            ┌──────┴──────┴──┐         │     │
│  │  │ Negotiation    │            │    Legal      │         │     │
│  │  │    Agent       │            │    Agent      │         │     │
│  │  │                │            │               │         │     │
│  │  │ • Offers       │            │ • Contracts   │         │     │
│  │  │ • Counteroffers│            │ • Compliance  │         │     │
│  │  └────────────────┘            └───────────────┘         │     │
│  │                                                            │     │
│  │  All agents receive:                                      │     │
│  │  • Unified Context Block                                  │     │
│  │  • User Preferences                                       │     │
│  │  • Transaction State                                      │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  4. RESPONSE GENERATION & MEMORY UPDATE                    │     │
│  │                                                             │     │
│  │  Agent Response → Context Enrichment → Write Memory        │     │
│  │                                                             │     │
│  │  ┌────────────────────────────────────────────┐           │     │
│  │  │ Memory Write (Async Celery):               │           │     │
│  │  │                                             │           │     │
│  │  │ 1. Write conversation turn to Zep          │           │     │
│  │  │ 2. Extract preferences (LLM)               │           │     │
│  │  │ 3. Update user_preferences table           │           │     │
│  │  │ 4. Update transaction state (Redis)        │           │     │
│  │  │ 5. Log interaction for learning            │           │     │
│  │  └────────────────────────────────────────────┘           │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LEARNING & ANALYTICS                            │
│                                                                       │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐    │
│  │ Preference        │  │ Implicit Learning │  │ Behavior    │    │
│  │ Extraction        │  │                   │  │ Tracking    │    │
│  │                   │  │ • Click tracking  │  │             │    │
│  │ • LLM extraction  │  │ • Dwell time      │  │ • Funnels   │    │
│  │ • Confidence      │  │ • Dismiss signals │  │ • Drop-offs │    │
│  │ • Validation      │  │ • Save patterns   │  │ • Success   │    │
│  └───────────────────┘  └───────────────────┘  └─────────────┘    │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │              Personalization Engine (Future)               │     │
│  │                                                             │     │
│  │  • Recommendation scoring                                  │     │
│  │  • Result re-ranking                                       │     │
│  │  • Proactive suggestions                                   │     │
│  │  • A/B testing framework                                   │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Multi-Turn Conversation Example

### Scenario: User searches for property, asks about nearby gyms, then schedules viewing

```
Turn 1: User: "I need a 2 bedroom apartment in Girne, budget 200k EUR"
│
├─► Context Assembly:
│   • Zep Memory: (empty - first conversation)
│   • User Prefs: (none yet)
│   • Transaction State: (none)
│
├─► Router Decision:
│   • Domain: real_estate (high confidence from keywords)
│   • Agent: real_estate
│
├─► Agent Execution:
│   • Extract params: bedrooms=2, location=Girne, budget=200k EUR
│   • Search listings: 15 results
│   • Generate response + show_listings action
│
└─► Memory Write (Async):
    • Write to Zep: "User searching for 2BR in Girne, budget 200k EUR"
    • Extract preferences:
      - budget: {min: 0, max: 200000, currency: EUR} [confidence: 1.0]
      - location: {values: ["Girne"]} [confidence: 1.0]
      - bedrooms: {min: 2, max: 2} [confidence: 1.0]
    • Save to user_preferences table
    • Update transaction_state:
      - active_workflow: "property_search"
      - current_step: "reviewing_options"
      - last_agent: "real_estate"
      - awaiting_followup: true


Turn 2: User: "what about gyms nearby?"
│
├─► Context Assembly:
│   • Zep Memory: "User searching for 2BR in Girne, budget 200k EUR"
│   • User Prefs: budget={0-200k EUR}, location={Girne}, bedrooms={2}
│   • Transaction State:
│     - active_workflow: "property_search"
│     - shortlist: [listing_1, listing_2, ...] (from Turn 1 results)
│     - last_agent: "real_estate"
│
├─► Router Decision:
│   • Utterance: "what about gyms nearby?" (ambiguous)
│   • Check context:
│     - Active workflow: property_search → shortlist has listings
│     - Inference: User wants gyms near shortlisted properties
│   • Domain: services (handoff from real_estate)
│   • Agent: services
│   • Handoff context: {from: real_estate, intent: find_gyms_near_properties, params: {listings: shortlist}}
│
├─► Agent Execution (Services):
│   • Accept handoff context
│   • Extract locations from shortlist (Girne neighborhoods)
│   • Search gyms in those areas
│   • Generate response + show_places action
│
└─► Memory Write (Async):
    • Write to Zep: "User interested in gyms near Girne properties"
    • Extract preference:
      - features: {preferred: ["gym_nearby"]} [confidence: 0.8]
    • Update transaction_state:
      - last_agent: "services"
      - handoff_context: cleared


Turn 3: User: "can I schedule a viewing for the first one?"
│
├─► Context Assembly:
│   • Zep Memory: "User searching for 2BR in Girne, budget 200k EUR. Interested in gyms nearby."
│   • User Prefs: budget={0-200k}, location={Girne}, bedrooms={2}, features={gym_nearby}
│   • Transaction State:
│     - shortlist: [listing_1, listing_2, ...]
│     - last_agent: "services"
│
├─► Router Decision:
│   • Utterance: "can I schedule a viewing for the first one?"
│   • Check context:
│     - "first one" → reference to shortlist[0] = listing_1
│     - Intent: schedule_viewing
│   • Domain: scheduling
│   • Agent: scheduling
│   • Handoff context: {from: services, intent: schedule_viewing, params: {listing_id: listing_1}}
│
├─► Agent Execution (Scheduling):
│   • Resolve "first one" → listing_1 from shortlist
│   • Check availability for listing_1
│   • Generate response with available slots
│   • Action: ask_clarification (which time slot?)
│
└─► Memory Write (Async):
    • Write to Zep: "User wants to schedule viewing for Listing #123 (2BR in Girne)"
    • Update transaction_state:
      - pending_actions: [{type: schedule_viewing, listing: listing_1, status: pending}]
      - current_step: "scheduling_viewing"
      - last_agent: "scheduling"
```

---

## Key Architectural Patterns

### 1. **Read-Before-Route**
```python
# supervisor_graph.py

def supervisor_node(state: SupervisorState) -> SupervisorState:
    # STEP 1: Assemble complete context BEFORE routing
    state = _apply_memory_context(state)  # Zep + Prefs + Transaction State

    # STEP 2: Route with full context
    sticky_agent, updated_ctx = _maybe_route_sticky(state)
    if sticky_agent:
        # Sticky routing based on transaction state
        state["next_agent"] = sticky_agent
    else:
        # Context-aware routing
        route_decision = route_with_context(
            utterance=state["user_input"],
            context=state["conversation_ctx"]
        )
        state["next_agent"] = route_decision["agent"]

    return state
```

### 2. **Context Enrichment**
```python
# supervisor_graph.py

def _apply_memory_context(state: SupervisorState) -> SupervisorState:
    """Fetch ALL context sources and merge."""
    thread_id = state["thread_id"]
    user_id = state["user_id"]

    # Source 1: Zep conversation memory
    zep_context, zep_meta = fetch_thread_context(thread_id, mode="summary")

    # Source 2: User preferences (Postgres)
    user_prefs = PreferenceService.get_active_preferences(
        user_id=user_id,
        category=None,  # All categories
        min_confidence=0.5
    )

    # Source 3: Transaction state (Redis)
    txn_state = TransactionService.get_state(thread_id) or {}

    # Merge into unified context block
    unified_context = {
        "zep_memory": {
            "summary": zep_context.get("context", ""),
            "facts": zep_context.get("facts", []),
            "recent": zep_context.get("recent", [])
        },
        "user_preferences": user_prefs,
        "transaction_state": txn_state
    }

    # Inject into state for agent access
    state["conversation_ctx"]["memory"] = unified_context
    state["user_preferences"] = user_prefs
    state["transaction_state"] = txn_state

    return state
```

### 3. **Agent Handoff Protocol**
```python
# agents/contracts.py

class AgentHandoff(TypedDict):
    """Handoff context passed between agents."""
    from_agent: str
    to_agent: str
    intent: str  # Why we're handing off
    params: dict[str, Any]  # Data to pass (listing_ids, locations, etc.)
    timestamp: float

# Example usage in real_estate agent:
def handle_property_search(request: AgentRequest) -> AgentResponse:
    # ... execute search ...

    # Prepare handoff to services agent (proactive suggestion)
    if user_wants_nearby_services():
        handoff = {
            "from_agent": "real_estate",
            "to_agent": "services",
            "intent": "find_services_near_properties",
            "params": {
                "listing_ids": [l.id for l in top_results],
                "service_types": ["gym", "supermarket"]
            },
            "timestamp": time.time()
        }
        TransactionService.set_handoff_context(request["thread_id"], handoff)

        # Suggest to user
        response["reply"] += "\n\nWould you like to see gyms and supermarkets near these properties?"

    return response
```

### 4. **Proactive Preference Application**
```python
# agents/real_estate/search.py

def search_with_smart_defaults(request: AgentRequest) -> List[Listing]:
    """Apply preferences proactively, allow user overrides."""
    ctx = request["ctx"]
    user_prefs = ctx.get("user_preferences", {}).get("real_estate", {})

    # Parse user utterance for explicit params
    explicit_params = extract_search_params(request["input"])

    # Build final params: explicit > preferences > defaults
    params = {}

    # Budget: explicit takes precedence
    if "budget" in explicit_params:
        params["budget"] = explicit_params["budget"]
    elif "budget" in user_prefs:
        params["budget"] = user_prefs["budget"]
        # Mark as auto-applied for transparency
        params["budget"]["auto_applied"] = True

    # Location: explicit takes precedence
    if "location" in explicit_params:
        params["location"] = explicit_params["location"]
    elif "location" in user_prefs:
        params["location"] = user_prefs["location"]["values"][0]
        params["location_auto_applied"] = True

    # Bedrooms: explicit takes precedence
    if "bedrooms" in explicit_params:
        params["bedrooms"] = explicit_params["bedrooms"]
    elif "bedrooms" in user_prefs:
        params["bedrooms"] = user_prefs["bedrooms"]
        params["bedrooms_auto_applied"] = True

    # Execute search
    results = Listing.objects.filter(**build_filters(params)).all()

    return results, params
```

### 5. **Implicit Learning from Behavior**
```python
# analytics/implicit_learning.py

@shared_task
def learn_from_interaction(
    user_id: str,
    interaction_type: str,  # 'view', 'save', 'dismiss', 'contact'
    listing_id: str,
    context: dict
):
    """Update implicit preferences based on user behavior."""
    listing = Listing.objects.get(id=listing_id)

    if interaction_type in ["save", "contact"]:
        # Positive signal → strengthen preferences
        features = extract_features(listing)

        for feature, value in features.items():
            # Check if this deviates from existing preference
            existing = UserPreference.objects.filter(
                user_id=user_id,
                preference_type=feature
            ).first()

            if existing:
                # Update confidence based on consistency
                if existing.value == value:
                    # Consistent → increase confidence
                    existing.confidence = min(existing.confidence + 0.1, 1.0)
                else:
                    # Inconsistent → might be evolving preference
                    # Keep both, let ML ranking decide
                    pass
            else:
                # New implicit preference
                UserPreference.objects.create(
                    user_id=user_id,
                    category="real_estate",
                    preference_type=feature,
                    value={"type": "single", "value": value},
                    confidence=0.6,
                    source="behavior"
                )

    elif interaction_type == "dismiss":
        # Negative signal → add to dealbreakers
        features = extract_features(listing)
        for feature, value in features.items():
            # Mark as negative preference
            UserPreference.objects.create(
                user_id=user_id,
                category="real_estate",
                preference_type=f"{feature}_dealbreaker",
                value={"type": "single", "value": value},
                confidence=0.5,
                source="behavior"
            )
```

---

## Implementation Phases (Recap)

### Phase 1: Preference Extraction (Sprint 6-7) ✅ Ready to Start
**Goal:** Extract and persist user preferences
- Database schema + migrations
- LangChain extraction pipeline
- Background Celery tasks
- Supervisor integration
- Frontend preference UI

**Impact:** Reduces repetition, users don't re-state preferences

### Phase 2: Cross-Agent Memory (Sprint 8-9)
**Goal:** Seamless agent handoffs with context preservation
- Transaction state schema (Redis)
- Handoff protocol implementation
- Working memory API (shortlist, comparisons)
- Supervisor enhancements

**Impact:** Multi-agent conversations feel seamless

### Phase 3: Proactive Intelligence (Sprint 10-11)
**Goal:** Agents proactively use context and learn from behavior
- Proactive filtering (auto-apply preferences)
- Anticipatory suggestions
- Implicit learning from clicks/saves
- Personalization scoring

**Impact:** System feels intelligent, not just reactive

### Phase 4: Advanced Orchestration (Sprint 12-13)
**Goal:** Context-aware routing and multi-step workflows
- Enhanced router with context
- Workflow templates
- Reminder/scheduling system
- Session resumption

**Impact:** Handles complex multi-step transactions

---

## Success Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT-AWARE SYSTEM HEALTH DASHBOARD                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Preference Extraction (Phase 1)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Extraction Accuracy:        92% ✓ (target: >90%)    │   │
│  │ Preference Reuse Rate:      78%   (target: >80%)    │   │
│  │ Repetition Reduction:       8%  ✓ (target: <10%)    │   │
│  │ User Satisfaction:         4.6/5 ✓ (target: >4.5)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Cross-Agent Memory (Phase 2)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Handoff Success Rate:       96% ✓ (target: >95%)    │   │
│  │ Context Loss:               3%  ✓ (target: <5%)     │   │
│  │ Multi-Turn Completion:      82% ✓ (target: >80%)    │   │
│  │ User Satisfaction:         4.7/5 ✓ (target: >4.5)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Proactive Intelligence (Phase 3)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Proactive Match Rate:       73% ✓ (target: >70%)    │   │
│  │ Suggestion Accept Rate:     62% ✓ (target: >60%)    │   │
│  │ Personalization Score:     0.72 ✓ (target: >0.7)    │   │
│  │ User Satisfaction:         4.8/5 ✓ (target: >4.5)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Advanced Orchestration (Phase 4)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Routing Accuracy:           96% ✓ (target: >95%)    │   │
│  │ Workflow Completion:        84% ✓ (target: >80%)    │   │
│  │ Session Resumption:         52% ✓ (target: >50%)    │   │
│  │ User Satisfaction:         4.9/5 ✓ (target: >4.5)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps: Sprint 6 Kickoff

**Week 1 Focus:**
1. Database schema design review
2. LangChain extraction pipeline MVP
3. Background task infrastructure
4. Unit tests for extraction logic

**Week 2 Focus:**
1. Supervisor integration
2. Agent contract updates
3. Frontend preference UI mockups
4. Integration testing

**Validation:**
- Human eval dataset (100 conversations)
- Extraction accuracy >90%
- End-to-end smoke test (user → extraction → storage → usage)

---

**Last Updated:** 2025-11-03
**Status:** Architecture Approved - Ready for Implementation
