"""
Real Estate Agent Policy - Deterministic state machine controller.

State Flow:
    TENURE_DECIDE → SLOT_FILL → SEARCH → SHOW_LISTINGS (success path)
                                       ↓
                                    RELAX → SHOW_LISTINGS (empty results, relaxed)
                                       ↓
                                    CLARIFY (still empty after relax)

    ANSWER_QA (property question path)

No free-form LLM routing - all transitions are rule-based.

S3 Update: Added TENURE_DECIDE as first state to determine rental mode (short_term vs long_term).
"""

from typing import Literal, Any
from dataclasses import dataclass

from assistant.agents.contracts import AgentRequest, AgentResponse, AgentAction, AgentContext
from assistant.agents.real_estate.schema import SearchParams, PropertyCard, QAAnswer
from assistant.agents.real_estate import tools
from assistant.monitoring.metrics import inc_prefs_applied

FOLLOWUP_EXACT = {
    "show",
    "show me",
    "show more",
    "more",
    "next",
    "next please",
    "another",
    "more please",
}

FOLLOWUP_PREFIXES = ("show me", "details", "tell me more")


def detect_followup_intent(text: str) -> str | None:
    """
    Detect simple follow-up intents from user utterances.
    Returns a string key (e.g., 'paginate_next') or None.
    """
    if not text:
        return None
    normalized = text.strip().lower()
    if normalized in FOLLOWUP_EXACT or any(normalized.startswith(prefix) for prefix in FOLLOWUP_PREFIXES):
        return "paginate_next"
    return None


def build_followup_response(
    request: AgentRequest,
    capsule: dict[str, Any],
    followup_type: str,
) -> AgentResponse | None:
    """
    Handle deterministic follow-up actions (pagination, details).
    Returns AgentResponse if follow-up handled, else None to continue policy.
    """
    if followup_type != "paginate_next":
        return None

    search_params = (capsule.get("search_params") or {}).copy()
    if not search_params:
        return None

    page_size = int(capsule.get("page_size") or 10)
    current_page = int(capsule.get("page") or 1)
    next_page = current_page + 1

    tenure = capsule.get("tenure") or search_params.get("tenure") or "short_term"
    search_params["tenure"] = tenure
    if "max_results" not in search_params:
        search_params["max_results"] = capsule.get("max_results", page_size * next_page)

    listings, total = tools.search_listings(
        search_params,
        page=next_page,
        page_size=page_size,
        return_total=True,
    )

    has_more = bool(total) and (total > next_page * page_size)

    reply = (
        f"Here are more options (page {next_page})."
        if listings
        else "That’s everything I can find for now."
    )

    action_params: dict[str, Any] = {
        "listings": listings,
        "search_params": search_params,
        "tenure": tenure,
        "relaxed": False,
        "page": next_page,
        "page_size": page_size,
        "total": total,
        "has_more": has_more,
    }

    traces = {
        "states_visited": ["FOLLOWUP_PAGINATE"],
        "tenure": tenure,
        "extracted_params": search_params,
        "followup": {
            "type": "paginate_next",
            "page": next_page,
            "page_size": page_size,
            "total": total,
        },
        "search_result_count": len(listings),
        "total_results": total,
    }

    return AgentResponse(
        reply=reply,
        actions=[
            AgentAction(
                type="show_listings",
                params=action_params,
            )
        ],
        traces=traces,
    )


# State machine states
State = Literal[
    "TENURE_DECIDE",  # Determine rental mode (short_term vs long_term)
    "SLOT_FILL",      # Extract search params from input
    "SEARCH",         # Execute search with params
    "RELAX",          # Relax constraints if empty results
    "SHOW_LISTINGS",  # Return property cards
    "ANSWER_QA",      # Answer property question
    "CLARIFY",        # Ask for clarification
    "ERROR",          # Error state
]


@dataclass
class PolicyState:
    """Internal state for policy execution."""
    current_state: State
    tenure: str | None  # 'short_term' or 'long_term'
    search_params: SearchParams | None
    results: list[PropertyCard]
    relax_attempt: int  # 0 = no relax, 1 = first relax, 2+ = give up
    qa_listing_id: str | None
    qa_question: str | None
    error_msg: str | None
    traces: dict[str, Any]  # Observability data
    page: int
    page_size: int
    total_results: int | None


