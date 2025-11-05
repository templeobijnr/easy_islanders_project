"""
CI Gate: Domain Module Import Tests

Catches syntax errors and missing symbols before deployment.
Prevents incidents like the STEP 7.2 SyntaxError (real_estate_service.py line 131).

Usage:
    pytest -q tests/imports/test_domain_imports.py

Expected: All imports succeed, all required symbols callable.
"""

import sys
import importlib
import pytest


def test_real_estate_service_imports():
    """Test real_estate_service module imports cleanly."""
    try:
        re_service = importlib.import_module("assistant.domain.real_estate_service")
    except Exception as e:
        pytest.fail(f"assistant.domain.real_estate_service import failed: {e}")

    # Verify required functions exist
    assert hasattr(re_service, "availability_summary"), \
        "availability_summary not found in real_estate_service"
    assert callable(re_service.availability_summary), \
        "availability_summary is not callable"


def test_offer_surface_imports():
    """Test offer_surface module imports cleanly."""
    try:
        offer_surface = importlib.import_module("assistant.brain.policy.offer_surface")
    except Exception as e:
        pytest.fail(f"assistant.brain.policy.offer_surface import failed: {e}")

    # Verify required functions exist
    assert hasattr(offer_surface, "real_estate_offer_surface"), \
        "real_estate_offer_surface not found"
    assert callable(offer_surface.real_estate_offer_surface), \
        "real_estate_offer_surface is not callable"


def test_acts_classifier_imports():
    """Test acts module imports cleanly."""
    try:
        acts = importlib.import_module("assistant.brain.nlp.acts")
    except Exception as e:
        pytest.fail(f"assistant.brain.nlp.acts import failed: {e}")

    # Verify required functions exist
    assert hasattr(acts, "classify_act"), \
        "classify_act not found in acts module"
    assert callable(acts.classify_act), \
        "classify_act is not callable"


def test_real_estate_policy_imports():
    """Test real_estate_policy module imports cleanly."""
    try:
        policy = importlib.import_module("assistant.brain.policy.real_estate_policy")
    except Exception as e:
        pytest.fail(f"assistant.brain.policy.real_estate_policy import failed: {e}")

    # Verify required functions exist
    required_funcs = ["_missing_slots", "next_question", "criteria_text", "build_offer_lines", "relax_filters"]
    for func_name in required_funcs:
        assert hasattr(policy, func_name), \
            f"{func_name} not found in real_estate_policy"
        assert callable(getattr(policy, func_name)), \
            f"{func_name} is not callable"


def test_nlp_extractors_imports():
    """Test NLP extractors module imports cleanly."""
    try:
        extractors = importlib.import_module("assistant.brain.nlp.extractors")
    except Exception as e:
        pytest.fail(f"assistant.brain.nlp.extractors import failed: {e}")

    # Verify required functions exist
    required_funcs = ["extract_all", "parse_bedrooms", "parse_budget", "parse_location"]
    for func_name in required_funcs:
        assert hasattr(extractors, func_name), \
            f"{func_name} not found in extractors module"
        assert callable(getattr(extractors, func_name)), \
            f"{func_name} is not callable"


def test_health_check_imports():
    """Test health check module imports cleanly."""
    try:
        health = importlib.import_module("assistant.health")
    except Exception as e:
        pytest.fail(f"assistant.health import failed: {e}")

    # Verify required functions exist
    assert hasattr(health, "check_domain_health"), \
        "check_domain_health not found"
    assert callable(health.check_domain_health), \
        "check_domain_health is not callable"

    assert hasattr(health, "get_health_status"), \
        "get_health_status not found"
    assert callable(health.get_health_status), \
        "get_health_status is not callable"


if __name__ == "__main__":
    # Allow running directly for quick checks
    import sys
    sys.path.insert(0, ".")

    print("Testing domain imports...")

    try:
        test_real_estate_service_imports()
        print("✅ real_estate_service imports OK")
    except Exception as e:
        print(f"❌ real_estate_service: {e}")
        sys.exit(1)

    try:
        test_offer_surface_imports()
        print("✅ offer_surface imports OK")
    except Exception as e:
        print(f"❌ offer_surface: {e}")
        sys.exit(1)

    try:
        test_acts_classifier_imports()
        print("✅ acts classifier imports OK")
    except Exception as e:
        print(f"❌ acts: {e}")
        sys.exit(1)

    try:
        test_real_estate_policy_imports()
        print("✅ real_estate_policy imports OK")
    except Exception as e:
        print(f"❌ real_estate_policy: {e}")
        sys.exit(1)

    try:
        test_nlp_extractors_imports()
        print("✅ nlp_extractors imports OK")
    except Exception as e:
        print(f"❌ nlp_extractors: {e}")
        sys.exit(1)

    try:
        test_health_check_imports()
        print("✅ health check imports OK")
    except Exception as e:
        print(f"❌ health check: {e}")
        sys.exit(1)

    print("\n✅ All domain imports passed!")
