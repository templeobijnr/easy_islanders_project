"""
LangGraph supervisor topology and worker handlers.

This module wires the CentralSupervisor into a LangGraph `StateGraph`, registers
worker nodes for each domain agent, and documents the routing rules used by the
hierarchical multi-agent system.  Handlers focus on fast acknowledgement of the
user request—heavy lifting is delegated to downstream tools or flows.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from django.conf import settings
import logging
import os
import time
from typing import Dict, Any, List, Optional
import tiktoken

from assistant.memory import read_enabled
from assistant.brain.config import PREFS_APPLY_ENABLED
from assistant.services.preferences import PreferenceService
from assistant.memory.service import fetch_thread_context
from django.core.cache import cache

from .supervisor import CentralSupervisor
from .supervisor_schemas import SupervisorState
from .tools_local import (
    get_on_duty_pharmacies,
    find_places,
    web_search,
    normalize_city,
    geocode,
    overpass_pharmacies_near_city,
)
from .observability import traced_supervisor_node, traced_worker_agent
from .registry import get_registry_client
from .zep_client import ZepClient

logger = logging.getLogger(__name__)

_SUPERVISOR_MEMORY = MemorySaver()
_COMPILED_SUPERVISOR_GRAPH = None

try:
    _ZEP_CLIENT = ZepClient(base_url=os.getenv("ZEP_URL"), api_key=os.getenv("ZEP_API_KEY"))
    logger.info("[ZEP] Client initialized (base=%s)", _ZEP_CLIENT.base_url)
except Exception as _zep_init_error:  # noqa: BLE001
    logger.warning("[ZEP] Client initialization failed: %s", _zep_init_error)
    _ZEP_CLIENT = None

STICKY_TTL_SECONDS = 180  # seconds
FOLLOWUP_PREFIXES = ("show me", "show us", "show the", "details", "detail")
FOLLOWUP_EXACT = {
    "show",
    "show me",
    "more",
    "next",
    "next please",
    "another",
    "show more",
    "more please",
    "show more options",
}


def _is_followup_utterance(text: str) -> bool:
    """Lightweight detection for deictic follow-ups like 'show me' or 'more'."""
    if not text:
        return False
    normalized = text.strip().lower()
    if normalized in FOLLOWUP_EXACT:
        return True
    return any(normalized.startswith(prefix) for prefix in FOLLOWUP_PREFIXES)


def _extract_assistant_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        for key in ("message", "text", "content"):
            value = content.get(key)
            if value:
                return str(value)
        return str(content)
    return str(content)


def _zep_store_memory(thread_id: str | None, role: str, content: str) -> None:
    if not thread_id or not content or _ZEP_CLIENT is None:
        return
    try:
        _ZEP_CLIENT.add_memory(thread_id, role, content)
    except Exception as exc:  # noqa: BLE001
        logger.debug("[ZEP] add_memory raised: %s", exc)


def _inject_zep_context(state: SupervisorState) -> SupervisorState:
    if _ZEP_CLIENT is None:
        return state
    thread_id = state.get("thread_id")
    user_text = state.get("user_input")
    if not thread_id or not user_text:
        return state
    try:
        snippets = _ZEP_CLIENT.query_memory(thread_id, user_text)
    except Exception as exc:  # noqa: BLE001
        logger.debug("[ZEP] query_memory raised: %s", exc)
        return state
    if not snippets:
        return {**state, "retrieved_context": ""}
    joined = "\n".join(snippets)
    logger.info("[ZEP] Retrieved %d memories for %s", len(snippets), thread_id)
    return {**state, "retrieved_context": joined}


def _append_turn_history(state: SupervisorState, assistant_output: Any) -> SupervisorState:
    history: List[Dict[str, str]] = list(state.get("history") or [])
    user_text = state.get("user_input")
    appended_user = False
    if user_text:
        if not history or history[-1].get("role") != "user" or history[-1].get("content") != user_text:
            history.append({"role": "user", "content": str(user_text)})
            appended_user = True

    assistant_text = _extract_assistant_text(assistant_output).strip()
    appended_assistant = False
    if assistant_text:
        if not history or history[-1].get("role") != "assistant" or history[-1].get("content") != assistant_text:
            history.append({"role": "assistant", "content": assistant_text})
            appended_assistant = True

    if history == state.get("history"):
        return state

    updated_state = {**state, "history": history}
    thread = state.get("thread_id")
    if thread:
        try:
            logger.info("[%s] Stored turn: user='%s' | assistant='%s'", thread, (user_text or "")[:40], assistant_text[:40])
        except Exception:
            pass
        if appended_user and user_text:
            _zep_store_memory(thread, "user", str(user_text))
        if appended_assistant and assistant_text:
            _zep_store_memory(thread, "assistant", assistant_text)
    return updated_state


def _with_history(state: SupervisorState, updates: Dict[str, Any], assistant_output: Any) -> SupervisorState:
    merged = {**state, **updates}
    return _append_turn_history(merged, assistant_output)


def _maybe_route_sticky(state: SupervisorState) -> tuple[str | None, Dict[str, Any] | None]:
    """
    Determine whether the current turn should sticky-route to the previous agent.

    Returns (agent_key, updated_conversation_ctx) or (None, None)
    """
    from django.core.cache import cache
    conversation_ctx: Dict[str, Any] = dict(state.get("conversation_ctx") or {})
    last_agent = conversation_ctx.get("last_agent")
    awaiting_followup = conversation_ctx.get("awaiting_followup", False)
    last_ts = conversation_ctx.get("last_agent_ts")

    # Fallback to cache if context not present (e.g., new worker process)
    if not last_agent or last_ts is None:
        thread_id = state.get("thread_id")
        if thread_id:
            cached = cache.get(f"followup:{thread_id}") or {}
            if isinstance(cached, dict):
                last_agent = last_agent or cached.get("last_agent")
                if not awaiting_followup:
                    awaiting_followup = bool(cached.get("awaiting_followup", False))
                last_ts = last_ts or cached.get("last_agent_ts")
                # Merge into conversation_ctx so downstream sees it
                if last_agent:
                    conversation_ctx["last_agent"] = last_agent
                if last_ts is not None:
                    conversation_ctx["last_agent_ts"] = last_ts
                conversation_ctx["awaiting_followup"] = bool(awaiting_followup)

    if not (last_agent and awaiting_followup and last_ts):
        return None, None

    if time.time() - float(last_ts) > STICKY_TTL_SECONDS:
        return None, None

    if not _is_followup_utterance(state.get("user_input", "")):
        return None, None

    # Mark follow-up as handled; agent will re-arm if more follow-ups expected.
    conversation_ctx["awaiting_followup"] = False
    conversation_ctx["last_agent_ts"] = time.time()
    # Persist sticky resolution in cache
    try:
        thread_id = state.get("thread_id")
        if thread_id:
            cache.set(
                f"followup:{thread_id}",
                {
                    "last_agent": last_agent,
                    "last_agent_ts": conversation_ctx["last_agent_ts"],
                    "awaiting_followup": False,
                },
                timeout=STICKY_TTL_SECONDS,
            )
    except Exception:
        pass
    return last_agent, conversation_ctx


def _apply_memory_context(state: SupervisorState) -> SupervisorState:
    """
    Fetch conversational memory from Zep and attach to supervisor state.
    """
    if not read_enabled():
        # Even if read path is disabled, hydrate lightweight convctx from cache if present
        thread_id = state.get("thread_id")
        if thread_id:
            try:
                cached_ctx = cache.get(f"convctx:{thread_id}")
                if isinstance(cached_ctx, dict) and cached_ctx:
                    merged = {**(state.get("conversation_ctx") or {}), **cached_ctx}
                    state = {**state, "conversation_ctx": merged}
            except Exception:
                pass
        return state

    thread_id = state.get("thread_id")
    if not thread_id:
        return state

    context, meta = fetch_thread_context(thread_id, mode="summary")
    conversation_ctx: Dict[str, Any] = dict(state.get("conversation_ctx") or {})
    # Hydrate previously persisted convctx snapshot from cache (fast path)
    try:
        cached_ctx = cache.get(f"convctx:{thread_id}")
        if isinstance(cached_ctx, dict) and cached_ctx:
            conversation_ctx.update(cached_ctx)
    except Exception:
        pass

    if context:
        summary = context.get("context") or ""
        facts = context.get("facts") or []
        recent = context.get("recent") or []
        memory_block = {
            "summary": summary,
            "facts": facts,
            "recent": recent,
        }
        conversation_ctx.setdefault("memory", {})
        conversation_ctx["memory"] = memory_block
        state = {
            **state,
            "memory_context_summary": summary,
            "memory_context_facts": facts,
            "memory_context_recent": recent,
        }
        if isinstance(meta, dict):
            meta["context_chars"] = len(summary)
    else:
        meta.setdefault("used", False)

    state = {
        **state,
        "memory_trace": meta,
        "conversation_ctx": conversation_ctx,
    }

    # Inject user preferences when enabled and not paused for this thread
    if PREFS_APPLY_ENABLED:
        try:
            # Resolve user_id via conversation thread if available
            from assistant.models import Conversation
            from django.core.cache import cache
            conv = Conversation.objects.filter(id=thread_id).first()
            if conv and conv.user_id:
                ctx_pause = (state.get("conversation_ctx") or {}).get("personalization_paused")
                paused_by_cache = cache.get(f"thread:{thread_id}:personalization_paused", False)
                if not bool(ctx_pause) and not bool(paused_by_cache):
                    prefs = PreferenceService.get_active_preferences(conv.user_id, min_confidence=0.5)
                    if prefs:
                        ctx = dict(state.get("conversation_ctx") or {})
                        ctx["preferences"] = prefs
                        state = {**state, "conversation_ctx": ctx}
                        # Mark in trace for ops visibility
                        memt = dict(state.get("memory_trace") or {})
                        memt["preferences_used"] = True
                        state["memory_trace"] = memt
        except Exception:
            pass
    return state


# ============================================================================
# STEP 5: Token Budget & Context Window Management
# ============================================================================

def estimate_tokens(text: str, model: str = "gpt-4-turbo") -> int:
    """
    Estimate token count for given text using tiktoken.

    Args:
        text: Text to estimate tokens for
        model: Model name for tokenizer (default: gpt-4-turbo)

    Returns:
        Estimated token count
    """
    try:
        enc = tiktoken.encoding_for_model(model)
        return len(enc.encode(text))
    except Exception as e:
        logger.warning(f"[TOKEN_BUDGET] tiktoken encoding failed: {e}, using fallback")
        # Fallback: rough estimate (1 token ≈ 4 characters)
        return len(text) // 4


def summarize_text(text: str, max_sentences: int = 3) -> str:
    """
    Lightweight text summarizer using sentence truncation.

    For production: Consider using a small summarization model (e.g., BART, T5)
    or LLM-based summarization.

    Args:
        text: Text to summarize
        max_sentences: Maximum sentences to keep

    Returns:
        Summarized text
    """
    if not text or not text.strip():
        return ""

    # Split by sentence boundaries
    sentences = [s.strip() for s in text.split(".") if s.strip()]

    if len(sentences) <= max_sentences:
        return text

    # Keep first max_sentences and add ellipsis
    summary = ". ".join(sentences[:max_sentences])
    if not summary.endswith("."):
        summary += "."
    summary += ".."

    return summary


def _enforce_token_budget(state: SupervisorState, max_tokens: int = 6000) -> SupervisorState:
    """
    STEP 5: Enforce token budget by progressively trimming context layers.

    Trimming strategy (in order):
    1. Halve long-term memory (Zep recall) - oldest semantic context
    2. Summarize old conversation history (keep last 6 turns)
    3. Trim agent-specific context if still over budget
    4. Rebuild fused context and re-check

    Args:
        state: Current supervisor state
        max_tokens: Maximum allowed tokens (default: 6000)

    Returns:
        State with trimmed context and updated token estimates
    """
    thread_id = state.get("thread_id", "unknown")
    fused = state.get("fused_context", "")

    # Estimate current token count
    token_count = estimate_tokens(fused)

    # Update state with budget tracking
    state["current_token_estimate"] = token_count
    state["token_budget"] = max_tokens

    if token_count <= max_tokens:
        # Within budget, no trimming needed
        logger.debug(
            "[%s] Token budget OK: %d/%d tokens",
            thread_id,
            token_count,
            max_tokens
        )
        return state

    # --- Exceeded budget: progressively trim ---
    logger.warning(
        "[%s] Token budget exceeded: %d > %d tokens, trimming...",
        thread_id,
        token_count,
        max_tokens
    )

    # Strategy 1: Halve long-term memory (Zep recall)
    retrieved = state.get("retrieved_context", "")
    if retrieved and len(retrieved) > 100:
        lines = retrieved.split("\n")
        half_point = len(lines) // 2
        state["retrieved_context"] = "\n".join(lines[:half_point])
        logger.info(
            "[%s] Trimmed retrieved_context: %d -> %d lines",
            thread_id,
            len(lines),
            half_point
        )

    # Strategy 2: Summarize old history (keep last 6 turns + summary)
    history = state.get("history") or []
    if len(history) > 6:
        # Summarize older turns (everything except last 6)
        old_turns = history[:-6]
        recent_turns = history[-6:]

        # Combine old turns into text for summarization
        old_text = " ".join([
            f"{turn.get('role', 'user')}: {turn.get('content', '')}"
            for turn in old_turns
        ])

        summary = summarize_text(old_text, max_sentences=2)

        # Create summary turn
        summary_turn = {
            "role": "system",
            "content": f"[Earlier conversation summary]: {summary}"
        }

        # Update history: summary + recent 6 turns
        state["history"] = [summary_turn] + recent_turns

        logger.info(
            "[%s] Summarized history: %d turns -> summary + %d recent",
            thread_id,
            len(history),
            len(recent_turns)
        )

    # Strategy 3: Trim agent-specific context if still too large
    agent_context_str = state.get("agent_specific_context", "")
    if agent_context_str and len(agent_context_str) > 500:
        # Keep first 500 chars + ellipsis
        state["agent_specific_context"] = agent_context_str[:500] + "..."
        logger.info(
            "[%s] Trimmed agent_specific_context: %d -> 500 chars",
            thread_id,
            len(agent_context_str)
        )

    # Rebuild fused context with trimmed inputs
    # Note: We don't call _fuse_context here to avoid circular dependency
    # Instead, we'll rebuild a simplified version
    context_parts = []

    if state.get("active_domain"):
        context_parts.append(f"[Active Domain: {state['active_domain']}]")

    if state.get("retrieved_context"):
        context_parts.append(f"[Relevant Past Context]:\n{state['retrieved_context'].strip()}")

    history = state.get("history") or []
    if history:
        history_lines = [
            f"{turn.get('role', 'unknown').capitalize()}: {turn.get('content', '')}"
            for turn in history[-5:]  # Last 5 turns
        ]
        context_parts.append(f"[Recent Conversation]:\n" + "\n".join(history_lines))

    if state.get("memory_context_summary"):
        context_parts.append(f"[Summary]: {state['memory_context_summary']}")

    # Rebuild fused context
    new_fused = "\n\n".join(context_parts)
    new_token_count = estimate_tokens(new_fused)

    state["fused_context"] = new_fused
    state["current_token_estimate"] = new_token_count

    logger.info(
        "[%s] Token budget enforced: %d -> %d tokens (target: %d)",
        thread_id,
        token_count,
        new_token_count,
        max_tokens
    )

    # If still over budget after all trimming, log warning but proceed
    if new_token_count > max_tokens:
        logger.warning(
            "[%s] Still over budget after trimming: %d > %d tokens",
            thread_id,
            new_token_count,
            max_tokens
        )

    return state


# ============================================================================
# STEP 6: Context Lifecycle & Summarization Layer
# ============================================================================

def summarize_agent_context(agent_ctx: Dict[str, Any], agent_name: str, max_sentences: int = 4) -> str:
    """
    STEP 6: Condense an agent context into a short natural-language summary.

    Creates a human-readable summary of what happened during the agent's interaction,
    including collected entities, conversation stage, and recent turns.

    Args:
        agent_ctx: Agent context dictionary from state.agent_contexts
        agent_name: Name of the agent (for logging)
        max_sentences: Maximum sentences in summary (default: 4)

    Returns:
        Natural language summary string
    """
    collected_info = agent_ctx.get("collected_info", {})
    stage = agent_ctx.get("conversation_stage", "unknown")
    result_count = agent_ctx.get("result_count", 0)

    # Build entity summary
    if collected_info:
        entities_str = ", ".join([f"{k}={v}" for k, v in collected_info.items()])
        summary = f"During {stage} stage, user discussed {entities_str}."
    else:
        summary = f"During {stage} stage, user had general conversation."

    # Add result information if available
    if result_count > 0:
        summary += f" Agent showed {result_count} results."

    # Add recent conversation snippets
    agent_history = agent_ctx.get("agent_history", [])
    if agent_history and len(agent_history) > 0:
        # Get last 2 turns
        recent_turns = agent_history[-2:]
        recent_text = " ".join([
            f"{turn.get('role', 'user')}: {turn.get('content', '')[:100]}"
            for turn in recent_turns
        ])

        # Truncate to reasonable length
        if len(recent_text) > 200:
            recent_text = recent_text[:200] + "..."

        summary += f" Recent: {recent_text}"

    return summary


def archive_to_zep(
    thread_id: str,
    agent_name: str,
    summary: str,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    STEP 6: Archive agent context summary to Zep for long-term storage.

    Stores summarized context in Zep as a system message with metadata,
    making it retrievable for future conversations.

    Args:
        thread_id: Conversation thread ID
        agent_name: Agent that generated this context
        summary: Summary text to archive
        metadata: Additional metadata (optional)

    Returns:
        True if successful, False otherwise
    """
    try:
        from datetime import datetime

        # Get Zep client (global instance from module)
        if not _ZEP_CLIENT:
            logger.warning("[LIFECYCLE] Zep client not available, skipping archive")
            return False

        # Prepare metadata
        archive_metadata = {
            "type": "context_summary",
            "agent": agent_name,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "lifecycle_manager",
        }

        if metadata:
            archive_metadata.update(metadata)

        # Add memory to Zep
        _ZEP_CLIENT.add_memory(
            session_id=thread_id,
            messages=[{
                "role": "system",
                "content": f"[ARCHIVED SUMMARY {agent_name}] {summary}",
                "metadata": archive_metadata,
            }]
        )

        logger.info(
            "[LIFECYCLE] Archived context for %s to Zep (%d chars)",
            agent_name,
            len(summary)
        )
        return True

    except Exception as e:
        logger.error(f"[LIFECYCLE] Failed to archive to Zep: {e}", exc_info=True)
        return False


