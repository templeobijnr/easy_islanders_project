from typing import List, Dict, Any, Optional
import os
import yaml
from pathlib import Path


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


def load_router_thresholds(yaml_path: Optional[str] = None) -> Dict[str, Any]:
    """Load per-domain router thresholds from YAML configuration.

    Returns dict with per-domain τ values and other router settings.
    Falls back to defaults if file not found or invalid.
    """
    if not yaml_path:
        # Default path relative to project root
        yaml_path = Path(__file__).parent.parent.parent / "config" / "router_thresholds.yaml"

    try:
        with open(yaml_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        return config or {}
    except (FileNotFoundError, yaml.YAMLError) as e:
        # Log warning but don't crash - use defaults
        print(f"Warning: Could not load router thresholds from {yaml_path}: {e}")
        return {}


def get_domain_threshold(domain: str, default_tau: float = 0.72) -> float:
    """Get confidence threshold for a specific domain."""
    thresholds = load_router_thresholds()
    domain_config = thresholds.get('domains', {}).get(domain, {})
    return domain_config.get('tau', default_tau)


def validate_env() -> None:
    """Best-effort validation of required environment variables.

    We don't raise here to avoid crashing dev servers; we log in llm module
    when keys are missing and operate in a degraded mode.
    """
    # OPENAI_API_KEY is required for real runs; allow tests to skip.
    _ = os.getenv("OPENAI_API_KEY")
