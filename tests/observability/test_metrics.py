import time
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import override_settings

pytest.importorskip("prometheus_client")

from assistant.monitoring.metrics import (
    FALLBACK_TOTAL,
    LLMRequestMetrics,
    LLMMetrics,
    PerformanceTracker,
    RETRIEVAL_PATH_TOTAL,
    _clean_payload,
    normalize_usage_payload,
    record_turn_summary,
)
from assistant.brain.supervisor import CentralSupervisor
from assistant.brain.supervisor_schemas import SupervisorRoutingDecision


@override_settings(LLM_METRICS_SAMPLE_RATE=1.0, LLM_METRICS_ERROR_SAMPLE_RATE=1.0)
def test_normalize_usage_payload_shapes():
    openai_payload = {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30, "cost": 0.5}
    anthropic_payload = {"input_tokens": 5, "output_tokens": 7, "totalTokenCount": 12}
    langchain_payload = {"usage": {"prompt_tokens": 2, "completion_tokens": 3, "total_tokens": 5}}

    assert normalize_usage_payload(openai_payload) == (10, 20, 30, 0.5)
    assert normalize_usage_payload(anthropic_payload) == (5, 7, 12, None)
    assert normalize_usage_payload(langchain_payload["usage"]) == (2, 3, 5, None)


@override_settings(LLM_METRICS_SAMPLE_RATE=1.0, LLM_METRICS_ERROR_SAMPLE_RATE=1.0)
def test_performance_tracker_records_latency_and_tokens():
    cache.clear()
    tracker = PerformanceTracker(
        model="openai:gpt-4o-mini",
        intent_type="test_intent",
        conversation_id="conv-123",
        thread_id="thread-xyz",
    )

    with tracker as perf:
        perf.update_tokens(prompt_tokens=10, completion_tokens=5)
        time.sleep(0.01)

    cached = cache.get(f"llm_metrics:{tracker.request_id}")
    assert cached is not None
    assert cached["prompt_tokens"] == 10
    assert cached["completion_tokens"] == 5
    assert cached["conversation_id"] is not None and cached["conversation_id"] != "conv-123"


@override_settings(LLM_METRICS_SAMPLE_RATE=1.0, LLM_METRICS_ERROR_SAMPLE_RATE=1.0)
def test_record_turn_summary_idempotent():
    cache.clear()
    RETRIEVAL_PATH_TOTAL._metrics.clear()
    FALLBACK_TOTAL._metrics.clear()

    paths = ["db", "rag", "web", "cache"]
    for idx, path in enumerate(paths):
        record_turn_summary(
            {
                "request_id": "req-123",
                "turn_index": idx,
                "route_target": "real_estate_agent",
                "retrieval_path": path,
                "num_docs_used": idx + 1,
                "confidence": 0.8,
                "agent_name": "real_estate_agent",
                "language": "en",
                "rag_miss": path == "rag",
                "web_fallback": path == "web",
            }
        )
        # Repeat to assert dedupe behaviour
        record_turn_summary(
            {
                "request_id": "req-123",
                "turn_index": idx,
                "route_target": "real_estate_agent",
                "retrieval_path": path,
                "num_docs_used": idx + 1,
                "confidence": 0.8,
                "agent_name": "real_estate_agent",
                "language": "en",
                "rag_miss": path == "rag",
                "web_fallback": path == "web",
            }
        )

    for path in paths:
        metric = RETRIEVAL_PATH_TOTAL.labels(
            path=path,
            agent="real_estate_agent",
            route_target="real_estate_agent",
            language="en",
            market_id="default",
        )
        assert metric._value.get() == 1

    rag_fallback = FALLBACK_TOTAL.labels(
        kind="rag_miss",
        agent="real_estate_agent",
        route_target="real_estate_agent",
        language="en",
        market_id="default",
    )
    assert rag_fallback._value.get() == 1

    web_fallback = FALLBACK_TOTAL.labels(
        kind="web_fallback",
        agent="real_estate_agent",
        route_target="real_estate_agent",
        language="en",
        market_id="default",
    )
    assert web_fallback._value.get() == 1

    stored = cache.get("llm_turn:req-123:0")
    assert stored is not None
    assert stored["request_id"] != "req-123"


def test_clean_payload_redacts_sensitive_fields():
    payload = {
        "api_key": "sk-secret",
        "user_id": "user-1",
        "notes": "contact me at test@example.com or +1 555-123-4567",
    }
    sanitized = _clean_payload(payload)
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["user_id"] is not None and sanitized["user_id"] != "user-1"
    assert "[REDACTED_EMAIL]" in sanitized["notes"]
    assert "[REDACTED_PHONE]" in sanitized["notes"]


@override_settings(LLM_METRICS_SAMPLE_RATE=1.0, LLM_METRICS_ERROR_SAMPLE_RATE=1.0)
def test_llm_metrics_handles_null_cost():
    metrics = LLMMetrics()
    cache.clear()
    request_metrics = LLMRequestMetrics(
        request_id="req-null-cost",
        timestamp=datetime.now(timezone.utc),
        model="openai:gpt-4o-mini",
        prompt_tokens=0,
        completion_tokens=0,
        total_tokens=0,
        latency_ms=5.0,
        cost_usd=0.0,
        success=True,
    )
    metrics.track_request(request_metrics)
    cached = cache.get("llm_metrics:req-null-cost")
    assert cached is not None


@patch("assistant.brain.intent_parser.parse_intent_robust")
def test_supervisor_normalizes_legacy_decision(mock_parse):
    state = {
        "user_input": "Find me an apartment",
        "thread_id": "thread-123",
        "messages": [],
        "user_id": None,
        "conversation_history": [],
        "routing_decision": None,
        "target_agent": None,
        "extracted_criteria": None,
        "property_data": None,
        "request_data": None,
        "current_node": "start",
        "error_message": None,
        "is_complete": False,
        "conversation_id": "conv-1",
        "user_language": "en",
        "output_language": "en",
        "guardrail_passed": True,
        "guardrail_reason": None,
        "internal_search_results": [],
        "external_search_results": [],
        "retrieval_quality_score": None,
        "request_id": None,
        "hitl_approval_required": False,
        "hitl_approval_id": None,
        "synthesis_data": None,
        "final_response": None,
        "recommendations": [],
        "self_evaluation_score": None,
        "needs_retry": False,
        "retry_count": 0,
    }
    mock_parse.return_value = SupervisorRoutingDecision(
        primary_domain="REAL_ESTATE",
        secondary_domain=None,
        confidence_score=0.9,
        extracted_entities={},
        reasoning="test",
        requires_clarification=False,
    )
    supervisor = CentralSupervisor()
    result = supervisor.route_request(state)
    assert isinstance(result["routing_decision"], dict)
    assert result["routing_decision_raw"] is not None
