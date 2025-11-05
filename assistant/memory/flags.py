"""
Environment-driven feature flags for the memory integration.

The rollout plan specifies two independent toggles so we can mirror
messages to Zep (write) before enabling the read path that affects runtime
behaviour. These helpers intentionally keep the public surface tiny so
callers can use expressive helpers instead of re-reading environment vars.

PR-J: Auto-downgrade guard
--------------------------
When Zep read health degrades (auth failures, consecutive timeouts/5xx),
automatically flip to write_only mode for a minimum hold period (default 5m).
Auto-recovers via probe once health is restored.
"""
from __future__ import annotations

import os
import time
import logging
from enum import Enum
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


_READ_ENABLED = _env_bool("FLAG_ZEP_READ", default=False)
_WRITE_ENABLED = _env_bool("FLAG_ZEP_WRITE", default=False)

# Auto-downgrade configuration
FORCED_MODE_KEY = "mem:mode:forced:v1"
DEFAULT_HOLD_SECONDS = 300  # 5 minutes
CONSECUTIVE_FAILURES_KEY = "mem:read:consec_failures"
CONSECUTIVE_FAILURES_THRESHOLD = 3
PROBE_LOCK_KEY = "mem:mode:probe_lock:v1"
PROBE_LOCK_TTL = 10  # seconds - single worker probes, others wait


class MemoryMode(str, Enum):
    """Represents the effective memory capability configured for the runtime."""

    OFF = "off"
    READ_ONLY = "read_only"
    WRITE_ONLY = "write_only"
    READ_WRITE = "read_write"


def read_enabled() -> bool:
    """Return True when memory reads should be attempted."""
    return _READ_ENABLED


def write_enabled() -> bool:
    """Return True when memory writes should be attempted."""
    return _WRITE_ENABLED


def base_mode() -> MemoryMode:
    """
    Return the base capability mode from environment flags (ignoring forced overrides).

    This is the mode configured via FLAG_ZEP_READ and FLAG_ZEP_WRITE.
    """
    read = read_enabled()
    write = write_enabled()
    if read and write:
        return MemoryMode.READ_WRITE
    if read:
        return MemoryMode.READ_ONLY
    if write:
        return MemoryMode.WRITE_ONLY
    return MemoryMode.OFF


def current_mode() -> MemoryMode:
    """
    Return the aggregate capability mode (off, read, write, read-write).

    Deprecated: Use effective_mode() for auto-downgrade-aware mode detection.
    This function is kept for backward compatibility.
    """
    return base_mode()


def get_forced_mode() -> Optional[Dict[str, Any]]:
    """
    Check if mode is currently forced to write_only due to health degradation.

    Returns:
        Dict with {mode, reason, until} if forced, None otherwise.
    """
    try:
        from django.core.cache import cache
        forced = cache.get(FORCED_MODE_KEY)
        if forced and isinstance(forced, dict):
            # Validate TTL hasn't expired (defensive check)
            until = forced.get("until", 0)
            if until > time.time():
                return forced
            # Expired, clear it
            cache.delete(FORCED_MODE_KEY)
        return None
    except Exception as exc:
        logger.warning("Failed to check forced mode: %s", exc)
        return None


def force_write_only(reason: str, ttl_seconds: int = DEFAULT_HOLD_SECONDS) -> None:
    """
    Force memory mode to write_only for a hold period (default 5 minutes).

    Args:
        reason: Downgrade reason (auth, consecutive_failures, latency, probe_failed)
        ttl_seconds: Hold duration in seconds

    This is called automatically when Zep read health degrades:
    - 401/403 errors (auth)
    - 3 consecutive timeouts/5xx (consecutive_failures)
    - Probe failure after recovery attempt (probe_failed)
    """
    until = time.time() + ttl_seconds
    forced_state = {
        "mode": "write_only",
        "reason": reason,
        "until": until,
        "forced_at": time.time(),
    }

    try:
        from django.core.cache import cache
        cache.set(FORCED_MODE_KEY, forced_state, timeout=ttl_seconds)

        # Emit metrics and gauge
        from assistant.monitoring.metrics import set_memory_mode_gauge, inc_memory_downgrade
        set_memory_mode_gauge(MemoryMode.WRITE_ONLY.value)
        inc_memory_downgrade(reason)

        logger.warning(
            "memory_mode_forced",
            extra={
                "prev_mode": base_mode().value,
                "next_mode": "write_only",
                "reason": reason,
                "hold_seconds": ttl_seconds,
                "until": until,
            }
        )
    except Exception as exc:
        logger.error("Failed to force write_only mode: %s", exc)


