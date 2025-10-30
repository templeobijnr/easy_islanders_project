# assistant/views.py

import uuid
import logging
import json
import os
import time
from typing import Optional, List

from django.conf import settings
from django.db import models, transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from openai import OpenAI

# Use LangChain agent for all AI processing
# from .brain.agent import process_turn as lc_process_turn  # DELETED - using enterprise agent
from .brain.config import ENABLE_LANGGRAPH
# Legacy graph imports removed - using enterprise agent
graph_run_message = None
graph_run_event = None
from listings.models import Listing
from .models import DemandLead, ServiceProvider, KnowledgeBase, Conversation, Booking, Request
from .auth import (
    register_user, login_user, logout_user, 
    get_user_profile, update_user_profile, check_auth_status
)
from .serializers import (
    ServiceProviderSerializer,
    KnowledgeBaseSerializer,
    ListingSerializer,
    RequestSerializer,
    RequestCreateSerializer,
)
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from django.db import transaction
import json
import logging

from .models import Conversation, Message
from .tools import initiate_contact_with_seller
from .twilio_client import TwilioWhatsAppClient, MediaProcessor
from .models import ContactIndex

from .brain.guardrails import run_enterprise_guardrails

logger = logging.getLogger(__name__)

# Simple in-memory notification store (in production, use Redis or database)
# Import Redis-based notification system
from .utils.notifications import (
    put_card_display, get_card_display as get_card_display_data, pop_card_display,
    put_auto_display, get_auto_display as get_auto_display_data, pop_auto_display,
    put_notification, get_notification as get_notification_data
)

from .tasks import broadcast_request_to_sellers, broadcast_request_for_request


def _notify_new_images(listing_id: int, media_urls: List[str]):
    """Notify that new images are available for a listing."""
    try:
        # Get the updated listing with all images
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        
        # Get all current images (not just the new ones)
        all_image_urls = sd.get('image_urls', [])
        
        notification = {
            "listing_id": listing_id,
            "media_urls": media_urls,
            "image_urls": all_image_urls,  # All images, not just new ones
            "verified_with_photos": sd.get('verified_with_photos', False),
            "type": "new_images"
        }
        put_notification(listing_id, notification)
        logger.info(f"Notification created for listing {listing_id} with {len(media_urls)} new images, {len(all_image_urls)} total images")
    except Exception as e:
        logger.error(f"Failed to create notification for listing {listing_id}: {e}")
        # Fallback to basic notification
        notification = {
            "listing_id": listing_id,
            "media_urls": media_urls,
            "image_urls": media_urls,  # Fallback to just new images
            "verified_with_photos": False,
            "type": "new_images"
        }
        put_notification(listing_id, notification)


def _auto_trigger_image_display(listing_id: int, media_urls: List[str], conversation_id: Optional[str] = None):
    """Automatically trigger image display after processing images via POST."""
    try:
        # Get the updated listing with all images
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        from .utils.url_utils import normalize_image_list
        all_image_urls = normalize_image_list(sd.get('image_urls', []))
        
        # Create a comprehensive response that includes the images for immediate display
        response_data = {
            "listing_id": listing_id,
            "conversation_id": conversation_id,
            "image_count": len(all_image_urls),
            "image_urls": all_image_urls,
            "new_images": media_urls,
            "last_photo_update": sd.get('last_photo_update'),
            "verified_with_photos": sd.get('verified_with_photos', False),
            "auto_display": True,  # Flag to indicate this was auto-triggered
            "message": f"New images received and ready for display! {len(media_urls)} new image(s) added to listing {listing_id}."
        }
        
        # Store this as a special notification for immediate display
        # Use conversation_id as key if available, otherwise fallback to listing_id
        display_key = conversation_id or str(listing_id)
        put_auto_display(display_key, response_data)
        
        logger.info(f"Auto-triggered image display for listing {listing_id} (conversation: {conversation_id}) with {len(all_image_urls)} total images")
        
        return response_data
        
    except Exception as e:
        logger.exception(f"Failed to auto-trigger image display for listing {listing_id}")
        return None


# Old thread-based functions removed - now using Celery tasks







