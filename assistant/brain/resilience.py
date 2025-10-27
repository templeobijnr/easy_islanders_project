"""
Resilience wrappers for outbound HTTP and LLM calls.

Provides simple retry and timing wrappers that integrate with our
existing Prometheus exposure when available.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Callable

import requests
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

logger = logging.getLogger(__name__)

try:  # Optional Prometheus metrics
    from prometheus_client import Summary

    _PROM_AVAILABLE = True
    _LLM_SUMMARY = Summary("llm_call_seconds", "Time spent in LLM calls")
except Exception:  # pragma: no cover - optional
    _PROM_AVAILABLE = False
    _LLM_SUMMARY = None

# Optional counters from our metrics module
try:
    from assistant.monitoring.metrics import RESILIENCE_RETRIES, RESILIENCE_FAILURES  # type: ignore
except Exception:  # pragma: no cover - optional
    RESILIENCE_RETRIES = None  # type: ignore
    RESILIENCE_FAILURES = None  # type: ignore

# Optional Django cache for circuit breaker
try:
    from django.core.cache import cache as _cache  # type: ignore
    from django.conf import settings as _settings  # type: ignore
except Exception:  # pragma: no cover - optional
    _cache = None
    _settings = None

# Optional Prometheus helpers
try:
    from assistant.monitoring.metrics import (
        observe_llm_latency,
        inc_circuit_event,
        inc_circuit_open,
    )
except Exception:  # pragma: no cover - optional
    def observe_llm_latency(*args, **kwargs):
        return None

    def inc_circuit_event(*args, **kwargs):
        return None

    def inc_circuit_open(*args, **kwargs):
        return None

try:  # Optional DB exception
    import psycopg2  # type: ignore
    _PG_OPER_ERR = psycopg2.OperationalError  # type: ignore
except Exception:  # pragma: no cover - optional
    _PG_OPER_ERR = Exception


RESILIENCE_POLICY = {
    "max_retries": 3,
    "retry_delay": 2,  # seconds
    "retryable_exceptions": (
        TimeoutError,
        ConnectionError,
        requests.exceptions.RequestException,
        _PG_OPER_ERR,
    ),
}


# -----------------------
# Minimal circuit breaker
# -----------------------
_CB_PREFIX = "cb"


def _cb_key(component: str, name: str) -> str:
    return f"{_CB_PREFIX}:{component}:{name}"


def _cache_set(key: str, value, timeout: int) -> None:
    try:
        if _cache is not None:
            _cache.set(key, value, timeout=timeout)
    except Exception:
        pass


def _cache_get(key: str, default=None):
    try:
        if _cache is not None:
            return _cache.get(key, default)
    except Exception:
        return default
    return default


def record_component_latency(component: str, seconds: float, window_seconds: int = 120) -> None:
    data = _cache_get(_cb_key(component, "durations"), [])
    try:
        data = list(data) if isinstance(data, (list, tuple)) else []
        data.append(float(seconds))
        data = data[-200:]
        _cache_set(_cb_key(component, "durations"), data, window_seconds)
    except Exception:
        pass


def record_component_error(component: str, window_seconds: int = 120) -> None:
    try:
        key = _cb_key(component, "errors")
        val = int(_cache_get(key, 0)) + 1
        _cache_set(key, val, window_seconds)
        inc_circuit_event(component, "error")
    except Exception:
        pass


def record_component_total(component: str, window_seconds: int = 120) -> None:
    try:
        key = _cb_key(component, "total")
        val = int(_cache_get(key, 0)) + 1
        _cache_set(key, val, window_seconds)
    except Exception:
        pass


def record_component_timeout(component: str, window_seconds: int = 60) -> None:
    try:
        key = _cb_key(component, "timeouts")
        val = int(_cache_get(key, 0)) + 1
        _cache_set(key, val, window_seconds)
        inc_circuit_event(component, "timeout")
    except Exception:
        pass


def _approx_p95(values: list[float]) -> float:
    if not values:
        return 0.0
    vs = sorted(values)
    idx = max(0, int(0.95 * len(vs)) - 1)
    return vs[idx]


def should_open_breaker(component: str, slo_seconds: float = 2.0) -> bool:
    try:
        total = int(_cache_get(_cb_key(component, "total"), 0))
        errs = int(_cache_get(_cb_key(component, "errors"), 0))
        to_cnt = int(_cache_get(_cb_key(component, "timeouts"), 0))
        durations = _cache_get(_cb_key(component, "durations"), []) or []
        err_rate = (errs / total) if total else 0.0
        p95 = _approx_p95([float(x) for x in durations]) if durations else 0.0
        if (err_rate >= 0.30 and p95 >= 2 * float(slo_seconds)) or to_cnt >= 5:
            return True
    except Exception:
        return False
    return False


def is_breaker_open(component: str) -> bool:
    try:
        return bool(_cache_get(_cb_key(component, "open"), False))
    except Exception:
        return False


def _open_breaker(component: str, cooldown_seconds: int = 60) -> None:
    try:
        _cache_set(_cb_key(component, "open"), True, cooldown_seconds)
        inc_circuit_open(component)
        inc_circuit_event(component, "open")
    except Exception:
        pass


@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_exception_type(requests.RequestException),
)
def safe_request(method: str, url: str, **kwargs) -> requests.Response:
    """HTTP request with sane timeouts and retries.

    Raises on non-2xx; caller should catch where appropriate.
    """
    if "timeout" not in kwargs:
        kwargs["timeout"] = 10
    resp = requests.request(method=method.upper(), url=url, **kwargs)
    resp.raise_for_status()
    return resp


def resilient_request(method: str, url: str, **kwargs) -> requests.Response:
    """Alias helper for safe_request (retrying HTTP call)."""
    return safe_request(method, url, **kwargs)


def resilient_api_call_decorator(
    name: str = "api_call",
    max_retries: int = 3,
    initial_retry_delay_seconds: float = 2.0,
    max_retry_delay_seconds: float = 8.0,
):
    """Decorator factory to add retry + metrics around any callable.

    Usage:
        @resilient_api_call_decorator("seller_outreach", max_retries=3)
        def task(...):
            ...
    """

    def _decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        def _wrapped(*args, **kwargs):
            attempt = 0
            delay = float(initial_retry_delay_seconds)
            while True:
                try:
                    return fn(*args, **kwargs)
                except Exception as e:  # noqa: BLE001
                    attempt += 1
                    if RESILIENCE_RETRIES is not None:
                        try:
                            RESILIENCE_RETRIES.inc()
                        except Exception:  # noqa: BLE001
                            pass
                    if attempt > max_retries:
                        if RESILIENCE_FAILURES is not None:
                            try:
                                RESILIENCE_FAILURES.inc()
                            except Exception:  # noqa: BLE001
                                pass
                        logger.warning("%s giving up after %s attempts: %s", name, attempt - 1, e)
                        raise
                    logger.warning("%s retry %s/%s after %s", name, attempt, max_retries, e)
                    time.sleep(delay)
                    delay = min(delay * 2, float(max_retry_delay_seconds))

        return _wrapped

    return _decorator

# Backwards compatible alias for legacy decorator usage
resilient_api_call = resilient_api_call_decorator  # type: ignore


def guarded_llm_call(callable_fn: Callable[[], Any]) -> Any:
    """Execute an LLM call, returning a safe fallback on error.

    Preserves return type when successful; on failure returns a dict
    with an error and fallback flag.
    """
    start = time.time()
    try:
        # Circuit breaker short-circuit (component: llm)
        record_component_total("llm")
        if is_breaker_open("llm") or should_open_breaker("llm"):
            _open_breaker("llm")
            logger.warning("LLM circuit breaker open; returning degraded fallback")
            return {"error": "breaker_open", "fallback": True, "mode": "degraded"}

        result = callable_fn()
        return result
    except Exception as e:  # noqa: BLE001
        record_component_error("llm")
        logger.exception("LLM call failed; returning fallback")
        return {"error": str(e), "fallback": True}
    finally:
        if _PROM_AVAILABLE and _LLM_SUMMARY is not None:
            try:
                _LLM_SUMMARY.observe(time.time() - start)
            except Exception:  # noqa: BLE001
                pass
        # Also emit histogram via Prometheus helper
        try:
            model = getattr(_settings, "OPENAI_MODEL", "unknown") if _settings else "unknown"
            observe_llm_latency("openai", model, time.time() - start)
        except Exception:
            pass


def safe_execute(fn: Callable[..., Any], *args, **kwargs) -> Any:
    """Generic retry wrapper using RESILIENCE_POLICY.

    Increments Prometheus counters for retries and failures when available.
    """
    max_retries = int(RESILIENCE_POLICY.get("max_retries", 3))
    delay = float(RESILIENCE_POLICY.get("retry_delay", 2))
    retryables = RESILIENCE_POLICY.get("retryable_exceptions") or (Exception,)

    attempt = 0
    while True:
        try:
            return fn(*args, **kwargs)
        except retryables as e:  # type: ignore
            attempt += 1
            if RESILIENCE_RETRIES is not None:
                try:
                    RESILIENCE_RETRIES.inc()
                except Exception:  # noqa: BLE001
                    pass
            if attempt > max_retries:
                if RESILIENCE_FAILURES is not None:
                    try:
                        RESILIENCE_FAILURES.inc()
                    except Exception:  # noqa: BLE001
                        pass
                logger.warning("safe_execute giving up after %s attempts: %s", attempt - 1, e)
                raise
            logger.warning("safe_execute retry %s/%s after %s", attempt, max_retries, e)
            time.sleep(delay)
