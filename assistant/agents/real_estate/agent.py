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


# Prometheus Metrics (v1.1: Tenure-aware telemetry)
RE_REQUESTS_TOTAL = Counter(
    "agent_re_requests_total",
    "Total RE agent requests",
    ["intent", "tenure"]
)

RE_EXECUTION_SECONDS = Histogram(
    "agent_re_execution_duration_seconds",
    "RE agent execution time in seconds",
    ["tenure"],
    buckets=[0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
)

RE_SEARCH_RESULTS = Histogram(
    "agent_re_search_results_count",
    "Number of property results returned",
    ["tenure"],
    buckets=[0, 1, 2, 5, 10, 25, 50]
)

RE_ERRORS_TOTAL = Counter(
    "agent_re_errors_total",
    "RE agent errors",
    ["tenure", "error_type"]
)

RE_DB_QUERY_DURATION = Histogram(
    "agent_re_db_query_duration_seconds",
    "DB query execution time",
    ["tenure"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

RE_NO_RESULTS_TOTAL = Counter(
    "agent_re_no_results_total",
    "Searches returning zero results",
    ["tenure", "reason"]
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

    # Extract tenure for metrics (will be available after policy execution)
    tenure = "unknown"

    try:
        # Validate request
        validated_request = validate_request(request)

        # Execute policy with timeout check
        response = execute_policy(validated_request)

        # Extract tenure from response traces
        tenure = response.get("traces", {}).get("tenure", "unknown")

        # Increment request counter by intent and tenure
        intent = request.get("intent", "unknown")
        RE_REQUESTS_TOTAL.labels(intent=intent, tenure=tenure).inc()

        # Check timeout
        elapsed = time.time() - start_time
        if elapsed > MAX_EXECUTION_TIME_SECONDS:
            RE_ERRORS_TOTAL.labels(tenure=tenure, error_type="timeout").inc()
            raise TimeoutError(f"Execution exceeded {MAX_EXECUTION_TIME_SECONDS}s")

        # Validate response
        validated_response = validate_response(response)

        # Add execution metadata to traces
        if "traces" in validated_response:
            validated_response["traces"]["execution_time_seconds"] = elapsed
            validated_response["traces"]["thread_id"] = request["thread_id"]

        # Emit metrics: execution duration and search results count
        RE_EXECUTION_SECONDS.labels(tenure=tenure).observe(elapsed)

        # Track number of listings returned
        for action in response.get('actions', []):
            if action['type'] == 'show_listings':
                listings_count = len(action['params'].get('listings', []))
                RE_SEARCH_RESULTS.labels(tenure=tenure).observe(listings_count)
                # Track no results
                if listings_count == 0:
                    reason = "unknown"
                    if not response.get("traces", {}).get("extracted_params", {}).get("location"):
                        reason = "no_location"
                    elif not response.get("traces", {}).get("extracted_params", {}).get("budget"):
                        reason = "no_budget"
                    RE_NO_RESULTS_TOTAL.labels(tenure=tenure, reason=reason).inc()

        return validated_response

    except ValueError as e:
        # Validation error
        RE_ERRORS_TOTAL.labels(tenure=tenure, error_type="validation").inc()
        return AgentResponse(
            reply="Sorry, I encountered a validation error. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "validation", "tenure": tenure}
        )

    except TimeoutError as e:
        # Timeout error (already incremented above with tenure)
        return AgentResponse(
            reply="Sorry, the request took too long to process. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "timeout", "tenure": tenure}
        )

    except Exception as e:
        # Unexpected error
        RE_ERRORS_TOTAL.labels(tenure=tenure, error_type="unexpected").inc()
        return AgentResponse(
            reply="Sorry, something went wrong. Please try again.",
            actions=[
                {
                    "type": "error",
                    "params": {"message": str(e)}
                }
            ],
            traces={"error": str(e), "error_type": "unexpected", "tenure": tenure}
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
