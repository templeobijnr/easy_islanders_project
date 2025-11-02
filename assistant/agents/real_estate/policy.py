"""
Real Estate Agent Policy - Deterministic state machine controller.

State Flow:
    SLOT_FILL → SEARCH → SHOW_LISTINGS (success path)
                      ↓
                   RELAX → SHOW_LISTINGS (empty results, relaxed)
                      ↓
                   CLARIFY (still empty after relax)

    ANSWER_QA (property question path)

No free-form LLM routing - all transitions are rule-based.
"""

from typing import Literal, Any
from dataclasses import dataclass

from assistant.agents.contracts import AgentRequest, AgentResponse, AgentAction, AgentContext
from assistant.agents.real_estate.schema import SearchParams, PropertyCard, QAAnswer
from assistant.agents.real_estate import tools


# State machine states
State = Literal[
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
    search_params: SearchParams | None
    results: list[PropertyCard]
    relax_attempt: int  # 0 = no relax, 1 = first relax, 2+ = give up
    qa_listing_id: str | None
    qa_question: str | None
    error_msg: str | None
    traces: dict[str, Any]  # Observability data


def initial_state() -> PolicyState:
    """Create initial policy state."""
    return PolicyState(
        current_state="SLOT_FILL",
        search_params=None,
        results=[],
        relax_attempt=0,
        qa_listing_id=None,
        qa_question=None,
        error_msg=None,
        traces={"states_visited": []},
    )


def slot_fill(request: AgentRequest, state: PolicyState) -> PolicyState:
    """
    Extract search parameters from natural language input.

    Rule-based extraction:
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

    # Execute search
    results = tools.search_listings(state.search_params)
    state.results = results
    state.traces["search_result_count"] = len(results)

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
    1. First relax: Remove property_type filter
    2. Second relax: Remove amenities filter

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

    # First relax: Remove property type constraint
    if state.relax_attempt == 1:
        if "property_type" in params:
            del params["property_type"]
            state.traces["relax_1"] = "Removed property_type filter"

    # Second relax: Remove amenities constraint
    elif state.relax_attempt == 2:
        if "amenities" in params:
            del params["amenities"]
            state.traces["relax_2"] = "Removed amenities filter"

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
        if current == "SLOT_FILL":
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
            count = len(state.results)
            reply = t("found_properties").format(count=count)
            actions = [
                AgentAction(
                    type="show_listings",
                    params={
                        "listings": state.results,
                        "search_params": state.search_params,
                        "relaxed": state.relax_attempt > 0,
                    }
                )
            ]

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
