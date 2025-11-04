"""
Shared helpers for interacting with the Zep memory service.

This centralises client construction so both the write-path (Celery task)
and read-path (supervisor) use the same cached client with consistent
environment checks and metrics emission.
"""
from __future__ import annotations

import logging
import time
from threading import Lock
from typing import Any, Dict, Optional, Tuple

from django.conf import settings
import os

from .flags import (
    read_enabled,
    write_enabled,
    current_mode,
    effective_mode,
    get_forced_mode,
    force_write_only,
    clear_forced_mode,
    increment_consecutive_failures,
    reset_consecutive_failures,
    CONSECUTIVE_FAILURES_THRESHOLD,
)
from .zep_client import ZepClient, ZepCircuitOpenError, ZepRequestError
from assistant.monitoring.metrics import (
    inc_zep_read_failure,
    inc_zep_read_request,
    inc_zep_read_skipped,
    observe_zep_read_latency,
    inc_zep_write_failure,
    inc_zep_write_request,
    inc_zep_write_skipped,
    observe_zep_write_latency,
    observe_zep_retry_after,
    inc_memory_context_failure,
)
from assistant.monitoring.metrics import inc_zep_context_cache_hit
from django.core.cache import cache

logger = logging.getLogger(__name__)

_CLIENT: Optional[ZepClient] = None
_CLIENT_LOCK = Lock()


def get_client(*, require_read: bool = False, require_write: bool = False) -> Optional[ZepClient]:
    """
    Return a shared Zep client if the requested capability is enabled.

    Args:
        require_read: When True, return None unless FLAG_ZEP_READ is enabled.
        require_write: When True, return None unless FLAG_ZEP_WRITE is enabled.
    """
    if require_read and not read_enabled():
        return None
    if require_write and not write_enabled():
        return None
    if not (read_enabled() or write_enabled()):
        return None
    if not getattr(settings, "ZEP_ENABLED", False):
        return None

    base_url = getattr(settings, "ZEP_BASE_URL", None)
    # Be tolerant of stray whitespace in env configuration
    if isinstance(base_url, str):
        base_url = base_url.strip()
    if not base_url:
        logger.debug("Zep client skipped: ZEP_BASE_URL not configured")
        return None
    timeout_ms = int(getattr(settings, "ZEP_TIMEOUT_MS", 1500))
    api_key = getattr(settings, "ZEP_API_KEY", None)
    # Version negotiation: honour explicit env, otherwise auto-detect per request
    api_version_setting = getattr(settings, "ZEP_API_VERSION", None)
    api_version = str(api_version_setting).strip().lower() if api_version_setting else "auto"

    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT

    with _CLIENT_LOCK:
        if _CLIENT is None:
            logger.info("Initialising Zep client (timeout=%sms)", timeout_ms)
            proxy_map: Dict[str, str] = {}
            proxy_http = os.environ.get("ZEP_HTTP_PROXY") or os.environ.get("HTTP_PROXY")
            proxy_https = os.environ.get("ZEP_HTTPS_PROXY") or os.environ.get("HTTPS_PROXY")
            if proxy_http:
                proxy_map["http"] = proxy_http
            if proxy_https:
                proxy_map["https"] = proxy_https
            if proxy_map:
                logger.info("Routing Zep client through proxy", extra={"http": proxy_http, "https": proxy_https})
            _CLIENT = ZepClient(
                base_url=base_url,
                api_key=api_key,
                timeout_ms=timeout_ms,
                proxies=proxy_map or None,
                api_version=api_version,
            )
    return _CLIENT


def _zep_failure_reason(exc: Exception) -> str:
    if isinstance(exc, ZepRequestError):
        if exc.status_code is not None:
            return f"http_{exc.status_code}"
        return "http_error"
    return exc.__class__.__name__


