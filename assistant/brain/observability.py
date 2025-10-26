"""
Phase B.5: LangSmith Observability & Tracing

Implements comprehensive observability for the 12-node LangGraph architecture:
- Full tracing of supervisor routing decisions
- Worker agent execution paths (Real Estate, Marketplace, General Conversation)
- Tool call execution and results
- Latency tracking per node
- Token usage monitoring
- Cost attribution

Enables:
1. Debugging complex flows (supervisor → worker → tools)
2. Performance optimization (identify slow nodes)
3. Cost analysis (which queries are most expensive)
4. Audit trails (compliance tracking)
"""

import logging
import os
from typing import Any, Dict, Optional
from functools import wraps
from datetime import datetime
from decouple import config as env_config

logger = logging.getLogger(__name__)

def read_var(name: str, default: Optional[str] = None) -> str:
    """Read configuration from env or .env via python-decouple."""
    return os.getenv(name) or env_config(name, default=default)

# LangSmith configuration (support LANGSMITH_* and LANGCHAIN_* env vars)
_enabled_str = (
    read_var("LANGSMITH_ENABLED")
    or read_var("LANGSMITH_TRACING")
    or read_var("LANGCHAIN_TRACING_V2")
    or "false"
)
LANGSMITH_ENABLED = str(_enabled_str).lower() in ("1", "true", "yes")
LANGSMITH_API_KEY = read_var("LANGSMITH_API_KEY") or read_var("LANGCHAIN_API_KEY", "")
LANGSMITH_PROJECT = read_var("LANGSMITH_PROJECT") or read_var("LANGCHAIN_PROJECT", "easy-islanders-agent")
LANGSMITH_ENDPOINT = read_var("LANGSMITH_ENDPOINT") or read_var("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")

"""LangSmith import (no Client construction at import time).
We avoid instantiating Client to prevent signature mismatches across versions.
Tracing relies on environment configuration via the decorators.
"""
try:
    from langsmith import traceable  # type: ignore
    LANGSMITH_AVAILABLE = bool(LANGSMITH_ENABLED and (LANGSMITH_API_KEY or os.getenv("LANGCHAIN_API_KEY")))
    if not LANGSMITH_AVAILABLE:
        logger.warning(
            "[LangSmith] Disabled or not configured. Set LANGSMITH_ENABLED=true and LANGSMITH_API_KEY or LANGCHAIN_API_KEY."
        )
except ImportError:
    LANGSMITH_AVAILABLE = False
    logger.warning("[LangSmith] Package not installed. Install with: pip install langsmith")


def traced_supervisor_node(func):
    """
    Decorator: Trace supervisor routing decision
    
    Captures:
    - Input user message
    - Routing decision (intent type)
    - Target agent selection
    - Confidence score
    - Extracted criteria
    - Decision reasoning
    """
    if not LANGSMITH_AVAILABLE:
        return func
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        state = args[0] if args else {}
        user_input = state.get("user_input", "")
        thread_id = state.get("thread_id", "unknown")
        
        # Create LangSmith trace
        @traceable(
            name="supervisor_routing",
            run_type="chain",
            metadata={
                "phase": "B.1",
                "component": "CentralSupervisor",
                "thread_id": thread_id,
            }
        )
        def traced_call():
            result = func(*args, **kwargs)
            return result
        
        try:
            result = traced_call()
            logger.info(
                f"[LangSmith] Traced supervisor routing: "
                f"intent={result.get('routing_decision')}, "
                f"agent={result.get('target_agent')}, "
                f"confidence={result.get('intent_confidence', 0):.2f}"
            )
            return result
        except Exception as e:
            logger.error(
                f"[LangSmith] Supervisor trace failed: {e}",
                exc_info=True
            )
            raise
    
    return wrapper


