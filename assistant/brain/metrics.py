"""
Prometheus Metrics for Real Estate Agent

Counters, histograms, and gauges for observability.
"""

from prometheus_client import Counter, Histogram, Gauge
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# REAL ESTATE AGENT METRICS
# ============================================================================

# Counters
re_agent_act_total = Counter(
    're_agent_act_total',
    'Total number of agent actions by type',
    ['act']  # ASK_SLOT, ACK_AND_SEARCH, SEARCH_AND_RECOMMEND, CLARIFY, ESCALATE
)

re_json_parse_fail_total = Counter(
    're_json_parse_fail_total',
    'Total JSON parse failures from LLM response'
)

re_card_emitted_total = Counter(
    're_card_emitted_total',
    'Total recommendation cards emitted',
    ['variant']  # short_term, long_term
)

re_router_pinned_total = Counter(
    're_router_pinned_total',
    'Total times router was pinned to real_estate_agent',
    ['reason']  # slot_filling_guard, refinement, continuity
)

re_handoff_total = Counter(
    're_handoff_total',
    'Total domain handoffs from real_estate_agent',
    ['to_domain']  # marketplace_agent, general_conversation_agent, etc.
)

re_error_total = Counter(
    're_error_total',
    'Total errors by type',
    ['type']  # json_contract, search_timeout, card_emit, circuit_open
)

# Histograms (timings in milliseconds)
re_prompt_end_to_end_ms = Histogram(
    're_prompt_end_to_end_ms',
    'End-to-end time from prompt render to JSON parse (ms)',
    buckets=[50, 100, 200, 400, 800, 1200, 2000, 5000]
)

re_backend_search_ms = Histogram(
    're_backend_search_ms',
    'Backend search API call duration (ms)',
    buckets=[50, 100, 200, 400, 600, 800, 1000, 2000]
)

re_turn_total_ms = Histogram(
    're_turn_total_ms',
    'Total turn processing time (ms)',
    buckets=[100, 300, 600, 900, 1200, 1800, 3000, 5000]
)

# Gauges
re_circuit_breaker_state = Gauge(
    're_circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=open)',
    ['service']  # backend_search
)

re_active_slots_gauge = Gauge(
    're_active_slots_gauge',
    'Number of active slot-filling sessions'
)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def record_agent_act(act: str):
    """Record agent action."""
    re_agent_act_total.labels(act=act).inc()


def record_json_parse_fail():
    """Record JSON parse failure."""
    re_json_parse_fail_total.inc()


def record_card_emitted(variant: str):
    """Record recommendation card emission."""
    re_card_emitted_total.labels(variant=variant).inc()


def record_router_pinned(reason: str):
    """Record router pinning event."""
    re_router_pinned_total.labels(reason=reason).inc()


def record_handoff(to_domain: str):
    """Record domain handoff."""
    re_handoff_total.labels(to_domain=to_domain).inc()


def record_error(error_type: str):
    """Record error by type."""
    re_error_total.labels(type=error_type).inc()


def record_prompt_duration(duration_ms: float):
    """Record prompt end-to-end duration."""
    re_prompt_end_to_end_ms.observe(duration_ms)


def record_search_duration(duration_ms: float):
    """Record backend search duration."""
    re_backend_search_ms.observe(duration_ms)


def record_turn_duration(duration_ms: float):
    """Record total turn duration."""
    re_turn_total_ms.observe(duration_ms)


def set_circuit_breaker_state(service: str, is_open: bool):
    """Set circuit breaker state."""
    re_circuit_breaker_state.labels(service=service).set(1 if is_open else 0)


logger.info("[Metrics] Real Estate Agent metrics registered")