def initial_state() -> PolicyState:
    """Create initial policy state."""
    return PolicyState(
        current_state="TENURE_DECIDE",
        tenure=None,
        search_params=None,
        results=[],
        relax_attempt=0,
        qa_listing_id=None,
        qa_question=None,
        error_msg=None,
        traces={"states_visited": []},
        page=1,
        page_size=10,
        total_results=None,
    )


def tenure_decide(request: AgentRequest, state: PolicyState) -> PolicyState:
    """
    Determine rental mode (short_term vs long_term) from input.

    Rule-based detection:
    - Short-term indicators: "night", "nightly", "week", "weekend", "vacation", "holiday"
    - Long-term indicators: "month", "monthly", "rent", "lease", "6 months", "year"
    - Ambiguous: Default to short_term

    Transition:
    - → SLOT_FILL with tenure set
    """
    state.traces["states_visited"].append("TENURE_DECIDE")

    input_text = request["input"].lower()

    # Short-term signals
    short_term_signals = [
        "night", "nightly", "per night", "/night",
        "week", "weekly", "weekend",
        "vacation", "holiday", "getaway",
        "stay", "staying",
        "day", "days",
    ]

    # Long-term signals
    long_term_signals = [
        "month", "monthly", "per month", "/month",
        "rent", "rental", "lease", "leasing",
        "6 months", "year", "annual",
        "long term", "long-term", "longterm",
        "move in", "move-in", "relocate",
    ]

    # Count signals
    short_term_count = sum(1 for signal in short_term_signals if signal in input_text)
    long_term_count = sum(1 for signal in long_term_signals if signal in input_text)

    # Decide tenure
    if long_term_count > short_term_count:
        tenure = "long_term"
    elif short_term_count > 0:
        tenure = "short_term"
    else:
        # Ambiguous - default to short_term (most common use case)
        tenure = "short_term"

    state.tenure = tenure
    state.current_state = "SLOT_FILL"
    state.traces["tenure"] = tenure
    state.traces["tenure_signals"] = {
        "short_term_count": short_term_count,
        "long_term_count": long_term_count,
    }

    return state


