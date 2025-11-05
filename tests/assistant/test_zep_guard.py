"""
Unit tests for Zep empty-write guard.

Tests that the _ZepWriteContext.add_message() method properly guards
against empty or invalid message payloads to prevent Zep embedder spam.
"""
import pytest
from unittest.mock import Mock, MagicMock, patch


@pytest.fixture
def mock_zep_client():
    """Mock ZepClient for testing."""
    client = Mock()
    client.add_messages = Mock(return_value=True)
    return client


@pytest.fixture
def zep_context(mock_zep_client):
    """Create _ZepWriteContext instance for testing."""
    from assistant.tasks import _ZepWriteContext
    return _ZepWriteContext(mock_zep_client, "test-thread-123")


def test_zep_guard_empty_payload(zep_context, mock_zep_client):
    """Test that empty payload is rejected."""
    result = zep_context.add_message("test_op", {})

    # Should return False (skipped)
    assert result is False

    # Should not call client
    mock_zep_client.add_messages.assert_not_called()

    # Should not mark as used
    assert zep_context.used is False


def test_zep_guard_missing_content(zep_context, mock_zep_client):
    """Test that payload without content is rejected."""
    payload = {
        "role": "user",
        "message_id": "msg-123",
        "metadata": {}
    }

    result = zep_context.add_message("test_op", payload)

    assert result is False
    mock_zep_client.add_messages.assert_not_called()


def test_zep_guard_empty_content(zep_context, mock_zep_client):
    """Test that payload with empty content is rejected."""
    payload = {
        "role": "user",
        "content": "",
        "message_id": "msg-123"
    }

    result = zep_context.add_message("test_op", payload)

    assert result is False
    mock_zep_client.add_messages.assert_not_called()


def test_zep_guard_whitespace_only_content(zep_context, mock_zep_client):
    """Test that payload with whitespace-only content is rejected."""
    payload = {
        "role": "user",
        "content": "   \t\n  ",
        "message_id": "msg-123"
    }

    result = zep_context.add_message("test_op", payload)

    assert result is False
    mock_zep_client.add_messages.assert_not_called()


def test_zep_guard_short_content(zep_context, mock_zep_client):
    """Test that payload with content < 2 chars is rejected."""
    payload = {
        "role": "user",
        "content": "a",
        "message_id": "msg-123"
    }

    result = zep_context.add_message("test_op", payload)

    assert result is False
    mock_zep_client.add_messages.assert_not_called()


def test_zep_guard_valid_content_proceeds(zep_context, mock_zep_client):
    """Test that valid payload proceeds to Zep."""
    payload = {
        "role": "user",
        "content": "I need an apartment in Kyrenia",
        "message_id": "msg-123",
        "metadata": {"source": "django"}
    }

    # Mock successful call_zep
    with patch("assistant.tasks.call_zep") as mock_call_zep:
        mock_call_zep.return_value = (True, None)

        result = zep_context.add_message("user_message", payload)

        # Should return True (success)
        assert result is True

        # Should call call_zep
        mock_call_zep.assert_called_once()

        # Should mark as used
        assert zep_context.used is True


def test_zep_guard_metrics_tracking():
    """Test that skipped writes are tracked in metrics."""
    from assistant.tasks import _ZepWriteContext

    mock_client = Mock()
    context = _ZepWriteContext(mock_client, "test-thread-123")

    empty_payload = {"role": "user", "content": "", "message_id": "msg-1"}

    with patch("assistant.tasks.inc_zep_write_skipped") as mock_metric:
        result = context.add_message("test_op", empty_payload)

        # Should skip and track metric
        assert result is False
        mock_metric.assert_called_once_with("empty_content")


def test_zep_guard_allows_minimal_valid_content(zep_context, mock_zep_client):
    """Test that 2-character content is allowed."""
    payload = {
        "role": "user",
        "content": "Hi",
        "message_id": "msg-123"
    }

    with patch("assistant.tasks.call_zep") as mock_call_zep:
        mock_call_zep.return_value = (True, None)

        result = zep_context.add_message("user_message", payload)

        assert result is True
        mock_call_zep.assert_called_once()