def rotate_inactive_contexts(state: SupervisorState, ttl: int = 1800) -> SupervisorState:
    """
    STEP 6: Summarize and archive inactive agent contexts.

    This is the core lifecycle manager that:
    1. Identifies inactive agent contexts (not used for > TTL seconds)
    2. Summarizes them into human-readable text
    3. Archives summaries to Zep for long-term storage
    4. Removes inactive contexts from active state
    5. Preserves summaries in state for quick access

    Prevents unbounded state growth while maintaining historical continuity.

    Args:
        state: Current supervisor state
        ttl: Time-to-live in seconds (default: 1800 = 30 minutes)

    Returns:
        Updated state with rotated contexts
    """
    thread_id = state.get("thread_id", "unknown")
    now = time.time()

    # Get current contexts and summaries
    agent_contexts = state.get("agent_contexts") or {}
    summaries = state.get("agent_context_summaries") or {}

    # Track what we rotate
    rotated_count = 0

    for agent_name, agent_ctx in list(agent_contexts.items()):
        last_active = agent_ctx.get("last_active", now)
        inactive_duration = now - last_active

        # Check if context is inactive (past TTL)
        if inactive_duration > ttl:
            # Summarize the context
            summary = summarize_agent_context(agent_ctx, agent_name)
            summaries[agent_name] = summary

            # Archive to Zep for long-term storage
            archive_to_zep(
                thread_id=thread_id,
                agent_name=agent_name,
                summary=summary,
                metadata={
                    "inactive_duration_seconds": int(inactive_duration),
                    "conversation_stage": agent_ctx.get("conversation_stage"),
                    "result_count": agent_ctx.get("result_count", 0),
                }
            )

            logger.info(
                "[LIFECYCLE] Rotated inactive context: %s (inactive for %d seconds)",
                agent_name,
                int(inactive_duration)
            )

            # Remove from active contexts
            del agent_contexts[agent_name]
            rotated_count += 1

    if rotated_count > 0:
        logger.info(
            "[%s] Lifecycle rotation: %d contexts archived, %d still active",
            thread_id,
            rotated_count,
            len(agent_contexts)
        )

    # Update state with rotated contexts
    state["agent_contexts"] = agent_contexts
    state["agent_context_summaries"] = summaries
    state["last_summary_timestamp"] = now
    state["summary_version"] = (state.get("summary_version") or 0) + 1

    return state


