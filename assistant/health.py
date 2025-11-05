"""
Production Hardening: Startup Health Checks

Validates domain module importability and callable symbols on web/worker boot.
Prevents silent failures like the STEP 7.2 SyntaxError incident.

Usage:
    # In Django settings or worker entry point:
    from assistant.health import check_domain_health

    # On startup:
    health_status = check_domain_health()
    if not health_status["domain_import_ok"]:
        logger.error("Domain import failed, disabling RE domain")
        settings.FEATURE_RE_DOMAIN_ENABLED = False
"""

import logging
import importlib
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Runtime feature flag (set by health check)
FEATURE_RE_DOMAIN_ENABLED = True


def check_domain_health() -> Dict[str, Any]:
    """
    Check domain module health on startup.

    Validates:
        - assistant.domain.real_estate_service imports cleanly
        - Required functions are callable (availability_summary)
        - assistant.brain.policy.offer_surface imports cleanly
        - assistant.brain.nlp.acts imports cleanly

    Returns:
        Dict with:
            - domain_import_ok: bool
            - re_agent_enabled: bool
            - errors: List[str] (if any)
            - checked_modules: List[str]

    Side Effects:
        - Sets global FEATURE_RE_DOMAIN_ENABLED flag
        - Logs structured warnings on failure
    """
    global FEATURE_RE_DOMAIN_ENABLED

    errors = []
    checked = []

    # Check 1: Real estate domain service
    try:
        re_service = importlib.import_module("assistant.domain.real_estate_service")
        checked.append("assistant.domain.real_estate_service")

        # Verify callable symbols
        if not hasattr(re_service, "availability_summary"):
            errors.append("availability_summary not found in real_estate_service")
        if not callable(getattr(re_service, "availability_summary", None)):
            errors.append("availability_summary is not callable")

    except Exception as e:
        errors.append(f"real_estate_service import failed: {e}")
        logger.error(
            "[HEALTH] Domain import failed",
            exc_info=True,
            extra={"module": "real_estate_service", "error": str(e)}
        )

    # Check 2: Offer surface orchestrator
    try:
        offer_surface = importlib.import_module("assistant.brain.policy.offer_surface")
        checked.append("assistant.brain.policy.offer_surface")

        if not hasattr(offer_surface, "real_estate_offer_surface"):
            errors.append("real_estate_offer_surface not found")
        if not callable(getattr(offer_surface, "real_estate_offer_surface", None)):
            errors.append("real_estate_offer_surface is not callable")

    except Exception as e:
        errors.append(f"offer_surface import failed: {e}")
        logger.error(
            "[HEALTH] Offer surface import failed",
            exc_info=True,
            extra={"module": "offer_surface", "error": str(e)}
        )

    # Check 3: Act classifier
    try:
        acts = importlib.import_module("assistant.brain.nlp.acts")
        checked.append("assistant.brain.nlp.acts")

        if not hasattr(acts, "classify_act"):
            errors.append("classify_act not found in acts module")
        if not callable(getattr(acts, "classify_act", None)):
            errors.append("classify_act is not callable")

    except Exception as e:
        errors.append(f"acts import failed: {e}")
        logger.error(
            "[HEALTH] Acts classifier import failed",
            exc_info=True,
            extra={"module": "acts", "error": str(e)}
        )

    # Check 4: Dialogue policy
    try:
        policy = importlib.import_module("assistant.brain.policy.real_estate_policy")
        checked.append("assistant.brain.policy.real_estate_policy")

        required_funcs = ["_missing_slots", "next_question", "criteria_text"]
        for func_name in required_funcs:
            if not hasattr(policy, func_name):
                errors.append(f"{func_name} not found in real_estate_policy")

    except Exception as e:
        errors.append(f"real_estate_policy import failed: {e}")
        logger.error(
            "[HEALTH] Policy import failed",
            exc_info=True,
            extra={"module": "real_estate_policy", "error": str(e)}
        )

    # Determine overall health
    domain_import_ok = len(errors) == 0
    FEATURE_RE_DOMAIN_ENABLED = domain_import_ok

    status = {
        "domain_import_ok": domain_import_ok,
        "re_agent_enabled": FEATURE_RE_DOMAIN_ENABLED,
        "errors": errors,
        "checked_modules": checked,
    }

    if domain_import_ok:
        logger.info(
            "[HEALTH] Domain health check passed",
            extra={"checked": len(checked), "re_agent_enabled": True}
        )
    else:
        logger.warning(
            "[HEALTH] Domain health check FAILED",
            extra={
                "checked": len(checked),
                "errors": errors,
                "re_agent_enabled": False
            }
        )

    return status


def get_health_status() -> Dict[str, Any]:
    """
    Get current health status (for /healthz endpoint).

    Returns:
        Dict with ok, domain_import_ok, re_agent_enabled
    """
    return {
        "ok": True,  # App is running
        "domain_import_ok": FEATURE_RE_DOMAIN_ENABLED,
        "re_agent_enabled": FEATURE_RE_DOMAIN_ENABLED,
    }
