"""
Test WebSocket URL routing patterns.

Ensures the regex accepts both forms:
  - /ws/chat/{thread_id}/  (with leading slash - browser pattern)
  - ws/chat/{thread_id}/   (without leading slash)
"""
import re
from assistant.routing import websocket_urlpatterns


def test_ws_route_matches_both_forms():
    """
    Verify WebSocket URL pattern matches both with and without leading slash.

    This prevents regression of the 404 bug where browser sends "/ws/chat/..."
    but regex expected "ws/chat/..." (no leading slash).
    """
    # Get the compiled regex pattern from the first WebSocket route
    pat = websocket_urlpatterns[0].pattern.regex  # re.Pattern

    # Test with leading slash (browser/client pattern)
    match_with_slash = pat.match("/ws/chat/cd761e32-6412-4919-a8dc-5ae8cd714824/")
    assert match_with_slash is not None, \
        "WebSocket route should match URL with leading slash (/ws/chat/...)"

    # Test without leading slash
    match_without_slash = pat.match("ws/chat/cd761e32-6412-4919-a8dc-5ae8cd714824/")
    assert match_without_slash is not None, \
        "WebSocket route should match URL without leading slash (ws/chat/...)"

    # Verify thread_id captured correctly in both cases
    assert match_with_slash.group("thread_id") == "cd761e32-6412-4919-a8dc-5ae8cd714824"
    assert match_without_slash.group("thread_id") == "cd761e32-6412-4919-a8dc-5ae8cd714824"


def test_ws_route_rejects_invalid_thread_ids():
    """Verify the pattern rejects malformed thread_id values."""
    pat = websocket_urlpatterns[0].pattern.regex

    # Invalid thread_ids (non-hex characters, empty paths)
    assert pat.match("/ws/chat/not-a-uuid/") is None  # Contains 'u', 'i' (not in [0-9a-f-])
    assert pat.match("/ws/chat/INVALID/") is None  # Contains uppercase letters
    assert pat.match("/ws/chat//") is None  # Empty thread_id
    assert pat.match("/ws/chat") is None  # Missing thread_id entirely

    # Note: Pattern [0-9a-f-]+ is permissive (accepts hex strings like "123", "abc-def")
    # This is intentional for performance - validation happens in consumer auth
