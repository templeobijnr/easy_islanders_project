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
from .models import Listing
from .utils.notifications import put_card_display, put_auto_display
from .twilio_client import MediaProcessor

logger = logging.getLogger(__name__)


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
