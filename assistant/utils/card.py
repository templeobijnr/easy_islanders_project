"""
Card display utilities to avoid Celery task chaining issues.
"""

import logging
import requests
from typing import Dict, Any, Optional
from django.conf import settings
from listings.models import Listing

logger = logging.getLogger(__name__)

def prepare_card_display_data(listing_id: int, conversation_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Prepare card display data for a listing.
    
    Args:
        listing_id: ID of the listing to prepare card for
        conversation_id: Optional conversation ID for context
        
    Returns:
        Dictionary with card data and success status
    """
    try:
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
        from assistant.utils.notifications import put_card_display
        display_key = conversation_id or str(listing_id)
        put_card_display(display_key, card_data, ttl_seconds=300, persistent=True)
        
        # Also store auto-display data
        from assistant.utils.notifications import put_auto_display
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
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch images for listing {listing_id}: {e}")
        return {
            "listing_id": listing_id,
            "image_count": 0,
            "success": False,
            "message": f"Failed to fetch images: {e}"
        }
    except Listing.DoesNotExist:
        logger.error(f"Listing {listing_id} not found for card preparation")
        return {
            "listing_id": listing_id,
            "image_count": 0,
            "success": False,
            "message": "Listing not found"
        }
    except Exception as e:
        logger.error(f"Failed to prepare card display for listing {listing_id}: {e}")
        return {
            "listing_id": listing_id,
            "image_count": 0,
            "success": False,
            "message": f"Card preparation failed: {e}"
        }