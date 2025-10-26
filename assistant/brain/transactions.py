"""
Enterprise-Grade Atomic Transaction System for Multi-Domain AI Agent Platform
ACID-compliant transaction management with Celery task atomicity
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Union
import logging
import uuid
from datetime import datetime

from django.db import transaction
from django.utils import timezone
from celery import shared_task

from ..models import Request, ApproveBroadcast, AgentBroadcastV2
from .schemas import EnterpriseRequestPayload, EnterpriseIntentResult

logger = logging.getLogger(__name__)

# ============================================================================
# ATOMIC REQUEST CREATION
# ============================================================================

@transaction.atomic
def create_request_atomic(payload: EnterpriseRequestPayload, 
                         conversation_id: str,
                         user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Atomically create a Request with full ACID compliance
    """
    logger.info(f"Creating request atomically: {payload.category}")
    
    try:
        # Create Request record
        request = Request.objects.create(
            category=payload.category,
            subcategory=payload.subcategory,
            location=payload.location,
            budget=payload.budget_amount,
            currency=payload.budget_currency,
            attributes=payload.attributes,
            contact_info=payload.contact,
            user_id=user_id,
            created_by_id=user_id,
            status='CREATED'
        )
        
        # Create audit log
        audit_log = {
            'request_id': str(request.id),
            'conversation_id': conversation_id,
            'user_id': user_id,
            'category': payload.category,
            'created_at': timezone.now().isoformat(),
            'status': 'CREATED'
        }
        
        # Schedule HITL approval if required
        approval_id = None
        if should_require_hitl_approval(payload.category):
            approval_id = create_approval_gate_atomic(request.id, conversation_id)
        
        # Commit transaction
        transaction.on_commit(
            lambda: log_request_creation.delay(audit_log)
        )
        
        return {
            'success': True,
            'request_id': str(request.id),
            'approval_id': approval_id,
            'status': 'CREATED',
            'requires_hitl': approval_id is not None
        }
        
    except Exception as e:
        logger.error(f"Atomic request creation failed: {e}")
        raise

def should_require_hitl_approval(category: str) -> bool:
    """Determine if HITL approval is required based on category"""
    # Business logic for HITL requirements
    hitl_categories = ['GENERAL_PRODUCT', 'VEHICLE', 'SERVICE']
    return category in hitl_categories

@transaction.atomic
def create_approval_gate_atomic(request_id: str, conversation_id: str) -> str:
    """Atomically create HITL approval gate"""
    try:
        approval = ApproveBroadcast.objects.create(
            request_fk_id=request_id,
            target_seller_count=0,  # Will be determined by broadcast task
            medium='whatsapp',
            reviewer=None,
            status='pending',
            created_at=timezone.now()
        )
        
        # Log approval creation
        transaction.on_commit(
            lambda: log_approval_creation.delay(str(approval.id), request_id)
        )
        
        return str(approval.id)
        
    except Exception as e:
        logger.error(f"Atomic approval creation failed: {e}")
        raise

# ============================================================================
# ATOMIC BROADCAST SYSTEM
# ============================================================================

@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3})
def broadcast_request_atomic(self, request_id: str) -> Dict[str, Any]:
    """
    Atomically broadcast request to sellers with full rollback capability
    """
    logger.info(f"Starting atomic broadcast for request: {request_id}")
    
    try:
        with transaction.atomic():
            # Get request with lock
            request = Request.objects.select_for_update().get(id=request_id)
            
            # Validate request state
            if request.status != 'CREATED':
                raise ValueError(f"Request {request_id} is not in CREATED state: {request.status}")
            
            # Update request status
            request.status = 'PENDING_BROADCAST'
            request.save(update_fields=['status', 'updated_at'])
            
            # Get eligible sellers
            sellers = get_eligible_sellers(request)
            
            # Create broadcast records atomically
            broadcast_records = []
            for seller in sellers:
                broadcast = AgentBroadcastV2.objects.create(
                    request=request,
                    seller_id=seller['id'],
                    medium=seller.get('medium', 'whatsapp'),
                    status='queued',
                    created_at=timezone.now()
                )
                broadcast_records.append(broadcast)
            
            # Update request with broadcast info
            request.sellers_contacted = [
                {
                    'seller_id': str(br.seller_id),
                    'medium': br.medium,
                    'status': 'queued',
                    'broadcast_id': str(br.id)
                }
                for br in broadcast_records
            ]
            request.status = 'BROADCASTED'
            request.save(update_fields=['sellers_contacted', 'status', 'updated_at'])
            
            # Schedule actual message sending after transaction commit
            transaction.on_commit(
                lambda: execute_broadcast_messages.delay([str(br.id) for br in broadcast_records])
            )
            
            return {
                'success': True,
                'request_id': request_id,
                'broadcasts_created': len(broadcast_records),
                'sellers_contacted': len(sellers)
            }
            
    except Request.DoesNotExist:
        logger.error(f"Request {request_id} not found")
        return {'success': False, 'error': 'request_not_found'}
    except Exception as e:
        logger.error(f"Atomic broadcast failed for request {request_id}: {e}")
        return {'success': False, 'error': str(e)}

