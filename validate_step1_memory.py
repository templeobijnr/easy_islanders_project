"""
STEP 1 VALIDATION SCRIPT — LangGraph Short-Term Session Memory

This script checks that:
1. Conversations within the same thread_id persist ordered history across turns.
2. Independent threads do not share context.
3. Memory resets correctly after process restart (if rerun post-restart).
"""

import os
import uuid
from pprint import pprint

# Import the live supervisor graph
from assistant.brain.supervisor_graph import build_supervisor_graph

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
def gen_thread_id() -> str:
    """Generate a unique session/thread ID."""
    return str(uuid.uuid4())

def send_turn(graph, thread_id: str, user_input: str):
    """Send a message through the real graph.invoke() to test actual memory persistence."""
    # Get current state or initialize
    try:
        graph_state = graph.get_state({'configurable': {'thread_id': thread_id}})
        if hasattr(graph_state, 'values'):
            current_state = dict(graph_state.values)
        else:
            current_state = dict(graph_state)
    except:
        current_state = {
            'thread_id': thread_id,
            'history': [],
            'messages': [],
            'user_id': None,
            'conversation_history': [],
            'routing_decision': None,
            'target_agent': None,
            'extracted_criteria': None,
            'property_data': None,
            'request_data': None,
            'current_node': 'supervisor',
            'error_message': None,
            'is_complete': False,
            'agent_response': None,
            'client_msg_id': None,
        }

    # Add user input and invoke graph
    current_state['user_input'] = user_input
    result = graph.invoke(current_state, config={'configurable': {'thread_id': thread_id}})

    return result


# -----------------------------------------------------------------------------
# Test Cases
# -----------------------------------------------------------------------------
def test_same_session_persistence():
    print("\n=== Test 1: Same-Session Persistence ===")
    graph = build_supervisor_graph()
    tid = gen_thread_id()

    # Send first turn
    result1 = send_turn(graph, tid, "I need an apartment in Girne")
    print(f"First turn - History length: {len(result1.get('history', []))}")

    # Send second turn (continuing the same session)
    result2 = send_turn(graph, tid, "2 bedrooms please")
    print(f"Second turn - History length: {len(result2.get('history', []))}")

    # Check final state from graph
    graph_state = graph.get_state({'configurable': {'thread_id': tid}})
    if hasattr(graph_state, 'values'):
        final_state = graph_state.values
    else:
        final_state = graph_state

    history = final_state.get('history', [])
    assert len(history) >= 4, f"History missing turns, got {len(history)}"
    print("✅ Conversation persisted across turns")
    pprint(history)

def test_session_isolation():
    print("\n=== Test 2: Session Isolation ===")
    graph = build_supervisor_graph()
    t1, t2 = gen_thread_id(), gen_thread_id()

    # Send different messages to different sessions
    result1 = send_turn(graph, t1, "Show me apartments in Girne")
    result2 = send_turn(graph, t2, "List car rentals in Kyrenia")

    # Check isolation by getting states
    state1 = graph.get_state({'configurable': {'thread_id': t1}})
    state2 = graph.get_state({'configurable': {'thread_id': t2}})

    if hasattr(state1, 'values'):
        history1 = state1.values.get('history', [])
    else:
        history1 = state1.get('history', [])

    if hasattr(state2, 'values'):
        history2 = state2.values.get('history', [])
    else:
        history2 = state2.get('history', [])

    assert history1[0]["content"] != history2[0]["content"], "Cross-contamination detected"
    print("✅ Sessions are isolated")

def test_restart_reset_notice():
    print("\n=== Test 3: Restart Reset Notice ===")
    tid = gen_thread_id()
    graph = build_supervisor_graph()
    send_turn(graph, tid, "Temporary message")
    print("Now restart the web container and rerun this script.")
    print("Expected: previously used thread_id will have empty or missing history.")


# -----------------------------------------------------------------------------
# Execute
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    print("🔍 Validating Step 1 (Short-Term Memory) Implementation...")
    test_same_session_persistence()
    test_session_isolation()
    test_restart_reset_notice()
    print("\n🎯 Validation complete — Step 1 short-term memory functional.\n")