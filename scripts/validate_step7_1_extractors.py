#!/usr/bin/env python3
"""
STEP 7.1: NLP Extractor Validation Tests

Unit tests for coherent slot-filling extractors.

Usage:
    python3 scripts/validate_step7_1_extractors.py

Expected Results:
    ✅ All assertions pass (location, budget, bedrooms, rental_type, anywhere)
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from assistant.brain.nlp.extractors import extract_all


def test_basic_extraction():
    """Test basic location + budget extraction."""
    print("\n=== Test 1: Basic Extraction (kyrenia 600 pounds) ===")

    result = extract_all("kyrenia 600 pounds")
    expected = {"location": "Kyrenia", "budget": 600, "budget_currency": "GBP"}

    assert result == expected, f"Expected {expected}, got {result}"

    print(f"  ✅ PASS: Extracted {result}")


def test_bedroom_extraction():
    """Test bedroom count extraction with location."""
    print("\n=== Test 2: Bedroom Extraction (need 2 bed in girne) ===")

    result = extract_all("need 2 bed in girne")

    assert "bedrooms" in result, f"Expected 'bedrooms' in result, got {result}"
    assert result["bedrooms"] == 2, f"Expected 2 bedrooms, got {result['bedrooms']}"
    assert "location" in result, f"Expected 'location' in result, got {result}"
    assert result["location"] == "Kyrenia", f"Expected Kyrenia, got {result['location']}"

    print(f"  ✅ PASS: Extracted {result}")


def test_complex_extraction():
    """Test complex extraction with rental_type, anywhere, budget."""
    print("\n=== Test 3: Complex Extraction (long term anywhere under 1000 lira) ===")

    result = extract_all("long term anywhere under 1000 lira")

    assert result["rental_type"] == "long_term", \
        f"Expected 'long_term', got {result.get('rental_type')}"
    assert result["anywhere"] is True, \
        f"Expected anywhere=True, got {result.get('anywhere')}"
    assert result["budget"] == 1000, \
        f"Expected budget=1000, got {result.get('budget')}"
    assert result["budget_currency"] == "TRY", \
        f"Expected TRY, got {result.get('budget_currency')}"

    print(f"  ✅ PASS: Extracted {result}")


def test_locale_synonyms():
    """Test locale synonym normalization."""
    print("\n=== Test 4: Locale Synonyms (girne → Kyrenia) ===")

    test_cases = [
        ("in girne", "Kyrenia"),
        ("in gırne", "Kyrenia"),
        ("kyrenia", "Kyrenia"),
        ("in lefkoşa", "Nicosia"),
        ("nicosia", "Nicosia"),
        ("gazimağusa", "Famagusta"),
        ("famagusta", "Famagusta"),
    ]

    for input_text, expected_location in test_cases:
        result = extract_all(input_text)
        assert result.get("location") == expected_location, \
            f"For '{input_text}': expected {expected_location}, got {result.get('location')}"

    print(f"  ✅ PASS: All {len(test_cases)} locale synonyms normalized correctly")


def test_currency_normalization():
    """Test currency normalization."""
    print("\n=== Test 5: Currency Normalization ===")

    test_cases = [
        ("600 pounds", "GBP"),
        ("600 £", "GBP"),
        ("600 gbp", "GBP"),
        ("500 euro", "EUR"),
        ("500 €", "EUR"),
        ("1000 lira", "TRY"),
        ("1000 tl", "TRY"),
        ("200 dollars", "USD"),
        ("200 $", "USD"),
    ]

    for input_text, expected_currency in test_cases:
        result = extract_all(input_text)
        assert result.get("budget_currency") == expected_currency, \
            f"For '{input_text}': expected {expected_currency}, got {result.get('budget_currency')}"

    print(f"  ✅ PASS: All {len(test_cases)} currencies normalized correctly")


def test_rental_type_detection():
    """Test rental type (short-term vs long-term) detection."""
    print("\n=== Test 6: Rental Type Detection ===")

    # Long-term tests
    long_term_inputs = [
        "long term",
        "long-term",
        "monthly rent",
        "yearly",
        "12-month lease",
    ]

    for input_text in long_term_inputs:
        result = extract_all(input_text)
        assert result.get("rental_type") == "long_term", \
            f"For '{input_text}': expected 'long_term', got {result.get('rental_type')}"

    # Short-term tests
    short_term_inputs = [
        "short term",
        "short-term",
        "nightly",
        "daily rent",
        "weekly",
        "airbnb",
    ]

    for input_text in short_term_inputs:
        result = extract_all(input_text)
        assert result.get("rental_type") == "short_term", \
            f"For '{input_text}': expected 'short_term', got {result.get('rental_type')}"

    print(f"  ✅ PASS: All rental type patterns detected correctly")


def test_anywhere_detection():
    """Test 'anywhere' location preference detection."""
    print("\n=== Test 7: Anywhere Detection ===")

    anywhere_inputs = [
        "anywhere",
        "any where",
        "no preference",
        "open to any",
    ]

    for input_text in anywhere_inputs:
        result = extract_all(input_text)
        assert result.get("anywhere") is True, \
            f"For '{input_text}': expected anywhere=True, got {result.get('anywhere')}"

    print(f"  ✅ PASS: All 'anywhere' patterns detected correctly")


def test_bedroom_patterns():
    """Test various bedroom count patterns."""
    print("\n=== Test 8: Bedroom Patterns ===")

    test_cases = [
        ("1 bed", 1),
        ("2 bedroom", 2),
        ("3 bedrooms", 3),
        ("4BR", 4),
        ("5 br", 5),
    ]

    for input_text, expected_count in test_cases:
        result = extract_all(input_text)
        assert result.get("bedrooms") == expected_count, \
            f"For '{input_text}': expected {expected_count}, got {result.get('bedrooms')}"

    print(f"  ✅ PASS: All bedroom patterns extracted correctly")


def test_integration_e2e():
    """Test end-to-end integration with realistic user inputs."""
    print("\n=== Test 9: E2E Integration (Realistic Inputs) ===")

    # E2E Test 1: Initial request
    result1 = extract_all("I need a 2-bedroom apartment in Kyrenia for 600 pounds")
    assert result1["bedrooms"] == 2
    assert result1["location"] == "Kyrenia"
    assert result1["budget"] == 600
    assert result1["budget_currency"] == "GBP"

    # E2E Test 2: Refinement
    result2 = extract_all("long term under 1000 lira")
    assert result2["rental_type"] == "long_term"
    assert result2["budget"] == 1000
    assert result2["budget_currency"] == "TRY"

    # E2E Test 3: Anywhere preference
    result3 = extract_all("3 bed anywhere under 800 euros monthly")
    assert result3["bedrooms"] == 3
    assert result3["anywhere"] is True
    assert result3["budget"] == 800
    assert result3["budget_currency"] == "EUR"
    assert result3["rental_type"] == "long_term"

    print(f"  ✅ PASS: All E2E scenarios passed")


def run_all_tests():
    """Run all validation tests."""
    print("=" * 70)
    print("STEP 7.1: NLP Extractor Validation Tests")
    print("=" * 70)

    try:
        test_basic_extraction()
        test_bedroom_extraction()
        test_complex_extraction()
        test_locale_synonyms()
        test_currency_normalization()
        test_rental_type_detection()
        test_anywhere_detection()
        test_bedroom_patterns()
        test_integration_e2e()

        print("\n" + "=" * 70)
        print("✅ All STEP 7.1 extractor tests passed (9/9)")
        print("=" * 70)
        print("\nCOHERENT SLOT-FILLING WORKING:")
        print("  • Location extraction & normalization ✅")
        print("  • Budget & currency parsing ✅")
        print("  • Bedroom count extraction ✅")
        print("  • Rental type detection (short/long-term) ✅")
        print("  • 'Anywhere' preference detection ✅")
        print("  • E2E realistic scenarios ✅")
        print("\nReady for integration with real_estate_handler!")

        return 0

    except AssertionError as e:
        print("\n" + "=" * 70)
        print(f"❌ VALIDATION FAILED: {e}")
        print("=" * 70)
        return 1

    except Exception as e:
        print("\n" + "=" * 70)
        print(f"❌ ERROR: {e}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
