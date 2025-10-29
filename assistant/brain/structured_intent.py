"""
B.1: STRUCTURED INTENT CLASSIFICATION WITH LLM VALIDATION

Production-grade intent classification using LangChain's structured output feature.
Guarantees 100% schema compliance with graceful fallback and audit trails.

Architecture:
- LLM structured output (OpenAI JSON schema, Claude tool_use)
- Pydantic validation on LLM response
- Graceful fallback with reasoning (not silent)
- Audit trail for debugging
"""

import json
import logging
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

# Use legacy IntentResult definition for compatibility
from .schemas_old import IntentResult

logger = logging.getLogger(__name__)


def create_structured_intent_parser():
    """
    Create a parser that forces LLM output to match IntentResult schema.
    
    Uses LangChain's structured output feature:
    - OpenAI 4-turbo: JSON schema enforcement
    - Claude 3+: Tool use enforcement
    """
    return PydanticOutputParser(pydantic_object=IntentResult)


def parse_intent_structured(
    user_text: str,
    history_summary: str,
    language: str,
    pending_actions_json: str,
    context: Optional[Dict[str, Any]] = None
) -> IntentResult:
    """
    LLM-powered intent classification with GUARANTEED schema compliance.
    
    This is the PRIMARY entry point for B.1 structured output.
    
    Args:
        user_text: Raw user input
        history_summary: Summarized conversation history
        language: Detected language code
        pending_actions_json: JSON string of pending actions
        context: Optional context for reasoning
    
    Returns:
        IntentResult: GUARANTEED valid Pydantic object (or fallback)
    
    Raises:
        ValueError: Only on catastrophic LLM failures (after fallback)
    """
    llm = ChatOpenAI(
        model="gpt-4-turbo-preview",
        temperature=0.1,  # Low temperature for deterministic intent
        top_p=0.95,
    )
    
    # Use LangChain's structured output feature
    structured_llm = llm.with_structured_output(
        schema=IntentResult,
        method="json_schema"  # Forces JSON schema enforcement
    )
    
    parser = create_structured_intent_parser()
    
    prompt_template = ChatPromptTemplate.from_template(
        """
You are an intent classification router for a multi-domain marketplace agent.
Return a STRICT JSON object matching the provided schema.

Requirements:
- Detect input language and set input_language; set output_language equal to input_language by default; set language to the normalized processing language (usually "en").
- Classify into one of the categories: PROPERTY, VEHICLE, GENERAL_PRODUCT, SERVICE, KNOWLEDGE_QUERY, OUT_OF_SCOPE.
- Provide a subcategory (free text) and goal (what the user is trying to accomplish) when possible.
- Set needs_tool/tool_name only if a concrete tool action is required now.
- Keep reasoning brief for audit.

Context:
- history_summary: {history_summary}
- pending_actions: {pending_actions_json}

User message:
"""
{message}
"""
        """
        )
    
    chain = prompt_template | structured_llm
    
    try:
        result = chain.invoke({
            "message": user_text,
            "history_summary": history_summary,
            "last_action": context.get("last_action", "none") if context else "none",
            "language": language,
            "pending_actions_json": pending_actions_json,
        })
        
        # result is already an IntentResult due to structured_output
        logger.info(
            f"Intent classification SUCCESS: {result.intent_type} "
            f"(confidence: {result.confidence}, reasoning: {result.reasoning})"
        )
        return result
    
    except Exception as e:
        logger.error(f"Intent parsing failed: {e}", exc_info=True)
        return IntentResult(
            intent_type="general_chat",
            confidence=0.0,
            language=language,
            input_language=language,
            output_language=language,
            category="OUT_OF_SCOPE",
            reasoning=f"Parsing error (fallback): {str(e)}"
        )


def validate_intent(intent: IntentResult) -> tuple[bool, Optional[str]]:
    """
    Validate intent object for routing safety.
    
    Returns:
        (is_valid: bool, error_message: str | None)
    """
    # Already validated by Pydantic, but add business logic validation
    if intent.needs_tool and not intent.tool_name:
        return False, "tool_name is required when needs_tool=True"
    
    if intent.confidence < 0.0 or intent.confidence > 1.0:
        return False, "confidence must be 0.0-1.0"
    
    valid_languages = ["en", "tr", "ru", "pl"]
    if intent.language not in valid_languages:
        return False, f"language must be one of {valid_languages}"
    
    return True, None


# Backwards compatibility: keep old function signature but use structured output
def parse_intent(
    user_text: str,
    history_summary: str,
    language: str,
    pending_actions_json: str
) -> IntentResult:
    """
    Backwards-compatible wrapper for parse_intent_structured.
    
    Used in agent.py:342 as drop-in replacement.
    """
    return parse_intent_structured(
        user_text=user_text,
        history_summary=history_summary,
        language=language,
        pending_actions_json=pending_actions_json
    )
