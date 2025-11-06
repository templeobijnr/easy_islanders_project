"""
Slot Inference Engine (v2.0)

Intelligent slot value extraction using:
1. LLM-based semantic inference (primary)
2. Rule-based heuristic patterns (fallback)

Provides confidence-scored slot predictions to reduce explicit questioning.
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional
from assistant.brain.slot_policy import get_slot_policy

logger = logging.getLogger(__name__)


def infer_slots_llm(
    user_message: str,
    missing_slots: List[str],
    context: Dict[str, Any]
) -> Dict[str, Dict[str, Any]]:
    """
    Use LLM to infer missing slot values from user message and context.

    Args:
        user_message: Current user input
        missing_slots: List of slot names that need to be filled
        context: Additional context (filled_slots, conversation history, etc.)

    Returns:
        Dict mapping slot names to inferred values with metadata:
        {
            "budget": {
                "value": 500,
                "confidence": 0.85,
                "source": "llm",
                "evidence": "User mentioned 'around 500 pounds'"
            }
        }

    Example:
        user_message = "I need something cheap in Kyrenia"
        missing_slots = ["budget", "location"]
        → {
            "budget": {"value": "low", "confidence": 0.7, "source": "llm"},
            "location": {"value": "Kyrenia", "confidence": 0.95, "source": "llm"}
        }
    """
    try:
        # Import OpenAI client
        from assistant.llm import generate_chat_completion

        # Build prompt for slot inference
        filled_slots = context.get("filled_slots", {})
        prompt = _build_inference_prompt(user_message, missing_slots, filled_slots)

        # Call LLM (use fast model for inference)
        response_text = generate_chat_completion(
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,  # Low temperature for more deterministic extraction
            max_tokens=200
        )

        # Parse JSON response
        inferred = _parse_inference_response(response_text)

        logger.info(
            f"[InferenceEngine] LLM inferred {len(inferred)} slots from '{user_message[:50]}...'"
        )

        return inferred

    except Exception as e:
        logger.warning(
            f"[InferenceEngine] LLM inference failed: {e}, falling back to heuristics",
            exc_info=True
        )
        return {}


def infer_slots_heuristic(
    user_message: str,
    missing_slots: List[str],
    context: Dict[str, Any]
) -> Dict[str, Dict[str, Any]]:
    """
    Use rule-based heuristics to infer slot values (fallback when LLM unavailable).

    Args:
        user_message: Current user input
        missing_slots: List of slot names that need to be filled
        context: Additional context

    Returns:
        Dict mapping slot names to inferred values

    Heuristics:
    - Budget: Match currency symbols, numbers, keywords ("cheap", "luxury")
    - Location: Match known city names
    - Bedrooms: Match patterns ("2 bed", "studio", etc.)
    - Furnishing: Match keywords ("furnished", "unfurnished")
    """
    policy = get_slot_policy()
    config = policy._cache
    patterns = config.get("inference", {}).get("patterns", {})

    user_lower = user_message.lower()
    inferred = {}

    for slot_name in missing_slots:
        result = None

        if slot_name == "budget":
            result = _infer_budget_heuristic(user_lower, patterns)
        elif slot_name == "location":
            result = _infer_location_heuristic(user_lower, patterns)
        elif slot_name == "bedrooms":
            result = _infer_bedrooms_heuristic(user_lower, patterns)
        elif slot_name == "furnishing":
            result = _infer_furnishing_heuristic(user_lower, patterns)

        if result:
            inferred[slot_name] = result
            logger.info(
                f"[InferenceEngine] Heuristic inferred {slot_name}={result['value']} "
                f"(confidence={result['confidence']})"
            )

    return inferred


def infer_slots(
    user_message: str,
    missing_slots: List[str],
    context: Dict[str, Any],
    use_llm: bool = True
) -> Dict[str, Dict[str, Any]]:
    """
    Unified slot inference interface.

    Tries LLM first, falls back to heuristics if disabled or failed.

    Args:
        user_message: Current user input
        missing_slots: Slots to infer
        context: Additional context
        use_llm: Whether to attempt LLM inference

    Returns:
        Dict mapping slot names to inferred values with metadata
    """
    policy = get_slot_policy()
    config = policy._cache
    inference_cfg = config.get("inference", {})

    enabled = inference_cfg.get("enabled", True)
    fallback_to_heuristics = inference_cfg.get("fallback_to_heuristics", True)

    if not enabled:
        return {}

    # Try LLM if enabled
    if use_llm:
        inferred = infer_slots_llm(user_message, missing_slots, context)
        if inferred:
            return inferred

    # Fallback to heuristics
    if fallback_to_heuristics:
        return infer_slots_heuristic(user_message, missing_slots, context)

    return {}


# --- Helper Functions ---

def _build_inference_prompt(
    user_message: str,
    missing_slots: List[str],
    filled_slots: Dict[str, Any]
) -> str:
    """Build LLM prompt for slot inference."""
    return f"""You are an assistant extracting real estate search details.