def _fuse_context(state: SupervisorState) -> SupervisorState:
    """
    STEP 3: Context Fusion

    Merge multiple context sources into a unified reasoning context:
    1. Short-term history (last N turns)
    2. Long-term semantic recall (Zep retrieved_context)
    3. Active domain state (for continuity tracking)
    4. Current user input

    Returns state with populated fused_context field.
    """
    context_parts = []

    # 1. Active domain context (for continuity)
    active_domain = state.get("active_domain")
    if active_domain:
        context_parts.append(f"[Active Domain: {active_domain}]")

    # 2. Long-term memory (Zep semantic recall)
    retrieved_context = state.get("retrieved_context")
    if retrieved_context and retrieved_context.strip():
        context_parts.append(f"[Relevant Past Context from Memory]:\n{retrieved_context.strip()}")

    # 3. Short-term history (last N turns, default: 5)
    history = state.get("history") or []
    recent_limit = 5
    if len(history) > 0:
        recent_history = history[-recent_limit:] if len(history) > recent_limit else history
        history_lines = []
        for turn in recent_history:
            role = turn.get("role", "unknown")
            content = turn.get("content", "")
            if content:
                history_lines.append(f"{role.capitalize()}: {content}")

        if history_lines:
            context_parts.append(f"[Recent Conversation]:\n" + "\n".join(history_lines))

    # 4. Memory context summary (if available from Zep service)
    memory_summary = state.get("memory_context_summary")
    if memory_summary and memory_summary.strip():
        context_parts.append(f"[Conversation Summary]:\n{memory_summary.strip()}")

    # 5. Memory facts (structured knowledge)
    memory_facts = state.get("memory_context_facts") or []
    if memory_facts:
        facts_lines = []
        for fact in memory_facts[:3]:  # Limit to top 3 facts
            if isinstance(fact, dict):
                fact_text = fact.get("fact") or fact.get("content") or str(fact)
                facts_lines.append(f"- {fact_text}")

        if facts_lines:
            context_parts.append(f"[Known Facts]:\n" + "\n".join(facts_lines))

    # Build fused context
    if context_parts:
        fused = "\n\n".join(context_parts)
        logger.info(
            "[%s] Context fusion: %d parts, %d chars",
            state.get("thread_id"),
            len(context_parts),
            len(fused)
        )
    else:
        fused = ""
        logger.debug("[%s] Context fusion: no context parts available", state.get("thread_id"))

    return {**state, "fused_context": fused}


def _check_continuity_guard(
    state: SupervisorState,
    new_domain: str,
    intent_confidence: float = 0.0
) -> tuple[bool, Optional[str]]:
    """
    STEP 3: Continuity Guard

    Prevent unintentional domain drift on ambiguous follow-ups.

    CRITICAL FIX: Check intent confidence BEFORE pattern matching.
    High-confidence intent switches should be allowed even if they contain
    patterns like "in " (e.g., "i want an apartment in girne").

    Returns (should_maintain_continuity, reason)
    - True: Keep active_domain, don't switch
    - False: Allow domain switch
    """
    active_domain = state.get("active_domain")
    if not active_domain:
        return False, None  # No active domain, allow any routing

    if active_domain == new_domain:
        return False, None  # Same domain, no drift

    user_input = state.get("user_input", "").lower().strip()
    word_count = len(user_input.split())

    # ROBUST FIX: For very short inputs (1-2 words), ALWAYS maintain active_domain
    # unless there's an explicit switch signal. This is more robust than checking
    # agent_contexts which may not persist across turns.
    if word_count <= 2:
        # Check for explicit switch signals first
        explicit_switch_patterns = [
            "actually", "instead", "now show", "now let's", "change to",
            "switch to", "i want to see", "show me", "let's talk about",
            "tell me about", "what about", "how about"
        ]

        has_explicit_switch = any(pattern in user_input for pattern in explicit_switch_patterns)

        if not has_explicit_switch:
            # Short input without explicit switch = maintain continuity
            logger.info(
                "[%s] Continuity guard: short input (%d words) without explicit switch - maintaining domain %s",
                state.get("thread_id"),
                word_count,
                active_domain
            )
            return True, f"short_input_no_switch:{word_count}_words"

    # For longer inputs (3+ words), check confidence for complete requests
    if intent_confidence >= 0.65 and word_count >= 3:
        logger.info(
            "[%s] Continuity guard: high confidence intent (%0.2f, %d words) - allowing domain change %s → %s",
            state.get("thread_id"),
            intent_confidence,
            word_count,
            active_domain,
            new_domain
        )
        return False, f"high_confidence:{intent_confidence:.2f}"

    # Ambiguous follow-ups (should maintain continuity)
    # Only apply this logic for LOW confidence intents
    ambiguous_patterns = [
        "in ", "near ", "around ", "at ",  # Location refinements
        "cheaper", "bigger", "smaller", "better",  # Comparatives
        "more", "another", "different", "similar",  # Alternatives
        "what else", "any other", "show more",  # Exploration
    ]

    for pattern in ambiguous_patterns:
        if user_input.startswith(pattern) or f" {pattern}" in user_input:
            logger.info(
                "[%s] Continuity guard: ambiguous follow-up detected ('%s', low conf=%0.2f) - maintaining domain %s",
                state.get("thread_id"),
                pattern,
                intent_confidence,
                active_domain
            )
            return True, f"ambiguous_followup:{pattern}"

    # STEP 4: Context-aware guard - check if current agent has significant context
    # (Note: Short input check moved to top of function for priority)
    agent_contexts = state.get("agent_contexts") or {}
    agent_name_map = {
        "REAL_ESTATE": "real_estate_agent",
        "NON_RE_MARKETPLACE": "marketplace_agent",
        "LOCAL_INFO": "local_info_agent",
        "GENERAL_CONVERSATION": "general_conversation_agent",
    }
    active_agent_name = agent_name_map.get(active_domain)

    if active_agent_name and active_agent_name in agent_contexts:
        agent_ctx = agent_contexts[active_agent_name]
        collected_info = agent_ctx.get("collected_info", {})
        conversation_stage = agent_ctx.get("conversation_stage", "discovery")

        # Critical conversation stages should be very sticky
        critical_stages = ["transaction", "presenting", "refinement"]
        if conversation_stage in critical_stages:
            logger.info(
                "[%s] Continuity guard: agent in critical stage '%s' with %d entities - maintaining domain %s",
                state.get("thread_id"),
                conversation_stage,
                len(collected_info),
                active_domain
            )
            return True, f"critical_stage:{conversation_stage}"

        # If agent has collected significant entities (3+), be conservative
        if len(collected_info) >= 3:
            logger.info(
                "[%s] Continuity guard: agent has %d collected entities - maintaining domain %s",
                state.get("thread_id"),
                len(collected_info),
                active_domain
            )
            return True, f"significant_context:{len(collected_info)}_entities"

    # Otherwise, allow domain switch
    logger.info(
        "[%s] Continuity guard: allowing domain change %s → %s",
        state.get("thread_id"),
        active_domain,
        new_domain
    )
    return False, None


