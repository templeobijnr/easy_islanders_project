"""
Unit Tests for Enterprise Transactions
Tests atomic transaction system with rollback capabilities
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.contrib.auth import get_user_model

from assistant.brain.enterprise_transactions import (
    create_request_atomic,
    create_approval_gate_atomic,
    broadcast_request_atomic,
    approve_broadcast_atomic,
    update_request_status_atomic,
    create_request_safe,
    approve_broadcast_safe,
    get_eligible_sellers,
    send_message_to_seller,
    build_broadcast_message
)
from assistant.brain.enterprise_schemas import EnterpriseRequestPayload

User = get_user_model()

class TestEnterpriseTransactions(TransactionTestCase):
    """Test enterprise transaction system"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.agent_user = User.objects.create_user(
            username='agent_service',
            email='agent@example.com',
            password='agentpass123'
        )
        
        self.sample_payload = EnterpriseRequestPayload(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget_amount=1000.0,
            budget_currency="EUR",
            attributes={'bedrooms': 2, 'property_type': 'apartment'},
            contact="user@example.com"
        )
    
    def test_create_request_atomic_success(self):
        """Test successful atomic request creation"""
        with patch('assistant.brain.enterprise_transactions.should_require_hitl_approval') as mock_should:
            mock_should.return_value = False
            
            with patch('assistant.brain.enterprise_transactions.create_approval_gate_atomic') as mock_approval:
                result = create_request_atomic(
                    self.sample_payload,
                    "conv123",
                    str(self.user.id)
                )
                
                assert result['success'] == True
                assert 'request_id' in result
                assert result['status'] == 'CREATED'
                assert result['requires_hitl'] == False
                
                # Verify request was created in database
                from assistant.models import Request
                request = Request.objects.get(id=result['request_id'])
                assert request.category == "PROPERTY"
                assert request.location == "Girne"
                assert request.budget == 1000.0
    
    def test_create_request_atomic_with_hitl(self):
        """Test atomic request creation with HITL approval required"""
        with patch('assistant.brain.enterprise_transactions.should_require_hitl_approval') as mock_should:
            mock_should.return_value = True
            
            with patch('assistant.brain.enterprise_transactions.create_approval_gate_atomic') as mock_approval:
                mock_approval.return_value = "approval-123"
                
                result = create_request_atomic(
                    self.sample_payload,
                    "conv123",
                    str(self.user.id)
                )
                
                assert result['success'] == True
                assert result['requires_hitl'] == True
                assert result['approval_id'] == "approval-123"
                mock_approval.assert_called_once()
    
    def test_create_request_atomic_rollback(self):
        """Test atomic request creation with rollback on error"""
        # Mock a database error
        with patch('assistant.models.Request.objects.create') as mock_create:
            mock_create.side_effect = Exception("Database error")
            
            with self.assertRaises(Exception):
                create_request_atomic(
                    self.sample_payload,
                    "conv123",
                    str(self.user.id)
                )
            
            # Verify no request was created (rollback)
            from assistant.models import Request
            assert Request.objects.count() == 0
    
    def test_create_approval_gate_atomic_success(self):
        """Test successful atomic approval gate creation"""
        # First create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user
        )
        
        approval_id = create_approval_gate_atomic(str(request.id), "conv123")
        
        assert approval_id is not None
        
        # Verify approval was created
        from assistant.models import ApproveBroadcast
        approval = ApproveBroadcast.objects.get(id=approval_id)
        assert approval.request_fk == request
        assert approval.status == 'pending'
        assert approval.medium == 'whatsapp'
    
    def test_create_approval_gate_atomic_rollback(self):
        """Test atomic approval gate creation with rollback on error"""
        # Mock a database error
        with patch('assistant.models.ApproveBroadcast.objects.create') as mock_create:
            mock_create.side_effect = Exception("Database error")
            
            with self.assertRaises(Exception):
                create_approval_gate_atomic("request-123", "conv123")
    
    def test_broadcast_request_atomic_success(self):
        """Test successful atomic broadcast request"""
        # Create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='CREATED'
        )
        
        with patch('assistant.brain.enterprise_transactions.get_eligible_sellers') as mock_sellers:
            mock_sellers.return_value = [
                {'id': 'seller1', 'name': 'Seller 1', 'medium': 'whatsapp'},
                {'id': 'seller2', 'name': 'Seller 2', 'medium': 'whatsapp'}
            ]
            
            with patch('assistant.brain.enterprise_transactions.execute_broadcast_messages') as mock_execute:
                result = broadcast_request_atomic(str(request.id))
                
                assert result['success'] == True
                assert result['broadcasts_created'] == 2
                assert result['sellers_contacted'] == 2
                
                # Verify request status was updated
                request.refresh_from_db()
                assert request.status == 'BROADCASTED'
    
    def test_broadcast_request_atomic_invalid_status(self):
        """Test atomic broadcast with invalid request status"""
        # Create a request with invalid status
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='BROADCASTED'  # Already broadcasted
        )
        
        result = broadcast_request_atomic(str(request.id))
        
        assert result['success'] == False
        assert 'error' in result
    
    def test_broadcast_request_atomic_not_found(self):
        """Test atomic broadcast with non-existent request"""
        result = broadcast_request_atomic("non-existent-id")
        
        assert result['success'] == False
        assert result['error'] == 'request_not_found'
    
    def test_approve_broadcast_atomic_approve(self):
        """Test atomic broadcast approval"""
        # Create a request and approval
        from assistant.models import Request, ApproveBroadcast
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user
        )
        
        approval = ApproveBroadcast.objects.create(
            request_fk=request,
            target_seller_count=0,
            medium='whatsapp',
            status='pending',
            reviewer=None
        )
        
        with patch('assistant.brain.enterprise_transactions.broadcast_request_atomic') as mock_broadcast:
            result = approve_broadcast_atomic(
                str(approval.id),
                True,  # Approve
                str(self.user.id),
                "Looks good"
            )
            
            assert result['success'] == True
            assert result['approved'] == True
            assert result['broadcast_triggered'] == True
            
            # Verify approval was updated
            approval.refresh_from_db()
            assert approval.status == 'approved'
            assert approval.reviewer_id == str(self.user.id)
            assert approval.notes == "Looks good"
    
    def test_approve_broadcast_atomic_reject(self):
        """Test atomic broadcast rejection"""
        # Create a request and approval
        from assistant.models import Request, ApproveBroadcast
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user
        )
        
        approval = ApproveBroadcast.objects.create(
            request_fk=request,
            target_seller_count=0,
            medium='whatsapp',
            status='pending',
            reviewer=None
        )
        
        result = approve_broadcast_atomic(
            str(approval.id),
            False,  # Reject
            str(self.user.id),
            "Not suitable"
        )
        
        assert result['success'] == True
        assert result['approved'] == False
        assert result['broadcast_triggered'] == False
        
        # Verify approval was updated
        approval.refresh_from_db()
        assert approval.status == 'rejected'
        assert approval.reviewer_id == str(self.user.id)
        assert approval.notes == "Not suitable"
    
    def test_approve_broadcast_atomic_already_processed(self):
        """Test atomic broadcast approval with already processed approval"""
        # Create a request and approval
        from assistant.models import Request, ApproveBroadcast
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user
        )
        
        approval = ApproveBroadcast.objects.create(
            request_fk=request,
            target_seller_count=0,
            medium='whatsapp',
            status='approved',  # Already processed
            reviewer=None
        )
        
        result = approve_broadcast_atomic(
            str(approval.id),
            True,
            str(self.user.id)
        )
        
        assert result['success'] == False
        assert result['error'] == 'approval_already_processed'
    
    def test_approve_broadcast_atomic_not_found(self):
        """Test atomic broadcast approval with non-existent approval"""
        result = approve_broadcast_atomic(
            "non-existent-id",
            True,
            str(self.user.id)
        )
        
        assert result['success'] == False
        assert result['error'] == 'approval_not_found'
    
    def test_update_request_status_atomic_success(self):
        """Test successful atomic request status update"""
        # Create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='CREATED'
        )
        
        result = update_request_status_atomic(
            str(request.id),
            'BROADCASTED',
            'Broadcast completed successfully'
        )
        
        assert result['success'] == True
        assert result['old_status'] == 'CREATED'
        assert result['new_status'] == 'BROADCASTED'
        
        # Verify status was updated
        request.refresh_from_db()
        assert request.status == 'BROADCASTED'
    
    def test_update_request_status_atomic_not_found(self):
        """Test atomic request status update with non-existent request"""
        result = update_request_status_atomic(
            "non-existent-id",
            'BROADCASTED',
            'Test reason'
        )
        
        assert result['success'] == False
        assert result['error'] == 'request_not_found'
    
    def test_update_request_status_atomic_rollback(self):
        """Test atomic request status update with rollback on error"""
        # Create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='CREATED'
        )
        
        # Mock a database error
        with patch('assistant.models.Request.objects.select_for_update') as mock_select:
            mock_select.side_effect = Exception("Database error")
            
            with self.assertRaises(Exception):
                update_request_status_atomic(
                    str(request.id),
                    'BROADCASTED',
                    'Test reason'
                )
            
            # Verify status was not updated (rollback)
            request.refresh_from_db()
            assert request.status == 'CREATED'