def clear_forced_mode() -> None:
    """
    Clear forced write_only mode and restore base mode from env flags.

    Called automatically after successful probe following TTL expiry.
    """
    try:
        from django.core.cache import cache
        cache.delete(FORCED_MODE_KEY)

        # Restore base mode gauge
        from assistant.monitoring.metrics import set_memory_mode_gauge
        restored = base_mode()
        set_memory_mode_gauge(restored.value)

        logger.info(
            "memory_mode_restored",
            extra={"mode": restored.value, "reason": "probe_success"}
        )
    except Exception as exc:
        logger.error("Failed to clear forced mode: %s", exc)


def effective_mode() -> MemoryMode:
    """
    Return the effective memory mode, accounting for auto-downgrade overrides.

    If auto-downgrade has forced write_only (due to health issues),
    returns WRITE_ONLY regardless of base flags.

    Use this instead of current_mode() for runtime decisions.
    """
    forced = get_forced_mode()
    if forced:
        return MemoryMode.WRITE_ONLY
    return base_mode()


def increment_consecutive_failures() -> int:
    """
    Increment consecutive read failure counter (auto-resets after 60s of no traffic).

    Returns:
        Current failure count after increment.
    """
    try:
        from django.core.cache import cache
        # Try to increment; if key doesn't exist, initialize to 1
        count = cache.get(CONSECUTIVE_FAILURES_KEY, 0) + 1
        cache.set(CONSECUTIVE_FAILURES_KEY, count, timeout=60)  # Auto-reset after 60s
        return count
    except Exception as exc:
        logger.warning("Failed to increment consecutive failures: %s", exc)
        return 0


def reset_consecutive_failures() -> None:
    """Reset consecutive failure counter after successful read."""
    try:
        from django.core.cache import cache
        cache.delete(CONSECUTIVE_FAILURES_KEY)
    except Exception:
        pass


def acquire_probe_lock() -> bool:
    """
    Acquire single-flight probe lock (prevents thundering herd on recovery).

    Returns:
        True if lock acquired (this worker should probe), False otherwise.

    Only one worker across the cluster should probe after TTL expiry.
    Others will skip probe and wait for the winner to restore mode.
    """
    try:
        from django.core.cache import cache
        # SETNX pattern: returns True only if key didn't exist
        acquired = cache.add(PROBE_LOCK_KEY, "probing", timeout=PROBE_LOCK_TTL)
        if acquired:
            logger.info("probe_lock_acquired", extra={"ttl_seconds": PROBE_LOCK_TTL})
        return acquired
    except Exception as exc:
        logger.warning("Failed to acquire probe lock: %s", exc)
        # On error, allow probe (fail-open for recovery)
        return True


def release_probe_lock() -> None:
    """Release probe lock after probe completes (success or failure)."""
    try:
        from django.core.cache import cache
        cache.delete(PROBE_LOCK_KEY)
        logger.debug("probe_lock_released")
    except Exception as exc:
        logger.warning("Failed to release probe lock: %s", exc)


__all__ = [
    "MemoryMode",
    "current_mode",
    "base_mode",
    "effective_mode",
    "read_enabled",
    "write_enabled",
    "get_forced_mode",
    "force_write_only",
    "clear_forced_mode",
    "increment_consecutive_failures",
    "reset_consecutive_failures",
    "acquire_probe_lock",
    "release_probe_lock",
    "CONSECUTIVE_FAILURES_THRESHOLD",
    "PROBE_LOCK_KEY",
    "PROBE_LOCK_TTL",
]
