"""
Real Estate Agent Handler (Prompt-Driven v1.0)

Canonical implementation using Jinja2 system prompt for deterministic slot-filling.
Replaces legacy slot extraction with prompt-driven flow.
"""

from typing import Dict, Any, Optional, Tuple
import logging
import time
from assistant.brain.prompts.renderer import render_real_estate_prompt, parse_real_estate_response
from assistant.domain.real_estate_service import (
    extract_slots,
    merge_and_commit_slots,
    get_missing_slots,
    should_execute_search
)
from assistant.domain.real_estate_search import search_listings, format_listing_for_card
from assistant.brain.tools import RecommendationCardPayload, CardItem
from assistant.brain.supervisor_schemas import SupervisorState

logger = logging.getLogger(__name__)


def handle_real_estate_prompt_driven(state: SupervisorState) -> SupervisorState:
    """
    Real Estate Agent handler using canonical Jinja2 prompt.

    Flow:
    1. Extract and merge slots from user input
    2. Render system prompt with full context (memory, fused_context, collected_info)
    3. Call LLM with prompt
    4. Parse and validate JSON response
    5. Execute action based on `act` field:
       - ASK_SLOT: Return speak text, update slots, wait for next turn
       - SEARCH_AND_RECOMMEND: Call backend search, emit recommendation cards
       - ESCALATE: Switch domain
       - CLARIFY: Ask clarifying question
    6. Update agent context and conversation state

    Returns:
        Updated SupervisorState with response and metadata
    """
    thread_id = state.get("thread_id", "unknown")
    user_input = state.get("user_input", "")

    logger.info(f"[{thread_id}] RE Agent (Prompt-Driven): processing '{user_input[:50]}'...")

    # Step 1: Extract and merge slots
    agent_contexts = state.get("agent_contexts") or {}
    re_ctx = agent_contexts.get("real_estate_agent", {}) or {}
    existing_slots = re_ctx.get("filled_slots", {}) or {}

    # Extract new slots from current input
    new_slots = extract_slots(user_input)

    # Merge with existing
    merged_slots = merge_and_commit_slots(existing_slots, new_slots)

    logger.info(
        f"[{thread_id}] RE Agent: slots - existing={existing_slots}, new={new_slots}, merged={merged_slots}"
    )

    # Step 2: Render prompt with full context
    conversation_summary = state.get("memory_context_summary", "")
    fused_context = state.get("agent_specific_context", "")
    user_profile = state.get("user_profile", {})
    token_budget = {
        "remaining": state.get("token_budget_remaining", 0),
        "max": state.get("token_budget_max", 6000)
    }

    system_prompt = render_real_estate_prompt(
        thread_id=thread_id,
        active_domain=state.get("active_domain", "real_estate_agent"),
        current_intent=state.get("current_intent", "property_search"),
        user_input=user_input,
        conversation_summary=conversation_summary,
        fused_context=fused_context,
        user_profile=user_profile,
        agent_collected_info=merged_slots,
        token_budget=token_budget
    )

    logger.debug(
        f"[{thread_id}] RE Agent: rendered prompt ({len(system_prompt)} chars)"
    )

    # Step 3: Call LLM
    try:
        from assistant.llm import generate_chat_completion

        llm_response_text = generate_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            temperature=0.7,
            max_tokens=500
        )

        logger.debug(
            f"[{thread_id}] RE Agent: LLM response - {llm_response_text[:100]}..."
        )

    except Exception as e:
        logger.error(
            f"[{thread_id}] RE Agent: LLM call failed: {e}",
            exc_info=True
        )
        # Fallback response
        return _build_error_response(state, "I'm having trouble processing your request. Please try again.")

    # Step 4: Parse and validate JSON response
    parsed = parse_real_estate_response(llm_response_text, strict=True)

    if not parsed:
        logger.error(
            f"[{thread_id}] RE Agent: JSON parsing failed, raw response: {llm_response_text[:200]}"
        )
        return _build_error_response(state, "I apologize, I need to reformulate my response. Could you repeat that?")

    act = parsed.get("act")
    speak = parsed.get("speak", "")
    slots_delta = parsed.get("slots_delta", {})
    next_needed = parsed.get("next_needed", [])
    notes = parsed.get("notes", {})

    logger.info(
        f"[{thread_id}] RE Agent: parsed - act={act}, slots_delta={slots_delta}, next_needed={next_needed}"
    )

    # Step 5: Update merged slots with slots_delta from LLM
    if slots_delta:
        merged_slots = merge_and_commit_slots(merged_slots, slots_delta)

    # Update agent context
    re_ctx.update({
        "filled_slots": merged_slots,
        "awaiting_slot": next_needed[0] if next_needed else None,
        "stage": _determine_stage(act, merged_slots),
        "last_active": time.time()
    })
    agent_contexts["real_estate_agent"] = re_ctx
    state["agent_contexts"] = agent_contexts

    # Step 6: Execute action based on act
    if act == "ASK_SLOT":
        return _handle_ask_slot(state, speak, merged_slots, next_needed, notes)

    elif act == "SEARCH_AND_RECOMMEND":
        return _handle_search_and_recommend(state, speak, merged_slots, notes)

    elif act == "ACK_AND_SEARCH":
        # Similar to SEARCH_AND_RECOMMEND but may have partial slots
        return _handle_search_and_recommend(state, speak, merged_slots, notes)

    elif act == "ESCALATE":
        return _handle_escalate(state, speak, notes)

    elif act == "CLARIFY":
        return _handle_clarify(state, speak, merged_slots, notes)

    else:
        logger.warning(
            f"[{thread_id}] RE Agent: unknown act '{act}', defaulting to ASK_SLOT"
        )
        return _handle_ask_slot(state, speak, merged_slots, next_needed, notes)


