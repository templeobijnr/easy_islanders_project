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
        result = callable_fn()
        return result
    except Exception as e:  # noqa: BLE001
        logger.exception("LLM call failed; returning fallback")
        return {"error": str(e), "fallback": True}
    finally:
        if _PROM_AVAILABLE and _LLM_SUMMARY is not None:
            try:
                _LLM_SUMMARY.observe(time.time() - start)
            except Exception:  # noqa: BLE001
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
