"""
Unit tests for PR-J auto-downgrade guard.

Tests the automatic downgrade-to-write_only behavior when Zep read health
degrades, including auth failures, consecutive failures, and probe recovery.
"""
import time
from unittest.mock import Mock, patch, MagicMock
import pytest

from assistant.memory.flags import (
    force_write_only,
    clear_forced_mode,
    get_forced_mode,
    effective_mode,
    increment_consecutive_failures,
    reset_consecutive_failures,
    MemoryMode,
    CONSECUTIVE_FAILURES_THRESHOLD,
)
from assistant.memory.service import fetch_thread_context
from assistant.memory.zep_client import ZepRequestError


@pytest.fixture
def clean_forced_mode():
    """Ensure no forced mode before each test."""
    clear_forced_mode()
    reset_consecutive_failures()
    yield
    clear_forced_mode()
    reset_consecutive_failures()


@pytest.fixture
def mock_zep_client():
    """Mock Zep client with configurable responses."""
    with patch("assistant.memory.service.get_client") as mock_get_client:
        mock_client = Mock()
        mock_get_client.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_metrics():
    """Mock all metrics functions to avoid Prometheus import issues."""
    with patch("assistant.memory.flags.inc_memory_downgrade") as mock_downgrade, \
         patch("assistant.memory.flags.set_memory_mode_gauge") as mock_gauge, \
         patch("assistant.memory.service.inc_zep_read_request") as mock_req, \
         patch("assistant.memory.service.inc_zep_read_failure") as mock_fail, \
         patch("assistant.memory.service.observe_zep_read_latency") as mock_latency, \
         patch("assistant.memory.service.inc_memory_context_failure") as mock_ctx_fail:
        yield {
            "downgrade": mock_downgrade,
            "gauge": mock_gauge,
            "request": mock_req,
            "failure": mock_fail,
            "latency": mock_latency,
            "context_failure": mock_ctx_fail,
        }