def _determine_stage(act: str, filled_slots: Dict[str, Any]) -> str:
    """Determine conversation stage based on action and slots."""
    if act == "SEARCH_AND_RECOMMEND":
        return "presenting"
    elif act in ("ASK_SLOT", "CLARIFY"):
        return "slot_filling"
    elif act == "ESCALATE":
        return "completed"
    else:
        return "discovery"


def _handle_ask_slot(
    state: SupervisorState,
    speak: str,
    merged_slots: Dict[str, Any],
    next_needed: list,
    notes: Dict[str, Any]
) -> SupervisorState:
    """Handle ASK_SLOT action - return question to user."""
    thread_id = state.get("thread_id", "unknown")

    logger.info(
        f"[{thread_id}] RE Agent: ASK_SLOT - asking for {next_needed}, speak='{speak[:50]}...'"
    )

    return _with_history(
        state,
        {
            "final_response": speak,
            "current_node": "real_estate_agent",
            "is_complete": True,
            "agent_name": "real_estate",
            "agent_collected_info": merged_slots,
            "agent_conversation_stage": "slot_filling",
            "re_agent_act": "ASK_SLOT",
            "re_agent_next_needed": next_needed,
            "re_agent_notes": notes
        },
        speak
    )


def _handle_search_and_recommend(
    state: SupervisorState,
    speak: str,
    merged_slots: Dict[str, Any],
    notes: Dict[str, Any]
) -> SupervisorState:
    """Handle SEARCH_AND_RECOMMEND action - query backend and emit cards."""
    thread_id = state.get("thread_id", "unknown")

    logger.info(
        f"[{thread_id}] RE Agent: SEARCH_AND_RECOMMEND - executing search with slots={merged_slots}"
    )

    # Call backend search API
    try:
        search_results = search_listings(filled_slots=merged_slots, max_results=20)

        result_count = search_results.get("count", 0)
        listings = search_results.get("results", [])
        filters_used = search_results.get("filters_used", {})

        logger.info(
            f"[{thread_id}] RE Agent: search returned {result_count} results"
        )

        # Format listings as cards
        card_items = [format_listing_for_card(listing) for listing in listings]

        # Build recommendation card payload
        card_payload = RecommendationCardPayload(
            items=card_items,
            count=result_count,
            filters_used=filters_used,
            summary=speak
        )

        # Convert to dict for JSON serialization
        recommendations = [item.dict() for item in card_items]

        logger.info(
            f"[{thread_id}] RE Agent: emitting {len(recommendations)} recommendation cards"
        )

        return _with_history(
            state,
            {
                "final_response": speak,
                "current_node": "real_estate_agent",
                "is_complete": True,
                "agent_name": "real_estate",
                "agent_collected_info": merged_slots,
                "agent_conversation_stage": "presenting",
                "recommendations": recommendations,
                "re_agent_act": "SEARCH_AND_RECOMMEND",
                "re_agent_card_payload": card_payload.dict(),
                "re_agent_notes": notes
            },
            speak
        )

    except Exception as e:
        logger.error(
            f"[{thread_id}] RE Agent: search failed: {e}",
            exc_info=True
        )
        # Fallback to error response
        return _build_error_response(
            state,
            "I encountered an issue searching for properties. Could you try rephrasing your request?"
        )


def _handle_escalate(
    state: SupervisorState,
    speak: str,
    notes: Dict[str, Any]
) -> SupervisorState:
    """Handle ESCALATE action - switch domain."""
    thread_id = state.get("thread_id", "unknown")

    logger.info(
        f"[{thread_id}] RE Agent: ESCALATE - switching domain, reason={notes.get('continuity_reason')}"
    )

    # Signal supervisor to re-route
    return {
        **state,
        "final_response": speak,
        "current_node": "real_estate_agent",
        "is_complete": True,
        "should_reroute": True,  # Signal to supervisor
        "re_agent_act": "ESCALATE",
        "re_agent_notes": notes
    }


def _handle_clarify(
    state: SupervisorState,
    speak: str,
    merged_slots: Dict[str, Any],
    notes: Dict[str, Any]
) -> SupervisorState:
    """Handle CLARIFY action - ask clarifying question."""
    thread_id = state.get("thread_id", "unknown")

    logger.info(
        f"[{thread_id}] RE Agent: CLARIFY - speak='{speak[:50]}...'"
    )

    return _with_history(
        state,
        {
            "final_response": speak,
            "current_node": "real_estate_agent",
            "is_complete": True,
            "agent_name": "real_estate",
            "agent_collected_info": merged_slots,
            "agent_conversation_stage": "slot_filling",
            "re_agent_act": "CLARIFY",
            "re_agent_notes": notes
        },
        speak
    )


def _build_error_response(state: SupervisorState, error_message: str) -> SupervisorState:
    """Build error response state."""
    return _with_history(
        state,
        {
            "final_response": error_message,
            "current_node": "real_estate_agent",
            "is_complete": True,
            "agent_name": "real_estate",
            "error": True
        },
        error_message
    )


def _with_history(
    state: SupervisorState,
    updates: Dict[str, Any],
    assistant_message: str
) -> SupervisorState:
    """
    Helper to append messages to history and update state.

    Preserves conversation history and message flow.
    """
    new_state = {**state, **updates}

    # Append assistant message to history
    history = list(state.get("messages", []))
    history.append({
        "role": "assistant",
        "content": assistant_message,
        "agent": "real_estate_agent",
        "timestamp": time.time()
    })
    new_state["messages"] = history

    return new_state
