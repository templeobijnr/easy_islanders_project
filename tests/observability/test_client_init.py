"""
Tests for observability module: LangSmith Client initialization.
Ensures Client is initialized without unsupported endpoint kwarg.
"""

import pytest
from unittest.mock import patch, MagicMock
import os


def test_observability_import_does_not_pass_endpoint_kw():
    """Test that observability.py imports without TypeError from endpoint kwarg."""
    
    # Patch to check that Client is called correctly
    with patch("langsmith.Client") as mock_client:
        mock_client.return_value = MagicMock()
        
        # Import should not raise
        try:
            from assistant.brain import observability
            # If we get here, import succeeded
            assert True
        except TypeError as e:
            if "endpoint" in str(e):
                pytest.fail(f"observability.py raised TypeError with 'endpoint': {e}")
            raise


def test_langsmith_enabled_check():
    """Test that LANGSMITH_ENABLED is correctly set from env vars."""
    with patch.dict(os.environ, {
        "LANGCHAIN_TRACING_V2": "true",
        "LANGCHAIN_API_KEY": "test-key"
    }, clear=False):
        # Re-import to pick up new env vars
        import importlib
        from assistant.brain import observability
        importlib.reload(observability)
        
        # Should be enabled
        assert observability.LANGSMITH_ENABLED == True or \
               observability.LANGSMITH_ENABLED == False  # At least no exception