class TestEnterpriseTransactionHelpers(TestCase):
    """Test enterprise transaction helper functions"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create business profiles for testing
        from users.models import BusinessProfile
        self.business_profile1 = BusinessProfile.objects.create(
            user=self.user,
            business_name="Test Business 1",
            category="Property",
            location="Girne",
            is_verified_by_admin=True
        )
        
        self.business_profile2 = BusinessProfile.objects.create(
            user=self.user,
            business_name="Test Business 2",
            category="Vehicle",
            location="Lefkoşa",
            is_verified_by_admin=True
        )
    
    def test_get_eligible_sellers_property(self):
        """Test getting eligible sellers for property category"""
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.user,
            created_by=self.user
        )
        
        sellers = get_eligible_sellers(request)
        
        assert len(sellers) > 0
        assert all('id' in seller for seller in sellers)
        assert all('name' in seller for seller in sellers)
        assert all('medium' in seller for seller in sellers)
    
    def test_get_eligible_sellers_vehicle(self):
        """Test getting eligible sellers for vehicle category"""
        from assistant.models import Request
        request = Request.objects.create(
            category="VEHICLE",
            subcategory="car",
            location="Lefkoşa",
            budget=5000.0,
            currency="EUR",
            attributes={'make': 'Toyota'},
            contact_info="user@example.com",
            user=self.user,
            created_by=self.user
        )
        
        sellers = get_eligible_sellers(request)
        
        assert len(sellers) > 0
        # Should include vehicle-related sellers
        assert any('Vehicle' in seller['name'] for seller in sellers)
    
    def test_get_eligible_sellers_error_handling(self):
        """Test getting eligible sellers with error handling"""
        from assistant.models import Request
        request = Request.objects.create(
            category="UNKNOWN",
            subcategory="unknown",
            location="Unknown",
            budget=1000.0,
            currency="EUR",
            attributes={},
            contact_info="user@example.com",
            user=self.user,
            created_by=self.user
        )
        
        # Mock an error in the query
        with patch('users.models.BusinessProfile.objects.filter') as mock_filter:
            mock_filter.side_effect = Exception("Database error")
            
            sellers = get_eligible_sellers(request)
            
            assert sellers == []
    
    def test_send_message_to_seller_success(self):
        """Test sending message to seller successfully"""
        result = send_message_to_seller(
            seller_id="seller123",
            message="Test message",
            medium="whatsapp"
        )
        
        assert result == True
    
    def test_send_message_to_seller_error(self):
        """Test sending message to seller with error"""
        with patch('assistant.brain.enterprise_transactions.logger') as mock_logger:
            # Mock an error in message sending
            with patch('assistant.brain.enterprise_transactions.logger.info') as mock_info:
                mock_info.side_effect = Exception("Message sending error")
                
                result = send_message_to_seller(
                    seller_id="seller123",
                    message="Test message",
                    medium="whatsapp"
                )
                
                assert result == False
    
    def test_build_broadcast_message(self):
        """Test building broadcast message"""
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2, 'property_type': 'apartment'},
            contact_info="user@example.com",
            user=self.user,
            created_by=self.user
        )
        
        message = build_broadcast_message(request)
        
        assert "property" in message.lower()
        assert "Girne" in message
        assert "1000" in message
        assert "EUR" in message
        assert "user@example.com" in message

class TestEnterpriseTransactionSafeWrappers(TestCase):
    """Test safe wrapper functions"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.sample_payload = EnterpriseRequestPayload(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget_amount=1000.0,
            budget_currency="EUR",
            attributes={'bedrooms': 2},
            contact="user@example.com"
        )
    
    def test_create_request_safe_success(self):
        """Test safe request creation with success"""
        with patch('assistant.brain.enterprise_transactions.create_request_atomic') as mock_create:
            mock_create.return_value = {
                'success': True,
                'request_id': 'request-123',
                'status': 'CREATED'
            }
            
            result = create_request_safe(
                self.sample_payload,
                "conv123",
                str(self.user.id)
            )
            
            assert result['success'] == True
            assert result['request_id'] == 'request-123'
    
    def test_create_request_safe_error(self):
        """Test safe request creation with error"""
        with patch('assistant.brain.enterprise_transactions.create_request_atomic') as mock_create:
            mock_create.side_effect = Exception("Database error")
            
            result = create_request_safe(
                self.sample_payload,
                "conv123",
                str(self.user.id)
            )
            
            assert result['success'] == False
            assert 'error' in result
            assert 'Database error' in result['error']
    
    def test_approve_broadcast_safe_success(self):
        """Test safe broadcast approval with success"""
        with patch('assistant.brain.enterprise_transactions.approve_broadcast_atomic') as mock_approve:
            mock_approve.return_value = {
                'success': True,
                'approved': True,
                'broadcast_triggered': True
            }
            
            result = approve_broadcast_safe(
                "approval-123",
                True,
                str(self.user.id)
            )
            
            assert result['success'] == True
            assert result['approved'] == True
    
    def test_approve_broadcast_safe_error(self):
        """Test safe broadcast approval with error"""
        with patch('assistant.brain.enterprise_transactions.approve_broadcast_atomic') as mock_approve:
            mock_approve.side_effect = Exception("Approval error")
            
            result = approve_broadcast_safe(
                "approval-123",
                True,
                str(self.user.id)
            )
            
            assert result['success'] == False
            assert 'error' in result
            assert 'Approval error' in result['error']