def call_zep(op: str, func, *, observe_retry: bool = False) -> Tuple[bool, Optional[Any]]:
    """
    Execute a callable against Zep with standardised metrics and logging.

    Args:
        op: Operation label (ensure_user, ensure_thread, user_message, etc.)
        func: Callable to execute
        observe_retry: When True, inspect ZepRequestError.retry_after and emit metric
    """
    inc_zep_write_request(op)
    start = time.perf_counter()
    try:
        result = func()
    except ZepCircuitOpenError:
        inc_zep_write_skipped(op, "circuit_open")
        logger.warning("zep_call_skipped_circuit", extra={"op": op})
        return False, None
    except ZepRequestError as exc:
        inc_zep_write_failure(op, _zep_failure_reason(exc))
        if observe_retry and getattr(exc, "retry_after", None) is not None:
            observe_zep_retry_after(op, float(exc.retry_after))
        logger.warning(
            "zep_call_failure",
            extra={"op": op, "status_code": exc.status_code, "error": str(exc)},
        )
        return False, None
    except Exception as exc:  # noqa: BLE001
        inc_zep_write_failure(op, exc.__class__.__name__)
        logger.exception("zep_call_error", extra={"op": op})
        return False, None
    else:
        observe_zep_write_latency(op, time.perf_counter() - start)
        return True, result


