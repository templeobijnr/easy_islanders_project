"""
Celery tasks for Easy Islanders.
Handles background processing for image downloads, card preparation, and notifications.
"""

from __future__ import annotations
from celery import shared_task
import requests
import time
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.db import transaction  # ISSUE-004 FIX: Import for atomic transactions
from listings.models import Listing
from .utils.notifications import put_card_display, put_auto_display
from .twilio_client import MediaProcessor
from datetime import datetime, timedelta
from django.utils import timezone as dt_timezone
# REMOVED incorrect import: from .utils.outreach import check_for_new_images, graph_run_event
from .twilio_client import TwilioWhatsAppClient
from assistant.brain.resilience import resilient_api_call

logger = logging.getLogger(__name__)


def _check_and_increment_rate_limit(conversation_id: str) -> bool:
    """
    Atomically check and increment rate limit counter.
    
    Uses Redis INCR for atomic increment, preventing race conditions.
    Returns True if within limit, False if exceeded.
    
    ISSUE-003 FIX: Replaces separate check/update with atomic operation.
    Handles both Redis and LocMem cache backends.
    """
    from django.core.cache import cache
    from django.conf import settings
    
    cache_key = f"proactive_rate_limit:{conversation_id}"
    max_messages = getattr(settings, 'MAX_PROACTIVE_MESSAGES_PER_DAY', 3)
    window_seconds = getattr(settings, 'PROACTIVE_RATE_LIMIT_WINDOW', 3600)
    
    try:
        # Atomic increment - returns new value
        new_count = cache.incr(cache_key)
        
        # Set expiry only on first increment (when count becomes 1)
        if new_count == 1:
            # Redis supports .expire(), LocMem doesn't - handle both
            if hasattr(cache, 'expire'):
                cache.expire(cache_key, window_seconds)
            else:
                # LocMem doesn't support expire after incr, use touch as fallback
                try:
                    cache.touch(cache_key, timeout=window_seconds)
                except AttributeError:
                    # If touch not available, best effort: no-op
                    pass
        
        logger.info(f"Rate limit for {conversation_id}: {new_count}/{max_messages}")
        return new_count <= max_messages
        
    except (ValueError, AttributeError):
        # Key doesn't exist yet or incr not supported - initialize it
        cache.set(cache_key, 1, timeout=window_seconds)
        logger.info(f"Rate limit initialized for {conversation_id}: 1/{max_messages}")
        return True


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_incoming_media_task(self, listing_id: int, media_urls: List[str]) -> Dict[str, Any]:
    """
    Process incoming media from WhatsApp webhook.
    Downloads and stores images, updates listing data.
    """
    try:
        logger.info(f"Processing media for listing {listing_id}: {len(media_urls)} URLs")
        
        media_processor = MediaProcessor()
        stored_urls = []
        
        for i, media_url in enumerate(media_urls):
            try:
                media_id = f"media_{int(time.time())}_{i}"
                stored_url = media_processor.download_and_store_media(media_url, listing_id, media_id)
                if stored_url:
                    media_processor._update_listing_media(listing_id, stored_url, media_id)
                    stored_urls.append(stored_url)
                    logger.info(f"Stored media {i+1}/{len(media_urls)} for listing {listing_id}")
            except Exception as e:
                logger.error(f"Failed to process media {i+1} for listing {listing_id}: {e}")
                continue
        
        if stored_urls:
            logger.info(f"Successfully processed {len(stored_urls)} media items for listing {listing_id}")
            return {
                "listing_id": listing_id,
                "stored_urls": stored_urls,
                "success": True,
                "message": f"Processed {len(stored_urls)} media items"
            }
        else:
            logger.warning(f"No media items were successfully processed for listing {listing_id}")
            return {
                "listing_id": listing_id,
                "stored_urls": [],
                "success": False,
                "message": "No media items were processed"
            }
            
    except Exception as e:
        logger.error(f"Failed to process media for listing {listing_id}: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def trigger_get_and_prepare_card_task(self, listing_id: int, conversation_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Automatically trigger GET request and prepare card display data.
    This replaces the old thread-based approach with Celery.
    """
    try:
        logger.info(f"Triggering GET and preparing card for listing {listing_id}")
        
        # Make GET request to images endpoint
        base_url = getattr(settings, 'PUBLIC_API_BASE', 'http://localhost:8000')
        url = f"{base_url}/api/listings/{listing_id}/images/"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        image_data = response.json()
        
        # Get listing details
        listing = Listing.objects.get(id=listing_id)
        sd = listing.structured_data or {}
        
        # Prepare card data
        card_data = {
            "id": listing.id,
            "title": sd.get("title") or f"Property {listing.id}",
            "price": listing.price,
            "currency": listing.currency,
            "location": listing.location,
            "bedrooms": sd.get("bedrooms"),
            "images": image_data.get("image_urls", []),
            "image_count": image_data.get("image_count", 0),
            "verified_with_photos": image_data.get("verified_with_photos", False),
            "description": sd.get("description") or "",
            "property_type": sd.get("property_type", "Property"),
            "listing_type": listing.listing_type,
        }
        
        # Store card data in Redis - use conversation_id as key if available
        display_key = conversation_id or str(listing_id)
        put_card_display(display_key, card_data, ttl_seconds=300, persistent=True)
        
        # Also store auto-display data
        auto_display_data = {
            "listing_id": listing_id,
            "conversation_id": conversation_id,
            "image_count": card_data["image_count"],
            "image_urls": card_data["images"],
            "auto_display": True,
            "images_ready": True,
            "message": f"New images received and ready for display! {card_data['image_count']} image(s) added to listing {listing_id}."
        }
        put_auto_display(display_key, auto_display_data, ttl_seconds=300)
        
        logger.info(f"Card display prepared for listing {listing_id} with {card_data['image_count']} images")
        
        return {
            "listing_id": listing_id,
            "image_count": card_data["image_count"],
            "success": True,
            "message": f"Card display prepared with {card_data['image_count']} images"
        }
        
    except Exception as e:
        logger.error(f"Failed to prepare card display for listing {listing_id}: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def send_whatsapp_message_task(self, to_number: str, message: str, media_urls: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Send WhatsApp message via Twilio (background task).
    """
    try:
        from .twilio_client import TwilioWhatsAppClient
        
        client = TwilioWhatsAppClient()
        media_url = media_urls[0] if media_urls else None
        result = client.send_message(to_number, message, media_url)
        
        logger.info(f"WhatsApp message sent to {to_number}: {result.get('success', False)}")
        return result
        
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_number}: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def cleanup_old_notifications_task(self) -> Dict[str, Any]:
    """
    Clean up old notifications from Redis (can be run periodically).
    """
    try:
        from .utils.notifications import cleanup_expired_notifications
        
        cleaned_count = cleanup_expired_notifications()
        
        logger.info(f"Cleaned up {cleaned_count} old notifications")
        return {
            "success": True,
            "cleaned_count": cleaned_count,
            "message": f"Cleaned up {cleaned_count} old notifications"
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup old notifications: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def process_webhook_media_task(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Complete webhook media processing pipeline.
    This is the main task that orchestrates the entire flow.
    """
    try:
        from_number = webhook_data.get('From', '').replace('whatsapp:', '')
        media_urls = []
        
        # Extract media URLs
        for i in range(10):
            media_url = webhook_data.get(f'MediaUrl{i}')
            if media_url:
                media_urls.append(media_url)
        
        if not media_urls:
            logger.warning(f"No media URLs found in webhook data from {from_number}")
            return {"success": False, "message": "No media URLs found"}
        
        # Find listing by contact
        from .models import ContactIndex
        listing_id = None
        
        try:
            contact_index = ContactIndex.objects.filter(
                normalized_contact__icontains=from_number
            ).order_by('-created_at').first()
            if contact_index:
                listing_id = contact_index.listing_id
        except Exception as e:
            logger.error(f"Failed to find listing for contact {from_number}: {e}")
        
        if not listing_id:
            logger.warning(f"No listing found for contact {from_number}")
            return {"success": False, "message": "No listing found for this contact"}
        
        # Process media
        media_result = process_incoming_media_task.delay(listing_id, media_urls)
        media_data = media_result.get(timeout=60)
        
        if not media_data.get("success"):
            return {"success": False, "message": "Failed to process media"}
        
        # Prepare card display
        card_result = trigger_get_and_prepare_card_task.delay(listing_id)
        card_data = card_result.get(timeout=30)
        
        logger.info(f"Webhook media processing completed for listing {listing_id}")
        
        return {
            "success": True,
            "listing_id": listing_id,
            "media_count": len(media_data.get("stored_urls", [])),
            "card_prepared": card_data.get("success", False),
            "message": f"Processed {len(media_data.get('stored_urls', []))} media items for listing {listing_id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to process webhook media: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def monitor_pending_outreaches(self) -> Dict[str, Any]:
    """
    Periodic task to monitor pending outreaches.
    Checks for responses, sends follow-ups if overdue, and updates agent state.
    """
    # Best Practice: Import dependencies locally within the task
    from ..tools import check_for_new_images
    # Graph event trigger is optional; not available in current build
    graph_run_event = None

    try:
        now = datetime.now(dt_timezone.utc)
        # Find listings where the *last* outreach entry is pending and overdue
        # This is a more complex query that might be better handled in Python
        pending_listings = Listing.objects.filter(
            structured_data__outreach__isnull=False
        ).exclude(
            structured_data__outreach=[]
        )
        
        monitored = 0
        follow_ups_sent = 0
        updates = []
        
        for listing in pending_listings:
            sd = listing.structured_data or {}
            outreach_entries = sd.get("outreach", [])
            if not isinstance(outreach_entries, list) or not outreach_entries:
                continue
            
            # Check the last outreach entry
            last_entry = outreach_entries[-1]
            if last_entry.get("status") in ["queued", "sent"]:
                follow_up_at_str = last_entry.get("follow_up_at")
                if not follow_up_at_str:
                    continue
                
                try:
                    follow_up_at = datetime.fromisoformat(follow_up_at_str).replace(tzinfo=dt_timezone.utc)
                except ValueError:
                    continue

                if now >= follow_up_at:
                    monitored += 1
                    # Check for new images/updates since the outreach was sent
                    check_result = check_for_new_images(listing.id, last_entry["at"])
                    if check_result.get("success") and check_result.get("has_new_images"):
                        # Update status to resolved
                        last_entry["status"] = "resolved_by_monitoring"
                        updates.append({
                            "listing_id": listing.id,
                            "action": "resolved",
                            "image_count": check_result.get("image_count")
                        })
                        
                        # Trigger agent event
                        conversation_id = last_entry.get("conversation_id")
                        if graph_run_event and conversation_id:
                            graph_run_event(
                                conversation_id,
                                'media_received',
                                listing_id=listing.id,
                                image_count=check_result.get("image_count")
                            )
                    else:
                        # Send follow-up
                        twilio = TwilioWhatsAppClient()
                        follow_up_text = "Hello! Just following up on my previous message about the property interest. Could you please share photos and availability?"
                        result = twilio.send_message(last_entry["to"], follow_up_text)
                        if result.get("success"):
                            last_entry["status"] = "followed_up"
                            last_entry["follow_up_at"] = (now + timedelta(hours=24)).isoformat()  # Reset for next check
                            follow_ups_sent += 1
                        else:
                            logger.warning(f"Follow-up failed for listing {listing.id}")
            
                    # Save updates to the specific listing
                    listing.structured_data = sd
                    listing.save(update_fields=["structured_data"])
        
        logger.info(f"Monitored {monitored} pending outreaches, sent {follow_ups_sent} follow-ups")
        return {
            "success": True,
            "monitored": monitored,
            "follow_ups_sent": follow_ups_sent,
            "updates": updates
        }
        
    except Exception as e:
        logger.error(f"Failed to monitor pending outreaches: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def trigger_proactive_agent_response(self, listing_id: int, conversation_id: str, image_count: int) -> Dict[str, Any]:
    """
    Automatically trigger agent response when images are received.
    This creates a proactive notification without user input.
    """
    try:
        from django.conf import settings
        from .models import UserProfile
        from .utils.notifications import put_notification
        
        logger.info(f"Triggering proactive agent response for listing {listing_id}, conversation {conversation_id}")
        
        # Check feature flags
        if not getattr(settings, 'PROACTIVE_AGENT_ENABLED', False):
            logger.info("Proactive agent disabled by feature flag")
            return {"success": False, "reason": "feature_disabled"}
            
        if not getattr(settings, 'ENABLE_PROACTIVE_PHOTOS', False):
            logger.info("Proactive photos disabled by feature flag")
            return {"success": False, "reason": "photos_disabled"}
        
        # Check user preferences
        try:
            user_profile = UserProfile.objects.get(user_id=conversation_id)
            if not user_profile.proactive_enabled or not user_profile.proactive_photos:
                logger.info(f"User {conversation_id} has proactive photos disabled")
                return {"success": False, "reason": "user_preference"}
        except UserProfile.DoesNotExist:
            # If no user profile exists, allow proactive messages (default behavior)
            pass
        
        # Check and increment rate limiting (ATOMIC - ISSUE-003 FIX)
        logger.info(f"Checking rate limit for conversation {conversation_id}")
        if not _check_and_increment_rate_limit(conversation_id):
            logger.info(f"Rate limit exceeded for conversation {conversation_id}")
            return {"success": False, "reason": "rate_limit"}
        logger.info(f"Rate limit check passed and incremented for conversation {conversation_id}")
        
        # Generate proactive response (simplified, avoids graph dependency)
        response = {
            "message": f"New images received for listing {listing_id}.",
            "recommendations": [],
        }
        
        # Create a notification for the frontend to pick up
        notification = {
            "listing_id": listing_id,
            "type": "proactive_update",
            "data": {
                "message": response["message"],
                "recommendations": response["recommendations"],
                "proactive": True,
                "image_count": image_count
            }
        }
        
        # Store notification for frontend polling to pick up (use conversation_id as key)
        put_notification(conversation_id, notification)
        
        # Note: Rate limiting already incremented in _check_and_increment_rate_limit above
        
        logger.info(f"Proactive agent response completed for listing {listing_id}")
        
        return {
            "success": True,
            "listing_id": listing_id,
            "conversation_id": conversation_id,
            "image_count": image_count,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Failed to trigger proactive agent response for listing {listing_id}: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_proactive_reminders(self) -> Dict[str, Any]:
    """
    Send proactive reminders to users based on their activity and preferences.
    This runs on a schedule (e.g., daily) and sends messages without user input.
    """
    try:
        from django.conf import settings
        from .models import UserProfile, Conversation, Message
        from .utils.notifications import put_notification
        from django.utils import timezone
        from datetime import timedelta
        
        logger.info("Starting proactive reminders task")
        
        # Check feature flags
        if not getattr(settings, 'PROACTIVE_AGENT_ENABLED', False):
            logger.info("Proactive agent disabled by feature flag")
            return {"success": False, "reason": "feature_disabled"}
            
        if not getattr(settings, 'ENABLE_PROACTIVE_REMINDERS', False):
            logger.info("Proactive reminders disabled by feature flag")
            return {"success": False, "reason": "reminders_disabled"}
        
        reminders_sent = 0
        
        # Find users who haven't interacted in 24 hours
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        for profile in UserProfile.objects.filter(
            proactive_enabled=True,
            proactive_reminders=True,
            last_interaction__lt=cutoff_time
        ):
            try:
                # Check and increment rate limiting (ATOMIC - ISSUE-003 FIX)
                if not _check_and_increment_rate_limit(profile.user_id):
                    logger.info(f"Rate limit exceeded for user {profile.user_id}")
                    continue
                
                # Generate reminder message
                reminder_message = "Hi! I noticed you haven't been active lately. I have some new property updates that might interest you. Would you like me to show you what's new?"
                
                # Create notification
                notification = {
                    "type": "proactive_reminder",
                    "data": {
                        "message": reminder_message,
                        "recommendations": [],
                        "proactive": True,
                        "reminder_type": "inactivity"
                    }
                }
                
                # Store notification
                put_notification(profile.user_id, notification)
                
                # Note: Rate limiting already incremented in _check_and_increment_rate_limit above
                
                # Save message to conversation
                try:
                    conv = Conversation.objects.get(id=profile.user_id)
                    Message.objects.create(
                        conversation=conv,
                        content=reminder_message,
                        message_context={
                            "intent_type": "proactive_reminder",
                            "proactive": True,
                            "reminder_type": "inactivity"
                        }
                    )
                except Conversation.DoesNotExist:
                    # Create conversation if it doesn't exist
                    conv = Conversation.objects.create(id=profile.user_id)
                    Message.objects.create(
                        conversation=conv,
                        content=reminder_message,
                        message_context={
                            "intent_type": "proactive_reminder",
                            "proactive": True,
                            "reminder_type": "inactivity"
                        }
                    )
                
                reminders_sent += 1
                logger.info(f"Sent proactive reminder to user {profile.user_id}")
                
            except Exception as e:
                logger.error(f"Failed to send reminder to user {profile.user_id}: {e}")
                continue
        
        logger.info(f"Proactive reminders completed: {reminders_sent} sent")
        return {
            "success": True,
            "reminders_sent": reminders_sent
        }
        
    except Exception as e:
        logger.error(f"Failed to send proactive reminders: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_market_updates(self) -> Dict[str, Any]:
    """
    Send proactive market updates and trends to interested users.
    This runs weekly and provides valuable market insights.
    """
    try:
        from django.conf import settings
        from .models import UserProfile
        from .utils.notifications import put_notification
        
        logger.info("Starting market updates task")
        
        # Check feature flags
        if not getattr(settings, 'PROACTIVE_AGENT_ENABLED', False):
            return {"success": False, "reason": "feature_disabled"}
            
        if not getattr(settings, 'ENABLE_PROACTIVE_PREDICTIONS', False):
            return {"success": False, "reason": "predictions_disabled"}
        
        updates_sent = 0
        
        # Find users interested in market updates
        for profile in UserProfile.objects.filter(
            proactive_enabled=True,
            proactive_predictions=True
        ):
            try:
                # Check and increment rate limiting (ATOMIC - ISSUE-003 FIX)
                if not _check_and_increment_rate_limit(profile.user_id):
                    continue
                
                # Generate market update message
                market_message = "📊 Market Update: Property prices in Kyrenia have increased by 5% this week. I found 3 new properties that match your criteria. Would you like me to show you?"
                
                # Create notification
                notification = {
                    "type": "proactive_market_update",
                    "data": {
                        "message": market_message,
                        "recommendations": [],
                        "proactive": True,
                        "update_type": "market_trends"
                    }
                }
                
                # Store notification
                put_notification(profile.user_id, notification)
                
                # Note: Rate limiting already incremented in _check_and_increment_rate_limit above
                
                updates_sent += 1
                logger.info(f"Sent market update to user {profile.user_id}")
                
            except Exception as e:
                logger.error(f"Failed to send market update to user {profile.user_id}: {e}")
                continue
        
        logger.info(f"Market updates completed: {updates_sent} sent")
        return {
            "success": True,
            "updates_sent": updates_sent
        }
        
    except Exception as e:
        logger.error(f"Failed to send market updates: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
@resilient_api_call(
    "seller_outreach",
    max_retries=3,
    initial_retry_delay_seconds=2,
    max_retry_delay_seconds=8,
)
def broadcast_request_to_sellers(self, request_id: str) -> Dict[str, Any]:
    """
    Stub: Broadcast a DemandLead to candidate sellers.
    Creates zero or more AgentBroadcast records (to be implemented fully later).
    """
    from .models import DemandLead, AgentBroadcast
    from listings.models import Listing, Category
    from users.models import BusinessProfile
    try:
        lead = DemandLead.objects.get(id=request_id)
    except DemandLead.DoesNotExist:
        return {"success": False, "error": "lead_not_found", "request_id": request_id}

    extracted = lead.extracted_criteria or {}
    target_listing_id = (
        extracted.get('target_listing_id')
        or extracted.get('listing_id')
        or extracted.get('target')
    )

    candidates = []
    seller_source_used = None

    # 1) Prefer listing owner if a specific listing is provided
    listing = None
    if target_listing_id:
        try:
            listing = Listing.objects.get(id=target_listing_id)
            if listing.owner_id:
                candidates.append({
                    'seller_id': str(listing.owner_id),
                    'source': 'listing_owner',
                    'medium': 'whatsapp',
                })
                seller_source_used = 'listing_owner'
        except Exception:
            listing = None

    # 2) Fallback to providers by category/location if no owner candidate
    if not candidates:
        # Resolve category from lead.category (may be slug or name)
        category_obj = None
        if lead.category:
            try:
                category_obj = Category.objects.filter(slug__iexact=lead.category).first() or \
                               Category.objects.filter(name__iexact=lead.category).first()
            except Exception:
                category_obj = None

        qs = BusinessProfile.objects.all()
        if category_obj:
            qs = qs.filter(category=category_obj)
        if lead.location:
            qs = qs.filter(location__icontains=lead.location)

        qs = qs.order_by('-is_verified_by_admin', 'business_name')[:10]
        for bp in qs:
            candidates.append({
                'seller_id': str(bp.user_id),
                'source': 'service_provider',
                'medium': 'whatsapp',
            })
        seller_source_used = 'service_provider' if candidates else None

    # ISSUE-004 FIX: Wrap broadcast creation in atomic transaction
    # Track failures and raise if >50% fail
    enqueued = 0
    failed = 0
    contacted_log = []
    failed_sellers = []
    
    with transaction.atomic():
        for c in candidates:
            try:
                AgentBroadcast.objects.create(
                    request=lead,
                    seller_id=c['seller_id'],
                    medium=c.get('medium', 'whatsapp'),
                    status='queued',
                )
                contacted_log.append({
                    'seller_id': c['seller_id'],
                    'medium': c.get('medium', 'whatsapp'),
                    'status': 'queued',
                    'source': c.get('source', 'unknown'),
                })
                enqueued += 1
            except Exception as e:
                failed += 1
                failed_sellers.append({
                    'seller_id': c['seller_id'],
                    'error': str(e),
                })
                logger.error(f"Failed to log AgentBroadcast for lead {lead.id}, seller {c['seller_id']}: {e}")
                continue
        
        # Check failure rate - rollback if >50% failed
        total = enqueued + failed
        if total > 0:
            failure_rate = failed / total
            if failure_rate > 0.5:
                logger.error(
                    f"Broadcast failure rate ({failure_rate:.1%}) exceeds 50% threshold. "
                    f"Enqueued: {enqueued}, Failed: {failed}. Rolling back transaction."
                )
                raise Exception(f"Broadcast failed for {failed}/{total} sellers (>{50}% threshold)")
        
        # Update lead with contacted sellers
        if contacted_log:
            try:
                existing = lead.sellers_contacted or []
                if not isinstance(existing, list):
                    existing = []
                existing.extend(contacted_log)
                lead.sellers_contacted = existing
                lead.save(update_fields=['sellers_contacted'])
            except Exception as e:
                logger.warning(f"Failed updating sellers_contacted for lead {lead.id}: {e}")
                raise  # Re-raise to trigger rollback

    # Log failure rate for metrics
    total = enqueued + failed
    failure_rate = failed / total if total > 0 else 0
    logger.info(
        f"Broadcast completed for lead {lead.id}: "
        f"{enqueued} enqueued, {failed} failed ({failure_rate:.1%} failure rate), "
        f"source={seller_source_used}"
    )
    
    summary = {
        "success": True,
        "request_id": str(lead.id),
        "sellers_enqueued": enqueued,
        "sellers_failed": failed,
        "failure_rate": failure_rate,
        "failed_sellers": failed_sellers,
        "seller_source_used": seller_source_used or 'none',
    }
    return summary

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def broadcast_request_for_request(self, request_id: str) -> Dict[str, Any]:
    """
    Broadcast a generalized Request to candidate sellers (business users) based on category/location.
    Creates AgentBroadcastV2 audit entries and queues external outreach (future work).
    """
    from .models import Request as GenericRequest, AgentBroadcastV2
    from users.models import BusinessProfile
    try:
        req = GenericRequest.objects.get(id=request_id)
    except GenericRequest.DoesNotExist:
        return {"success": False, "error": "request_not_found", "request_id": request_id}

    candidates = []
    # Select business profiles matching category and location (MVP)
    qs = BusinessProfile.objects.all()
    try:
        if req.category:
            qs = qs.filter(category__slug__iexact=req.category) | qs.filter(category__name__iexact=req.category)
    except Exception:
        # If schema differs, fallback to basic filter by name
        qs = qs
    if req.location:
        qs = qs.filter(location__icontains=req.location)
    qs = qs.order_by('-is_verified_by_admin', 'business_name')[:10]

    for bp in qs:
        candidates.append({
            'seller_id': str(bp.user_id),
            'medium': 'whatsapp',
            'source': 'service_provider',
        })

    enqueued = 0
    for c in candidates:
        try:
            AgentBroadcastV2.objects.create(
                request=req,
                seller_id=c['seller_id'],
                medium=c.get('medium', 'whatsapp'),
                status='queued',
            )
            enqueued += 1
        except Exception as e:
            logger.error(f"Failed to log AgentBroadcastV2 for request {req.id}: {e}")
            continue

    # Update status to broadcasted if any enqueued
    if enqueued > 0 and req.status != 'broadcasted':
        try:
            req.status = 'broadcasted'
            req.save(update_fields=['status'])
        except Exception:
            pass

    summary = {
        "success": True,
        "request_id": str(req.id),
        "sellers_enqueued": enqueued,
        "category": req.category,
    }
    logger.info(f"BroadcastV2 executed for request {req.id}: {enqueued} sellers")
    return summary


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def monitor_new_media_and_trigger_proactive(self) -> Dict[str, Any]:
    """
    Monitor for new media in listings and trigger proactive responses.
    This task runs periodically to catch any media that might have been missed.
    """
    try:
        from django.conf import settings
        from .models import Conversation
        from listings.models import Listing
        from django.utils import timezone
        from datetime import timedelta
        
        logger.info("Starting new media monitoring task")
        
        # Check feature flags
        if not getattr(settings, 'PROACTIVE_AGENT_ENABLED', False):
            logger.info("Proactive agent disabled by feature flag")
            return {"success": False, "reason": "feature_disabled"}
            
        if not getattr(settings, 'ENABLE_PROACTIVE_PHOTOS', False):
            logger.info("Proactive photos disabled by feature flag")
            return {"success": False, "reason": "photos_disabled"}
        
        proactive_responses_triggered = 0
        
        # Find listings that have been updated with new media in the last hour
        cutoff_time = timezone.now() - timedelta(hours=1)
        
        recent_listings = Listing.objects.filter(
            last_seen_at__gte=cutoff_time,
            has_image=True,
            is_active=True
        ).order_by('-last_seen_at')
        
        logger.info(f"Found {recent_listings.count()} recent listings with media")
        
        for listing in recent_listings:
            try:
                # Check if we've already sent a proactive response for this listing recently
                cache_key = f"proactive_sent:{listing.id}"
                from django.core.cache import cache
                
                if cache.get(cache_key):
                    logger.info(f"Proactive response already sent for listing {listing.id}")
                    continue
                
                # Count images for this listing
                image_count = len(listing.image_urls) if listing.image_urls else 0
                
                if image_count == 0:
                    continue
                
                # Find or create conversation for this listing
                conversation_id = None
                
                # Try to find existing conversation
                conv = Conversation.objects.filter(
                    conversation_id__contains=str(listing.id)
                ).first()
                
                if not conv:
                    # Create new conversation
                    conv = Conversation.objects.create(
                        conversation_id=f"listing_{listing.id}_{int(time.time())}"
                    )
                    logger.info(f"Created conversation {conv.conversation_id} for listing {listing.id}")
                
                conversation_id = conv.conversation_id
                
                # Check and increment rate limiting (ATOMIC - ISSUE-003 FIX)
                if not _check_and_increment_rate_limit(conversation_id):
                    logger.info(f"Rate limit exceeded for conversation {conversation_id}")
                    continue
                
                # Trigger proactive response
                result = trigger_proactive_agent_response(
                    listing_id=listing.id,
                    conversation_id=conversation_id,
                    image_count=image_count
                )
                
                if result.get("success"):
                    # Mark as sent to avoid duplicates
                    cache.set(cache_key, True, timeout=3600)  # 1 hour
                    # Note: Rate limiting already incremented in _check_and_increment_rate_limit above
                    proactive_responses_triggered += 1
                    logger.info(f"Triggered proactive response for listing {listing.id}")
                else:
                    logger.warning(f"Failed to trigger proactive response for listing {listing.id}: {result.get('reason')}")
                
            except Exception as e:
                logger.error(f"Failed to process listing {listing.id}: {e}")
                continue
        
        logger.info(f"Media monitoring completed: {proactive_responses_triggered} proactive responses triggered")
        return {
            "success": True,
            "proactive_responses_triggered": proactive_responses_triggered,
            "listings_checked": recent_listings.count()
        }
        
    except Exception as e:
        logger.error(f"Failed to monitor new media: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def index_listing_task(self, listing_id: str, action: str = 'create') -> Dict[str, Any]:
    """
    Asynchronously index a listing into ChromaDB with metadata.
    Uses local sentence-transformers for embeddings (Phase A).
    """
    from listings.models import Listing
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.vectorstores import Chroma
    from langchain.schema import Document
    import json
    
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        logger.warning(f"Listing {listing_id} not found for indexing")
        return {"success": False, "error": "listing_not_found", "listing_id": listing_id}
    
    try:
        # Build content: title + description + dynamic_fields (stringified)
        title = listing.title or f"Listing {listing_id}"
        description = listing.description or ""
        dynamic_fields_str = json.dumps(listing.dynamic_fields or {}, ensure_ascii=False)
        content = f"{title}\n\n{description}\n\nDetails: {dynamic_fields_str}"
        
        # Create metadata dict
        metadata = {
            "listing_pk": str(listing.id),
            "owner_id": str(listing.owner_id) if listing.owner_id else "",
            "category": listing.category.slug if listing.category else "",
            "location": listing.location or "",
            "price": str(listing.price or ""),
            "currency": listing.currency or "",
            "status": listing.status,
            "created_at": listing.created_at.isoformat(),
            "updated_at": listing.updated_at.isoformat(),
        }
        
        # Create Document
        doc = Document(page_content=content, metadata=metadata)
        
        # Split text
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents([doc])
        
        # ISSUE-011 FIX: Use configured path instead of hardcoded /tmp
        from django.conf import settings
        import os
        
        # Get persist directory from settings or use default in BASE_DIR
        persist_dir = getattr(
            settings, 
            'CHROMA_PERSIST_DIR', 
            os.path.join(settings.BASE_DIR, 'data', 'chroma_db')
        )
        
        # Ensure directory exists
        os.makedirs(persist_dir, exist_ok=True)
        
        # Embed and store in ChromaDB (SQLite backend)
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(
            collection_name="listings",
            embedding_function=embeddings,
            persist_directory=persist_dir  # Use configured path
        )
        
        # Upsert chunks (using listing_id + chunk index as unique ID)
        ids = [f"listing_{listing_id}_chunk_{i}" for i in range(len(chunks))]
        db.add_documents(chunks, ids=ids)
        
        logger.info(f"Indexed listing {listing_id}: {len(chunks)} chunks")
        return {
            "success": True,
            "listing_id": str(listing.id),
            "chunks_indexed": len(chunks),
            "action": action,
        }
        
    except Exception as e:
        logger.error(f"Failed to index listing {listing_id}: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def delete_listing_from_index(self, listing_id: str) -> Dict[str, Any]:
    """
    Asynchronously delete a listing from ChromaDB.
    """
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.vectorstores import Chroma

    try:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = Chroma(
            collection_name="listings",
            embedding_function=embeddings,
            persist_directory="/tmp/chroma_db"
        )

        # Delete all chunks for this listing
        ids = [f"listing_{listing_id}_chunk_{i}" for i in range(10)]  # Safe upper bound
        db.delete(ids=ids)

        logger.info(f"Deleted listing {listing_id} from index")
        return {
            "success": True,
            "listing_id": listing_id,
        }

    except Exception as e:
        logger.error(f"Failed to delete listing {listing_id} from index: {e}")
        raise


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def update_calibration_params() -> Dict[str, Any]:
    """
    Periodic task to update router calibration parameters using recent router events.
    This task runs nightly to retrain the calibration models and update parameters.
    """
    try:
        from router_service.calibration import retrain_calibration_models, get_calibration_metrics

        logger.info("Starting periodic calibration parameter update")

        # Retrain models using recent router events
        training_results = retrain_calibration_models()

        if not training_results:
            logger.info("No calibration models were updated (insufficient data)")
            return {
                "success": True,
                "message": "No models updated - insufficient training data",
                "models_updated": 0
            }

        # Get updated metrics
        metrics = get_calibration_metrics()

        logger.info(f"Successfully updated calibration for {len(training_results)} domains")

        return {
            "success": True,
            "models_updated": len(training_results),
            "domains": list(training_results.keys()),
            "metrics": metrics,
            "message": f"Updated calibration parameters for {len(training_results)} domains"
        }

    except Exception as e:
        logger.error(f"Failed to update calibration parameters: {e}")
        raise