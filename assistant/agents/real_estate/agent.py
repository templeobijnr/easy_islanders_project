"""
Real Estate Agent - LangGraph node wrapper.

Responsibilities:
- Validate AgentRequest schema
- Execute policy.execute_policy()
- Validate AgentResponse schema before returning
- Apply timeout and budget controls
- Emit top-level metrics

This is the entry point called by the supervisor.
"""

import time
from typing import Any

from assistant.agents.contracts import AgentRequest, AgentResponse
from assistant.agents.real_estate.policy import execute_policy
from prometheus_client import Counter, Histogram


# Prometheus Metrics (Step 2: Telemetry)
RE_REQUESTS_TOTAL = Counter(
    "agent_re_requests_total",
    "Total RE agent requests",
    ["intent"]
)

RE_EXECUTION_SECONDS = Histogram(
    "agent_re_execution_duration_seconds",
    "RE agent execution time in seconds",
    buckets=[0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
)

RE_SEARCH_RESULTS = Histogram(
    "agent_re_search_results_count",
    "Number of property results returned",
    buckets=[0, 1, 2, 5, 10, 25, 50]
)

RE_ERRORS_TOTAL = Counter(
    "agent_re_errors_total",
    "RE agent errors",
    ["error_type"]
)


# Configuration
MAX_EXECUTION_TIME_SECONDS = 10.0  # Hard timeout
ENABLE_SCHEMA_VALIDATION = True    # JSON schema validation


def validate_request(request: dict[str, Any]) -> AgentRequest:
    """
    Validate AgentRequest against schema.

    S2: Basic type checking
    S3: Full JSON schema validation

    Args:
        request: Raw request dict

    Returns:
        Validated AgentRequest

    Raises:
        ValueError: If validation fails
    """
    # S2: Simple type checks
    required_fields = ["thread_id", "client_msg_id", "intent", "input", "ctx"]
    for field in required_fields:
        if field not in request:
            raise ValueError(f"Missing required field: {field}")

    # S3: Add full JSON schema validation
    # import jsonschema
    # jsonschema.validate(request, AGENT_REQUEST_SCHEMA)

    return request  # type: ignore


def validate_response(response: AgentResponse) -> AgentResponse:
    """
    Validate AgentResponse against schema before returning.

    Critical: This prevents sending malformed data to frontend.

    Args:
        response: AgentResponse from policy

    Returns:
        Validated AgentResponse

    Raises:
        ValueError: If validation fails
    """
    if not ENABLE_SCHEMA_VALIDATION:
        return response

    # S2: Basic checks
    if "reply" not in response or not isinstance(response["reply"], str):
        raise ValueError("AgentResponse missing 'reply' string field")

    if "actions" not in response or not isinstance(response["actions"], list):
        raise ValueError("AgentResponse missing 'actions' list field")

    # Validate each action
    for action in response["actions"]:
        if "type" not in action:
            raise ValueError("AgentAction missing 'type' field")

        valid_types = ["show_listings", "ask_clarification", "answer_qa", "error"]
        if action["type"] not in valid_types:
            raise ValueError(f"Invalid action type: {action['type']}")

        if "params" not in action:
            raise ValueError("AgentAction missing 'params' field")

    # S3: Full JSON schema validation
    # import jsonschema
    # jsonschema.validate(response, AGENT_RESPONSE_SCHEMA)

    return response


def handle_real_estate_request(request: dict[str, Any]) -> AgentResponse:
    """
    Main entry point for Real Estate Agent.

    Called by supervisor with AgentRequest.

    Flow:
    1. Validate request schema
    2. Start timeout timer
    3. Execute policy state machine
    4. Validate response schema
    5. Emit metrics
    6. Return response

    Args:
        request: Raw AgentRequest dict from supervisor

    Returns:
        AgentResponse with reply, actions, and traces

    Raises:
        ValueError: If request/response validation fails
        TimeoutError: If execution exceeds MAX_EXECUTION_TIME_SECONDS

    Metrics:
        - agent_re_requests_total (counter)
        - agent_re_execution_duration_seconds (histogram)
        - agent_re_errors_total (counter, labels: error_type)
    """
    start_time = time.time()

    # Increment request counter by intent
    intent = request.get("intent", "unknown")
    RE_REQUESTS_TOTAL.labels(intent=intent).inc()

    try:
        # Validate request
        validated_request = validate_request(request)

        # Execute policy with timeout check
        response = execute_policy(validated_request)

        # Check timeout
        elapsed = time.time() - start_time
        if elapsed > MAX_EXECUTION_TIME_SECONDS:
            RE_ERRORS_TOTAL.labels(error_type="timeout").inc()
            raise TimeoutError(f"Execution exceeded {MAX_EXECUTION_TIME_SECONDS}s")

        # Validate response
        validated_response = validate_response(response)

        # Add execution metadata to traces
        if "traces" in validated_response:
            validated_response["traces"]["execution_time_seconds"] = elapsed
            validated_response["traces"]["thread_id"] = request["thread_id"]

        # Emit metrics: execution duration and search results count
        RE_EXECUTION_SECONDS.observe(elapsed)

        # Track number of listings returned
        for action in response.get('actions', []):
            if action['type'] == 'show_listings':
                listings_count = len(action['params'].get('listings', []))
                RE_SEARCH_RESULTS.observe(listings_count)

        return validated_response

    except ValueError as e:
        # Validation error
        RE_ERRORS_TOTAL.labels(error_type="validation").inc()
        return AgentResponse(
            reply="Sorry, I encountered a validation error. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "validation"}
        )

    except TimeoutError as e:
        # Timeout error
        RE_ERRORS_TOTAL.labels(error_type="timeout").inc()
        return AgentResponse(
            reply="Sorry, the request took too long to process. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "timeout"}
        )

    except Exception as e:
        # Unexpected error
        RE_ERRORS_TOTAL.labels(error_type="unexpected").inc()
        return AgentResponse(
            reply="Sorry, something went wrong. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "unexpected"}
        )


# LangGraph node interface (S3)
def real_estate_node(state: dict[str, Any]) -> dict[str, Any]:
    """
    LangGraph node wrapper for real estate agent.

    S3: Integrate with full LangGraph supervisor.

    Args:
        state: LangGraph state dict containing AgentRequest

    Returns:
        LangGraph state dict with AgentResponse
    """
    request = state.get("agent_request")
    if not request:
        raise ValueError("LangGraph state missing 'agent_request'")

    response = handle_real_estate_request(request)

    return {
        **state,
        "agent_response": response,
    }