@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3})
def execute_broadcast_messages(self, broadcast_ids: List[str]) -> Dict[str, Any]:
    """
    Execute actual message sending (after transaction commit)
    """
    logger.info(f"Executing broadcast messages for {len(broadcast_ids)} broadcasts")
    
    success_count = 0
    failure_count = 0
    
    for broadcast_id in broadcast_ids:
        try:
            broadcast = AgentBroadcastV2.objects.get(id=broadcast_id)
            
            # Send message via Twilio/WhatsApp
            message_sent = send_message_to_seller(
                seller_id=broadcast.seller_id,
                message=build_broadcast_message(broadcast.request),
                medium=broadcast.medium
            )
            
            if message_sent:
                broadcast.status = 'sent'
                broadcast.sent_at = timezone.now()
                success_count += 1
            else:
                broadcast.status = 'failed'
                broadcast.error_log = 'Message sending failed'
                failure_count += 1
            
            broadcast.save(update_fields=['status', 'sent_at', 'error_log'])
            
        except Exception as e:
            logger.error(f"Failed to send broadcast {broadcast_id}: {e}")
            failure_count += 1
    
    return {
        'success': success_count > 0,
        'success_count': success_count,
        'failure_count': failure_count,
        'total': len(broadcast_ids)
    }

# ============================================================================
# HITL APPROVAL SYSTEM
# ============================================================================

@transaction.atomic
def approve_broadcast_atomic(approval_id: str, 
                           approved: bool, 
                           reviewer_id: Optional[str] = None,
                           notes: Optional[str] = None) -> Dict[str, Any]:
    """
    Atomically approve or reject broadcast request
    """
    logger.info(f"Processing HITL approval: {approval_id} (approved: {approved})")
    
    try:
        approval = ApproveBroadcast.objects.select_for_update().get(id=approval_id)
        
        if approval.status != 'pending':
            return {'success': False, 'error': 'approval_already_processed'}
        
        # Update approval status
        approval.status = 'approved' if approved else 'rejected'
        approval.reviewer_id = reviewer_id
        approval.reviewed_at = timezone.now()
        approval.notes = notes
        approval.save()
        
        # If approved, trigger broadcast
        if approved and approval.request_fk:
            transaction.on_commit(
                lambda: broadcast_request_atomic.delay(str(approval.request_fk.id))
            )
        
        # Log approval decision
        transaction.on_commit(
            lambda: log_approval_decision.delay(approval_id, approved, reviewer_id)
        )
        
        return {
            'success': True,
            'approval_id': approval_id,
            'approved': approved,
            'broadcast_triggered': approved
        }
        
    except ApproveBroadcast.DoesNotExist:
        logger.error(f"Approval {approval_id} not found")
        return {'success': False, 'error': 'approval_not_found'}
    except Exception as e:
        logger.error(f"Atomic approval processing failed: {e}")
        raise

# ============================================================================
# REQUEST STATUS MANAGEMENT
# ============================================================================

