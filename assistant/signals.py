from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from listings.models import Listing
from .tasks import index_listing_task, delete_listing_from_index
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Listing)
def on_listing_saved(sender, instance, created, **kwargs):
    """Trigger indexing when a Listing is created or updated."""
    try:
        # Queue async indexing task
        index_listing_task.delay(str(instance.id), action='create' if created else 'update')
        logger.info(f"Queued indexing for listing {instance.id}")
    except Exception as e:
        logger.error(f"Failed to queue indexing for listing {instance.id}: {e}")


@receiver(post_delete, sender=Listing)
def on_listing_deleted(sender, instance, **kwargs):
    """Trigger deletion from index when a Listing is deleted."""
    try:
        # Queue async deletion task
        delete_listing_from_index.delay(str(instance.id))
        logger.info(f"Queued deletion from index for listing {instance.id}")
    except Exception as e:
        logger.error(f"Failed to queue deletion from index for listing {instance.id}: {e}")