Current user message: "{user_message}"

Already known:
{json.dumps(filled_slots, indent=2)}

Missing slots to infer:
{', '.join(missing_slots)}

Extract slot values from the user message. For each missing slot you can infer, provide:
- slot: name of the slot
- value: extracted value
- confidence: 0.0 to 1.0 confidence score
- evidence: brief explanation of how you inferred it

Output ONLY valid JSON array format:
[
  {{"slot": "location", "value": "Kyrenia", "confidence": 0.95, "evidence": "explicitly mentioned"}},
  {{"slot": "budget", "value": "low", "confidence": 0.7, "evidence": "user said 'cheap'"}}
]

If you cannot infer any slots, return an empty array: []
"""


def _parse_inference_response(response_text: str) -> Dict[str, Dict[str, Any]]:
    """Parse LLM inference response into structured dict."""
    try:
        # Extract JSON array from response (handle markdown code blocks)
        text = response_text.strip()

        # Remove markdown code fences if present
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\n', '', text)
            text = re.sub(r'\n```$', '', text)

        # Parse JSON
        parsed = json.loads(text)

        if not isinstance(parsed, list):
            logger.warning(f"[InferenceEngine] Expected list, got {type(parsed)}")
            return {}

        # Convert to dict keyed by slot name
        result = {}
        for item in parsed:
            slot = item.get("slot")
            value = item.get("value")
            confidence = item.get("confidence", 0.5)
            evidence = item.get("evidence", "")

            if slot and value:
                result[slot] = {
                    "value": value,
                    "confidence": float(confidence),
                    "source": "llm",
                    "evidence": evidence
                }

        return result

    except json.JSONDecodeError as e:
        logger.warning(f"[InferenceEngine] Failed to parse JSON: {e}, raw='{response_text[:200]}'")
        return {}


def _infer_budget_heuristic(
    user_lower: str,
    patterns: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Infer budget from keywords or numbers."""
    budget_patterns = patterns.get("budget", {})

    # Check for explicit numbers with currency
    number_match = re.search(r'(\d+)\s*(gbp|pounds|£|euro|€|usd|\$)', user_lower)
    if number_match:
        amount = int(number_match.group(1))
        return {
            "value": amount,
            "confidence": 0.9,
            "source": "heuristic",
            "evidence": f"Explicit amount: {number_match.group(0)}"
        }

    # Check for qualitative budget keywords
    for level, keywords in budget_patterns.items():
        for keyword in keywords:
            if keyword in user_lower:
                return {
                    "value": level,
                    "confidence": 0.7,
                    "source": "heuristic",
                    "evidence": f"Keyword: {keyword}"
                }

    return None


def _infer_location_heuristic(
    user_lower: str,
    patterns: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Infer location from known city names."""
    known_cities = patterns.get("location", {}).get("known_cities", [])

    for city in known_cities:
        if city.lower() in user_lower:
            return {
                "value": city,
                "confidence": 0.95,
                "source": "heuristic",
                "evidence": f"Matched city: {city}"
            }

    return None


def _infer_bedrooms_heuristic(
    user_lower: str,
    patterns: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Infer bedrooms from patterns."""
    bedroom_patterns = patterns.get("bedrooms", {})

    for count, keywords in bedroom_patterns.items():
        for keyword in keywords:
            if keyword in user_lower:
                # Extract number from count (e.g., "two_br" → 2)
                if count == "studio":
                    value = 0
                elif count.startswith("one"):
                    value = 1
                elif count.startswith("two"):
                    value = 2
                elif count.startswith("three"):
                    value = 3
                elif count.startswith("four"):
                    value = 4
                else:
                    continue

                return {
                    "value": value,
                    "confidence": 0.85,
                    "source": "heuristic",
                    "evidence": f"Keyword: {keyword}"
                }

    # Check for explicit numbers
    number_match = re.search(r'(\d+)\s*(?:bed|bedroom|br)', user_lower)
    if number_match:
        return {
            "value": int(number_match.group(1)),
            "confidence": 0.9,
            "source": "heuristic",
            "evidence": f"Explicit: {number_match.group(0)}"
        }

    return None


def _infer_furnishing_heuristic(
    user_lower: str,
    patterns: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Infer furnishing status from keywords."""
    furnishing_patterns = patterns.get("furnishing", {})

    for status, keywords in furnishing_patterns.items():
        for keyword in keywords:
            if keyword in user_lower:
                return {
                    "value": status,
                    "confidence": 0.8,
                    "source": "heuristic",
                    "evidence": f"Keyword: {keyword}"
                }

    return None
