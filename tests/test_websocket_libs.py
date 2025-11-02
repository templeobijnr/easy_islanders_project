"""
CI smoke test for WebSocket library presence.

This catches missing dependencies before deployment.
"""
import importlib


def test_websocket_python_package_present():
    """
    Verify websockets library is installed.

    Raises:
        ImportError: If websockets package is missing
    """
    # This will raise ImportError if package is not installed
    websockets = importlib.import_module("websockets")
    assert websockets is not None


def test_uvicorn_ws_support():
    """
    Verify uvicorn has WebSocket support available.

    Note: This doesn't guarantee uvicorn[standard] was installed,
    but checks that at least one WS implementation (websockets or wsproto) exists.
    """
    import importlib.util

    # Check for either websockets or wsproto
    has_websockets = importlib.util.find_spec("websockets") is not None
    has_wsproto = importlib.util.find_spec("wsproto") is not None

    assert has_websockets or has_wsproto, \
        "Uvicorn requires either 'websockets' or 'wsproto' for WebSocket support"
