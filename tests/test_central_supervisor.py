import pytest
from unittest.mock import patch

from assistant.brain.supervisor_schemas import SupervisorRoutingDecision, SupervisorState


def base_state(text: str) -> SupervisorState:
    return {
        'user_input': text,
        'thread_id': 'thread-123',
        'messages': [],
        'user_id': None,
        'conversation_history': [],
        'routing_decision': None,
        'target_agent': None,
        'extracted_criteria': None,
        'property_data': None,
        'request_data': None,
        'current_node': '',
        'error_message': None,
        'is_complete': False,
    }


def test_route_real_estate_high_confidence():
    state = base_state("I need a 2 bedroom apartment in Kyrenia")
    mock_decision = SupervisorRoutingDecision(
        primary_domain="REAL_ESTATE",
        secondary_domain=None,
        confidence_score=0.95,
        extracted_entities={"location": "Kyrenia", "bedrooms": 2},
        reasoning="Clear real estate intent",
        requires_clarification=False,
    )

    with patch('assistant.brain.supervisor.ChatOpenAI') as MockLLM:
        from assistant.brain.supervisor import CentralSupervisor
        mock_llm_instance = MockLLM.return_value
        mock_structured = mock_llm_instance.with_structured_output.return_value
        mock_structured.invoke.return_value = mock_decision
        sup = CentralSupervisor()
        result = sup.route_request(state)
        assert result['target_agent'] == 'real_estate_agent'


def test_route_marketplace_high_confidence():
    state = base_state("I want to buy an iPhone 15")
    mock_decision = SupervisorRoutingDecision(
        primary_domain="NON_RE_MARKETPLACE",
        secondary_domain=None,
        confidence_score=0.92,
        extracted_entities={"product": "iPhone 15"},
        reasoning="Clear product intent",
        requires_clarification=False,
    )

    with patch('assistant.brain.supervisor.ChatOpenAI') as MockLLM:
        from assistant.brain.supervisor import CentralSupervisor
        mock_llm_instance = MockLLM.return_value
        mock_structured = mock_llm_instance.with_structured_output.return_value
        mock_structured.invoke.return_value = mock_decision
        sup = CentralSupervisor()
        result = sup.route_request(state)
        assert result['target_agent'] == 'marketplace_agent'


def test_route_ambiguous_medium_confidence():
    state = base_state("I need a car for my new apartment")
    mock_decision = SupervisorRoutingDecision(
        primary_domain="REAL_ESTATE",
        secondary_domain="NON_RE_MARKETPLACE",
        confidence_score=0.75,
        extracted_entities={"primary": "apartment", "secondary": "car"},
        reasoning="Ambiguous multi-intent",
        requires_clarification=True,
    )

    with patch('assistant.brain.supervisor.ChatOpenAI') as MockLLM:
        from assistant.brain.supervisor import CentralSupervisor
        mock_llm_instance = MockLLM.return_value
        mock_structured = mock_llm_instance.with_structured_output.return_value
        mock_structured.invoke.return_value = mock_decision
        sup = CentralSupervisor()
        result = sup.route_request(state)
        assert result['target_agent'] == 'real_estate_agent'


def test_route_low_confidence_fallback():
    state = base_state("blah blah unclear")
    mock_decision = SupervisorRoutingDecision(
        primary_domain="GENERAL_CONVERSATION",
        secondary_domain=None,
        confidence_score=0.45,
        extracted_entities={},
        reasoning="Unclear",
        requires_clarification=True,
    )

    with patch('assistant.brain.supervisor.ChatOpenAI') as MockLLM:
        from assistant.brain.supervisor import CentralSupervisor
        mock_llm_instance = MockLLM.return_value
        mock_structured = mock_llm_instance.with_structured_output.return_value
        mock_structured.invoke.return_value = mock_decision
        sup = CentralSupervisor()
        result = sup.route_request(state)
        assert result['target_agent'] == 'general_conversation_agent'


