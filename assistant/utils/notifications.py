"""
Redis-based notification system for Easy Islanders.
Replaces the in-memory _notification_store with Redis for production scalability.
"""

import json
import time
from typing import Dict, Any, Optional
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def put_card_display(key: str, card_data: Dict[str, Any], ttl_seconds: int = 300, persistent: bool = True) -> None:
    """Store card display data in Redis."""
    try:
        cache_key = f"card_display:{key}"
        value = {
            "card_data": card_data,
            "persistent": persistent,
            "timestamp": time.time(),
            "type": "card_display"
        }
        cache.set(cache_key, json.dumps(value), ttl_seconds)
        logger.info(f"Card display stored for key {key}")
    except Exception as e:
        logger.error(f"Failed to store card display for key {key}: {e}")


def get_card_display(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve card display data from Redis."""
    try:
        cache_key = f"card_display:{key}"
        raw_data = cache.get(cache_key)
        if raw_data:
            data = json.loads(raw_data)
            # Check if persistent and not expired
            if data.get("persistent", False):
                current_time = time.time()
                timestamp = data.get("timestamp", 0)
                if current_time - timestamp > 300:  # 5 minutes
                    cache.delete(cache_key)
                    return None
            return data
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve card display for key {key}: {e}")
        return None


def pop_card_display(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve and delete card display data from Redis."""
    try:
        cache_key = f"card_display:{key}"
        raw_data = cache.get(cache_key)
        if raw_data:
            cache.delete(cache_key)
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to pop card display for key {key}: {e}")
        return None


def put_auto_display(key: str, response_data: Dict[str, Any], ttl_seconds: int = 300) -> None:
    """Store auto-display data in Redis."""
    try:
        cache_key = f"auto_display:{key}"
        value = {
            "response_data": response_data,
            "timestamp": time.time(),
            "type": "auto_display_images"
        }
        cache.set(cache_key, json.dumps(value), ttl_seconds)
        logger.info(f"Auto-display data stored for key {key}")
    except Exception as e:
        logger.error(f"Failed to store auto-display data for key {key}: {e}")


def get_auto_display(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve auto-display data from Redis without deleting it."""
    try:
        cache_key = f"auto_display:{key}"
        raw_data = cache.get(cache_key)
        if raw_data:
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to get auto-display data for key {key}: {e}")
        return None


def pop_auto_display(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve and delete auto-display data from Redis."""
    try:
        cache_key = f"auto_display:{key}"
        raw_data = cache.get(cache_key)
        if raw_data:
            cache.delete(cache_key)
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to pop auto-display data for key {key}: {e}")
        return None


def put_notification(key: str, notification_data: Dict[str, Any], ttl_seconds: int = 300) -> None:
    """Store general notification data in Redis."""
    try:
        cache_key = f"notification:{key}"
        value = {
            **notification_data,
            "timestamp": time.time()
        }
        cache.set(cache_key, json.dumps(value), ttl_seconds)
        logger.info(f"Notification stored for key {key}")
    except Exception as e:
        logger.error(f"Failed to store notification for key {key}: {e}")


def get_notification(key: str) -> Optional[Dict[str, Any]]:
    """Retrieve and delete notification data from Redis."""
    try:
        cache_key = f"notification:{key}"
        raw_data = cache.get(cache_key)
        if raw_data:
            cache.delete(cache_key)
            return json.loads(raw_data)
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve notification for key {key}: {e}")
        return None


def cleanup_expired_notifications() -> int:
    """Clean up expired notifications (can be run as a periodic task)."""
    try:
        # Redis TTL handles expiration automatically
        # This function is for manual cleanup if needed
        logger.info("Notification cleanup completed")
        return 0
    except Exception as e:
        logger.error(f"Failed to cleanup notifications: {e}")
        return 0
