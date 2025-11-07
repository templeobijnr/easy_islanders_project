"""
Prompt rendering package for Real Estate Agent.

This package contains the Jinja2 template renderer and templates for the
prompt-driven Real Estate Agent conversation flow.
"""

from assistant.brain.prompts.renderer import (
    render_real_estate_prompt,
    parse_real_estate_response,
    render_generic_prompt,
)

# Alias for backward compatibility (if anything imports render_prompt)
render_prompt = render_generic_prompt

__all__ = [
    "render_real_estate_prompt",
    "parse_real_estate_response",
    "render_generic_prompt",
    "render_prompt",  # Alias
]