def slot_fill(request: AgentRequest, state: PolicyState) -> PolicyState:
    """
    Extract search parameters from natural language input.

    Rule-based extraction:
    - Tenure: Already set by TENURE_DECIDE
    - Location: Look for city/district names
    - Budget: Use normalize_budget() tool
    - Bedrooms: Use extract_bedrooms() tool
    - Property type: Use extract_property_type() tool
    - Amenities: Use extract_amenities() tool
    - Date range: Use parse_date_range() tool (S3)

    Transition:
    - → SEARCH if params extracted
    - → CLARIFY if critical params missing (location or budget)
    """
    state.traces["states_visited"].append("SLOT_FILL")

    input_text = request["input"]
    params = SearchParams(max_results=25)

    # Set tenure from state (already decided)
    if state.tenure:
        params["tenure"] = state.tenure

    # Extract location (required)
    location_keywords = ["kyrenia", "girne", "famagusta", "magusa", "nicosia", "lefkosa",
                         "catalkoy", "bellapais", "alsancak", "escape beach"]
    input_lower = input_text.lower()

    found_location = None
    for keyword in location_keywords:
        if keyword in input_lower:
            found_location = keyword.title()
            break

    if found_location:
        params["location"] = found_location

    # Extract budget (required)
    budget = tools.normalize_budget(input_text)
    if budget:
        params["budget"] = budget

    # Extract bedrooms (optional)
    bedrooms = tools.extract_bedrooms(input_text)
    if bedrooms is not None:
        params["bedrooms"] = bedrooms

    # Extract property type (optional)
    property_type = tools.extract_property_type(input_text)
    if property_type:
        params["property_type"] = property_type

    # Extract amenities (optional)
    amenities = tools.extract_amenities(input_text)
    if amenities:
        params["amenities"] = amenities

    # Extract date range (optional, S3)
    date_range = tools.parse_date_range(input_text)
    if date_range:
        params["date_range"] = date_range

    # Apply saved user preferences (precedence: current turn > explicit > inferred)
    try:
        capsule = (request.get("ctx", {}).get("conversation_capsule") or {})  # type: ignore
        # Respect per-thread pause flag if provided by supervisor/frontend later
        personalization_paused = bool(capsule.get("personalization_paused") or capsule.get("prefs_paused"))
        prefs = (capsule.get("preferences") or {}) if not personalization_paused else {}
        applied: list[str] = []

        if isinstance(prefs, dict):
            re_prefs = prefs.get("real_estate") or prefs.get("realestate") or prefs.get("property")
            if isinstance(re_prefs, list):
                # Helper readers
                def _from_val(v: Any) -> Any:
                    if isinstance(v, dict):
                        if v.get("type") == "single":
                            return v.get("value")
                        if v.get("type") == "list":
                            vs = v.get("values") or []
                            return vs[0] if vs else None
                    return v

                # Build a simple map type->(value, confidence, source) with highest confidence per type
                best: dict[str, tuple[Any, float, str]] = {}
                for item in re_prefs:
                    try:
                        ptype = str(item.get("type") or item.get("preference_type") or "").lower()
                        val = item.get("value")
                        conf = float(item.get("confidence") or 0.0)
                        src = str(item.get("source") or "")
                        if not ptype:
                            continue
                        prev = best.get(ptype)
                        if (prev is None) or (conf > prev[1]):
                            best[ptype] = (val, conf, src)
                    except Exception:
                        continue

                # Fill only missing fields; current-turn extraction wins
                # location
                if not params.get("location") and "location" in best:
                    v, _, _ = best["location"]
                    loc = _from_val(v)
                    if isinstance(loc, str) and loc.strip():
                        params["location"] = loc.strip().title()
                        applied.append("location")

                # budget
                if not params.get("budget") and "budget" in best:
                    v, _, _ = best["budget"]
                    bud = v if isinstance(v, dict) else {}
                    try:
                        # Accept either {'min','max','currency'} or {'type':'range','min','max','unit'}
                        min_v = bud.get("min")
                        max_v = bud.get("max")
                        if min_v is None and isinstance(bud.get("exact"), (int, float)):
                            min_v = max_v = bud.get("exact")
                        cur = bud.get("currency") or bud.get("unit") or "EUR"
                        if isinstance(min_v, (int, float)) and isinstance(max_v, (int, float)):
                            params["budget"] = {"min": int(min_v), "max": int(max_v), "currency": str(cur).upper()}
                            applied.append("budget")
                    except Exception:
                        pass

                # bedrooms
                if params.get("bedrooms") is None and "bedrooms" in best:
                    v, _, _ = best["bedrooms"]
                    count = None
                    if isinstance(v, dict):
                        count = v.get("count") or v.get("value")
                    elif isinstance(v, (int, float)):
                        count = v
                    if isinstance(count, (int, float)):
                        params["bedrooms"] = int(count)
                        applied.append("bedrooms")

                # property_type
                if not params.get("property_type") and "property_type" in best:
                    v, _, _ = best["property_type"]
                    p = _from_val(v)
                    if isinstance(p, str) and p.strip():
                        params["property_type"] = p.strip().lower()
                        applied.append("property_type")

                # amenities
                if not params.get("amenities") and "amenities" in best:
                    v, _, _ = best["amenities"]
                    am = v.get("values") if isinstance(v, dict) else v
                    if isinstance(am, list) and am:
                        params["amenities"] = [str(a).lower().replace(" ", "_") for a in am if a]
                        applied.append("amenities")

                if applied:
                    # Metric: preferences applied for this agent
                    try:
                        inc_prefs_applied("real_estate")
                    except Exception:
                        pass
                    state.traces["preferences_applied"] = True
                    state.traces["preferences_applied_fields"] = applied
    except Exception:
        # Never block on preference application
        pass

    # Check if we have minimum required params (location OR budget)
    has_location = "location" in params and params["location"]
    has_budget = "budget" in params and params["budget"]

    if not has_location and not has_budget:
        # Not enough info - ask for clarification
        state.current_state = "CLARIFY"
        state.error_msg = "missing_location_and_budget"
        state.traces["clarification_reason"] = "No location or budget found"
        return state

    # We have enough params - proceed to search
    state.search_params = params
    state.current_state = "SEARCH"
    state.traces["extracted_params"] = params
    return state