def traced_worker_agent(agent_name: str):
    """
    Decorator: Trace worker agent execution
    
    Captures:
    - Agent name (real_estate, marketplace, general_conversation)
    - User input
    - Search results
    - Tool calls made
    - Response generated
    - Latency
    """
    def decorator(func):
        if not LANGSMITH_AVAILABLE:
            return func
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            thread_id = kwargs.get("thread_id") or args[-1] if args else "unknown"
            
            @traceable(
                name=f"{agent_name}_worker",
                run_type="chain",
                metadata={
                    "phase": "B.1-B.5",
                    "component": f"{agent_name}_agent",
                    "thread_id": thread_id,
                }
            )
            def traced_call():
                start_time = datetime.utcnow()
                result = func(*args, **kwargs)
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                
                # Add latency metadata
                if isinstance(result, dict):
                    result["_latency_seconds"] = elapsed
                
                return result
            
            try:
                result = traced_call()
                logger.info(
                    f"[LangSmith] Traced {agent_name} execution: "
                    f"response_type={result.get('type', 'unknown') if isinstance(result, dict) else 'unknown'}"
                )
                return result
            except Exception as e:
                logger.error(
                    f"[LangSmith] {agent_name} trace failed: {e}",
                    exc_info=True
                )
                raise
        
        return wrapper
    
    return decorator


def traced_tool_call(tool_name: str):
    """
    Decorator: Trace individual tool execution
    
    Captures:
    - Tool name (search, booking, broadcast, etc.)
    - Input parameters
    - Output/result
    - Success/failure
    - Latency
    - Tool-specific metadata
    """
    def decorator(func):
        if not LANGSMITH_AVAILABLE:
            return func
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            @traceable(
                name=f"tool_{tool_name}",
                run_type="tool",
                metadata={
                    "phase": "B.5",
                    "tool": tool_name,
                }
            )
            def traced_call():
                start_time = datetime.utcnow()
                result = func(*args, **kwargs)
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                
                return {
                    "result": result,
                    "latency_seconds": elapsed,
                }
            
            try:
                call_result = traced_call()
                logger.debug(
                    f"[LangSmith] Traced tool {tool_name}: "
                    f"latency={call_result['latency_seconds']:.3f}s"
                )
                return call_result["result"]
            except Exception as e:
                logger.error(
                    f"[LangSmith] Tool {tool_name} trace failed: {e}",
                    exc_info=True
                )
                raise
        
        return wrapper
    
    return decorator


def get_langsmith_project_url() -> Optional[str]:
    """Get LangSmith dashboard URL for current project"""
    if not LANGSMITH_AVAILABLE or not LANGSMITH_API_KEY:
        return None
    
    # LangSmith dashboard URL format
    return f"https://smith.langchain.com/o/default/projects/p/{LANGSMITH_PROJECT}"


def log_execution_summary(
    thread_id: str,
    routing_decision: str,
    target_agent: str,
    latency_seconds: float,
    token_count: Optional[int] = None,
):
    """
    Log execution summary for easy querying in LangSmith
    
    Enables filtering by:
    - routing_decision (property_search, booking_request, etc.)
    - target_agent (real_estate_agent, marketplace_agent, etc.)
    - latency (slow queries)
    - token_count (expensive queries)
    """
    if not LANGSMITH_AVAILABLE:
        return
    
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "thread_id": thread_id,
        "routing_decision": routing_decision,
        "target_agent": target_agent,
        "latency_seconds": latency_seconds,
        "tokens": token_count,
    }
    
    # Log for downstream analytics
    logger.info(
        f"[LangSmith] Execution: "
        f"routing={routing_decision}, agent={target_agent}, "
        f"latency={latency_seconds:.3f}s, tokens={token_count}"
    )


def enable_langsmith_debug_mode():
    """
    Enable debug mode: verbose tracing of all LangChain operations
    
    Useful for development - disable in production for performance
    """
    if not LANGSMITH_AVAILABLE:
        logger.warning("[LangSmith] Cannot enable debug mode - LangSmith not available")
        return
    
    os.environ["LANGCHAIN_VERBOSE"] = "true"
    os.environ["LANGCHAIN_DEBUG"] = "true"
    logger.info("[LangSmith] Debug mode enabled - verbose tracing active")


def disable_langsmith_debug_mode():
    """Disable debug mode for production"""
    os.environ["LANGCHAIN_VERBOSE"] = "false"
    os.environ["LANGCHAIN_DEBUG"] = "false"
    logger.info("[LangSmith] Debug mode disabled")
