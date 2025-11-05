"""
STEP 7: Context-Primed Router & Sticky-Intent Orchestration

Lightweight, deterministic intent classification with hysteresis for
intent continuity. Uses fused context from STEP 6 and applies
stick/switch thresholds to prevent oscillation.

Key Features:
- Context-primed classification (user input + fused context)
- Hysteresis thresholds (stick/switch/clarify)
- Refinement detection (short inputs, location follow-ups)
- Domain priors (boost current domain compatibility)
- Explicit switch markers (override continuity)
- Learning feedback loop (via /api/feedback)
"""

from __future__ import annotations
import re
import math
import logging
from typing import Dict, Any, Tuple
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

# Load router configuration
CONFIG_PATH = Path(__file__).parent.parent.parent / "router_thresholds.yaml"
CONFIG = yaml.safe_load(CONFIG_PATH.read_text())

logger.info(f"[ROUTER] Loaded configuration from {CONFIG_PATH}")


def _softmax(scores: Dict[str, float]) -> Dict[str, float]:
    """
    Apply softmax normalization to convert logits to probabilities.

    Args:
        scores: Dict of intent labels to logit scores

    Returns:
        Dict of intent labels to normalized probabilities (sum=1.0)
    """
    if not scores:
        return {}

    max_score = max(scores.values())
    exps = {k: math.exp(v - max_score) for k, v in scores.items()}
    total = sum(exps.values())

    if total == 0:
        # Uniform distribution if all scores are -inf
        return {k: 1.0 / len(scores) for k in scores}

    return {k: v / total for k, v in exps.items()}


def _tokenize(text: str) -> set[str]:
    """
    Simple tokenization: lowercase, remove punctuation, split on whitespace.

    Args:
        text: Input text to tokenize

    Returns:
        Set of lowercased tokens
    """
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    tokens = cleaned.split()
    return set(tokens)


def _apply_domain_priors(
    tokens: set[str],
    active_domain: str | None,
    base_scores: Dict[str, float]
) -> Dict[str, float]:
    """
    Apply domain priors to boost current domain if input tokens overlap
    with compatible tokens.

    This implements "sticky intent" by giving a small boost to the current
    domain when the input contains relevant terms.

    Args:
        tokens: Set of input tokens
        active_domain: Current active agent domain (e.g., "real_estate_agent")
        base_scores: Base logit scores before priors

    Returns:
        Adjusted scores with domain prior boost applied
    """
    scores = dict(base_scores)
    priors_config = CONFIG.get("features", {}).get("domain_priors", {})

    if not active_domain or active_domain not in priors_config:
        return scores

    # Get compatible tokens for current domain
    domain_config = priors_config[active_domain]
    compatible_tokens = set(domain_config["compatible_tokens"])
    weight = domain_config["weight"]

    # Check for overlap between input tokens and compatible tokens
    overlap_count = len(tokens & compatible_tokens)

    if overlap_count > 0:
        # Find the intent that maps to this domain
        for intent, agent in CONFIG["agents"].items():
            if agent == active_domain:
                boost = weight * (1.0 if overlap_count > 0 else 0.0)
                scores[intent] += boost
                logger.debug(
                    f"[ROUTER] Domain prior boost: {intent} +{boost:.3f} "
                    f"(overlap={overlap_count} tokens with {active_domain})"
                )
                break

    return scores


def _heuristic_logits(text: str, fused_context: str) -> Dict[str, float]:
    """
    Lightweight, deterministic "scorer" for intent classification.

    This is a placeholder for a more sophisticated model. In production,
    replace with a distilled classification model (e.g., DistilBERT).

    Args:
        text: User input text
        fused_context: Fused context from STEP 6 (history + summary + retrieved)

    Returns:
        Dict of intent labels to logit scores
    """
    # Tokenize user input and context separately
    # Prioritize user input over context for explicit intent signals
    user_tokens = _tokenize(text)
    context_tokens = _tokenize(fused_context)

    # Initialize scores for all intents
    scores = {label: 0.0 for label in CONFIG["intent_labels"]}

    # Keyword-based scoring (simple baseline)
    # Property search keywords
    property_keywords = {
        "apartment", "apartments", "flat", "flats", "villa", "villas",
        "house", "houses", "rent", "bedroom", "bedrooms",
        "property", "properties", "estate", "living", "accommodation"
    }
    if user_tokens & property_keywords:
        scores["property_search"] += 1.5  # Higher weight for user input
    elif context_tokens & property_keywords:
        scores["property_search"] += 0.6  # Lower weight for context

    # Vehicle search keywords
    vehicle_keywords = {
        "car", "cars", "vehicle", "vehicles", "sedan", "sedans",
        "suv", "suvs", "hire", "motorcycle", "motorcycles",
        "auto", "autos", "transport", "rent car"
    }
    if user_tokens & vehicle_keywords:
        scores["vehicle_search"] += 1.5  # Higher weight for user input
    elif context_tokens & vehicle_keywords:
        scores["vehicle_search"] += 0.6  # Lower weight for context

    # Local lookup keywords
    local_keywords = {
        "pharmacy", "pharmacies", "hospital", "hospitals", "duty",
        "atm", "atms", "restaurant", "restaurants",
        "directions", "where", "location", "address", "open", "hours"
    }
    if user_tokens & local_keywords:
        scores["local_lookup"] += 1.2  # Higher weight for user input
    elif context_tokens & local_keywords:
        scores["local_lookup"] += 0.5  # Lower weight for context

    # Default to general help if no strong signals
    if max(scores.values(), default=0.0) == 0.0:
        scores["general_help"] += 0.5

    return scores


