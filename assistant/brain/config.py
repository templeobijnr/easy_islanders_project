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

# Sprint 6 feature flags
PREFS_EXTRACT_ENABLED: bool = os.getenv("PREFS_EXTRACT_ENABLED", "true").lower() in {"1", "true", "yes"}
PREFS_APPLY_ENABLED: bool = os.getenv("PREFS_APPLY_ENABLED", "false").lower() in {"1", "true", "yes"}
PREFS_UI_ENABLED: bool = os.getenv("PREFS_UI_ENABLED", "false").lower() in {"1", "true", "yes"}


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


def load_step6_config(yaml_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load STEP 6 context lifecycle configuration from YAML.

    Args:
        yaml_path: Optional path to config file (defaults to config/step6_context_lifecycle.yaml)

    Returns:
        Dict with step6 config, or defaults if file not found

    Example:
        cfg = load_step6_config()
        cadence = cfg.get("summary", {}).get("cadence", 10)
    """
    if not yaml_path:
        yaml_path = Path(__file__).parent.parent.parent / "config" / "step6_context_lifecycle.yaml"

    try:
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            return data.get("step6", {}) if data else _get_step6_defaults()
    except (FileNotFoundError, yaml.YAMLError) as e:
        print(f"Warning: Could not load STEP6 config from {yaml_path}: {e}")
        return _get_step6_defaults()


def _get_step6_defaults() -> Dict[str, Any]:
    """Get default STEP 6 config values."""
    return {
        "enabled": True,
        "summary": {
            "cadence": 10,
            "max_chars": 500,
            "max_sentences": 3,
            "strip_pii": True,
        },
        "fusion": {
            "history_tail_turns": 5,
            "max_fused_chars": 2000,
        },
        "retrieval": {
            "max_snippets": 5,
            "min_score": 0.5,
            "timeout_seconds": 2.0,
        },
        "persistence": {
            "enabled": True,
        },
        "rehydration": {
            "enabled": True,
            "max_snapshot_age": 3600,
        },
    }


def load_re_slots_config(yaml_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load Real Estate slots configuration from YAML.

    Args:
        yaml_path: Optional path to config file (defaults to config/real_estate_slots.yaml)

    Returns:
        Dict with real_estate config, or defaults if file not found

    Example:
        cfg = load_re_slots_config()
        required_slots = cfg.get("required_slots", [])
    """
    if not yaml_path:
        yaml_path = Path(__file__).parent.parent.parent / "config" / "real_estate_slots.yaml"

    try:
        with open(yaml_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            return data.get("real_estate", {}) if data else _get_re_slots_defaults()
    except (FileNotFoundError, yaml.YAMLError) as e:
        print(f"Warning: Could not load RE slots config from {yaml_path}: {e}")
        return _get_re_slots_defaults()


def _get_re_slots_defaults() -> Dict[str, Any]:
    """Get default Real Estate slots config values."""
    return {
        "required_slots": ["rental_type", "location", "budget"],
        "optional_slots": ["bedrooms", "check_in", "check_out", "property_type"],
        "slot_filling_guard": {
            "enabled": True,
            "max_input_words": 7,
            "refinement_keywords": ["cheaper", "bigger", "smaller"],
            "explicit_switch_keywords": ["actually", "instead", "show me"],
        },
        "search": {
            "max_results": 20,
            "timeout_seconds": 2.0,
            "default_currency": "GBP",
        },
    }


def validate_env() -> None:
    """Best-effort validation of required environment variables.

    We don't raise here to avoid crashing dev servers; we log in llm module
    when keys are missing and operate in a degraded mode.
    """
    # OPENAI_API_KEY is required for real runs; allow tests to skip.
    _ = os.getenv("OPENAI_API_KEY")
