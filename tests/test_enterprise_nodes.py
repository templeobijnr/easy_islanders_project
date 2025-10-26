"""
Unit Tests for Enterprise Agent Nodes
Tests all 12 nodes with happy path, error cases, and edge cases
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model

from assistant.brain.enterprise_graph import (
    language_preprocessor_node,
    guardrail_refusal_node,
    self_evaluation_reflection_node,
    nlu_node,
    intent_routing_node,
    retrieval_node,
    synthesis_node,
    capture_lead_node,
    hitl_approval_node,
    broadcast_node,
    booking_node,
    long_term_node,
    EnterpriseAgentState
)
from assistant.brain.enterprise_schemas import EnterpriseIntentResult

User = get_user_model()

class TestEnterpriseNodes(TestCase):
    """Test suite for all 12 enterprise nodes"""
    
    def setUp(self):
        """Set up test data"""
        self.base_state = {
            'conversation_id': 'test-conv-123',
            'user_input': 'I need a 2 bedroom apartment in Girne',
            'user_language': 'en',
            'output_language': 'en',
            'guardrail_passed': True,
            'guardrail_reason': None,
            'intent_result': None,
            'routing_decision': None,
            'internal_search_results': [],
            'external_search_results': [],
            'retrieval_quality_score': None,
            'request_data': None,
            'request_id': None,
            'hitl_approval_required': False,
            'hitl_approval_id': None,
            'synthesis_data': None,
            'final_response': None,
            'recommendations': [],
            'self_evaluation_score': None,
            'needs_retry': False,
            'retry_count': 0
        }
    
    # ============================================================================
    # INFRASTRUCTURE NODES (3)
    # ============================================================================
    
    def test_language_preprocessor_node_happy_path(self):
        """Test language preprocessing with English input"""
        state = self.base_state.copy()
        result = language_preprocessor_node(state)
        
        assert result['user_language'] == 'en'
        assert result['output_language'] == 'en'
        assert 'conversation_id' in result
    
    def test_language_preprocessor_node_turkish_input(self):
        """Test language preprocessing with Turkish input"""
        state = self.base_state.copy()
        state['user_input'] = 'Merhaba, Girne\'de 2 yatak odalı daire arıyorum'
        
        result = language_preprocessor_node(state)
        
        assert result['user_language'] == 'tr'
        assert result['output_language'] == 'tr'
    
    def test_language_preprocessor_node_error_handling(self):
        """Test language preprocessing with empty input"""
        state = self.base_state.copy()
        state['user_input'] = ''
        
        result = language_preprocessor_node(state)
        
        # Should default to English
        assert result['user_language'] == 'en'
        assert result['output_language'] == 'en'
    
    def test_guardrail_refusal_node_clean_input(self):
        """Test guardrail with clean input"""
        state = self.base_state.copy()
        
        with patch('assistant.brain.enterprise_graph.run_enterprise_guardrails') as mock_guardrails:
            mock_guardrails.return_value = Mock(passed=True)
            
            result = guardrail_refusal_node(state)
            
            assert result['guardrail_passed'] == True
            assert result['guardrail_reason'] is None
    
    def test_guardrail_refusal_node_toxic_input(self):
        """Test guardrail with toxic input"""
        state = self.base_state.copy()
        state['user_input'] = 'This is fucking stupid'
        
        with patch('assistant.brain.enterprise_graph.run_enterprise_guardrails') as mock_guardrails:
            mock_result = Mock()
            mock_result.passed = False
            mock_result.reason = 'Toxic content detected'
            mock_result.risk_level = 'high'
            mock_guardrails.return_value = mock_result
            
            result = guardrail_refusal_node(state)
            
            assert result['guardrail_passed'] == False
            assert result['guardrail_reason'] == 'Toxic content detected'
            assert result['routing_decision'] == 'REFUSAL'
    
    def test_guardrail_refusal_node_error_handling(self):
        """Test guardrail with error in guardrail system"""
        state = self.base_state.copy()
        
        with patch('assistant.brain.enterprise_graph.run_enterprise_guardrails') as mock_guardrails:
            mock_guardrails.side_effect = Exception("Guardrail system error")
            
            result = guardrail_refusal_node(state)
            
            # Should handle error gracefully
            assert 'error' in result or result['guardrail_passed'] == True
    
    def test_self_evaluation_reflection_node_high_quality(self):
        """Test self-evaluation with high quality results"""
        state = self.base_state.copy()
        state['internal_search_results'] = [{'title': 'Test Property', 'relevance_score': 0.9}]
        state['external_search_results'] = [{'title': 'External Info', 'relevance_score': 0.8}]
        state['synthesis_data'] = {'response': 'Great property match'}
        
        with patch('assistant.brain.enterprise_graph.assess_enterprise_quality') as mock_assess:
            mock_assessment = Mock()
            mock_assessment.needs_retry = False
            mock_assessment.overall_score = 0.9
            mock_assess.return_value = mock_assessment
            
            result = self_evaluation_reflection_node(state)
            
            assert result['self_evaluation_score'] == 0.9
            assert result['needs_retry'] == False
    
    def test_self_evaluation_reflection_node_low_quality_retry(self):
        """Test self-evaluation with low quality requiring retry"""
        state = self.base_state.copy()
        state['retry_count'] = 0
        
        with patch('assistant.brain.enterprise_graph.assess_enterprise_quality') as mock_assess:
            mock_assessment = Mock()
            mock_assessment.needs_retry = True
            mock_assessment.overall_score = 0.5
            mock_assess.return_value = mock_assessment
            
            result = self_evaluation_reflection_node(state)
            
            assert result['needs_retry'] == True
            assert result['retry_count'] == 1
            assert result['routing_decision'] == 'RETRY'
    
    def test_self_evaluation_reflection_node_max_retries(self):
        """Test self-evaluation with max retries reached"""
        state = self.base_state.copy()
        state['retry_count'] = 2  # Max retries reached
        
        with patch('assistant.brain.enterprise_graph.assess_enterprise_quality') as mock_assess:
            mock_assessment = Mock()
            mock_assessment.needs_retry = True
            mock_assessment.overall_score = 0.5
            mock_assess.return_value = mock_assessment
            
            result = self_evaluation_reflection_node(state)
            
            assert result['needs_retry'] == False  # Should not retry beyond max
            assert result['retry_count'] == 2
    
    # ============================================================================
    # DOMAIN NODES (9)
    # ============================================================================
    
    def test_nlu_node_success(self):
        """Test NLU node with successful entity extraction"""
        state = self.base_state.copy()
        
        with patch('assistant.brain.enterprise_graph.classify_intent_structured') as mock_classify:
            mock_intent = EnterpriseIntentResult(
                intent_type="property_search",
                confidence=0.9,
                language="en",
                category="PROPERTY",
                subcategory="apartment",
                goal="find_property",
                attributes={'bedrooms': 2, 'location': 'Girne'}
            )
            mock_classify.return_value = mock_intent
            
            result = nlu_node(state)
            
            assert result['intent_result'] == mock_intent
            assert result['routing_decision'] is not None
    
    def test_nlu_node_classification_error(self):
        """Test NLU node with classification error"""
        state = self.base_state.copy()
        
        with patch('assistant.brain.enterprise_graph.classify_intent_structured') as mock_classify:
            mock_classify.side_effect = Exception("Classification failed")
            
            result = nlu_node(state)
            
            # Should handle error gracefully
            assert result['intent_result'] is not None  # Should have fallback
    
    def test_intent_routing_node_property_search(self):
        """Test intent routing for property search"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="property_search",
            confidence=0.9,
            language="en",
            category="PROPERTY"
        )
        
        result = intent_routing_node(state)
        
        assert result['routing_decision'] == 'SEARCH'
    
    def test_intent_routing_node_agent_outreach(self):
        """Test intent routing for agent outreach"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="agent_outreach",
            confidence=0.9,
            language="en",
            category="PROPERTY"
        )
        
        result = intent_routing_node(state)
        
        assert result['routing_decision'] == 'OUTREACH'
    
    def test_retrieval_node_internal_search(self):
        """Test retrieval node with internal search"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="property_search",
            category="PROPERTY",
            attributes={'bedrooms': 2}
        )
        
        with patch('assistant.brain.enterprise_graph.search_internal_listings') as mock_search:
            mock_search.return_value = [{'title': 'Property 1', 'relevance_score': 0.9}]
            
            result = retrieval_node(state)
            
            assert len(result['internal_search_results']) > 0
            assert result['retrieval_quality_score'] is not None
    
    def test_retrieval_node_external_search(self):
        """Test retrieval node with external search"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="knowledge_query",
            category="KNOWLEDGE_QUERY"
        )
        
        with patch('assistant.brain.enterprise_graph.search_external_web') as mock_search:
            mock_search.return_value = [{'title': 'External Info', 'relevance_score': 0.8}]
            
            result = retrieval_node(state)
            
            assert len(result['external_search_results']) > 0
    
    def test_synthesis_node_success(self):
        """Test synthesis node with successful response generation"""
        state = self.base_state.copy()
        state['internal_search_results'] = [{'title': 'Property 1', 'description': 'Great property'}]
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="property_search",
            category="PROPERTY"
        )
        
        with patch('assistant.brain.enterprise_graph.generate_grounded_response') as mock_generate:
            mock_generate.return_value = "Here are some great properties for you"
            
            result = synthesis_node(state)
            
            assert result['synthesis_data'] is not None
            assert result['final_response'] is not None
    
    def test_synthesis_node_error_handling(self):
        """Test synthesis node with generation error"""
        state = self.base_state.copy()
        
        with patch('assistant.brain.enterprise_graph.generate_grounded_response') as mock_generate:
            mock_generate.side_effect = Exception("Generation failed")
            
            result = synthesis_node(state)
            
            # Should handle error gracefully
            assert result['final_response'] is not None
    
    def test_capture_lead_node_success(self):
        """Test capture lead node with successful lead capture"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="agent_outreach",
            category="PROPERTY",
            attributes={'contact': 'user@example.com'}
        )
        
        with patch('assistant.brain.enterprise_graph.create_request_record') as mock_create:
            mock_create.return_value = "request-123"
            
            result = capture_lead_node(state)
            
            assert result['request_id'] == "request-123"
            assert result['request_data'] is not None
    
    def test_capture_lead_node_no_contact_info(self):
        """Test capture lead node without contact info"""
        state = self.base_state.copy()
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="property_search",
            category="PROPERTY"
        )
        
        result = capture_lead_node(state)
        
        # Should not create request without contact info
        assert result['request_id'] is None
    
    def test_hitl_approval_node_approval_required(self):
        """Test HITL approval node when approval is required"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="agent_outreach",
            category="GENERAL_PRODUCT"
        )
        
        with patch('assistant.brain.enterprise_graph.should_require_hitl_approval') as mock_should:
            mock_should.return_value = True
            
            with patch('assistant.brain.enterprise_graph.create_approval_gate') as mock_create:
                mock_create.return_value = "approval-123"
                
                result = hitl_approval_node(state)
                
                assert result['hitl_approval_required'] == True
                assert result['hitl_approval_id'] == "approval-123"
    
    def test_hitl_approval_node_no_approval_needed(self):
        """Test HITL approval node when no approval needed"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="property_search",
            category="PROPERTY"
        )
        
        with patch('assistant.brain.enterprise_graph.should_require_hitl_approval') as mock_should:
            mock_should.return_value = False
            
            result = hitl_approval_node(state)
            
            assert result['hitl_approval_required'] == False
            assert result['hitl_approval_id'] is None
    
    def test_broadcast_node_success(self):
        """Test broadcast node with successful broadcast"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        state['intent_result'] = EnterpriseIntentResult(
            intent_type="agent_outreach",
            category="PROPERTY"
        )
        
        with patch('assistant.brain.enterprise_graph.execute_broadcast') as mock_broadcast:
            mock_broadcast.return_value = {'status': 'queued', 'task_id': 'task-123'}
            
            result = broadcast_node(state)
            
            assert result['broadcast_status'] is not None
            assert result['broadcast_status']['status'] == 'queued'
    
    def test_broadcast_node_error_handling(self):
        """Test broadcast node with broadcast error"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        
        with patch('assistant.brain.enterprise_graph.execute_broadcast') as mock_broadcast:
            mock_broadcast.side_effect = Exception("Broadcast failed")
            
            result = broadcast_node(state)
            
            # Should handle error gracefully
            assert result['broadcast_status'] is not None
    
    def test_booking_node_success(self):
        """Test booking node with successful booking"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        state['user_input'] = "I want to book for tomorrow"
        
        with patch('assistant.brain.enterprise_graph.create_booking') as mock_booking:
            mock_booking.return_value = {
                'status': 'created',
                'booking_id': 'booking-123',
                'message': 'Booking created successfully'
            }
            
            result = booking_node(state)
            
            assert result['booking_status'] is not None
            assert result['booking_status']['status'] == 'created'
    
    def test_booking_node_error_handling(self):
        """Test booking node with booking error"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        
        with patch('assistant.brain.enterprise_graph.create_booking') as mock_booking:
            mock_booking.side_effect = Exception("Booking failed")
            
            result = booking_node(state)
            
            # Should handle error gracefully
            assert result['booking_status'] is not None
    
    def test_long_term_node_success(self):
        """Test long-term node with successful viewing scheduling"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        state['user_input'] = "I want to schedule a viewing"
        
        with patch('assistant.brain.enterprise_graph.schedule_viewing') as mock_schedule:
            mock_schedule.return_value = {
                'status': 'scheduled',
                'request_id': 'request-123',
                'message': 'Viewing scheduled successfully'
            }
            
            result = long_term_node(state)
            
            assert result['long_term_status'] is not None
            assert result['long_term_status']['status'] == 'scheduled'
    
    def test_long_term_node_error_handling(self):
        """Test long-term node with scheduling error"""
        state = self.base_state.copy()
        state['request_id'] = "request-123"
        
        with patch('assistant.brain.enterprise_graph.schedule_viewing') as mock_schedule:
            mock_schedule.side_effect = Exception("Scheduling failed")
            
            result = long_term_node(state)
            
            # Should handle error gracefully
            assert result['long_term_status'] is not None
    
    # ============================================================================
    # EDGE CASES AND ERROR HANDLING
    # ============================================================================
    
    def test_all_nodes_with_empty_state(self):
        """Test all nodes with minimal state"""
        minimal_state = {
            'conversation_id': 'test',
            'user_input': '',
            'user_language': 'en',
            'output_language': 'en'
        }
        
        # Test that all nodes handle minimal state gracefully
        nodes = [
            language_preprocessor_node,
            guardrail_refusal_node,
            self_evaluation_reflection_node,
            nlu_node,
            intent_routing_node,
            retrieval_node,
            synthesis_node,
            capture_lead_node,
            hitl_approval_node,
            broadcast_node,
            booking_node,
            long_term_node
        ]
        
        for node_func in nodes:
            try:
                result = node_func(minimal_state)
                assert isinstance(result, dict)
                assert 'conversation_id' in result
            except Exception as e:
                pytest.fail(f"Node {node_func.__name__} failed with minimal state: {e}")
    
    def test_all_nodes_with_none_values(self):
        """Test all nodes with None values"""
        none_state = {
            'conversation_id': 'test',
            'user_input': None,
            'user_language': None,
            'output_language': None,
            'intent_result': None,
            'internal_search_results': None,
            'external_search_results': None
        }
        
        # Test that all nodes handle None values gracefully
        nodes = [
            language_preprocessor_node,
            guardrail_refusal_node,
            self_evaluation_reflection_node,
            nlu_node,
            intent_routing_node,
            retrieval_node,
            synthesis_node,
            capture_lead_node,
            hitl_approval_node,
            broadcast_node,
            booking_node,
            long_term_node
        ]
        
        for node_func in nodes:
            try:
                result = node_func(none_state)
                assert isinstance(result, dict)
            except Exception as e:
                pytest.fail(f"Node {node_func.__name__} failed with None values: {e}")
