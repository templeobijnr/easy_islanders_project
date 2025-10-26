from typing import Any, Dict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsAgentService, IsBusinessUser
from listings.models import Listing
from .models import DemandLead, AgentBroadcast
from .tasks import broadcast_request_to_sellers
# from .brain.schemas import SearchCriteria  # DELETED - not available in new schemas

# NEW imports for generalized requests
from .models import Request as GenericRequest, AgentBroadcastV2, ApproveBroadcast


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAgentService])
def agent_search(request):
    """Agent-internal search with simple metadata filters (hybrid placeholder)."""
    payload: Dict[str, Any] = request.data or {}
    # Basic input validation (simplified)
    user_question = payload.get('user_question', payload.get('q', '')) or 'search'
    if not user_question.strip():
        return Response({'error': 'user_question_required'}, status=status.HTTP_400_BAD_REQUEST)
    category = (payload.get('category') or '').strip()
    location = (payload.get('location') or '').strip()
    price_max = payload.get('price_max')

    qs = Listing.objects.filter(is_active=True, is_published=True)
    if category:
        qs = qs.filter(category__slug__iexact=category)
    if location:
        qs = qs.filter(location__icontains=location)
    if price_max is not None:
        try:
            qs = qs.filter(price__lte=float(price_max))
        except Exception:
            pass

    results = []
    for listing in qs.order_by('-created_at')[:25]:
        sd = listing.structured_data or {}
        image_urls = (sd.get('image_urls') or getattr(listing, 'image_urls', []) or [])
        results.append({
            'id': listing.id,
            'title': sd.get('title') or f"Listing #{listing.id}",
            'price': listing.price,
            'currency': listing.currency,
            'location': listing.location,
            'meta': {
                'beds': sd.get('bedrooms'),
                'baths': sd.get('bathrooms'),
            },
            'image': image_urls[0] if image_urls else None,
        })

    return Response({'results': results}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAgentService])
def agent_requests(request):
    """Create/Update a DemandLead (AgentRequest) and enqueue broadcast (queue hook TODO)."""
    payload: Dict[str, Any] = request.data or {}

    lead = DemandLead.objects.create(
        contact_info=(payload.get('contact') or {}).get('email_token') or (payload.get('contact') or {}).get('phone_token') or '',
        location=(payload.get('extracted_criteria') or {}).get('location') or '',
        description=(payload.get('extracted_criteria') or {}).get('description') or '',
        category=(payload.get('extracted_criteria') or {}).get('category') or '',
        user=getattr(request, 'user', None),
        extracted_criteria=payload.get('extracted_criteria') or {},
        intent_type=payload.get('intent_type') or 'unknown',
        status='broadcasted',
    )

    # Enqueue Celery broadcast task (stub for now)
    async_result = broadcast_request_to_sellers.delay(str(lead.id))
    sellers_enqueued = 0

    return Response({
        'request_id': str(lead.id),
        'status': lead.status,
        'sellers_enqueued': sellers_enqueued,
    }, status=status.HTTP_201_CREATED)


# NEW: Create generalized Request + open HITL gate
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAgentService])
def agent_create_generic_request(request):
    payload: Dict[str, Any] = request.data or {}
    try:
        req = GenericRequest.objects.create(
            created_by=request.user,
            category=payload['category'],
            subcategory=payload.get('subcategory') or '',
            location=payload.get('location') or '',
            budget_amount=payload.get('budget_amount'),
            budget_currency=payload.get('budget_currency') or '',
            attributes=payload.get('attributes') or {},
            contact=payload.get('contact') or '',
            status='pending_approval',
        )
    except KeyError as e:
        return Response({'error': 'missing_field', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Create HITL approval gate for this request
    approval = ApproveBroadcast.objects.create(
        request_fk=req,
        seller_ids=payload.get('seller_ids') or [],
        target_seller_count=len(payload.get('seller_ids') or []),
        medium=payload.get('medium') or 'whatsapp',
    )

    return Response({
        'request_id': str(req.id),
        'approval_id': str(approval.id),
        'status': req.status,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBusinessUser])
def seller_inbox(request):
    """Return RFQs and broadcast attempts for the authenticated business user."""
    user = request.user
    # Legacy broadcasts
    broadcasts_legacy = AgentBroadcast.objects.filter(seller_id=str(user.id)).order_by('-created_at')[:100]
    # New broadcasts (V2)
    broadcasts_v2 = AgentBroadcastV2.objects.filter(seller_id=str(user.id)).order_by('-created_at')[:100]

    items = []
    for b in broadcasts_legacy:
        items.append({
            'broadcast_id': str(b.id),
            'ref_type': 'demand_lead',
            'request_id': str(b.request_id),
            'status': b.status,
            'medium': b.medium,
            'sent_at': b.sent_at.isoformat() if b.sent_at else None,
            'response_log': b.response_log,
        })
    for b in broadcasts_v2:
        items.append({
            'broadcast_id': str(b.id),
            'ref_type': 'request',
            'request_id': str(b.request_id),
            'status': b.status,
            'medium': b.medium,
            'sent_at': b.sent_at.isoformat() if b.sent_at else None,
            'response_log': b.response_log,
        })

    items.sort(key=lambda x: x.get('sent_at') or '', reverse=True)
    return Response({'items': items, 'count': len(items)}, status=status.HTTP_200_OK)

