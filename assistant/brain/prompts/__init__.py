"""
Prompt rendering package for Real Estate Agent.

This package contains the Jinja2 template renderer and templates for the
prompt-driven Real Estate Agent conversation flow.
"""

from assistant.brain.prompts.renderer import render_prompt

__all__ = ["render_prompt"]
