"""
Jinja2 Template Renderer for Agent System Prompts

Renders agent system prompts with runtime context injection.
Supports validation of structured JSON responses.
"""

from typing import Dict, Any, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, Template
import json
import logging
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

# Template directory (relative to this file)
TEMPLATE_DIR = Path(__file__).parent


class RealEstateAgentResponse(BaseModel):
    """
    Validated response schema for Real Estate Agent.

    Matches the OUTPUT FORMAT spec in real_estate_agent.system.j2
    """
    act: str = Field(
        description="Action to take",
        pattern="^(ASK_SLOT|ACK_AND_SEARCH|SEARCH_AND_RECOMMEND|CLARIFY|ESCALATE)$"
    )
    speak: str = Field(description="User-facing response text")
    slots_delta: Dict[str, Any] = Field(
        default_factory=dict,
        description="Only keys that changed on this turn"
    )
    next_needed: list = Field(
        default_factory=list,
        description="Zero or one missing slot name"
    )
    notes: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata (normalizations, continuity_reason)"
    )

    class Config:
        extra = "allow"


def render_real_estate_prompt(
    thread_id: str,
    active_domain: str,
    current_intent: str,
    user_input: str,
    conversation_summary: Optional[str] = None,
    fused_context: Optional[str] = None,
    user_profile: Optional[Dict[str, Any]] = None,
    agent_collected_info: Optional[Dict[str, Any]] = None,
    token_budget: Optional[Dict[str, int]] = None
) -> str:
    """
    Render the Real Estate Agent system prompt with runtime context.

    Args:
        thread_id: Thread identifier
        active_domain: Current active domain
        current_intent: Current intent classification
        user_input: Latest user message
        conversation_summary: Rolling summary (STEP 6)
        fused_context: Fused context (summary + retrieved + recent)
        user_profile: User preferences and profile data
        agent_collected_info: Slots and info collected by this agent
        token_budget: Token budget info (remaining, max)

    Returns:
        Rendered system prompt as string

    Example:
        >>> prompt = render_real_estate_prompt(
        ...     thread_id="abc123",
        ...     active_domain="real_estate_agent",
        ...     current_intent="property_search",
        ...     user_input="2 bedroom in Kyrenia 600 pounds",
        ...     agent_collected_info={}
        ... )
    """
    try:
        # Load Jinja2 environment
        env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True
        )

        # Load template
        template = env.get_template("real_estate_agent.system.j2")

        # Prepare context
        context = {
            "thread_id": thread_id,
            "active_domain": active_domain,
            "current_intent": current_intent,
            "user_input": user_input,
            "conversation_summary": conversation_summary or "",
            "fused_context": fused_context or "",
            "user_profile": user_profile or {},
            "agent_collected_info": agent_collected_info or {},
            "token_budget": token_budget or {"remaining": 0, "max": 0}
        }

        # Render
        rendered = template.render(**context)

        logger.debug(
            "[Prompt Renderer] Rendered real_estate_agent prompt: %d chars",
            len(rendered)
        )

        return rendered

    except Exception as e:
        logger.error(
            "[Prompt Renderer] Failed to render real_estate_agent prompt: %s",
            e,
            exc_info=True
        )
        # Return minimal fallback prompt
        return f"""You are a real estate agent. Help the user find properties.
User: {user_input}
Respond in JSON format with: {{"act": "...", "speak": "...", "slots_delta": {{}}, "next_needed": []}}"""


def parse_real_estate_response(
    llm_response: str,
    strict: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Parse and validate JSON response from Real Estate Agent.

    Args:
        llm_response: Raw LLM output (may contain markdown code fences)
        strict: If True, enforce Pydantic validation

    Returns:
        Validated dict if successful, None if parsing fails

    Example:
        >>> response = parse_real_estate_response('''
        ... ```json
        ... {"act": "ASK_SLOT", "speak": "Got it — Girne, £600. Is this for short-term or long-term?", ...}
        ... ```
        ... ''')
        >>> response["act"]
        'ASK_SLOT'
    """
    try:
        # Strip markdown code fences if present
        text = llm_response.strip()
        if text.startswith("```json"):
            text = text[7:]  # Remove ```json
        if text.startswith("```"):
            text = text[3:]  # Remove ```
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Parse JSON
        data = json.loads(text)

        if strict:
            # Validate with Pydantic
            validated = RealEstateAgentResponse(**data)
            return validated.dict()
        else:
            return data

    except json.JSONDecodeError as e:
        logger.error(
            "[Prompt Renderer] JSON parse failed: %s\nRaw response: %s",
            e,
            llm_response[:200]
        )
        return None
    except ValidationError as e:
        logger.error(
            "[Prompt Renderer] Pydantic validation failed: %s\nData: %s",
            e,
            data
        )
        if not strict:
            return data  # Return raw data if non-strict
        return None
    except Exception as e:
        logger.error(
            "[Prompt Renderer] Unexpected error parsing response: %s",
            e,
            exc_info=True
        )
        return None


def render_generic_prompt(
    template_name: str,
    **context
) -> str:
    """
    Render a generic Jinja2 template with arbitrary context.

    Args:
        template_name: Template filename (e.g., "my_agent.system.j2")
        **context: Arbitrary template variables

    Returns:
        Rendered template as string

    Example:
        >>> prompt = render_generic_prompt(
        ...     "marketplace_agent.system.j2",
        ...     user_input="show me cars",
        ...     budget=5000
        ... )
    """
    try:
        env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True
        )

        template = env.get_template(template_name)
        rendered = template.render(**context)

        logger.debug(
            "[Prompt Renderer] Rendered %s: %d chars",
            template_name,
            len(rendered)
        )

        return rendered

    except Exception as e:
        logger.error(
            "[Prompt Renderer] Failed to render %s: %s",
            template_name,
            e,
            exc_info=True
        )
        raise