def search(state: PolicyState) -> PolicyState:
    """
    Execute property search with extracted params.

    Uses tools.search_listings() with intelligent margins:
    - +10% on max budget
    - +1 bedroom flexibility
    - Fuzzy location matching

    Transition:
    - → SHOW_LISTINGS if results found
    - → RELAX if empty results and relax_attempt < 2
    - → CLARIFY if empty results and relax_attempt >= 2
    """
    state.traces["states_visited"].append("SEARCH")

    if not state.search_params:
        state.current_state = "ERROR"
        state.error_msg = "No search params available"
        return state

    # Execute search (page 1)
    state.page = 1
    state.page_size = min(state.search_params.get("max_results", 25) or 25, 10)
    results, total = tools.search_listings(
        state.search_params,
        page=state.page,
        page_size=state.page_size,
        return_total=True,
    )
    state.results = results
    state.total_results = total
    state.traces["search_result_count"] = len(results)
    state.traces["total_results"] = total
    state.traces["page_size"] = state.page_size
    state.traces["page"] = state.page

    # TODO: Emit Prometheus metric: agent_re_search_results_count

    if len(results) > 0:
        # Success - show listings
        state.current_state = "SHOW_LISTINGS"
        return state

    # Empty results - try relaxing constraints
    if state.relax_attempt < 2:
        state.current_state = "RELAX"
        return state

    # Already relaxed twice - give up and ask for clarification
    state.current_state = "CLARIFY"
    state.error_msg = "no_results_after_relax"
    state.traces["clarification_reason"] = "No results found even after relaxing constraints"
    return state


def relax(state: PolicyState) -> PolicyState:
    """
    Relax search constraints to find more results.

    Relaxation strategy (bounded):
    1. First relax: Remove property_type filter and widen budget max by +15%
    2. Second relax: Remove amenities filter and drop bedrooms upper cap (keep >= requested)

    Transition:
    - → SEARCH with relaxed params
    """
    state.traces["states_visited"].append("RELAX")
    state.relax_attempt += 1

    if not state.search_params:
        state.current_state = "ERROR"
        state.error_msg = "No search params to relax"
        return state

    params = state.search_params.copy()

    # First relax: Remove property type constraint and widen budget
    if state.relax_attempt == 1:
        if "property_type" in params:
            del params["property_type"]
            state.traces["relax_1"] = "Removed property_type filter"
        # Widen budget by +15%
        try:
            b = params.get("budget")
            if isinstance(b, dict) and isinstance(b.get("max"), (int, float)):
                b = dict(b)
                b["max"] = int(b["max"] * 1.15)
                params["budget"] = b
                state.traces["relax_1_budget"] = "+15% max"
        except Exception:
            pass

    # Second relax: Remove amenities constraint and bedrooms upper cap
    elif state.relax_attempt == 2:
        if "amenities" in params:
            del params["amenities"]
            state.traces["relax_2"] = "Removed amenities filter"
        # Drop bedrooms upper cap by signalling relaxed mode (search handles this)
        try:
            if params.get("bedrooms") is not None:
                params["bedrooms_relaxed"] = True
                state.traces["relax_2_bedrooms"] = "Dropped upper cap"
        except Exception:
            pass

    state.search_params = params
    state.current_state = "SEARCH"
    return state


