"""
Production metrics and performance tracking for LLM interactions.

Implements cache-backed aggregation of latency, cost, and token usage so that
supervisors and ops tooling can reason about behaviour in near real-time.
"""

from __future__ import annotations

import hashlib
import logging
import random
import re
import time
import uuid
from contextlib import nullcontext
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from django.conf import settings
    from django.core.cache import cache
    _DJANGO_AVAILABLE = True
except Exception:
    # Django not available (e.g., in registry service)
    settings = None
    cache = None
    _DJANGO_AVAILABLE = False

logger = logging.getLogger(__name__)

def _safe_cache_get(key: str, default=None):
    """Safely get from cache, returning default if Django not available."""
    if not _DJANGO_AVAILABLE or not cache:
        return default
    try:
        return cache.get(key, default)
    except Exception:
        return default

def _safe_cache_set(key: str, value: Any, timeout: int = None):
    """Safely set cache, no-op if Django not available."""
    if not _DJANGO_AVAILABLE or not cache:
        return
    try:
        cache.set(key, value, timeout=timeout)
    except Exception:
        pass

def _safe_cache_add(key: str, value: Any, timeout: int = None):
    """Safely add to cache, return True if Django not available."""
    if not _DJANGO_AVAILABLE or not cache:
        return True
    try:
        return cache.add(key, value, timeout=timeout)
    except Exception:
        return True

try:  # Optional Prometheus exposure
    from prometheus_client import Counter, Histogram

    _PROMETHEUS_AVAILABLE = True
except Exception:  # noqa: BLE001
    _PROMETHEUS_AVAILABLE = False

try:  # Optional OpenTelemetry span emission
    from opentelemetry import trace as _ot_trace  # type: ignore

    _OT_TRACER = _ot_trace.get_tracer(__name__)
except Exception:  # noqa: BLE001
    _OT_TRACER = None


_PER_REQUEST_TTL = 86400 * 7  # 7 days for symmetry with daily rollups
_DAILY_TTL = 86400 * 30  # retain daily aggregates for 30 days
_TURN_DEDUPE_PREFIX = "llm_turn_dedupe"

def _get_sample_rate() -> float:
    """Get sample rate, with fallback if Django not available."""
    if not _DJANGO_AVAILABLE or not settings:
        return 1.0
    try:
        return float(getattr(settings, "LLM_METRICS_SAMPLE_RATE", 1.0))
    except Exception:
        return 1.0

def _get_error_sample_rate() -> float:
    """Get error sample rate, with fallback if Django not available."""
    if not _DJANGO_AVAILABLE or not settings:
        return 1.0
    try:
        return float(getattr(settings, "LLM_METRICS_ERROR_SAMPLE_RATE", 1.0))
    except Exception:
        return 1.0

def _get_prom_layer_default() -> str:
    """Get Prometheus layer default, with fallback if Django not available."""
    if not _DJANGO_AVAILABLE or not settings:
        return "llm_cache"
    try:
        return getattr(settings, "LLM_METRICS_CACHE_LAYER", "llm_cache")
    except Exception:
        return "llm_cache"

def _is_otel_enabled() -> bool:
    """Check if OpenTelemetry is enabled, with fallback if Django not available."""
    if not _OT_TRACER or not _DJANGO_AVAILABLE or not settings:
        return False
    try:
        return bool(getattr(settings, "ENABLE_OTEL_METRICS", False))
    except Exception:
        return False

_SENSITIVE_KEYS = {
    "api_key",
    "apikey",
    "authorization",
    "auth_token",
    "token",
    "secret",
    "email",
    "phone",
    "phone_number",
    "iban",
    "account_number",
    "card",
    "pan",
}

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", re.IGNORECASE)
_PHONE_RE = re.compile(r"\+?\d[\d\-\s]{7,}\d")
_IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b")
_CARD_RE = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")
_GPS_RE = re.compile(r"\b-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b")
_HEX_RE = re.compile(r"\b[0-9a-fA-F]{8,}\b")


