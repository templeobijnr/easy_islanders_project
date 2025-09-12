"""
Twilio WhatsApp Business API Client for Easy Islanders.
Handles automated outreach and media webhook processing.
"""

import os
import logging
import requests
from typing import Dict, List, Optional
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import uuid

logger = logging.getLogger(__name__)


class TwilioWhatsAppClient:
    """Twilio WhatsApp Business API client for automated outreach."""
    
    def __init__(self):
        # Prefer Django settings, but fall back to environment variables if not defined
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None) or os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None) or os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_from = getattr(settings, 'TWILIO_WHATSAPP_FROM', None) or os.getenv('TWILIO_WHATSAPP_FROM')
        self.api_base = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}"
        
        if not all([self.account_sid, self.auth_token, self.whatsapp_from]):
            logger.warning("Twilio credentials not configured. Outreach will be logged but not sent.")
    
    def _normalize_phone(self, number: str) -> str:
        if isinstance(number, dict):
            logger.info(f"Normalizing dict contact: {number}")
            number = number.get('whatsapp') or number.get('phone') or number.get('contact_number') or list(number.values())[0] if number else ''
        if not number:
            return number
        n = number.strip()
        # Remove leading 'whatsapp:' if present; we'll add it later
        if n.startswith('whatsapp:'):
            n = n[len('whatsapp:'):]
        # Remove spaces/dashes
        n = ''.join(ch for ch in n if ch.isdigit() or ch == '+')
        # Ensure leading '+' for E.164
        if not n.startswith('+') and n and n[0].isdigit():
            n = '+' + n
        return n

    def send_message(self, to_number: str, message: str, media_url: Optional[str] = None) -> Dict:
        """
        Send WhatsApp message via Twilio.
        
        Args:
            to_number: Recipient phone number (with country code)
            message: Text message to send
            media_url: Optional media URL to attach
            
        Returns:
            Dict with success status and message SID
        """
        if not all([self.account_sid, self.auth_token, self.whatsapp_from]):
            logger.info(f"[Twilio Stub] Would send to {to_number}: {message[:50]}... (media: {bool(media_url)})")
            return {"success": True, "message_sid": f"stub_{uuid.uuid4()}", "status": "stubbed"}
        
        try:
            # Normalize numbers
            to_number = self._normalize_phone(to_number)
            from_number = self.whatsapp_from if self.whatsapp_from else None

            # Format phone number for WhatsApp
            if to_number and not to_number.startswith('whatsapp:'):
                to_number = f"whatsapp:{to_number}"
            if from_number and not from_number.startswith('whatsapp:'):
                from_number = f"whatsapp:{from_number}"
            
            # Prepare payload
            payload = {
                "To": to_number,
                "From": from_number or self.whatsapp_from,
                "Body": message,
            }
            
            if media_url:
                payload["MediaUrl"] = media_url
            
            logger.info(f"Sending Twilio message to {to_number}: {message[:50]}... (media: {bool(media_url)})")
            
            # Send via Twilio API
            response = requests.post(
                f"{self.api_base}/Messages.json",
                auth=(self.account_sid, self.auth_token),
                data=payload
            )
            
            if response.status_code == 201:
                data = response.json()
                logger.info(f"Twilio message sent successfully: SID={data.get('sid')}, Status={data.get('status')}")
                return {
                    "success": True,
                    "message_sid": data.get('sid'),
                    "status": data.get('status'),
                    "twilio_response": data
                }
            else:
                logger.error(f"Twilio API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Twilio API error: {response.status_code}",
                    "response": response.text
                }
                
        except Exception as e:
            logger.exception(f"Failed to send Twilio message to {to_number}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_outreach_message(self, listing_id: int, contact_number: str, language: str = "en") -> Dict:
        """
        Send automated outreach message for a listing.
        
        Args:
            listing_id: Internal listing ID
            contact_number: Seller's contact number
            language: Message language (en, ru, pl, de, tr)
            
        Returns:
            Dict with outreach result
        """
        # Multilingual outreach messages
        messages = {
            "en": "Hello! This is Easy Islanders. A client is interested in your property. Could you please share a few photos and confirm availability? Thank you!",
            "ru": "Привет! Это Easy Islanders. Клиент заинтересован в вашей недвижимости. Не могли бы вы поделиться несколькими фотографиями и подтвердить доступность? Спасибо!",
            "pl": "Cześć! To Easy Islanders. Klient jest zainteresowany Twoją nieruchomością. Czy mógłbyś udostępnić kilka zdjęć i potwierdzić dostępność? Dziękuję!",
            "de": "Hallo! Das ist Easy Islanders. Ein Kunde ist an Ihrer Immobilie interessiert. Könnten Sie bitte einige Fotos teilen und die Verfügbarkeit bestätigen? Vielen Dank!",
            "tr": "Merhaba! Bu Easy Islanders. Bir müşteri mülkünüzle ilgileniyor. Birkaç fotoğraf paylaşabilir ve müsaitliği onaylayabilir misiniz? Teşekkürler!"
        }
        
        message = messages.get(language, messages["en"])
        
        # Send the message
        result = self.send_message(contact_number, message)
        
        if result["success"]:
            logger.info(f"Outreach message sent for Listing #{listing_id} to {contact_number}")
        else:
            logger.error(f"Failed to send outreach for Listing #{listing_id}: {result.get('error')}")
        
        return result


def send_whatsapp_message(to: str, message: str, media_url: Optional[str] = None) -> Dict:
    """Convenience function used by views/tasks to send a WhatsApp message.

    Wraps TwilioWhatsAppClient.send_message. Accepts a single optional media URL.
    """
    try:
        client = TwilioWhatsAppClient()
        return client.send_message(to, message, media_url)
    except Exception as e:
        logger.exception("send_whatsapp_message failed")
        return {"success": False, "error": str(e)}


class MediaProcessor:
    """Handles media processing from Twilio webhooks."""
    
    def __init__(self):
        self.s3_bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        self.cdn_domain = getattr(settings, 'CDN_DOMAIN', None)
    
    def download_and_store_media(self, media_url: str, listing_id: int, media_id: str) -> Optional[str]:
        """
        Download media from Twilio and store to S3/CDN.
        
        Args:
            media_url: Twilio media URL
            listing_id: Internal listing ID
            media_id: Twilio media ID
            
        Returns:
            Permanent CDN URL or None if failed
        """
        import time
        retries = 3
        backoff = 1
        for attempt in range(retries):
            try:
                logger.info(f"Starting media download (attempt {attempt+1}): {media_url} for listing {listing_id}")
                # Download media from Twilio
                # Some Twilio media URLs require basic auth
                auth = None
                sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None) or os.getenv('TWILIO_ACCOUNT_SID')
                token = getattr(settings, 'TWILIO_AUTH_TOKEN', None) or os.getenv('TWILIO_AUTH_TOKEN')
                if media_url.startswith('https://api.twilio.com') and sid and token:
                    auth = (sid, token)
                response = requests.get(media_url, timeout=30, auth=auth)
                response.raise_for_status()
                
                # Determine file extension from content type
                content_type = response.headers.get('content-type', '')
                if 'image/jpeg' in content_type:
                    ext = '.jpg'
                elif 'image/png' in content_type:
                    ext = '.png'
                elif 'image/webp' in content_type:
                    ext = '.webp'
                else:
                    ext = '.jpg'  # Default fallback
                
                # Generate unique filename (just the filename, not the full path)
                filename = f"{media_id}{ext}"
                
                # Ensure directory exists
                storage_path = os.path.join(settings.MEDIA_ROOT, 'listings', str(listing_id), 'media')
                os.makedirs(storage_path, exist_ok=True)
                
                # Save the file
                file_path = os.path.join(storage_path, filename)
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                    
                # Generate the permanent API URL (correct path)
                permanent_url = f"/api/listings/{listing_id}/media/{filename}"
                    
                logger.critical(f"IMAGE SAVED: Successfully stored media for listing {listing_id}.")
                logger.critical(f"  - Local Path: {file_path}")
                logger.critical(f"  - Final API URL: {permanent_url}")

                # Update the listing model with the new media URL
                self._update_listing_media(listing_id, permanent_url, media_id)
                
                return permanent_url
                
            except Exception as e:
                logger.warning(f"Media download failed (attempt {attempt+1}): {e}")
                if attempt < retries - 1:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    logger.exception(f"Failed to process media {media_url} after {retries} attempts")
                    return None
    
    def process_twilio_media_webhook(self, webhook_data: Dict) -> Dict:
        """
        Process incoming Twilio media webhook.
        
        Args:
            webhook_data: Raw webhook data from Twilio
            
        Returns:
            Dict with processing result
        """
        try:
            # Extract media information
            media_url = webhook_data.get('MediaUrl0')
            media_id = webhook_data.get('MessageSid')
            from_number = webhook_data.get('From', '').replace('whatsapp:', '')
            
            if not media_url or not media_id:
                return {"success": False, "error": "Missing media information"}
            
            # TODO: Look up listing by from_number to get listing_id
            # For now, we'll need to implement this lookup logic
            listing_id = self._find_listing_by_contact(from_number)
            
            if not listing_id:
                return {"success": False, "error": "No listing found for this contact"}
            
            # Download and store media
            permanent_url = self.download_and_store_media(media_url, listing_id, media_id)
            
            if permanent_url:
                # Update listing with new media
                self._update_listing_media(listing_id, permanent_url, media_id)
                
                return {
                    "success": True,
                    "listing_id": listing_id,
                    "media_url": permanent_url,
                    "media_id": media_id
                }
            else:
                return {"success": False, "error": "Failed to process media"}
                
        except Exception as e:
            logger.exception("Failed to process Twilio media webhook")
            return {"success": False, "error": str(e)}
    
    def _find_listing_by_contact(self, contact_number: str) -> Optional[int]:
        """Find listing ID by contact number."""
        from assistant.models import Listing
        
        try:
            # Clean the contact number (remove whatsapp: prefix and any formatting)
            clean_number = contact_number.replace('whatsapp:', '').replace('+', '').strip()
            
            # Search in structured_data.contact_info with multiple formats
            listing = None
            
            # Try exact match first
            listing = Listing.objects.filter(
                is_active=True,
                structured_data__contact_info__whatsapp__icontains=clean_number
            ).first()
            
            if not listing:
                # Try with + prefix
                listing = Listing.objects.filter(
                    is_active=True,
                    structured_data__contact_info__whatsapp__icontains=f"+{clean_number}"
                ).first()
            
            if not listing:
                # Try phone field
                listing = Listing.objects.filter(
                    is_active=True,
                    structured_data__contact_info__phone__icontains=clean_number
                ).first()
            
            if not listing:
                # Try contact_number field
                listing = Listing.objects.filter(
                    is_active=True,
                    structured_data__contact_info__contact_number__icontains=clean_number
                ).first()
            
            if listing:
                logger.info(f"Found listing {listing.id} for contact {contact_number}")
                return listing.id
            else:
                logger.warning(f"No listing found for contact {contact_number}")
                return None
            
        except Exception as e:
            logger.exception(f"Failed to find listing for contact {contact_number}")
            return None
    
    def _update_listing_media(self, listing_id: int, media_url: str, media_id: str):
        """Update listing with new media."""
        from assistant.models import Listing
        
        try:
            listing = Listing.objects.get(id=listing_id)
            sd = listing.structured_data or {}
            
            # Initialize media arrays if they don't exist
            if 'media' not in sd:
                sd['media'] = []
            if 'image_urls' not in sd:
                sd['image_urls'] = []
            if 'processed_media_ids' not in sd:
                sd['processed_media_ids'] = []
            
            # Idempotency: skip if this media_id already recorded
            try:
                if any((isinstance(m, dict) and m.get('twilio_media_id') == media_id) for m in sd.get('media', [])):
                    logger.info(f"Skipping duplicate media {media_id} for listing {listing_id}")
                    return
            except Exception:
                pass

            # Additional idempotency check via processed_media_ids
            try: 
                if media_id in sd.get('processed_media_ids', []):
                    logger.info(f"Media {media_id} already processed for listing {listing_id}")
                    return  # Comment this out or remove to not skip
            except Exception:
                pass

            # Add new media
            media_entry = {
                "url": media_url,
                "twilio_media_id": media_id,
                "added_at": timezone.now().isoformat(),
                "type": "photo"
            }
            
            sd['media'].append(media_entry)
            sd['image_urls'].append(media_url)
            try:
                sd['processed_media_ids'].append(media_id)
            except Exception:
                pass
            
            # Mark as verified with photos
            sd['verified_with_photos'] = True
            sd['last_photo_update'] = timezone.now().isoformat()
            
            listing.structured_data = sd
            # Also update the model's image_urls field to sync with structured_data
            listing.image_urls = sd.get('image_urls', [])
            listing.save(update_fields=['structured_data', 'image_urls'])
            
            # NEW: On receipt
            listing.photos_requested = False  # Reset if fulfilled
            listing.verified_with_photos = True
            listing.save(update_fields=['photos_requested', 'structured_data'])

            logger.info(f"Updated listing {listing_id}: images={len(sd['image_urls'])}, verified={sd['verified_with_photos']}")
            logger.info(f"Photos received for {listing_id}: {len(sd['image_urls'])} images, notifying...")
            
        except Exception as e:
            logger.exception(f"Failed to update listing {listing_id} with media")
