from typing import List
import os


# Feature flag: route ai_assistant through LangChain agent when true
ENABLE_LANGCHAIN: bool = os.getenv("ENABLE_LANGCHAIN", "false").lower() in {"1", "true", "yes"}

# Feature flag: enable LangGraph stateful agent orchestration
ENABLE_LANGGRAPH: bool = os.getenv("ENABLE_LANGGRAPH", "true").lower() in {"1", "true", "yes"}

# Feature flags for optional graph nodes
ENABLE_KNOWLEDGE_NODE: bool = os.getenv("ENABLE_KNOWLEDGE_NODE", "true").lower() in {"1", "true", "yes"}
ENABLE_SERVICE_NODE: bool = os.getenv("ENABLE_SERVICE_NODE", "true").lower() in {"1", "true", "yes"}


# Supported languages (ISO codes)
SUPPORTED_LANGUAGES: List[str] = ["en", "tr", "ru", "pl"]


# OpenAI model names (can be overridden by env)
OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")


# Timeouts / retries
DEFAULT_REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("LC_DEFAULT_TIMEOUT", "60"))
DEFAULT_MAX_RETRIES: int = int(os.getenv("LC_DEFAULT_MAX_RETRIES", "2"))


def validate_env() -> None:
    """Best-effort validation of required environment variables.

    We don't raise here to avoid crashing dev servers; we log in llm module
    when keys are missing and operate in a degraded mode.
    """
    # OPENAI_API_KEY is required for real runs; allow tests to skip.
    _ = os.getenv("OPENAI_API_KEY")