if _PROMETHEUS_AVAILABLE:
    LLM_REQUESTS_TOTAL = Counter(
        "llm_requests_total",
        "Total LLM requests processed",
        ["provider", "model_family", "agent", "tool", "success", "language"],
    )
    LLM_LATENCY_MS = Histogram(
        "llm_latency_ms",
        "LLM latency distribution in milliseconds",
        ["provider", "model_family"],
        buckets=(10, 50, 100, 250, 500, 1000, 2000, 5000, 10000),
    )
    LLM_TOKENS_TOTAL = Counter(
        "llm_tokens_total",
        "Total tokens consumed by type",
        ["provider", "model_family", "type"],
    )
    LLM_COST_USD_TOTAL = Counter(
        "llm_cost_usd_total",
        "Cumulative LLM cost in USD",
        ["provider", "model_family"],
    )
    LLM_CACHE_HITS_TOTAL = Counter(
        "llm_cache_hits_total",
        "Cache hits observed during LLM execution",
        ["layer"],
    )
    RETRIEVAL_PATH_TOTAL = Counter(
        "retrieval_path_total",
        "Retrieval path usage counts",
        ["path", "agent", "route_target", "language", "market_id"],
    )
    FALLBACK_TOTAL = Counter(
        "fallback_total",
        "Fallback counters for RAG/web paths",
        ["kind", "agent", "route_target", "language", "market_id"],
    )
    
    # Enhanced metrics for Grafana dashboard
    HTTP_REQUESTS_TOTAL = Counter(
        "http_requests_total",
        "Total HTTP requests processed",
        ["method", "endpoint", "status_code", "service"],
    )
    HTTP_REQUEST_DURATION = Histogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "endpoint", "status_code", "service"],
        buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    )
    AGENT_EXECUTION_DURATION = Histogram(
        "agent_execution_duration_seconds",
        "Agent execution duration in seconds",
        ["agent_name", "operation", "success"],
        buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
    )
    REGISTRY_OPERATIONS_TOTAL = Counter(
        "registry_operations_total",
        "Registry service operations",
        ["operation", "status", "market_id", "language"],
    )
    REGISTRY_OPERATION_DURATION = Histogram(
        "registry_operation_duration_seconds",
        "Registry operation duration in seconds",
        ["operation", "status"],
        buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0),
    )
    CACHE_OPERATIONS_TOTAL = Counter(
        "cache_operations_total",
        "Cache operations (hits/misses)",
        ["operation", "cache_type", "status"],
    )
    ERROR_RATE = Counter(
        "error_rate_total",
        "Error rate by service and error type",
        ["service", "error_type", "severity"],
    )
    ACTIVE_CONNECTIONS = Counter(
        "active_connections_total",
        "Active database and Redis connections",
        ["connection_type", "status"],
    )


@dataclass
class LLMRequestMetrics:
    """Track individual LLM request metrics."""

    request_id: str
    timestamp: datetime
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    cost_usd: float
    success: bool
    error_type: Optional[str] = None
    intent_type: Optional[str] = None
    language: Optional[str] = None
    conversation_id: Optional[str] = None
    thread_id: Optional[str] = None
    provider: Optional[str] = None
    model_family: Optional[str] = None
    tool_name: Optional[str] = None
    agent_name: Optional[str] = None
    cache_hit: bool = False
    cache_layer: Optional[str] = None
    retry_count: Optional[int] = None
    error_hash: Optional[str] = None


def _coerce_int(value: Any) -> int:
    """Best-effort conversion to int with a zero fallback."""
    try:
        if value is None:
            return 0
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str) and value.strip():
            return int(float(value))
    except Exception:
        pass
    return 0


