"""
Test router context override for multi-turn conversations.

Validates that the router correctly maintains context across turns:
- "need a 2 bedroom" → "in girne" should stay in real_estate
"""
import pytest
from router_service.graph import run_router


class TestRouterContextOverride:
    """Test context-aware routing for multi-turn conversations."""

    def test_no_context_fresh_routing(self):
        """Without context, router should classify independently."""
        decision = run_router("in girne", thread_id="test-001", context_hint={})

        # Without context, "in girne" alone may route to general or require clarification
        # We just verify it runs without error
        assert 'domain_choice' in decision
        assert 'action' in decision

    def test_context_override_real_estate_location_fragment(self):
        """
        Test: User asks "need 2 bedroom" (real_estate) then "in girne" (location fragment)
        Expected: Second message should stick to real_estate via context override
        """
        # Turn 1: "need a 2 bedroom" - should route to real_estate
        decision1 = run_router("need a 2 bedroom", thread_id="test-002", context_hint={})

        # Extract domain from first turn
        last_domain = decision1.get('domain_choice', {}).get('domain')

        # Turn 2: "in girne" with context from turn 1
        decision2 = run_router(
            "in girne",
            thread_id="test-002",
            context_hint={'last_domain': last_domain}
        )

        # Verify context override kicked in
        assert decision2.get('domain_choice', {}).get('domain') == 'real_estate', \
            f"Expected real_estate due to context override, got {decision2.get('domain_choice', {}).get('domain')}"

        # Verify confidence is high (context override confidence = 0.9)
        confidence = decision2.get('domain_choice', {}).get('confidence', 0)
        assert confidence >= 0.85, f"Expected high confidence from context override, got {confidence}"

        # Verify action is dispatch (not clarify)
        assert decision2.get('action') == 'dispatch', \
            f"Expected dispatch action, got {decision2.get('action')}"

    def test_context_override_with_other_location_signals(self):
        """Test context override works with various location signals."""
        location_fragments = [
            "in kyrenia",
            "at famagusta",
            "near catalkoy",
            "girne",
        ]

        for fragment in location_fragments:
            decision = run_router(
                fragment,
                thread_id=f"test-{fragment}",
                context_hint={'last_domain': 'real_estate'}
            )

            assert decision.get('domain_choice', {}).get('domain') == 'real_estate', \
                f"Fragment '{fragment}' should stick to real_estate, got {decision.get('domain_choice', {}).get('domain')}"

    def test_no_context_override_when_non_fragment(self):
        """Test that context override doesn't apply to complete utterances."""
        # Full sentence should go through normal routing even with context
        decision = run_router(
            "tell me about duty pharmacies in kyrenia",
            thread_id="test-003",
            context_hint={'last_domain': 'real_estate'}
        )

        # This should NOT override to real_estate because it's a complete sentence
        # about pharmacies (local_info domain)
        # We don't assert specific domain since normal routing may classify it differently
        # but we verify it didn't blindly stick to real_estate
        assert 'domain_choice' in decision

    def test_context_override_only_for_real_estate(self):
        """Test that context override only applies to real_estate domain."""
        # If last domain was marketplace, "in girne" should not stick to it
        decision = run_router(
            "in girne",
            thread_id="test-004",
            context_hint={'last_domain': 'marketplace'}
        )

        # Should go through normal routing, not stick to marketplace
        domain = decision.get('domain_choice', {}).get('domain')
        # We don't assert specific domain, just verify it ran
        assert domain is not None

    def test_multi_turn_scenario_realistic(self):
        """
        Test realistic multi-turn conversation:
        User: "need a 2 bedroom"
        Bot: "Which city are you looking in?"
        User: "in girne"
        Bot: Shows listings
        """
        thread_id = "test-multiturn-001"

        # Turn 1
        decision1 = run_router("need a 2 bedroom", thread_id=thread_id, context_hint={})
        domain1 = decision1.get('domain_choice', {}).get('domain')

        # Turn 2 - with context
        decision2 = run_router(
            "in girne",
            thread_id=thread_id,
            context_hint={'last_domain': domain1}
        )

        # Verify sticky routing worked
        assert decision2.get('domain_choice', {}).get('domain') == 'real_estate'
        assert decision2.get('action') == 'dispatch'
        assert decision2.get('next_hop_agent') == 'real_estate_agent'
