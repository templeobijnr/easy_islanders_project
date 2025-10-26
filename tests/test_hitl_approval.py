"""
Tests for B.3b: HITL (Human-in-the-Loop) Broadcast Approval Gate
Tests ApproveBroadcast model and approval endpoints
"""
import pytest
import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from assistant.models import ApproveBroadcast, DemandLead

User = get_user_model()


class ApproveBroadcastModelTest(TestCase):
    """Tests for ApproveBroadcast model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.demand_lead = DemandLead.objects.create(
            contact_info='user@example.com',
            description='2BR apartment in Kyrenia',
            category='accommodation'
        )

    def test_create_approval_gate(self):
        """Test creating an approval gate"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=10,
            seller_ids=['seller1', 'seller2', 'seller3'],
            medium='whatsapp'
        )
        
        self.assertEqual(approval.demand_lead, self.demand_lead)
        self.assertEqual(approval.target_seller_count, 10)
        self.assertTrue(approval.is_pending)
        self.assertFalse(approval.is_approved)
        self.assertFalse(approval.is_rejected)

    def test_approve_broadcast(self):
        """Test approving a broadcast"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=5,
            seller_ids=['s1', 's2']
        )
        
        approval.approve(reviewer=self.user, notes='Approved')
        
        self.assertTrue(approval.is_approved)
        self.assertFalse(approval.is_pending)
        self.assertEqual(approval.reviewer, self.user)
        self.assertEqual(approval.approval_notes, 'Approved')
        self.assertIsNotNone(approval.approved_at)

    def test_reject_broadcast(self):
        """Test rejecting a broadcast"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=5,
            seller_ids=['s1']
        )
        
        approval.reject(reviewer=self.user, notes='Insufficient detail')
        
        self.assertTrue(approval.is_rejected)
        self.assertFalse(approval.is_pending)
        self.assertEqual(approval.reviewer, self.user)
        self.assertEqual(approval.approval_notes, 'Insufficient detail')
        self.assertIsNotNone(approval.rejected_at)

    def test_is_expired_false_when_pending_and_recent(self):
        """Test is_expired returns False for recent pending approval"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=3,
            seller_ids=['s1']
        )
        
        # Should not be expired (created just now)
        self.assertFalse(approval.is_expired)

    def test_is_expired_true_when_pending_and_old(self):
        """Test is_expired returns True for old pending approval"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=3,
            seller_ids=['s1']
        )
        
        # Manually set created_at to 25 hours ago
        approval.created_at = timezone.now() - timezone.timedelta(hours=25)
        approval.save()
        
        # Should be expired
        self.assertTrue(approval.is_expired)

    def test_is_expired_false_when_already_decided(self):
        """Test is_expired returns False for approved/rejected"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=3,
            seller_ids=['s1']
        )
        
        approval.approve(reviewer=self.user)
        
        # Mark created_at as old
        approval.created_at = timezone.now() - timezone.timedelta(hours=25)
        approval.save()
        
        # Should not be expired (already decided)
        self.assertFalse(approval.is_expired)


class BroadcastApprovalEndpointsTest(TestCase):
    """Tests for broadcast approval endpoints"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='businessuser',
            email='business@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.demand_lead = DemandLead.objects.create(
            contact_info='user@example.com',
            description='2BR apartment in Kyrenia for €600',
            category='accommodation',
            location='Kyrenia'
        )

    def test_get_pending_approvals_empty(self):
        """Test getting pending approvals when none exist"""
        response = self.client.get('/api/broadcasts/pending/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pending_count'], 0)
        self.assertEqual(len(response.data['approvals']), 0)

    def test_get_pending_approvals_with_data(self):
        """Test getting pending approvals"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=10,
            seller_ids=['s1', 's2'],
            medium='whatsapp'
        )
        
        response = self.client.get('/api/broadcasts/pending/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['pending_count'], 1)
        self.assertEqual(len(response.data['approvals']), 1)
        
        approval_data = response.data['approvals'][0]
        self.assertEqual(approval_data['id'], str(approval.id))
        self.assertEqual(approval_data['target_seller_count'], 10)
        self.assertEqual(approval_data['medium'], 'whatsapp')

    def test_get_pending_approvals_excludes_decided(self):
        """Test pending approvals excludes approved/rejected"""
        pending = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=5,
            seller_ids=['s1']
        )
        
        approved = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=3,
            seller_ids=['s1']
        )
        approved.approve(reviewer=self.user)
        
        response = self.client.get('/api/broadcasts/pending/', format='json')
        
        self.assertEqual(response.data['pending_count'], 1)
        self.assertEqual(response.data['approvals'][0]['id'], str(pending.id))

    def test_approve_broadcast(self):
        """Test approving a broadcast"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=10,
            seller_ids=['s1', 's2']
        )
        
        response = self.client.post(
            '/api/broadcasts/approve/',
            {
                'approval_id': str(approval.id),
                'notes': 'Approved - proceed with broadcast'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify approval was updated
        approval.refresh_from_db()
        self.assertTrue(approval.is_approved)
        self.assertEqual(approval.reviewer, self.user)

    def test_approve_broadcast_missing_id(self):
        """Test approving without approval_id"""
        response = self.client.post(
            '/api/broadcasts/approve/',
            {'notes': 'Approved'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_broadcast_not_found(self):
        """Test approving non-existent approval"""
        response = self.client.post(
            '/api/broadcasts/approve/',
            {'approval_id': str(uuid.uuid4())},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reject_broadcast(self):
        """Test rejecting a broadcast"""
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=10,
            seller_ids=['s1', 's2']
        )
        
        response = self.client.post(
            '/api/broadcasts/reject/',
            {
                'approval_id': str(approval.id),
                'reason': 'Need more details'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Verify approval was updated
        approval.refresh_from_db()
        self.assertTrue(approval.is_rejected)
        self.assertEqual(approval.reviewer, self.user)

    def test_reject_broadcast_not_found(self):
        """Test rejecting non-existent approval"""
        response = self.client.post(
            '/api/broadcasts/reject/',
            {'approval_id': str(uuid.uuid4())},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_broadcast_approval_gate(self):
        """Test creating a broadcast approval gate"""
        response = self.client.post(
            '/api/broadcasts/create-gate/',
            {
                'demand_lead_id': str(self.demand_lead.id),
                'seller_ids': ['seller1', 'seller2', 'seller3'],
                'medium': 'whatsapp'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertIn('approval_id', response.data)
        
        # Verify gate was created
        approval_id = response.data['approval_id']
        approval = ApproveBroadcast.objects.get(id=approval_id)
        self.assertEqual(approval.target_seller_count, 3)
        self.assertTrue(approval.is_pending)

    def test_create_broadcast_gate_missing_lead(self):
        """Test creating gate without demand_lead_id"""
        response = self.client.post(
            '/api/broadcasts/create-gate/',
            {'seller_ids': ['s1']},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_broadcast_gate_lead_not_found(self):
        """Test creating gate with non-existent lead"""
        response = self.client.post(
            '/api/broadcasts/create-gate/',
            {
                'demand_lead_id': str(uuid.uuid4()),
                'seller_ids': ['s1']
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_endpoints_require_authentication(self):
        """Test all endpoints require authentication"""
        self.client.force_authenticate(user=None)
        
        # Test get_pending_approvals
        response = self.client.get('/api/broadcasts/pending/', format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test approve_broadcast
        response = self.client.post(
            '/api/broadcasts/approve/',
            {'approval_id': str(uuid.uuid4())},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test reject_broadcast
        response = self.client.post(
            '/api/broadcasts/reject/',
            {'approval_id': str(uuid.uuid4())},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test create_gate
        response = self.client.post(
            '/api/broadcasts/create-gate/',
            {'demand_lead_id': str(uuid.uuid4())},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BroadcastApprovalWorkflowTest(TestCase):
    """Integration tests for broadcast approval workflow"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='businessuser',
            email='business@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.demand_lead = DemandLead.objects.create(
            contact_info='user@example.com',
            description='Property listing',
            category='accommodation'
        )

    def test_broadcast_approval_workflow(self):
        """Test full broadcast approval workflow"""
        # Step 1: Create approval gate
        create_response = self.client.post(
            '/api/broadcasts/create-gate/',
            {
                'demand_lead_id': str(self.demand_lead.id),
                'seller_ids': ['s1', 's2', 's3'],
                'medium': 'whatsapp'
            },
            format='json'
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        approval_id = create_response.data['approval_id']
        
        # Step 2: Check pending approvals
        pending_response = self.client.get('/api/broadcasts/pending/', format='json')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        self.assertEqual(pending_response.data['pending_count'], 1)
        
        # Step 3: Approve the broadcast
        approve_response = self.client.post(
            '/api/broadcasts/approve/',
            {
                'approval_id': approval_id,
                'notes': 'Approved'
            },
            format='json'
        )
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        
        # Step 4: Verify no more pending approvals
        pending_response = self.client.get('/api/broadcasts/pending/', format='json')
        self.assertEqual(pending_response.data['pending_count'], 0)

    def test_broadcast_rejection_workflow(self):
        """Test broadcast rejection workflow"""
        # Create and then reject
        approval = ApproveBroadcast.objects.create(
            demand_lead=self.demand_lead,
            target_seller_count=2,
            seller_ids=['s1']
        )
        
        reject_response = self.client.post(
            '/api/broadcasts/reject/',
            {
                'approval_id': str(approval.id),
                'reason': 'Invalid criteria'
            },
            format='json'
        )
        
        self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
        
        # Verify rejection
        approval.refresh_from_db()
        self.assertTrue(approval.is_rejected)
