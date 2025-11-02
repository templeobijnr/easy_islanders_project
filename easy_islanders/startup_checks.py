"""
Startup validation checks for critical dependencies.
These checks run at ASGI application initialization to fail fast.
"""


def check_ws_support():
    """
    Verify WebSocket support is available.

    Raises:
        RuntimeError: If websockets library is not installed
    """
    try:
        import websockets  # noqa: F401
    except ImportError as e:
        raise RuntimeError(
            "WebSocket support missing. "
            "Install with: pip install 'uvicorn[standard]' websockets"
        ) from e