class TestAutoDowngradeGuard:
    """Test suite for auto-downgrade guard (PR-J)."""

    def test_no_forced_mode_by_default(self, clean_forced_mode):
        """Verify no forced mode exists on clean start."""
        assert get_forced_mode() is None
        assert effective_mode() == MemoryMode.WRITE_ONLY  # Assuming FLAG_ZEP_READ=false

    def test_force_write_only_sets_cache(self, clean_forced_mode, mock_metrics):
        """Test force_write_only() creates forced mode cache entry."""
        force_write_only(reason="test", ttl_seconds=60)

        forced = get_forced_mode()
        assert forced is not None
        assert forced["mode"] == "write_only"
        assert forced["reason"] == "test"
        assert forced["until"] > time.time()

        # Verify metrics emitted
        mock_metrics["downgrade"].assert_called_once_with("test")
        mock_metrics["gauge"].assert_called()

    def test_clear_forced_mode_removes_cache(self, clean_forced_mode, mock_metrics):
        """Test clear_forced_mode() removes forced mode."""
        force_write_only(reason="test", ttl_seconds=60)
        assert get_forced_mode() is not None

        clear_forced_mode()
        assert get_forced_mode() is None

        # Verify gauge updated
        assert mock_metrics["gauge"].call_count >= 2  # Set + clear

    def test_effective_mode_returns_forced_when_set(self, clean_forced_mode, mock_metrics):
        """Test effective_mode() returns WRITE_ONLY when forced."""
        force_write_only(reason="test", ttl_seconds=60)
        assert effective_mode() == MemoryMode.WRITE_ONLY

    def test_auth_failure_401_immediate_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test 401 auth failure triggers immediate downgrade."""
        # Mock Zep client to raise 401
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Unauthorized", status_code=401
        )

        # Attempt fetch
        context, meta = fetch_thread_context("test-thread")

        # Verify downgrade triggered
        assert get_forced_mode() is not None
        assert get_forced_mode()["reason"] == "auth"

        # Verify metrics
        mock_metrics["downgrade"].assert_called_once_with("auth")
        mock_metrics["context_failure"].assert_called_once_with("auth")

        # Verify meta
        assert meta["used"] is False
        assert meta["reason"] == "auth"
        assert meta["status_code"] == 401

    def test_auth_failure_403_immediate_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test 403 auth failure triggers immediate downgrade."""
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Forbidden", status_code=403
        )

        context, meta = fetch_thread_context("test-thread")

        assert get_forced_mode() is not None
        assert get_forced_mode()["reason"] == "auth"
        mock_metrics["downgrade"].assert_called_once_with("auth")

    def test_consecutive_timeouts_trigger_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test 3 consecutive timeouts trigger downgrade."""
        # Mock Zep client to raise timeout
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Timeout", status_code=408
        )

        # First two timeouts should NOT trigger downgrade
        fetch_thread_context("test-thread-1")
        assert get_forced_mode() is None

        fetch_thread_context("test-thread-2")
        assert get_forced_mode() is None

        # Third timeout should trigger downgrade
        fetch_thread_context("test-thread-3")
        assert get_forced_mode() is not None
        assert get_forced_mode()["reason"] == "consecutive_failures"

        # Verify metrics
        mock_metrics["downgrade"].assert_called_once_with("consecutive_failures")
        mock_metrics["context_failure"].assert_called_once_with("consecutive_failures")

    def test_consecutive_5xx_trigger_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test 3 consecutive 5xx errors trigger downgrade."""
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Server error", status_code=503
        )

        # First two 5xx should NOT trigger downgrade
        fetch_thread_context("test-thread-1")
        assert get_forced_mode() is None

        fetch_thread_context("test-thread-2")
        assert get_forced_mode() is None

        # Third 5xx should trigger downgrade
        fetch_thread_context("test-thread-3")
        assert get_forced_mode() is not None
        assert get_forced_mode()["reason"] == "consecutive_failures"

    def test_success_resets_consecutive_failures(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test successful read resets consecutive failure counter."""
        # Mock Zep client: 2 timeouts, then success, then 2 more timeouts
        mock_zep_client.get_user_context.side_effect = [
            ZepRequestError("Timeout", status_code=408),  # Failure 1
            ZepRequestError("Timeout", status_code=408),  # Failure 2
            {"context": "success", "facts": [], "recent": []},  # Success (reset)
            ZepRequestError("Timeout", status_code=408),  # Failure 1 (new count)
            ZepRequestError("Timeout", status_code=408),  # Failure 2
        ]

        # Two failures
        fetch_thread_context("test-1")
        fetch_thread_context("test-2")
        assert get_forced_mode() is None

        # Success resets counter
        context, meta = fetch_thread_context("test-3")
        assert meta["used"] is True
        assert get_forced_mode() is None

        # Two more failures should NOT trigger (counter was reset)
        fetch_thread_context("test-4")
        fetch_thread_context("test-5")
        assert get_forced_mode() is None  # Only 2 failures since reset

    def test_forced_mode_blocks_reads_immediately(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test that forced mode blocks reads without calling Zep."""
        # Force write_only
        force_write_only(reason="test", ttl_seconds=60)

        # Mock should NOT be called (read blocked at entry)
        mock_zep_client.get_user_context.return_value = {"should": "not_be_called"}

        context, meta = fetch_thread_context("test-thread")

        # Verify read was blocked
        assert context is None
        assert meta["used"] is False
        assert meta["source"] == "write_only_forced"
        assert meta["reason"] == "test"

        # Verify Zep client was NOT called
        mock_zep_client.get_user_context.assert_not_called()

    def test_forced_mode_ttl_expiry(self, clean_forced_mode, mock_metrics):
        """Test forced mode auto-expires after TTL."""
        # Force with very short TTL (1 second)
        force_write_only(reason="test", ttl_seconds=1)
        assert get_forced_mode() is not None

        # Wait for TTL expiry
        time.sleep(1.5)

        # Forced mode should be gone (defensive check in get_forced_mode clears it)
        assert get_forced_mode() is None

    def test_increment_consecutive_failures_counter(self, clean_forced_mode):
        """Test consecutive failure counter increments correctly."""
        count1 = increment_consecutive_failures()
        assert count1 == 1

        count2 = increment_consecutive_failures()
        assert count2 == 2

        count3 = increment_consecutive_failures()
        assert count3 == 3

    def test_reset_consecutive_failures_clears_counter(self, clean_forced_mode):
        """Test reset clears consecutive failure counter."""
        increment_consecutive_failures()
        increment_consecutive_failures()

        reset_consecutive_failures()

        # Next increment should start from 1
        count = increment_consecutive_failures()
        assert count == 1

    def test_mixed_failure_types_count_together(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test that timeouts and 5xx errors count together toward threshold."""
        mock_zep_client.get_user_context.side_effect = [
            ZepRequestError("Timeout", status_code=408),  # Failure 1
            ZepRequestError("Server error", status_code=500),  # Failure 2
            ZepRequestError("Gateway timeout", status_code=504),  # Failure 3
        ]

        # First two mixed failures
        fetch_thread_context("test-1")
        fetch_thread_context("test-2")
        assert get_forced_mode() is None

        # Third failure triggers downgrade
        fetch_thread_context("test-3")
        assert get_forced_mode() is not None
        assert get_forced_mode()["reason"] == "consecutive_failures"

    def test_non_auth_non_5xx_failures_dont_trigger(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test that 4xx errors (other than 401/403) don't trigger downgrade."""
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Bad request", status_code=400
        )

        # Even 5 consecutive 400 errors should NOT trigger downgrade
        for i in range(5):
            fetch_thread_context(f"test-{i}")

        assert get_forced_mode() is None

    def test_cache_behavior_during_forced_mode(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test that cache is bypassed when forced mode is active."""
        with patch("assistant.memory.service.cache") as mock_cache:
            # Setup: force write_only
            force_write_only(reason="test", ttl_seconds=60)

            # Attempt fetch
            fetch_thread_context("test-thread")

            # Cache should NOT be checked (early exit in fetch_thread_context)
            # Only get_forced_mode() checks cache
            assert mock_cache.get.call_count >= 1  # get_forced_mode check
            assert mock_cache.set.call_count == 1  # force_write_only set

    def test_metrics_emission_on_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """Test that all expected metrics are emitted on downgrade."""
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Unauthorized", status_code=401
        )

        fetch_thread_context("test-thread")

        # Verify all metrics called
        mock_metrics["downgrade"].assert_called_once_with("auth")
        mock_metrics["gauge"].assert_called()
        mock_metrics["context_failure"].assert_called_once_with("auth")
        mock_metrics["failure"].assert_called()  # inc_zep_read_failure

    def test_structured_logging_on_downgrade(
        self, clean_forced_mode, mock_zep_client, mock_metrics, caplog
    ):
        """Test that structured logs are emitted on downgrade."""
        import logging
        caplog.set_level(logging.WARNING)

        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Forbidden", status_code=403
        )

        fetch_thread_context("test-thread")

        # Check for expected log event
        assert any("memory_mode_forced" in record.message for record in caplog.records)


@pytest.mark.parametrize(
    "status_code,reason",
    [
        (401, "auth"),
        (403, "auth"),
        (408, "consecutive_failures"),  # After 3rd attempt
        (500, "consecutive_failures"),  # After 3rd attempt
        (502, "consecutive_failures"),
        (503, "consecutive_failures"),
        (504, "consecutive_failures"),
    ],
)
def test_downgrade_reasons_parametrized(
    status_code, reason, clean_forced_mode, mock_zep_client, mock_metrics
):
    """Parametrized test for different downgrade reasons."""
    # For auth (401/403), downgrade is immediate
    if status_code in (401, 403):
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Error", status_code=status_code
        )
        fetch_thread_context("test-thread")
        assert get_forced_mode()["reason"] == reason

    # For others, need 3 consecutive failures
    else:
        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Error", status_code=status_code
        )
        for i in range(CONSECUTIVE_FAILURES_THRESHOLD):
            fetch_thread_context(f"test-{i}")

        assert get_forced_mode()["reason"] == reason


# ==============================================================================
# Integration-style tests (require Redis running)
# ==============================================================================


@pytest.mark.integration
class TestAutoDowngradeIntegration:
    """Integration tests requiring live Redis."""

    def test_probe_recovery_success(self, clean_forced_mode, mock_zep_client, mock_metrics):
        """
        Test probe recovery after TTL expiry (success path).

        Note: This is a simplified test. Full probe logic would require
        checking if TTL expired and probing on next request.
        """
        # Force with short TTL
        force_write_only(reason="test", ttl_seconds=1)
        assert get_forced_mode() is not None

        # Wait for TTL expiry
        time.sleep(1.5)

        # Get forced mode should return None (TTL expired)
        assert get_forced_mode() is None

        # Next successful read should work normally
        mock_zep_client.get_user_context.return_value = {
            "context": "success",
            "facts": [],
            "recent": [],
        }

        context, meta = fetch_thread_context("test-thread")
        assert meta["used"] is True

    def test_concurrent_downgrade_attempts(
        self, clean_forced_mode, mock_zep_client, mock_metrics
    ):
        """
        Test that multiple workers can safely trigger downgrade concurrently.

        This tests Redis cache atomicity (set operation is atomic).
        """
        import threading

        mock_zep_client.get_user_context.side_effect = ZepRequestError(
            "Auth error", status_code=401
        )

        def trigger_downgrade():
            fetch_thread_context("test-thread")

        # Simulate 5 concurrent workers hitting auth failure
        threads = [threading.Thread(target=trigger_downgrade) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Should only downgrade once (not 5 times)
        assert get_forced_mode() is not None
        # Note: metric may increment multiple times (acceptable, shows concurrent attempts)