def normalize_usage_payload(payload: Optional[Dict[str, Any]]) -> Tuple[int, int, int, Optional[float]]:
    """
    Normalise heterogeneous token usage payloads into a consistent tuple.

    Supports OpenAI / Anthropic / LangChain conventions. Returns
    (prompt_tokens, completion_tokens, total_tokens, cost_usd).
    """
    if not isinstance(payload, dict):
        return 0, 0, 0, None

    prompt_tokens = (
        payload.get("prompt_tokens")
        or payload.get("input_tokens")
        or payload.get("promptTokens")
        or payload.get("inputTokenCount")
        or payload.get("inputTokens")
    )
    completion_tokens = (
        payload.get("completion_tokens")
        or payload.get("output_tokens")
        or payload.get("completionTokens")
        or payload.get("outputTokenCount")
        or payload.get("outputTokens")
    )
    total_tokens = (
        payload.get("total_tokens")
        or payload.get("totalTokens")
        or payload.get("token_count")
        or payload.get("totalTokenCount")
    )

    prompt_tokens = _coerce_int(prompt_tokens)
    completion_tokens = _coerce_int(completion_tokens)
    total_tokens = _coerce_int(total_tokens)

    if total_tokens <= 0:
        total_tokens = prompt_tokens + completion_tokens
    elif prompt_tokens == 0 and completion_tokens > 0:
        prompt_tokens = max(total_tokens - completion_tokens, 0)
    elif completion_tokens == 0 and prompt_tokens > 0:
        completion_tokens = max(total_tokens - prompt_tokens, 0)

    cost_usd = payload.get("cost") or payload.get("cost_usd") or payload.get("total_cost")
    try:
        cost_usd = float(cost_usd) if cost_usd is not None else None
    except Exception:
        cost_usd = None

    return prompt_tokens, completion_tokens, total_tokens, cost_usd