def _extract_entities(user_input: str, existing_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    STEP 4: Extract entities from user input.

    Extracts location, budget, bedrooms, and other common requirements.
    Merges with existing collected information.

    Returns:
        Updated dictionary with extracted entities
    """
    import re

    updated = dict(existing_info)
    user_lower = user_input.lower()

    # Extract location (cities/regions)
    location_patterns = [
        r'in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'near\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'around\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
    ]
    for pattern in location_patterns:
        match = re.search(pattern, user_input)
        if match:
            updated["location"] = match.group(1)
            break

    # Extract budget/price
    budget_patterns = [
        (r'(\d+(?:,\d{3})*)\s*(?:EUR|euro|€)', 1),
        (r'under\s+(\d+(?:,\d{3})*)', 1),
        (r'less\s+than\s+(\d+(?:,\d{3})*)', 1),
        (r'budget\s+(?:of\s+)?(\d+(?:,\d{3})*)', 1),
        (r'max(?:imum)?\s+(\d+(?:,\d{3})*)', 1),
    ]
    for pattern, group in budget_patterns:
        match = re.search(pattern, user_lower)
        if match:
            budget_str = match.group(group).replace(',', '')
            updated["budget"] = int(budget_str)
            break

    # Extract bedrooms
    bedroom_patterns = [
        r'(\d+)[-\s]*(?:bed|bedroom|BR)',
        r'(\d+)[-\s]*(?:room|rooms)',
    ]
    for pattern in bedroom_patterns:
        match = re.search(pattern, user_lower)
        if match:
            updated["bedrooms"] = int(match.group(1))
            break

    # Extract property type
    property_types = {
        "apartment": "apartment",
        "flat": "apartment",
        "house": "house",
        "villa": "villa",
        "studio": "studio",
    }
    for key, value in property_types.items():
        if key in user_lower:
            updated["property_type"] = value
            break

    # Extract vehicle type
    vehicle_types = {
        "car": "car",
        "vehicle": "vehicle",
        "suv": "suv",
        "sedan": "sedan",
        "truck": "truck",
    }
    for key, value in vehicle_types.items():
        if key in user_lower:
            updated["vehicle_type"] = value
            break

    return updated


def _build_agent_context(
    state: SupervisorState,
    target_agent: str
) -> Dict[str, Any]:
    """
    STEP 4: Build context tailored for specific agent.

    Creates agent-specific context by:
    1. Filtering history to this agent's turns only
    2. Including agent's collected information
    3. Adding handoff summary from previous agent
    4. Including shared cross-agent context

    Returns:
        Dictionary with:
        - agent_specific_context: formatted context string
        - collected_info: entities collected by this agent
        - conversation_stage: agent's current stage
        - agent_history: this agent's conversation turns
    """
    agent_contexts = state.get("agent_contexts") or {}
    agent_ctx = agent_contexts.get(target_agent, {})

    # 1. Agent-specific history (filter global history)
    full_history = state.get("history") or []
    agent_history = [
        turn for turn in full_history
        if turn.get("agent") == target_agent
    ]

    # 2. Agent's collected information
    collected_info = agent_ctx.get("collected_info", {})

    # 3. Handoff summary (if switched from another agent)
    handoff_summary = agent_ctx.get("handoff_summary")
    handoff_from = agent_ctx.get("handoff_from")

    # 4. Shared context (available to all agents)
    shared_context = state.get("shared_context") or {}

    # 5. Build context string
    context_parts = []

    # Add handoff if present
    if handoff_summary:
        context_parts.append(f"[Context Handoff from {handoff_from}]:\n{handoff_summary}")

    # Add shared user context
    if shared_context.get("user_location"):
        context_parts.append(f"User Location: {shared_context['user_location']}")

    if shared_context.get("user_budget"):
        context_parts.append(f"User Budget: {shared_context['user_budget']} EUR")

    # Add agent's collected info
    if collected_info:
        info_items = []
        for k, v in collected_info.items():
            info_items.append(f"{k}: {v}")
        if info_items:
            context_parts.append(f"[Known Requirements]:\n" + "\n".join(f"- {item}" for item in info_items))

    # Add agent's recent history (last 3 turns)
    if agent_history:
        recent = agent_history[-3:]
        history_lines = []
        for turn in recent:
            role = turn.get("role", "unknown")
            content = turn.get("content", "")
            if content:
                # Truncate long content
                display_content = content[:150] + "..." if len(content) > 150 else content
                history_lines.append(f"{role.capitalize()}: {display_content}")

        if history_lines:
            context_parts.append(f"[Agent's Recent Conversation]:\n" + "\n".join(history_lines))

    agent_specific_context = "\n\n".join(context_parts) if context_parts else ""

    logger.info(
        "[%s] Built agent context for %s: %d chars, %d collected items, handoff=%s",
        state.get("thread_id"),
        target_agent,
        len(agent_specific_context),
        len(collected_info),
        "yes" if handoff_summary else "no"
    )

    return {
        "agent_specific_context": agent_specific_context,
        "collected_info": collected_info,
        "conversation_stage": agent_ctx.get("conversation_stage", "discovery"),
        "agent_history": agent_history[-5:],  # Last 5 turns
    }


def _create_handoff_summary(
    state: SupervisorState,
    from_agent: str,
    to_agent: str
) -> str:
    """
    STEP 4: Create structured handoff when switching agents.

    Extracts key information from previous agent to pass to next agent.
    This ensures continuity and prevents user from having to repeat context.

    Returns:
        Human-readable summary of previous agent's context
    """
    agent_contexts = state.get("agent_contexts") or {}
    from_context = agent_contexts.get(from_agent, {})

    # Extract collected information
    collected_info = from_context.get("collected_info", {})
    conversation_stage = from_context.get("conversation_stage", "discovery")

    # Build handoff summary
    summary_parts = []

    # Add context about what user was doing
    agent_display_name = from_agent.replace("_agent", "").replace("_", " ").title()
    summary_parts.append(f"User was previously working with {agent_display_name}.")

    # Add collected entities
    if collected_info:
        # Extract location if present (most important for handoff)
        location = collected_info.get("location") or collected_info.get("city")
        if location:
            summary_parts.append(f"Location of interest: {location}.")

        # Extract budget if present
        budget = collected_info.get("budget") or collected_info.get("price_max")
        if budget:
            summary_parts.append(f"Budget mentioned: {budget} EUR.")

        # Extract property/vehicle details
        if "bedrooms" in collected_info:
            summary_parts.append(f"Looking for {collected_info['bedrooms']}-bedroom property.")

        if "property_type" in collected_info:
            summary_parts.append(f"Property type: {collected_info['property_type']}.")

        if "vehicle_type" in collected_info:
            summary_parts.append(f"Vehicle type: {collected_info['vehicle_type']}.")

        # Add other requirements (limit to 3)
        other_reqs = {
            k: v for k, v in collected_info.items()
            if k not in ["location", "city", "budget", "price_max", "bedrooms", "property_type", "vehicle_type"]
        }
        if other_reqs:
            req_items = [f"{k}: {v}" for k, v in list(other_reqs.items())[:3]]
            summary_parts.append(f"Additional requirements: {', '.join(req_items)}.")

    # Add stage information
    if conversation_stage == "presenting":
        summary_parts.append("User was reviewing options.")
    elif conversation_stage == "refinement":
        summary_parts.append("User was refining their search criteria.")
    elif conversation_stage == "transaction":
        summary_parts.append("User was ready to proceed with a transaction.")

    # Domain-specific handoff notes
    if from_agent == "real_estate_agent" and to_agent == "marketplace_agent":
        summary_parts.append("User may be looking for related services or products in the same area.")
    elif from_agent == "marketplace_agent" and to_agent == "real_estate_agent":
        summary_parts.append("User may need housing in the area they were searching for products/services.")
    elif from_agent == "local_info_agent":
        summary_parts.append("User was exploring local information and may now need related services.")

    handoff = " ".join(summary_parts)

    logger.info(
        "[HANDOFF] %s → %s: %s",
        from_agent,
        to_agent,
        handoff[:200] + "..." if len(handoff) > 200 else handoff
    )

    return handoff


def _preserve_cross_agent_context(
    state: SupervisorState,
    target_agent: str
) -> SupervisorState:
    """
    STEP 4: Preserve context when switching between agents.

    Creates handoff summary and updates target agent's context.
    Ensures critical information (location, budget) carries over.

    Returns:
        Updated state with handoff information
    """
    previous_agent = state.get("active_domain")

    # Check if we're switching agents
    if not previous_agent or previous_agent == target_agent:
        return state

    logger.info(
        "[%s] Agent switch detected: %s → %s",
        state.get("thread_id"),
        previous_agent,
        target_agent
    )

    # Create handoff summary
    handoff_summary = _create_handoff_summary(state, previous_agent, target_agent)

    # Extract shared context from previous agent
    agent_contexts = state.get("agent_contexts") or {}
    prev_context = agent_contexts.get(previous_agent, {})
    prev_info = prev_context.get("collected_info", {})

    # Update shared context with important cross-agent info
    shared_context = state.get("shared_context") or {}

    # Carry over location (most important for continuity)
    if "location" in prev_info or "city" in prev_info:
        shared_context["user_location"] = prev_info.get("location") or prev_info.get("city")

    # Carry over budget if present
    if "budget" in prev_info or "price_max" in prev_info:
        shared_context["user_budget"] = prev_info.get("budget") or prev_info.get("price_max")

    # Update target agent's context with handoff
    target_ctx = agent_contexts.get(target_agent, {})
    target_ctx["handoff_from"] = previous_agent
    target_ctx["handoff_summary"] = handoff_summary
    target_ctx["handoff_timestamp"] = time.time()

    # Merge any relevant info into target agent's collected_info
    target_collected = target_ctx.get("collected_info", {})
    if shared_context.get("user_location") and "location" not in target_collected:
        target_collected["location"] = shared_context["user_location"]
    if shared_context.get("user_budget") and "budget" not in target_collected:
        target_collected["budget"] = shared_context["user_budget"]

    target_ctx["collected_info"] = target_collected
    agent_contexts[target_agent] = target_ctx

    return {
        **state,
        "agent_contexts": agent_contexts,
        "shared_context": shared_context,
        "previous_agent": previous_agent,
    }


def build_supervisor_graph():
    """
    Build and compile the hierarchical LangGraph with CentralSupervisor routing.

    The graph entry node is the supervisor router; conditional edges forward
    requests to domain-specific worker nodes.  Each worker is wrapped with
    LangSmith tracing decorators for observability.
    """
    global _COMPILED_SUPERVISOR_GRAPH
    if _COMPILED_SUPERVISOR_GRAPH is not None and hasattr(_COMPILED_SUPERVISOR_GRAPH, "invoke"):
        return _COMPILED_SUPERVISOR_GRAPH
    try:
        supervisor = CentralSupervisor()
        graph = StateGraph(SupervisorState)

        @traced_supervisor_node
        def supervisor_node(state: SupervisorState) -> SupervisorState:
            state = _apply_memory_context(state)
            state = _inject_zep_context(state)
            state = _fuse_context(state)  # STEP 3: Merge all context sources
            state = _enforce_token_budget(state, max_tokens=6000)  # STEP 5: Enforce token budget
            state = rotate_inactive_contexts(state, ttl=1800)  # STEP 6: Lifecycle management
            sticky_agent, updated_ctx = _maybe_route_sticky(state)
            if sticky_agent:
                logger.info(
                    "[%s] Sticky follow-up → %s",
                    state.get("thread_id"),
                    sticky_agent,
                )
                followup_decision = {
                    "intent_type": "followup",
                    "category": "followup",
                    "confidence": 1.0,
                    "triggered_flow": "sticky_followup",
                    "primary_node": sticky_agent,
                    "attributes": {"reason": "sticky_followup"},
                    "requires_hitl": False,
                }
                next_state = {
                    **state,
                    "target_agent": sticky_agent,
                    "routing_decision": followup_decision,
                    "routing_decision_normalized": followup_decision,
                    "routing_decision_raw": None,
                    "current_node": "supervisor",
                    "intent_confidence": 1.0,
                    "intent_reasoning": "sticky_followup",
                    "triggered_flow": "sticky_followup",
                    "primary_node": sticky_agent,
                    "conversation_ctx": updated_ctx,
                    "memory_trace": state.get("memory_trace"),
                }
                return next_state

            if updated_ctx is not None:
                # Updated context (e.g., TTL refresh) even when not sticky
                state = {**state, "conversation_ctx": updated_ctx}

            # Route to get target agent
            routed_state = supervisor.route_request(state)
            target_agent = routed_state.get("target_agent")

            # STEP 4: Preserve context during agent switch + build agent-specific context
            routed_state = _preserve_cross_agent_context(routed_state, target_agent)
            agent_context = _build_agent_context(routed_state, target_agent)

            # Add agent-specific context to state for agent handler
            return {
                **routed_state,
                "agent_specific_context": agent_context["agent_specific_context"],
                "agent_collected_info": agent_context["collected_info"],
                "agent_conversation_stage": agent_context["conversation_stage"],
            }

        def route_to_agent(state: SupervisorState) -> str:
            target = state.get("target_agent", "general_conversation_agent")
            valid_targets = {
                "real_estate_agent",
                "marketplace_agent",
                "general_conversation_agent",
                "local_info_agent",
            }
            # Normalize unexpected targets (e.g., 'safety_agent') to a safe default
            return target if target in valid_targets else "general_conversation_agent"

        @traced_worker_agent("general_conversation")
        def general_conversation_handler(state: SupervisorState) -> SupervisorState:
            """
            General Conversation Agent: Handle greetings, general info, platform questions.
            Leverages contextually appropriate responses.
            """
            try:
                thread_id = state.get('thread_id', 'unknown')
                logger.info(f"[{thread_id}] General Conversation Agent: processing '{state['user_input'][:50]}'...")

                # STEP 4: Get agent-specific context
                agent_context_str = state.get("agent_specific_context", "")
                collected_info = state.get("agent_collected_info", {})

                if agent_context_str:
                    logger.info(
                        "[%s] General Conversation Agent: using agent-specific context (%d chars, %d collected items)",
                        thread_id,
                        len(agent_context_str),
                        len(collected_info)
                    )

                # For general conversation, provide contextually appropriate response
                user_input = state['user_input'].lower().strip()

                # Detect greeting patterns
                greeting_keywords = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
                is_greeting = any(keyword in user_input for keyword in greeting_keywords)

                if is_greeting:
                    response = "Welcome to Easy Islanders! I am your personal assistant for anything you need in North Cyprus. How can I help you today?"
                else:
                    # For other general questions, use a default helpful response
                    response = "I'm here to help! You can ask me about properties to rent or buy, search for vehicles, find services, or any general questions about North Cyprus."

                # STEP 4: Extract entities and update agent context
                updated_info = _extract_entities(state['user_input'], collected_info)
                stage = "greeting" if is_greeting else "discovery"

                # Update agent contexts
                agent_contexts = state.get("agent_contexts") or {}
                agent_contexts["general_conversation_agent"] = {
                    "collected_info": updated_info,
                    "conversation_stage": stage,
                    "last_active": time.time(),
                    "is_greeting": is_greeting,
                }

                logger.info(
                    "[%s] General Conversation Agent: context preserved (stage=%s)",
                    thread_id,
                    stage
                )
                logger.info(f"[{thread_id}] General Conversation Agent: returning response")
                return _with_history(
                    state,
                    {
                        'final_response': response,
                        'current_node': 'general_conversation_agent',
                        'is_complete': True,
                        'agent_contexts': agent_contexts,  # STEP 4
                        'agent_collected_info': updated_info,  # STEP 4
                        'agent_conversation_stage': stage,  # STEP 4
                    },
                    response,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] General Conversation Agent failed: {e}")
                fallback = 'I encountered an issue processing your request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'general_conversation_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    fallback,
                )

        @traced_worker_agent("real_estate")
        def real_estate_handler(state: SupervisorState) -> SupervisorState:
            """
            Real Estate Agent: Delegates to production RE agent with frozen contracts.

            Integration Pattern (Contract-First):
            1. Map SupervisorState → AgentRequest (frozen schema)
            2. Call handle_real_estate_request() from production agent
            3. Map AgentResponse → SupervisorState
            4. Extract show_listings actions → recommendations format

            Observability: Full trace data preserved in state.agent_traces
            """
            from assistant.agents.real_estate import handle_real_estate_request
            from assistant.agents.contracts import AgentRequest, AgentContext
            from datetime import datetime
            import uuid

            thread_id = state.get('thread_id', 'unknown')

            # STEP 4: Get agent-specific context
            agent_context_str = state.get("agent_specific_context", "")
            collected_info = state.get("agent_collected_info", {})

            if agent_context_str:
                logger.info(
                    "[%s] RE Agent: using agent-specific context (%d chars, %d collected items)",
                    thread_id,
                    len(agent_context_str),
                    len(collected_info)
                )

            # Base capsule for RE agent (persisted between turns)
            conversation_ctx = (state.get('conversation_ctx') or {})
            re_capsule = conversation_ctx.get('real_estate', {})
            # Pass through user preferences when available so the agent can pre-filter
            try:
                prefs = conversation_ctx.get('preferences')
                if isinstance(prefs, dict) and prefs:
                    # Attach under a dedicated key; agent will read from here
                    if isinstance(re_capsule, dict):
                        re_capsule = dict(re_capsule)
                        re_capsule['preferences'] = prefs
                    else:
                        re_capsule = {'preferences': prefs}
            except Exception:
                # Never break routing due to preferences capsule issues
                pass
            memory_capsule = {
                "summary": state.get("memory_context_summary"),
                "facts": state.get("memory_context_facts") or [],
                "recent": state.get("memory_context_recent") or [],
            }

            try:
                logger.info(f"[{thread_id}] RE Agent: delegating to production agent...")

                # Map SupervisorState → AgentRequest (frozen contract)
                routing = state.get('routing_decision') or {}
                intent_type = routing.get('intent_type', 'property_search')

                # Map supervisor intent → agent intent enum
                intent_map = {
                    'property_search': 'property_search',
                    'booking_request': 'property_search',  # S2: Treat as search
                    'lead_capture': 'property_search',
                }
                intent = intent_map.get(intent_type, 'property_search')

                # Build AgentRequest
                agent_request = AgentRequest(
                    thread_id=thread_id,
                    client_msg_id=state.get('client_msg_id') or f"sup-{uuid.uuid4()}",
                    intent=intent,
                    input=state['user_input'],
                    ctx=AgentContext(
                        user_id=state.get('user_id'),
                        locale=state.get('user_language', 'en'),
                        time=datetime.utcnow().isoformat() + 'Z',
                    ),
                )
                if re_capsule:
                    agent_request["ctx"]["conversation_capsule"] = re_capsule
                if any([
                    memory_capsule.get("summary"),
                    memory_capsule.get("facts"),
                    memory_capsule.get("recent"),
                ]):
                    agent_request["ctx"]["memory"] = memory_capsule

                # Call production agent
                agent_response = handle_real_estate_request(agent_request)

                # Extract data from AgentResponse
                reply = agent_response.get('reply', 'I found some properties for you.')
                actions = agent_response.get('actions', [])
                traces = agent_response.get('traces', {})

                # Map show_listings action → recommendations format
                recommendations = []
                page = 1
                page_size = len(agent_response.get('actions', [{}])[0].get('params', {}).get('listings', [])) or 0
                has_more = False
                total_available = None
                search_params_payload: Dict[str, Any] = dict(traces.get("extracted_params", {}) or {}) if isinstance(traces, dict) else {}
                for action in actions:
                    if action['type'] == 'show_listings':
                        action_params = action.get('params', {}) or {}
                        listings = action_params.get('listings', [])
                        page = action_params.get('page', page)
                        page_size = action_params.get('page_size', page_size or len(listings) or 10)
                        has_more = action_params.get('has_more', has_more)
                        total_available = action_params.get('total', total_available)
                        if action_params.get('search_params'):
                            search_params_payload = action_params['search_params']
                        # Convert PropertyCard → supervisor recommendation format
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
                                'agent': 'real_estate',  # Tag with agent name
                            }
                            for lst in listings
                        ]
                        break

                if total_available is not None and not has_more:
                    has_more = total_available > (page * (page_size or 1))

                conversation_ctx = dict(state.get('conversation_ctx') or {})
                has_any_results = bool(recommendations)
                if has_any_results:
                    conversation_ctx.update({
                        "last_agent": "real_estate_agent",
                        "last_agent_ts": time.time(),
                        "awaiting_followup": has_any_results and bool(has_more),
                        "real_estate": {
                            "search_params": search_params_payload,
                            "tenure": traces.get("tenure") if isinstance(traces, dict) else None,
                            "page": page,
                            "page_size": page_size or 10,
                            "total": total_available,
                            "last_results_ref": [rec['id'] for rec in recommendations if rec.get('id')],
                            "has_more": has_more,
                            "max_results": search_params_payload.get("max_results") or total_available,
                        },
                    })
                    # Persist sticky-followup hints in cache for process resilience
                    try:
                        cache.set(
                            f"followup:{thread_id}",
                            {
                                "last_agent": "real_estate_agent",
                                "last_agent_ts": conversation_ctx["last_agent_ts"],
                                "awaiting_followup": bool(has_more),
                            },
                            timeout=STICKY_TTL_SECONDS,
                        )
                        # Persist full conversation_ctx snapshot as well
                        cache.set(f"convctx:{thread_id}", dict(conversation_ctx), timeout=86400)
                    except Exception:
                        pass
                elif any(action.get("type") == "ask_clarification" for action in actions):
                    capsule_payload = dict(re_capsule) if isinstance(re_capsule, dict) else {}
                    capsule_payload.setdefault("search_params", capsule_payload.get("search_params", {}))
                    capsule_payload["has_more"] = False
                    capsule_payload["awaiting_clarification_reason"] = traces.get("clarify_reason") if isinstance(traces, dict) else None
                    conversation_ctx.update({
                        "last_agent": "real_estate_agent",
                        "last_agent_ts": time.time(),
                        "awaiting_followup": True,
                        "real_estate": capsule_payload,
                    })
                    try:
                        cache.set(f"followup:{thread_id}", {
                            "last_agent": "real_estate_agent",
                            "last_agent_ts": conversation_ctx["last_agent_ts"],
                            "awaiting_followup": True,
                        }, timeout=STICKY_TTL_SECONDS)
                        cache.set(f"convctx:{thread_id}", dict(conversation_ctx), timeout=86400)
                    except Exception:
                        pass

                logger.info(f"[{thread_id}] RE Agent: completed, {len(recommendations)} cards, reply_len={len(reply)}")

                # STEP 4: Extract entities and update agent context
                updated_info = _extract_entities(state['user_input'], collected_info)

                # Determine conversation stage based on response
                if recommendations:
                    stage = "presenting" if not has_more else "refinement"
                elif any(action.get("type") == "booking_request" for action in actions):
                    stage = "transaction"
                elif any(action.get("type") == "ask_clarification" for action in actions):
                    stage = "discovery"
                else:
                    stage = "refinement"

                # Update agent contexts with isolated context for this agent
                agent_contexts = state.get("agent_contexts") or {}
                agent_contexts["real_estate_agent"] = {
                    "collected_info": updated_info,
                    "conversation_stage": stage,
                    "last_active": time.time(),
                    "result_count": len(recommendations),
                    "has_more_results": has_more,
                }

                logger.info(
                    "[%s] RE Agent: context preserved (stage=%s, entities=%d)",
                    thread_id,
                    stage,
                    len(updated_info)
                )

                return _with_history(
                    state,
                    {
                        'final_response': reply,
                        'recommendations': recommendations,
                        'current_node': 'real_estate_agent',
                        'is_complete': True,
                        'agent_response': agent_response,  # Full response for debugging
                        'agent_traces': traces,  # Observability data
                        'agent_name': 'real_estate',  # For WS frame tagging
                        'conversation_ctx': conversation_ctx,
                        'memory_trace': state.get('memory_trace'),
                        'agent_contexts': agent_contexts,  # STEP 4: Persist agent contexts
                        'agent_collected_info': updated_info,  # STEP 4: Persist collected info
                        'agent_conversation_stage': stage,  # STEP 4: Persist conversation stage
                    },
                    reply,
                )

            except Exception as e:
                logger.error(f"[{thread_id}] RE Agent failed: {e}", exc_info=True)
                fallback = 'I had trouble processing your property request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'real_estate_agent',
                        'is_complete': True,
                        'error_message': str(e),
                        'agent_name': 'real_estate',
                    },
                    fallback,
                )

        @traced_worker_agent("marketplace")
        def marketplace_handler(state: SupervisorState) -> SupervisorState:
            """
            Marketplace Agent: Handle non-real-estate product/service searches and broadcast requests.
            Extracts: product_type, budget, etc.
            """
            try:
                thread_id = state.get('thread_id', 'unknown')
                logger.info(f"[{thread_id}] Marketplace Agent: processing '{state['user_input'][:50]}'...")

                # STEP 4: Get agent-specific context
                agent_context_str = state.get("agent_specific_context", "")
                collected_info = state.get("agent_collected_info", {})

                if agent_context_str:
                    logger.info(
                        "[%s] Marketplace Agent: using agent-specific context (%d chars, %d collected items)",
                        thread_id,
                        len(agent_context_str),
                        len(collected_info)
                    )

                # Extract entities from routing decision
                routing_decision = state.get('routing_decision')
                entities = {}
                if routing_decision is not None:
                    if hasattr(routing_decision, 'extracted_entities'):
                        entities = getattr(routing_decision, 'extracted_entities') or {}
                    elif isinstance(routing_decision, dict):
                        entities = routing_decision.get('extracted_entities', {}) or {}
                product_type = entities.get('product_type', 'products')

                # Build contextual response
                response = f"I can help you find {product_type}. Let me search for the best deals and connect you with sellers."

                # STEP 4: Extract entities and update agent context
                updated_info = _extract_entities(state['user_input'], collected_info)

                # Determine conversation stage
                stage = "discovery"  # Marketplace typically starts with discovery

                # Update agent contexts
                agent_contexts = state.get("agent_contexts") or {}
                agent_contexts["marketplace_agent"] = {
                    "collected_info": updated_info,
                    "conversation_stage": stage,
                    "last_active": time.time(),
                    "product_type": product_type,
                }

                logger.info(
                    "[%s] Marketplace Agent: context preserved (stage=%s, entities=%d)",
                    thread_id,
                    stage,
                    len(updated_info)
                )
                logger.info(f"[{thread_id}] Marketplace Agent: returning response")
                return _with_history(
                    state,
                    {
                        'final_response': response,
                        'current_node': 'marketplace_agent',
                        'is_complete': True,
                        'extracted_criteria': entities,
                        'agent_contexts': agent_contexts,  # STEP 4: Persist agent contexts
                        'agent_collected_info': updated_info,  # STEP 4: Persist collected info
                        'agent_conversation_stage': stage,  # STEP 4: Persist conversation stage
                    },
                    response,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] Marketplace Agent failed: {e}")
                fallback = 'I had trouble processing your request. Please try again.'
                return _with_history(
                    state,
                    {
                        'final_response': fallback,
                        'current_node': 'marketplace_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    fallback,
                )

        @traced_worker_agent("local_info")
        def local_info_handler(state: SupervisorState) -> SupervisorState:
            """
            Local Info Agent: Handle live local lookups (pharmacy on duty, hospitals, activities).
            Uses Tavily for web search + Nominatim for geocoding.
            Always ask for a city if not explicitly provided; never default.
            """
            try:
                thread_id = state.get('thread_id', 'unknown')
                logger.info(f"[{thread_id}] Local Info Agent: processing '{(state.get('user_input') or '')[:50]}'...")

                # STEP 4: Get agent-specific context
                agent_context_str = state.get("agent_specific_context", "")
                collected_info = state.get("agent_collected_info", {})

                if agent_context_str:
                    logger.info(
                        "[%s] Local Info Agent: using agent-specific context (%d chars, %d collected items)",
                        thread_id,
                        len(agent_context_str),
                        len(collected_info)
                    )

                user_input = state.get('user_input') or ''
                q = user_input.lower()

                # Normalization first: use registry hits determined by the supervisor,
                # otherwise perform a local lookup.  This keeps entity matching consistent
                # across the routing layer and worker logic.
                registry_hits = state.get('registry_hits') or []
                normalized_base = (state.get('normalized_query') or '') if state.get('normalized_query') else None
                if not registry_hits:
                    try:
                        registry_hits = get_registry_client().search(user_input, domain="local_info", k=8)
                    except Exception as registry_error:  # noqa: BLE001
                        logger.warning(f"[{state.get('thread_id')}] Registry lookup failed in local_info: {registry_error}")
                        registry_hits = []
                if not normalized_base and registry_hits:
                    normalized_base = registry_hits[0].get("base_term") or registry_hits[0].get("localized_term")

                normalized_terms = {
                    term.lower()
                    for hit in registry_hits
                    for term in [hit.get("base_term"), hit.get("localized_term")]
                    if term
                }

                def _matches(term: str) -> bool:
                    """Check if the user request semantically aligns with the supplied term."""
                    candidate = term.lower()
                    if normalized_base and normalized_base.lower() == candidate:
                        return True
                    return candidate in normalized_terms or candidate in q

                # Extract explicit city from structured criteria (set by supervisor intent)
                attrs = state.get('extracted_criteria') or {}
                raw_city = attrs.get('city') or state.get('location')

                # Guard: city required
                if not raw_city:
                    ask = (
                        "Which city should I search? (Kyrenia/Girne, Nicosia/Lefkoşa, "
                        "Famagusta/Gazimağusa, Güzelyurt/Morphou, İskele/Trikomo)"
                    )
                    logger.info(f"[{state.get('thread_id')}] LOCAL_LOOKUP missing city → prompt user")
                    response_payload = {"type": "text", "message": ask}
                    return _with_history(
                        state,
                        {
                            'final_response': response_payload,
                            'current_node': 'local_info_agent',
                            'is_complete': False,
                        },
                        response_payload,
                    )

                city = normalize_city(raw_city)
                if not city:
                    ask = (
                        "I couldn't recognize the city name. Which city should I search? "
                        "(Kyrenia/Girne, Nicosia/Lefkoşa, Famagusta/Gazimağusa, Güzelyurt/Morphou, İskele/Trikomo)"
                    )
                    logger.info(f"[{state.get('thread_id')}] LOCAL_LOOKUP unrecognized city → prompt user")
                    response_payload = {"type": "text", "message": ask}
                    return _with_history(
                        state,
                        {
                            'final_response': response_payload,
                            'current_node': 'local_info_agent',
                            'is_complete': False,
                        },
                        response_payload,
                    )

                # Handle pharmacy queries with Tavily + geocoding
                if _matches('pharmacy') or _matches('doctor') or _matches('medical'):
                    try:
                        from . import tavily

                        # Build Tavily search query (Two-Step: Search → Extract)
                        search_query = f"open on-duty pharmacy schedule {city}"
                        logger.info(f"[{state.get('thread_id')}] Tavily search: {search_query}")

                        # Search for pharmacies (scoped to kteb.org, advanced depth, few results)
                        search_result = tavily.search(
                            search_query,
                            search_depth="advanced",
                            time_range="d",
                            max_results=2,
                            include_domains=["kteb.org"],
                        )
                        hits = (search_result.get("results") or [])[:2]
                        urls = [h.get("url") for h in hits if h.get("url")][:5]
                        # Try to enrich URL list via site_map to skip non-extractable roots
                        try:
                            sm = tavily.site_map("kteb.org")
                            site_urls = [u for u in (sm.get("urls") or []) if isinstance(u, str)]
                            # Prefer likely detail pages
                            detail_like = [u for u in site_urls if all(seg not in u.lower() for seg in ["/dp/", "/lists/", "/?lang="])]
                            urls.extend(detail_like[:5])
                        except Exception:
                            pass

                        recs = []

                        def _with_retries(call, attempts: int = 3, delay: float = 0.6):
                            last_err = None
                            for i in range(attempts):
                                try:
                                    return call()
                                except Exception as e:
                                    last_err = e
                                    time.sleep(delay * (2 ** i))
                            if last_err:
                                raise last_err
                            return None
                        for idx, url in enumerate(urls):
                            try:
                                # Prefer using search hit metadata first
                                hit = hits[idx] if idx < len(hits) else {}
                                hit_title = (hit.get("title") or "").strip()
                                hit_content = (hit.get("content") or hit.get("snippet") or "").strip()

                                def _append_if_geocoded(title_val: str, address_val: str):
                                    if not title_val and not address_val:
                                        return False
                                    coords_local = geocode(f"{title_val} {city}") if title_val else None
                                    if not coords_local and address_val:
                                        coords_local = geocode(f"{address_val} {city}")
                                    if coords_local:
                                        lat, lng = coords_local
                                        recs.append({
                                            "type": "geo_location",
                                            "latitude": lat,
                                            "longitude": lng,
                                            "display_name": title_val or address_val or "Pharmacy",
                                            "entity_type": "pharmacy",
                                            "metadata": {"address": address_val or None, "url": url}
                                        })
                                        return True
                                    return False

                                # If the URL looks like an index/root page, skip extract and try geocoding from hit title/content
                                if any(seg in url.lower() for seg in ["/dp/", "/news", "/?lang="]):
                                    if _append_if_geocoded(hit_title, hit_content):
                                        continue

                                # Otherwise attempt structured extract with advanced depth; on 4xx/422 fall back to hit metadata
                                try:
                                    extract_result = _with_retries(
                                        lambda: tavily.extract(url, extract_depth="advanced", format="text")
                                    )
                                    items = (extract_result.get("results") or [])[:6]
                                    # If Tavily returns a flat text content without granular items
                                    if not items and isinstance(extract_result, dict):
                                        text_blob = (extract_result.get("content") or "").strip()
                                        if text_blob and (hit_title or hit_content):
                                            _append_if_geocoded(hit_title, text_blob[:200])
                                    if not items and (hit_title or hit_content):
                                        _append_if_geocoded(hit_title, hit_content)
                                    for item in items:
                                        title = (item.get("title") or hit_title or "Pharmacy").strip()
                                        address = (item.get("meta") or item.get("address") or item.get("content") or hit_content or "").strip()
                                        if _append_if_geocoded(title, address):
                                            # Mark as duty today since coming from KTEB context
                                            if recs:
                                                recs[-1].setdefault("metadata", {})["duty_today"] = True
                                            continue
                                except Exception as ex:
                                    logger.warning(f"[{state.get('thread_id')}] Extract failed for {url}: {ex}")
                                    # Fallback: geocode using hit metadata
                                    if _append_if_geocoded(hit_title, hit_content) and recs:
                                        recs[-1].setdefault("metadata", {})["duty_today"] = True
                            except Exception as e:
                                logger.warning(f"[{state.get('thread_id')}] Failed to extract {url}: {e}")

                        # If still empty, use Overpass fallback (duty unconfirmed)
                        if not recs:
                            try:
                                pois = overpass_pharmacies_near_city(city)
                                for p in pois:
                                    lat = p.get("lat"); lon = p.get("lon")
                                    if lat is None or lon is None:
                                        continue
                                    recs.append({
                                        "type": "geo_location",
                                        "latitude": lat,
                                        "longitude": lon,
                                        "display_name": p.get("name") or "Pharmacy",
                                        "entity_type": "pharmacy",
                                        "metadata": {"source": "overpass", "duty_today": False}
                                    })
                            except Exception:
                                pass

                        msg = (
                            f"Found {len(recs)} pharmacies in {city}."
                            if recs else f"Couldn't confirm duty pharmacies for {city}."
                        )
                        logger.info(f"[{thread_id}] Local Info: {len(recs)} pharmacies found")

                        # STEP 4: Extract entities and update agent context
                        updated_info = _extract_entities(state['user_input'], collected_info)
                        stage = "presenting" if recs else "discovery"

                        # Update agent contexts
                        agent_contexts = state.get("agent_contexts") or {}
                        agent_contexts["local_info_agent"] = {
                            "collected_info": updated_info,
                            "conversation_stage": stage,
                            "last_active": time.time(),
                            "query_type": "pharmacy",
                            "result_count": len(recs),
                        }

                        logger.info(
                            "[%s] Local Info Agent: context preserved (stage=%s, entities=%d)",
                            thread_id,
                            stage,
                            len(updated_info)
                        )

                        response_payload = {"type": "text", "message": msg}
                        return _with_history(
                            state,
                            {
                                'final_response': response_payload,
                                'recommendations': recs,
                                'current_node': 'local_info_agent',
                                'is_complete': True,
                                'agent_contexts': agent_contexts,  # STEP 4
                                'agent_collected_info': updated_info,  # STEP 4
                                'agent_conversation_stage': stage,  # STEP 4
                            },
                            response_payload,
                        )
                    except Exception as e:
                        logger.warning(f"[{state.get('thread_id')}] Tavily search failed: {e}; falling back")
                        response = f"I couldn't fetch on-duty pharmacies for {city} right now. Try checking the municipality health page."
                        response_payload = {"type": "text", "message": response}
                        return _with_history(
                            state,
                            {
                                'final_response': response_payload,
                                'current_node': 'local_info_agent',
                                'is_complete': True,
                            },
                            response_payload,
                        )

                elif any(_matches(k) for k in ['hospital', 'clinic', 'emergency']):
                    places = find_places('hospital', near=city)
                    if places:
                        response = f"Nearby hospitals in {city}:\n" + "\n".join(f"- {p.get('display_name')}" for p in places[:5])
                    else:
                        response = f"I couldn't find nearby hospitals in {city} right now."
                    query_type = "hospital"
                elif any(_matches(k) for k in ['things to do', 'activities', 'what to do']):
                    hits = web_search(f"things to do in {city} today")
                    heading = hits.get('Heading') or 'Top guides online'
                    response = f"Popular activities in {city}:\n- {heading}"
                    query_type = "activities"
                else:
                    response = "I can look up duty pharmacies, hospitals, directions, and local activities. What exactly do you need?"
                    query_type = "general"

                # STEP 4: Extract entities and update agent context
                updated_info = _extract_entities(state['user_input'], collected_info)
                stage = "discovery"  # General queries usually start with discovery

                # Update agent contexts
                agent_contexts = state.get("agent_contexts") or {}
                agent_contexts["local_info_agent"] = {
                    "collected_info": updated_info,
                    "conversation_stage": stage,
                    "last_active": time.time(),
                    "query_type": query_type,
                }

                logger.info(
                    "[%s] Local Info Agent: context preserved (stage=%s, query_type=%s)",
                    thread_id,
                    stage,
                    query_type
                )

                response_payload = {"type": "text", "message": response}
                return _with_history(
                    state,
                    {
                        'final_response': response_payload,
                        'current_node': 'local_info_agent',
                        'is_complete': True,
                        'recommendations': [],
                        'agent_contexts': agent_contexts,  # STEP 4
                        'agent_collected_info': updated_info,  # STEP 4
                        'agent_conversation_stage': stage,  # STEP 4
                    },
                    response_payload,
                )
            except Exception as e:
                logger.error(f"[{state.get('thread_id')}] Local Info Agent failed: {e}", exc_info=True)
                response_payload = {"type": "text", "message": 'I had trouble fetching local info.'}
                return _with_history(
                    state,
                    {
                        'final_response': response_payload,
                        'current_node': 'local_info_agent',
                        'is_complete': True,
                        'error_message': str(e),
                    },
                    response_payload,
                )

        # =========================================================================
        # GRAPH CONSTRUCTION
        # =========================================================================

        graph.add_node("supervisor", supervisor_node)
        graph.add_node("real_estate_agent", real_estate_handler)
        graph.add_node("marketplace_agent", marketplace_handler)
        graph.add_node("general_conversation_agent", general_conversation_handler)
        graph.add_node("local_info_agent", local_info_handler)

        graph.set_entry_point("supervisor")

        graph.add_conditional_edges(
            "supervisor",
            route_to_agent,
            {
                "real_estate_agent": "real_estate_agent",
                "marketplace_agent": "marketplace_agent",
                "general_conversation_agent": "general_conversation_agent",
                "local_info_agent": "local_info_agent",
            },
        )

        graph.add_edge("real_estate_agent", END)
        graph.add_edge("marketplace_agent", END)
        graph.add_edge("general_conversation_agent", END)
        graph.add_edge("local_info_agent", END)

        # Compile graph with in-memory session checkpointer
        compiled = None
        try:
            compiled = graph.compile(checkpointer=_SUPERVISOR_MEMORY)
            logger.info("Supervisor graph compiled successfully")
        except Exception as e:
            logger.error("Supervisor graph compile failed: %s", e, exc_info=True)
            compiled = None

        # Fallback: if compile() returned a non-invokable object (or None) due to
        # environment/version differences, provide a minimal wrapper that mimics
        # the compiled graph's .invoke() by calling the supervisor_node and then
        # dispatching to the routed agent handler directly.
        if compiled is None or not hasattr(compiled, "invoke"):
            logger.warning("Using fallback supervisor graph wrapper (no compiled invoke)")

            class _FallbackSupervisor:
                def invoke(self_inner, state: SupervisorState, config: Dict[str, Any] | None = None) -> SupervisorState:
                    try:
                        st = supervisor_node(state)
                        target = route_to_agent(st)
                        if target == "real_estate_agent":
                            return real_estate_handler(st)
                        if target == "marketplace_agent":
                            return marketplace_handler(st)
                        if target == "local_info_agent":
                            return local_info_handler(st)
                        # Default to general conversation
                        return general_conversation_handler(st)
                    except Exception:
                        logger.error("Fallback supervisor invoke failed", exc_info=True)
                        # Return a safe error response
                        return {
                            **state,
                            'final_response': 'I had trouble processing your request. Please try again.',
                            'current_node': 'supervisor',
                            'is_complete': True,
                            'error_message': 'fallback_invoke_failed',
                        }

            instance = _FallbackSupervisor()
            _COMPILED_SUPERVISOR_GRAPH = instance
            return instance

        _COMPILED_SUPERVISOR_GRAPH = compiled
        return compiled
    except Exception as e:
        logger.error(f"Failed to initialize supervisor graph: {e}")
        return None