def classify(state: Dict[str, Any]) -> Tuple[str, str, float, Dict[str, Any]]:
    """
    Classify user intent using context-primed routing.

    Args:
        state: SupervisorState dict with:
            - user_input: Current user message
            - fused_context: Fused context from STEP 6
            - active_domain: Current active agent domain (for priors)

    Returns:
        Tuple of (intent_label, agent_name, confidence, evidence)
        - intent_label: Classified intent (e.g., "property_search")
        - agent_name: Target agent (e.g., "real_estate_agent")
        - confidence: Probability score (0-1)
        - evidence: Dict with logits, probs, tokens for debugging
    """
    text = state.get("user_input", "")
    fused = state.get("fused_context", "")
    active_domain = state.get("active_domain")

    # Get base logit scores
    base_logits = _heuristic_logits(text, fused)

    # Apply domain priors to boost current domain
    tokens = _tokenize(text)
    logits = _apply_domain_priors(tokens, active_domain, base_logits)

    # Convert logits to probabilities
    probs = _softmax(logits)

    # Pick intent with highest probability
    intent = max(probs, key=probs.get)
    agent = CONFIG["agents"][intent]
    confidence = float(probs[intent])

    # Build evidence dict for debugging and feedback
    evidence = {
        "logits": logits,
        "probs": probs,
        "active_domain": active_domain,
        "tokens": list(sorted(tokens))[:25]  # Limit to 25 tokens
    }

    logger.info(
        f"[ROUTER] Classified: intent={intent}, agent={agent}, "
        f"confidence={confidence:.3f}, active_domain={active_domain}"
    )

    return intent, agent, confidence, evidence


def continuity_decision(
    state: Dict[str, Any],
    new_intent: str,
    new_agent: str,
    confidence: float
) -> Dict[str, Any]:
    """
    Apply hysteresis for sticky-intent orchestration.

    Decides whether to stick with current domain, switch to new domain,
    or ask for clarification based on:
    - Confidence thresholds (stick/switch/clarify)
    - Short input detection (≤5 words → stick)
    - Refinement lexicon (location follow-ups → stick)
    - Explicit switch markers (override continuity)

    Args:
        state: SupervisorState with user_input, active_domain, current_intent
        new_intent: Newly classified intent
        new_agent: Newly classified target agent
        confidence: Classification confidence (0-1)

    Returns:
        Dict with:
        - decision: 'stick' | 'switch' | 'clarify'
        - reason: Explanation string for debugging
    """
    thresholds = CONFIG["thresholds"]
    continuity_config = CONFIG["continuity"]

    text = state.get("user_input", "").strip().lower()
    active_domain = state.get("active_domain")
    last_intent = state.get("current_intent")

    # Rule 1: Explicit switch markers always win
    explicit_markers = continuity_config["explicit_switch_markers"]
    if any(marker in text for marker in explicit_markers):
        logger.info(f"[ROUTER] Explicit switch detected: {text[:50]}...")
        return {"decision": "switch", "reason": "explicit_switch_marker"}

    # Rule 2: Short inputs or refinement lexicon → stick
    word_count = len(text.split())
    short_max = continuity_config["short_input_max_words"]
    refinement_lexicon = continuity_config["refinement_lexicon"]

    is_short = word_count <= short_max
    is_refinement = any(
        text.startswith(phrase) or f" {phrase}" in text
        for phrase in refinement_lexicon
    )

    if is_short or is_refinement:
        logger.info(
            f"[ROUTER] Refinement detected (short={is_short}, "
            f"refinement={is_refinement}, words={word_count})"
        )
        return {
            "decision": "stick",
            "reason": f"refinement_or_short (words={word_count})"
        }

    # Rule 3: Hysteresis thresholds
    if confidence >= thresholds["switch"]:
        logger.info(
            f"[ROUTER] High confidence switch: {confidence:.3f} >= "
            f"{thresholds['switch']}"
        )
        return {
            "decision": "switch",
            "reason": f"conf>=switch({confidence:.2f})"
        }

    if confidence <= thresholds["stick"]:
        logger.info(
            f"[ROUTER] Low confidence stick: {confidence:.3f} <= "
            f"{thresholds['stick']}"
        )
        return {
            "decision": "stick",
            "reason": f"conf<=stick({confidence:.2f})"
        }

    if confidence <= thresholds["ask_clarify"]:
        logger.info(
            f"[ROUTER] Ambiguous → clarify: {confidence:.3f} <= "
            f"{thresholds['ask_clarify']}"
        )
        return {
            "decision": "clarify",
            "reason": f"conf in gray zone({confidence:.2f})→clarify"
        }

    # Rule 4: Same domain bias (stick if intent maps to same agent)
    if active_domain and last_intent:
        last_agent = CONFIG["agents"].get(last_intent, "")
        if last_agent == active_domain:
            logger.info(
                f"[ROUTER] Same domain bias: {last_intent} → {active_domain}"
            )
            return {
                "decision": "stick",
                "reason": "same_domain_bias"
            }

    # Default: switch
    logger.info(f"[ROUTER] Default switch: confidence={confidence:.3f}")
    return {
        "decision": "switch",
        "reason": "default_switch"
    }

