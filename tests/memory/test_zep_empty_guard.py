"""
Tests for Zep empty message guard (PR: Rehydration + Zep Guard Fix)

Verifies that empty or too-short messages are never sent to Zep,
preventing "no messages" embedder errors.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from assistant.memory.zep_client import ZepClient


class TestZepEmptyMessageGuard:
    """Test suite for Zep empty message guard."""

    def test_empty_array_skipped(self):
        """Empty messages array should be skipped with metric emission."""
        client = ZepClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout_ms=1000
        )

        # Should return empty dict without making HTTP request
        result = client.add_messages("thread-123", [])

        assert result == {}

    def test_empty_content_filtered(self):
        """Messages with empty content should be filtered out."""
        client = ZepClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout_ms=1000
        )

        messages = [
            {"role": "user", "content": ""},
            {"role": "user", "content": "   "},  # Whitespace only
            {"role": "user", "content": None},
        ]

        # Should return empty dict as all messages are invalid
        result = client.add_messages("thread-123", messages)

        assert result == {}

    def test_short_content_filtered(self):
        """Messages with content < 2 chars should be filtered out."""
        client = ZepClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout_ms=1000
        )

        messages = [
            {"role": "user", "content": "a"},  # Single char
            {"role": "user", "content": " "},  # Single space
        ]

        # Should return empty dict as all messages are too short
        result = client.add_messages("thread-123", messages)

        assert result == {}

    @patch('assistant.memory.zep_client.ZepClient._request_json')
    def test_valid_messages_pass_through(self, mock_request):
        """Valid messages should pass through to Zep."""
        mock_request.return_value = {}

        client = ZepClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout_ms=1000
        )

        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ]

        result = client.add_messages("thread-123", messages)

        # Should make HTTP request with valid messages
        mock_request.assert_called_once()
        call_args = mock_request.call_args

        # Verify payload contains valid messages
        assert call_args[1]['json_payload']['messages'] == messages

    @patch('assistant.memory.zep_client.ZepClient._request_json')
    def test_mixed_valid_invalid_messages(self, mock_request):
        """Mixed valid/invalid messages should filter out invalid ones."""
        mock_request.return_value = {}

        client = ZepClient(
            base_url="http://localhost:8000",
            api_key="test-key",
            timeout_ms=1000
        )

        messages = [
            {"role": "user", "content": ""},  # Invalid - empty
            {"role": "user", "content": "Valid message"},  # Valid
            {"role": "user", "content": "x"},  # Invalid - too short
            {"role": "assistant", "content": "Another valid message"},  # Valid
        ]

        result = client.add_messages("thread-123", messages)

        # Should make HTTP request with only valid messages
        mock_request.assert_called_once()
        call_args = mock_request.call_args

        # Verify only valid messages are in payload
        sent_messages = call_args[1]['json_payload']['messages']
        assert len(sent_messages) == 2
        assert sent_messages[0]['content'] == "Valid message"
        assert sent_messages[1]['content'] == "Another valid message"


class TestTasksEmptyGuard:
    """Test suite for tasks.py empty message guards."""

    @patch('assistant.tasks._ZepWriteContext')
    def test_mirror_user_message_empty_skipped(self, mock_zep_ctx):
        """Empty user messages should be skipped in mirror path."""
        from assistant.tasks import _mirror_user_message
        from assistant.models import Message, ConversationThread

        # Create mock objects
        zep_context = Mock()
        message = Mock(spec=Message)
        message.id = 1
        message.client_msg_id = "msg-123"

        thread = Mock(spec=ConversationThread)
        thread.thread_id = "thread-123"

        # Test empty message
        ok, elapsed, redactions = _mirror_user_message(
            zep_context,
            message,
            "",  # Empty text
            thread
        )

        assert ok is False
        assert elapsed == 0.0
        assert redactions == {}
        zep_context.add_message.assert_not_called()

    @patch('assistant.tasks._ZepWriteContext')
    def test_mirror_assistant_message_short_skipped(self, mock_zep_ctx):
        """Too-short assistant messages should be skipped in mirror path."""
        from assistant.tasks import _mirror_assistant_message
        from assistant.models import Message, ConversationThread

        # Create mock objects
        zep_context = Mock()
        message = Mock(spec=Message)
        message.id = 1
        message.client_msg_id = "msg-123"

        thread = Mock(spec=ConversationThread)
        thread.thread_id = "thread-123"

        # Test single-char message
        ok, elapsed, redactions = _mirror_assistant_message(
            zep_context,
            message,
            "x",  # Too short
            thread,
            {}
        )

        assert ok is False
        assert elapsed == 0.0
        assert redactions == {}
        zep_context.add_message.assert_not_called()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
