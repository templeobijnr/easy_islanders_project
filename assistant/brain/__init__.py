"""LangChain foundation for the Easy Islanders AI agent.

This package provides a clean, modular foundation to power an
understand-first, multilingual agent using LangChain/LangGraph.

Notes
- These modules are intentionally lightweight and import LangChain lazily
  so the Django app can start even if dependencies are not installed yet.
"""

from .config import ENABLE_LANGCHAIN  # re-export for convenience

__all__ = [
    "ENABLE_LANGCHAIN",
]