def fetch_thread_context(
    thread_id: str,
    *,
    mode: str = "summary",
    timeout_ms: int = 250,
) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Fetch summarised memory context for a thread with timeout fallback and auto-downgrade guard.

    Args:
        thread_id: Thread identifier
        mode: Context retrieval strategy (summary, etc.)
        timeout_ms: Maximum time to wait for context (default 250ms)

    Returns a tuple of (context_dict | None, metadata) where metadata always
    includes the fields required for traces.memory.

    Auto-downgrade behavior (PR-J):
        - If mode is forced to write_only due to health issues, immediately return empty context
        - On 401/403: Force write_only mode, hold for 5 minutes
        - On 3 consecutive timeouts/5xx: Force write_only mode, hold for 5 minutes
        - After TTL expiry: Attempt probe with 150ms timeout; on success restore mode
    """
    meta: Dict[str, Any] = {
        "used": False,
        "mode": effective_mode().value,  # Use effective_mode instead of current_mode
        "source": "zep",
        "strategy": mode,
    }

    # PR-J: Check if mode is forced to write_only (health degradation)
    forced = get_forced_mode()
    if forced:
        meta.update({
            "used": False,
            "source": "write_only_forced",
            "reason": forced.get("reason"),
            "until": forced.get("until"),
        })
        logger.debug(
            "zep_read_blocked_forced_mode",
            extra={"thread_id": thread_id, "reason": forced.get("reason")}
        )
        return None, meta

    # Cache fast-path
    cache_key = f"zep:ctx:v1:{thread_id}:{mode}"
    cached = None
    try:
        cached = cache.get(cache_key)
    except Exception:
        cached = None

    if isinstance(cached, dict):
        # Negative cache sentinel suppresses dog-piling for a short period
        if cached.get("_neg"):
            meta.update({"used": False, "cached": True, "source": cached.get("source", "timeout"), "reason": cached.get("reason", "timeout")})
            return None, meta
        inc_zep_context_cache_hit()
        meta.update({"used": True, "cached": True})
        meta.setdefault("facts_count", len(cached.get("facts") or []))
        meta.setdefault("recent_count", len(cached.get("recent") or []))
        return cached, meta

    client = get_client(require_read=True)
    if not client:
        meta["reason"] = "disabled"
        return None, meta

    op = f"context_{mode}"
    inc_zep_read_request(op)
    start = time.perf_counter()
    try:
        # Note: The ZepClient already has timeout_ms configured globally,
        # but we track our own timeout to ensure strict read-path bounds
        context = client.get_user_context(thread_id, mode=mode)
    except ZepCircuitOpenError:
        inc_zep_read_skipped(op, "circuit_open")
        meta.update({"reason": "circuit_open"})
        logger.warning("zep_context_circuit_open", extra={"thread_id": thread_id, "mode": mode})
        return None, meta
    except ZepRequestError as exc:
        reason = _zep_failure_reason(exc)
        inc_zep_read_failure(op, reason)

        # PR-J: Auto-downgrade guard - Check for auth failures (401/403)
        if exc.status_code in (401, 403):
            force_write_only("auth")
            inc_memory_context_failure("auth")
            meta.update({"reason": "auth", "source": "auth", "status_code": exc.status_code})
            logger.error(
                "zep_auth_failure_auto_downgrade",
                extra={"thread_id": thread_id, "status_code": exc.status_code, "error": str(exc)}
            )
            return None, meta

        # PR-J: Check for timeout
        if "Timeout" in exc.__class__.__name__ or (exc.status_code and exc.status_code == 408):
            # Increment consecutive failures and check threshold
            fail_count = increment_consecutive_failures()
            if fail_count >= CONSECUTIVE_FAILURES_THRESHOLD:
                force_write_only("consecutive_failures")
                inc_memory_context_failure("consecutive_failures")
                logger.error(
                    "zep_consecutive_failures_auto_downgrade",
                    extra={"thread_id": thread_id, "fail_count": fail_count}
                )

            meta.update({"reason": "timeout", "source": "timeout"})
            # Set a short negative cache to avoid dog-piling
            try:
                cache.set(cache_key, {"_neg": True, "source": "timeout", "reason": "timeout"}, timeout=3)
            except Exception:
                pass
            logger.warning(
                "zep_context_timeout",
                extra={"thread_id": thread_id, "mode": mode, "timeout_ms": timeout_ms, "fail_count": fail_count},
            )
        # PR-J: Check for 5xx errors
        elif exc.status_code and 500 <= exc.status_code < 600:
            fail_count = increment_consecutive_failures()
            if fail_count >= CONSECUTIVE_FAILURES_THRESHOLD:
                force_write_only("consecutive_failures")
                inc_memory_context_failure("consecutive_failures")
                logger.error(
                    "zep_consecutive_failures_auto_downgrade",
                    extra={"thread_id": thread_id, "fail_count": fail_count, "status_code": exc.status_code}
                )

            meta.update({"reason": reason, "status_code": exc.status_code})
            logger.warning(
                "zep_context_5xx",
                extra={"thread_id": thread_id, "mode": mode, "status_code": exc.status_code, "fail_count": fail_count},
            )
        else:
            meta.update({"reason": reason, "status_code": exc.status_code})
            logger.warning(
                "zep_context_failure",
                extra={"thread_id": thread_id, "mode": mode, "status_code": exc.status_code, "error": str(exc)},
            )
        return None, meta
    except Exception as exc:  # noqa: BLE001
        reason = exc.__class__.__name__
        inc_zep_read_failure(op, reason)
        # Check if this is a timeout exception
        if "timeout" in reason.lower():
            meta.update({"reason": "timeout", "source": "timeout"})
            try:
                cache.set(cache_key, {"_neg": True, "source": "timeout", "reason": "timeout"}, timeout=3)
            except Exception:
                pass
            logger.warning(
                "zep_context_timeout",
                extra={"thread_id": thread_id, "mode": mode, "timeout_ms": timeout_ms},
            )
        else:
            meta.update({"reason": reason})
            logger.exception("zep_context_error", extra={"thread_id": thread_id, "mode": mode})
        return None, meta

    # PR-J: Success path - reset consecutive failures
    reset_consecutive_failures()

    latency = time.perf_counter() - start
    observe_zep_read_latency(op, latency)

    # Check if we exceeded our timeout budget even though the request succeeded
    latency_ms = latency * 1000
    if latency_ms > timeout_ms:
        # Mark as over budget for traces and emit a warning
        meta["reason"] = "timeout"
        logger.warning(
            "zep_context_slow",
            extra={"thread_id": thread_id, "mode": mode, "latency_ms": round(latency_ms, 2), "timeout_ms": timeout_ms},
        )

    meta.update(
        {
            "used": True,
            "took_ms": round(latency_ms, 2),
            "facts_count": len(context.get("facts") or []),
            "recent_count": len(context.get("recent") or []),
            "retrieved_at": time.time(),
            "cached": False,
        }
    )
    try:
        cache.set(cache_key, context, timeout=30)
    except Exception:
        pass
    return context, meta


def invalidate_context(thread_id: str) -> None:
    """Invalidate cached context entries for a thread.

    Clears all known mode variants to be safe.
    """
    try:
        keys = []
        versions = ("v1", "v2")
        retrieval_modes = ("summary", "basic", "full")
        # Defensive: include potential mis-keyed variants using memory modes
        memory_modes = ("off", "write_only", "read_only", "read_write")
        for ver in versions:
            for m in retrieval_modes:
                keys.append(f"zep:ctx:{ver}:{thread_id}:{m}")
            for mm in memory_modes:
                keys.append(f"zep:ctx:{ver}:{thread_id}:{mm}")
        cache.delete_many(keys)
    except Exception:
        # Best-effort only; avoid impacting the main flow
        pass