@transaction.atomic
def update_request_status_atomic(request_id: str, 
                               new_status: str, 
                               reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Atomically update request status with audit trail
    """
    logger.info(f"Updating request {request_id} status to {new_status}")
    
    try:
        request = Request.objects.select_for_update().get(id=request_id)
        
        old_status = request.status
        request.status = new_status
        request.updated_at = timezone.now()
        request.save(update_fields=['status', 'updated_at'])
        
        # Log status change
        status_log = {
            'request_id': request_id,
            'old_status': old_status,
            'new_status': new_status,
            'reason': reason,
            'timestamp': timezone.now().isoformat()
        }
        
        transaction.on_commit(
            lambda: log_status_change.delay(status_log)
        )
        
        return {
            'success': True,
            'request_id': request_id,
            'old_status': old_status,
            'new_status': new_status
        }
        
    except Request.DoesNotExist:
        logger.error(f"Request {request_id} not found")
        return {'success': False, 'error': 'request_not_found'}
    except Exception as e:
        logger.error(f"Atomic status update failed: {e}")
        raise

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_eligible_sellers(request: Request) -> List[Dict[str, Any]]:
    """Get eligible sellers for broadcast"""
    try:
        from users.models import BusinessProfile
        
        # Filter by category and location
        qs = BusinessProfile.objects.filter(is_verified_by_admin=True)
        
        if request.category == 'PROPERTY':
            qs = qs.filter(category__name__icontains='property')
        elif request.category == 'VEHICLE':
            qs = qs.filter(category__name__icontains='vehicle')
        elif request.category == 'SERVICE':
            qs = qs.filter(category__name__icontains='service')
        
        if request.location:
            qs = qs.filter(location__icontains=request.location)
        
        # Return seller info
        sellers = []
        for profile in qs[:10]:  # Limit to 10 sellers
            sellers.append({
                'id': str(profile.user_id),
                'name': profile.business_name,
                'medium': 'whatsapp',
                'location': profile.location
            })
        
        return sellers
        
    except Exception as e:
        logger.error(f"Failed to get eligible sellers: {e}")
        return []

def send_message_to_seller(seller_id: str, message: str, medium: str = 'whatsapp') -> bool:
    """Send message to seller via specified medium"""
    try:
        # This would integrate with Twilio/WhatsApp API
        # For now, just log the message
        logger.info(f"Sending {medium} message to seller {seller_id}: {message[:50]}...")
        
        # Simulate message sending
        return True
        
    except Exception as e:
        logger.error(f"Failed to send message to seller {seller_id}: {e}")
        return False

def build_broadcast_message(request: Request) -> str:
    """Build broadcast message for sellers"""
    message = f"""
New {request.category.lower()} request:
Location: {request.location or 'Not specified'}
Budget: {request.budget} {request.currency}
Details: {request.attributes}
Contact: {request.contact_info}
    """.strip()
    
    return message

# ============================================================================
# AUDIT LOGGING TASKS
# ============================================================================

@shared_task
def log_request_creation(audit_log: Dict[str, Any]) -> None:
    """Log request creation for audit trail"""
    logger.info(f"Request created: {audit_log['request_id']}")

@shared_task
def log_approval_creation(approval_id: str, request_id: str) -> None:
    """Log approval creation for audit trail"""
    logger.info(f"Approval created: {approval_id} for request {request_id}")

@shared_task
def log_approval_decision(approval_id: str, approved: bool, reviewer_id: Optional[str]) -> None:
    """Log approval decision for audit trail"""
    logger.info(f"Approval {approval_id} {'approved' if approved else 'rejected'} by {reviewer_id}")

@shared_task
def log_status_change(status_log: Dict[str, Any]) -> None:
    """Log status change for audit trail"""
    logger.info(f"Request {status_log['request_id']} status changed: {status_log['old_status']} -> {status_log['new_status']}")

# ============================================================================
# ENTERPRISE TRANSACTION ENTRY POINTS
# ============================================================================

def create_request_safe(payload: EnterpriseRequestPayload, 
                       conversation_id: str,
                       user_id: Optional[str] = None) -> Dict[str, Any]:
    """Safe request creation with error handling"""
    try:
        return create_request_atomic(payload, conversation_id, user_id)
    except Exception as e:
        logger.error(f"Request creation failed: {e}")
        return {'success': False, 'error': str(e)}

def approve_broadcast_safe(approval_id: str, 
                          approved: bool, 
                          reviewer_id: Optional[str] = None) -> Dict[str, Any]:
    """Safe broadcast approval with error handling"""
    try:
        return approve_broadcast_atomic(approval_id, approved, reviewer_id)
    except Exception as e:
        logger.error(f"Broadcast approval failed: {e}")
        return {'success': False, 'error': str(e)}