def answer_qa(request: AgentRequest, state: PolicyState) -> PolicyState:
    """
    Answer question about a specific property.

    Detection: Input contains "prop-XXX" or refers to shown recommendation.

    Uses tools.answer_property_qa() for field-based answers.

    Transition:
    - → SHOW_LISTINGS with qa_answer in reply
    - → CLARIFY if listing not found
    """
    state.traces["states_visited"].append("ANSWER_QA")

    input_text = request["input"]

    # Extract listing ID from input
    # Pattern 1: Explicit ID mention ("prop-001")
    import re
    match = re.search(r"prop-\d+", input_text.lower())
    if match:
        listing_id = match.group(0)
    else:
        # Pattern 2: "the first one", "the second property" (S3: track shown cards)
        # S2: No context tracking yet
        state.current_state = "CLARIFY"
        state.error_msg = "no_listing_identified"
        state.traces["clarification_reason"] = "Could not identify which property you're asking about"
        return state

    state.qa_listing_id = listing_id
    state.qa_question = input_text

    # Get answer from tools
    answer = tools.answer_property_qa(listing_id, input_text)

    if not answer:
        # Listing not found or question couldn't be answered
        state.current_state = "CLARIFY"
        state.error_msg = "listing_not_found"
        state.traces["clarification_reason"] = f"Could not find listing {listing_id}"
        return state

    # Success - return answer (no show_listings action, just reply)
    state.current_state = "SHOW_LISTINGS"  # Terminal state
    state.traces["qa_answer"] = answer
    return state


def is_qa_intent(request: AgentRequest) -> bool:
    """
    Detect if input is a property Q&A intent.

    Heuristics:
    - Contains "prop-XXX" pattern
    - Contains question words + property reference ("does it have...", "is there...")
    - Intent is explicitly "property_qa"

    Returns:
        True if Q&A intent
    """
    input_lower = request["input"].lower()

    # Explicit intent
    if request["intent"] == "property_qa":
        return True

    # Contains property ID
    if "prop-" in input_lower:
        return True

    # Question words + property reference words
    # BUT exclude search verbs like "show", "find", "search", "looking"
    question_words = ["does", "is", "can", "has", "do", "are", "what", "how", "when"]
    property_refs = ["it", "property", "listing", "apartment", "villa", "house", "place"]
    search_verbs = ["show", "find", "search", "looking", "need", "want", "get"]

    has_question = any(word in input_lower.split() for word in question_words)
    has_property_ref = any(word in input_lower for word in property_refs)
    has_search_verb = any(verb in input_lower for verb in search_verbs)

    # Only Q&A if we have question + property ref BUT NOT a search verb
    if has_question and has_property_ref and not has_search_verb:
        return True

    return False


def execute_policy(request: AgentRequest) -> AgentResponse:
    """
    Execute the Real Estate Agent policy state machine.

    Entry point for agent execution.

    Args:
        request: AgentRequest from supervisor

    Returns:
        AgentResponse with reply, actions, and traces

    Metrics emitted:
        - agent_re_policy_state_total (counter, labels: state)
        - agent_re_policy_execution_duration_seconds (histogram)
    """
    # TODO: Start timer for metrics

    # Initialize state
    state = initial_state()

    capsule = request["ctx"].get("conversation_capsule") if isinstance(request.get("ctx"), dict) else {}
    followup_type = detect_followup_intent(request["input"])
    if followup_type and capsule:
        followup_response = build_followup_response(request, capsule, followup_type)
        if followup_response:
            return followup_response

    # Check if this is a Q&A intent
    if is_qa_intent(request):
        state.current_state = "ANSWER_QA"

    # State machine loop (bounded: max 10 transitions)
    max_iterations = 10
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        current = state.current_state

        # TODO: Emit metric for state visit

        # Terminal states
        if current in ["SHOW_LISTINGS", "CLARIFY", "ERROR"]:
            break

        # State transitions
        if current == "TENURE_DECIDE":
            state = tenure_decide(request, state)
        elif current == "SLOT_FILL":
            state = slot_fill(request, state)
        elif current == "SEARCH":
            state = search(state)
        elif current == "RELAX":
            state = relax(state)
        elif current == "ANSWER_QA":
            state = answer_qa(request, state)
        else:
            # Unknown state - error
            state.current_state = "ERROR"
            state.error_msg = f"Unknown state: {current}"
            break

    # Build response based on final state
    response = build_response(request, state)

    # TODO: Emit execution duration metric

    return response


