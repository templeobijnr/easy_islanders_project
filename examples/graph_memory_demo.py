#!/usr/bin/env python3
"""
End-to-End Demo: Dual-Layer Memory (Session + Graph)

This script demonstrates how Session Memory (Zep v2) and Graph Memory (Zep v3)
work together to provide both short-term conversational context and long-term
user preferences.

Scenario:
    Day 1: User searches for "2BR in Girne for £600"
           → Session: Stores recent conversation
           → Graph: Stores long-term preferences

    Day 2: User returns and says "Show me apartments"
           → Session: Empty (new session)
           → Graph: Retrieves stored preferences from Day 1
           → Agent: Pre-fills location, bedrooms, budget from Graph

Usage:
    python3 examples/graph_memory_demo.py
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'easy_islanders.settings.development')
django.setup()

from assistant.memory.graph_manager import get_graph_manager
from assistant.brain.zep_client import ZepClient


def print_header(text):
    """Pretty print section headers."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_step(number, text):
    """Pretty print step numbers."""
    print(f"\n[Step {number}] {text}")
    print("-" * 70)


def demo_day_1_initial_search():
    """Day 1: User provides search criteria for first time."""
    print_header("DAY 1: Initial Search")

    user_id = f"demo_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    thread_id_day1 = f"thread_day1_{user_id}"

    print(f"User ID: {user_id}")
    print(f"Thread ID (Day 1): {thread_id_day1}")

    # Simulate user message
    user_message = "I need a 2-bedroom apartment in Girne for around £600 per month"
    print(f"\nUser: \"{user_message}\"")

    # Step 1: Extract slots from user input
    print_step(1, "Extract Slots from User Input")
    extracted_slots = {
        "location": "Girne",
        "bedrooms": 2,
        "budget": 600,
        "budget_currency": "GBP",
        "rental_type": "long_term"
    }
    print(f"Extracted slots: {extracted_slots}")

    # Step 2: Store to Session Memory (Zep v2)
    print_step(2, "Store to Session Memory (Zep v2)")
    try:
        zep_client = ZepClient(
            base_url=os.getenv("ZEP_URL"),
            api_key=os.getenv("ZEP_API_KEY")
        )
        zep_client.add_memory(
            session_id=thread_id_day1,
            role="user",
            content=user_message
        )
        print("✅ Stored to session memory")
        print(f"   Session ID: {thread_id_day1}")
    except Exception as e:
        print(f"⚠️  Session memory storage failed: {e}")
        print("   (Continuing with Graph only...)")

    # Step 3: Store to Graph Memory (Zep v3)
    print_step(3, "Store to Graph Memory (Zep v3)")

    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        print("❌ GraphManager not available")
        print("   Check ZEP_API_KEY and zep-cloud SDK installation")
        return None

    stored_count = 0
    for slot_name, value in extracted_slots.items():
        try:
            graph_mgr.store_user_preference(
                user_id=user_id,
                preference_type=slot_name,
                value=str(value),
                confidence=0.9
            )
            print(f"   ✓ Stored: {user_id} —[prefers_{slot_name}]→ {value}")
            stored_count += 1
        except Exception as e:
            print(f"   ✗ Failed to store {slot_name}: {e}")

    print(f"\n✅ Stored {stored_count} preferences to Graph")

    # Step 4: Agent responds
    print_step(4, "Agent Responds")
    agent_response = (
        "Great! I'll search for 2-bedroom apartments in Girne "
        "with a monthly budget of £600. One moment please..."
    )
    print(f"Agent: \"{agent_response}\"")

    # Store agent response to session memory
    try:
        zep_client.add_memory(
            session_id=thread_id_day1,
            role="assistant",
            content=agent_response
        )
        print("✅ Agent response stored to session memory")
    except Exception as e:
        print(f"⚠️  Failed to store agent response: {e}")

    print(f"\n{'─' * 70}")
    print("📊 Day 1 Summary:")
    print(f"   - Session Memory: {len([user_message, agent_response])} messages")
    print(f"   - Graph Memory: {stored_count} preference facts")
    print(f"   - User will return tomorrow with new session...")

    return user_id