def extract_token_usage(raw: Any) -> Dict[str, Any]:
    """
    Attempt to extract token usage metadata from a LangChain/OpenAI response object.

    Returns dict with prompt_tokens, completion_tokens, total_tokens, optional cost_usd.
    """
    usage_candidates: List[Dict[str, Any]] = []

    if raw is None:
        return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": None}

    usage_meta = getattr(raw, "usage_metadata", None)
    if isinstance(usage_meta, dict):
        usage_candidates.append(usage_meta)

    response_meta = getattr(raw, "response_metadata", None)
    if isinstance(response_meta, dict):
        token_usage = response_meta.get("token_usage") or response_meta.get("usage")
        if isinstance(token_usage, dict):
            usage_candidates.append(token_usage)
        else:
            usage_candidates.append(response_meta)

    raw_usage = getattr(raw, "usage", None)
    if isinstance(raw_usage, dict):
        usage_candidates.append(raw_usage)

    additional_kwargs = getattr(raw, "additional_kwargs", None)
    if isinstance(additional_kwargs, dict):
        token_payload = additional_kwargs.get("usage") or additional_kwargs.get("token_usage")
        if isinstance(token_payload, dict):
            usage_candidates.append(token_payload)

    if isinstance(raw, dict):
        usage_candidates.append(raw)

    for payload in usage_candidates:
        prompt, completion, total, cost = normalize_usage_payload(payload)
        if prompt or completion or total or cost:
            return {
                "prompt_tokens": prompt,
                "completion_tokens": completion,
                "total_tokens": total,
                "cost_usd": cost,
            }

    return {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": None}


def _infer_model_tags(model: str) -> Tuple[str, str]:
    """Infer provider and model family from a model identifier."""
    if ":" in model:
        provider, remainder = model.split(":", 1)
        family = remainder.split("-", 1)[0]
        return provider or "unknown", family or remainder

    if model.startswith(("gpt-", "o", "text-")):
        provider = "openai"
    elif model.startswith(("claude", "sonnet")):
        provider = "anthropic"
    else:
        provider = "unknown"

    family = model.split("-", 1)[0] if "-" in model else model
    return provider, family


def _hash_identifier(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        return hashlib.sha1(str(value).encode("utf-8")).hexdigest()  # noqa: S324
    except Exception:  # noqa: BLE001
        return None


def _redact_text(value: str) -> str:
    redacted = _EMAIL_RE.sub("[REDACTED_EMAIL]", value)
    redacted = _PHONE_RE.sub("[REDACTED_PHONE]", redacted)
    redacted = _IBAN_RE.sub("[REDACTED_IBAN]", redacted)
    redacted = _CARD_RE.sub("[REDACTED_CARD]", redacted)
    redacted = _GPS_RE.sub("[REDACTED_GPS]", redacted)
    return redacted


def _clean_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        sanitized: Dict[str, Any] = {}
        for key, val in payload.items():
            key_lower = key.lower()
            if key_lower in _SENSITIVE_KEYS:
                sanitized[key] = "[REDACTED]"
                continue
            if key_lower.endswith("_id") or key_lower in {"user", "user_id", "conversation_id", "thread_id"}:
                sanitized[key] = _hash_identifier(val)
                continue
            sanitized[key] = _clean_payload(val)
        return sanitized
    if isinstance(payload, list):
        return [_clean_payload(item) for item in payload]
    if isinstance(payload, str):
        return _redact_text(payload)
    return payload


def _normalize_error_message(message: str) -> str:
    sanitized = _HEX_RE.sub("#", message)
    sanitized = re.sub(r"\d+", "#", sanitized)
    return sanitized.lower()


class LLMMetrics:
    """Production-ready LLM metrics tracking."""

    def __init__(self):
        self.cache_key_prefix = "llm_metrics"
        self.daily_cost_key = "daily_cost"
        self.performance_key = "performance_stats"

    def track_request(self, metrics: LLMRequestMetrics) -> None:
        """Track a single LLM request."""
        try:
            sample_threshold = _get_error_sample_rate() if not metrics.success else _get_sample_rate()
            if sample_threshold < 1.0 and random.random() > sample_threshold:
                logger.debug("Skipping metrics tracking due to sampling (request_id=%s)", metrics.request_id)
                return

            cache_key = f"{self.cache_key_prefix}:{metrics.request_id}"
            _safe_cache_set(cache_key, _clean_payload(asdict(metrics)), timeout=_PER_REQUEST_TTL)

            self._update_daily_metrics(metrics)
            self._update_performance_stats(metrics)
            self._emit_telemetry(metrics)

            logger.info(
                "LLM metrics tracked: %s - %.0fms - $%.4f",
                metrics.request_id,
                metrics.latency_ms,
                metrics.cost_usd or 0.0,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to track LLM metrics: %s", exc)

    def _update_daily_metrics(self, metrics: LLMRequestMetrics) -> None:
        """Update daily cost and usage aggregates."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        daily_key = f"{self.daily_cost_key}:{today}"

        daily_data = _safe_cache_get(
            daily_key,
            {
                "date": today,
                "total_requests": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "successful_requests": 0,
                "failed_requests": 0,
                "avg_latency": 0.0,
                "models_used": {},
            },
        )

        cost = metrics.cost_usd or 0.0

        daily_data["total_requests"] += 1
        daily_data["total_tokens"] += metrics.total_tokens
        daily_data["total_cost"] += cost
        daily_data["avg_latency"] = (
            (daily_data["avg_latency"] * (daily_data["total_requests"] - 1) + metrics.latency_ms)
            / daily_data["total_requests"]
        )

        if metrics.success:
            daily_data["successful_requests"] += 1
        else:
            daily_data["failed_requests"] += 1

        models_used = daily_data["models_used"]
        models_used[metrics.model] = models_used.get(metrics.model, 0) + 1

        _safe_cache_set(daily_key, daily_data, timeout=_DAILY_TTL)

    def _update_performance_stats(self, metrics: LLMRequestMetrics) -> None:
        """Update rolling performance statistics."""
        stats_key = f"{self.performance_key}:rolling"
        cost = metrics.cost_usd or 0.0

        stats = _safe_cache_get(
            stats_key,
            {
                "total_requests": 0,
                "avg_latency_ms": 0.0,
                "success_rate": 0.0,
                "cost_per_request": 0.0,
                "tokens_per_request": 0.0,
                "successful_requests": 0,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            },
        )

        total = stats["total_requests"]
        stats["total_requests"] = total + 1
        stats["avg_latency_ms"] = (
            (stats["avg_latency_ms"] * total + metrics.latency_ms) / (total + 1)
        )
        stats["cost_per_request"] = (
            (stats["cost_per_request"] * total + cost) / (total + 1)
        )
        stats["tokens_per_request"] = (
            (stats["tokens_per_request"] * total + metrics.total_tokens) / (total + 1)
        )

        if metrics.success:
            stats["successful_requests"] = stats.get("successful_requests", 0) + 1

        stats["success_rate"] = (
            stats["successful_requests"] / stats["total_requests"]
            if stats["total_requests"] > 0
            else 0.0
        )
        stats["last_updated"] = datetime.now(timezone.utc).isoformat()

        _safe_cache_set(stats_key, stats, timeout=3600)

    def get_daily_metrics(self, date: Optional[str] = None) -> Dict[str, Any]:
        """Get daily metrics for a specific date."""
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        daily_key = f"{self.daily_cost_key}:{date}"
        return _safe_cache_get(daily_key, {})

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        stats_key = f"{self.performance_key}:rolling"
        return _safe_cache_get(stats_key, {})

    def get_cost_estimate(self, prompt_tokens: int, completion_tokens: int, model: str = "gpt-4o-mini") -> float:
        """Estimate cost for a request based on the pricing table."""
        pricing = {
            "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
            "gpt-4o": {"input": 0.005, "output": 0.015},
            "gpt-4": {"input": 0.03, "output": 0.06},
        }
        model_pricing = pricing.get(model, pricing["gpt-4o-mini"])
        input_cost = (prompt_tokens / 1000) * model_pricing["input"]
        output_cost = (completion_tokens / 1000) * model_pricing["output"]
        return input_cost + output_cost

    def _emit_telemetry(self, metrics: LLMRequestMetrics) -> None:
        """Emit optional telemetry to Prometheus / OpenTelemetry exporters."""
        if _PROMETHEUS_AVAILABLE:
            success_label = "true" if metrics.success else "false"
            agent_label = metrics.agent_name or "unknown"
            tool_label = metrics.tool_name or "unknown"
            provider = metrics.provider or "unknown"
            model_family = metrics.model_family or "unknown"
            language_label = metrics.language or "unknown"

            LLM_REQUESTS_TOTAL.labels(
                provider=provider,
                model_family=model_family,
                agent=agent_label,
                tool=tool_label,
                success=success_label,
                language=language_label,
            ).inc()
            LLM_LATENCY_MS.labels(provider, model_family).observe(metrics.latency_ms)
            LLM_TOKENS_TOTAL.labels(provider, model_family, "prompt").inc(metrics.prompt_tokens)
            LLM_TOKENS_TOTAL.labels(provider, model_family, "completion").inc(metrics.completion_tokens)
            LLM_COST_USD_TOTAL.labels(provider, model_family).inc(metrics.cost_usd or 0.0)

            if metrics.cache_hit:
                LLM_CACHE_HITS_TOTAL.labels(metrics.cache_layer or "unspecified").inc()

        span_ctx = _OT_TRACER.start_as_current_span("metrics.llm.request") if _is_otel_enabled() else nullcontext()

        with span_ctx as span:
            if span:
                span.set_attribute("llm.model", metrics.model)
                span.set_attribute("llm.provider", metrics.provider or "unknown")
                span.set_attribute("llm.model_family", metrics.model_family or "")
                span.set_attribute("llm.success", bool(metrics.success))
                span.set_attribute("llm.intent", metrics.intent_type or "")
                span.set_attribute("llm.language", metrics.language or "")
                span.set_attribute("llm.agent", metrics.agent_name or "")
                span.set_attribute("llm.tool", metrics.tool_name or "")
                span.set_attribute("llm.latency_ms", metrics.latency_ms)
                span.set_attribute("llm.prompt_tokens", metrics.prompt_tokens)
                span.set_attribute("llm.completion_tokens", metrics.completion_tokens)
                span.set_attribute("llm.total_tokens", metrics.total_tokens)
                span.set_attribute("llm.cost_usd", metrics.cost_usd or 0.0)
                span.set_attribute("llm.retry_count", metrics.retry_count or 0)
                span.set_attribute("llm.cache_hit", bool(metrics.cache_hit))
                if metrics.error_hash:
                    span.set_attribute("llm.error_hash", metrics.error_hash)


class PerformanceTracker:
    """Context manager for tracking LLM request performance."""

    def __init__(
        self,
        request_id: Optional[str] = None,
        model: str = "gpt-4o-mini",
        intent_type: Optional[str] = None,
        language: Optional[str] = None,
        conversation_id: Optional[str] = None,
        thread_id: Optional[str] = None,
        retry_count: Optional[int] = None,
    ):
        self.request_id = request_id or f"llm-{uuid.uuid4()}"
        self.model = model
        self.intent_type = intent_type
        self.language = language
        self.conversation_id = conversation_id
        self.thread_id = thread_id
        self.retry_count = retry_count

        self.provider, self.model_family = _infer_model_tags(model)

        self.start_time: Optional[float] = None
        self.metrics = LLMMetrics()

        self.prompt_tokens: int = 0
        self.completion_tokens: int = 0
        self.total_tokens: int = 0
        self.override_cost: Optional[float] = None

        self.tool_name: Optional[str] = None
        self.agent_name: Optional[str] = None
        self.cache_hit: bool = False
        self.cache_layer: Optional[str] = None
        self.error_hash: Optional[str] = None

    def __enter__(self) -> "PerformanceTracker":
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        latency_ms = 0.0
        if self.start_time:
            latency_ms = (time.time() - self.start_time) * 1000

        prompt_tokens = max(self.prompt_tokens, 0)
        completion_tokens = max(self.completion_tokens, 0)
        total_tokens = max(self.total_tokens or (prompt_tokens + completion_tokens), 0)

        cost_usd = (
            self.override_cost
            if self.override_cost is not None
            else self.metrics.get_cost_estimate(prompt_tokens, completion_tokens, self.model)
        )

        if exc_val and not self.error_hash:
            try:
                normalized = _normalize_error_message(str(exc_val))
                self.error_hash = hashlib.sha1(normalized.encode("utf-8")).hexdigest()  # noqa: S324
            except Exception:  # noqa: BLE001
                self.error_hash = None

        conversation_hash = _hash_identifier(self.conversation_id)
        thread_hash = _hash_identifier(self.thread_id)

        request_metrics = LLMRequestMetrics(
            request_id=self.request_id,
            timestamp=datetime.now(timezone.utc),
            model=self.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
            success=exc_type is None,
            error_type=str(exc_type) if exc_type else None,
            intent_type=self.intent_type,
            language=self.language,
            conversation_id=conversation_hash,
            thread_id=thread_hash,
            provider=self.provider,
            model_family=self.model_family,
            tool_name=self.tool_name,
            agent_name=self.agent_name,
            cache_hit=self.cache_hit,
            cache_layer=self.cache_layer,
            retry_count=self.retry_count,
            error_hash=self.error_hash,
        )

        self.metrics.track_request(request_metrics)

    def update_tokens(
        self,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        total_tokens: Optional[int] = None,
        *,
        cost_usd: Optional[float] = None,
    ) -> None:
        """
        Update token counts and optionally override calculated cost.

        Should be called after receiving the LLM response (before exiting context).
        """
        if prompt_tokens is not None:
            self.prompt_tokens = max(int(prompt_tokens), 0)
        if completion_tokens is not None:
            self.completion_tokens = max(int(completion_tokens), 0)

        inferred_total = self.prompt_tokens + self.completion_tokens
        if total_tokens is not None:
            self.total_tokens = max(int(total_tokens), inferred_total)
        else:
            self.total_tokens = inferred_total

        self.total_tokens = max(self.total_tokens, 0)

        if cost_usd is not None:
            try:
                self.override_cost = float(cost_usd)
            except Exception:  # noqa: BLE001
                logger.debug("Invalid cost override provided to PerformanceTracker", exc_info=True)

    def set_tool_context(self, *, tool_name: Optional[str] = None, agent_name: Optional[str] = None) -> None:
        """Attach contextual metadata for downstream aggregation."""
        if tool_name is not None:
            self.tool_name = tool_name
        if agent_name is not None:
            self.agent_name = agent_name

    def mark_cache_hit(self, layer: str = "llm_cache") -> None:
        """Record that the response was served from a cache layer."""
        self.cache_hit = True
        self.cache_layer = layer or _get_prom_layer_default()

    def set_retry_count(self, retries: int) -> None:
        """Record how many retries were attempted for this request."""
        self.retry_count = max(int(retries), 0)

    def set_error_hash(self, message: Optional[str]) -> None:
        """Store a hashed representation of the last exception message."""
        if message:
            try:
                normalized = _normalize_error_message(message)
                self.error_hash = hashlib.sha1(normalized.encode("utf-8")).hexdigest()  # noqa: S324
            except Exception:  # noqa: BLE001
                self.error_hash = None


def record_turn_summary(summary: Dict[str, Any], ttl_seconds: int = _PER_REQUEST_TTL) -> None:
    """
    Persist a consolidated turn summary and update telemetry counters.

    Expected fields include:
        request_id, route_target, retrieval_path, num_docs_used,
        confidence, agent_name, rag_miss (bool), web_fallback (bool)
    """
    request_id = summary.get("request_id") or f"turn-{uuid.uuid4()}"
    turn_index = summary.get("turn_index", 0)
    dedupe_key = f"{_TURN_DEDUPE_PREFIX}:{request_id}:{turn_index}"
    if not _safe_cache_add(dedupe_key, True, timeout=ttl_seconds):
        logger.debug("Skipping duplicate turn summary for request_id=%s turn_index=%s", request_id, turn_index)
        return

    agent = summary.get("agent_name") or summary.get("route_target") or "unknown"
    route_target = summary.get("route_target") or "unknown"
    retrieval_path = summary.get("retrieval_path") or "unknown"
    language = summary.get("language") or "unknown"
    raw_market_id = summary.get("market_id")
    market_label = _hash_identifier(raw_market_id) if raw_market_id else None
    market_label = market_label or "default"

    payload = _clean_payload(
        {
            **summary,
            "request_id": request_id,
            "turn_index": turn_index,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    cache_key = f"llm_turn:{request_id}:{turn_index}"
    _safe_cache_set(cache_key, payload, timeout=ttl_seconds)

    if _PROMETHEUS_AVAILABLE:
        RETRIEVAL_PATH_TOTAL.labels(
            path=retrieval_path,
            agent=agent,
            route_target=route_target,
            language=language,
            market_id=market_label,
        ).inc()
        if summary.get("rag_miss"):
            FALLBACK_TOTAL.labels(
                kind="rag_miss",
                agent=agent,
                route_target=route_target,
                language=language,
                market_id=market_label,
            ).inc()
        if summary.get("web_fallback"):
            FALLBACK_TOTAL.labels(
                kind="web_fallback",
                agent=agent,
                route_target=route_target,
                language=language,
                market_id=market_label,
            ).inc()

    logger.info(
        "Turn summary recorded: request=%s path=%s docs=%s fallback=%s",
        request_id,
        retrieval_path,
        summary.get("num_docs_used"),
        {
            "rag_miss": summary.get("rag_miss"),
            "web_fallback": summary.get("web_fallback"),
        },
    )


def record_http_metrics(method: str, endpoint: str, status_code: int, duration: float, service: str = "django"):
    """Record HTTP request metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    HTTP_REQUESTS_TOTAL.labels(
        method=method,
        endpoint=endpoint,
        status_code=str(status_code),
        service=service
    ).inc()
    
    HTTP_REQUEST_DURATION.labels(
        method=method,
        endpoint=endpoint,
        status_code=str(status_code),
        service=service
    ).observe(duration)

def record_agent_execution(agent_name: str, operation: str, duration: float, success: bool = True):
    """Record agent execution metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    AGENT_EXECUTION_DURATION.labels(
        agent_name=agent_name,
        operation=operation,
        success=str(success)
    ).observe(duration)

def record_registry_operation(operation: str, status: str, duration: float, market_id: str = "CY-NC", language: str = "en"):
    """Record registry service operation metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    REGISTRY_OPERATIONS_TOTAL.labels(
        operation=operation,
        status=status,
        market_id=market_id,
        language=language
    ).inc()
    
    REGISTRY_OPERATION_DURATION.labels(
        operation=operation,
        status=status
    ).observe(duration)

def record_cache_operation(operation: str, cache_type: str, status: str):
    """Record cache operation metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    CACHE_OPERATIONS_TOTAL.labels(
        operation=operation,
        cache_type=cache_type,
        status=status
    ).inc()

def record_error(service: str, error_type: str, severity: str = "error"):
    """Record error metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    ERROR_RATE.labels(
        service=service,
        error_type=error_type,
        severity=severity
    ).inc()

def record_connection(connection_type: str, status: str):
    """Record connection metrics."""
    if not _PROMETHEUS_AVAILABLE:
        return
    
    ACTIVE_CONNECTIONS.labels(
        connection_type=connection_type,
        status=status
    ).inc()