def build_response(request: AgentRequest, state: PolicyState) -> AgentResponse:
    """
    Build AgentResponse from final policy state.

    Maps states to actions:
    - SHOW_LISTINGS → show_listings action (+ Q&A answer in reply if qa path)
    - CLARIFY → ask_clarification action
    - ERROR → error action
    """
    final_state = state.current_state
    locale = request["ctx"]["locale"]

    # Localization helpers (S3: use proper i18n)
    def t(key: str) -> str:
        """Simple translation stub."""
        translations = {
            "en": {
                "found_properties": "I found {count} properties matching your search:",
                "no_results": "I couldn't find any properties matching your criteria. Could you provide more details?",
                "need_location_or_budget": "To search for properties, I need either a location (e.g., Kyrenia) or a budget range (e.g., £500-600 per night).",
                "error": "Sorry, something went wrong. Please try again.",
                "qa_answer_prefix": "Regarding the property: ",
            },
            # S3: Add tr, ru, de, pl translations
        }
        return translations.get(locale, translations["en"]).get(key, key)

    # SHOW_LISTINGS state
    if final_state == "SHOW_LISTINGS":
        # Check if this is a Q&A response or search response
        if "qa_answer" in state.traces:
            qa_answer: QAAnswer = state.traces["qa_answer"]
            reply = f"{t('qa_answer_prefix')}{qa_answer['answer']}"
            actions = []  # No show_listings action for Q&A
        else:
            # Search response
            total = state.total_results if state.total_results is not None else len(state.results)
            tenure_text = "nightly rentals" if state.tenure == "short_term" else "monthly rentals"
            if state.page > 1:
                reply = f"Here are more {tenure_text} (page {state.page}):"
            else:
                reply = f"I found {total} {tenure_text} matching your search:"
            has_more = bool(total) and (total > state.page * state.page_size)
            state.traces["has_more"] = has_more
            max_results = (state.search_params or {}).get("max_results")
            if max_results is None and state.total_results is not None:
                max_results = state.total_results
            action_params = {
                "listings": state.results,
                "search_params": state.search_params or {},
                "tenure": state.tenure,
                "relaxed": state.relax_attempt > 0,
                "page": state.page,
                "page_size": state.page_size,
                "total": total,
                "has_more": has_more,
            }
            if max_results is not None:
                action_params["max_results"] = max_results
            actions = [
                AgentAction(
                    type="show_listings",
                    params=action_params,
                )
            ]

        # Append a short "why" note if preferences were applied
        if state.traces.get("preferences_applied"):
            applied = state.traces.get("preferences_applied_fields") or []
            if applied:
                pretty = ", ".join(applied)
                reply = f"{reply} Using your saved preferences ({pretty})."

        return AgentResponse(
            reply=reply,
            actions=actions,
            traces=state.traces,
        )

    # CLARIFY state
    elif final_state == "CLARIFY":
        error_msg = state.error_msg or "unknown"

        if error_msg == "missing_location_and_budget":
            reply = t("need_location_or_budget")
        elif error_msg == "no_results_after_relax":
            reply = t("no_results")
        elif error_msg == "no_listing_identified":
            reply = "Which property are you asking about? You can refer to it by its ID (e.g., prop-001)."
        elif error_msg == "listing_not_found":
            reply = f"I couldn't find the property you're asking about. Could you check the ID?"
        else:
            reply = t("no_results")

        return AgentResponse(
            reply=reply,
            actions=[
                AgentAction(
                    type="ask_clarification",
                    params={"reason": error_msg}
                )
            ],
            traces=state.traces,
        )

    # ERROR state
    elif final_state == "ERROR":
        return AgentResponse(
            reply=t("error"),
            actions=[
                AgentAction(
                    type="error",
                    params={"message": state.error_msg or "Unknown error"}
                )
            ],
            traces=state.traces,
        )

    # Fallback (shouldn't happen)
    else:
        return AgentResponse(
            reply=t("error"),
            actions=[
                AgentAction(
                    type="error",
                    params={"message": f"Invalid final state: {final_state}"}
                )
            ],
            traces=state.traces,
        )