class TestEnterpriseTransactionAuditLogging(TestCase):
    """Test enterprise transaction audit logging"""
    
    def test_log_request_creation(self):
        """Test request creation logging"""
        from assistant.brain.enterprise_transactions import log_request_creation
        
        audit_log = {
            'request_id': 'request-123',
            'conversation_id': 'conv123',
            'user_id': 'user123',
            'category': 'PROPERTY',
            'created_at': '2024-01-01T00:00:00Z',
            'status': 'CREATED'
        }
        
        # Should not raise an exception
        log_request_creation(audit_log)
    
    def test_log_approval_creation(self):
        """Test approval creation logging"""
        from assistant.brain.enterprise_transactions import log_approval_creation
        
        # Should not raise an exception
        log_approval_creation("approval-123", "request-123")
    
    def test_log_approval_decision(self):
        """Test approval decision logging"""
        from assistant.brain.enterprise_transactions import log_approval_decision
        
        # Should not raise an exception
        log_approval_decision("approval-123", True, "user123")
    
    def test_log_status_change(self):
        """Test status change logging"""
        from assistant.brain.enterprise_transactions import log_status_change
        
        status_log = {
            'request_id': 'request-123',
            'old_status': 'CREATED',
            'new_status': 'BROADCASTED',
            'reason': 'Broadcast completed',
            'timestamp': '2024-01-01T00:00:00Z'
        }
        
        # Should not raise an exception
        log_status_change(status_log)