def demo_day_2_returning_user(user_id):
    """Day 2: User returns in new session, preferences recalled from Graph."""
    print_header("DAY 2: Returning User (New Session)")

    thread_id_day2 = f"thread_day2_{user_id}"
    print(f"User ID: {user_id} (same user)")
    print(f"Thread ID (Day 2): {thread_id_day2} (NEW session)")

    # Simulate user message
    user_message = "Show me apartments"
    print(f"\nUser: \"{user_message}\"")
    print("   (No location, bedrooms, or budget specified!)")

    # Step 1: Check Session Memory (will be empty - new thread)
    print_step(1, "Check Session Memory")
    print("   Session is EMPTY (new thread started)")
    print("   No recent conversation context available")

    # Step 2: Retrieve from Graph Memory
    print_step(2, "Retrieve from Graph Memory")

    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        print("❌ GraphManager not available")
        return

    try:
        prefs = graph_mgr.get_user_preferences(user_id=user_id)

        if not prefs:
            print("   ⚠️  No preferences found in Graph")
            return

        # Parse preferences
        parsed_prefs = {}
        for edge in prefs:
            fact = edge.get("fact", "")
            target = edge.get("target", "")
            if fact.startswith("prefers_"):
                pref_type = fact[8:]
                parsed_prefs[pref_type] = target

        print(f"   ✅ Retrieved {len(parsed_prefs)} preferences from Graph:")
        for pref_type, value in parsed_prefs.items():
            print(f"      - {pref_type}: {value}")

    except Exception as e:
        print(f"   ❌ Graph retrieval failed: {e}")
        return

    # Step 3: Pre-fill Slots from Graph
    print_step(3, "Pre-fill Slots from Graph Preferences")

    prefilled_slots = {
        "location": parsed_prefs.get("location"),
        "bedrooms": int(parsed_prefs.get("bedrooms", 0)),
        "budget": int(parsed_prefs.get("budget", 0)),
        "budget_currency": parsed_prefs.get("budget_currency"),
        "rental_type": parsed_prefs.get("rental_type")
    }

    print("   Pre-filled slots:")
    for slot, value in prefilled_slots.items():
        if value:
            print(f"      ✓ {slot} = {value} (from Graph)")

    # Step 4: Agent responds with remembered preferences
    print_step(4, "Agent Responds (Context-Aware)")

    agent_response = (
        f"Welcome back! I remember you were looking for "
        f"{prefilled_slots['bedrooms']}-bedroom apartments in "
        f"{prefilled_slots['location']} around "
        f"{prefilled_slots['budget_currency']}{prefilled_slots['budget']} per month. "
        f"Shall I show you the latest options matching these criteria?"
    )
    print(f"Agent: \"{agent_response}\"")

    # Step 5: Context Fusion (what agent sees)
    print_step(5, "Context Fusion (Agent's View)")

    fused_context = f"""
[Active Domain: real_estate_agent]

[User Preferences (Graph)]:
- location: {prefilled_slots['location']}
- bedrooms: {prefilled_slots['bedrooms']}
- budget: {prefilled_slots['budget']}
- budget_currency: {prefilled_slots['budget_currency']}
- rental_type: {prefilled_slots['rental_type']}

[Recent Conversation]:
User: {user_message}
    """

    print("Agent sees this context:")
    print(fused_context)

    print(f"\n{'─' * 70}")
    print("📊 Day 2 Summary:")
    print("   - Session Memory: EMPTY (new session)")
    print("   - Graph Memory: RECALLED all preferences")
    print("   - Result: Seamless personalization across sessions ✨")


def demo_preference_update(user_id):
    """Demonstrate preference updates."""
    print_header("BONUS: Preference Update")

    print(f"User ID: {user_id}")
    print(f"\nUser: \"Actually, I prefer Lefkoşa now\"")

    # Update preference
    print_step(1, "Update Preference in Graph")

    graph_mgr = get_graph_manager()
    try:
        graph_mgr.store_user_preference(
            user_id=user_id,
            preference_type="location",
            value="Lefkoşa",
            confidence=0.95
        )
        print(f"   ✓ Updated: {user_id} —[prefers_location]→ Lefkoşa")
        print("   (Previous preference for Girne still exists but with earlier timestamp)")

    except Exception as e:
        print(f"   ✗ Update failed: {e}")
        return

    # Retrieve updated preferences
    print_step(2, "Retrieve Updated Preferences")

    prefs = graph_mgr.get_user_preferences(user_id=user_id, preference_type="location")
    print(f"   Retrieved {len(prefs)} location preferences:")
    for pref in prefs:
        target = pref.get("target", "")
        valid_from = pref.get("valid_from", "")
        print(f"      - {target} (from: {valid_from})")

    print("\n   Most recent preference (Lefkoşa) will be used for searches")


def main():
    """Run complete demo."""
    print("\n" + "=" * 70)
    print("  DUAL-LAYER MEMORY DEMO: Session + Graph")
    print("  Demonstrates long-term preference persistence")
    print("=" * 70)

    # Check prerequisites
    print("\n🔍 Checking Prerequisites...")

    if not os.getenv("ZEP_API_KEY"):
        print("❌ ZEP_API_KEY not set in environment")
        print("   Set it in .env.dev file")
        return

    graph_mgr = get_graph_manager()
    if graph_mgr is None:
        print("❌ GraphManager not available")
        print("   Install: pip install zep-cloud")
        return

    print("✅ All prerequisites met\n")

    # Run demo
    input("Press ENTER to start Day 1 demo...")
    user_id = demo_day_1_initial_search()

    if user_id:
        input("\nPress ENTER to continue to Day 2 demo...")
        demo_day_2_returning_user(user_id)

        input("\nPress ENTER to see preference update demo...")
        demo_preference_update(user_id)

    # Final summary
    print_header("DEMO COMPLETE")
    print("Key Takeaways:")
    print("  ✓ Session Memory: Short-term context within a conversation")
    print("  ✓ Graph Memory: Long-term preferences across sessions")
    print("  ✓ Both work together for personalized, context-aware agents")
    print("\nNext Steps:")
    print("  1. Run: python3 scripts/test_graph_memory.py")
    print("  2. Initialize: python3 manage.py init_zep_graphs")
    print("  3. Test live: Start Django server and chat with agent")
    print()


if __name__ == "__main__":
    main()