@api_view(['GET'])
@permission_classes([AllowAny])
def check_listing_images(request, listing_id: int):
    """Check for new images in a listing."""
    try:
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        
        # Convert image URLs from relative paths to API URLs
        images = []
        if sd.get("image_urls"):
            for img_url in sd.get("image_urls", []):
                if img_url.startswith('/listings/'):
                    # Convert relative path to full API URL
                    path_parts = img_url.strip('/').split('/')
                    if len(path_parts) >= 4 and path_parts[0] == 'listings' and path_parts[2] == 'media':
                        listing_id_from_path = path_parts[1]
                        filename = path_parts[3]
                        api_url = f"/api/listings/{listing_id_from_path}/media/{filename}"
                        images.append(api_url)
                    else:
                        images.append(img_url)
                else:
                    images.append(img_url)
        
        # Get notifications if conversation_id provided
        conversation_id = request.GET.get('conversation_id')
        notifications = []
        if conversation_id:
            notifications = get_notification_data(conversation_id)
            logger.info(f"Notifications for {conversation_id}: {len(notifications)} items")
        
        return Response({
            "listing_id": listing_id,
            "images": images,
            "image_count": len(images),
            "last_photo_update": sd.get('last_photo_update'),
            "verified_with_photos": sd.get('verified_with_photos', False),
            "auto_display": get_auto_display_data(conversation_id or str(listing_id)),
            "notifications": notifications
        })
        
    except Listing.DoesNotExist:
        return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("Image check error")
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_auto_display(request, listing_id: int):
    """Get auto-display data for a listing (triggered after POST webhook processes images)."""
    try:
        notification = pop_auto_display(listing_id)
        
        if notification:
            return Response({
                "has_auto_display": True,
                "data": notification.get("response_data", {}),
                "timestamp": notification.get("timestamp"),
                "type": "auto_display_images"
            })
        else:
            return Response({
                "has_auto_display": False,
                "data": None,
                "message": "No auto-display data available"
            })
    except Exception as e:
        logger.exception(f"Error getting auto-display data for listing {listing_id}")
        return Response({"error": "Internal server error"}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_card_display(request, listing_id: int):
    """Get card display data prepared after automatic GET request."""
    try:
        card_data = get_card_display_data(listing_id)
        
        if card_data:
            return Response({
                "has_card": True,
                "card": card_data.get("card_data"),
                "message": card_data.get("message"),
                "timestamp": card_data.get("timestamp"),
                "type": "card_display"
            })
        
        return Response({
            "has_card": False,
            "card": None,
            "message": "No card display data available"
        })
    except Exception as e:
        logger.exception(f"Error getting card display data for listing {listing_id}")
        return Response({"error": "Internal server error"}, status=500)


try:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client in views.py: {e}")
    openai_client = None


def _ensure_conversation(conversation_id: Optional[str]) -> str:
    """Ensure a conversation exists and return its ID."""
    if conversation_id:
        # Validate if conversation_id is a valid UUID
        try:
            uuid.UUID(conversation_id)
            Conversation.objects.get_or_create(id=conversation_id)
            return conversation_id
        except ValueError:
            # If not a valid UUID, create a new one
            pass
    
    # Create new conversation with valid UUID
    new_id = str(uuid.uuid4())
    Conversation.objects.get_or_create(id=new_id)
    return new_id


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_with_assistant(request):
    """
    Primary chat endpoint with thread ID state management.
    
    - Authenticates user (required for state persistence)
    - Generates/retrieves thread_id from ConversationThread model
    - Links to LangGraph checkpoint system
    - Supports cross-device sync via User ID
    
    Request:
    {
        "message": "Find me an apartment",
        "thread_id": "optional-uuid"  # If not provided, backend retrieves/creates active thread
    }
    
    Response:
    {
        "response": "...",
        "thread_id": "uuid",
        "language": "en",
        "recommendations": [...],
        "conversation_id": "uuid"  # Legacy field, same as thread_id
    }
    """
    user = request.user
    message = (request.data.get('message') or '').strip()
    
    if not message:
        return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    # Pre-model guardrail: block abusive/out-of-scope/injection before expensive routing
    guardrail_result = run_enterprise_guardrails(message)
    if not guardrail_result.passed:
        return Response({
            'response': "I'm sorry, I can't assist with that request.",
            'reason': guardrail_result.reason,
            'language': request.data.get('language', 'en'),
            'recommendations': [],
            'function_calls': [],
            'requires_phone': False,
        }, status=status.HTTP_200_OK)
    
    # Step 1: Resolve thread_id (ATOMIC - ISSUE-001 FIX)
    # - If provided in request, validate it
    # - If not provided, retrieve/create active thread for user
    thread_id = request.data.get('thread_id')
    
    try:
        from .models import ConversationThread
        if thread_id:
            # Try to fetch provided thread for this user; fall back if missing/stale
            try:
                thread = ConversationThread.objects.get(thread_id=thread_id, user=user, is_active=True)
            except ConversationThread.DoesNotExist:
                # Stale or foreign thread_id from localStorage; create/reuse active thread
                with transaction.atomic():
                    thread = ConversationThread.objects.select_for_update().filter(
                        user=user, is_active=True
                    ).first()
                    if not thread:
                        ConversationThread.objects.filter(user=user, is_active=True).update(is_active=False)
                        thread = ConversationThread.objects.create(
                            user=user,
                            thread_id=str(uuid.uuid4()),
                            is_active=True
                        )
                thread_id = thread.thread_id
        else:
            # Get or create active thread for this user (ATOMIC)
            with transaction.atomic():
                thread = ConversationThread.objects.select_for_update().filter(
                    user=user, is_active=True
                ).first()
                if not thread:
                    ConversationThread.objects.filter(user=user, is_active=True).update(is_active=False)
                    thread = ConversationThread.objects.create(
                        user=user,
                        thread_id=str(uuid.uuid4()),
                        is_active=True
                    )
            thread_id = thread.thread_id
            
        # Step 2: Process message through agent with robust error handling
        use_supervisor = getattr(settings, 'ENABLE_SUPERVISOR_AGENT', False)
        use_enterprise_agent = getattr(settings, 'ENABLE_ENTERPRISE_AGENT', True)
        
        lc_result = None
        agent_error = None
        
        try:
            if use_supervisor:
                # 🚦 Prefer Central Supervisor when enabled
                logger.info(f"[{thread_id}] Using Supervisor Agent path")
                from assistant.brain.agent import run_supervisor_agent
                lc_result = run_supervisor_agent(message, thread_id)
            elif use_enterprise_agent:
                # ✅ ENTERPRISE PATH: 12-node enterprise architecture
                logger.info(f"[{thread_id}] Using Enterprise Agent path")
                from assistant.brain.agent import run_enterprise_agent
                lc_result = run_enterprise_agent(message, thread_id)
            else:
                # All agent paths disabled - return safe fallback
                logger.warning(f"[{thread_id}] No agent path enabled; using fallback")
                lc_result = {
                    'message': 'Agent service is temporarily unavailable. Please try again later.',
                    'language': request.data.get('language', 'en'),
                    'recommendations': [],
                    'conversation_id': thread_id,
                }
        except Exception as agent_exc:
            # Gracefully degrade: catch agent exceptions and return friendly message
            logger.error(f"[{thread_id}] Agent execution failed: {agent_exc}", exc_info=True)
            agent_error = str(agent_exc)
            lc_result = {
                'message': 'I encountered an issue processing your request. Please try again in a moment.',
                'language': request.data.get('language', 'en'),
                'recommendations': [],
                'conversation_id': thread_id,
            }
        
        # Step 3: Return response with thread_id for client-side caching
        return Response({
            'response': lc_result.get('message', ''),
            'thread_id': thread_id,  # Return for localStorage caching
            'language': lc_result.get('language', 'en'),
            'recommendations': lc_result.get('recommendations') or [],
            'function_calls': [],
            'requires_phone': False,
            'conversation_id': thread_id,  # Legacy field
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Final safety net: if even guardrail or thread setup fails, return 200 with error message
        logger.error(f"Critical error in chat_with_assistant (view level): {e}", exc_info=True)
        return Response({
            'response': 'An error occurred. Please refresh and try again.',
            'language': request.data.get('language', 'en'),
            'recommendations': [],
            'conversation_id': 'unknown',
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def handle_chat_event(request):
    """
    Handles UI-driven events (e.g., button clicks) by translating them
    into natural language messages and processing them through the agent.
    """
    event_data = request.data
    event_type = event_data.get('event')
    conversation_id = _ensure_conversation(event_data.get('conversation_id'))
    
    if not event_type:
        return Response({'error': 'Event type cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

    # Translate the event into a natural language message for the agent
    message = ""
    listing_id = event_data.get('listing_id')
    
    if event_type == 'request_photos':
        if listing_id:
            message = f"The user requested photos for listing ID {listing_id}."
        else:
            return Response({'error': 'Listing ID is required for request_photos event.'}, status=status.HTTP_400_BAD_REQUEST)
    elif event_type == 'contact_agent':
        if listing_id:
            message = f"The user wants to contact the agent for listing ID {listing_id}."
        else:
            return Response({'error': 'Listing ID is required for contact_agent event.'}, status=status.HTTP_400_BAD_REQUEST)
    elif event_type == 'submit_contact_info':
        # New: Create generalized Request + open HITL gate (silent)
        try:
            from .models import Request as GenericRequest, ApproveBroadcast
            payload = event_data.get('data') or {}
            category = payload.get('category')
            if not category:
                return Response({'error': 'category required'}, status=status.HTTP_400_BAD_REQUEST)
            req = GenericRequest.objects.create(
                created_by=request.user,
                category=category,
                subcategory=payload.get('subcategory') or '',
                location=payload.get('location') or '',
                budget_amount=payload.get('budget_amount'),
                budget_currency=payload.get('budget_currency') or '',
                attributes=payload.get('attributes') or {},
                contact=payload.get('contact') or '',
                status='pending_approval',
            )
            approval = ApproveBroadcast.objects.create(
                request_fk=req,
                seller_ids=payload.get('seller_ids') or [],
                target_seller_count=len(payload.get('seller_ids') or []),
                medium=payload.get('medium') or 'whatsapp',
            )
            # Silent governance: do not expose HITL; confirm receipt
            return Response({
                'response': 'Thanks! We have your request and will reach out with options soon.',
                'language': 'en',
                'recommendations': [],
                'conversation_id': conversation_id,
                'request_id': str(req.id),
                'status': 'pending_approval',
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception('submit_contact_info failed')
            return Response({'error': 'Failed to submit contact info'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response({'error': f"Unknown event type: {event_type}"}, status=status.HTTP_400_BAD_REQUEST)

    # Process this "internal" message through the agent
    try:
        # For request_photos events, deterministically trigger outreach and persist context
        if event_type == 'request_photos' and listing_id:
            from .tools import initiate_contact_with_seller, check_for_new_images
            from .brain.memory import save_assistant_turn as mem_save_assistant_turn

            # Trigger outreach (also updates ContactIndex with conversation context)
            tool_result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                channel='whatsapp',
                language='en',
                conversation_id=conversation_id,
            )

            # Build assistant reply and persist as an agent_outreach turn
            if tool_result.get('ok'):
                # Capture baseline image count at the time of outreach
                baseline = check_for_new_images(int(listing_id))
                baseline_count = int(baseline.get('image_count') or 0)
                response_msg = f"OK, I've contacted the agent for listing {listing_id}. I'll let you know when they reply."
                pending_actions = [
                    {"type": "outreach_pictures", "listing_id": int(listing_id), "status": "waiting", "timestamp": timezone.now().isoformat(), "context": {"baseline_image_count": baseline_count}},
                    {"type": "outreach_availability", "listing_id": int(listing_id), "status": "waiting", "timestamp": timezone.now().isoformat()},
                ]
                mem_save_assistant_turn(
                    conversation_id,
                    message,
                    response_msg,
                    message_context={
                        "intent_type": "agent_outreach",
                        "tool_used": "initiate_contact_with_seller",
                        "pending_actions": pending_actions,
                        "contacted_listing": int(listing_id),
                        "outreach_ok": True,
                    },
                )
            elif tool_result.get('reason') == 'no_contact':
                response_msg = f"I'm sorry, but I don't have contact information for listing {listing_id}."
                mem_save_assistant_turn(
                    conversation_id,
                    message,
                    response_msg,
                    message_context={
                        "intent_type": "agent_outreach",
                        "tool_used": "initiate_contact_with_seller",
                        "contacted_listing": int(listing_id),
                        "outreach_ok": False,
                        "outreach_reason": "no_contact",
                    },
                )
            else:
                response_msg = f"I tried to contact the agent for listing {listing_id}, but ran into an issue."
                mem_save_assistant_turn(
                    conversation_id,
                    message,
                    response_msg,
                    message_context={
                        "intent_type": "agent_outreach",
                        "tool_used": "initiate_contact_with_seller",
                        "contacted_listing": int(listing_id),
                        "outreach_ok": False,
                        "outreach_reason": tool_result.get('reason') or 'error',
                    },
                )

            return Response({
                'response': response_msg,
                'language': 'en',
                'recommendations': [],
                'conversation_id': conversation_id,
            }, status=status.HTTP_200_OK)
        elif event_type == 'contact_agent' and listing_id:
            from .tools import initiate_contact_with_seller
            from .brain.memory import save_assistant_turn as mem_save_assistant_turn

            tool_result = initiate_contact_with_seller(
                listing_id=int(listing_id),
                channel='whatsapp',
                language='en',
                conversation_id=conversation_id,
            )

            if tool_result.get('ok'):
                response_msg = f"OK, I've contacted the agent for listing {listing_id}."
                mem_save_assistant_turn(
                    conversation_id,
                    message,
                    response_msg,
                    message_context={
                        "intent_type": "agent_outreach",
                        "tool_used": "initiate_contact_with_seller",
                        "contacted_listing": int(listing_id),
                        "outreach_ok": True,
                    },
                )
            else:
                response_msg = f"I tried to contact the agent for listing {listing_id}, but ran into an issue."
                mem_save_assistant_turn(
                    conversation_id,
                    message,
                    response_msg,
                    message_context={
                        "intent_type": "agent_outreach",
                        "tool_used": "initiate_contact_with_seller",
                        "contacted_listing": int(listing_id),
                        "outreach_ok": False,
                        "outreach_reason": tool_result.get('reason') or 'error',
                    },
                )

            return Response({
                'response': response_msg,
                'language': 'en',
                'recommendations': [],
                'conversation_id': conversation_id,
            }, status=status.HTTP_200_OK)
        else:
            # For other events, use the normal agent processing
            if ENABLE_LANGGRAPH and graph_run_message:
                lc_result = graph_run_message(message, conversation_id)
            else:
                # Use enterprise agent path as default
                try:
                    from assistant.brain.agent import run_enterprise_agent
                    lc_result = run_enterprise_agent(message, conversation_id)
                except Exception as e:
                    logger.error(f"Enterprise agent failed in handle_chat_event: {e}", exc_info=True)
                    lc_result = {
                        'message': 'I encountered an issue processing your request. Please try again.',
                        'language': 'en',
                        'recommendations': [],
                    }
                
            return Response({
                'response': lc_result.get('message', ''),
                'language': lc_result.get('language', 'en'),
                'recommendations': lc_result.get('recommendations') or [],
                'conversation_id': conversation_id,
            }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Critical error in handle_chat_event: {e}", exc_info=True)
        return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_recommendations(request):
    category_slug = request.query_params.get('category')
    location = request.query_params.get('location')

    # Query the Listing model - use status='active' (not is_active/is_published which don't exist)
    queryset = Listing.objects.filter(status='active').order_by('-created_at')
    
    if category_slug:
        # Filter by the slug of the related Category
        queryset = queryset.filter(category__slug__iexact=category_slug)
        
    if location:
        queryset = queryset.filter(location__icontains=location)

    # Use the ListingSerializer with request context for absolute URLs
    serializer = ListingSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


class KnowledgeBaseListView(generics.ListAPIView):
    serializer_class = KnowledgeBaseSerializer

    def get_queryset(self):
        queryset = KnowledgeBase.objects.filter(is_active=True)
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(keywords__icontains=search_query) |
                models.Q(content_en__icontains=search_query)
            )
        return queryset

    def get_serializer_context(self):
        return {'language': self.request.query_params.get('language', 'en')}


# ------------------- Devi AI Webhook (HTTPS + CORS safe) -------------------

def _is_https(request) -> bool:
    """
    Returns True if the request is HTTPS, honoring common proxy headers.
    """
    if request.is_secure():
        return True
    # Honor reverse proxy headers if configured
    xfp = request.META.get('HTTP_X_FORWARDED_PROTO')
    if xfp and 'https' in xfp.lower():
        return True
    return False


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # CORS will be handled by middleware; CSRF disabled via decorator
def devi_webhook_receiver(request):
    """
    Receives batched events from Devi AI and ingests them.
    Requirements:
      - HTTPS endpoint (reject non-HTTPS unless DEBUG=True).
      - CORS-enabled globally (see settings below).
    """
    # Enforce HTTPS in non-DEBUG environments
    if not settings.DEBUG and not _is_https(request):
        return Response({"error": "https_required"}, status=status.HTTP_400_BAD_REQUEST)

    if not openai_client:
        return Response({"error": "AI classification client not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    payload = request.data or {}
    items = payload.get('items', [])
    if not isinstance(items, list):
        return Response({"error": "Invalid payload: 'items' must be a list"}, status=status.HTTP_400_BAD_REQUEST)

    processed, skipped, errors = 0, 0, 0

    for item in items:
        try:
            provider = (item.get('provider') or '').lower().strip()
            content = (item.get('content') or '').strip()
            item_id = (item.get('id') or '').strip()
            if not content or not item_id:
                skipped += 1
                continue

            # Accept only known providers you care about
            if provider not in {'facebook', 'telegram', 'whatsapp', 'twitter', 'linkedin', 'reddit'}:
                provider = 'other'

            # Idempotency
            if DemandLead.objects.filter(source_id=item_id).exists() or Listing.objects.filter(source_id=item_id).exists():
                skipped += 1
                continue

            # Classify & structure via OpenAI
            prompt = f"""
You are a data extraction expert for the North Cyprus market. Analyze the following community post.

First, classify the primary intent as either "supply" (offering a property/car/item for sale/rent) or "demand" (looking for a product/service).

Second, extract the key info into a structured object based on its type.

POST:
\"\"\"{content}\"\"\"

Return only a single valid JSON object with two top-level keys: "type" (string) and "data" (object).
- For 'supply', extract: listing_type (e.g., "property_rent", "car_sale"), title, description, location, bedrooms, price, currency, contact_info.
- For 'demand', extract: requested_item (e.g., "apartment", "used_car"), requirements (e.g., location, budget, bedrooms).
Omit missing keys.
""".strip()

            model_name = getattr(settings, "OPENAI_CLASSIFIER_MODEL", getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"))
            completion = openai_client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            try:
                ai_json = json.loads(completion.choices[0].message.content or "{}")
            except Exception:
                skipped += 1
                continue

            lead_type = (ai_json.get("type") or "").lower()
            structured = ai_json.get("data") or {}
            if lead_type not in {"supply", "demand"}:
                skipped += 1
                continue

            posted_at_dt = parse_datetime(item.get('postedAt') or "") if item.get('postedAt') else None
            url = item.get('url')
            author_name = item.get('authorName')
            keywords = item.get('keywords') or []

            if lead_type == "demand":
                with transaction.atomic():
                    DemandLead.objects.create(
                        source_id=item_id,
                        source_provider=provider if provider in dict(DemandLead.SOURCE_CHOICES) else "other",
                        source_url=url,
                        author_name=author_name or "",
                        raw_content=content,
                        keywords_detected=keywords,
                        posted_at=posted_at_dt,
                        structured_lead=structured,
                        is_processed=True,
                    )
                processed += 1
            else:
                # Prepare Listing fields
                listing_type = structured.get("listing_type", "unknown")
                location = structured.get("location") or ""
                price = structured.get("price")
                currency = structured.get("currency") or ""

                with transaction.atomic():
                    Listing.objects.create(
                        source_id=item_id,
                        source_name=f"{provider.title()} Source",
                        source_url=url,
                        raw_text=content,
                        structured_data=structured,
                        listing_type=listing_type,
                        location=location,
                        price=price,
                        currency=currency,
                        posted_at=posted_at_dt,
                    )
                processed += 1

        except Exception as e:
            errors += 1
            logger.exception("[Devi] Error processing item: %s", e)

    return Response({"status": "ok", "processed": processed, "skipped": skipped, "errors": errors}, status=status.HTTP_200_OK)


@csrf_exempt
@require_http_methods(["POST"])
def agent_outreach(request):
    """
    Agent outreach endpoint - contacts sellers on behalf of users.
    
    Expected payload:
    {
        "listing_id": 123,
        "channel": "whatsapp",  # whatsapp, telegram, sms, phone
        "language": "en",
        "user_message": "Optional custom message from user"
      }
    """
    try:
        data = json.loads(request.body)
        listing_id = data.get("listing_id")
        channel = data.get("channel", "whatsapp")
        language = data.get("language", "en")
        user_message = data.get("user_message", "")
        
        if not listing_id:
            return JsonResponse({"error": "listing_id is required"}, status=400)
        
        # Validate channel
        valid_channels = ["whatsapp", "telegram", "sms", "phone"]
        if channel not in valid_channels:
            return JsonResponse({"error": f"Invalid channel. Must be one of: {valid_channels}"}, status=400)
        
        # Get the listing
        listing = get_object_or_404(Listing, id=listing_id, is_active=True)
        
        # Check if we already have contact info
        sd = listing.structured_data or {}
        contact_info = sd.get("contact_info", "")
        
        if not contact_info:
            return JsonResponse({
                "error": "No contact information available for this listing",
                "listing_id": listing_id
            }, status=400)
        
        # For WhatsApp, use Twilio client directly
        if channel == "whatsapp":
            twilio_client = TwilioWhatsAppClient()
            contact_number = contact_info
            
            if contact_number:
                result = twilio_client.send_outreach_message(listing_id, contact_number, language)
                
                if result["success"]:
                    # Update listing with outreach record
                    _record_outreach_attempt(listing, channel, contact_number, language, result)
                    
                    return JsonResponse({
                        "success": True,
                        "message": "WhatsApp outreach initiated successfully",
                        "outreach_id": result.get("message_sid"),
                        "status": "sent",
                        "listing_id": listing_id,
                        "channel": channel
                    })
                else:
                    return JsonResponse({
                        "success": False,
                        "error": result.get("error", "Twilio API error"),
                        "listing_id": listing_id
                    }, status=400)
        
        # For other channels, use the existing tool
        result = initiate_contact_with_seller(
            listing_id=listing_id,
            channel=channel,
            language=language
        )
        
        if result.get("ok"):
            outreach_id = None
            try:
                payload = result.get("data") or []
                if isinstance(payload, list) and payload:
                    outreach_id = payload[0].get("outreach_id")
            except Exception:
                outreach_id = None
            return JsonResponse({
                "success": True,
                "message": "Outreach initiated successfully",
                "outreach_id": outreach_id,
                "status": "queued",
                "listing_id": listing_id
            })
        else:
            return JsonResponse({
                "success": False,
                "error": result.get("reason", "Unknown error"),
                "listing_id": listing_id
            }, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Listing.DoesNotExist:
        return JsonResponse({"error": "Listing not found"}, status=404)
    except Exception as e:
        logger.exception("Agent outreach error")
        return JsonResponse({"error": "Internal server error"}, status=500)
    
def _record_outreach_attempt(listing, channel, contact_number, language, result):
    """Record outreach attempt in listing structured_data."""
    try:
        sd = listing.structured_data or {}
        
        outreach_entry = {
            "channel": channel,
            "to": contact_number,
            "language": language,
            "at": timezone.now().isoformat(),
            "status": "sent",
            "twilio_message_sid": result.get("message_sid"),
            "outreach_id": f"outreach_{listing.id}_{channel}_{int(timezone.now().timestamp())}"
        }
        
        existing = sd.get("outreach") or []
        if not isinstance(existing, list):
            existing = [existing]
        existing.append(outreach_entry)
        sd["outreach"] = existing
        
        listing.structured_data = sd
        listing.save(update_fields=["structured_data"])
        
    except Exception as e:
        logger.exception(f"Failed to record outreach for listing {listing.id}")


def _validate_twilio_webhook(request) -> bool:
    """Validate Twilio webhook signature for security."""
    try:
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        signature = request.META.get('HTTP_X_TWILIO_SIGNATURE', '')
        url = request.build_absolute_uri()
        data = request.POST.dict()
        return validator.validate(url, data, signature)
    except Exception as e:
        logger.warning(f"Twilio webhook validation failed: {e}")
        return False


# 1. View to get details for a single listing
class ListingDetailView(generics.RetrieveAPIView):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer
    lookup_field = 'id'

# 2. View to trigger the photo request
@api_view(['POST'])
def request_listing_photos(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id)
    
    # Prevent re-requesting if already pending
    if listing.photos_requested:
        return Response({'status': 'Photos already requested'}, status=status.HTTP_400_BAD_REQUEST)
    
    # --- Trigger Twilio Logic ---
    # success = send_photo_request_to_agent(listing.contact_number)
    # if not success:
    #     return Response({'error': 'Failed to send WhatsApp message'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    listing.photos_requested = True
    listing.save()
    
    # Return the updated listing data so the frontend can immediately update its state
    serializer = ListingSerializer(listing, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST', 'GET'])  # Allow GET for health checks
def twilio_webhook(request):
    """
    Twilio webhook endpoint for receiving WhatsApp replies and media.
    
    This endpoint receives:
    - Text messages from sellers
    - Media (photos) from sellers
    - Delivery status updates
    
    Expected Twilio webhook data:
    - Body: Message text
    - MediaUrl0, MediaUrl1, etc.: Media URLs
    - From: Sender's WhatsApp number
    - MessageSid: Unique message ID
    """
    # ISSUE-012 FIX: Use appropriate log level (INFO, not CRITICAL)
    logger.info("Twilio webhook received")
    if request.method == "POST":
        logger.debug(f"Webhook POST data: {request.POST.dict()}")  # DEBUG level for detailed data
    else:
        logger.info("Webhook verification request (GET)")

    try:
        # Handle GET requests (webhook verification)
        if request.method == "GET":
            logger.info("Twilio webhook verification request")
            return JsonResponse({"status": "webhook verified", "message": "Easy Islanders webhook is active"})
        
        # Validate webhook signature (skip in DEBUG mode for development)
        if not settings.DEBUG and not _validate_twilio_webhook(request):
            logger.warning("Invalid Twilio webhook signature")
            return JsonResponse({"error": "Invalid signature"}, status=403)
        
        # Handle POST requests (actual webhook data)
        webhook_data = request.POST.dict()
        logger.info(f"Twilio webhook received: {webhook_data}")

        # --- Resolve sender and context FIRST ---
        from_number = (webhook_data.get('From') or '').replace('whatsapp:', '')
        listing_id = None
        conversation_id = None
        try:
            norm = ''.join(ch for ch in from_number if ch.isdigit() or ch == '+')
            
            # Enhanced resolution strategy: prioritize by conversation context
            all_contacts = ContactIndex.objects.filter(normalized_contact__icontains=norm).select_related('conversation', 'listing').order_by('-created_at')
            
            logger.critical(f"Found {all_contacts.count()} ContactIndex entries for number {from_number} (normalized: {norm})")
            for i, contact in enumerate(all_contacts):
                logger.critical(f"  Entry {i+1}: listing_id={contact.listing_id}, conversation_id={contact.conversation.conversation_id if contact.conversation else None}, created_at={contact.created_at}")
            
            # Strategy 1: Look for entries with active conversations (most recent first)
            active_conversation_contacts = all_contacts.filter(conversation__isnull=False).order_by('-created_at')
            if active_conversation_contacts.exists():
                idx = active_conversation_contacts.first()
                listing_id = idx.listing_id
                conversation_id = idx.conversation.conversation_id
                logger.critical(f"RESOLVED via active conversation: listing_id={listing_id}, conversation_id={conversation_id}")
            else:
                # Strategy 2: Fallback to most recent entry (original behavior)
                idx = all_contacts.first()
                if idx:
                    listing_id = idx.listing_id
                    conversation_id = idx.conversation.conversation_id if idx.conversation else None
                    logger.critical(f"RESOLVED via fallback (most recent): listing_id={listing_id}, conversation_id={conversation_id}")
                else:
                    logger.warning(f"Webhook context NOT FOUND for number: {from_number} (Normalized: {norm})")
                    
        except Exception as e:
            logger.error(f"Error resolving ContactIndex for incoming webhook: {e}")
        
        # Check if this is a media message
        media_urls = []
        for i in range(10):  # Check up to 10 media URLs
            media_url = webhook_data.get(f'MediaUrl{i}')
            if media_url:
                media_urls.append(media_url)
                logger.info(f"Found media URL {i}: {media_url}")
        
        if media_urls:
            if not listing_id:
                logger.error(f"Received media from {from_number} but could not resolve a listing_id.")
                return JsonResponse({"success": False, "error": "Could not identify the listing for this media."}, status=400)

            # Process media (photos) - ATOMIC TRANSACTION (ISSUE-002 FIX)
            stored_urls = []
            try:
                with transaction.atomic():
                    for media_url in media_urls:
                        # Extract media ID from URL or use MessageSid
                        media_id = webhook_data.get('MessageSid', str(uuid.uuid4()))
                        
                        # Download and store media
                        processor = MediaProcessor()
                        permanent_url = processor.download_and_store_media(media_url, listing_id, media_id)
                        
                        if permanent_url:
                            stored_urls.append(permanent_url)
                    
                    if stored_urls:
                        logger.info(f"Stored {len(stored_urls)} media items for listing {listing_id}")
                        
                        # Trigger notification to frontend that new images are available
                        _notify_new_images(listing_id, stored_urls)
                        
                        # Automatically trigger image display (simulates GET request)
                        auto_display_data = _auto_trigger_image_display(listing_id, stored_urls, conversation_id)
                        
                        # Commit transaction before triggering async tasks
                        transaction.on_commit(
                            lambda: trigger_get_and_prepare_card_task.delay(listing_id, conversation_id=conversation_id)
                        )
            except Exception as media_error:
                logger.error(f"Transaction rolled back due to media processing error: {media_error}")
                return JsonResponse({"success": False, "error": "Failed to process media atomically"}, status=500)
            
            if stored_urls:
                # Import here to avoid circular dependency
                from .tasks import trigger_get_and_prepare_card_task
                
                # AUTO-RESPONSE: Trigger intelligent agent response (feature flag controlled)
                logger.critical(f"AUTO-RESPONSE CHECK: ENABLE_AUTO_RESPONSE={getattr(settings, 'ENABLE_AUTO_RESPONSE', False)}")
                if getattr(settings, 'ENABLE_AUTO_RESPONSE', False):
                    from .auto_response import trigger_auto_response
                    logger.critical(f"AUTO-RESPONSE TRIGGER: About to trigger auto-response for listing {listing_id}")
                    
                    # If no conversation_id, create one or use a default
                    if not conversation_id:
                        # Try to find or create a conversation for this listing
                        from .models import Conversation
                        try:
                            # Look for existing conversation for this listing
                            conv = Conversation.objects.filter(
                                conversation_id__contains=str(listing_id)
                            ).first()
                            
                            if not conv:
                                # Create a new conversation for this listing
                                conv = Conversation.objects.create(
                                    conversation_id=f"listing_{listing_id}_{int(time.time())}"
                                )
                                logger.info(f"Created new conversation {conv.conversation_id} for listing {listing_id}")
                            
                            conversation_id = conv.conversation_id
                        except Exception as e:
                            logger.error(f"Failed to create conversation for listing {listing_id}: {e}")
                            # Use a fallback conversation ID
                            conversation_id = f"listing_{listing_id}_fallback"
                    
                    # Prepare webhook data for auto-response
                    auto_response_data = {
                        "listing_id": listing_id,
                        "conversation_id": conversation_id,
                        "text": webhook_data.get('Body', ''),
                        "from_number": from_number
                    }
                    
                    # Add media URLs
                    for i in range(10):
                        media_url = webhook_data.get(f'MediaUrl{i}')
                        if media_url:
                            auto_response_data[f'MediaUrl{i}'] = media_url
                    
                    # Trigger auto-response (async)
                    result = trigger_auto_response.delay(
                        listing_id=listing_id,
                        conversation_id=conversation_id,
                        webhook_data=auto_response_data
                    )
                    logger.critical(f"AUTO-RESPONSE TRIGGERED: Task ID {result.id} for listing {listing_id} with conversation {conversation_id}")
                else:
                    logger.critical(f"AUTO-RESPONSE DISABLED: Feature flag is False, not triggering auto-response")
                
                # Update LangGraph state with media_received event (before returning)
                if ENABLE_LANGGRAPH and graph_run_event and conversation_id:
                    try:
                        graph_run_event(conversation_id, 'media_received', listing_id=listing_id, image_count=len(stored_urls), verified_with_photos=True)
                    except Exception:
                        pass
                
                # NEW: Persist durable chat message for images
                try:
                    if conversation_id:
                        from .models import Conversation, Message
                        conv = Conversation.objects.get(id=conversation_id)
                        Message.objects.create(
                            conversation=conv,
                            role='assistant',
                            content=f"New photos received for listing {listing_id}.",
                            language='en',
                            message_context={
                                'intent_type': 'status_update',
                                'images_received': True,
                                'listing_id': listing_id,
                            }
                        )
                except Exception:
                    logger.exception("Failed to persist photo chat message")
                
                # Return enhanced response with image data for immediate display
                response_data = {
                    "success": True,
                    "message": "Media processed successfully",
                    "listing_id": listing_id,
                    "media_urls": stored_urls,
                    "auto_display": True,
                    "images_ready": True
                }
                
                # Include the auto-display data if available
                if auto_display_data:
                    response_data.update({
                        "total_images": auto_display_data.get("image_count", 0),
                        "all_image_urls": auto_display_data.get("image_urls", []),
                        "display_message": auto_display_data.get("message", ""),
                        "verified_with_photos": auto_display_data.get("verified_with_photos", False)
                    })
                
                return JsonResponse(response_data)
            else:
                logger.error("Failed to store any media items")
                return JsonResponse({"success": False, "error": "Failed to process media"}, status=400)
        else:
            # Text message: parse availability; notify UI and update DB
            body_raw = webhook_data.get('Body') or ''
            body = body_raw.strip().lower()
            logger.info(f"Text message received from {from_number}: {body_raw}")
            
            # Context is already resolved above
            logger.info(f"Text message context: listing_id={listing_id}, conversation_id={conversation_id}")
            
            # Parse availability heuristics
            availability = None
            neg_patterns = ["not available", "no longer available", "unavailable", "rented", "sold", "no"]
            pos_patterns = ["still available", "available", "yes", "ready"]
            if any(p in body for p in neg_patterns):
                availability = 'unavailable'
            elif any(p in body for p in pos_patterns):
                availability = 'available'
            
            logger.info(f"Parsed availability: {availability}")
            
            if listing_id and availability:
                try:
                    listing = Listing.objects.get(id=listing_id)
                    sd = listing.structured_data or {}
                    sd['availability'] = availability
                    sd['last_agent_text'] = body_raw
                    sd['last_agent_reply_at'] = timezone.now().isoformat()
                    listing.structured_data = sd
                    listing.save(update_fields=['structured_data'])
                except Exception:
                    logger.exception("Failed updating listing availability")
                
                # Notify frontend via conversation-level notification
                try:
                    note_key = conversation_id or str(listing_id)
                    put_notification(note_key, {
                        'type': 'availability_update',
                        'listing_id': listing_id,
                        'availability': availability,
                        'message': f"Agent confirmed listing {listing_id} is {availability}",
                    })
                except Exception:
                    logger.exception("Failed to push availability notification")
                
                # Persist assistant turn for durable context
                try:
                    if conversation_id:
                        from .models import Conversation, Message
                        conv = Conversation.objects.get(id=conversation_id)
                        Message.objects.create(
                            conversation=conv,
                            role='assistant',
                            content=f"Agent confirmed listing {listing_id} is {availability}.",
                            language='en',
                            message_context={
                                'intent_type': 'status_update',
                                'availability_update': availability,
                                'listing_id': listing_id,
                            }
                        )
                except Exception:
                    logger.exception("Failed to persist availability chat message")
                
                # Update graph state (optional)
                if ENABLE_LANGGRAPH and graph_run_event and conversation_id:
                    try:
                        graph_run_event(conversation_id, 'availability_received', listing_id=listing_id, availability=availability)
                    except Exception:
                        pass
                
                # AUTO-RESPONSE: Trigger intelligent agent response for text messages
                logger.critical(f"AUTO-RESPONSE CHECK (TEXT): ENABLE_AUTO_RESPONSE={getattr(settings, 'ENABLE_AUTO_RESPONSE', False)}")
                if getattr(settings, 'ENABLE_AUTO_RESPONSE', False):
                    from .auto_response import trigger_auto_response
                    logger.critical(f"AUTO-RESPONSE TRIGGER (TEXT): About to trigger auto-response for listing {listing_id}")
                    
                    # Prepare webhook data for auto-response
                    auto_response_data = {
                        "listing_id": listing_id,
                        "conversation_id": conversation_id,
                        "text": body_raw,
                        "from_number": from_number
                    }
                    
                    # Trigger auto-response (async)
                    result = trigger_auto_response.delay(
                        listing_id=listing_id,
                        conversation_id=conversation_id,
                        webhook_data=auto_response_data
                    )
                    logger.critical(f"AUTO-RESPONSE TRIGGERED (TEXT): Task ID {result.id} for listing {listing_id} with conversation {conversation_id}")
                else:
                    logger.critical(f"AUTO-RESPONSE DISABLED (TEXT): Feature flag is False, not triggering auto-response")
                
                return JsonResponse({"success": True, "message": "Availability processed", "listing_id": listing_id, "availability": availability})
            
            # AUTO-RESPONSE: Also trigger for text messages without availability
            logger.critical(f"AUTO-RESPONSE CHECK (TEXT NO AVAIL): ENABLE_AUTO_RESPONSE={getattr(settings, 'ENABLE_AUTO_RESPONSE', False)}")
            if getattr(settings, 'ENABLE_AUTO_RESPONSE', False):
                from .auto_response import trigger_auto_response
                logger.critical(f"AUTO-RESPONSE TRIGGER (TEXT NO AVAIL): About to trigger auto-response for listing {listing_id}")
                
                # Prepare webhook data for auto-response
                auto_response_data = {
                    "listing_id": listing_id,
                    "conversation_id": conversation_id,
                    "text": body_raw,
                    "from_number": from_number
                }
                
                # Trigger auto-response (async)
                result = trigger_auto_response.delay(
                    listing_id=listing_id,
                    conversation_id=conversation_id,
                    webhook_data=auto_response_data
                )
                logger.critical(f"AUTO-RESPONSE TRIGGERED (TEXT NO AVAIL): Task ID {result.id} for listing {listing_id} with conversation {conversation_id}")
            else:
                logger.critical(f"AUTO-RESPONSE DISABLED (TEXT NO AVAIL): Feature flag is False, not triggering auto-response")
            
            return JsonResponse({"success": True, "message": "Text message received"})
        
    except Exception as e:
        logger.exception("Twilio webhook processing error")
        return JsonResponse({"error": "Internal server error"}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def twilio_webhook_health(request):
    """Health check endpoint for Twilio webhook monitoring."""
    return Response({"status": "ok", "message": "Webhook is healthy"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def listing_details(request, listing_id):
    """Get detailed information about a specific listing."""
    try:
        listing = Listing.objects.get(id=listing_id, is_active=True)
        sd = listing.structured_data or {}
        
        # Convert image URLs from relative paths to API URLs
        images = []
        if sd.get("image_urls"):
            for img_url in sd.get("image_urls", []):
                if img_url.startswith('/listings/'):
                    # Convert relative path to full API URL
                    path_parts = img_url.strip('/').split('/')
                    if len(path_parts) >= 4 and path_parts[0] == 'listings' and path_parts[2] == 'media':
                        listing_id_from_path = path_parts[1]
                        filename = path_parts[3]
                        api_url = f"/api/listings/{listing_id_from_path}/media/{filename}"
                        images.append(api_url)
                    else:
                        images.append(img_url)
                else:
                    images.append(img_url)
        
        return Response({
            "id": listing.id,
            "title": sd.get("title", f"Listing #{listing.id}"),
            "description": sd.get("description", ""),
            "images": images,
            "verified_with_photos": sd.get("verified_with_photos", False),
            "image_count": len(images)
        })
        
    except Listing.DoesNotExist:
        return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("Listing details error")
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def serve_listing_media(request, listing_id, filename):
    """
    Serve media files for listings using Django's storage system.
    This handles images received from WhatsApp that are stored via default_storage.
    """
    try:
        from django.core.files.storage import default_storage
        
        # Sanitize filename to prevent path traversal
        import os
        safe_filename = os.path.basename(filename)

        # Try multiple possible file paths
        possible_paths = [
            f"listings/{listing_id}/media/{safe_filename}",
            f"media/listings/{listing_id}/media/{safe_filename}",
            f"listings/{listing_id}/{safe_filename}",
            f"media/listings/{listing_id}/{safe_filename}"
        ]
        
        file_obj = None
        storage_path = None
        
        # First try Django storage
        for path in possible_paths:
            if default_storage.exists(path):
                file_obj = default_storage.open(path, 'rb')
                storage_path = path
                break
        
        # If not found in Django storage, try direct filesystem access
        if not file_obj:
            from django.conf import settings
            
            # Try direct filesystem paths
            fs_paths = [
                os.path.join(settings.BASE_DIR, f"listings/{listing_id}/media/{safe_filename}"),
                os.path.join(settings.BASE_DIR, f"media/listings/{listing_id}/media/{safe_filename}"),
                os.path.join(settings.BASE_DIR, f"listings/{listing_id}/{safe_filename}"),
                os.path.join(settings.BASE_DIR, f"media/listings/{listing_id}/{safe_filename}")
            ]
            
            for fs_path in fs_paths:
                if os.path.exists(fs_path):
                    file_obj = open(fs_path, 'rb')
                    storage_path = fs_path
                    break
        
        if not file_obj:
            logger.warning(f"Media file not found in any location: {filename}")
            raise Http404("Media file not found")
        
        # Determine content type based on file extension
        content_type = 'image/jpeg'  # Default
        if filename.lower().endswith('.png'):
            content_type = 'image/png'
        elif filename.lower().endswith('.webp'):
            content_type = 'image/webp'
        elif filename.lower().endswith('.gif'):
            content_type = 'image/gif'
        
        # Serve the file
        return FileResponse(
            file_obj,
            content_type=content_type,
            filename=filename
        )
        
    except Exception as e:
        logger.exception(f"Error serving media file: {listing_id}/{filename}")
        raise Http404("Media file not found")


# ==================== BOOKING ENDPOINTS ====================

@api_view(['POST'])
def create_booking(request):
    """Create a new property viewing booking."""
    try:
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        data = request.data
        listing_id = data.get('listing_id')
        conversation_id = data.get('conversation_id')
        
        if not listing_id:
            return Response({'error': 'Listing ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create conversation
        conversation = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                pass
        
        if not conversation:
            conversation = Conversation.objects.create(
                user_id=str(request.user.id),
                language=data.get('language', 'en')
            )
        
        # Create booking
        booking = Booking.objects.create(
            listing=listing,
            user=request.user,
            conversation=conversation,
            preferred_date=data.get('preferred_date'),
            preferred_time=data.get('preferred_time'),
            message=data.get('message', ''),
            contact_phone=data.get('contact_phone', ''),
            contact_email=data.get('contact_email', '')
        )
        
        # Send booking notification to agent via WhatsApp (through platform only)
        try:
            from .twilio_client import send_whatsapp_message
            sd = listing.structured_data or {}
            title = sd.get('title') or f"Listing #{listing.id}"
            message = f"""
🏠 NEW BOOKING REQUEST

Property: {title}
Location: {listing.location or 'North Cyprus'}
Price: {listing.price or ''} {listing.currency or ''}

Client: {request.user.username}
Booking ID: {booking.id}

Preferred Date: {booking.preferred_date.strftime('%Y-%m-%d')}
Preferred Time: {booking.preferred_time.strftime('%H:%M')}

Message: {booking.message or 'No additional message'}

Please reply with your available times for this date.
Reply format: "Available: 2:00 PM, 3:30 PM, 5:00 PM"
            """.strip()

            # Send to listing agent
            if listing.contact_identifier:
                send_whatsapp_message(
                    to=listing.contact_identifier,
                    message=message
                )

        except Exception as e:
            logger.error(f"Failed to send booking notification: {e}")
        
        return Response({
            'success': True,
            'booking_id': str(booking.id),
            'message': 'Booking created successfully. The agent will contact you soon.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        return Response({'error': 'Failed to create booking'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_user_bookings(request):
    """Get user's bookings."""
    try:
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        
        booking_data = []
        for booking in bookings:
            sd = booking.listing.structured_data or {}
            img_urls = []
            try:
                img_urls = sd.get('image_urls') or booking.listing.image_urls or []
            except Exception:
                img_urls = []
            first_image = img_urls[0] if img_urls else None
            booking_data.append({
                'id': str(booking.id),
                'listing': {
                    'id': booking.listing.id,
                    'title': sd.get('title') or f"Listing #{booking.listing.id}",
                    'location': booking.listing.location,
                    'price': booking.listing.price,
                    'currency': booking.listing.currency,
                    'image_url': first_image
                },
                'preferred_date': booking.preferred_date.isoformat(),
                'preferred_time': booking.preferred_time.strftime('%H:%M'),
                'message': booking.message,
                'status': booking.status,
                'agent_response': booking.agent_response,
                'agent_available_times': booking.agent_available_times,
                'agent_notes': booking.agent_notes,
                'created_at': booking.created_at.isoformat(),
                'confirmed_at': booking.confirmed_at.isoformat() if booking.confirmed_at else None
            })
        
        return Response({
            'bookings': booking_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting bookings: {e}")
        return Response({'error': 'Failed to get bookings'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_booking_status(request, booking_id):
    """Update booking status (for agents)."""
    try:
        data = request.data
        new_status = data.get('status')
        agent_response = data.get('agent_response', '')
        agent_available_times = data.get('agent_available_times', [])
        agent_notes = data.get('agent_notes', '')
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
        booking.status = new_status
        if agent_response:
            booking.agent_response = agent_response
        if agent_available_times:
            booking.agent_available_times = agent_available_times
        if agent_notes:
            booking.agent_notes = agent_notes
        
        if new_status == 'confirmed':
            booking.confirmed_at = timezone.now()
        
        booking.save()
        
        return Response({
            'success': True,
            'message': 'Booking status updated successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating booking status: {e}")
        return Response({'error': 'Failed to update booking status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_conversation_notifications(request):
    """
    Get notifications for a specific conversation.
    This endpoint is polled by the frontend to check for new images and updates.
    """
    try:
        conversation_id = request.query_params.get('conversation_id')
        if not conversation_id:
            return Response({'error': 'Conversation ID required'}, status=400)
        
        notifications = []
        
        # Get auto-display data (new images ready for display)
        auto_display_data = get_auto_display_data(conversation_id)
        if auto_display_data:
            # Extract the actual response data from the stored structure
            response_data = auto_display_data.get('response_data', auto_display_data)
            notifications.append({
                'type': 'new_images',
                'data': response_data,
                'timestamp': timezone.now().isoformat()
            })
        
        # Get card display data (updated recommendation cards)
        card_data = get_card_display_data(conversation_id)
        if card_data:
            # Extract the actual card data from the stored structure
            actual_card_data = card_data.get('card_data', card_data)
            notifications.append({
                'type': 'card_update',
                'data': actual_card_data,
                'timestamp': timezone.now().isoformat()
            })
        
        # Get general notifications (including proactive updates)
        general_notifications = get_notification_data(conversation_id)
        # ISSUE-012 FIX: Use DEBUG level for debugging info
        logger.debug(f"Getting notifications for conversation: {conversation_id}")
        logger.debug(f"General notifications retrieved: {general_notifications}")
        if general_notifications:
            notif_type = general_notifications.get('type')
            # Normalize legacy/alt types to the UI-supported 'proactive_update'
            if notif_type in ('proactive_update', 'auto_update'):
                logger.info(f"DEBUG: Mapping notification type '{notif_type}' to 'proactive_update': {general_notifications}")
                notifications.append({
                    'type': 'proactive_update',
                    'data': general_notifications.get('data', {}),
                    'timestamp': general_notifications.get('timestamp', timezone.now().isoformat())
                })
            else:
                notifications.append({
                    'type': 'general',
                    'data': general_notifications,
                    'timestamp': timezone.now().isoformat()
                })
        
        # ISSUE-012 FIX: Use DEBUG level for debugging info
        logger.debug(f"Returning {len(notifications)} notifications for conversation {conversation_id}")
        logger.debug(f"Notification details: {notifications}")
        
        return Response({
            'notifications': notifications,
            'count': len(notifications)
        })
        
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({'error': f'Failed to get notifications: {str(e)}'}, status=500)


@api_view(['POST'])
def clear_notifications(request):
    """
    Clear notifications for a specific conversation.
    Called by frontend after processing notifications.
    """
    try:
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            return Response({'error': 'Conversation ID required'}, status=400)
        
        # Clear all notification types
        pop_auto_display(conversation_id)
        pop_card_display(conversation_id)
        # Note: get_notification doesn't have a pop equivalent, so we'll leave it
        
        return Response({
            'success': True,
            'message': 'Notifications cleared'
        })
        
    except Exception as e:
        logger.error(f"Error clearing notifications: {e}")
        return Response({'error': 'Failed to clear notifications'}, status=500)


# ============================================================================
# SECTION: Thread Management & State Persistence (F.1 Implementation)
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_conversation(request):
    """
    Get the current active conversation thread for the authenticated user.
    
    Used for cross-device sync: when a user logs in on a new device,
    this endpoint retrieves the thread_id and latest messages.
    
    Response:
    {
        "thread_id": "uuid",
        "created_at": "2025-10-22T10:30:00Z",
        "message_count": 12,
        "latest_messages": [...]
    }
    """
    from .models import ConversationThread, Message, Conversation
    
    user = request.user
    
    try:
        # Get active thread for this user
        thread = ConversationThread.objects.filter(
            user=user,
            is_active=True
        ).first()
        
        if not thread:
            return Response({
                'error': 'No active conversation thread',
                'code': 'NO_THREAD'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get associated conversation and messages
        conversation = Conversation.objects.filter(id=thread.thread_id).first()
        messages = []
        message_count = 0
        
        if conversation:
            msg_qs = Message.objects.filter(conversation=conversation).order_by('-created_at')[:10]
            message_count = Message.objects.filter(conversation=conversation).count()
            messages = [
                {
                    'role': msg.message_type,
                    'content': msg.content,
                    'timestamp': msg.created_at.isoformat()
                }
                for msg in reversed(msg_qs)
            ]
        
        return Response({
            'thread_id': thread.thread_id,
            'created_at': thread.created_at.isoformat(),
            'message_count': message_count,
            'latest_messages': messages
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching current conversation: {e}")
        return Response({'error': 'Failed to fetch conversation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_new_conversation(request):
    """
    Explicitly create a new conversation thread.
    
    This allows users to start a fresh conversation, retiring the old thread_id.
    The old thread is marked as inactive.
    
    Response:
    {
        "thread_id": "new-uuid",
        "created_at": "2025-10-22T14:00:00Z",
        "status": "active"
    }
    """
    from .models import ConversationThread
    import uuid as uuid_module
    
    user = request.user
    
    try:
        # Mark old active thread as inactive
        old_thread = ConversationThread.objects.filter(
            user=user,
            is_active=True
        ).first()
        
        if old_thread:
            old_thread.is_active = False
            old_thread.save()
        
        # Create new active thread
        new_thread_id = str(uuid_module.uuid4())
        new_thread = ConversationThread.objects.create(
            user=user,
            thread_id=new_thread_id,
            is_active=True
        )
        
        return Response({
            'thread_id': new_thread_id,
            'created_at': new_thread.created_at.isoformat(),
            'status': 'active'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating new conversation: {e}")
        return Response({'error': 'Failed to create conversation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def migrate_legacy_data(request):
    """
    Migrate legacy localStorage data to persistent backend storage.
    
    Called on app initialization if legacy data is found in localStorage.
    Ingests:
    - Conversation history (messages)
    - User preferences (language, theme)
    - Clears old data after successful migration
    
    Request:
    {
        "messages": [...],  // Array of old messages
        "language": "en",
        "theme": "dark"
    }
    
    Response:
    {
        "status": "success",
        "message": "Legacy data migrated"
    }
    """
    from .models import ConversationThread, UserProfile
    
    user = request.user
    data = request.data
    
    try:
        # Get or create active thread for user
        thread, created = ConversationThread.get_or_create_active(user)
        
        # Migrate preferences to user profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        if data.get('language'):
            profile.preferred_language = data['language']
        
        if data.get('theme') is not None:
            profile.theme_preference = 'dark' if data['theme'] else 'light'
        
        profile.save()
        
        # Note: Message history migration depends on checkpoint schema
        # For now, we just confirm preferences are migrated
        
        return Response({
            'status': 'success',
            'message': 'Legacy data migrated successfully',
            'thread_id': thread.thread_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error migrating legacy data: {e}")
        # Silently fail to allow app to continue
        return Response({
            'status': 'error',
            'message': 'Migration encountered an issue'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# SECTION: HITL (Human-in-the-Loop) Approval Gate (B.3b Implementation)
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_approvals(request):
    """
    Get pending broadcast approvals for the authenticated business user.
    Supports both legacy DemandLead and generalized Request objects.
    """
    from .models import ApproveBroadcast
    try:
        pending = ApproveBroadcast.objects.filter(status='pending')
        approvals_data = []
        for approval in pending:
            ref_id = None
            ref_type = None
            summary = ""
            if approval.demand_lead_id:
                ref_id = str(approval.demand_lead_id)
                ref_type = 'demand_lead'
                summary = f"Legacy lead {ref_id[:8]}"
            elif approval.request_fk_id:
                ref_id = str(approval.request_fk_id)
                ref_type = 'request'
                summary = f"Request {ref_id[:8]}"
            approvals_data.append({
                'id': str(approval.id),
                'ref_id': ref_id,
                'ref_type': ref_type,
                'target_seller_count': approval.target_seller_count,
                'medium': approval.medium,
                'created_at': approval.created_at.isoformat(),
                'summary': summary,
            })
        return Response({'pending_count': len(approvals_data), 'approvals': approvals_data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching pending approvals: {e}")
        return Response({'error': 'Failed to fetch approvals'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_broadcast_approval_gate(request):
    """
    Create a new broadcast approval gate for either a legacy DemandLead (demand_lead_id)
    or a generalized Request (request_id). Exactly one must be provided.
    """
    from .models import ApproveBroadcast, DemandLead, Request as GenericRequest

    data = request.data
    demand_lead_id = data.get('demand_lead_id')
    request_id = data.get('request_id')
    seller_ids = data.get('seller_ids', [])
    medium = data.get('medium', 'whatsapp')

    if bool(demand_lead_id) == bool(request_id):
        return Response({'error': 'Provide exactly one of demand_lead_id or request_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if demand_lead_id:
            lead = DemandLead.objects.get(id=demand_lead_id)
            approval = ApproveBroadcast.objects.create(
                demand_lead=lead,
                seller_ids=seller_ids,
                target_seller_count=len(seller_ids),
                medium=medium,
            )
        else:
            req = GenericRequest.objects.get(id=request_id)
            approval = ApproveBroadcast.objects.create(
                request_fk=req,
                seller_ids=seller_ids,
                target_seller_count=len(seller_ids),
                medium=medium,
            )
        logger.info(f"⏸️  Broadcast approval gate created: {approval.id}")
        return Response({
            'status': 'pending',
            'approval_id': str(approval.id),
            'message': 'Broadcast pending business user approval'
        }, status=status.HTTP_201_CREATED)
    except DemandLead.DoesNotExist:
        return Response({'error': 'Demand lead not found'}, status=status.HTTP_404_NOT_FOUND)
    except GenericRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating broadcast approval gate: {e}")
        return Response({'error': 'Failed to create approval gate'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_broadcast(request):
    """
    Approve a pending broadcast (legacy or generalized). Queues the correct broadcast task.
    """
    from .models import ApproveBroadcast

    user = request.user
    data = request.data
    approval_id = data.get('approval_id')
    notes = data.get('notes', '')

    if not approval_id:
        return Response({'error': 'approval_id required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        approval = ApproveBroadcast.objects.get(id=approval_id, status='pending')
        approval.approve(reviewer=user, notes=notes)

        # Queue appropriate broadcast task
        if approval.request_fk_id:
            rid = str(approval.request_fk_id)
            broadcast_request_for_request.delay(rid)
            ref = {'ref_type': 'request', 'ref_id': rid}
        else:
            lid = str(approval.demand_lead_id)
            broadcast_request_to_sellers.delay(lid)
            ref = {'ref_type': 'demand_lead', 'ref_id': lid}

        logger.info(f"✅ Broadcast approved by {user.username}: {approval_id}")
        return Response({
            'status': 'success',
            'message': 'Broadcast approved and queued',
            'approval_id': str(approval.id),
            **ref,
        }, status=status.HTTP_200_OK)

    except ApproveBroadcast.DoesNotExist:
        return Response({'error': 'Approval not found or already decided', 'code': 'NOT_FOUND'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error approving broadcast: {e}")
        return Response({'error': 'Failed to approve broadcast'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_broadcast(request):
    """
    Reject a pending broadcast.
    
    Business user explicitly rejects an RFQ broadcast.
    Prevents broadcast from being sent to sellers.
    
    Request:
    {
        "approval_id": "uuid",
        "reason": "Not enough detail in RFQ"
    }
    
    Response:
    {
        "status": "success",
        "message": "Broadcast rejected",
        "approval_id": "uuid"
    }
    """
    from .models import ApproveBroadcast
    
    user = request.user
    data = request.data
    approval_id = data.get('approval_id')
    reason = data.get('reason', '')
    
    if not approval_id:
        return Response({'error': 'approval_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        approval = ApproveBroadcast.objects.get(id=approval_id, status='pending')
        
        # Mark as rejected
        approval.reject(reviewer=user, notes=reason)
        
        logger.info(f"❌ Broadcast rejected by {user.username}: {approval_id} - Reason: {reason}")
        
        return Response({
            'status': 'success',
            'message': 'Broadcast rejected',
            'approval_id': str(approval.id)
        }, status=status.HTTP_200_OK)
        
    except ApproveBroadcast.DoesNotExist:
        return Response({
            'error': 'Approval not found or already decided',
            'code': 'NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error rejecting broadcast: {e}")
        return Response({'error': 'Failed to reject broadcast'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def requests_collection(request):
    if request.method == 'POST':
        serializer = RequestCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            obj = serializer.save()
            return Response(RequestSerializer(obj, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET list (own requests for now)
    qs = Request.objects.filter(created_by=request.user).order_by('-created_at')
    # Optional filters: category, status
    category = request.GET.get('category')
    if category:
        qs = qs.filter(category=category)
    status_filter = request.GET.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    # Basic pagination
    try:
        page = int(request.GET.get('page', '1'))
        limit = int(request.GET.get('limit', '20'))
    except ValueError:
        page, limit = 1, 20
    start = (page - 1) * limit
    end = start + limit + 1
    items = list(qs[start:end])
    has_next = len(items) > limit
    if has_next:
        items = items[:limit]

    data = RequestSerializer(items, many=True, context={'request': request}).data
    return Response({'results': data, 'page': page, 'limit': limit, 'has_next': has_next})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def request_detail(request, pk: str):
    try:
        obj = Request.objects.get(pk=pk)
    except Request.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only owner or staff can see full object
    if not (request.user.is_staff or obj.created_by == request.user):
        # Represent with serializer which will redact contact
        return Response(RequestSerializer(obj, context={'request': request}).data)

    return Response(RequestSerializer(obj, context={'request': request}).data)