class TestEnterpriseTransactionIntegration(TestCase):
    """Integration tests for enterprise transactions"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.agent_user = User.objects.create_user(
            username='agent_service',
            email='agent@example.com',
            password='agentpass123'
        )
    
    def test_full_request_workflow(self):
        """Test full request workflow from creation to broadcast"""
        # 1. Create request
        payload = EnterpriseRequestPayload(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget_amount=1000.0,
            budget_currency="EUR",
            attributes={'bedrooms': 2},
            contact="user@example.com"
        )
        
        with patch('assistant.brain.enterprise_transactions.should_require_hitl_approval') as mock_should:
            mock_should.return_value = True
            
            with patch('assistant.brain.enterprise_transactions.create_approval_gate_atomic') as mock_approval:
                mock_approval.return_value = "approval-123"
                
                result = create_request_atomic(
                    payload,
                    "conv123",
                    str(self.user.id)
                )
                
                assert result['success'] == True
                assert result['requires_hitl'] == True
                request_id = result['request_id']
        
        # 2. Approve broadcast
        with patch('assistant.brain.enterprise_transactions.broadcast_request_atomic') as mock_broadcast:
            mock_broadcast.return_value = {
                'success': True,
                'broadcasts_created': 2,
                'sellers_contacted': 2
            }
            
            approval_result = approve_broadcast_atomic(
                "approval-123",
                True,  # Approve
                str(self.user.id),
                "Looks good"
            )
            
            assert approval_result['success'] == True
            assert approval_result['approved'] == True
            assert approval_result['broadcast_triggered'] == True
        
        # 3. Update request status
        status_result = update_request_status_atomic(
            request_id,
            'BROADCASTED',
            'Broadcast completed successfully'
        )
        
        assert status_result['success'] == True
        assert status_result['new_status'] == 'BROADCASTED'
    
    def test_transaction_rollback_scenario(self):
        """Test transaction rollback scenario"""
        # Create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='CREATED'
        )
        
        # Mock an error during broadcast
        with patch('assistant.brain.enterprise_transactions.get_eligible_sellers') as mock_sellers:
            mock_sellers.side_effect = Exception("Seller lookup failed")
            
            result = broadcast_request_atomic(str(request.id))
            
            assert result['success'] == False
            assert 'error' in result
            
            # Verify request status was not changed (rollback)
            request.refresh_from_db()
            assert request.status == 'CREATED'
    
    def test_concurrent_transaction_handling(self):
        """Test concurrent transaction handling"""
        # Create a request
        from assistant.models import Request
        request = Request.objects.create(
            category="PROPERTY",
            subcategory="apartment",
            location="Girne",
            budget=1000.0,
            currency="EUR",
            attributes={'bedrooms': 2},
            contact_info="user@example.com",
            user=self.agent_user,
            created_by=self.agent_user,
            status='CREATED'
        )
        
        # Simulate concurrent access with select_for_update
        with transaction.atomic():
            # First transaction locks the request
            locked_request = Request.objects.select_for_update().get(id=request.id)
            assert locked_request.id == request.id
            
            # Second transaction should wait or fail
            try:
                with transaction.atomic():
                    # This should either wait or fail depending on database settings
                    Request.objects.select_for_update().get(id=request.id)
            except Exception as e:
                # Expected behavior for concurrent access
                assert "lock" in str(e).lower() or "timeout" in str(e).lower()
